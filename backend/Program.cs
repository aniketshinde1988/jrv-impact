using JrvImpact.Api.Data;
using JrvImpact.Api.Models;
using JrvImpact.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ---- Configuration ----
// Supports two connection styles:
//  - ConnectionStrings:Default (key=value format) - used on the self-hosted VPS / docker-compose path
//  - DATABASE_URL (postgres://user:pass@host:port/db) - the convention used by Railway, Render, etc.
var connectionString = BuildConnectionString(builder.Configuration);

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Missing Jwt:Key");

// ---- Services ----
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention());

builder.Services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ICodeGeneratorService, CodeGeneratorService>();
builder.Services.AddScoped<IExcelExportService, ExcelExportService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "JRV Impact API", Version = "v1" });

    // Add JWT Bearer definition
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your token here}\n\nExample: Bearer eyJhbGci..."
    });

    // Make all endpoints require it by default
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
}); 

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

    };
});

builder.Services.AddAuthorization();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        if (allowedOrigins.Length > 0)
            policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
        else
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// ---- Wait for Postgres, bootstrap schema if needed, then seed default admin user ----
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    var retries = 0;
    while (retries < 20)
    {
        try
        {
            if (await db.Database.CanConnectAsync()) break;
        }
        catch { /* retry */ }
        retries++;
        await Task.Delay(2000);
    }

    // On a self-hosted VPS, backend/Data/schema.sql is mounted into the postgres
    // container's docker-entrypoint-initdb.d, so tables already exist here.
    // Managed Postgres (Railway, Render, ...) doesn't support that mount, so
    // bootstrap the schema ourselves the first time we see an empty database.
    var conn = db.Database.GetDbConnection();
    await conn.OpenAsync();
    await using (var checkCmd = conn.CreateCommand())
    {
        checkCmd.CommandText = "SELECT to_regclass('public.users')::text";
        var result = await checkCmd.ExecuteScalarAsync();
        if (result is null || result is DBNull)
        {
            var schemaPath = Path.Combine(AppContext.BaseDirectory, "schema.sql");
            var schemaSql = await File.ReadAllTextAsync(schemaPath);
            await using var schemaCmd = conn.CreateCommand();
            schemaCmd.CommandText = schemaSql;
            await schemaCmd.ExecuteNonQueryAsync();
            app.Logger.LogWarning("Bootstrapped database schema from schema.sql.");
        }
    }

    if (!await db.Users.AnyAsync())
    {
        var defaultPassword = builder.Configuration["Seed:AdminPassword"] ?? "Admin@123";
        db.Users.Add(new User
        {
            UserCode = "admin",
            FullName = "Administrator",
            PasswordHash = hasher.Hash(defaultPassword)
        });
        await db.SaveChangesAsync();
        app.Logger.LogWarning("Seeded default user 'admin' - change the password after first login.");
    }
}

// ---- Middleware pipeline ----
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseStaticFiles(); // serves wwwroot/uploads/*
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

static string BuildConnectionString(IConfiguration config)
{
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrWhiteSpace(databaseUrl))
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':', 2);
        var csb = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "",
            Database = uri.AbsolutePath.TrimStart('/'),
            SslMode = SslMode.Prefer,
            TrustServerCertificate = true
        };
        return csb.ConnectionString;
    }

    return config.GetConnectionString("Default")
        ?? throw new InvalidOperationException("Missing ConnectionStrings:Default or DATABASE_URL");
}
