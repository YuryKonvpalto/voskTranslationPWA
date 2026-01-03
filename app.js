class VoskTranscriptionApp {
    constructor() {
        this.recognizer = null;
        this.isRecording = false;
        this.recognition = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupServiceWorker();
        this.setupSpeechRecognition();
        this.updateStatus('Ready');
    }

    setupSpeechRecognition() {
        // Check if browser supports Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // Configure recognition for mobile
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                const displayText = finalTranscript || interimTranscript;
                if (displayText) {
                    this.updateTranscription(displayText);
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.updateStatus(`Recognition error: ${event.error}`, 'error');
                this.stopRecording();
            };
            
            this.recognition.onend = () => {
                console.log('Speech recognition ended');
                if (this.isRecording) {
                    this.stopRecording();
                }
            };
            
            console.log('Speech recognition initialized for mobile');
        } else {
            console.warn('Web Speech API not supported in this browser');
            this.updateStatus('Error: Speech recognition not supported', 'error');
        }
    }

    setupEventListeners() {
        document.getElementById('load-model')?.addEventListener('click', () => this.loadModel());
        document.getElementById('start-recording')?.addEventListener('click', () => this.startRecording());
        document.getElementById('stop-recording')?.addEventListener('click', () => this.stopRecording());
        document.getElementById('language')?.addEventListener('change', () => this.onLanguageChange());
        
        // Add touch feedback for mobile
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.95)';
            });
            button.addEventListener('touchend', () => {
                button.style.transform = '';
            });
        });
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('ServiceWorker registration successful');
            } catch (error) {
                console.log('ServiceWorker registration failed:', error);
            }
        }
    }

    updateStatus(message, type = 'info') {
        const statusBar = document.getElementById('status');
        if (statusBar) {
            statusBar.textContent = message;
            statusBar.className = `status-bar ${type}`;
        }
    }

    updateModelStatus(status) {
        const modelStatus = document.getElementById('model-status');
        if (modelStatus) {
            modelStatus.textContent = `Status: ${status}`;
            
            if (status === 'Ready') {
                modelStatus.parentElement.classList.add('loaded');
            } else {
                modelStatus.parentElement.classList.remove('loaded');
            }
        }
    }

    getLanguageCode() {
        const language = document.getElementById('language')?.value || 'en';
        const languageCodes = {
            en: 'en-US',
            ru: 'ru-RU',
            cn: 'zh-CN'
        };
        return languageCodes[language] || 'en-US';
    }

    loadModel() {
        const language = this.getLanguageCode();
        
        try {
            this.updateStatus('Preparing speech recognition...', 'loading');
            this.updateModelStatus('Loading...');
            
            if (this.recognition) {
                this.recognition.lang = language;
            }
            
            // Simulate loading for better UX
            setTimeout(() => {
                this.isModelLoaded = true;
                this.updateStatus('Ready to record', 'success');
                this.updateModelStatus('Ready');
                
                // Enable recording
                const startRecordingBtn = document.getElementById('start-recording');
                if (startRecordingBtn) {
                    startRecordingBtn.disabled = false;
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error loading speech recognition:', error);
            this.updateStatus(`Error: ${error.message}`, 'error');
            this.updateModelStatus('Failed');
        }
    }

    async startRecording() {
        if (this.isRecording || !this.recognition) return;
        
        try {
            // Request microphone permission
            await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.recognition.start();
            this.isRecording = true;
            
            const startBtn = document.getElementById('start-recording');
            const stopBtn = document.getElementById('stop-recording');
            
            if (startBtn) startBtn.disabled = true;
            if (stopBtn) {
                stopBtn.disabled = false;
                stopBtn.classList.add('recording');
            }
            
            this.updateStatus('Listening... speak now!', 'recording');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.updateStatus(`Recording error: ${error.message}`, 'error');
            
            // Handle permission denied
            if (error.name === 'NotAllowedError') {
                alert('Microphone access denied. Please enable microphone permissions in your browser settings.');
            }
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.recognition) return;
        
        this.recognition.stop();
        this.isRecording = false;
        
        const startBtn = document.getElementById('start-recording');
        const stopBtn = document.getElementById('stop-recording');
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) {
            stopBtn.disabled = true;
            stopBtn.classList.remove('recording');
        }
        
        this.updateStatus('Recording stopped', 'info');
    }

    updateTranscription(text) {
        const transcriptionDiv = document.getElementById('transcription');
        if (transcriptionDiv && text) {
            transcriptionDiv.textContent = text;
            // Scroll to bottom to show latest text
            transcriptionDiv.scrollTop = transcriptionDiv.scrollHeight;
        }
    }

    onLanguageChange() {
        this.isModelLoaded = false;
        const startBtn = document.getElementById('start-recording');
        if (startBtn) startBtn.disabled = true;
        this.updateModelStatus('Not ready');
        
        if (this.recognition) {
            this.recognition.lang = this.getLanguageCode();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VoskTranscriptionApp();
});