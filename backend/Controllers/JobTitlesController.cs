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
[Route("api/job-titles")]
public class JobTitlesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICodeGeneratorService _codes;

    public JobTitlesController(AppDbContext db, ICodeGeneratorService codes)
    {
        _db = db;
        _codes = codes;
    }

    [HttpGet]
    public async Task<ActionResult<List<JobTitleDto>>> GetAll([FromQuery] string? search)
    {
        var query = _db.JobTitles.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(j => j.Name.ToLower().Contains(search.ToLower()) || j.Code.ToLower().Contains(search.ToLower()));

        var jobTitles = await query.OrderBy(j => j.Id).ToListAsync();
        return Ok(jobTitles.Select(ToDto).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<JobTitleDto>> GetById(int id)
    {
        var jobTitle = await _db.JobTitles.FindAsync(id);
        return jobTitle is null ? NotFound() : Ok(ToDto(jobTitle));
    }

    [HttpPost]
    public async Task<ActionResult<JobTitleDto>> Create(JobTitleUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.ShortCode))
            return BadRequest(new { message = "Name and Short Code are required" });

        var shortCode = request.ShortCode.Trim().ToUpperInvariant();
        if (await _db.JobTitles.AnyAsync(j => j.ShortCode == shortCode))
            return Conflict(new { message = "Short Code already exists" });

        var jobTitle = new JobTitle
        {
            Code = await _codes.NextJobTitleCodeAsync(),
            ShortCode = shortCode,
            Name = request.Name.Trim(),
            Unit = request.Unit.Trim(),
            Rate = request.Rate,
            TypeTag = string.IsNullOrWhiteSpace(request.TypeTag) ? "SRV" : request.TypeTag.Trim().ToUpperInvariant()
        };

        _db.JobTitles.Add(jobTitle);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = jobTitle.Id }, ToDto(jobTitle));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<JobTitleDto>> Update(int id, JobTitleUpsertRequest request)
    {
        var jobTitle = await _db.JobTitles.FindAsync(id);
        if (jobTitle is null) return NotFound();

        var shortCode = request.ShortCode.Trim().ToUpperInvariant();
        if (await _db.JobTitles.AnyAsync(j => j.ShortCode == shortCode && j.Id != id))
            return Conflict(new { message = "Short Code already exists" });

        jobTitle.Name = request.Name.Trim();
        jobTitle.ShortCode = shortCode;
        jobTitle.Unit = request.Unit.Trim();
        jobTitle.Rate = request.Rate;
        jobTitle.TypeTag = string.IsNullOrWhiteSpace(request.TypeTag) ? jobTitle.TypeTag : request.TypeTag.Trim().ToUpperInvariant();
        jobTitle.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ToDto(jobTitle));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var jobTitle = await _db.JobTitles.FindAsync(id);
        if (jobTitle is null) return NotFound();

        _db.JobTitles.Remove(jobTitle);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static JobTitleDto ToDto(JobTitle j) => new(j.Id, j.Code, j.ShortCode, j.Name, j.Unit, j.Rate, j.TypeTag);
}
