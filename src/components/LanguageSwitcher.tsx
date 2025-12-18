'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-md p-1 border-2 border-[#00AFCA]/20">
      <button
        onClick={() => setLanguage('kz')}
        className={`px-4 py-2 rounded-md font-semibold transition-all duration-200 ${
          language === 'kz'
            ? 'bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        Қаз
      </button>
      <button
        onClick={() => setLanguage('ru')}
        className={`px-4 py-2 rounded-md font-semibold transition-all duration-200 ${
          language === 'ru'
            ? 'bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        Рус
      </button>
    </div>
  );
}

