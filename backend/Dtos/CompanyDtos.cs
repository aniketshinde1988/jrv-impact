namespace JrvImpact.Api.Dtos;

public record CompanyContactDto(int Id, string Name, string Mobile);

public record CompanyContactInput(string Name, string Mobile);

public record CompanyDto(int Id, string Code, string ShortCode, string Name, List<CompanyContactDto> Contacts);

public record CompanyUpsertRequest(string ShortCode, string Name, List<CompanyContactInput> Contacts);
