using JrvImpact.Api.Data;
using JrvImpact.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace JrvImpact.Api.Services;

public interface ICodeGeneratorService
{
    Task<string> NextLocationCodeAsync();
    Task<string> NextCompanyCodeAsync();
    Task<string> NextJobTitleCodeAsync();
    Task<string> NextPreJobSheetCodeAsync(string locationShortCode, string companyShortCode, string jobTitleShortCode, string typeTag);
}

public class CodeGeneratorService : ICodeGeneratorService
{
    private readonly AppDbContext _db;

    public CodeGeneratorService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<string> NextLocationCodeAsync() =>
        await NextSequentialCode("LOC", async () => await _db.Locations.CountAsync());

    public async Task<string> NextCompanyCodeAsync() =>
        await NextSequentialCode("CMP", async () => await _db.Companies.CountAsync());

    public async Task<string> NextJobTitleCodeAsync() =>
        await NextSequentialCode("JT", async () => await _db.JobTitles.CountAsync());

    private static async Task<string> NextSequentialCode(string prefix, Func<Task<int>> countAsync)
    {
        var count = await countAsync();
        return $"{prefix}-{(count + 1):D3}";
    }

    public async Task<string> NextPreJobSheetCodeAsync(string locationShortCode, string companyShortCode, string jobTitleShortCode, string typeTag)
    {
        var baseCode = $"{locationShortCode}-{companyShortCode}-{jobTitleShortCode}-{typeTag}".ToUpperInvariant();
        var candidate = baseCode;
        var suffix = 1;

        while (await _db.PreJobSheets.AnyAsync(p => p.Code == candidate))
        {
            suffix++;
            candidate = $"{baseCode}-{suffix}";
        }

        return candidate;
    }
}
