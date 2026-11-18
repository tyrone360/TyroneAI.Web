
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("forgotPasswordForm");
    const emailInput = document.getElementById("recoveryEmail");
    const message = document.getElementById("recoveryMessage");

    if (!form || !emailInput || !message) return;

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const email = emailInput.value.trim();

        if (!email) {
            message.textContent = "Please enter your email address.";
            message.style.color = "#ff8585";
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        submitButton.disabled = true;
        submitButton.textContent = "Sending Recovery Link...";
        message.textContent = "";
        message.classList.remove("is-success");

        try {
            const response = await fetch("/api/Auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                message.textContent =
                    data.message ||
                    "We couldn't process your request. Please try again later.";

                message.style.color = "#ff8585";
                return;
            }

            // SUCCESS EXPERIENCE
            message.textContent =
                data.message ||
                "If an account exists for that email, a recovery link will be sent.";

            message.classList.add("is-success");
            message.style.color = "#70dfa5";

            // Hide the form after a successful request.
            form.reset();
            form.style.display = "none";

        } catch (error) {
            console.error("Forgot password error:", error);

            message.textContent =
                "Unable to connect to Tyrone AI. Please try again.";

            message.style.color = "#ff8585";

        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });
});
