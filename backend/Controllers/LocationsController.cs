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
[Route("api/locations")]
public class LocationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICodeGeneratorService _codes;

    public LocationsController(AppDbContext db, ICodeGeneratorService codes)
    {
        _db = db;
        _codes = codes;
    }

    [HttpGet]
    public async Task<ActionResult<List<LocationDto>>> GetAll([FromQuery] string? search)
    {
        var query = _db.Locations.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(l => l.Name.ToLower().Contains(search.ToLower()) || l.Code.ToLower().Contains(search.ToLower()));

        var locations = await query.OrderBy(l => l.Id).ToListAsync();
        return Ok(locations.Select(ToDto).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LocationDto>> GetById(int id)
    {
        var location = await _db.Locations.FindAsync(id);
        return location is null ? NotFound() : Ok(ToDto(location));
    }

    [HttpPost]
    public async Task<ActionResult<LocationDto>> Create(LocationUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.ShortCode))
            return BadRequest(new { message = "Name and Short Code are required" });

        var shortCode = request.ShortCode.Trim().ToUpperInvariant();
        if (await _db.Locations.AnyAsync(l => l.ShortCode == shortCode))
            return Conflict(new { message = "Short Code already exists" });

        var location = new Location
        {
            Code = await _codes.NextLocationCodeAsync(),
            ShortCode = shortCode,
            Name = request.Name.Trim()
        };
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = location.Id }, ToDto(location));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<LocationDto>> Update(int id, LocationUpsertRequest request)
    {
        var location = await _db.Locations.FindAsync(id);
        if (location is null) return NotFound();

        var shortCode = request.ShortCode.Trim().ToUpperInvariant();
        if (await _db.Locations.AnyAsync(l => l.ShortCode == shortCode && l.Id != id))
            return Conflict(new { message = "Short Code already exists" });

        location.Name = request.Name.Trim();
        location.ShortCode = shortCode;
        location.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(ToDto(location));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var location = await _db.Locations.FindAsync(id);
        if (location is null) return NotFound();

        var inUse = await _db.PreJobSheets.AnyAsync(p => p.LocationId == id);
        if (inUse) return Conflict(new { message = "Location is used in existing job sheets and cannot be deleted" });

        _db.Locations.Remove(location);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static LocationDto ToDto(Location l) => new(l.Id, l.Code, l.ShortCode, l.Name);
}
