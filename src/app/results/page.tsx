'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Question } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ResultsData {
  questions: Question[];
  selectedAnswers: Record<string, number>;
  mode: 'demo' | 'exam' | 'trainer';
  language: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const { translations, loading: langLoading } = useLanguage();
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('testResults');
      if (stored) {
        setResultsData(JSON.parse(stored));
      } else {
        router.push('/');
      }
    }
  }, [router]);

  if (langLoading || !translations || !resultsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7FF] to-white">
        <div className="text-2xl text-[#00AFCA] font-semibold">Загрузка...</div>
      </div>
    );
  }

  const t = resultsData.mode === 'demo' || resultsData.mode === 'trainer' ? translations.demo : translations.exam;
  const completed = t.completed;

  const calculateScore = () => {
    let correct = 0;
    resultsData.questions.forEach((q) => {
      if (resultsData.selectedAnswers[q.id] === q.correct) {
        correct++;
      }
    });
    return { correct, total: resultsData.questions.length };
  };

  const { correct, total } = calculateScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 border-2 border-[#00AFCA]/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#00AFCA] break-words">{completed?.viewResults || 'Результаты'}</h1>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-semibold whitespace-nowrap w-full sm:w-auto"
            >
              {completed?.home || 'На главную'}
            </button>
          </div>
          <div className="bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white rounded-xl p-4">
            <div className="text-3xl font-bold mb-1">
              {correct} / {total}
            </div>
            <div className="text-lg">
              {Math.round((correct / total) * 100)}% {completed?.correctAnswers.toLowerCase() || 'правильных ответов'}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {resultsData.questions.map((question, index) => {
            const userAnswer = resultsData.selectedAnswers[question.id];
            const isCorrect = userAnswer !== undefined && userAnswer === question.correct;
            const hasAnswer = userAnswer !== undefined;

            return (
              <div key={question.id} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-gray-100">
                {/* Question Number and Status */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">
                    {t.questionProgress} {index + 1} {translations.common.of} {total}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full font-semibold text-sm whitespace-nowrap ${
                      isCorrect
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {!hasAnswer 
                      ? '❌ ' + (t.answered || translations.exam?.answered || 'Не отвечено')
                      : isCorrect 
                        ? '✓ ' + (t.correctAnswer || 'Правильно') 
                        : '✗ ' + (t.wrongAnswer || 'Неправильно')}
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 leading-relaxed break-words">
                  {question.question}
                </h3>

                {/* Options */}
                <div className="space-y-2 mb-4">
                  {question.options.map((option, optIndex) => {
                    let optionClass = "w-full text-left p-4 rounded-lg border-2 transition-all font-medium ";
                    
                    if (optIndex === question.correct) {
                      optionClass += "bg-green-50 border-green-500 text-green-800 shadow-md";
                    } else if (hasAnswer && optIndex === userAnswer && optIndex !== question.correct) {
                      optionClass += "bg-red-50 border-red-500 text-red-800 shadow-md";
                    } else {
                      optionClass += "border-gray-300 bg-gray-50 text-gray-600";
                    }

                    return (
                      <div key={optIndex} className={optionClass}>
                        <div className="flex flex-wrap items-start gap-2">
                          <span className="font-bold text-lg flex-shrink-0">{String.fromCharCode(65 + optIndex)}.</span>
                          <span className="flex-1 break-words">{option}</span>
                          {optIndex === question.correct && (
                            <span className="ml-auto text-green-700 font-bold whitespace-nowrap">✓ {t.correctAnswer || 'Правильный ответ'}</span>
                          )}
                          {hasAnswer && optIndex === userAnswer && optIndex !== question.correct && (
                            <span className="ml-auto text-red-700 font-bold whitespace-nowrap">✗ {t.wrongAnswer || 'Ваш ответ'}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <p className="font-semibold mb-2 text-blue-700">
                    {t.correctAnswer || 'Объяснение'}:
                  </p>
                  <p className="text-gray-700 leading-relaxed">{question.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border-2 border-[#00AFCA]/20">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white rounded-xl hover:from-[#0099CC] hover:to-[#0088BB] transition-all duration-300 font-semibold shadow-md"
            >
              {completed?.home || 'На главную'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

