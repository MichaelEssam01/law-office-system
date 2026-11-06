using LawOffice.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LawOffice.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Client> Clients { get; set; }
    public DbSet<Case> Cases { get; set; }
    public DbSet<CaseParty> CaseParties { get; set; }
    public DbSet<Contract> Contracts { get; set; }
    public DbSet<ContractParty> ContractParties { get; set; }
    public DbSet<Registration> Registrations { get; set; }
    public DbSet<RegistrationProcedure> RegistrationProcedures { get; set; }
    public DbSet<Company> Companies { get; set; }
    public DbSet<CompanyParty> CompanyParties { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<SystemSetting> SystemSettings { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<UserSecurityLog> UserSecurityLogs { get; set; }
    public DbSet<UserNotificationSetting> UserNotificationSettings { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Client Configuration
        modelBuilder.Entity<Client>(entity =>
        {
            entity.Property(c => c.ClientNumber)
                .ValueGeneratedOnAdd();
            entity.HasIndex(c => c.ClientNumber)
                .IsUnique();
        });

        // Case Configuration
        modelBuilder.Entity<Case>(entity =>
        {
            entity.HasIndex(c => c.CaseNumber).IsUnique();
            
            entity.HasOne(c => c.Client)
                .WithMany(cl => cl.Cases)
                .HasForeignKey(c => c.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.AssignedLawyer)
                .WithMany(u => u.Cases)
                .HasForeignKey(c => c.AssignedLawyerId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(c => c.Parties)
                .WithOne(p => p.Case)
                .HasForeignKey(p => p.CaseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CaseParty Configuration
        modelBuilder.Entity<CaseParty>(entity =>
        {
            entity.HasOne(p => p.Client)
                .WithMany()
                .HasForeignKey(p => p.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Contract Configuration
        modelBuilder.Entity<Contract>(entity =>
        {
            entity.HasIndex(c => c.ContractNumber).IsUnique();

            entity.HasOne(c => c.Client)
                .WithMany(cl => cl.Contracts)
                .HasForeignKey(c => c.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.AssignedLawyer)
                .WithMany()
                .HasForeignKey(c => c.AssignedLawyerId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(c => c.Parties)
                .WithOne(p => p.Contract)
                .HasForeignKey(p => p.ContractId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ContractParty>(entity =>
        {
            entity.HasOne(p => p.Client)
                .WithMany()
                .HasForeignKey(p => p.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Registration Configuration
        modelBuilder.Entity<Registration>(entity =>
        {
            entity.HasIndex(r => r.RegistrationNumber).IsUnique();

            entity.HasOne(r => r.Client)
                .WithMany(cl => cl.Registrations)
                .HasForeignKey(r => r.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.AssignedLawyer)
                .WithMany()
                .HasForeignKey(r => r.AssignedLawyerId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(r => r.Procedures)
                .WithOne(p => p.Registration)
                .HasForeignKey(p => p.RegistrationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RegistrationProcedure>(entity =>
        {
            entity.HasOne(p => p.ResponsibleLawyer)
                .WithMany()
                .HasForeignKey(p => p.ResponsibleLawyerId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Company Configuration
        modelBuilder.Entity<Company>(entity =>
        {
            entity.HasIndex(c => c.CompanyCode).IsUnique();

            entity.HasOne(c => c.Client)
                .WithMany(cl => cl.Companies)
                .HasForeignKey(c => c.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.AssignedLawyer)
                .WithMany()
                .HasForeignKey(c => c.AssignedLawyerId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(c => c.Parties)
                .WithOne(p => p.Company)
                .HasForeignKey(p => p.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CompanyParty>(entity =>
        {
            entity.HasOne(p => p.Client)
                .WithMany()
                .HasForeignKey(p => p.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // Invoice Configuration
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasIndex(i => i.InvoiceNumber).IsUnique();
            entity.Property(i => i.Amount).HasColumnType("decimal(18,2)");
            
            entity.HasOne(i => i.Case)
                .WithMany(c => c.Invoices)
                .HasForeignKey(i => i.CaseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Payment Configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.Property(p => p.Amount).HasColumnType("decimal(18,2)");

            entity.HasOne(p => p.Case)
                .WithMany(c => c.Payments)
                .HasForeignKey(p => p.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.Invoice)
                .WithMany(i => i.Payments)
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Session Configuration
        modelBuilder.Entity<Session>(entity =>
        {
            entity.HasOne(s => s.Case)
                .WithMany(c => c.Sessions)
                .HasForeignKey(s => s.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(s => s.AssignedLawyer)
                .WithMany()
                .HasForeignKey(s => s.AssignedLawyerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.PreviousSessionLawyer)
                .WithMany()
                .HasForeignKey(s => s.PreviousSessionLawyerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Document Configuration
        modelBuilder.Entity<Document>(entity =>
        {
            entity.HasOne(d => d.Case)
                .WithMany(c => c.Documents)
                .HasForeignKey(d => d.CaseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RefreshToken Configuration
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasOne(rt => rt.User)
                .WithMany()
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(rt => rt.TokenHash).IsUnique();
        });

        // UserSecurityLog Configuration
        modelBuilder.Entity<UserSecurityLog>(entity =>
        {
            entity.HasOne(l => l.User)
                .WithMany(u => u.SecurityLogs)
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // UserNotificationSetting Configuration
        modelBuilder.Entity<UserNotificationSetting>(entity =>
        {
            entity.HasOne(s => s.User)
                .WithOne(u => u.NotificationSetting)
                .HasForeignKey<UserNotificationSetting>(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Notification Configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
