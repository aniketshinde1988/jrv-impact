namespace JrvImpact.Api.Dtos;

public record DashboardStatsDto(
    int PendingPreJobSheets,
    int TotalCompanies,
    int JobSheetsDone,
    int TotalJobTitles,
    decimal PendingGstAmount
);
