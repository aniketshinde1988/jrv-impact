using JrvImpact.Api.Data;
using JrvImpact.Api.Dtos;
using JrvImpact.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JrvImpact.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/job-sheets")]
public class JobSheetsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public JobSheetsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet]
    public async Task<ActionResult<List<JobSheetListItemDto>>> GetAll([FromQuery] int? locationId, [FromQuery] string? search)
    {
        var query = _db.JobSheets.Include(j => j.Company).AsQueryable();
        if (locationId.HasValue) query = query.Where(j => j.LocationId == locationId);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(j => j.Code.ToLower().Contains(s) || (j.ReceiverName ?? "").ToLower().Contains(s) || j.Company!.Name.ToLower().Contains(s));
        }

        var sheets = await query.OrderByDescending(j => j.Id).ToListAsync();
        return Ok(sheets.Select(j => new JobSheetListItemDto(
            j.Id, j.Code, j.SheetDate, j.Company?.Name ?? "", j.ReceiverName ?? "", j.TotalAmount, j.IsEdited
        )).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<JobSheetDto>> GetById(int id)
    {
        var sheet = await Load(id);
        return sheet is null ? NotFound() : Ok(ToDto(sheet));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<JobSheetDto>> Update(int id, JobSheetUpsertRequest request)
    {
        var sheet = await Load(id);
        if (sheet is null) return NotFound();

        if (string.IsNullOrWhiteSpace(request.ReceiverName))
            return BadRequest(new { message = "Receiver Name is mandatory" });

        var itemsById = sheet.Items.ToDictionary(i => i.Id);
        foreach (var input in request.Items)
        {
            if (!itemsById.TryGetValue(input.Id, out var item)) continue;

            item.Qty = input.Qty;
            item.Rate = input.Rate;
            item.Amount = Math.Round(input.Qty * input.Rate, 2);

            var fields = new List<string>();
            if (item.Qty != item.OriginalQty) fields.Add("qty");
            if (item.Rate != item.OriginalRate) fields.Add("rate");
            if (item.Amount != item.OriginalAmount) fields.Add("amount");
            item.EditedFields = fields.ToArray();
            item.IsEdited = fields.Count > 0;

            if (string.IsNullOrWhiteSpace(item.PhotoPath))
                return BadRequest(new { message = $"Photo is mandatory for item '{item.ItemName}' before submitting" });
        }

        sheet.ContactName = request.ContactName;
        sheet.Mobile = request.Mobile;
        sheet.PaymentMode = request.PaymentMode;
        sheet.ReceiverName = request.ReceiverName;

        sheet.SubTotal = Math.Round(sheet.Items.Sum(i => i.Amount), 2);
        sheet.GstAmount = sheet.PaymentMode == PaymentModes.Cash ? 0m : Math.Round(sheet.SubTotal * 0.18m, 2);
        sheet.TotalAmount = sheet.SubTotal + sheet.GstAmount;

        var headerFields = new List<string>();
        if (sheet.ContactName != sheet.OriginalContactName) headerFields.Add("contactName");
        if (sheet.Mobile != sheet.OriginalMobile) headerFields.Add("mobile");
        if (sheet.PaymentMode != sheet.OriginalPaymentMode) headerFields.Add("paymentMode");
        sheet.EditedFields = headerFields.ToArray();
        sheet.IsEdited = headerFields.Count > 0 || sheet.Items.Any(i => i.IsEdited);

        sheet.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(ToDto(sheet));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var sheet = await _db.JobSheets.FindAsync(id);
        if (sheet is null) return NotFound();
        _db.JobSheets.Remove(sheet);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Uploads (or replaces) the mandatory photo for one Job Sheet line item.</summary>
    [HttpPost("{id:int}/items/{itemId:int}/photo")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UploadPhoto(int id, int itemId, IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest(new { message = "No file uploaded" });

        var item = await _db.JobSheetItems.FirstOrDefaultAsync(i => i.Id == itemId && i.JobSheetId == id);
        if (item is null) return NotFound();

        var allowedExt = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExt.Contains(ext)) return BadRequest(new { message = "Only JPG, PNG or WEBP images are allowed" });

        var folder = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", id.ToString());
        Directory.CreateDirectory(folder);

        var fileName = $"item-{itemId}-{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(folder, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
            await file.CopyToAsync(stream);

        item.PhotoPath = $"/uploads/{id}/{fileName}";
        await _db.SaveChangesAsync();

        return Ok(new { photoUrl = item.PhotoPath });
    }

    private async Task<JobSheet?> Load(int id) =>
        await _db.JobSheets
            .Include(j => j.Location).Include(j => j.Company).Include(j => j.Items)
            .FirstOrDefaultAsync(j => j.Id == id);

    private static JobSheetDto ToDto(JobSheet j) => new(
        j.Id, j.Code, j.PreJobSheetId, j.Location?.Name ?? "", j.Company?.Name ?? "",
        j.ContactName, j.Mobile, j.SheetDate, j.PaymentMode,
        j.SubTotal, j.GstAmount, j.TotalAmount, j.ReceiverName, j.IsEdited, j.EditedFields,
        j.Items.OrderBy(i => i.SlNo).Select(i => new JobSheetItemDto(
            i.Id, i.SlNo, i.ItemName, i.Unit, i.Qty, i.Rate, i.Amount, i.PhotoPath, i.IsEdited, i.EditedFields
        )).ToList()
    );
}
