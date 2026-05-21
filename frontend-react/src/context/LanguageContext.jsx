import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import bn from '../locales/bn.json';

const LanguageContext = createContext();

const translations = { en, bn };

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('mb_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('mb_language', language);
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const t = (path) => {
    const keys = path.split('.');
    let result = translations[language];
    
    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        // Fallback to English if translation is missing in Bangla
        let fallback = translations['en'];
        for (const fKey of keys) {
          if (fallback && fallback[fKey] !== undefined) {
            fallback = fallback[fKey];
          } else {
            return path; // Return the path if key not found anywhere
          }
        }
        return fallback;
      }
    }
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
