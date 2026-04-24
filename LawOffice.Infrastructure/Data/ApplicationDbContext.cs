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
    public DbSet<Session> Sessions { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Document> Documents { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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

        // Session -> Case (One-to-Many)
        modelBuilder.Entity<Session>()
            .HasOne(s => s.Case)
            .WithMany(c => c.Sessions)
            .HasForeignKey(s => s.CaseId)
            .OnDelete(DeleteBehavior.Cascade);

        // Document Configuration
        modelBuilder.Entity<Document>(entity =>
        {
            entity.HasOne(d => d.Case)
                .WithMany(c => c.Documents)
                .HasForeignKey(d => d.CaseId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
