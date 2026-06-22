using ClosedXML.Excel;
using JrvImpact.Api.Data;
using JrvImpact.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace JrvImpact.Api.Services;

public interface IExcelExportService
{
    Task<byte[]> ExportAllAsync();
}

public class ExcelExportService : IExcelExportService
{
    private readonly AppDbContext _db;

    public ExcelExportService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<byte[]> ExportAllAsync()
    {
        using var workbook = new XLWorkbook();

        // Locations
        var locSheet = workbook.Worksheets.Add("Locations");
        WriteHeader(locSheet, "Code", "Short Code", "Name");
        var locations = await _db.Locations.OrderBy(l => l.Id).ToListAsync();
        var row = 2;
        foreach (var l in locations)
        {
            locSheet.Cell(row, 1).Value = l.Code;
            locSheet.Cell(row, 2).Value = l.ShortCode;
            locSheet.Cell(row, 3).Value = l.Name;
            row++;
        }
        locSheet.Columns().AdjustToContents();

        // Companies
        var cmpSheet = workbook.Worksheets.Add("Companies");
        WriteHeader(cmpSheet, "Code", "Short Code", "Name", "Reference Persons");
        var companies = await _db.Companies.Include(c => c.Contacts).OrderBy(c => c.Id).ToListAsync();
        row = 2;
        foreach (var c in companies)
        {
            cmpSheet.Cell(row, 1).Value = c.Code;
            cmpSheet.Cell(row, 2).Value = c.ShortCode;
            cmpSheet.Cell(row, 3).Value = c.Name;
            cmpSheet.Cell(row, 4).Value = string.Join(", ", c.Contacts.Select(p => $"{p.Name} ({p.Mobile})"));
            row++;
        }
        cmpSheet.Columns().AdjustToContents();

        // Job Titles
        var jtSheet = workbook.Worksheets.Add("Job Titles");
        WriteHeader(jtSheet, "Code", "Short Code", "Name", "Unit", "Rate", "Type Tag");
        var jobTitles = await _db.JobTitles.OrderBy(j => j.Id).ToListAsync();
        row = 2;
        foreach (var j in jobTitles)
        {
            jtSheet.Cell(row, 1).Value = j.Code;
            jtSheet.Cell(row, 2).Value = j.ShortCode;
            jtSheet.Cell(row, 3).Value = j.Name;
            jtSheet.Cell(row, 4).Value = j.Unit;
            jtSheet.Cell(row, 5).Value = j.Rate;
            jtSheet.Cell(row, 6).Value = j.TypeTag;
            row++;
        }
        jtSheet.Columns().AdjustToContents();

        // Pre Job Sheets (flattened, one row per line item)
        var pjsSheet = workbook.Worksheets.Add("Pre Job Sheets");
        WriteHeader(pjsSheet, "Code", "Date", "Location", "Company", "Contact", "Mobile", "Payment Mode",
            "Item", "Unit", "Qty", "Rate", "Amount", "Sub Total", "GST", "Total", "Status");
        var preSheets = await _db.PreJobSheets
            .Include(p => p.Location).Include(p => p.Company).Include(p => p.Items)
            .OrderBy(p => p.Id).ToListAsync();
        row = 2;
        foreach (var p in preSheets)
        {
            if (p.Items.Count == 0)
            {
                WritePreHeaderRow(pjsSheet, row, p);
                row++;
                continue;
            }
            foreach (var item in p.Items.OrderBy(i => i.SlNo))
            {
                WritePreHeaderRow(pjsSheet, row, p);
                pjsSheet.Cell(row, 8).Value = item.ItemName;
                pjsSheet.Cell(row, 9).Value = item.Unit;
                pjsSheet.Cell(row, 10).Value = item.Qty;
                pjsSheet.Cell(row, 11).Value = item.Rate;
                pjsSheet.Cell(row, 12).Value = item.Amount;
                row++;
            }
        }
        pjsSheet.Columns().AdjustToContents();

        // Job Sheets (flattened, one row per line item)
        var jsSheet = workbook.Worksheets.Add("Job Sheets");
        WriteHeader(jsSheet, "Code", "Date", "Location", "Company", "Contact", "Mobile", "Payment Mode",
            "Receiver", "Item", "Unit", "Qty", "Rate", "Amount", "Sub Total", "GST", "Total", "Edited");
        var jobSheets = await _db.JobSheets
            .Include(j => j.Location).Include(j => j.Company).Include(j => j.Items)
            .OrderBy(j => j.Id).ToListAsync();
        row = 2;
        foreach (var j in jobSheets)
        {
            if (j.Items.Count == 0)
            {
                WriteJobHeaderRow(jsSheet, row, j);
                row++;
                continue;
            }
            foreach (var item in j.Items.OrderBy(i => i.SlNo))
            {
                WriteJobHeaderRow(jsSheet, row, j);
                jsSheet.Cell(row, 9).Value = item.ItemName;
                jsSheet.Cell(row, 10).Value = item.Unit;
                jsSheet.Cell(row, 11).Value = item.Qty;
                jsSheet.Cell(row, 12).Value = item.Rate;
                jsSheet.Cell(row, 13).Value = item.Amount;
                row++;
            }
        }
        jsSheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void WriteHeader(IXLWorksheet sheet, params string[] headers)
    {
        for (var i = 0; i < headers.Length; i++)
        {
            var cell = sheet.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#0f0f0f");
            cell.Style.Font.FontColor = XLColor.White;
        }
    }

    private static void WritePreHeaderRow(IXLWorksheet sheet, int row, PreJobSheet p)
    {
        sheet.Cell(row, 1).Value = p.Code;
        sheet.Cell(row, 2).Value = p.SheetDate.ToString("dd MMM yyyy");
        sheet.Cell(row, 3).Value = p.Location?.Name;
        sheet.Cell(row, 4).Value = p.Company?.Name;
        sheet.Cell(row, 5).Value = p.ContactName;
        sheet.Cell(row, 6).Value = p.Mobile;
        sheet.Cell(row, 7).Value = p.PaymentMode;
        sheet.Cell(row, 13).Value = p.SubTotal;
        sheet.Cell(row, 14).Value = p.GstAmount;
        sheet.Cell(row, 15).Value = p.TotalAmount;
        sheet.Cell(row, 16).Value = p.Status;
    }

    private static void WriteJobHeaderRow(IXLWorksheet sheet, int row, JobSheet j)
    {
        sheet.Cell(row, 1).Value = j.Code;
        sheet.Cell(row, 2).Value = j.SheetDate.ToString("dd MMM yyyy");
        sheet.Cell(row, 3).Value = j.Location?.Name;
        sheet.Cell(row, 4).Value = j.Company?.Name;
        sheet.Cell(row, 5).Value = j.ContactName;
        sheet.Cell(row, 6).Value = j.Mobile;
        sheet.Cell(row, 7).Value = j.PaymentMode;
        sheet.Cell(row, 8).Value = j.ReceiverName;
        sheet.Cell(row, 14).Value = j.SubTotal;
        sheet.Cell(row, 15).Value = j.GstAmount;
        sheet.Cell(row, 16).Value = j.TotalAmount;
        sheet.Cell(row, 17).Value = j.IsEdited ? "Edited" : "Clean";
    }
}
