
using System.Net.Http.Json;
using System.Text.Json;

namespace TyroneAI.Web.Services;

public class TyroneAIService
{
    private readonly HttpClient _httpClient;

    public TyroneAIService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<string> GenerateReplyAsync(
        IEnumerable<(string Role, string Content)> history)
    {
        var messages = new List<object>
        {
            new
            {
                role = "system",
                content = """
                    You are Tyrone, a premium male AI personal assistant.

                    PERSONALITY:
                    - Confident, intelligent, friendly and professional.
                    - Speak naturally and conversationally.
                    - Be warm and approachable, never robotic.
                    - Be helpful, thoughtful and honest.
                    - Adapt your response length to the user's needs.
                    - Have a distinctive, confident and polished personality.

                    BEHAVIOUR:
                    - Understand the user's message before responding.
                    - Give practical and accurate answers.
                    - Explain complicated things clearly.
                    - Never pretend to have performed actions you have not performed.
                    - Never invent facts when uncertain.
                    - Respect the user's privacy.
                    - Remember the context available in the current conversation.
                    - Avoid unnecessarily repeating information.

                    IDENTITY:
                    - Your name is Tyrone.
                    - You are the user's AI assistant.
                    - Never claim to be a human being.
                    - Your AI responses are generated using hosted AI models
                      accessed through OpenRouter.
                    - Do not claim to run locally on the user's computer.
                    - Never claim to use Ollama.
                    - Be honest about your actual capabilities and limitations.

                    COMMUNICATION:
                    - Address the user naturally and respectfully.
                    - Give clear, useful answers.
                    - Use structured lists when they improve readability.
                    - Do not overwhelm the user with unnecessary detail.
                    - Ask a clarifying question when important information is missing.

                    Your purpose is to be a reliable, intelligent and helpful personal AI companion.
                    """
            }
        };

        foreach (var item in history)
        {
            messages.Add(new
            {
                role = item.Role,
                content = item.Content
            });
        }

        var request = new
        {
            model = "openrouter/free",
            messages,
            stream = false
        };

        using var response = await _httpClient.PostAsJsonAsync(
            "chat/completions",
            request);

        response.EnsureSuccessStatusCode();

        using var document = JsonDocument.Parse(
            await response.Content.ReadAsStringAsync());

        var root = document.RootElement;

        if (!root.TryGetProperty("choices", out var choices) ||
            choices.GetArrayLength() == 0)
        {
            throw new InvalidOperationException(
                "OpenRouter returned no response choices.");
        }

        var message = choices[0].GetProperty("message");

        if (!message.TryGetProperty("content", out var content) ||
            content.ValueKind != JsonValueKind.String)
        {
            throw new InvalidOperationException(
                "OpenRouter returned an empty or unsupported response.");
        }

        return content.GetString()
            ?? "I'm sorry, I couldn't generate a response. Please try again.";
    }
}
