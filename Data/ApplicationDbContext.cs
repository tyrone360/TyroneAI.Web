using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TyroneAI.Web.Models;

namespace TyroneAI.Web.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Conversation> Conversations => Set<Conversation>();

    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Conversation>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Conversation>()
            .HasMany(c => c.Messages)
            .WithOne(m => m.Conversation)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Conversation>()
            .Property(c => c.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Entity<ChatMessage>()
            .Property(m => m.Role)
            .HasMaxLength(20)
            .IsRequired();

        builder.Entity<ChatMessage>()
            .Property(m => m.Content)
            .IsRequired();

        builder.Entity<Conversation>()
            .HasIndex(c => new { c.UserId, c.UpdatedAtUtc });

        builder.Entity<ChatMessage>()
            .HasIndex(m => new { m.ConversationId, m.CreatedAtUtc });
    }
}