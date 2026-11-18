
document.addEventListener("DOMContentLoaded", async () => {
    const welcomeScreen = document.getElementById("welcomeScreen");
    const swipeArea = document.getElementById("swipeArea");

    const slides = Array.from(
        document.querySelectorAll(".welcome-slide")
    );

    const slideDots = Array.from(
        document.querySelectorAll(".slide-dot")
    );

    const previousButton = document.getElementById("previousSlide");
    const nextButton = document.getElementById("nextSlide");
    const showcase = document.querySelector(".welcome-showcase");

    if (!welcomeScreen || !swipeArea) return;

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    // =====================================
    // AUTHENTICATION CHECK
    // =====================================

    try {
        const response = await fetch("/api/Auth/me", {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Accept": "application/json"
            }
        });

        if (response.ok) {
            window.location.replace("/index.html");
            return;
        }

        if (response.status !== 401) {
            console.warn(
                "Authentication check returned:",
                response.status
            );
        }

        // 401 means the visitor is not signed in.
        // Keep the welcome page visible.

    } catch (error) {
        console.warn("Unable to check existing session:", error);
        // Keep the welcome page accessible if the API is unavailable.
    }

    // =====================================
    // WELCOME SLIDESHOW
    // =====================================

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

            if (active) {
                dot.setAttribute("aria-current", "true");
            } else {
                dot.removeAttribute("aria-current");
            }
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
            prefersReducedMotion.matches ||
            document.hidden
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

    if (previousButton) {
        previousButton.addEventListener("click", () => {
            changeSlide(currentSlide - 1);
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            changeSlide(currentSlide + 1);
        });
    }

    slideDots.forEach(dot => {
        dot.addEventListener("click", () => {
            const index = Number(dot.dataset.slideTo);

            if (Number.isInteger(index)) {
                changeSlide(index);
            }
        });
    });

    // Pause while the user interacts with the showcase.
    if (showcase) {
        showcase.addEventListener("mouseenter", stopSlideshow);
        showcase.addEventListener("mouseleave", startSlideshow);

        showcase.addEventListener("focusin", stopSlideshow);
        showcase.addEventListener("focusout", startSlideshow);
    }

    // Pause when the browser tab is hidden.
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopSlideshow();
        } else {
            startSlideshow();
        }
    });

    prefersReducedMotion.addEventListener("change", () => {
        if (prefersReducedMotion.matches) {
            stopSlideshow();
        } else {
            startSlideshow();
        }
    });

    showSlide(0);
    startSlideshow();

    // =====================================
    // CINEMATIC SLIDE-UP ENTRANCE
    // =====================================

    let entered = false;
    let navigationStarted = false;
    let entranceTimer = null;

    function navigateToLogin() {
        if (navigationStarted) return;

        navigationStarted = true;
        window.location.replace("/pages/login.html");
    }

    function enterTyrone() {
        if (entered) return;

        entered = true;
        stopSlideshow();

        swipeArea.disabled = true;
        swipeArea.setAttribute("aria-disabled", "true");
        swipeArea.setAttribute("aria-label", "Entering Tyrone AI");

        welcomeScreen.classList.add("exit");

        // Reduced-motion users should not have to wait for animation.
        if (prefersReducedMotion.matches) {
            navigateToLogin();
            return;
        }

        // Navigate when the full-screen slide-up finishes.
        const handleTransitionEnd = event => {
            if (
                event.target === welcomeScreen &&
                event.propertyName === "transform"
            ) {
                clearTimeout(entranceTimer);
                welcomeScreen.removeEventListener(
                    "transitionend",
                    handleTransitionEnd
                );

                navigateToLogin();
            }
        };

        welcomeScreen.addEventListener(
            "transitionend",
            handleTransitionEnd
        );

        // Fallback in case transitionend does not fire.
        entranceTimer = setTimeout(() => {
            welcomeScreen.removeEventListener(
                "transitionend",
                handleTransitionEnd
            );

            navigateToLogin();
        }, 1200);
    }

    // =====================================
    // ENTER BUTTON
    // =====================================

    swipeArea.addEventListener("click", enterTyrone);

    // =====================================
    // SWIPE GESTURES
    // =====================================

    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerActive = false;

    welcomeScreen.addEventListener("pointerdown", event => {
        if (entered || event.pointerType === "mouse") return;

        pointerStartX = event.clientX;
        pointerStartY = event.clientY;
        pointerActive = true;
    });

    welcomeScreen.addEventListener("pointerup", event => {
        if (!pointerActive || entered) return;

        const distanceX = event.clientX - pointerStartX;
        const distanceY = pointerStartY - event.clientY;

        pointerActive = false;

        // Swipe up anywhere to enter Tyrone AI.
        if (
            distanceY >= 75 &&
            distanceY > Math.abs(distanceX) * 1.2
        ) {
            enterTyrone();
            return;
        }

        // Swipe horizontally to change slides.
        if (
            Math.abs(distanceX) >= 55 &&
            Math.abs(distanceX) > distanceY
        ) {
            changeSlide(
                distanceX < 0
                    ? currentSlide + 1
                    : currentSlide - 1
            );
        }
    });

    welcomeScreen.addEventListener("pointercancel", () => {
        pointerActive = false;
    });

    // =====================================
    // KEYBOARD ACCESSIBILITY
    // =====================================

    swipeArea.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            enterTyrone();
        }
    });

});
