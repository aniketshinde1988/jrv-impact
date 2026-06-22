using System.Security.Claims;
using JrvImpact.Api.Data;
using JrvImpact.Api.Dtos;
using JrvImpact.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JrvImpact.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenService _tokens;

    public AuthController(AppDbContext db, IPasswordHasher hasher, ITokenService tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserCode == request.UserCode);
        if (user is null || !_hasher.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid User ID or Password" });

        var token = _tokens.GenerateToken(user);
        return Ok(new LoginResponse(token, user.Id, user.UserCode, user.FullName));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<CurrentUserResponse>> Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
        var user = await _db.Users.FindAsync(userId);
        if (user is null) return NotFound();
        return Ok(new CurrentUserResponse(user.Id, user.UserCode, user.FullName));
    }
}
