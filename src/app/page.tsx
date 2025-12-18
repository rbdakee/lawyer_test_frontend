'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Home() {
  const { translations, loading } = useLanguage();

  if (loading || !translations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7FF] to-white">
        <div className="text-2xl text-[#00AFCA] font-semibold">Загрузка...</div>
      </div>
    );
  }

  const t = translations.home;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full border-2 border-[#00AFCA]/20 relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#00AFCA] to-[#0099CC] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-4xl">⚖️</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-[#00AFCA] to-[#0099CC] bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-gray-600 text-lg">
            {t.selectMode}
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/demo"
            className="block w-full bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white text-center py-4 px-6 rounded-xl hover:from-[#0099CC] hover:to-[#0088BB] transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            🎓 {t.demo.title}
            <span className="block text-sm font-normal mt-1 opacity-90">
              {t.demo.description}
            </span>
          </Link>
          
          <Link
            href="/exam"
            className="block w-full bg-gradient-to-r from-[#FFB700] to-[#FFD700] text-white text-center py-4 px-6 rounded-xl hover:from-[#FFA500] hover:to-[#FFB700] transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            📝 {t.exam.title}
            <span className="block text-sm font-normal mt-1 opacity-90">
              {t.exam.description}
            </span>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            {t.country}
          </p>
        </div>
      </div>
    </div>
  );
}
