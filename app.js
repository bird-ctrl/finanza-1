// Finanzas AI - Financial Literacy Coach
// Main JavaScript Application

// Configuration object (would be replaced by GitHub Actions)
window.CONFIG = {
    GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE', // This gets replaced by GitHub Actions
    MODEL: 'gemini-1.5-flash',
    TIMEOUT_MS: 30000,
    API_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
};

// Internationalization data
const i18n = {
    en: {
        loading: "Loading your financial coach...",
        input_placeholder: "Ask about investments, taxes, insurance...",
        ai_typing: "AI is typing...",
        rate_limit: "requests remaining",
        settings_title: "Settings",
        voice_rate: "Voice Rate",
        voice_pitch: "Voice Pitch", 
        voice_volume: "Voice Volume",
        api_key_override: "API Key Override (Optional)",
        api_key_help: "This will override the environment key for this session only",
        export_chat: "Export Chat History",
        clear_chat: "Clear Chat History",
        install_app: "Install Finanzas for better experience",
        install: "Install",
        dismiss: "Dismiss",
        welcome_message: "Hello! I'm your AI financial advisor. I can help you understand Indian investments, taxes, insurance, and more. What would you like to learn about?",
        error_api: "Sorry, I'm having trouble connecting. Please try again.",
        error_rate_limit: "Please wait before sending another message.",
        error_speech_not_supported: "Speech recognition is not supported in your browser.",
        listening: "Listening...",
        speech_error: "Could not recognize speech. Please try again.",
        chat_cleared: "Chat history cleared",
        chat_exported: "Chat history exported",
        offline_message: "You're offline. Some features may not work.",
        send: "Send",
        settings: "Settings"
    },
    hi: {
        loading: "आपका वित्तीय कोच लोड हो रहा है...",
        input_placeholder: "निवेश, कर, बीमा के बारे में पूछें...",
        ai_typing: "AI टाइप कर रहा है...",
        rate_limit: "अनुरोध शेष",
        settings_title: "सेटिंग्स",
        voice_rate: "आवाज़ की गति",
        voice_pitch: "आवाज़ का स्वर",
        voice_volume: "आवाज़ का वॉल्यूम",
        api_key_override: "API कुंजी ओवरराइड (वैकल्पिक)",
        api_key_help: "यह केवल इस सेशन के लिए पर्यावरण कुंजी को ओवरराइड करेगा",
        export_chat: "चैट इतिहास निर्यात करें",
        clear_chat: "चैट इतिहास साफ़ करें",
        install_app: "बेहतर अनुभव के लिए Finanzas इंस्टॉल करें",
        install: "इंस्टॉल करें",
        dismiss: "खारिज करें",
        welcome_message: "नमस्ते! मैं आपका AI वित्तीय सलाहकार हूँ। मैं आपको भारतीय निवेश, कर, बीमा और अधिक समझने में मदद कर सकता हूँ। आप क्या सीखना चाहेंगे?",
        error_api: "क्षमा करें, मुझे कनेक्ट करने में समस्या हो रही है। कृपया पुनः प्रयास करें।",
        error_rate_limit: "कृपया दूसरा संदेश भेजने से पहले प्रतीक्षा करें।",
        error_speech_not_supported: "आपके ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है।",
        listening: "सुन रहा है...",
        speech_error: "स्पीच को पहचान नहीं सका। कृपया पुनः प्रयास करें।",
        chat_cleared: "चैट इतिहास साफ़ कर दिया गया",
        chat_exported: "चैट इतिहास निर्यात किया गया",
        offline_message: "आप ऑफ़लाइन हैं। कुछ सुविधाएं काम नहीं कर सकती हैं।",
        send: "भेजें",
        settings: "सेटिंग्स"
    }
};

// Quick replies data
const quickReplies = {
    en: [
        "What is a SIP?",
        "Explain ELSS mutual funds", 
        "How do I create an emergency fund?",
        "Tell me about UPI safety tips"
    ],
    hi: [
        "SIP क्या है?",
        "ELSS म्यूचुअल फंड समझाएँ",
        "आपातकालीन निधि कैसे बनाएं?",
        "UPI सुरक्षा टिप्स बताइए"
    ]
};

// Application state
class FinanzasApp {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'en';
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.messages = JSON.parse(localStorage.getItem('chatHistory')) || [];
        this.rateLimitCount = 0;
        this.rateLimitReset = Date.now();
        this.isListening = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.voiceSettings = {
            rate: parseFloat(localStorage.getItem('voiceRate')) || 1.0,
            pitch: parseFloat(localStorage.getItem('voicePitch')) || 1.0,
            volume: parseFloat(localStorage.getItem('voiceVolume')) || 1.0
        };
        this.apiKeyOverride = '';
        this.deferredPrompt = null;
        
        this.initializeApp();
    }

    async initializeApp() {
        // Show splash screen for minimum 2 seconds
        setTimeout(() => {
            this.hideSplashScreen();
        }, 2000);

        // Initialize components
        this.setupEventListeners();
        this.setupSpeechRecognition();
        this.setupServiceWorker();
        this.setupPWAInstall();
        this.initializeTheme();
        this.initializeLanguage();
        this.loadChatHistory();
        this.generateQuickReplies();
        
        // Add welcome message if no chat history
        if (this.messages.length === 0) {
            this.addMessage('assistant', this.t('welcome_message'));
        }

        // Check online status
        this.setupOfflineDetection();
    }

    hideSplashScreen() {
        const splash = document.getElementById('splash');
        const app = document.getElementById('app');
        
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.style.display = 'none';
            app.classList.remove('hidden');
        }, 500);
    }

    setupEventListeners() {
        // Language selector
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                console.log('Language changed to:', e.target.value);
                this.setLanguage(e.target.value);
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                console.log('Theme toggle clicked');
                this.toggleTheme();
            });
        }

        // Settings modal
        const settingsBtn = document.getElementById('settingsBtn');
        const closeSettings = document.getElementById('closeSettings');
        const modalOverlay = document.querySelector('.modal-overlay');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettings();
            });
        }

        if (closeSettings) {
            closeSettings.addEventListener('click', () => {
                this.closeSettings();
            });
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => {
                this.closeSettings();
            });
        }

        // Input handling
        const userInput = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendBtn');
        const micBtn = document.getElementById('micBtn');

        if (userInput) {
            userInput.addEventListener('input', this.debounce(() => {
                this.autoResizeTextarea();
            }, 100));

            userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                console.log('Send button clicked');
                this.sendMessage();
            });
        }

        if (micBtn) {
            micBtn.addEventListener('click', () => {
                this.toggleSpeechRecognition();
            });
        }

        // Voice settings
        const voiceRate = document.getElementById('voiceRate');
        const voicePitch = document.getElementById('voicePitch');
        const voiceVolume = document.getElementById('voiceVolume');

        if (voiceRate) {
            voiceRate.addEventListener('input', (e) => {
                this.voiceSettings.rate = parseFloat(e.target.value);
                const valueDisplay = document.getElementById('voiceRateValue');
                if (valueDisplay) valueDisplay.textContent = e.target.value;
                localStorage.setItem('voiceRate', e.target.value);
            });
        }

        if (voicePitch) {
            voicePitch.addEventListener('input', (e) => {
                this.voiceSettings.pitch = parseFloat(e.target.value);
                const valueDisplay = document.getElementById('voicePitchValue');
                if (valueDisplay) valueDisplay.textContent = e.target.value;
                localStorage.setItem('voicePitch', e.target.value);
            });
        }

        if (voiceVolume) {
            voiceVolume.addEventListener('input', (e) => {
                this.voiceSettings.volume = parseFloat(e.target.value);
                const valueDisplay = document.getElementById('voiceVolumeValue');
                if (valueDisplay) valueDisplay.textContent = e.target.value;
                localStorage.setItem('voiceVolume', e.target.value);
            });
        }

        // API key override
        const apiKeyOverride = document.getElementById('apiKeyOverride');
        if (apiKeyOverride) {
            apiKeyOverride.addEventListener('input', (e) => {
                this.apiKeyOverride = e.target.value;
            });
        }

        // Export chat
        const exportChat = document.getElementById('exportChat');
        if (exportChat) {
            exportChat.addEventListener('click', () => {
                this.exportChat();
            });
        }

        // Clear chat
        const clearChat = document.getElementById('clearChat');
        if (clearChat) {
            clearChat.addEventListener('click', () => {
                this.clearChat();
            });
        }
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = this.currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';

            this.recognition.onstart = () => {
                this.isListening = true;
                const micBtn = document.getElementById('micBtn');
                if (micBtn) micBtn.classList.add('recording');
                this.showToast(this.t('listening'), 'info');
            };

            this.recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                const userInput = document.getElementById('userInput');
                if (userInput) {
                    userInput.value = transcript;
                    this.autoResizeTextarea();
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                const micBtn = document.getElementById('micBtn');
                if (micBtn) micBtn.classList.remove('recording');
            };

            this.recognition.onerror = (event) => {
                this.isListening = false;
                const micBtn = document.getElementById('micBtn');
                if (micBtn) micBtn.classList.remove('recording');
                this.showToast(this.t('speech_error'), 'error');
            };
        }
    }

    setupServiceWorker() {
        // Inline service worker since we can only generate 3 files
        if ('serviceWorker' in navigator) {
            const swCode = `
                const CACHE_NAME = 'finanzas-v1';
                const urlsToCache = [
                    './',
                    './index.html',
                    './style.css', 
                    './app.js',
                    'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600&display=swap'
                ];

                self.addEventListener('install', (event) => {
                    event.waitUntil(
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.addAll(urlsToCache))
                    );
                });

                self.addEventListener('fetch', (event) => {
                    event.respondWith(
                        caches.match(event.request)
                            .then((response) => {
                                if (response) {
                                    return response;
                                }
                                return fetch(event.request);
                            })
                    );
                });
            `;

            const blob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(blob);

            navigator.serviceWorker.register(swUrl)
                .then(() => console.log('SW registered'))
                .catch(() => console.log('SW registration failed'));
        }
    }

    setupPWAInstall() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        const installBtn = document.getElementById('installBtn');
        const dismissInstall = document.getElementById('dismissInstall');

        if (installBtn) {
            installBtn.addEventListener('click', () => {
                if (this.deferredPrompt) {
                    this.deferredPrompt.prompt();
                    this.deferredPrompt.userChoice.then(() => {
                        this.deferredPrompt = null;
                        this.hideInstallPrompt();
                    });
                }
            });
        }

        if (dismissInstall) {
            dismissInstall.addEventListener('click', () => {
                this.hideInstallPrompt();
            });
        }
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showToast('Back online!', 'success');
        });

        window.addEventListener('offline', () => {
            this.showToast(this.t('offline_message'), 'warning');
        });
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    initializeLanguage() {
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = this.currentLanguage;
        }
        this.updateLanguage();
    }

    setLanguage(lang) {
        console.log('Setting language to:', lang);
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        this.updateLanguage();
        this.generateQuickReplies();
        
        // Update speech recognition language
        if (this.recognition) {
            this.recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        }

        // Add language class to body for font switching
        document.body.className = document.body.className.replace(/lang-\w+/, '');
        document.body.classList.add(`lang-${lang}`);
        
        if (lang === 'hi') {
            document.documentElement.setAttribute('lang', 'hi');
        } else {
            document.documentElement.setAttribute('lang', 'en');
        }
    }

    updateLanguage() {
        console.log('Updating language to:', this.currentLanguage);
        // Update all elements with data-i18n attributes
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation !== key) {
                element.textContent = translation;
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            if (translation !== key) {
                element.placeholder = translation;
            }
        });

        // Update rate limit text
        this.updateRateLimitDisplay();
    }

    toggleTheme() {
        console.log('Toggling theme from:', this.currentTheme);
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.initializeTheme();
        console.log('Theme toggled to:', this.currentTheme);
    }

    generateQuickReplies() {
        console.log('Generating quick replies for language:', this.currentLanguage);
        const container = document.querySelector('.quick-replies-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        const replies = quickReplies[this.currentLanguage] || quickReplies.en;
        replies.forEach(reply => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.textContent = reply;
            button.addEventListener('click', () => {
                console.log('Quick reply clicked:', reply);
                const userInput = document.getElementById('userInput');
                if (userInput) {
                    userInput.value = reply;
                    this.autoResizeTextarea();
                    // Auto-focus the input after setting value
                    userInput.focus();
                }
            });
            container.appendChild(button);
        });
    }

    loadChatHistory() {
        const chatLog = document.getElementById('chatLog');
        if (!chatLog) return;
        
        chatLog.innerHTML = '';
        
        this.messages.forEach(message => {
            this.renderMessage(message.role, message.content, new Date(message.timestamp));
        });
        
        this.scrollToBottom();
    }

    addMessage(role, content) {
        console.log('Adding message:', role, content);
        const message = {
            role,
            content,
            timestamp: new Date().toISOString()
        };
        
        this.messages.push(message);
        
        // Keep only last 100 messages for memory management
        if (this.messages.length > 100) {
            this.messages = this.messages.slice(-100);
        }
        
        localStorage.setItem('chatHistory', JSON.stringify(this.messages));
        this.renderMessage(role, content, new Date(message.timestamp));
        this.scrollToBottom();
    }

    renderMessage(role, content, timestamp) {
        console.log('Rendering message:', role, content);
        const chatLog = document.getElementById('chatLog');
        if (!chatLog) return;
        
        const messageElement = document.createElement('li');
        messageElement.className = `chat-message ${role}`;
        
        const timeString = timestamp.toLocaleTimeString(this.currentLanguage === 'hi' ? 'hi-IN' : 'en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageElement.innerHTML = `
            <div class="message-content">${this.formatMessage(content)}</div>
            <div class="message-time">${timeString}</div>
        `;
        
        chatLog.appendChild(messageElement);
        console.log('Message rendered successfully');
    }

    formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    scrollToBottom() {
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    autoResizeTextarea() {
        const textarea = document.getElementById('userInput');
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    }

    async sendMessage() {
        console.log('Send message called');
        const userInput = document.getElementById('userInput');
        if (!userInput) return;
        
        const message = userInput.value.trim();
        console.log('Message to send:', message);
        
        if (!message) return;
        
        // Check rate limit
        if (!this.checkRateLimit()) {
            this.showToast(this.t('error_rate_limit'), 'warning');
            return;
        }
        
        // Clear input
        userInput.value = '';
        this.autoResizeTextarea();
        
        // Add user message
        this.addMessage('user', message);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Send to AI
        try {
            const response = await this.fetchGemini(message);
            this.hideTypingIndicator();
            this.addMessage('assistant', response);
            
            // Speak response if synthesis is available
            this.speakText(response);
            
        } catch (error) {
            console.error('Error fetching AI response:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', this.t('error_api'));
            this.showToast(this.t('error_api'), 'error');
        }
    }

    checkRateLimit() {
        const now = Date.now();
        const resetInterval = 10000; // 10 seconds
        
        // Reset counter if interval passed
        if (now - this.rateLimitReset > resetInterval) {
            this.rateLimitCount = 0;
            this.rateLimitReset = now;
        }
        
        // Check if under limit
        if (this.rateLimitCount >= 3) {
            return false;
        }
        
        this.rateLimitCount++;
        this.updateRateLimitDisplay();
        return true;
    }

    updateRateLimitDisplay() {
        const remaining = Math.max(0, 3 - this.rateLimitCount);
        const text = `${remaining} ${this.t('rate_limit')}`;
        const rateLimitText = document.getElementById('rateLimitText');
        if (rateLimitText) {
            rateLimitText.textContent = text;
        }
    }

    async fetchGemini(prompt) {
        const apiKey = this.apiKeyOverride || window.CONFIG.GEMINI_API_KEY;
        
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            throw new Error('API key not configured');
        }

        // Enhanced financial context prompt
        const systemPrompt = `You are Finanzas, an AI financial literacy coach specifically designed for Indian youth. You provide helpful, accurate, and culturally relevant financial advice focusing on:

        - Indian investment options: SIP, mutual funds, stocks, bonds
        - Tax planning: 80C deductions, ELSS, tax-saving FDs  
        - Banking: Savings accounts, FDs, RDs
        - Insurance: Health, life, term insurance
        - Digital payments: UPI, wallets, fintech apps
        - Retirement planning: PPF, NPS, EPF
        - Goal-based planning: Emergency funds, budgeting

        Keep responses concise, practical, and encourage smart financial habits. Use Indian examples and context. Respond in ${this.currentLanguage === 'hi' ? 'Hindi' : 'English'}.

        User question: ${prompt}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: systemPrompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        const response = await fetch(`${window.CONFIG.API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(window.CONFIG.TIMEOUT_MS)
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Rate limit exceeded');
            }
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response format');
        }
    }

    showTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.classList.remove('hidden');
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.classList.add('hidden');
        }
    }

    speakText(text) {
        if (this.synthesis && this.synthesis.speaking) {
            this.synthesis.cancel();
        }

        if (this.synthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = this.voiceSettings.rate;
            utterance.pitch = this.voiceSettings.pitch;
            utterance.volume = this.voiceSettings.volume;
            utterance.lang = this.currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
            
            // Try to use Indian English voice
            const voices = this.synthesis.getVoices();
            const indianVoice = voices.find(voice => 
                voice.lang.includes('en-IN') || voice.lang.includes('hi-IN')
            );
            
            if (indianVoice) {
                utterance.voice = indianVoice;
            }
            
            this.synthesis.speak(utterance);
        }
    }

    toggleSpeechRecognition() {
        if (!this.recognition) {
            this.showToast(this.t('error_speech_not_supported'), 'error');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('hidden');
            
            // Update range values
            const voiceRate = document.getElementById('voiceRate');
            const voicePitch = document.getElementById('voicePitch');
            const voiceVolume = document.getElementById('voiceVolume');
            
            if (voiceRate) {
                voiceRate.value = this.voiceSettings.rate;
                const valueDisplay = document.getElementById('voiceRateValue');
                if (valueDisplay) valueDisplay.textContent = this.voiceSettings.rate.toFixed(1);
            }
            
            if (voicePitch) {
                voicePitch.value = this.voiceSettings.pitch;
                const valueDisplay = document.getElementById('voicePitchValue');
                if (valueDisplay) valueDisplay.textContent = this.voiceSettings.pitch.toFixed(1);
            }
            
            if (voiceVolume) {
                voiceVolume.value = this.voiceSettings.volume;
                const valueDisplay = document.getElementById('voiceVolumeValue');
                if (valueDisplay) valueDisplay.textContent = this.voiceSettings.volume.toFixed(1);
            }
        }
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    exportChat() {
        const dataStr = JSON.stringify(this.messages, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `finanzas-chat-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast(this.t('chat_exported'), 'success');
    }

    clearChat() {
        if (confirm('Are you sure you want to clear all chat history?')) {
            this.messages = [];
            localStorage.removeItem('chatHistory');
            const chatLog = document.getElementById('chatLog');
            if (chatLog) {
                chatLog.innerHTML = '';
            }
            this.addMessage('assistant', this.t('welcome_message'));
            this.showToast(this.t('chat_cleared'), 'info');
        }
    }

    showInstallPrompt() {
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.classList.remove('hidden');
        }
    }

    hideInstallPrompt() {
        const installPrompt = document.getElementById('installPrompt');
        if (installPrompt) {
            installPrompt.classList.add('hidden');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    // Translation helper
    t(key) {
        return i18n[this.currentLanguage][key] || key;
    }

    // Debounce utility
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Finanzas app');
    new FinanzasApp();
});

// Handle PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

// Export for potential GitHub Actions integration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FinanzasApp, i18n, quickReplies };
}
