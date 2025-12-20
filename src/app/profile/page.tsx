'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/config/api';
import { ExamHistoryResponse, ExamResult } from '@/types';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, token, isAuthenticated, login, register, logout } = useAuth();
  const { translations, language } = useLanguage();
  const router = useRouter();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({ phone: '', password: '', name: '' });
  const [examHistory, setExamHistory] = useState<ExamHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && token) {
      loadExamHistory();
    }
  }, [isAuthenticated, token]);

  const loadExamHistory = async () => {
    try {
      const history = await apiRequest<ExamHistoryResponse>('/api/exams/history', {
        method: 'GET',
      }, token || undefined);
      setExamHistory(history);
    } catch (err) {
      console.error('Ошибка загрузки истории:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginMode) {
        await login({ phone: formData.phone, password: formData.password });
      } else {
        await register(formData);
      }
      router.push('/profile');
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full border-2 border-[#00AFCA]/20 relative">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#00AFCA] to-[#0099CC] bg-clip-text text-transparent">
              {isLoginMode ? (translations?.profile?.loginTitle || 'Кіру') : (translations?.profile?.registerTitle || 'Тіркелу')}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translations?.profile?.phone || 'Телефон'}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AFCA] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translations?.profile?.password || 'Пароль'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AFCA] focus:border-transparent"
                required
              />
            </div>

            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {translations?.profile?.name || 'Аты'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AFCA] focus:border-transparent"
                  required
                />
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white py-3 rounded-lg font-semibold hover:from-[#0099CC] hover:to-[#0088BB] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (translations?.profile?.loading || 'Жүктелуде...') : (isLoginMode ? (translations?.profile?.login || 'Кіру') : (translations?.profile?.register || 'Тіркелу'))}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError('');
              }}
              className="text-[#00AFCA] hover:underline text-sm"
            >
              {isLoginMode ? (translations?.profile?.noAccount || 'Аккаунт жоқ па? Тіркелу') : (translations?.profile?.hasAccount || 'Аккаунт бар ма? Кіру')}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-[#00AFCA] hover:underline text-sm">
              ← {translations?.profile?.home || translations?.home?.backButton || 'Басты бетке'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Показываем профиль
  const sectionNames: Record<string, { kz: string; ru: string }> = {
    'civil_code': { kz: 'Азаматтық кодекс', ru: 'Гражданский кодекс' },
    'civil_process_code': { kz: 'Азаматтық процестік кодекс', ru: 'Гражданский процессуальный кодекс' },
    'criminal_code': { kz: 'Қылмыстық кодекс', ru: 'Уголовный кодекс' },
    'criminal_process_code': { kz: 'Қылмыстық процестік кодекс', ru: 'Уголовно процессуальный кодекс' },
    'administrative_offenses_code': { kz: 'Әкімшілік құқықбұзушылықтар туралы кодекс', ru: 'Кодекс об административных правонарушениях' },
    'anti_corruption_law': { kz: 'Коррупцияға қарсы күрес туралы заң', ru: 'Закон "О противодействии коррупции"' },
    'administrative_procedure_code': { kz: 'Әкімшілік процедуралық-процестік кодекс', ru: 'Административный процедурно-процессуальный кодекс' },
    'advocacy_law': { kz: 'Адвокаттық қызмет және заңды көмек туралы заң', ru: 'Закон "Об адвокатской деятельности и юридической помощи"' },
    'aml_law': { kz: 'Қылмыстық жолмен алынған кірістерді легализациялауға (ақтауға) қарсы күрес және терроризмді қаржыландыруға қарсы күрес туралы заң', ru: 'Закон "О противодействии легализации (отмыванию) доходов, полученных преступным путем, и финансированию терроризма"' },
  };

  const t = translations?.profile || {};
  const common = translations?.common || {};
  const lang = language;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-[#00AFCA]/20 relative">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#00AFCA] to-[#0099CC] bg-clip-text text-transparent">
              {t.greeting || 'Сәлеметсіз бе'}, {user?.name}!
            </h1>
            <button
              onClick={logout}
              className="text-sm text-red-500 hover:underline"
            >
              {t.logout || 'Шығу'}
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t.examHistory || 'Емтихан тарихы'}</h2>
            {examHistory && examHistory.exams.length > 0 ? (
              <div className="space-y-4">
                {examHistory.exams.map((exam) => (
                  <Link
                    key={exam.id}
                    href={`/exam/${exam.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">
                          {exam.mode === 'exam' 
                            ? (translations?.exam?.title || 'Емтихан')
                            : exam.mode === 'demo' 
                            ? (translations?.demo?.title || 'Демо режим')
                            : (translations?.trainer?.title || 'Тренажер')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(exam.created_at).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${exam.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {exam.score.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-500">
                          {exam.correct_answers}/{exam.total_questions}
                        </p>
                        <p className="text-xs text-blue-600 mt-1 hover:underline">{t.viewDetails || 'Толық мәліметтерді қарау →'}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">{t.noExams || 'Әлі өткізілген емтихандар жоқ'}</p>
            )}
          </div>

          {examHistory && examHistory.overall_statistics && Object.keys(examHistory.overall_statistics).length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">{t.statistics || 'Тақырыптар бойынша статистика'}</h2>
              <div className="space-y-3">
                {Object.entries(examHistory.overall_statistics).map(([section, stats]) => {
                  const percentage = stats.total > 0 ? (stats.correct / stats.total * 100).toFixed(1) : '0';
                  const sectionName = sectionNames[section]?.[lang] || section;
                  return (
                    <div key={section} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{sectionName}</p>
                          <p className="text-sm text-gray-500">
                            {t.correct || 'Дұрыс'}: {stats.correct} / {t.total || 'Барлығы'}: {stats.total}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-[#00AFCA]">{percentage}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8">
            <Link href="/" className="text-[#00AFCA] hover:underline">
              ← {t.home || translations?.home?.backButton || 'Басты бетке'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

