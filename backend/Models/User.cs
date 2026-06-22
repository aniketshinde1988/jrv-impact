namespace JrvImpact.Api.Models;

public class User
{
    public int Id { get; set; }
    public string UserCode { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
