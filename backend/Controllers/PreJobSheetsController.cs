using System.Security.Claims;
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
[Route("api/pre-job-sheets")]
public class PreJobSheetsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICodeGeneratorService _codes;

    public PreJobSheetsController(AppDbContext db, ICodeGeneratorService codes)
    {
        _db = db;
        _codes = codes;
    }

    [HttpGet]
    public async Task<ActionResult<List<PreJobSheetListItemDto>>> GetAll([FromQuery] int? locationId, [FromQuery] string? search)
    {
        var query = _db.PreJobSheets.Include(p => p.Company).AsQueryable();
        if (locationId.HasValue) query = query.Where(p => p.LocationId == locationId);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p => p.Code.ToLower().Contains(s) || p.ContactName.ToLower().Contains(s) || p.Company!.Name.ToLower().Contains(s));
        }

        var sheets = await query.OrderByDescending(p => p.Id).ToListAsync();
        return Ok(sheets.Select(p => new PreJobSheetListItemDto(
            p.Id, p.Code, p.SheetDate, p.Company?.Name ?? "", p.ContactName, p.TotalAmount, p.PaymentMode, p.Status
        )).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PreJobSheetDto>> GetById(int id)
    {
        var sheet = await _db.PreJobSheets
            .Include(p => p.Location).Include(p => p.Company).Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == id);

        return sheet is null ? NotFound() : Ok(ToDto(sheet));
    }

    [HttpPost]
    public async Task<ActionResult<PreJobSheetDto>> Create(PreJobSheetUpsertRequest request)
    {
        var location = await _db.Locations.FindAsync(request.LocationId);
        var company = await _db.Companies.FindAsync(request.CompanyId);
        if (location is null || company is null) return BadRequest(new { message = "Invalid Location or Company" });
        if (request.Items.Count == 0) return BadRequest(new { message = "At least one line item is required" });

        var firstJobTitle = request.Items[0].JobTitleId.HasValue
            ? await _db.JobTitles.FindAsync(request.Items[0].JobTitleId)
            : null;

        var code = await _codes.NextPreJobSheetCodeAsync(
            location.ShortCode,
            company.ShortCode,
            firstJobTitle?.ShortCode ?? "GEN",
            firstJobTitle?.TypeTag ?? "SRV"
        );

        var (subTotal, gst, total) = CalculateTotals(request.Items, request.PaymentMode);

        var sheet = new PreJobSheet
        {
            Code = code,
            LocationId = location.Id,
            CompanyId = company.Id,
            ContactId = request.ContactId,
            ContactName = request.ContactName,
            Mobile = request.Mobile,
            SheetDate = request.SheetDate,
            PaymentMode = request.PaymentMode,
            SubTotal = subTotal,
            GstAmount = gst,
            TotalAmount = total,
            Status = PreJobSheetStatus.Pending,
            CreatedByUserId = CurrentUserId(),
            Items = request.Items.Select((i, idx) => new PreJobSheetItem
            {
                SlNo = idx + 1,
                JobTitleId = i.JobTitleId,
                ItemName = i.ItemName,
                Unit = i.Unit,
                Qty = i.Qty,
                Rate = i.Rate,
                Amount = Math.Round(i.Qty * i.Rate, 2)
            }).ToList()
        };

        _db.PreJobSheets.Add(sheet);
        await _db.SaveChangesAsync();

        await _db.Entry(sheet).Reference(s => s.Location).LoadAsync();
        await _db.Entry(sheet).Reference(s => s.Company).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = sheet.Id }, ToDto(sheet));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PreJobSheetDto>> Update(int id, PreJobSheetUpsertRequest request)
    {
        var sheet = await _db.PreJobSheets
            .Include(p => p.Location).Include(p => p.Company).Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (sheet is null) return NotFound();
        if (sheet.Status == PreJobSheetStatus.Generated)
            return Conflict(new { message = "Already generated into a Job Sheet - edit it there instead" });

        var (subTotal, gst, total) = CalculateTotals(request.Items, request.PaymentMode);

        sheet.ContactId = request.ContactId;
        sheet.ContactName = request.ContactName;
        sheet.Mobile = request.Mobile;
        sheet.SheetDate = request.SheetDate;
        sheet.PaymentMode = request.PaymentMode;
        sheet.SubTotal = subTotal;
        sheet.GstAmount = gst;
        sheet.TotalAmount = total;
        sheet.UpdatedAt = DateTimeOffset.UtcNow;

        _db.PreJobSheetItems.RemoveRange(sheet.Items);
        sheet.Items = request.Items.Select((i, idx) => new PreJobSheetItem
        {
            PreJobSheetId = sheet.Id,
            SlNo = idx + 1,
            JobTitleId = i.JobTitleId,
            ItemName = i.ItemName,
            Unit = i.Unit,
            Qty = i.Qty,
            Rate = i.Rate,
            Amount = Math.Round(i.Qty * i.Rate, 2)
        }).ToList();

        await _db.SaveChangesAsync();
        return Ok(ToDto(sheet));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var sheet = await _db.PreJobSheets.FindAsync(id);
        if (sheet is null) return NotFound();
        if (sheet.Status == PreJobSheetStatus.Generated)
            return Conflict(new { message = "Cannot delete - already generated into a Job Sheet" });

        _db.PreJobSheets.Remove(sheet);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Creates the corresponding Job Sheet, snapshotting current values as the "original" baseline used later for edit-tracking.</summary>
    [HttpPost("{id:int}/generate")]
    public async Task<ActionResult<GeneratedJobSheetDto>> Generate(int id)
    {
        var sheet = await _db.PreJobSheets.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == id);
        if (sheet is null) return NotFound();
        if (sheet.Status == PreJobSheetStatus.Generated)
            return Conflict(new { message = "Already generated" });

        var jobSheet = new JobSheet
        {
            Code = sheet.Code,
            PreJobSheetId = sheet.Id,
            LocationId = sheet.LocationId,
            CompanyId = sheet.CompanyId,
            ContactId = sheet.ContactId,
            ContactName = sheet.ContactName,
            OriginalContactName = sheet.ContactName,
            Mobile = sheet.Mobile,
            OriginalMobile = sheet.Mobile,
            SheetDate = sheet.SheetDate,
            PaymentMode = sheet.PaymentMode,
            OriginalPaymentMode = sheet.PaymentMode,
            SubTotal = sheet.SubTotal,
            GstAmount = sheet.GstAmount,
            TotalAmount = sheet.TotalAmount,
            IsEdited = false,
            CreatedByUserId = CurrentUserId(),
            Items = sheet.Items.Select(i => new JobSheetItem
            {
                JobTitleId = i.JobTitleId,
                SlNo = i.SlNo,
                ItemName = i.ItemName,
                Unit = i.Unit,
                Qty = i.Qty,
                OriginalQty = i.Qty,
                Rate = i.Rate,
                OriginalRate = i.Rate,
                Amount = i.Amount,
                OriginalAmount = i.Amount,
                IsEdited = false
            }).ToList()
        };

        sheet.Status = PreJobSheetStatus.Generated;
        sheet.UpdatedAt = DateTimeOffset.UtcNow;

        _db.JobSheets.Add(jobSheet);
        await _db.SaveChangesAsync();

        return Ok(new GeneratedJobSheetDto(jobSheet.Id, jobSheet.Code));
    }

    private static (decimal subTotal, decimal gst, decimal total) CalculateTotals(List<PreJobSheetItemInput> items, string paymentMode)
    {
        var subTotal = Math.Round(items.Sum(i => i.Qty * i.Rate), 2);
        var gst = paymentMode == PaymentModes.Cash ? 0m : Math.Round(subTotal * 0.18m, 2);
        return (subTotal, gst, subTotal + gst);
    }

    private int? CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(claim, out var id) ? id : null;
    }

    private static PreJobSheetDto ToDto(PreJobSheet p) => new(
        p.Id, p.Code, p.LocationId, p.Location?.Name ?? "", p.CompanyId, p.Company?.Name ?? "",
        p.ContactId, p.ContactName, p.Mobile, p.SheetDate, p.PaymentMode,
        p.SubTotal, p.GstAmount, p.TotalAmount, p.Status,
        p.Items.OrderBy(i => i.SlNo).Select(i => new PreJobSheetItemDto(
            i.Id, i.SlNo, i.JobTitleId, i.ItemName, i.Unit, i.Qty, i.Rate, i.Amount
        )).ToList()
    );
}
