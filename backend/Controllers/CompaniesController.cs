using JrvImpact.Api.Data;
using JrvImpact.Api.Dtos;
using JrvImpact.Api.Models;
using JrvImpact.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JrvImpact.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/companies")]
public class CompaniesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICodeGeneratorService _codes;

    public CompaniesController(AppDbContext db, ICodeGeneratorService codes)
    {
        _db = db;
        _codes = codes;
    }

    [HttpGet]
    public async Task<ActionResult<List<CompanyDto>>> GetAll([FromQuery] string? search)
    {
        var query = _db.Companies.Include(c => c.Contacts).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.ToLower().Contains(search.ToLower()) || c.Code.ToLower().Contains(search.ToLower()));

        var companies = await query.OrderBy(c => c.Id).ToListAsync();
        return Ok(companies.Select(ToDto).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CompanyDto>> GetById(int id)
    {
        var company = await _db.Companies.Include(c => c.Contacts).FirstOrDefaultAsync(c => c.Id == id);
        return company is null ? NotFound() : Ok(ToDto(company));
    }

    [HttpPost]
    public async Task<ActionResult<CompanyDto>> Create(CompanyUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.ShortCode))
            return BadRequest(new { message = "Name and Short Code are required" });

        var shortCode = request.ShortCode.Trim().ToUpperInvariant();
        if (await _db.Companies.AnyAsync(c => c.ShortCode == shortCode))
            return Conflict(new { message = "Short Code already exists" });

        var company = new Company
        {
            Code = await _codes.NextCompanyCodeAsync(),
            ShortCode = shortCode,
            Name = request.Name.Trim(),
            Contacts = request.Contacts
                .Where(c => !string.IsNullOrWhiteSpace(c.Name))
                .Select(c => new CompanyContact { Name = c.Name.Trim(), Mobile = c.Mobile.Trim() })
                .ToList()
        };

        _db.Companies.Add(company);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = company.Id }, ToDto(company));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CompanyDto>> Update(int id, CompanyUpsertRequest request)
    {
        var company = await _db.Companies.Include(c => c.Contacts).FirstOrDefaultAsync(c => c.Id == id);
        if (company is null) return NotFound();

        var shortCode = request.ShortCode.Trim().ToUpperInvariant();
        if (await _db.Companies.AnyAsync(c => c.ShortCode == shortCode && c.Id != id))
            return Conflict(new { message = "Short Code already exists" });

        company.Name = request.Name.Trim();
        company.ShortCode = shortCode;
        company.UpdatedAt = DateTimeOffset.UtcNow;

        // Replace contacts wholesale - simplest consistent sync for a short, user-edited list
        _db.CompanyContacts.RemoveRange(company.Contacts);
        company.Contacts = request.Contacts
            .Where(c => !string.IsNullOrWhiteSpace(c.Name))
            .Select(c => new CompanyContact { CompanyId = company.Id, Name = c.Name.Trim(), Mobile = c.Mobile.Trim() })
            .ToList();

        await _db.SaveChangesAsync();
        return Ok(ToDto(company));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var company = await _db.Companies.FindAsync(id);
        if (company is null) return NotFound();

        var inUse = await _db.PreJobSheets.AnyAsync(p => p.CompanyId == id);
        if (inUse) return Conflict(new { message = "Company is used in existing job sheets and cannot be deleted" });

        _db.Companies.Remove(company);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static CompanyDto ToDto(Company c) => new(
        c.Id, c.Code, c.ShortCode, c.Name,
        c.Contacts.Select(p => new CompanyContactDto(p.Id, p.Name, p.Mobile)).ToList()
    );
}
