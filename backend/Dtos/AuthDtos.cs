namespace JrvImpact.Api.Dtos;

public record LoginRequest(string UserCode, string Password);

public record LoginResponse(string Token, int UserId, string UserCode, string FullName);

public record CurrentUserResponse(int UserId, string UserCode, string FullName);
