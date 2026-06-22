using JrvImpact.Api.Data;
using JrvImpact.Api.Dtos;
using JrvImpact.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JrvImpact.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardStatsDto>> Get([FromQuery] int? locationId)
    {
        var pjsQuery = _db.PreJobSheets.AsQueryable();
        var jsQuery = _db.JobSheets.AsQueryable();
        if (locationId.HasValue)
        {
            pjsQuery = pjsQuery.Where(p => p.LocationId == locationId);
            jsQuery = jsQuery.Where(j => j.LocationId == locationId);
        }

        var pendingCount = await pjsQuery.CountAsync(p => p.Status == PreJobSheetStatus.Pending);
        var jobSheetsDone = await jsQuery.CountAsync();
        var totalCompanies = await _db.Companies.CountAsync();
        var totalJobTitles = await _db.JobTitles.CountAsync();
        var pendingGst = await pjsQuery
            .Where(p => p.Status == PreJobSheetStatus.Pending && p.PaymentMode != PaymentModes.Cash)
            .SumAsync(p => (decimal?)p.GstAmount) ?? 0m;

        return Ok(new DashboardStatsDto(pendingCount, totalCompanies, jobSheetsDone, totalJobTitles, pendingGst));
    }
}
