
/* =========================================
   TYRONE AI — SETTINGS ENGINE
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    // Elements
    const themeButton = $("#themeButton");
    const settingsTheme = $("#settingsTheme");
    const settingsAccent = $("#settingsAccent");
    const settingsFont = $("#settingsFont");
    const settingsDisplayName = $("#settingsDisplayName");
    const spokenReplies = $("#spokenReplies");
    const saveButton = $("#saveSettingsButton");

    // Settings storage
    const storage = {
        theme: "tyrone-theme",
        accent: "tyrone-accent",
        font: "tyrone-font",
        name: "tyrone-display-name",
        voice: "tyrone-voice-replies"
    };

    // Appearance options
    const accents = {
        blue: "#5287ff",
        purple: "#9b72f2",
        cyan: "#22c5d8",
        green: "#20b889",
        orange: "#f59e42"
    };

    const fonts = {
        system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        modern: '"Inter", "Segoe UI", sans-serif',
        classic: 'Georgia, "Times New Roman", serif'
    };

    // Apply theme
    function applyTheme(theme) {
        theme = theme === "light" ? "light" : "dark";

        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(storage.theme, theme);

        if (settingsTheme) settingsTheme.value = theme;

        if (themeButton) {
            themeButton.textContent = theme === "dark" ? "☼" : "☾";
        }
    }

    // Apply accent colour
    function applyAccent(accent) {
        if (!accents[accent]) accent = "blue";

        document.documentElement.style.setProperty(
            "--accent",
            accents[accent]
        );

        localStorage.setItem(storage.accent, accent);

        if (settingsAccent) settingsAccent.value = accent;
    }

    // Apply font
    function applyFont(font) {
        if (!fonts[font]) font = "system";

        document.body.style.fontFamily = fonts[font];

        localStorage.setItem(storage.font, font);

        if (settingsFont) settingsFont.value = font;
    }

    // Load saved appearance
    applyTheme(localStorage.getItem(storage.theme) || "dark");
    applyAccent(localStorage.getItem(storage.accent) || "blue");
    applyFont(localStorage.getItem(storage.font) || "system");

    // Theme button
    themeButton?.addEventListener("click", () => {
        const current =
            document.documentElement.getAttribute("data-theme");

        applyTheme(current === "dark" ? "light" : "dark");
    });

    settingsTheme?.addEventListener("change", () => {
        applyTheme(settingsTheme.value);
    });

    settingsAccent?.addEventListener("change", () => {
        applyAccent(settingsAccent.value);
    });

    settingsFont?.addEventListener("change", () => {
        applyFont(settingsFont.value);
    });

    // Settings tabs
    const tabs = $$("[data-settings-tab]");
    const panels = $$(".settings-content");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const selected = tab.dataset.settingsTab;

            tabs.forEach((item) => {
                item.classList.toggle("active", item === tab);
            });

            panels.forEach((panel) => {
                panel.classList.toggle(
                    "active",
                    panel.id === selected
                );
            });
        });
    });

    // Personalisation
    if (settingsDisplayName) {
        settingsDisplayName.value =
            localStorage.getItem(storage.name) || "";
    }

    // Spoken replies preference
    if (spokenReplies) {
        spokenReplies.checked =
            localStorage.getItem(storage.voice) !== "false";

        if (!("speechSynthesis" in window)) {
            spokenReplies.disabled = true;
        }
    }

    // Save preferences
    saveButton?.addEventListener("click", () => {
        const name = settingsDisplayName?.value.trim() || "";

        if (name.length > 40) {
            alert("Your display name must be 40 characters or fewer.");
            return;
        }

        localStorage.setItem(storage.name, name);

        if (spokenReplies) {
            localStorage.setItem(
                storage.voice,
                String(spokenReplies.checked)
            );
        }

        saveButton.textContent = "Preferences saved ✓";

        setTimeout(() => {
            saveButton.textContent = "Save preferences";
        }, 2000);
    });

    console.log("Tyrone AI Settings initialized.");
});
