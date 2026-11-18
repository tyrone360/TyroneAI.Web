using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using TyroneAI.Web.Services;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TyroneAI.Web.Models;

namespace TyroneAI.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
   private readonly UserManager<ApplicationUser> _userManager;
private readonly SignInManager<ApplicationUser> _signInManager;
private readonly EmailService _emailService;
private readonly ILogger<AuthController> _logger;
 public AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    EmailService emailService,
    ILogger<AuthController> logger)
{
    _userManager = userManager;
    _signInManager = signInManager;
    _emailService = emailService;
    _logger = logger;
}

    // REGISTER
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (await _userManager.FindByEmailAsync(request.Email) != null)
        {
            return BadRequest(new
            {
                message = "An account with this email already exists."
            });
        }

        if (await _userManager.FindByNameAsync(request.Username) != null)
        {
            return BadRequest(new
            {
                message = "This username is already taken."
            });
        }

        var user = new ApplicationUser
        {
            UserName = request.Username.Trim(),
            Email = request.Email.Trim(),
            DisplayName = request.FirstName.Trim()
        };

        var result = await _userManager.CreateAsync(
            user,
            request.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                errors = result.Errors.Select(error => error.Description)
            });
        }

        await _signInManager.SignInAsync(user, isPersistent: true);

        return Ok(new
        {
            message = "Your Tyrone AI account has been created successfully.",
            firstName = user.DisplayName,
            username = user.UserName,
            email = user.Email,
            authenticated = true
        });
    }

    // LOGIN WITH USERNAME OR EMAIL
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var identity = request.Identity.Trim();

        var user = await _userManager.FindByNameAsync(identity);

        if (user == null)
        {
            user = await _userManager.FindByEmailAsync(identity);
        }

        if (user == null)
        {
            return Unauthorized(new
            {
                message = "Invalid username/email or password."
            });
        }

        var result = await _signInManager.PasswordSignInAsync(
            user.UserName!,
            request.Password,
            isPersistent: true,
            lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            return Unauthorized(new
            {
                message = "Invalid username/email or password."
            });
        }

        return Ok(new
        {
            message = "Welcome back to Tyrone AI.",
            firstName = user.DisplayName,
            username = user.UserName,
            email = user.Email,
            authenticated = true
        });
    }

    // RESET PASSWORD
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(
            request.Email.Trim());

        if (user == null)
        {
            return BadRequest(new
            {
                message = "This password reset link is invalid or has expired."
            });
        }

        try
        {
            var decodedToken = Encoding.UTF8.GetString(
                WebEncoders.Base64UrlDecode(request.Token));

            var result = await _userManager.ResetPasswordAsync(
                user,
                decodedToken,
                request.NewPassword);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    errors = result.Errors.Select(error => error.Description)
                });
            }

            return Ok(new
            {
                message = "Your password has been successfully reset. You can now sign in."
            });
        }
        catch (FormatException)
        {
            return BadRequest(new
            {
                message = "This password reset link is invalid or has expired."
            });
        }
    }

public class ResetPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}


// FORGOT PASSWORD
[HttpPost("forgot-password")]
public async Task<IActionResult> ForgotPassword(
    [FromBody] ForgotPasswordRequest request)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);

    var response = new
    {
        message = "If an account exists for that email, a password recovery link will be sent."
    };

    var user = await _userManager.FindByEmailAsync(
        request.Email.Trim());

    // Do not reveal whether an email is registered.
    if (user == null)
        return Ok(response);

    var token = await _userManager.GeneratePasswordResetTokenAsync(user);

    var encodedToken = WebEncoders.Base64UrlEncode(
        Encoding.UTF8.GetBytes(token));

    var resetUrl =
        $"{Request.Scheme}://{Request.Host}/pages/reset-password.html" +
        $"?email={Uri.EscapeDataString(user.Email!)}" +
        $"&token={Uri.EscapeDataString(encodedToken)}";

    try
    {
        await _emailService.SendPasswordResetEmailAsync(
            user.Email!,
            resetUrl);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to send password recovery email.");

        return StatusCode(500, new
        {
            message = "We couldn't send your recovery email right now. Please try again later."
        });
    }

    return Ok(response);
}

    // LOGOUT
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();

        return Ok(new
        {
            message = "You have been signed out."
        });
    }

    // CURRENT AUTHENTICATED USER
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
            return Unauthorized();

        return Ok(new
        {
            firstName = user.DisplayName,
            username = user.UserName,
            email = user.Email,
            authenticated = true
        });
    }
}
// FORGOT PASSWORD REQUEST
public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
// REGISTRATION REQUEST
public class RegisterRequest
{
    [Required]
    [StringLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(30, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
}

// LOGIN REQUEST
public class LoginRequest
{
    [Required]
    public string Identity { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
