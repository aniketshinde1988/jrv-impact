namespace JrvImpact.Api.Dtos;

public record JobTitleDto(int Id, string Code, string ShortCode, string Name, string Unit, decimal Rate, string TypeTag);

public record JobTitleUpsertRequest(string ShortCode, string Name, string Unit, decimal Rate, string TypeTag);
