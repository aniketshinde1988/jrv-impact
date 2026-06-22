namespace JrvImpact.Api.Models;

public static class PaymentModes
{
    public const string Cash = "Cash";
    public const string GPay = "GPay";
    public const string Invoice = "Invoice";
}

public static class PreJobSheetStatus
{
    public const string Pending = "Pending";
    public const string Generated = "Generated";
}

public class PreJobSheet
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;

    public int LocationId { get; set; }
    public Location? Location { get; set; }

    public int CompanyId { get; set; }
    public Company? Company { get; set; }

    public int? ContactId { get; set; }
    public CompanyContact? Contact { get; set; }

    public string ContactName { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public DateOnly SheetDate { get; set; }
    public string PaymentMode { get; set; } = PaymentModes.Cash;

    public decimal SubTotal { get; set; }
    public decimal GstAmount { get; set; }
    public decimal TotalAmount { get; set; }

    public string Status { get; set; } = PreJobSheetStatus.Pending;

    public int? CreatedByUserId { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<PreJobSheetItem> Items { get; set; } = new();
}

public class PreJobSheetItem
{
    public int Id { get; set; }
    public int PreJobSheetId { get; set; }
    public PreJobSheet? PreJobSheet { get; set; }

    public int? JobTitleId { get; set; }
    public JobTitle? JobTitle { get; set; }

    public int SlNo { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Qty { get; set; }
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
}
