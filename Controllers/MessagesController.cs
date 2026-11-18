
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TyroneAI.Web.Data;
using TyroneAI.Web.Models;
using TyroneAI.Web.Services;

namespace TyroneAI.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly TyroneAIService _tyroneAI;

    public MessagesController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        TyroneAIService tyroneAI)
    {
        _context = context;
        _userManager = userManager;
        _tyroneAI = tyroneAI;
    }

    // GET: api/Messages/conversation/1
    [HttpGet("conversation/{conversationId:int}")]
    public async Task<IActionResult> GetMessages(int conversationId)
    {
        var userId = _userManager.GetUserId(User);

        var conversationExists = await _context.Conversations
            .AnyAsync(c => c.Id == conversationId && c.UserId == userId);

        if (!conversationExists)
            return NotFound();

        var messages = await _context.ChatMessages
            .AsNoTracking()
            .Where(m => m.ConversationId == conversationId)
            .OrderBy(m => m.CreatedAtUtc)
            .Select(m => new
            {
                m.Id,
                m.Role,
                m.Content,
                m.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(messages);
    }

    // POST: api/Messages
    [HttpPost]
    public async Task<IActionResult> SendMessage(
        [FromBody] SendMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { message = "Message cannot be empty." });

        if (request.Content.Length > 10000)
            return BadRequest(new { message = "Message is too long." });

        var userId = _userManager.GetUserId(User);

        if (userId == null)
            return Unauthorized();

        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c =>
                c.Id == request.ConversationId &&
                c.UserId == userId);

        if (conversation == null)
            return NotFound(new { message = "Conversation not found." });

        var message = new ChatMessage
        {
            ConversationId = conversation.Id,
            Role = "user",
            Content = request.Content.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.ChatMessages.Add(message);

        conversation.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message.Id,
            message.ConversationId,
            message.Role,
            message.Content,
            message.CreatedAtUtc
        });
    }

    // POST: api/Messages/chat
    [HttpPost("chat")]
    public async Task<IActionResult> ChatWithTyrone(
        [FromBody] SendMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { message = "Message cannot be empty." });

        if (request.Content.Length > 10000)
            return BadRequest(new { message = "Message is too long." });

        var userId = _userManager.GetUserId(User);

        if (userId == null)
            return Unauthorized();

        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c =>
                c.Id == request.ConversationId &&
                c.UserId == userId);

        if (conversation == null)
            return NotFound(new { message = "Conversation not found." });

        var now = DateTime.UtcNow;

        var userMessage = new ChatMessage
        {
            ConversationId = conversation.Id,
            Role = "user",
            Content = request.Content.Trim(),
            CreatedAtUtc = now
        };

        _context.ChatMessages.Add(userMessage);
        conversation.UpdatedAtUtc = now;

        await _context.SaveChangesAsync();

        // Load the most recent 20 messages, including the new message.
        var recentMessages = await _context.ChatMessages
            .AsNoTracking()
            .Where(m => m.ConversationId == conversation.Id)
            .OrderByDescending(m => m.CreatedAtUtc)
            .ThenByDescending(m => m.Id)
            .Take(20)
            .ToListAsync();

        recentMessages.Reverse();

        var history = recentMessages.Select(m =>
            (m.Role, m.Content));

        string aiReply;

        try
        {
            aiReply = await _tyroneAI.GenerateReplyAsync(history);
        }
       catch (Exception ex)
{
    Console.WriteLine("TYRONE AI ERROR:");
    Console.WriteLine(ex.ToString());

    return StatusCode(502, new
    {
        message = "Tyrone is temporarily unavailable. Please try again."
    });
}

        if (string.IsNullOrWhiteSpace(aiReply))
        {
            return StatusCode(502, new
            {
                message = "Tyrone couldn't generate a response. Please try again."
            });
        }

        var assistantMessage = new ChatMessage
        {
            ConversationId = conversation.Id,
            Role = "assistant",
            Content = aiReply,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.ChatMessages.Add(assistantMessage);
        conversation.UpdatedAtUtc = assistantMessage.CreatedAtUtc;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            userMessage = new
            {
                userMessage.Id,
                userMessage.ConversationId,
                userMessage.Role,
                userMessage.Content,
                userMessage.CreatedAtUtc
            },
            assistantMessage = new
            {
                assistantMessage.Id,
                assistantMessage.ConversationId,
                assistantMessage.Role,
                assistantMessage.Content,
                assistantMessage.CreatedAtUtc
            }
        });
    }
}

public class SendMessageRequest
{
    public int ConversationId { get; set; }

    public string Content { get; set; } = string.Empty;
}
