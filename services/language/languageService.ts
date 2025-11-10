/**
 * Multi-Language Support Service
 * Handles translation and localization for Indian languages
 */

export type SupportedLanguage =
  | 'en' // English
  | 'hi' // Hindi
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'bn' // Bengali
  | 'mr' // Marathi
  | 'gu' // Gujarati
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'pa' // Punjabi
  | 'or' // Odia
  | 'as'; // Assamese

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  locale: string;
}

export interface TranslationStrings {
  greeting: string;
  helpMessage: string;
  errorMessage: string;
  offlineMessage: string;
  recordingMessage: string;
  typingMessage: string;
  sendButton: string;
  cancelButton: string;
  confirmButton: string;
  schemes: string;
  eligibility: string;
  benefits: string;
  applyNow: string;
  learnMore: string;
  contactSupport: string;
  quickActions: string;
  voiceInputPlaceholder: string;
  textInputPlaceholder: string;
}

class LanguageService {
  private currentLanguage: SupportedLanguage = 'en';

  /**
   * Get all supported languages
   */
  public getSupportedLanguages(): LanguageInfo[] {
    return [
      { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', locale: 'en-IN' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', locale: 'hi-IN' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr', locale: 'ta-IN' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr', locale: 'te-IN' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr', locale: 'bn-IN' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr', locale: 'mr-IN' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', direction: 'ltr', locale: 'gu-IN' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', direction: 'ltr', locale: 'kn-IN' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', direction: 'ltr', locale: 'ml-IN' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', direction: 'ltr', locale: 'pa-IN' },
      { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', direction: 'ltr', locale: 'or-IN' },
      { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', direction: 'ltr', locale: 'as-IN' }
    ];
  }

  /**
   * Get translation strings for a language
   */
  public getTranslations(language: SupportedLanguage): TranslationStrings {
    const translations: Record<SupportedLanguage, TranslationStrings> = {
      en: {
        greeting: 'Hello! I am your MSME AI Assistant',
        helpMessage: 'How can I help you today?',
        errorMessage: 'Something went wrong. Please try again.',
        offlineMessage: 'You are offline. Using cached information.',
        recordingMessage: 'Recording... Speak now',
        typingMessage: 'Typing...',
        sendButton: 'Send',
        cancelButton: 'Cancel',
        confirmButton: 'Confirm',
        schemes: 'Government Schemes',
        eligibility: 'Check Eligibility',
        benefits: 'Benefits',
        applyNow: 'Apply Now',
        learnMore: 'Learn More',
        contactSupport: 'Contact Support',
        quickActions: 'Quick Actions',
        voiceInputPlaceholder: 'Tap to speak',
        textInputPlaceholder: 'Type your message...'
      },
      hi: {
        greeting: 'नमस्ते! मैं आपका MSME AI सहायक हूं',
        helpMessage: 'मैं आज आपकी कैसे मदद कर सकता हूं?',
        errorMessage: 'कुछ गलत हो गया। कृपया फिर से प्रयास करें।',
        offlineMessage: 'आप ऑफलाइन हैं। कैश्ड जानकारी का उपयोग कर रहे हैं।',
        recordingMessage: 'रिकॉर्डिंग... अब बोलिए',
        typingMessage: 'टाइप कर रहे हैं...',
        sendButton: 'भेजें',
        cancelButton: 'रद्द करें',
        confirmButton: 'पुष्टि करें',
        schemes: 'सरकारी योजनाएं',
        eligibility: 'पात्रता जांचें',
        benefits: 'लाभ',
        applyNow: 'अभी आवेदन करें',
        learnMore: 'और जानें',
        contactSupport: 'सहायता से संपर्क करें',
        quickActions: 'त्वरित क्रियाएं',
        voiceInputPlaceholder: 'बोलने के लिए टैप करें',
        textInputPlaceholder: 'अपना संदेश टाइप करें...'
      },
      ta: {
        greeting: 'வணக்கம்! நான் உங்கள் MSME AI உதவியாளர்',
        helpMessage: 'இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
        errorMessage: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
        offlineMessage: 'நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். தற்காலிக தகவலைப் பயன்படுத்துகிறது.',
        recordingMessage: 'பதிவு செய்கிறது... இப்போது பேசுங்கள்',
        typingMessage: 'தட்டச்சு செய்கிறது...',
        sendButton: 'அனுப்பு',
        cancelButton: 'ரத்து செய்',
        confirmButton: 'உறுதிப்படுத்து',
        schemes: 'அரசு திட்டங்கள்',
        eligibility: 'தகுதியை சரிபார்க்கவும்',
        benefits: 'நன்மைகள்',
        applyNow: 'இப்போது விண்ணப்பிக்கவும்',
        learnMore: 'மேலும் அறிக',
        contactSupport: 'ஆதரவை தொடர்பு கொள்ளவும்',
        quickActions: 'விரைவு செயல்கள்',
        voiceInputPlaceholder: 'பேச தட்டவும்',
        textInputPlaceholder: 'உங்கள் செய்தியை தட்டச்சு செய்யவும்...'
      },
      te: {
        greeting: 'నమస్తే! నేను మీ MSME AI సహాయకుడిని',
        helpMessage: 'ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?',
        errorMessage: 'ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
        offlineMessage: 'మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. కాష్ చేసిన సమాచారాన్ని ఉపయోగిస్తున్నారు.',
        recordingMessage: 'రికార్డింగ్... ఇప్పుడు మాట్లాడండి',
        typingMessage: 'టైప్ చేస్తున్నారు...',
        sendButton: 'పంపండి',
        cancelButton: 'రద్దు చేయండి',
        confirmButton: 'నిర్ధారించండి',
        schemes: 'ప్రభుత్వ పథకాలు',
        eligibility: 'అర్హతను తనిఖీ చేయండి',
        benefits: 'ప్రయోజనాలు',
        applyNow: 'ఇప్పుడు దరఖాస్తు చేయండి',
        learnMore: 'మరింత తెలుసుకోండి',
        contactSupport: 'మద్దతును సంప్రదించండి',
        quickActions: 'త్వరిత చర్యలు',
        voiceInputPlaceholder: 'మాట్లాడటానికి నొక్కండి',
        textInputPlaceholder: 'మీ సందేశాన్ని టైప్ చేయండి...'
      },
      // Add more languages as needed
      bn: this.getDefaultTranslations('bn'),
      mr: this.getDefaultTranslations('mr'),
      gu: this.getDefaultTranslations('gu'),
      kn: this.getDefaultTranslations('kn'),
      ml: this.getDefaultTranslations('ml'),
      pa: this.getDefaultTranslations('pa'),
      or: this.getDefaultTranslations('or'),
      as: this.getDefaultTranslations('as')
    };

    return translations[language] || translations.en;
  }

  /**
   * Get default translations (fallback to English)
   */
  private getDefaultTranslations(lang: SupportedLanguage): TranslationStrings {
    // In production, these would be properly translated
    return this.getTranslations('en');
  }

  /**
   * Format currency for locale
   */
  public formatCurrency(amount: number, language: SupportedLanguage): string {
    const locales: Record<SupportedLanguage, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      bn: 'bn-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      or: 'or-IN',
      as: 'as-IN'
    };

    return new Intl.NumberFormat(locales[language], {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format number for locale
   */
  public formatNumber(num: number, language: SupportedLanguage): string {
    const locales: Record<SupportedLanguage, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      bn: 'bn-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      or: 'or-IN',
      as: 'as-IN'
    };

    return new Intl.NumberFormat(locales[language]).format(num);
  }

  /**
   * Get language-specific system prompt additions
   */
  public getLanguagePrompt(language: SupportedLanguage): string {
    const prompts: Partial<Record<SupportedLanguage, string>> = {
      en: 'Respond in simple English. Use Indian English conventions.',
      hi: 'हिंदी में जवाब दें। सरल और स्पष्ट भाषा का प्रयोग करें।',
      ta: 'தமிழில் பதிலளிக்கவும். எளிய மற்றும் தெளிவான மொழியைப் பயன்படுத்தவும்.',
      te: 'తెలుగులో స్పందించండి. సరళమైన మరియు స్పష్టమైన భాషను ఉపయోగించండి.',
      bn: 'বাংলায় উত্তর দিন। সহজ এবং স্পষ্ট ভাষা ব্যবহার করুন।',
      mr: 'मराठीत उत्तर द्या. सोपी आणि स्पष्ट भाषा वापरा.',
      gu: 'ગુજરાતીમાં જવાબ આપો. સરળ અને સ્પષ્ટ ભાષાનો ઉપયોગ કરો.',
      kn: 'ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ. ಸರಳ ಮತ್ತು ಸ್ಪಷ್ಟ ಭಾಷೆಯನ್ನು ಬಳಸಿ.',
      ml: 'മലയാളത്തിൽ മറുപടി നൽകുക. ലളിതവും വ്യക്തവുമായ ഭാഷ ഉപയോഗിക്കുക.',
      pa: 'ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ। ਸਧਾਰਨ ਅਤੇ ਸਪੱਸ਼ਟ ਭਾਸ਼ਾ ਦੀ ਵਰਤੋਂ ਕਰੋ।',
      or: 'ଓଡ଼ିଆରେ ଉତ୍ତର ଦିଅନ୍ତୁ। ସରଳ ଏବଂ ସ୍ପଷ୍ଟ ଭାଷା ବ୍ୟବହାର କରନ୍ତୁ।',
      as: 'অসমীয়াত উত্তৰ দিয়ক। সৰল আৰু স্পষ্ট ভাষা ব্যৱহাৰ কৰক।'
    };

    return prompts[language] || prompts.en!;
  }

  /**
   * Detect language from text (simplified)
   */
  public detectLanguage(text: string): SupportedLanguage {
    // Check for Hindi characters
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    // Check for Tamil characters
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
    // Check for Telugu characters
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
    // Check for Bengali characters
    if (/[\u0980-\u09FF]/.test(text)) return 'bn';
    // Check for Marathi (uses Devanagari like Hindi)
    if (/[\u0900-\u097F]/.test(text) && text.includes('आणि')) return 'mr';
    // Check for Gujarati characters
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';
    // Check for Kannada characters
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
    // Check for Malayalam characters
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
    // Check for Punjabi characters
    if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';
    // Check for Odia characters
    if (/[\u0B00-\u0B7F]/.test(text)) return 'or';
    // Check for Assamese (similar to Bengali)
    if (/[\u0980-\u09FF]/.test(text) && text.includes('অসমীয়া')) return 'as';

    // Default to English
    return 'en';
  }

  /**
   * Get numeric system for language
   */
  public getNumericSystem(language: SupportedLanguage): 'international' | 'indian' {
    // Most Indian languages use the Indian numbering system
    return language === 'en' ? 'international' : 'indian';
  }

  /**
   * Format amount in Indian numbering (Lakhs, Crores)
   */
  public formatIndianAmount(amount: number, language: SupportedLanguage): string {
    if (amount >= 10000000) {
      const crores = (amount / 10000000).toFixed(2);
      return language === 'en'
        ? `₹${crores} Crore`
        : `₹${crores} करोड़`; // Example in Hindi
    } else if (amount >= 100000) {
      const lakhs = (amount / 100000).toFixed(2);
      return language === 'en'
        ? `₹${lakhs} Lakh`
        : `₹${lakhs} लाख`; // Example in Hindi
    }
    return this.formatCurrency(amount, language);
  }
}

// Export singleton instance
export const languageService = new LanguageService();