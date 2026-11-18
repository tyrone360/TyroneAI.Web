
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Text.Encodings.Web;

namespace TyroneAI.Web.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendPasswordResetEmailAsync(
        string recipientEmail,
        string resetLink)
    {
        var username = _configuration["EmailSettings:Username"];
        var appPassword = _configuration["EmailSettings:AppPassword"];

        if (string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(appPassword))
        {
            throw new InvalidOperationException(
                "Gmail email settings are not configured.");
        }

        var message = new MimeMessage();

        message.From.Add(new MailboxAddress(
            "Tyrone AI",
            username));

        message.To.Add(MailboxAddress.Parse(recipientEmail));

        message.Subject = "Reset your Tyrone AI password";

        var safeResetLink = HtmlEncoder.Default.Encode(resetLink);

        var body = new BodyBuilder
        {
            TextBody = $"""
                Hello,

                We received a request to reset your Tyrone AI password.

                Use the link below to create a new password:

                {resetLink}

                If you did not request this, you can safely ignore this email.

                Tyrone AI
                Your world. Your AI.
                """,

            HtmlBody = $"""
                <!DOCTYPE html>
                <html>
                <body style="margin:0;padding:35px;background:#080d19;
                    font-family:Arial,sans-serif;color:#ffffff;">

                    <div style="max-width:520px;margin:auto;padding:35px;
                        background:#101c32;border:1px solid #263b5c;
                        border-radius:18px;">

                        <h2 style="color:#83adff;">TYRONE AI</h2>

                        <h1>Reset your password</h1>

                        <p style="color:#b4c2d8;line-height:1.7;">
                            We received a request to reset your
                            Tyrone AI password.
                        </p>

                        <p style="color:#b4c2d8;line-height:1.7;">
                            Click below to create a new password.
                        </p>

                        <a href="{safeResetLink}"
                           style="display:inline-block;margin-top:15px;
                           padding:14px 24px;background:#5287ff;
                           color:#ffffff;text-decoration:none;
                           border-radius:9px;font-weight:bold;">
                            Reset Password
                        </a>

                        <p style="margin-top:30px;color:#8492aa;
                            font-size:12px;line-height:1.7;">
                            If you did not request this password reset,
                            you can safely ignore this email.
                        </p>

                        <hr style="border:0;border-top:1px solid #263b5c;
                            margin:25px 0;">

                        <p style="color:#8492aa;font-size:11px;">
                            TYRONE AI · YOUR WORLD. YOUR AI.
                        </p>

                    </div>
                </body>
                </html>
                """
        };

        message.Body = body.ToMessageBody();

        using var client = new SmtpClient();

        await client.ConnectAsync(
            "smtp.gmail.com",
            587,
            SecureSocketOptions.StartTls);

        await client.AuthenticateAsync(username, appPassword);

        var sendRequest = new SmtpSendRequest(message);
await client.SendAsync(sendRequest);
        await client.DisconnectAsync(true);
    }
}
