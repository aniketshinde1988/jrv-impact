namespace JrvImpact.Api.Dtos;

public record GeneratedJobSheetDto(int Id, string Code);

public record JobSheetItemInput(int Id, decimal Qty, decimal Rate);

public record JobSheetUpsertRequest(string ContactName, string Mobile, string PaymentMode, string ReceiverName, List<JobSheetItemInput> Items);

public record JobSheetItemDto(
    int Id,
    int SlNo,
    string ItemName,
    string Unit,
    decimal Qty,
    decimal Rate,
    decimal Amount,
    string? PhotoUrl,
    bool IsEdited,
    string[] EditedFields
);

public record JobSheetDto(
    int Id,
    string Code,
    int PreJobSheetId,
    string LocationName,
    string CompanyName,
    string ContactName,
    string Mobile,
    DateOnly SheetDate,
    string PaymentMode,
    decimal SubTotal,
    decimal GstAmount,
    decimal TotalAmount,
    string? ReceiverName,
    bool IsEdited,
    string[] EditedFields,
    List<JobSheetItemDto> Items
);

public record JobSheetListItemDto(
    int Id,
    string Code,
    DateOnly SheetDate,
    string CompanyName,
    string ReceiverName,
    decimal TotalAmount,
    bool IsEdited
);
