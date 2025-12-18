'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from '@/config/api';

type Language = 'kz' | 'ru';

interface Translations {
  [key: string]: any;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: Translations | null;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('kz');
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем язык из localStorage или используем по умолчанию
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && (savedLanguage === 'kz' || savedLanguage === 'ru')) {
        setLanguageState(savedLanguage);
        fetchTranslations(savedLanguage);
      } else {
        fetchTranslations('kz');
      }
    } else {
      fetchTranslations('kz');
    }
  }, []);

  const fetchTranslations = async (lang: Language) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/translations/${lang}`);
      const data = await response.json();
      setTranslations(data.translations);
    } catch (error) {
      console.error('Error fetching translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
    fetchTranslations(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

