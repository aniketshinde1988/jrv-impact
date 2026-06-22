namespace JrvImpact.Api.Dtos;

public record PreJobSheetItemInput(int? JobTitleId, string ItemName, string Unit, decimal Qty, decimal Rate);

public record PreJobSheetItemDto(int Id, int SlNo, int? JobTitleId, string ItemName, string Unit, decimal Qty, decimal Rate, decimal Amount);

public record PreJobSheetUpsertRequest(
    int LocationId,
    int CompanyId,
    int? ContactId,
    string ContactName,
    string Mobile,
    DateOnly SheetDate,
    string PaymentMode,
    List<PreJobSheetItemInput> Items
);

public record PreJobSheetDto(
    int Id,
    string Code,
    int LocationId,
    string LocationName,
    int CompanyId,
    string CompanyName,
    int? ContactId,
    string ContactName,
    string Mobile,
    DateOnly SheetDate,
    string PaymentMode,
    decimal SubTotal,
    decimal GstAmount,
    decimal TotalAmount,
    string Status,
    List<PreJobSheetItemDto> Items
);

public record PreJobSheetListItemDto(
    int Id,
    string Code,
    DateOnly SheetDate,
    string CompanyName,
    string ContactName,
    decimal TotalAmount,
    string PaymentMode,
    string Status
);
