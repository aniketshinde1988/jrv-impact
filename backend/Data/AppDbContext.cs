using JrvImpact.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace JrvImpact.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<CompanyContact> CompanyContacts => Set<CompanyContact>();
    public DbSet<JobTitle> JobTitles => Set<JobTitle>();
    public DbSet<PreJobSheet> PreJobSheets => Set<PreJobSheet>();
    public DbSet<PreJobSheetItem> PreJobSheetItems => Set<PreJobSheetItem>();
    public DbSet<JobSheet> JobSheets => Set<JobSheet>();
    public DbSet<JobSheetItem> JobSheetItems => Set<JobSheetItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Table names are derived from these DbSet names by the snake_case
        // naming convention (UseSnakeCaseNamingConvention, wired up in Program.cs),
        // so they line up exactly with db/init.sql without manual mapping.

        modelBuilder.Entity<Company>()
            .HasMany(c => c.Contacts)
            .WithOne(cc => cc.Company)
            .HasForeignKey(cc => cc.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PreJobSheet>()
            .HasMany(p => p.Items)
            .WithOne(i => i.PreJobSheet)
            .HasForeignKey(i => i.PreJobSheetId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<JobSheet>()
            .HasMany(j => j.Items)
            .WithOne(i => i.JobSheet)
            .HasForeignKey(i => i.JobSheetId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<JobSheet>()
            .HasOne(j => j.PreJobSheet)
            .WithMany()
            .HasForeignKey(j => j.PreJobSheetId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<JobSheet>()
            .HasIndex(j => j.PreJobSheetId)
            .IsUnique();

        modelBuilder.Entity<Location>().HasIndex(l => l.Code).IsUnique();
        modelBuilder.Entity<Location>().HasIndex(l => l.ShortCode).IsUnique();
        modelBuilder.Entity<Company>().HasIndex(c => c.Code).IsUnique();
        modelBuilder.Entity<Company>().HasIndex(c => c.ShortCode).IsUnique();
        modelBuilder.Entity<JobTitle>().HasIndex(j => j.Code).IsUnique();
        modelBuilder.Entity<JobTitle>().HasIndex(j => j.ShortCode).IsUnique();
        modelBuilder.Entity<PreJobSheet>().HasIndex(p => p.Code).IsUnique();
        modelBuilder.Entity<JobSheet>().HasIndex(j => j.Code).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.UserCode).IsUnique();
    }
}
