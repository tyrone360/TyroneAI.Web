using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TyroneAI.Web.Data;
using TyroneAI.Web.Models;

namespace TyroneAI.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ConversationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public ConversationsController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // GET: api/Conversations
    [HttpGet]
    public async Task<IActionResult> GetConversations()
    {
        var userId = _userManager.GetUserId(User);

        var conversations = await _context.Conversations
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAtUtc)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.CreatedAtUtc,
                c.UpdatedAtUtc
            })
            .ToListAsync();

        return Ok(conversations);
    }

    // POST: api/Conversations
    [HttpPost]
    public async Task<IActionResult> CreateConversation()
    {
        var userId = _userManager.GetUserId(User);

        if (userId == null)
            return Unauthorized();

        var conversation = new Conversation
        {
            UserId = userId,
            Title = "New Conversation",
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            conversation.Id,
            conversation.Title,
            conversation.CreatedAtUtc
        });
    }

    // GET: api/Conversations/5
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetConversation(int id)
    {
        var userId = _userManager.GetUserId(User);

        var conversation = await _context.Conversations
            .AsNoTracking()
            .Where(c => c.Id == id && c.UserId == userId)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.CreatedAtUtc,
                c.UpdatedAtUtc,
                Messages = c.Messages
                    .OrderBy(m => m.CreatedAtUtc)
                    .Select(m => new
                    {
                        m.Id,
                        m.Role,
                        m.Content,
                        m.CreatedAtUtc
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (conversation == null)
            return NotFound();

        return Ok(conversation);
    }

    // DELETE: api/Conversations/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteConversation(int id)
    {
        var userId = _userManager.GetUserId(User);

        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (conversation == null)
            return NotFound();

        _context.Conversations.Remove(conversation);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}