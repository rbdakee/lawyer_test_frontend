'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/config/api';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Home() {
  const { translations, loading } = useLanguage();
  const { isAuthenticated, token, user } = useAuth();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading || !translations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7FF] to-white">
        <div className="text-2xl text-[#00AFCA] font-semibold">{translations?.common?.loading || 'Жүктелуде...'}</div>
      </div>
    );
  }

  const t = translations.home || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-2xl w-full border-2 border-[#00AFCA]/20 relative">
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
            {t.title || 'Подготовка к юридическому экзамену'}
          </h1>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/profile"
            className="block w-full bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white text-center py-4 px-6 rounded-xl hover:from-[#0099CC] hover:to-[#0088BB] transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            👤 {isAuthenticated ? 'Профиль' : 'Авторизоваться'}
          </Link>
          
          {isAuthenticated && user?.is_admin && (
            <Link
              href="/admin"
              className="block w-full bg-gradient-to-r from-[#9C27B0] to-[#7B1FA2] text-white text-center py-4 px-6 rounded-xl hover:from-[#7B1FA2] hover:to-[#6A1B9A] transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              ⚙️ {translations?.home?.admin?.title || 'Админка'}
            </Link>
          )}
          
          <Link
            href="/exam"
            className="block w-full bg-gradient-to-r from-[#FFB700] to-[#FFD700] text-white text-center py-4 px-6 rounded-xl hover:from-[#FFA500] hover:to-[#FFB700] transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            📝 {translations?.exam?.title || 'Емтихан'}
          </Link>
          
          <Link
            href="/demo"
            className="block w-full bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white text-center py-4 px-6 rounded-xl hover:from-[#0099CC] hover:to-[#0088BB] transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            🎓 {translations?.demo?.title || 'Демо режим'}
          </Link>
          
          <Link
            href="/trainer"
            className="block w-full bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white text-center py-4 px-6 rounded-xl hover:from-[#45a049] hover:to-[#3d8b40] transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            🏋️ {translations?.home?.trainer?.title || translations?.trainer?.title || 'Тренажер'}
          </Link>
          
          <div className="relative">
            <div className="block w-full bg-gray-300 text-gray-500 text-center py-4 px-6 rounded-xl font-semibold text-lg cursor-not-allowed opacity-60">
              📚 Лекции
              <span className="block text-xs font-normal mt-1">В разработке</span>
            </div>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="block w-full bg-gradient-to-r from-[#FF6B6B] to-[#EE5A6F] text-white text-center py-4 px-6 rounded-xl hover:from-[#EE5A6F] hover:to-[#DD4A5F] transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            📝 Report
          </button>
        </div>

        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full border-2 border-[#00AFCA]/20">
              <h2 className="text-2xl font-bold mb-4">{translations?.common?.sendReport || 'Есеп жіберу'}</h2>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder={translations?.common?.reportPlaceholder || 'Есеп мәтінін енгізіңіз...'}
                className="w-full h-40 px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-[#00AFCA] focus:border-transparent"
              />
              <div className="flex gap-4">
                <button
                  onClick={async () => {
                    if (!reportText.trim()) {
                      alert(translations?.common?.pleaseEnterReport || 'Есеп мәтінін енгізіңіз');
                      return;
                    }
                    if (!isAuthenticated || !token) {
                      alert(translations?.common?.needAuth || 'Кіру қажет');
                      return;
                    }
                    setSubmitting(true);
                    try {
                      await apiRequest('/api/reports', {
                        method: 'POST',
                        body: JSON.stringify({ text: reportText }),
                      }, token);
                      setShowReportModal(false);
                      setReportText('');
                      alert(translations?.common?.reportSent || 'Есеп жіберілді');
                    } catch (error: any) {
                      alert(error.message || (translations?.common?.errorSendingReport || 'Есеп жіберу кезінде қате'));
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white py-3 rounded-lg font-semibold hover:from-[#0099CC] hover:to-[#0088BB] transition disabled:opacity-50"
                >
                  {submitting ? (translations?.profile?.submitting || 'Жіберілуде...') : (translations?.common?.sendReport || 'Жіберу')}
                </button>
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportText('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  {translations?.common?.cancel || 'Болдырмау'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            {t.country || 'Республика Казахстан'}
          </p>
        </div>
      </div>
    </div>
  );
}
