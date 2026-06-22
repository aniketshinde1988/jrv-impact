using JrvImpact.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JrvImpact.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly IExcelExportService _export;

    public ReportsController(IExcelExportService export)
    {
        _export = export;
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        var bytes = await _export.ExportAllAsync();
        var fileName = $"jrv-impact-export-{DateTime.UtcNow:yyyyMMdd-HHmm}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
