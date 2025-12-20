'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Question, ExamSubmit, ExamAnswer } from '@/types';
import QuestionCard from '@/components/QuestionCard';
import Timer from '@/components/Timer';
import ProgressBar from '@/components/ProgressBar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/config/api';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

const EXAM_DURATION = 90 * 60; // 90 минут в секундах
const EXAM_QUESTIONS_COUNT = 100;
const PASSING_SCORE = 70;

export default function ExamPage() {
  const router = useRouter();
  const { translations, loading: langLoading, language } = useLanguage();
  const { token, isAuthenticated } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(EXAM_DURATION);
  const [timeSpent, setTimeSpent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (language && questions.length === 0) {
      // Проверяем, есть ли сохраненное состояние перед загрузкой вопросов
      if (typeof window !== 'undefined') {
        const savedTestState = sessionStorage.getItem('exam_test_state');
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
      const savedTestState = sessionStorage.getItem('exam_test_state');
      if (savedTestState) {
        try {
          const state = JSON.parse(savedTestState);
          if (state.testStarted && !state.testCompleted && state.questions) {
            // Восстанавливаем вопросы из сохраненного состояния
            setQuestions(state.questions);
            setTestStarted(true);
            setCurrentQuestionIndex(state.currentQuestionIndex || 0);
            setSelectedAnswers(state.selectedAnswers || {});
            setTimeRemaining(state.timeRemaining || EXAM_DURATION);
            setTimeSpent(state.timeSpent || 0);
            setIsLoading(false);
          }
        } catch (e) {
          console.error('Error restoring test state:', e);
          sessionStorage.removeItem('exam_test_state');
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
        timeRemaining,
        timeSpent,
        questionIds: questions.map(q => q.id), // Сохраняем ID для проверки
        questions, // Сохраняем полные вопросы для восстановления
      };
      sessionStorage.setItem('exam_test_state', JSON.stringify(testState));
    } else if (testCompleted && typeof window !== 'undefined') {
      // Очищаем сохраненное состояние после завершения теста
      sessionStorage.removeItem('exam_test_state');
    }
  }, [testStarted, testCompleted, currentQuestionIndex, selectedAnswers, timeRemaining, timeSpent, questions]);

  useEffect(() => {
    if (testStarted && !testCompleted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
        setTimeSpent((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, testCompleted, timeRemaining]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const questions = await apiRequest<Question[]>('/api/questions/exam', {
        method: 'GET',
      }, token || undefined);
      setQuestions(questions);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setIsLoading(false);
    }
  };

  const handleTimeUp = () => {
    setTestCompleted(true);
    handleFinishTest();
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
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleStartTest = () => {
    if (!isAuthenticated) {
      router.push('/profile');
      return;
    }
    setTestStarted(true);
    // Очищаем старое сохраненное состояние при старте нового теста
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('exam_test_state');
    }
  };

  const handleFinishTest = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    setTestCompleted(true);

    if (!isAuthenticated || !token) {
      router.push('/profile');
      return;
    }

    try {
      // Отправляем все вопросы, включая неотвеченные (с answer = -1 для неотвеченных)
      const answers: ExamAnswer[] = questions.map((q) => ({
        question_id: q.id,
        answer: selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] >= 0 ? selectedAnswers[q.id] : -1,
      }));

      const examData: ExamSubmit = {
        mode: 'exam',
        answers,
        time_spent: timeSpent,
      };

      await apiRequest('/api/exams/submit', {
        method: 'POST',
        body: JSON.stringify(examData),
      }, token);

      // Очищаем сохраненное состояние после успешной отправки
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('exam_test_state');
      }

      router.push('/profile');
    } catch (error) {
      console.error('Error submitting exam:', error);
      // Более детальное сообщение об ошибке
      const errorMessage = error instanceof Error ? error.message : (translations?.common?.errorSubmittingResults || 'Ошибка при отправке результатов');
      alert(`${translations?.common?.errorSubmittingResults || 'Ошибка при отправке результатов'}: ${errorMessage}`);
      setSubmitting(false);
    }
  };

  if (langLoading || !translations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7FF] to-white">
        <div className="text-2xl text-[#00AFCA] font-semibold">{translations?.common?.loading || translations?.exam?.loading || 'Загрузка...'}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7FF] to-white">
        <div className="text-2xl text-[#00AFCA] font-semibold">{translations?.exam?.loading || translations?.common?.loading || 'Загрузка вопросов...'}</div>
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
              {translations?.exam?.title || 'Емтихан'}
            </h1>
            <div className="space-y-3 text-left">
              <p className="text-gray-700"><strong>{translations?.exam?.timeLabel || 'Уақыт'}:</strong> 90 {translations?.exam?.timeValue || 'минут'}</p>
              <p className="text-gray-700"><strong>{translations?.exam?.questionsCount || 'Сұрақтар саны'}:</strong> {EXAM_QUESTIONS_COUNT}</p>
              <p className="text-gray-700"><strong>{translations?.exam?.passingScore || 'Өту баллы'}:</strong> {PASSING_SCORE}%</p>
            </div>
            <p className="text-red-600 mt-4 text-sm">
              {translations?.exam?.timeWarning || 'Назар аударыңыз: Уақыт біткеннен кейін емтихан автоматты түрде аяқталады.'}
            </p>
          </div>

          <button
            onClick={handleStartTest}
            className="w-full bg-gradient-to-r from-[#FFB700] to-[#FFD700] text-white py-4 rounded-xl font-semibold text-lg hover:from-[#FFA500] hover:to-[#FFB700] transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {translations?.exam?.startButton || 'Емтиханды бастау'}
          </button>

          <div className="mt-6 text-center">
            <Link href="/" className="text-[#00AFCA] hover:underline">
              ← {translations?.exam?.backButton || translations?.home?.backButton || 'Басты бетке'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (testCompleted) {
    const answeredCount = Object.keys(selectedAnswers).length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full border-2 border-[#00AFCA]/20 text-center">
          <h2 className="text-2xl font-bold mb-4">{translations?.exam?.completed?.title || 'Емтихан аяқталды!'}</h2>
          <p className="text-gray-600 mb-6">
            {translations?.exam?.answered || 'Жауап берілген'}: {answeredCount} {translations?.common?.of || '/'} {questions.length} {translations?.exam?.questionProgress?.toLowerCase() || 'сұрақтар'}
          </p>
          {submitting ? (
            <p className="text-[#00AFCA]">{translations?.profile?.submitting || 'Нәтижелер жіберілуде...'}</p>
          ) : (
            <Link
              href="/profile"
              className="inline-block bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white py-3 px-6 rounded-lg font-semibold hover:from-[#0099CC] hover:to-[#0088BB] transition-all"
            >
              {translations?.profile?.goToProfile || 'Профильге өту'}
            </Link>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-[#00AFCA]/20">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <div>
                <Timer seconds={timeRemaining} />
                <p className="text-sm text-gray-500 mt-1">
                  {translations?.exam?.answered || 'Жауап берілген'}: {answeredCount} / {questions.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleFinishTest}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              {translations?.exam?.finishButton || 'Емтиханды аяқтау'}
            </button>
          </div>

          <ProgressBar current={currentQuestionIndex + 1} total={questions.length} section="exam" />

          <div className="mt-6">
            <QuestionCard
              question={currentQuestion}
              selectedAnswer={selectedAnswers[currentQuestion.id]}
              onAnswerSelect={handleAnswerSelect}
              showExplanation={false}
              isDemo={false}
            />
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
{translations?.exam?.previous || 'Предыдущий'}
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              className="bg-[#00AFCA] text-white px-6 py-2 rounded-lg hover:bg-[#0099CC] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
{translations?.exam?.next || 'Следующий'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
