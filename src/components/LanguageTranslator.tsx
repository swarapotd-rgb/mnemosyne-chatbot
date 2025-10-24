import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, Globe, Settings, Languages } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface LanguageTranslatorProps {
  text: string;
  className?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر' },
  { code: 'gom', name: 'Konkani', nativeName: 'कोंकणी' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mni', name: 'Manipuri (Meitei)', nativeName: 'মৈতৈলোন্' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' }
];

export function LanguageTranslator({ text, className = '' }: LanguageTranslatorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [translatedText, setTranslatedText] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);
  const [hasTranslated, setHasTranslated] = useState(false);

  // Check if speech synthesis is supported
  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  // Reset translation when text changes
  useEffect(() => {
    setTranslatedText(text);
    setHasTranslated(false);
  }, [text]);

  const translateText = async (textToTranslate: string, targetLang: string) => {
    if (!textToTranslate.trim() || targetLang === 'en') {
      setTranslatedText(textToTranslate);
      setHasTranslated(true);
      return;
    }

    setIsTranslating(true);
    try {
      // Using Google Translate API (free tier)
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
      const data = await response.json();
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translatedText = data[0].map((item: any) => item[0]).join('');
        setTranslatedText(translatedText);
        setHasTranslated(true);
      } else {
        // Fallback to original text if translation fails
        setTranslatedText(textToTranslate);
        setHasTranslated(true);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText(textToTranslate);
      setHasTranslated(true);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslate = () => {
    translateText(text, selectedLanguage);
  };

  const speakText = () => {
    if (!isSupported || !translatedText.trim()) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(translatedText);
    
    // Set language
    utterance.lang = selectedLanguage;
    
    // Set voice if available
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(selectedLanguage)) || voices[0];
    if (voice) {
      utterance.voice = voice;
    }

    // Set speech parameters
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-teal-600 text-sm ${className}`}>
        <VolumeX className="w-4 h-4" />
        <span>Text-to-speech not supported</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Controls Row */}
      <div className="flex items-center gap-2">
        {/* Language Selector */}
        <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  <span>{lang.nativeName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Translate Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleTranslate}
          disabled={isTranslating || selectedLanguage === 'en'}
          className="h-8 px-2 text-xs text-teal-600 hover:text-teal-800 hover:bg-teal-50"
        >
          <Languages className="w-3 h-3 mr-1" />
          {isTranslating ? 'Translating...' : 'Translate'}
        </Button>

        {/* Play/Stop Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={isPlaying ? stopSpeaking : speakText}
          disabled={!translatedText.trim() || isTranslating || !hasTranslated}
          className="h-8 w-8 p-0 text-teal-600 hover:text-teal-800 hover:bg-teal-50"
        >
          {isPlaying ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="h-8 w-8 p-0 text-teal-600 hover:text-teal-800 hover:bg-teal-50"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Translated Text Display */}
      {hasTranslated && selectedLanguage !== 'en' && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-teal-50/80 border border-teal-200 rounded-lg p-3 text-sm"
        >
          <div className="text-teal-700 font-medium mb-1">
            {SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage)?.nativeName}:
          </div>
          <div className="text-teal-900 leading-relaxed">
            {translatedText}
          </div>
        </motion.div>
      )}

      {/* Translation Status */}
      {isTranslating && (
        <div className="flex items-center gap-1 text-xs text-teal-600">
          <div className="w-3 h-3 border border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span>Translating...</span>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white border border-teal-200 rounded-lg p-3 shadow-lg z-10 min-w-48"
        >
          <div className="space-y-2">
            <div className="text-xs font-medium text-teal-900">Speech Settings</div>
            <div className="text-xs text-teal-600">
              Rate: <span className="font-mono">0.9</span> | 
              Pitch: <span className="font-mono">1.0</span> | 
              Volume: <span className="font-mono">0.8</span>
            </div>
            <div className="text-xs text-teal-600">
              Voice: {window.speechSynthesis.getVoices().find(v => v.lang.startsWith(selectedLanguage))?.name || 'Default'}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
