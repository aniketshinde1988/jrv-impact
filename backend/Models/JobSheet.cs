namespace JrvImpact.Api.Models;

public class JobSheet
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;

    public int PreJobSheetId { get; set; }
    public PreJobSheet? PreJobSheet { get; set; }

    public int LocationId { get; set; }
    public Location? Location { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public int? ContactId { get; set; }
    public CompanyContact? Contact { get; set; }

    public string ContactName { get; set; } = string.Empty;
    public string OriginalContactName { get; set; } = string.Empty;

    public string Mobile { get; set; } = string.Empty;
    public string OriginalMobile { get; set; } = string.Empty;

    public DateOnly SheetDate { get; set; }

    public string PaymentMode { get; set; } = string.Empty;
    public string OriginalPaymentMode { get; set; } = string.Empty;

    public decimal SubTotal { get; set; }
    public decimal GstAmount { get; set; }
    public decimal TotalAmount { get; set; }

    public string? ReceiverName { get; set; }

    public bool IsEdited { get; set; }
    public string[] EditedFields { get; set; } = Array.Empty<string>();

    public int? CreatedByUserId { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<JobSheetItem> Items { get; set; } = new();
}

public class JobSheetItem
{
    public int Id { get; set; }
    public int JobSheetId { get; set; }
    public JobSheet? JobSheet { get; set; }

    public int? JobTitleId { get; set; }
    public JobTitle? JobTitle { get; set; }

    public int SlNo { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;

    public decimal Qty { get; set; }
    public decimal OriginalQty { get; set; }

    public decimal Rate { get; set; }
    public decimal OriginalRate { get; set; }

    public decimal Amount { get; set; }
    public decimal OriginalAmount { get; set; }

    public string? PhotoPath { get; set; }

    public bool IsEdited { get; set; }
    public string[] EditedFields { get; set; } = Array.Empty<string>();
}
