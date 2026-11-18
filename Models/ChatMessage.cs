namespace TyroneAI.Web.Models;

public class ChatMessage
{
    public int Id { get; set; }

    public int ConversationId { get; set; }

    public string Role { get; set; } = "user";

    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Conversation? Conversation { get; set; }
}