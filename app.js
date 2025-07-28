// Finanzas AI - Indian Finance Coach Application
// Complete JavaScript functionality with voice, themes, rate limiting, and more

class FinanzasAI {
    constructor() {
        this.config = {
            // API Configuration
            backendUrl: 'https://your-backend-url.vercel.app', // Replace with your deployed backend URL
            maxRequests: 30,
            rateLimitWindow: 24 * 60 * 60 * 1000, // 24 hours
            
            // Voice Settings
            voice: {
                enabled: true,
                rate: 1.0,
                pitch: 1.0,
                volume: 0.8,
                language: 'en-US'
            },
            
            // UI Settings
            theme: 'light',
            language: 'English',
            autoScroll: true,
            typingSound: true,
            
            // Indian Financial Context
            quickResponses: [
                "What is SIP and how to start?",
                "Best tax-saving options under 80C",
                "How to build emergency fund?",
                "PPF vs NPS comparison",
                "Best mutual funds for beginners",
                "UPI safety tips",
                "Health insurance coverage needed",
                "How to invest 1 lakh rupees?"
            ],
            
            // Supported languages
            languages: {
                'English': { code: 'en-US', flag: 'EN' },
                'Hindi': { code: 'hi-IN', flag: 'हि' }
            }
        };

        this.state = {
            isListening: false,
            isSpeaking: false,
            isTyping: false,
            chatHistory: [],
            requestCount: 0,
            lastRequestTime: null,
            recognition: null,
            synthesis: null,
            currentVoice: null
        };

        this.elements = {};
        this.debounceTimer = null;
    }

    init() {
        console.log('Initializing Finanzas AI...');
        
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        this.bindElements();
        this.loadSettings();
        this.setupEventListeners();
        this.initializeVoice();
        this.checkRateLimit();
        this.showSplashScreen();
        this.checkOnlineStatus();
        this.loadChatHistory();
        
        console.log('🚀 Finanzas AI initialized successfully');
    }

    bindElements() {
        // Main app elements
        this.elements.splashScreen = document.getElementById('splash-screen');
        this.elements.mainApp = document.getElementById('main-app');
        
        // Header controls
        this.elements.themeToggle = document.getElementById('theme-toggle');
        this.elements.languageToggle = document.getElementById('language-toggle');
        this.elements.voiceToggle = document.getElementById('voice-toggle');
        this.elements.settingsBtn = document.getElementById('settings-btn');
        
        // Usage tracker
        this.elements.usageFill = document.getElementById('usage-fill');
        this.elements.usageText = document.getElementById('usage-text');
        
        // Chat elements
        this.elements.chatMessages = document.getElementById('chat-messages');
        this.elements.messageInput = document.getElementById('message-input');
        this.elements.sendBtn = document.getElementById('send-btn');
        this.elements.voiceInputBtn = document.getElementById('voice-input-btn');
        this.elements.charCounter = document.querySelector('.char-counter');
        this.elements.exportBtn = document.getElementById('export-btn');
        
        // Quick response buttons
        this.elements.quickBtns = document.querySelectorAll('.quick-btn');
        
        // Settings modal
        this.elements.settingsModal = document.getElementById('settings-modal');
        this.elements.closeSettings = document.getElementById('close-settings');
        
        // Status indicators
        this.elements.voiceStatus = document.getElementById('voice-status');
        this.elements.voiceStatusText = document.getElementById('voice-status-text');
        this.elements.offlineIndicator = document.getElementById('offline-indicator');
        this.elements.toastContainer = document.getElementById('toast-container');

        console.log('Elements bound successfully');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Header controls
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        }
        
        if (this.elements.languageToggle) {
            this.elements.languageToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleLanguage();
            });
        }
        
        if (this.elements.voiceToggle) {
            this.elements.voiceToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleVoice();
            });
        }
        
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openSettings();
            });
        }
        
        // Input handling
        if (this.elements.messageInput) {
            this.elements.messageInput.addEventListener('input', (e) => this.handleInput(e));
            this.elements.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        }
        
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }
        
        if (this.elements.voiceInputBtn) {
            this.elements.voiceInputBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleVoiceInput();
            });
        }
        
        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportChat();
            });
        }
        
        // Quick responses
        this.elements.quickBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const query = e.target.dataset.query || e.target.textContent;
                if (query) {
                    this.elements.messageInput.value = query;
                    this.handleInput({ target: this.elements.messageInput });
                    this.sendMessage();
                }
            });
        });
        
        // Settings modal
        if (this.elements.closeSettings) {
            this.elements.closeSettings.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeSettings();
            });
        }
        
        if (this.elements.settingsModal) {
            this.elements.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.elements.settingsModal) {
                    this.closeSettings();
                }
            });
        }
        
        // Voice settings - get elements dynamically since they might not exist yet
        setTimeout(() => {
            const voiceRate = document.getElementById('voice-rate');
            const voicePitch = document.getElementById('voice-pitch');
            const voiceVolume = document.getElementById('voice-volume');
            const autoScroll = document.getElementById('auto-scroll');
            const typingSound = document.getElementById('typing-sound');
            const clearHistory = document.getElementById('clear-history');
            const resetUsage = document.getElementById('reset-usage');
            
            if (voiceRate) voiceRate.addEventListener('input', (e) => this.updateVoiceSetting('rate', e.target.value));
            if (voicePitch) voicePitch.addEventListener('input', (e) => this.updateVoiceSetting('pitch', e.target.value));
            if (voiceVolume) voiceVolume.addEventListener('input', (e) => this.updateVoiceSetting('volume', e.target.value));
            if (autoScroll) autoScroll.addEventListener('change', (e) => this.config.autoScroll = e.target.checked);
            if (typingSound) typingSound.addEventListener('change', (e) => this.config.typingSound = e.target.checked);
            if (clearHistory) clearHistory.addEventListener('click', (e) => { e.preventDefault(); this.clearChatHistory(); });
            if (resetUsage) resetUsage.addEventListener('click', (e) => { e.preventDefault(); this.resetUsage(); });
        }, 100);
        
        // Online/offline detection
        window.addEventListener('online', () => this.updateOnlineStatus(true));
        window.addEventListener('offline', () => this.updateOnlineStatus(false));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e));
        
        console.log('Event listeners set up successfully');
    }

    showSplashScreen() {
        // Show splash screen for minimum 2 seconds
        setTimeout(() => {
            if (this.elements.splashScreen) {
                this.elements.splashScreen.style.display = 'none';
            }
            if (this.elements.mainApp) {
                this.elements.mainApp.classList.remove('hidden');
            }
            if (this.elements.messageInput) {
                this.elements.messageInput.focus();
            }
        }, 2000);
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('finanzas-settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.config = { ...this.config, ...settings };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        
        this.applySettings();
    }

    saveSettings() {
        try {
            localStorage.setItem('finanzas-settings', JSON.stringify({
                theme: this.config.theme,
                language: this.config.language,
                voice: this.config.voice,
                autoScroll: this.config.autoScroll,
                typingSound: this.config.typingSound
            }));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    applySettings() {
        // Apply theme
        if (document.body) {
            document.body.setAttribute('data-color-scheme', this.config.theme);
        }
        
        if (this.elements.themeToggle) {
            const themeIcon = this.elements.themeToggle.querySelector('.theme-icon');
            if (themeIcon) {
                themeIcon.textContent = this.config.theme === 'dark' ? '☀️' : '🌙';
            }
        }
        
        // Apply language
        if (this.elements.languageToggle) {
            const langText = this.elements.languageToggle.querySelector('.lang-text');
            if (langText) {
                langText.textContent = this.config.languages[this.config.language].flag;
            }
        }
        
        // Apply voice enabled state
        if (this.elements.voiceToggle) {
            const voiceIcon = this.elements.voiceToggle.querySelector('.voice-icon');
            if (voiceIcon) {
                voiceIcon.textContent = this.config.voice.enabled ? '🔊' : '🔇';
            }
        }
        
        // Apply other settings with delay to ensure elements exist
        setTimeout(() => {
            const voiceRate = document.getElementById('voice-rate');
            const voicePitch = document.getElementById('voice-pitch');
            const voiceVolume = document.getElementById('voice-volume');
            const autoScroll = document.getElementById('auto-scroll');
            const typingSound = document.getElementById('typing-sound');
            
            if (voiceRate) {
                voiceRate.value = this.config.voice.rate;
                const rateValue = document.getElementById('rate-value');
                if (rateValue) rateValue.textContent = this.config.voice.rate;
            }
            if (voicePitch) {
                voicePitch.value = this.config.voice.pitch;
                const pitchValue = document.getElementById('pitch-value');
                if (pitchValue) pitchValue.textContent = this.config.voice.pitch;
            }
            if (voiceVolume) {
                voiceVolume.value = this.config.voice.volume;
                const volumeValue = document.getElementById('volume-value');
                if (volumeValue) volumeValue.textContent = this.config.voice.volume;
            }
            if (autoScroll) autoScroll.checked = this.config.autoScroll;
            if (typingSound) typingSound.checked = this.config.typingSound;
        }, 100);
    }

    checkRateLimit() {
        try {
            const rateData = localStorage.getItem('finanzas-rate-limit');
            if (rateData) {
                const { count, timestamp } = JSON.parse(rateData);
                const now = Date.now();
                
                if (now - timestamp < this.config.rateLimitWindow) {
                    this.state.requestCount = count;
                    this.state.lastRequestTime = timestamp;
                } else {
                    this.resetUsage();
                }
            }
        } catch (error) {
            console.error('Error checking rate limit:', error);
            this.resetUsage();
        }
        
        this.updateUsageDisplay();
    }

    updateUsageDisplay() {
        if (!this.elements.usageFill || !this.elements.usageText) return;
        
        const percentage = (this.state.requestCount / this.config.maxRequests) * 100;
        this.elements.usageFill.style.width = `${percentage}%`;
        this.elements.usageText.textContent = `${this.state.requestCount}/${this.config.maxRequests} queries today`;
        
        if (this.state.requestCount >= this.config.maxRequests) {
            this.elements.usageText.style.color = 'var(--color-error)';
        } else if (this.state.requestCount >= this.config.maxRequests * 0.8) {
            this.elements.usageText.style.color = 'var(--color-warning)';
        } else {
            this.elements.usageText.style.color = 'var(--color-text-secondary)';
        }
    }

    toggleTheme() {
        this.config.theme = this.config.theme === 'light' ? 'dark' : 'light';
        this.applySettings();
        this.saveSettings();
        this.showToast(`Switched to ${this.config.theme} mode`, 'info');
        console.log('Theme toggled to:', this.config.theme);
    }

    toggleLanguage() {
        this.config.language = this.config.language === 'English' ? 'Hindi' : 'English';
        this.config.voice.language = this.config.languages[this.config.language].code;
        
        if (this.state.recognition) {
            this.state.recognition.lang = this.config.voice.language;
        }
        
        this.applySettings();
        this.saveSettings();
        this.showToast(`Language switched to ${this.config.language}`, 'info');
        console.log('Language toggled to:', this.config.language);
    }

    toggleVoice() {
        this.config.voice.enabled = !this.config.voice.enabled;
        this.applySettings();
        this.saveSettings();
        
        if (!this.config.voice.enabled && this.state.isSpeaking) {
            if (this.state.synthesis) {
                this.state.synthesis.cancel();
            }
            this.state.isSpeaking = false;
        }
        
        this.showToast(`Voice ${this.config.voice.enabled ? 'enabled' : 'disabled'}`, 'info');
        console.log('Voice toggled:', this.config.voice.enabled);
    }

    handleInput(e) {
        this.updateCharCounter();
        
        // Debounced auto-resize
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.autoResizeTextarea();
        }, 100);
        
        // Enable/disable send button
        if (this.elements.sendBtn) {
            this.elements.sendBtn.disabled = e.target.value.trim().length === 0;
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    handleGlobalKeyDown(e) {
        // Ctrl/Cmd + Enter to send message
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.sendMessage();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeSettings();
        }
        
        // Ctrl/Cmd + / to toggle theme
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            this.toggleTheme();
        }
    }

    updateCharCounter() {
        if (!this.elements.charCounter || !this.elements.messageInput) return;
        
        const length = this.elements.messageInput.value.length;
        this.elements.charCounter.textContent = `${length}/500`;
        
        if (length > 450) {
            this.elements.charCounter.style.color = 'var(--color-warning)';
        } else if (length >= 500) {
            this.elements.charCounter.style.color = 'var(--color-error)';
        } else {
            this.elements.charCounter.style.color = 'var(--color-text-secondary)';
        }
    }

    autoResizeTextarea() {
        if (!this.elements.messageInput) return;
        
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        if (!this.elements.messageInput) return;
        
        const message = this.elements.messageInput.value.trim();
        if (!message) return;
        
        console.log('Sending message:', message);
        
        // For demo purposes, simulate an AI response since backend might not be available
        this.addMessage(message, 'user');
        this.elements.messageInput.value = '';
        this.updateCharCounter();
        if (this.elements.sendBtn) {
            this.elements.sendBtn.disabled = true;
        }
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Simulate AI response after delay
        setTimeout(() => {
            this.hideTypingIndicator();
            
            // Provide Indian finance context response based on message
            let response = this.getContextualResponse(message);
            
            this.addMessage(response, 'ai');
            
            // Speak response if voice is enabled
            if (this.config.voice.enabled && response) {
                this.speak(response);
            }
            
            // Increment request count for demo
            this.state.requestCount++;
            this.updateUsageDisplay();
        }, 1500);
    }

    getContextualResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('sip')) {
            return "SIP (Systematic Investment Plan) is a great way to invest in mutual funds regularly. You can start with as little as ₹500 per month. SIPs help in rupee cost averaging and are perfect for long-term wealth creation. Popular SIP options include equity mutual funds for growth and debt funds for stability.";
        } else if (lowerMessage.includes('80c') || lowerMessage.includes('tax')) {
            return "Under Section 80C, you can save up to ₹1.5 lakh in taxes annually. Popular options include ELSS mutual funds (with 3-year lock-in), PPF (15-year lock-in), NSC, tax-saving FDs, and life insurance premiums. ELSS offers the best potential returns with the shortest lock-in period.";
        } else if (lowerMessage.includes('emergency') || lowerMessage.includes('fund')) {
            return "An emergency fund should cover 6-12 months of your expenses. Keep this money in liquid investments like savings accounts, liquid mutual funds, or short-term FDs. For a monthly expense of ₹50,000, aim for ₹3-6 lakh emergency fund. This protects you from unexpected job loss or medical emergencies.";
        } else if (lowerMessage.includes('ppf') || lowerMessage.includes('nps')) {
            return "PPF offers 7.1% tax-free returns with 15-year lock-in, while NPS provides market-linked returns with tax benefits under 80C and 80CCD(1B). PPF is safer but NPS can offer higher returns. For retirement planning, consider both - PPF for guaranteed returns and NPS for market exposure.";
        } else if (lowerMessage.includes('mutual fund')) {
            return "For beginners, start with large-cap equity funds for stability, add mid-cap funds for growth, and include debt funds for safety. Popular options: SBI Bluechip, HDFC Top 100, Mirae Asset Large Cap. Start with SIPs and diversify across 3-4 good funds. Always check expense ratios and past performance.";
        } else if (lowerMessage.includes('upi') || lowerMessage.includes('safety')) {
            return "UPI safety tips: 1) Never share UPI PIN, 2) Always verify merchant details before payment, 3) Use only official bank apps, 4) Check transaction limits, 5) Enable SMS alerts, 6) Avoid public WiFi for transactions. Popular UPI apps: PhonePe, Google Pay, Paytm are all secure when used properly.";
        } else if (lowerMessage.includes('1 lakh') || lowerMessage.includes('invest')) {
            return "With ₹1 lakh, diversify your investment: 1) ₹30k in ELSS for tax saving, 2) ₹30k in large-cap equity fund SIP, 3) ₹20k in liquid fund for emergency, 4) ₹20k in debt fund for stability. This gives you growth, safety, tax benefits, and liquidity. Review and rebalance annually.";
        } else {
            return "I'm here to help with Indian financial planning! I can guide you on investments (SIP, mutual funds, stocks), tax planning (80C deductions, ELSS), banking (FDs, savings accounts), insurance, retirement planning (PPF, NPS), and budgeting. What specific financial topic would you like to explore?";
        }
    }

    toggleVoiceInput() {
        if (!this.state.recognition) {
            this.showToast('Voice recognition not supported in this browser', 'error');
            return;
        }
        
        if (!this.config.voice.enabled) {
            this.showToast('Voice is disabled. Enable it in settings.', 'warning');
            return;
        }
        
        if (this.state.isListening) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    initializeVoice() {
        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.state.recognition = new SpeechRecognition();
            
            this.state.recognition.continuous = false;
            this.state.recognition.interimResults = false;
            this.state.recognition.lang = this.config.voice.language;
            
            this.state.recognition.onstart = () => {
                this.state.isListening = true;
                this.showVoiceStatus('Listening...');
                if (this.elements.voiceInputBtn) {
                    this.elements.voiceInputBtn.classList.add('active');
                }
            };
            
            this.state.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (this.elements.messageInput) {
                    this.elements.messageInput.value = transcript;
                    this.updateCharCounter();
                    this.sendMessage();
                }
            };
            
            this.state.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showToast('Voice recognition error. Please try again.', 'error');
                this.stopVoiceInput();
            };
            
            this.state.recognition.onend = () => {
                this.stopVoiceInput();
            };
        }
        
        // Initialize Speech Synthesis
        if ('speechSynthesis' in window) {
            this.state.synthesis = window.speechSynthesis;
            
            // Wait for voices to be loaded
            const loadVoices = () => {
                const voices = this.state.synthesis.getVoices();
                this.state.currentVoice = voices.find(voice => 
                    voice.lang === this.config.voice.language
                ) || voices[0];
            };
            
            if (this.state.synthesis.getVoices().length > 0) {
                loadVoices();
            } else {
                this.state.synthesis.onvoiceschanged = loadVoices;
            }
        }
    }

    startVoiceInput() {
        try {
            this.state.recognition.start();
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            this.showToast('Could not start voice recognition', 'error');
        }
    }

    stopVoiceInput() {
        this.state.isListening = false;
        this.hideVoiceStatus();
        if (this.elements.voiceInputBtn) {
            this.elements.voiceInputBtn.classList.remove('active');
        }
        
        if (this.state.recognition) {
            this.state.recognition.stop();
        }
    }

    showVoiceStatus(text) {
        if (this.elements.voiceStatusText) {
            this.elements.voiceStatusText.textContent = text;
        }
        if (this.elements.voiceStatus) {
            this.elements.voiceStatus.classList.remove('hidden');
        }
    }

    hideVoiceStatus() {
        if (this.elements.voiceStatus) {
            this.elements.voiceStatus.classList.add('hidden');
        }
    }

    addMessage(content, sender, isError = false) {
        if (!this.elements.chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        if (isError) {
            messageContent.style.color = 'var(--color-error)';
        }
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString();
        
        messageContent.appendChild(messageTime);
        messageDiv.appendChild(messageContent);
        
        this.elements.chatMessages.appendChild(messageDiv);
        
        // Save to chat history
        this.state.chatHistory.push({
            content,
            sender,
            timestamp: Date.now(),
            isError
        });
        
        this.saveChatHistory();
        
        if (this.config.autoScroll) {
            this.scrollToBottom();
        }
    }

    showTypingIndicator() {
        if (!this.elements.chatMessages) return;
        if (document.querySelector('.typing-indicator')) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai';
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        
        const typingDots = document.createElement('div');
        typingDots.className = 'typing-dots';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            typingDots.appendChild(dot);
        }
        
        typingIndicator.appendChild(typingDots);
        typingDiv.appendChild(typingIndicator);
        
        this.elements.chatMessages.appendChild(typingDiv);
        
        if (this.config.autoScroll) {
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.message.ai .typing-indicator');
        if (typingIndicator) {
            typingIndicator.parentElement.remove();
        }
    }

    speak(text) {
        if (!this.config.voice.enabled || !this.state.synthesis || this.state.isSpeaking) {
            return;
        }
        
        // Cancel any ongoing speech
        this.state.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.config.voice.rate;
        utterance.pitch = this.config.voice.pitch;
        utterance.volume = this.config.voice.volume;
        
        if (this.state.currentVoice) {
            utterance.voice = this.state.currentVoice;
        }
        
        utterance.onstart = () => {
            this.state.isSpeaking = true;
        };
        
        utterance.onend = () => {
            this.state.isSpeaking = false;
        };
        
        utterance.onerror = () => {
            this.state.isSpeaking = false;
        };
        
        this.state.synthesis.speak(utterance);
    }

    scrollToBottom() {
        if (this.elements.chatMessages) {
            this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        }
    }

    loadChatHistory() {
        try {
            const saved = localStorage.getItem('finanzas-chat-history');
            if (saved) {
                this.state.chatHistory = JSON.parse(saved);
                
                // Restore chat messages
                this.state.chatHistory.forEach(msg => {
                    this.addMessageToDOM(msg.content, msg.sender, msg.isError, msg.timestamp);
                });
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    addMessageToDOM(content, sender, isError, timestamp) {
        if (!this.elements.chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        if (isError) {
            messageContent.style.color = 'var(--color-error)';
        }
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date(timestamp).toLocaleTimeString();
        
        messageContent.appendChild(messageTime);
        messageDiv.appendChild(messageContent);
        
        this.elements.chatMessages.appendChild(messageDiv);
    }

    saveChatHistory() {
        try {
            // Keep only last 100 messages to prevent storage overflow
            const recentHistory = this.state.chatHistory.slice(-100);
            localStorage.setItem('finanzas-chat-history', JSON.stringify(recentHistory));
            this.state.chatHistory = recentHistory;
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    clearChatHistory() {
        if (confirm('Are you sure you want to clear all chat history?')) {
            this.state.chatHistory = [];
            localStorage.removeItem('finanzas-chat-history');
            
            // Clear chat messages except welcome message
            if (this.elements.chatMessages) {
                this.elements.chatMessages.innerHTML = `
                    <div class="welcome-message">
                        <div class="welcome-icon">🇮🇳</div>
                        <h2>Welcome to Finanzas AI!</h2>
                        <p>Your personal finance coach for Indian markets. Get expert advice on investments, tax planning, banking, insurance, and more.</p>
                    </div>
                `;
            }
            
            this.showToast('Chat history cleared', 'success');
        }
    }

    exportChat() {
        if (this.state.chatHistory.length === 0) {
            this.showToast('No chat history to export', 'info');
            return;
        }
        
        const chatData = {
            export_date: new Date().toISOString(),
            total_messages: this.state.chatHistory.length,
            messages: this.state.chatHistory.map(msg => ({
                content: msg.content,
                sender: msg.sender,
                timestamp: new Date(msg.timestamp).toLocaleString(),
                is_error: msg.isError || false
            }))
        };
        
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finanzas-ai-chat-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Chat exported successfully!', 'success');
    }

    openSettings() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.classList.remove('hidden');
            console.log('Settings modal opened');
        }
    }

    closeSettings() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.classList.add('hidden');
        }
        this.saveSettings();
    }

    updateVoiceSetting(setting, value) {
        this.config.voice[setting] = parseFloat(value);
        
        // Update display value
        const displayElement = document.getElementById(`${setting}-value`);
        if (displayElement) {
            displayElement.textContent = value;
        }
        
        this.saveSettings();
    }

    resetUsage() {
        this.state.requestCount = 0;
        this.state.lastRequestTime = null;
        
        try {
            localStorage.removeItem('finanzas-rate-limit');
        } catch (error) {
            console.error('Error resetting usage:', error);
        }
        
        this.updateUsageDisplay();
        this.showToast('Usage counter reset successfully!', 'success');
    }

    checkOnlineStatus() {
        this.updateOnlineStatus(navigator.onLine);
    }

    updateOnlineStatus(isOnline) {
        if (this.elements.offlineIndicator) {
            if (isOnline) {
                this.elements.offlineIndicator.classList.add('hidden');
            } else {
                this.elements.offlineIndicator.classList.remove('hidden');
            }
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        if (!this.elements.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s var(--ease-standard) reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Finanzas AI...');
    window.finanzasAI = new FinanzasAI();
    window.finanzasAI.init();
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('DOM already loaded, initializing Finanzas AI...');
    window.finanzasAI = new FinanzasAI();
    window.finanzasAI.init();
}