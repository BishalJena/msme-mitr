/**
 * Language Management Hook
 * Handles language selection and translations
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  languageService,
  SupportedLanguage,
  LanguageInfo,
  TranslationStrings
} from '@/services/language/languageService';

interface LanguageContextValue {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  translations: TranslationStrings;
  languages: LanguageInfo[];
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  formatIndianAmount: (amount: number) => string;
  detectLanguage: (text: string) => SupportedLanguage;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/**
 * Language Provider Component
 */
export function LanguageProvider({
  children,
  defaultLanguage = 'en'
}: {
  children: React.ReactNode;
  defaultLanguage?: SupportedLanguage;
}) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [translations, setTranslations] = useState<TranslationStrings>(
    languageService.getTranslations(defaultLanguage)
  );

  // Load language preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferredLanguage') as SupportedLanguage;
      if (savedLanguage && languageService.getSupportedLanguages().find(l => l.code === savedLanguage)) {
        setCurrentLanguage(savedLanguage);
        setTranslations(languageService.getTranslations(savedLanguage));
      }
    }
  }, []);

  // Set language
  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    setTranslations(languageService.getTranslations(lang));

    // Save preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', lang);
    }

    // Update document language attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = languageService
        .getSupportedLanguages()
        .find(l => l.code === lang)?.locale || 'en-IN';
    }
  }, []);

  // Format functions bound to current language
  const formatCurrency = useCallback(
    (amount: number) => languageService.formatCurrency(amount, currentLanguage),
    [currentLanguage]
  );

  const formatNumber = useCallback(
    (num: number) => languageService.formatNumber(num, currentLanguage),
    [currentLanguage]
  );

  const formatIndianAmount = useCallback(
    (amount: number) => languageService.formatIndianAmount(amount, currentLanguage),
    [currentLanguage]
  );

  const value: LanguageContextValue = {
    currentLanguage,
    setLanguage,
    translations,
    languages: languageService.getSupportedLanguages(),
    formatCurrency,
    formatNumber,
    formatIndianAmount,
    detectLanguage: languageService.detectLanguage
  };

  const Provider = LanguageContext.Provider as any;

  return React.createElement(Provider, { value }, children);
}

/**
 * Hook to use language context
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Standalone hook for language management (without provider)
 */
export function useLanguageStandalone(initialLanguage: SupportedLanguage = 'en') {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [translations, setTranslations] = useState<TranslationStrings>(
    languageService.getTranslations(initialLanguage)
  );

  // Load saved preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') as SupportedLanguage;
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
      setTranslations(languageService.getTranslations(savedLanguage));
    }
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    setTranslations(languageService.getTranslations(lang));
    localStorage.setItem('preferredLanguage', lang);

    // Update document language
    if (typeof document !== 'undefined') {
      const langInfo = languageService.getSupportedLanguages().find(l => l.code === lang);
      if (langInfo) {
        document.documentElement.lang = langInfo.locale;
        document.documentElement.dir = langInfo.direction;
      }
    }
  }, []);

  return {
    currentLanguage,
    setLanguage,
    translations,
    languages: languageService.getSupportedLanguages(),
    formatCurrency: useCallback(
      (amount: number) => languageService.formatCurrency(amount, currentLanguage),
      [currentLanguage]
    ),
    formatNumber: useCallback(
      (num: number) => languageService.formatNumber(num, currentLanguage),
      [currentLanguage]
    ),
    formatIndianAmount: useCallback(
      (amount: number) => languageService.formatIndianAmount(amount, currentLanguage),
      [currentLanguage]
    ),
    getLanguagePrompt: useCallback(
      () => languageService.getLanguagePrompt(currentLanguage),
      [currentLanguage]
    ),
    detectLanguage: languageService.detectLanguage
  };
}

/**
 * Hook for auto-detecting user's preferred language
 */
export function useAutoLanguageDetection() {
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLanguage>('en');
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectUserLanguage = () => {
      // Check browser language
      const browserLang = navigator.language.toLowerCase();

      // Map browser language to supported language
      const langMap: Record<string, SupportedLanguage> = {
        'hi': 'hi',
        'hi-in': 'hi',
        'ta': 'ta',
        'ta-in': 'ta',
        'te': 'te',
        'te-in': 'te',
        'bn': 'bn',
        'bn-in': 'bn',
        'mr': 'mr',
        'mr-in': 'mr',
        'gu': 'gu',
        'gu-in': 'gu',
        'kn': 'kn',
        'kn-in': 'kn',
        'ml': 'ml',
        'ml-in': 'ml',
        'pa': 'pa',
        'pa-in': 'pa',
        'or': 'or',
        'or-in': 'or',
        'as': 'as',
        'as-in': 'as'
      };

      // Check if browser language matches supported language
      for (const [key, value] of Object.entries(langMap)) {
        if (browserLang.includes(key)) {
          setDetectedLanguage(value);
          setIsDetecting(false);
          return;
        }
      }

      // Default to English
      setDetectedLanguage('en');
      setIsDetecting(false);
    };

    detectUserLanguage();
  }, []);

  return { detectedLanguage, isDetecting };
}