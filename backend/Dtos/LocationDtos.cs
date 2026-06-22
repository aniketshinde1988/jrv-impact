namespace JrvImpact.Api.Dtos;

public record LocationDto(int Id, string Code, string ShortCode, string Name);

public record LocationUpsertRequest(string ShortCode, string Name);
