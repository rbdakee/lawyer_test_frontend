'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Question } from '@/types';
import QuestionCard from '@/components/QuestionCard';
import Timer from '@/components/Timer';
import ProgressBar from '@/components/ProgressBar';
import { useLanguage } from '@/contexts/LanguageContext';
import { API_URL } from '@/config/api';

export default function DemoPage() {
  const router = useRouter();
  const { translations, loading: langLoading, language } = useLanguage();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (language) {
      fetchQuestions();
    }
  }, [language]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/questions/demo?lang=${language}`);
      const data = await response.json();
      setQuestions(data.questions);
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
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      const nextQuestionId = questions[currentQuestionIndex + 1].id;
      const hasAnswer = selectedAnswers[nextQuestionId] !== undefined;
      setShowExplanation(hasAnswer);
    } else {
      // Достигли последнего вопроса, завершаем тест
      setTestCompleted(true);
      setTimerRunning(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      const prevQuestionId = questions[currentQuestionIndex - 1].id;
      const hasAnswer = selectedAnswers[prevQuestionId] !== undefined;
      setShowExplanation(hasAnswer);
    }
  };

  const handleStartTest = () => {
    setTestStarted(true);
    setTimerRunning(true);
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

  const handleViewResults = () => {
    const resultsData = {
      questions,
      selectedAnswers,
      mode: 'demo',
      language
    };
    // Сохраняем результаты в sessionStorage для просмотра
    sessionStorage.setItem('testResults', JSON.stringify(resultsData));
    router.push('/results');
  };

  if (langLoading || !translations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7FF] to-white">
        <div className="text-2xl text-[#00AFCA] font-semibold">Загрузка...</div>
      </div>
    );
  }

  const t = translations.demo;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7FF] to-white">
        <div className="text-2xl text-[#00AFCA] font-semibold">{t.loading}</div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full border-2 border-[#00AFCA]/20">
          <h1 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-[#00AFCA] to-[#0099CC] bg-clip-text text-transparent">
            🎓 {t.title}
          </h1>
          <p className="text-gray-600 mb-6 text-center text-lg leading-relaxed">
            {t.description}
            <br />
            <span className="font-semibold text-[#00AFCA]">{t.totalQuestions}: {questions.length}</span>
          </p>
          <button
            onClick={handleStartTest}
            className="w-full bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white py-4 px-6 rounded-xl hover:from-[#0099CC] hover:to-[#0088BB] transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {t.startButton}
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full mt-4 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold"
          >
            {t.backButton}
          </button>
        </div>
      </div>
    );
  }

  if (testCompleted) {
    const { correct, total, percentage } = calculateScore();
    const completed = t.completed;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-2xl w-full border-2 border-[#00AFCA]/20">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-6 text-[#00AFCA]">{completed.title}</h1>
            
            <div className="bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white rounded-xl p-6 mb-6">
              <div className="text-5xl font-bold mb-2">{percentage}%</div>
              <div className="text-xl">
                {correct} / {total} {completed.correctAnswers.toLowerCase()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">{completed.correctAnswers}</div>
                <div className="text-2xl font-bold text-green-600">{correct}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">{completed.wrongAnswers}</div>
                <div className="text-2xl font-bold text-red-600">{total - correct}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 justify-center">
              <button
                onClick={handleViewResults}
                className="px-6 py-3 bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white rounded-xl hover:from-[#0099CC] hover:to-[#0088BB] transition-all duration-300 font-semibold shadow-md"
              >
                {completed.viewResults}
              </button>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setTestCompleted(false);
                    setTestStarted(false);
                    setSelectedAnswers({});
                    setCurrentQuestionIndex(0);
                    setShowExplanation(false);
                    fetchQuestions();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold"
                >
                  {completed.restart}
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold"
                >
                  {completed.home}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = selectedAnswers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-[#00AFCA]/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#00AFCA] mb-2">{t.title}</h1>
              <ProgressBar current={currentQuestionIndex + 1} total={questions.length} section="demo" />
            </div>
            <Timer isRunning={timerRunning} />
          </div>
        </div>

        {/* Question Card */}
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={currentAnswer ?? null}
          onAnswerSelect={handleAnswerSelect}
          showExplanation={showExplanation}
          isDemo={true}
        />

        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#00AFCA]/20">
          <div className="flex justify-between gap-4">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
            >
              ← {t.previous}
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all duration-200 font-semibold"
            >
              {t.homeButton}
            </button>

            <button
              onClick={handleNextQuestion}
              className="px-6 py-3 bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white rounded-lg hover:from-[#0099CC] hover:to-[#0088BB] transition-all duration-200 font-semibold shadow-md"
            >
              {isLastQuestion ? t.completed?.viewResults || 'Завершить' : `${t.next} →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
