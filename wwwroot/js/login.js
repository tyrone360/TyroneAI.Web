
document.addEventListener("DOMContentLoaded", () => {
    /* =====================================
       AUTHENTICATION ELEMENTS
    ===================================== */

    const signInTab = document.getElementById("signInTab");
    const registerTab = document.getElementById("registerTab");
    const signInForm = document.getElementById("signInForm");
    const registerForm = document.getElementById("registerForm");
    const authTitle = document.getElementById("authTitle");
    const authDescription = document.getElementById("authDescription");
    const authMessage = document.getElementById("authMessage");
    const authPage = document.querySelector(".auth-page");

    if (!signInTab || !registerTab || !signInForm || !registerForm) {
        return;
    }

    let authenticationInProgress = false;

    function showMessage(message) {
        if (authMessage) {
            authMessage.textContent = message;
        }
    }

    function showSignIn() {
        if (authenticationInProgress) return;

        signInTab.classList.add("active");
        registerTab.classList.remove("active");

        signInForm.hidden = false;
        registerForm.hidden = true;

        if (authTitle) authTitle.textContent = "Welcome back.";

        if (authDescription) {
            authDescription.textContent =
                "Sign in to continue your experience.";
        }

        showMessage("");
    }

    function showRegister() {
        if (authenticationInProgress) return;

        registerTab.classList.add("active");
        signInTab.classList.remove("active");

        registerForm.hidden = false;
        signInForm.hidden = true;

        if (authTitle) authTitle.textContent = "Create your account.";

        if (authDescription) {
            authDescription.textContent =
                "Join Tyrone AI and make it your own.";
        }

        showMessage("");
    }

    /* =====================================
       API REQUEST HELPER
    ===================================== */

    async function sendRequest(url, data) {
        const response = await fetch(url, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errors = result.errors
                ? result.errors.join(" ")
                : "";

            throw new Error(
                result.message ||
                errors ||
                "Something went wrong. Please try again."
            );
        }

        return result;
    }

    /* =====================================
       SUCCESSFUL AUTHENTICATION TRANSITION
    ===================================== */

    function enterDashboard(message) {
        if (authenticationInProgress) return;

        authenticationInProgress = true;
        stopSlideshow();

        showMessage(message);

        document.querySelectorAll(".auth-submit").forEach(button => {
            button.disabled = true;
        });

        signInTab.disabled = true;
        registerTab.disabled = true;

        if (authPage) {
            authPage.classList.add("auth-exit");
        }

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            window.location.replace("/index.html");
            return;
        }

        let navigationStarted = false;

        function navigate() {
            if (navigationStarted) return;
            navigationStarted = true;

            window.location.replace("/index.html");
        }

        const handleTransitionEnd = event => {
            if (
                event.target === authPage &&
                event.propertyName === "transform"
            ) {
                clearTimeout(fallbackTimer);
                authPage.removeEventListener(
                    "transitionend",
                    handleTransitionEnd
                );

                navigate();
            }
        };

        if (authPage) {
            authPage.addEventListener(
                "transitionend",
                handleTransitionEnd
            );
        }

        const fallbackTimer = setTimeout(() => {
            if (authPage) {
                authPage.removeEventListener(
                    "transitionend",
                    handleTransitionEnd
                );
            }

            navigate();
        }, 1100);
    }

    /* =====================================
       TAB NAVIGATION
    ===================================== */

    signInTab.addEventListener("click", showSignIn);
    registerTab.addEventListener("click", showRegister);

    /* =====================================
       SHOW / HIDE PASSWORD
    ===================================== */

    document.querySelectorAll("[data-password-toggle]").forEach(button => {
        button.addEventListener("click", () => {
            const inputId = button.dataset.passwordToggle;
            const passwordInput = document.getElementById(inputId);

            if (!passwordInput) return;

            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";
            button.textContent = isPassword ? "Hide" : "Show";

            button.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );

            button.setAttribute(
                "aria-pressed",
                String(isPassword)
            );
        });
    });

    /* =====================================
       PASSWORD STRENGTH
    ===================================== */

    const registerPassword = document.getElementById("registerPassword");
    const strengthBar = document.getElementById("passwordStrengthBar");
    const strengthText = document.getElementById("passwordStrengthText");

    function updatePasswordStrength() {
        if (!registerPassword || !strengthBar || !strengthText) return;

        const password = registerPassword.value;

        strengthBar.style.width = "0%";
        strengthBar.dataset.strength = "empty";

        if (!password) {
            strengthText.textContent = "Not entered";
            return;
        }

        let score = 0;

        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        let strength;
        let percentage;

        if (score <= 1) {
            strength = "Weak";
            percentage = 25;
        } else if (score === 2) {
            strength = "Fair";
            percentage = 45;
        } else if (score === 3) {
            strength = "Good";
            percentage = 70;
        } else {
            strength = "Strong";
            percentage = 100;
        }

        strengthText.textContent = strength;
        strengthBar.style.width = `${percentage}%`;
        strengthBar.dataset.strength = strength.toLowerCase();
    }

    registerPassword?.addEventListener("input", updatePasswordStrength);

    /* =====================================
       SIGN IN
    ===================================== */

    signInForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (authenticationInProgress) return;

        const submitButton =
            signInForm.querySelector('button[type="submit"]');

        const identity =
            document.getElementById("loginIdentity").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        if (!submitButton) return;

        submitButton.disabled = true;
        showMessage("Authenticating your account...");

        try {
            await sendRequest("/api/Auth/login", {
                identity,
                password
            });

            enterDashboard("Authentication successful. Welcome to Tyrone AI.");

        } catch (error) {
            showMessage(error.message);
            submitButton.disabled = false;
        }
    });

    /* =====================================
       REGISTRATION
    ===================================== */

    registerForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (authenticationInProgress) return;

        const submitButton =
            registerForm.querySelector('button[type="submit"]');

        const firstName =
            document.getElementById("registerFirstName").value.trim();

        const username =
            document.getElementById("registerUsername").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            showMessage("Your passwords do not match.");
            return;
        }

        if (!submitButton) return;

        submitButton.disabled = true;
        showMessage("Creating your Tyrone AI account...");

        try {
            await sendRequest("/api/Auth/register", {
                firstName,
                username,
                email,
                password
            });

            enterDashboard("Your account is ready. Welcome to Tyrone AI.");

        } catch (error) {
            showMessage(error.message);
            submitButton.disabled = false;
        }
    });

    /* =====================================
       FEATURE SHOWCASE SLIDESHOW
    ===================================== */

    const showcase = document.querySelector(".auth-showcase");

    const slides = Array.from(
        document.querySelectorAll(".auth-feature-slide")
    );

    const slideDots = Array.from(
        document.querySelectorAll(".auth-feature-dot")
    );

    let currentSlide = 0;
    let slideshowTimer = null;

    const slideDuration = 6000;

    function showSlide(index) {
        if (!slides.length) return;

        currentSlide = (index + slides.length) % slides.length;

        slides.forEach((slide, slideIndex) => {
            const active = slideIndex === currentSlide;

            slide.classList.toggle("active", active);
            slide.setAttribute("aria-hidden", String(!active));
        });

        slideDots.forEach((dot, dotIndex) => {
            const active = dotIndex === currentSlide;

            dot.classList.toggle("active", active);
            dot.setAttribute(
                "aria-current",
                active ? "true" : "false"
            );
        });
    }

    function stopSlideshow() {
        if (slideshowTimer) {
            clearInterval(slideshowTimer);
            slideshowTimer = null;
        }
    }

    function startSlideshow() {
        stopSlideshow();

        if (
            slides.length < 2 ||
            document.hidden ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            return;
        }

        slideshowTimer = setInterval(() => {
            showSlide(currentSlide + 1);
        }, slideDuration);
    }

    function changeSlide(index) {
        showSlide(index);
        startSlideshow();
    }

    slideDots.forEach(dot => {
        dot.addEventListener("click", () => {
            const index = Number(dot.dataset.authSlideTo);

            if (Number.isInteger(index)) {
                changeSlide(index);
            }
        });
    });

    if (showcase) {
        showcase.addEventListener("mouseenter", stopSlideshow);
        showcase.addEventListener("mouseleave", startSlideshow);
        showcase.addEventListener("focusin", stopSlideshow);
        showcase.addEventListener("focusout", startSlideshow);
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopSlideshow();
        } else {
            startSlideshow();
        }
    });

    /* =====================================
       MOBILE TOUCH SWIPE
    ===================================== */

    let touchStartX = 0;
    let touchStartY = 0;

    if (showcase) {
        showcase.addEventListener("touchstart", event => {
            const touch = event.changedTouches[0];

            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: true });

        showcase.addEventListener("touchend", event => {
            const touch = event.changedTouches[0];

            const distanceX = touch.clientX - touchStartX;
            const distanceY = touch.clientY - touchStartY;

            if (
                Math.abs(distanceX) > 55 &&
                Math.abs(distanceX) > Math.abs(distanceY)
            ) {
                changeSlide(
                    distanceX < 0
                        ? currentSlide + 1
                        : currentSlide - 1
                );
            }
        }, { passive: true });
    }

    /* =====================================
       INITIALISE
    ===================================== */

    showSlide(0);
    startSlideshow();
});
