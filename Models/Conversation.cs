using TyroneAI.Web.Models;

namespace TyroneAI.Web.Models;

public class Conversation
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string Title { get; set; } = "New Conversation";

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ApplicationUser? User { get; set; }

    public ICollection<ChatMessage> Messages { get; set; }
        = new List<ChatMessage>();
}