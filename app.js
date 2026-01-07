
class VoskTranscriptionApp {
    constructor() {
        this.recognizer = null;
        this.isRecording = false;
        this.recognition = null;
        this.isModelLoaded = true; // Always ready - no loading needed
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupServiceWorker();
        this.setupSpeechRecognition();
        
        // Auto-set Russian language
        document.getElementById('language').value = 'ru';
        this.onLanguageChange(); // Initialize Russian
        
        this.updateStatus('Готов к записи'); // "Ready to record" in Russian
        this.updateModelStatus('Ready'); // "Ready" in Russian
        
        // Enable recording immediately
        document.getElementById('start-recording').disabled = false;

        // Initialize button labels
         this.updateButtonLabels();
    }

    setupSpeechRecognition() {
        // Check if browser supports Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // Configure recognition for mobile
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'ru-RU'; // Russian by default
            
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
                this.updateStatus(`Ошибка распознавания: ${event.error}`, 'error');
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
            this.updateStatus('Ошибка: Распознавание речи не поддерживается', 'error');
        }
    }

    setupEventListeners() {
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
            
            if (status === 'Готов' || status === 'Ready') {
                modelStatus.parentElement.classList.add('loaded');
            } else {
                modelStatus.parentElement.classList.remove('loaded');
            }
        }
    }

    getLanguageCode() {
        const language = document.getElementById('language')?.value || 'ru';
        const languageCodes = {
            en: 'en-US',
            ru: 'ru-RU',
            cn: 'zh-CN'
        };
        return languageCodes[language] || 'ru-RU';
    }

    getLanguageName() {
        const names = { 
            en: 'English', 
            ru: 'Русский', 
            cn: '中文' 
        };
        return names[document.getElementById('language').value] || 'Русский';
    }

    onLanguageChange() {
        if (this.recognition) {
            this.recognition.lang = this.getLanguageCode();
            this.updateStatus(`Язык изменен: ${this.getLanguageName()}`);
            
            // Update transcription placeholder
            const lang = document.getElementById('language').value;
            const placeholders = {
                // en: 'Ready to record in English...',
                // ru: 'Готов к записи на русском...',
                // cn: '准备用中文录音...'
            };
            document.getElementById('transcription').textContent = placeholders[lang];

             this.updateButtonLabels();
        }
        this.updateButtonLabels();
    }

    startRecording() {
        if (this.isRecording || !this.recognition) return;
        
        try {
            // Request microphone permission
            navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
                this.recognition.start();
                this.isRecording = true;
                
                const startBtn = document.getElementById('start-recording');
                const stopBtn = document.getElementById('stop-recording');
                
                if (startBtn) startBtn.disabled = true;
                if (stopBtn) {
                    stopBtn.disabled = false;
                    stopBtn.classList.add('recording');
                }
                
                this.updateStatus('Слушаю... говорите!'); // "Listening... speak!"
            }).catch(error => {
                console.error('Microphone permission denied:', error);
                this.updateStatus('Ошибка: Доступ к микрофону запрещен', 'error');
            });
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.updateStatus(`Ошибка записи: ${error.message}`, 'error');
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
        
        this.updateStatus('Запись остановлена'); // "Recording stopped"
    }

    updateTranscription(text) {
        const transcriptionDiv = document.getElementById('transcription');
        if (transcriptionDiv && text) {
            transcriptionDiv.textContent = text;
            // Scroll to bottom to show latest text
            transcriptionDiv.scrollTop = transcriptionDiv.scrollHeight;
        }

        this.updateButtonLabels();
    }

  // Update the updateButtonLabels() method:
// Update the updateButtonLabels() method:
updateButtonLabels() {
    const lang = document.getElementById('language').value;
    const recordButton = document.getElementById('start-recording');
    const stopButton = document.getElementById('stop-recording');
    const translateBtn = document.getElementById('translateBtn');
    const transcriptionBox = document.getElementById('transcription');
    
    // Check if there's actual transcribed text (not just placeholder)
    const hasTranscription = transcriptionBox && 
                           transcriptionBox.textContent.trim() && 
                           !transcriptionBox.textContent.includes('Ready to record') && 
                           !transcriptionBox.textContent.includes('Готов к записи') && 
                           !transcriptionBox.textContent.includes('准备用中文录音');
    
    if (lang === 'zh' || lang === 'cn') {  
        if (recordButton) recordButton.textContent = '开始录音';
        if (stopButton) stopButton.textContent = '停止录音';
        if (translateBtn) {
            translateBtn.textContent = '翻译';
            translateBtn.disabled = !hasTranscription;
        }
    } else {  
        if (recordButton) recordButton.textContent = 'Record';
        if (stopButton) stopButton.textContent = 'Stop';
        if (translateBtn) {
            translateBtn.textContent = 'Translate';
            translateBtn.disabled = !hasTranscription;
        }
    }
}


}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VoskTranscriptionApp();
});