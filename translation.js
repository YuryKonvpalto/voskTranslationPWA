// translation.js - Translation logic from offline-translator script.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Get DOM elements
    const transcriptionArea = document.getElementById('transcription');
    const translateBtn = document.getElementById('translateBtn');
    const translationOutput = document.getElementById('translationOutput');
    const languageSelect = document.getElementById('language'); // Get the language selector

    // Check if all required elements exist
    if (!transcriptionArea || !translateBtn || !translationOutput || !languageSelect) {
        console.error('Translation module: Missing elements. Stopping.');
        return;
    }

    // Initialize translator
    let translator = null;

    try {
        const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.5.0');
        translator = {
            enToZh: await pipeline('translation', 'Xenova/opus-mt-en-zh'),
            zhToEn: await pipeline('translation', 'Xenova/opus-mt-zh-en')
        };
        translateBtn.disabled = false;
    } catch (error) {
        console.error('Error loading translation model:', error);
        translationOutput.value = 'Failed to load translation models';
    }

    // Function to update translation direction based on selected language
    function updateTranslationDirection() {
        const lang = languageSelect.value;
        if (lang === 'en') {
            translator.current = translator.enToZh;
        } else if (lang === 'zh' || lang === 'cn') { // <-- Fix: Add 'cn' here
            translator.current = translator.zhToEn;
        } else {
            console.error('Unsupported language for translation:', lang);
        }
    }

    // Initial translation direction setup
    updateTranslationDirection();

    // Add click event listener to translate button
    translateBtn.addEventListener('click', async function() {
        if (!translator || !translator.current) {
            translationOutput.value = 'Translation model not loaded';
            return;
        }

        const text = transcriptionArea.textContent.trim();
        if (!text) {
            translationOutput.value = 'No text to translate';
            return;
        }

        try {
            translateBtn.disabled = true;
            translationOutput.value = 'Translating...';

            const result = await translator.current(text);
            translationOutput.value = result[0].translation_text;
        } catch (error) {
            console.error('Translation error:', error);
            translationOutput.value = 'Translation failed: ' + error.message;
        } finally {
            translateBtn.disabled = false;
        }
    });

    // Observe changes to the transcription area
    const observer = new MutationObserver(function() {
        const text = transcriptionArea.textContent.trim();
        translateBtn.disabled = !text || !translator.current;
    });

    observer.observe(transcriptionArea, {
        childList: true,
        characterData: true,
        subtree: true
    });

    // Add change event listener to the language selector
    languageSelect.addEventListener('change', updateTranslationDirection);
});