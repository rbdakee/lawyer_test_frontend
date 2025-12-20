'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Question } from '@/types';
import QuestionCard from '@/components/QuestionCard';
import ProgressBar from '@/components/ProgressBar';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/config/api';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

const DEMO_QUESTIONS_COUNT = 20;

export default function DemoPage() {
  const router = useRouter();
  const { translations, loading: langLoading, language } = useLanguage();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (language && questions.length === 0) {
      // Проверяем, есть ли сохраненное состояние перед загрузкой вопросов
      if (typeof window !== 'undefined') {
        const savedTestState = sessionStorage.getItem('demo_test_state');
        if (!savedTestState || !JSON.parse(savedTestState).questions) {
          fetchQuestions();
        }
      } else {
        fetchQuestions();
      }
    }
  }, [language, questions.length]);

  // Восстанавливаем состояние теста из sessionStorage (до загрузки вопросов)
  useEffect(() => {
    if (typeof window !== 'undefined' && questions.length === 0) {
      const savedTestState = sessionStorage.getItem('demo_test_state');
      if (savedTestState) {
        try {
          const state = JSON.parse(savedTestState);
          if (state.testStarted && !state.testCompleted && state.questions) {
            // Восстанавливаем вопросы из сохраненного состояния
            setQuestions(state.questions);
            setTestStarted(true);
            setCurrentQuestionIndex(state.currentQuestionIndex || 0);
            setSelectedAnswers(state.selectedAnswers || {});
            setElapsedTime(state.elapsedTime || 0);
            setIsLoading(false);
          }
        } catch (e) {
          console.error('Error restoring test state:', e);
          sessionStorage.removeItem('demo_test_state');
        }
      }
    }
  }, []);

  // Сохраняем состояние теста в sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && testStarted && !testCompleted && questions.length > 0) {
      const testState = {
        testStarted,
        currentQuestionIndex,
        selectedAnswers,
        elapsedTime,
        questionIds: questions.map(q => q.id), // Сохраняем ID для проверки
        questions, // Сохраняем полные вопросы для восстановления
      };
      sessionStorage.setItem('demo_test_state', JSON.stringify(testState));
    } else if (testCompleted && typeof window !== 'undefined') {
      // Очищаем сохраненное состояние после завершения теста
      sessionStorage.removeItem('demo_test_state');
    }
  }, [testStarted, testCompleted, currentQuestionIndex, selectedAnswers, elapsedTime, questions]);

  useEffect(() => {
    if (testStarted && !testCompleted) {
      const timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, testCompleted]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const questions = await apiRequest<Question[]>('/api/questions/demo', {
        method: 'GET',
      });
      setQuestions(questions);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const currentQuestionId = questions[currentQuestionIndex].id;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionId]: answerIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Сохраняем результаты для просмотра
      // Вопросы уже приходят с API в преобразованном формате (question, options, explanation - строки)
      if (typeof window !== 'undefined') {
        const testResults = {
          questions: questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation,
            section: q.section,
            section_name: q.section_name,
          })),
          selectedAnswers: selectedAnswers,
          mode: 'demo' as const,
          language: language,
        };
        sessionStorage.setItem('testResults', JSON.stringify(testResults));
      }
      setTestCompleted(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleStartTest = () => {
    setTestStarted(true);
    // Очищаем старое сохраненное состояние при старте нового теста
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('demo_test_state');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct) {
        correct++;
      }
    });
    const percentage = Math.round((correct / questions.length) * 100);
    return { correct, total: questions.length, percentage };
  };

  if (langLoading || !translations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7FF] to-white">
        <div className="text-2xl text-[#00AFCA] font-semibold">{translations?.common?.loading || translations?.demo?.loading || 'Жүктелуде...'}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7FF] to-white">
        <div className="text-2xl text-[#00AFCA] font-semibold">{translations?.demo?.loading || translations?.common?.loading || 'Жүктелуде...'}</div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full border-2 border-[#00AFCA]/20 relative">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#00AFCA] to-[#0099CC] bg-clip-text text-transparent">
              {translations?.demo?.title || 'Демо режим'}
            </h1>
            <div className="space-y-3 text-left">
              <p className="text-gray-700"><strong>{translations?.demo?.totalQuestions || 'Барлық сұрақтар'}:</strong> {DEMO_QUESTIONS_COUNT}</p>
              <p className="text-gray-700"><strong>{translations?.exam?.timeLabel || translations?.common?.time || 'Уақыт'}:</strong> {translations?.demo?.unlimited || translations?.exam?.unlimited || 'Шектеусіз'}</p>
            </div>
            <p className="text-blue-600 mt-4 text-sm">
              {translations?.demo?.description || 'Демо режимде сіз бірден жауабыңыздың дұрыстығын және түсіндірмені көресіз.'}
            </p>
          </div>

          <button
            onClick={handleStartTest}
            className="w-full bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white py-4 rounded-xl font-semibold text-lg hover:from-[#0099CC] hover:to-[#0088BB] transition-all duration-300 shadow-lg hover:shadow-xl"
          >
{translations?.demo?.startButton || 'Бастау'}
          </button>

          <div className="mt-6 text-center">
            <Link href="/" className="text-[#00AFCA] hover:underline">
              ← {translations?.demo?.backButton || translations?.home?.backButton || 'Басты бетке'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (testCompleted) {
    const score = calculateScore();
    const t = translations.demo || {};
    const completed = t.completed || {};
    
    const handleRestart = () => {
      setTestCompleted(false);
      setTestStarted(false);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setElapsedTime(0);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('demo_test_state');
        sessionStorage.removeItem('testResults');
      }
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full border-2 border-[#00AFCA]/20 text-center">
          <h2 className="text-2xl font-bold mb-4">{completed.title || 'Демо режим завершен!'}</h2>
          <div className="space-y-2 mb-6">
            <p className="text-lg">
              {completed.correctAnswers || 'Правильных ответов'}: <span className="font-bold text-green-600">{score.correct}</span>
            </p>
            <p className="text-lg">
              {completed.wrongAnswers || 'Неправильных ответов'}: <span className="font-bold text-red-600">{score.total - score.correct}</span>
            </p>
            <p className="text-xl font-bold text-[#00AFCA]">
              {translations?.common?.result || translations?.examDetails?.result || 'Нәтиже'}: {score.percentage}%
            </p>
            <p className="text-sm text-gray-500">
              {translations?.common?.time || translations?.exam?.timeLabel || 'Уақыт'}: {formatTime(elapsedTime)}
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/results"
              className="block w-full bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white py-3 px-6 rounded-lg font-semibold hover:from-[#0099CC] hover:to-[#0088BB] transition-all"
            >
              {completed.viewResults || 'Посмотреть результаты'}
            </Link>
            <button
              onClick={handleRestart}
              className="block w-full bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white py-3 px-6 rounded-lg font-semibold hover:from-[#45a049] hover:to-[#3d8b40] transition-all"
            >
              {completed.restart || 'Попробовать еще раз'}
            </button>
            <Link
              href="/"
              className="block w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              {completed.home || 'На главную'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const hasAnswer = selectedAnswers[currentQuestion.id] !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-[#00AFCA]/20">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <div>
                <p className="text-lg font-semibold">{translations?.exam?.timeLabel || translations?.common?.time || 'Уақыт'}: {formatTime(elapsedTime)}</p>
                <p className="text-sm text-gray-500">
                  {translations?.demo?.questionProgress || 'Сұрақ'} {currentQuestionIndex + 1} {translations?.common?.of || '/'} {questions.length}
                </p>
              </div>
            </div>
          </div>

          <ProgressBar current={currentQuestionIndex + 1} total={questions.length} section="demo" />

          <div className="mt-6">
            {/* Показываем законодательство */}
            <div className="mb-4">
              <p className="text-xs text-gray-500">
                {language === 'kz' ? currentQuestion.section_name.kz : currentQuestion.section_name.ru}
              </p>
            </div>
            
            <QuestionCard
              question={currentQuestion}
              selectedAnswer={selectedAnswers[currentQuestion.id]}
              onAnswerSelect={handleAnswerSelect}
              showExplanation={hasAnswer}
              isDemo={true}
            />
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {translations?.demo?.previous || 'Алдыңғы'}
            </button>
            <button
              onClick={handleNextQuestion}
              className="bg-[#00AFCA] text-white px-6 py-2 rounded-lg hover:bg-[#0099CC] transition"
            >
              {currentQuestionIndex === questions.length - 1 ? (translations?.demo?.finishButton || translations?.demo?.completed?.restart || 'Аяқтау') : (translations?.demo?.next || 'Келесі')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
