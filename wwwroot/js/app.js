
/* =========================================
   TYRONE AI — INTERACTION ENGINE
   Chat, conversations, themes and navigation
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    // =====================================
    // AUTHENTICATION GATE
    // =====================================

    let authenticatedUser = null;

    try {
        const authResponse = await fetch("/api/Auth/me", {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!authResponse.ok) {
            window.location.replace("/welcome.html");
            return;
        }

        authenticatedUser = await authResponse.json();

    } catch (error) {
        console.error("Authentication check failed:", error);
        window.location.replace("/welcome.html");
        return;
    }


    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    // Main interface elements
    const themeButton = $("#themeButton");
    const menuButton = $("#menuButton");
    const historyPage = $("#historyPage");
    const discoverPage = $("#discoverPage");
    const sidebar = $("#sidebar");
    const welcomeSection = $("#welcomeSection");
    const settingsPage = $("#settingsPage");
    const companionSection = $("#companionSection");
    const quickSection = $("#quickSection");
    const chatPanel = $("#chatPanel");
    const chatMessages = $("#chatMessages");

    const voiceButton = $("#voiceButton");
    const voiceReplyButton = $("#voiceReplyButton");
    const voiceReplyLabel = $("#voiceReplyLabel");

    const chatForm = $("#chatForm");
    const messageInput = $("#messageInput");
    const sendButton = $("#sendButton");
    const typingIndicator = $("#typingIndicator");
    const chatTitle = $("#chatTitle");
    const conversationList = $("#conversationList");
    const breadcrumbTitle = $("#breadcrumbTitle");
    const footer = $("#footer");

    let activeConversationId = null;
    let isSending = false;
    let isListening = false;
    let isSpeaking = false;

    // =====================================
    // TYRONE AVATAR — ACTIVITY STATES
    // =====================================


// =====================================
// TYRONE AI — SYNCHRONISED AVATAR STATES
// =====================================

const tyroneAvatar = $("#tyroneAvatar");
const chatTyroneAvatar = $("#chatTyroneAvatar");
const chatAvatarActivity = $("#chatAvatarActivity");
const tyroneVoiceWaveform = $("#tyroneVoiceWaveform");

function setAvatarState(state) {
if (tyroneVoiceWaveform) {
    tyroneVoiceWaveform.classList.toggle(
        "is-active",
        state === "speaking"
    );
}
    // Update main home-screen avatar
    if (tyroneAvatar) {
        tyroneAvatar.classList.remove(
            "is-listening",
            "is-thinking",
            "is-speaking"
        );

        if (state !== "idle") {
            tyroneAvatar.classList.add(`is-${state}`);
        }

        tyroneAvatar.dataset.state = state;
    }

    // Update chat-header avatar
    if (chatTyroneAvatar) {
        chatTyroneAvatar.dataset.state = state;
    }

    // Update activity text
    if (chatAvatarActivity) {
        const activityLabels = {
            idle: "Your AI companion",
            listening: "Listening to you...",
            thinking: "Thinking...",
            speaking: "Speaking..."
        };

        chatAvatarActivity.textContent =
            activityLabels[state] || "Your AI companion";
    }
}


    function updateAvatarState() {
        if (isListening) {
            setAvatarState("listening");
        } else if (isSpeaking) {
            setAvatarState("speaking");
        } else if (isSending) {
            setAvatarState("thinking");
        } else {
            setAvatarState("idle");
        }
    }

    // =====================================
    // API HELPER
    // =====================================

    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            ...options,
            headers: {
                "Accept": "application/json",
                ...(options.body ? {
                    "Content-Type": "application/json"
                } : {}),
                ...options.headers
            }
        });

        if (response.status === 204) {
            return null;
        }

        const responseText = await response.text();
        let data = null;

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch {
                data = null;
            }
        }

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "Your session has expired or you are not signed in. Please sign in again."
                );
            }

            throw new Error(
                data?.message ||
                data?.title ||
                `Request failed (${response.status}). Please try again.`
            );
        }

        return data;
    }


// =====================================
// THEME & APPEARANCE SETTINGS
// =====================================

const settingsTheme = $("#settingsTheme");
const settingsAccent = $("#settingsAccent");
const settingsFont = $("#settingsFont");

const savedTheme =
    localStorage.getItem("tyrone-theme") || "dark";

const savedAccent =
    localStorage.getItem("tyrone-accent") || "blue";

const savedFont =
    localStorage.getItem("tyrone-font") || "system";

const accentColours = {
    blue: "#5287ff",
    purple: "#9b72f2",
    cyan: "#22c5d8",
    green: "#20b889",
    orange: "#f59e42"
};
const accentNames = {
    blue: "Electric Blue",
    purple: "Purple",
    cyan: "Cyan",
    green: "Emerald",
    orange: "Orange"
};
const fontStyles = {
    system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    modern: '"Inter", "Segoe UI", sans-serif',
    classic: 'Georgia, "Times New Roman", serif'
};
// Global Appearance Panel
const globalAppearanceToggle = $("#globalAppearanceToggle");
const globalAppearancePanel = $("#globalAppearancePanel");
const closeAppearancePanel = $("#closeAppearancePanel");

const globalThemeSelect = $("#globalThemeSelect");
const accentSwatches = $("#accentSwatches");
const accentSelectedLabel = $("#accentSelectedLabel");
const globalFontSelect = $("#globalFontSelect");
function updateThemeIcon(theme) {
    if (themeButton) {
        themeButton.textContent =
            theme === "dark" ? "☼" : "☾";
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    localStorage.setItem("tyrone-theme", theme);

    if (settingsTheme) {
        settingsTheme.value = theme;
    }
if (globalThemeSelect) {
    globalThemeSelect.value = theme;
}
    updateThemeIcon(theme);
}
function updateAccentSwatches(accent) {
    accentSwatches?.querySelectorAll(".accent-swatch").forEach((swatch) => {
        const isActive = swatch.dataset.accent === accent;

        swatch.classList.toggle("active", isActive);
        swatch.setAttribute("aria-pressed", String(isActive));
    });

    if (accentSelectedLabel) {
        accentSelectedLabel.textContent = accentNames[accent] || "Electric Blue";
    }
}
function applyAccent(accent) {
    const colour = accentColours[accent] || accentColours.blue;

    document.documentElement.style.setProperty(
        "--accent",
        colour

    );

    localStorage.setItem("tyrone-accent", accent);

    if (settingsAccent) {
        settingsAccent.value = accent;
    }
    updateAccentSwatches(accent);
}

function applyFont(font) {
    const selectedFont = fontStyles[font] || fontStyles.system;

    document.body.style.fontFamily = selectedFont;

    localStorage.setItem("tyrone-font", font);

    if (settingsFont) {
        settingsFont.value = font;
    }
}

// Apply saved preferences
applyTheme(savedTheme);
applyAccent(savedAccent);
applyFont(savedFont);

// Theme button
themeButton?.addEventListener("click", () => {
    const currentTheme =
        document.documentElement.getAttribute("data-theme");

    applyTheme(currentTheme === "dark" ? "light" : "dark");
});

// Settings theme selector
settingsTheme?.addEventListener("change", () => {
    applyTheme(settingsTheme.value);
});

// Settings accent selector
settingsAccent?.addEventListener("change", () => {
    applyAccent(settingsAccent.value);
});

// Settings font selector
settingsFont?.addEventListener("change", () => {
    applyFont(settingsFont.value);
});
// Global Appearance Panel — Open and Close

globalAppearanceToggle?.addEventListener("click", () => {
    if (!globalAppearancePanel) return;

    globalAppearancePanel.hidden = !globalAppearancePanel.hidden;

    globalAppearanceToggle.setAttribute(
        "aria-expanded",
        String(!globalAppearancePanel.hidden)
    );
});

closeAppearancePanel?.addEventListener("click", () => {
    if (globalAppearancePanel) {
        globalAppearancePanel.hidden = true;
    }

    globalAppearanceToggle?.setAttribute(
        "aria-expanded",
        "false"
    );
});
// Global Appearance — Apply Preferences

accentSwatches?.querySelectorAll(".accent-swatch").forEach((swatch) => {
    swatch.addEventListener("click", () => {
        const accent = swatch.dataset.accent;

        if (!accentColours[accent]) return;

        applyAccent(accent);
    });
});

// Load saved preferences into global selectors
if (globalThemeSelect) {
    globalThemeSelect.value = savedTheme;
}


if (globalFontSelect) {
    globalFontSelect.value = savedFont;
}

// Theme selection
globalThemeSelect?.addEventListener("change", () => {
    applyTheme(globalThemeSelect.value);
});



// Typography selection
globalFontSelect?.addEventListener("change", () => {
    applyFont(globalFontSelect.value);
});

    // =====================================
    // DATE AND ACCOUNT
    // =====================================

    const currentDate = $("#currentDate");

    if (currentDate) {
        currentDate.textContent = new Intl.DateTimeFormat(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(new Date());
    }

  function loadCurrentUser() {
    const displayName =
        authenticatedUser?.firstName ||
        authenticatedUser?.displayName ||
        "User";

    const userName = $("#userName");
    const sidebarName = $("#sidebarName");

    if (userName) {
        userName.textContent = `, ${displayName}`;
    }

    if (sidebarName) {
        sidebarName.textContent = displayName;
    }
}

// =====================================
// TYRONE AI — ACCOUNT MENU
// =====================================

const accountMenuButton = $("#accountMenuButton");
const accountDropdown = $("#accountDropdown");
const accountFullName = $("#accountFullName");
const accountUsername = $("#accountUsername");
const accountEmail = $("#accountEmail");
const sidebarUsername = $("#sidebarUsername");
const signOutButton = $("#signOutButton");

// Display the signed-in user's account information.
if (authenticatedUser) {
    const firstName =
        authenticatedUser.firstName ||
        authenticatedUser.displayName ||
        "User";

    const username = authenticatedUser.username || "Username unavailable";
    const email = authenticatedUser.email || "Email unavailable";

    if (accountFullName) accountFullName.textContent = firstName;
    if (accountUsername) accountUsername.textContent = `@${username}`;
    if (accountEmail) accountEmail.textContent = email;
    if (sidebarUsername) sidebarUsername.textContent = `@${username}`;
}

// Open and close the account dropdown.
if (accountMenuButton && accountDropdown) {
    accountMenuButton.addEventListener("click", () => {
        const isOpening = accountDropdown.hidden;

        accountDropdown.hidden = !isOpening;
        accountMenuButton.setAttribute("aria-expanded", String(isOpening));
    });

    // Close the dropdown when clicking elsewhere.
    document.addEventListener("click", (event) => {
        const accountMenu = $("#accountMenu");

        if (accountMenu && !accountMenu.contains(event.target)) {
            accountDropdown.hidden = true;
            accountMenuButton.setAttribute("aria-expanded", "false");
        }
    });
}

// Sign out of Tyrone AI.
if (signOutButton) {
    signOutButton.addEventListener("click", async () => {
        signOutButton.disabled = true;
        signOutButton.textContent = "Signing out...";

        try {
            const response = await fetch("/api/Auth/logout", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Unable to sign out. Please try again.");
            }

            window.location.replace("/welcome.html");

        } catch (error) {
            console.error("Sign-out error:", error);
            alert(error.message || "Something went wrong while signing out.");

            signOutButton.disabled = false;
            signOutButton.innerHTML = "<span>↪</span> Sign Out";
        }
    });
}

    // =====================================
    // MOBILE SIDEBAR
    // =====================================

    menuButton?.addEventListener("click", () => {
        sidebar?.classList.toggle("open");
    });

    document.addEventListener("click", (event) => {
        if (!sidebar || !menuButton) return;

        const clickedInsideSidebar = sidebar.contains(event.target);
        const clickedMenuButton = menuButton.contains(event.target);

        if (!clickedInsideSidebar && !clickedMenuButton) {
            sidebar.classList.remove("open");
        }
    });

    // =====================================
    // MESSAGE DISPLAY
    // =====================================


function appendMessage(role, content) {
    if (!chatMessages) return;

    const isUser = role === "user";

    const message = document.createElement("div");
    message.className =
        `message ${isUser ? "user-message" : "assistant-message"}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";

    if (isUser) {
        avatar.textContent = "Y";
    } else {
        const avatarImage = document.createElement("img");

        avatarImage.src = "/images/tyrone-avatar.png";
        avatarImage.alt = "Tyrone AI";
        avatarImage.className = "message-avatar-image";

        avatar.appendChild(avatarImage);
    }

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    const name = document.createElement("strong");
    name.textContent = isUser ? "You" : "Tyrone";

    const paragraph = document.createElement("p");
    paragraph.textContent = content;

    messageContent.append(name, paragraph);
    message.append(avatar, messageContent);

    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


    function showWelcomeMessage() {
        if (!chatMessages) return;

        chatMessages.replaceChildren();

        appendMessage(
            "assistant",
            "Hello! I'm Tyrone. What would you like to talk about?"
        );
    }

    function showError(message) {
        appendMessage("assistant", message);
    }

    // =====================================
    // CHAT VIEW
    // =====================================

    function showChatView(title = "New conversation") {
        if (welcomeSection) welcomeSection.hidden = true;
        if (companionSection) companionSection.hidden = true;
        if (quickSection) quickSection.hidden = true;
        if (chatPanel) chatPanel.hidden = false;
        if (discoverPage) discoverPage.hidden = true;
        if (footer) footer.hidden = true;

        if (chatTitle) chatTitle.textContent = title;
        if (breadcrumbTitle) {
            breadcrumbTitle.textContent = "Conversation";
        }

        sidebar?.classList.remove("open");

        setTimeout(() => messageInput?.focus(), 100);
    }


    // =====================================
    // HOME PAGE
    // =====================================

    function showHomeView() {
        if (welcomeSection) welcomeSection.hidden = false;
        if (companionSection) companionSection.hidden = false;
        if (quickSection) quickSection.hidden = false;
        if (chatPanel) chatPanel.hidden = true;
        if (discoverPage) discoverPage.hidden = true;
        if (settingsPage) settingsPage.hidden = true;
        if (historyPage) historyPage.hidden = true;
        if (footer) footer.hidden = false;

        if (breadcrumbTitle) {
            breadcrumbTitle.textContent = "Home";
        }

        sidebar?.classList.remove("open");
    }

    // =====================================
    // SETTINGS PAGE
    // =====================================

    function showSettingsView() {
        if (welcomeSection) welcomeSection.hidden = true;
        if (companionSection) companionSection.hidden = true;
        if (quickSection) quickSection.hidden = true;
        if (chatPanel) chatPanel.hidden = true;
        if (discoverPage) discoverPage.hidden = true;
        if (historyPage) historyPage.hidden = true;
        if (settingsPage) settingsPage.hidden = false;
        if (footer) footer.hidden = true;

        if (breadcrumbTitle) {
            breadcrumbTitle.textContent = "Settings";
        }

        sidebar?.classList.remove("open");
    }
// =====================================
// DISCOVER PAGE
// =====================================

function showDiscoverView() {
    if (welcomeSection) welcomeSection.hidden = true;
    if (companionSection) companionSection.hidden = true;
    if (quickSection) quickSection.hidden = true;
    if (chatPanel) chatPanel.hidden = true;
    if (settingsPage) settingsPage.hidden = true;
    if (historyPage) historyPage.hidden = true;
    if (discoverPage) discoverPage.hidden = false;
    if (footer) footer.hidden = true;

    if (breadcrumbTitle) {
        breadcrumbTitle.textContent = "Discover";
    }

    sidebar?.classList.remove("open");
}
    // =====================================
    // HISTORY PAGE
    // =====================================

    function showHistoryView() {
        if (welcomeSection) welcomeSection.hidden = true;
        if (companionSection) companionSection.hidden = true;
        if (quickSection) quickSection.hidden = true;
        if (discoverPage) discoverPage.hidden = true;
        if (chatPanel) chatPanel.hidden = true;
        if (settingsPage) settingsPage.hidden = true;
        if (historyPage) historyPage.hidden = false;
        if (footer) footer.hidden = true;

        if (breadcrumbTitle) {
            breadcrumbTitle.textContent = "History";
        }

        sidebar?.classList.remove("open");
    }


    // =====================================
    // CONVERSATION LIST
    // =====================================

    async function loadConversations() {
        if (!conversationList) return;

        try {
            const conversations =
                await apiRequest("/api/Conversations");

            conversationList.replaceChildren();

            if (!Array.isArray(conversations) ||
                conversations.length === 0) {

                const empty = document.createElement("p");
                empty.className = "conversation-empty";
                empty.textContent =
                    "Your conversations will appear here.";

                conversationList.appendChild(empty);
                return;
            }

            conversations.forEach((conversation) => {
                const button = document.createElement("button");

                button.type = "button";
                button.className = "conversation-item";
                button.textContent =
                    conversation.title || "New Conversation";

                if (conversation.id === activeConversationId) {
                    button.classList.add("active");
                }

                button.addEventListener("click", () => {
                    loadConversation(conversation.id);
                });

                conversationList.appendChild(button);
            });

        } catch (error) {
            console.warn(
                "Unable to load conversations:",
                error.message
            );
        }
    }

    // =====================================
    // CREATE CONVERSATION
    // =====================================

    async function createConversation() {
        const conversation = await apiRequest(
            "/api/Conversations",
            { method: "POST" }
        );

        if (!conversation?.id) {
            throw new Error(
                "The conversation could not be created."
            );
        }

        activeConversationId = conversation.id;

        showChatView(conversation.title || "New conversation");
        showWelcomeMessage();

        await loadConversations();

        return conversation;
    }
      // =====================================
    // HISTORY PAGE - LOAD CONVERSATIONS
    // =====================================

    async function loadHistory() {
        const historyList = $("#historyList");
        const historyCount = $("#historyCount");
        const historySearch = $("#historySearch");

        if (!historyList) return;

        historyList.replaceChildren();

        const loading = document.createElement("p");
        loading.className = "history-loading";
        loading.textContent = "Loading your conversations...";

        historyList.appendChild(loading);

        try {
            const conversations =
                await apiRequest("/api/Conversations");

            const history = Array.isArray(conversations)
                ? conversations
                : [];

            if (historyCount) {
                historyCount.textContent = history.length;
            }

            const searchTerm =
                historySearch?.value.trim().toLowerCase() || "";

            const filteredHistory = history.filter((conversation) =>
                (conversation.title || "New Conversation")
                    .toLowerCase()
                    .includes(searchTerm)
            );

            historyList.replaceChildren();

            if (filteredHistory.length === 0) {
                const empty = document.createElement("div");
                empty.className = "history-empty";

                const heading = document.createElement("h3");
                heading.textContent = history.length === 0
                    ? "Your history is empty"
                    : "No matching conversations";

                const message = document.createElement("p");
                message.textContent = history.length === 0
                    ? "Start a conversation with Tyrone and it will appear here."
                    : "Try another search term.";

                empty.append(heading, message);
                historyList.appendChild(empty);
                return;
            }

            filteredHistory.forEach((conversation) => {
                const item = document.createElement("button");

                item.type = "button";
                item.className = "history-item";

                const title = document.createElement("strong");
                title.textContent =
                    conversation.title || "New Conversation";

                const description = document.createElement("span");
                description.textContent = "Open conversation";

                item.append(title, description);

                item.addEventListener("click", () => {
                    loadConversation(conversation.id);
                });

                historyList.appendChild(item);
            });

        } catch (error) {
            console.error("Unable to load history:", error);

            historyList.replaceChildren();

            const message = document.createElement("p");
            message.className = "history-error";
            message.textContent =
                "Unable to load your conversation history. Please try again.";

            historyList.appendChild(message);
        }
    }
    // =====================================
    // LOAD EXISTING CONVERSATION
    // =====================================

    async function loadConversation(id) {
        try {
            const conversation =
                await apiRequest(`/api/Conversations/${id}`);

            if (!conversation) {
                throw new Error("Conversation not found.");
            }

            activeConversationId = conversation.id;

            showChatView(
                conversation.title || "Conversation"
            );

            chatMessages?.replaceChildren();

            const messages = conversation.messages || [];

            if (messages.length === 0) {
                showWelcomeMessage();
            } else {
                messages.forEach((message) => {
                    appendMessage(
                        message.role,
                        message.content
                    );
                });
            }

            await loadConversations();

        } catch (error) {
            showChatView("Conversation");
            showError(error.message);
        }
    }

    // =====================================
    // SEND MESSAGE
    // =====================================

    async function sendMessage(content) {
        const cleanContent = content.trim();

        if (!cleanContent || isSending) return;

        isSending = true;
        updateAvatarState();

        if (sendButton) sendButton.disabled = true;
        if (messageInput) messageInput.disabled = true;

        try {
            if (!activeConversationId) {
                await createConversation();
            }

            if (messageInput) {
                messageInput.value = "";
                messageInput.style.height = "auto";
            }

            appendMessage("user", cleanContent);

            if (typingIndicator) {
                typingIndicator.hidden = false;
            }

            const result = await apiRequest(
                "/api/Messages/chat",
                {
                    method: "POST",
                    body: JSON.stringify({
                        conversationId: activeConversationId,
                        content: cleanContent
                    })
                }
            );

            if (typingIndicator) {
                typingIndicator.hidden = true;
            }

            if (result?.assistantMessage?.content) {
                appendMessage(
                    "assistant",
                    result.assistantMessage.content
                );

                speakText(result.assistantMessage.content);

            } else {
                showError(
                    "Tyrone did not return a response. Please try again."
                );
            }

            await loadConversations();

        } catch (error) {
            if (typingIndicator) {
                typingIndicator.hidden = true;
            }

            showError(error.message);

        } finally {
            isSending = false;

            if (sendButton) sendButton.disabled = false;

            if (messageInput) {
                messageInput.disabled = false;
                messageInput.focus();
            }

            updateAvatarState();
        }
    }

    // =====================================
    // TYRONE VOICE INPUT
    // =====================================

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    let recognition = null;

    if (SpeechRecognition && voiceButton) {
        recognition = new SpeechRecognition();

        recognition.lang = "en-ZA";
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        voiceButton.addEventListener("click", () => {
            if (isListening) {
                recognition.stop();
                return;
            }

            if (isSending) return;

            try {
                recognition.start();
            } catch (error) {
                showError(
                    "Voice input could not start. Please try again."
                );
            }
        });

        recognition.onstart = () => {
            isListening = true;

            voiceButton.classList.add("is-listening");
            voiceButton.setAttribute(
                "aria-label",
                "Stop voice input"
            );
            voiceButton.title = "Listening...";

            updateAvatarState();
        };

        recognition.onresult = async (event) => {
            const transcript =
                event.results[0][0].transcript.trim();

            if (!transcript || !messageInput) return;

            messageInput.value = transcript;

            messageInput.dispatchEvent(
                new Event("input", { bubbles: true })
            );

            await sendMessage(transcript);
        };

        recognition.onerror = (event) => {
            if (event.error !== "aborted" &&
                event.error !== "no-speech") {

                showError("Voice input error: " + event.error);
            }
        };

        recognition.onend = () => {
            isListening = false;

            voiceButton.classList.remove("is-listening");
            voiceButton.setAttribute(
                "aria-label",
                "Start voice input"
            );
            voiceButton.title = "Speak to Tyrone";

            updateAvatarState();
        };

    } else if (voiceButton) {
        voiceButton.disabled = true;
        voiceButton.title =
            "Voice recognition is not supported in this browser.";
        voiceButton.setAttribute(
            "aria-label",
            "Voice input unavailable"
        );
    }

    // =====================================
    // TYRONE SPOKEN AI REPLIES
    // =====================================

    let voiceRepliesEnabled = true;

    const speechSupported =
        "speechSynthesis" in window &&
        "SpeechSynthesisUtterance" in window;

    function speakText(text) {
        if (!voiceRepliesEnabled ||
            !speechSupported ||
            !text) return;

        window.speechSynthesis.cancel();

        isSpeaking = false;

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = "en-ZA";
        utterance.rate = 0.95;
        utterance.pitch = 0.95;
        utterance.volume = 1;

        utterance.onstart = () => {
            isSpeaking = true;
            updateAvatarState();
        };

        utterance.onend = () => {
            isSpeaking = false;
            updateAvatarState();
        };

        utterance.onerror = () => {
            isSpeaking = false;
            updateAvatarState();
        };

        window.speechSynthesis.speak(utterance);
    }

    if (voiceReplyButton) {
        if (!speechSupported) {
            voiceReplyButton.disabled = true;
            voiceReplyButton.title =
                "Spoken replies are not supported in this browser.";

            voiceRepliesEnabled = false;

        } else {
            voiceReplyButton.classList.add("is-enabled");
            voiceReplyButton.setAttribute(
                "aria-pressed",
                "true"
            );
            voiceReplyButton.title =
                "Disable spoken replies";

            if (voiceReplyLabel) {
                voiceReplyLabel.textContent = "Voice on";
            }

            voiceReplyButton.addEventListener("click", () => {
                voiceRepliesEnabled = !voiceRepliesEnabled;

                voiceReplyButton.classList.toggle(
                    "is-enabled",
                    voiceRepliesEnabled
                );

                voiceReplyButton.setAttribute(
                    "aria-pressed",
                    String(voiceRepliesEnabled)
                );

                if (voiceReplyLabel) {
                    voiceReplyLabel.textContent =
                        voiceRepliesEnabled
                            ? "Voice on"
                            : "Voice off";
                }

                voiceReplyButton.title =
                    voiceRepliesEnabled
                        ? "Disable spoken replies"
                        : "Enable spoken replies";

                if (!voiceRepliesEnabled) {
                    window.speechSynthesis.cancel();
                    isSpeaking = false;
                    updateAvatarState();
                }
            });
        }
    }

    // =====================================
    // CHAT FORM
    // =====================================

    chatForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!messageInput) return;

        await sendMessage(messageInput.value);
    });

    messageInput?.addEventListener("input", () => {
        messageInput.style.height = "auto";

        messageInput.style.height =
            `${Math.min(messageInput.scrollHeight, 150)}px`;
    });

    messageInput?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            chatForm?.requestSubmit();
        }
    });

    // =====================================
    // NEW CONVERSATION
    // =====================================

    function startNewConversation() {
        activeConversationId = null;

        showChatView("New conversation");
        showWelcomeMessage();
    }

    $("#newChatButton")?.addEventListener(
        "click",
        startNewConversation
    );

    $("#talkButton")?.addEventListener(
        "click",
        startNewConversation
    );

    // =====================================
    // QUICK PROMPTS
    // =====================================

    $$(".quick-card").forEach((card) => {
        card.addEventListener("click", async () => {
            const prompt = card.dataset.prompt;

            if (!prompt) return;

            activeConversationId = null;

            showChatView("New conversation");
            showWelcomeMessage();

            await sendMessage(prompt);
        });
    });
// =====================================
// DISCOVER CARD ACTIONS
// =====================================

$$(".discover-page [data-prompt]").forEach((card) => {
    card.addEventListener("click", async () => {
        const prompt = card.dataset.prompt;

        if (!prompt) return;

        activeConversationId = null;

        showChatView("New conversation");
        showWelcomeMessage();

        await sendMessage(prompt);
    });
});

// =====================================
// NAVIGATION
// =====================================

$$("[data-page]").forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();

        const page = link.dataset.page;

        $$("[data-page]").forEach((item) => {
            item.classList.toggle(
                "active",
                item.dataset.page === page
            );
        });

        sidebar?.classList.remove("open");

        if (settingsPage) {
            settingsPage.hidden = true;
        }

        if (page === "home") {
            showHomeView();

        } else if (page === "conversations") {
            showHomeView();
            loadConversations();

            if (activeConversationId) {
                loadConversation(activeConversationId);
            } else {
                conversationList?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest"
                });
            }

        } else if (page === "settings") {
    showSettingsView();

         } else if (page === "history") {
    showHistoryView();
    loadHistory();

    } else if (page === "discover") {
    showDiscoverView();
} else {
            const labels = {
                discover: "Discover",
                history: "History",
                help: "Help & Support"
            };

            if (breadcrumbTitle) {
                breadcrumbTitle.textContent =
                    labels[page] || "Home";
            }

            if (welcomeSection) welcomeSection.hidden = true;
            if (companionSection) companionSection.hidden = true;
            if (chatPanel) chatPanel.hidden = true;
            if (quickSection) quickSection.hidden = true;
            if (footer) footer.hidden = false;

            if (
                page === "discover" ||
                page === "history" ||
                page === "help"
            ) {
                alert(`${labels[page] || "Page"} is coming soon.`);
            }
        }
    });
});

// =====================================
// OPEN SECTION FROM URL HASH
// =====================================

const requestedPage = window.location.hash.slice(1);

const validPages = [
    "home",
    "conversations",
    "discover",
    "history"
];

if (validPages.includes(requestedPage)) {
    const requestedLink = document.querySelector(
        `[data-page="${requestedPage}"]`
    );

    requestedLink?.click();
}


    // =====================================
    // INITIALISE
    // =====================================

    setAvatarState("idle");

    loadConversations();

    console.log("Tyrone AI interface initialized.");
});
