'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/config/api';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

interface QuestionWithAnswer {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  section: string;
  section_name: { kz: string; ru: string };
  user_answer: number;
  is_correct: boolean;
}

interface ExamDetails {
  exam: {
    id: string;
    mode: string;
    score: number;
    correct_answers: number;
    total_questions: number;
    passed: boolean;
    time_spent?: number;
    created_at: string;
  };
  questions: QuestionWithAnswer[];
}

export default function ExamDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  const { translations, loading: langLoading, language } = useLanguage();
  const { token, isAuthenticated } = useAuth();
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/profile');
      return;
    }
    if (examId && language) {
      fetchExamDetails();
    }
  }, [examId, language, isAuthenticated, token]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<ExamDetails>(`/api/exams/${examId}?lang=${language}`, {
        method: 'GET',
      }, token || undefined);
      setExamDetails(data);
    } catch (error) {
      console.error('Error fetching exam details:', error);
      router.push('/profile');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (langLoading || loading || !examDetails || !translations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7FF] to-white">
        <div className="text-2xl text-[#00AFCA] font-semibold">Загрузка...</div>
      </div>
    );
  }

  const t = translations.exam || {};
  const common = translations.common || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 border-2 border-[#00AFCA]/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <h1 className="text-2xl sm:text-3xl font-bold text-[#00AFCA] break-words">
                {examDetails.exam.mode === 'exam' ? (language === 'kz' ? 'Емтихан нәтижелері' : 'Результаты экзамена') :
                 examDetails.exam.mode === 'demo' ? (language === 'kz' ? 'Демо нәтижелері' : 'Результаты демо') :
                 (language === 'kz' ? 'Тренировка нәтижелері' : 'Результаты тренировки')}
              </h1>
            </div>
            <Link
              href="/profile"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-semibold whitespace-nowrap"
            >
              {t.homeButton || 'Назад'}
            </Link>
          </div>

          <div className="bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white rounded-xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold mb-1">{examDetails.exam.score.toFixed(1)}%</div>
                <div className="text-sm opacity-90">{language === 'kz' ? 'Нәтиже' : 'Результат'}</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">{examDetails.exam.correct_answers}/{examDetails.exam.total_questions}</div>
                <div className="text-sm opacity-90">{t.completed?.correctAnswers || 'Правильных'}</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">{formatTime(examDetails.exam.time_spent)}</div>
                <div className="text-sm opacity-90">{language === 'kz' ? 'Уақыт' : 'Время'}</div>
              </div>
              <div>
                <div className={`text-3xl font-bold mb-1 ${examDetails.exam.passed ? 'text-green-200' : 'text-red-200'}`}>
                  {examDetails.exam.passed ? '✓' : '✗'}
                </div>
                <div className="text-sm opacity-90">{examDetails.exam.passed ? (language === 'kz' ? 'Өтті' : 'Сдан') : (language === 'kz' ? 'Өтпеді' : 'Не сдан')}</div>
              </div>
            </div>
            <div className="mt-4 text-center text-sm opacity-90">
              {language === 'kz' ? 'Күні' : 'Дата'}: {formatDate(examDetails.exam.created_at)}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {examDetails.questions.map((question, index) => {
            const hasAnswer = question.user_answer >= 0;

            return (
              <div key={question.id} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-gray-100">
                {/* Question Number and Status */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">
                    {t.questionProgress} {index + 1} {common.of} {examDetails.questions.length}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full font-semibold text-sm whitespace-nowrap ${
                      question.is_correct
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {!hasAnswer
                      ? '❌ ' + (t.answered || 'Не отвечено')
                      : question.is_correct
                        ? '✓ ' + (t.correctAnswer || 'Правильно')
                        : '✗ ' + (t.wrongAnswer || 'Неправильно')}
                  </span>
                </div>

                {/* Section */}
                {question.section_name && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500">
                      {language === 'kz' ? question.section_name.kz : question.section_name.ru}
                    </p>
                  </div>
                )}

                {/* Question Text */}
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 leading-relaxed break-words">
                  {question.question}
                </h3>

                {/* Options */}
                <div className="space-y-2 mb-4">
                  {question.options.map((option, optIndex) => {
                    let optionClass = "w-full flex items-start text-left p-4 rounded-lg border-2 transition-all font-medium text-sm sm:text-base ";
                    if (optIndex === question.correct) {
                      optionClass += "bg-green-50 border-green-500 text-green-800 shadow-md";
                    } else if (hasAnswer && optIndex === question.user_answer && optIndex !== question.correct) {
                      optionClass += "bg-red-50 border-red-500 text-red-800 shadow-md";
                    } else {
                      optionClass += "border-gray-300 bg-gray-50 text-gray-600";
                    }

                    return (
                      <div key={optIndex} className={optionClass}>
                        <span className="font-bold mr-3 text-lg flex-shrink-0">{String.fromCharCode(65 + optIndex)}.</span>
                        <span className="break-words flex-1">{option}</span>
                        {optIndex === question.correct && (
                          <span className="ml-2 text-green-700 font-bold flex-shrink-0 whitespace-nowrap">✓ {t.correctAnswer || 'Правильный ответ'}</span>
                        )}
                        {hasAnswer && optIndex === question.user_answer && optIndex !== question.correct && (
                          <span className="ml-2 text-red-700 font-bold flex-shrink-0 whitespace-nowrap">✗ {t.wrongAnswer || 'Ваш ответ'}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <p className="font-semibold mb-2 text-blue-700">
                    {language === 'kz' ? 'Түсіндірме' : 'Объяснение'}:
                  </p>
                  <p className="text-gray-700 leading-relaxed break-words">{question.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border-2 border-[#00AFCA]/20">
          <div className="flex justify-center">
            <Link
              href="/profile"
              className="px-6 py-3 bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white rounded-xl hover:from-[#0099CC] hover:to-[#0088BB] transition-all duration-300 font-semibold shadow-md"
            >
              {t.homeButton || 'Назад к профилю'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

