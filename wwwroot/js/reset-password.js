
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resetPasswordForm");
    const passwordInput = document.getElementById("newPassword");
    const confirmInput = document.getElementById("confirmNewPassword");
    const message = document.getElementById("resetPasswordMessage");

    if (!form || !passwordInput || !confirmInput || !message) return;

    // ----------------------------------
    // RECOVERY TOKEN
    // ----------------------------------

    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const token = params.get("token");

    if (!email || !token) {
        showMessage(
            "This password reset link is incomplete. Please request a new recovery link.",
            false
        );

        form.style.display = "none";
        return;
    }

    // ----------------------------------
    // MESSAGE HANDLER
    // ----------------------------------

    function showMessage(text, success = false) {
        message.textContent = text;
        message.classList.toggle("is-success", success);
        message.style.color = success ? "#70dfa5" : "#ff8585";
    }

    // ----------------------------------
    // SHOW / HIDE PASSWORD
    // ----------------------------------

    document.querySelectorAll("[data-password-toggle]").forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.passwordToggle;
            const input = document.getElementById(targetId);

            if (!input) return;

            const isVisible = input.type === "text";

            input.type = isVisible ? "password" : "text";
            button.textContent = isVisible ? "Show" : "Hide";
            button.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
            button.setAttribute("aria-pressed", String(!isVisible));
        });
    });

    // ----------------------------------
    // PASSWORD MATCHING
    // ----------------------------------

    confirmInput.addEventListener("input", () => {
        if (!confirmInput.value) {
            confirmInput.setCustomValidity("");
            return;
        }

        if (passwordInput.value !== confirmInput.value) {
            confirmInput.setCustomValidity("Passwords do not match.");
        } else {
            confirmInput.setCustomValidity("");
        }
    });

    passwordInput.addEventListener("input", () => {
        confirmInput.setCustomValidity("");

        if (confirmInput.value && passwordInput.value !== confirmInput.value) {
            confirmInput.setCustomValidity("Passwords do not match.");
        }
    });

    // ----------------------------------
    // SUBMIT RESET REQUEST
    // ----------------------------------

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const newPassword = passwordInput.value;
        const confirmPassword = confirmInput.value;

        if (newPassword.length < 8) {
            showMessage("Your password must contain at least 8 characters.");
            passwordInput.focus();
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage("Your passwords do not match.");
            confirmInput.focus();
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');

        if (!submitButton) return;

        const originalButtonContent = submitButton.innerHTML;

        submitButton.disabled = true;
        submitButton.textContent = "Updating Password...";
        showMessage("");

        try {
            const response = await fetch("/api/Auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    token,
                    newPassword
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMessage = data.message ||
                    (Array.isArray(data.errors)
                        ? data.errors.join(" ")
                        : "We couldn't update your password. Your recovery link may have expired.");

                showMessage(errorMessage);
                return;
            }

            // ----------------------------------
            // SUCCESS EXPERIENCE
            // ----------------------------------

            form.style.display = "none";

            showMessage(
                data.message ||
                "Your password has been successfully updated. You can now sign in.",
                true
            );

            const loginLink = document.createElement("a");
            loginLink.href = "/pages/login.html";
            loginLink.className = "recovery-submit";
            loginLink.style.display = "flex";
            loginLink.style.justifyContent = "center";
            loginLink.style.alignItems = "center";
            loginLink.style.textDecoration = "none";
            loginLink.style.marginTop = "20px";
            loginLink.textContent = "Continue to Sign In";

            message.insertAdjacentElement("afterend", loginLink);

        } catch (error) {
            console.error("Reset password error:", error);

            showMessage(
                "Unable to connect to Tyrone AI. Please check your connection and try again."
            );

        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonContent;
        }
    });
});
