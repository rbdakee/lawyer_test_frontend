'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Question, LegislationSection, ExamSubmit, ExamAnswer } from '@/types';
import QuestionCard from '@/components/QuestionCard';
import ProgressBar from '@/components/ProgressBar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/config/api';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

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

export default function TrainerPage() {
  const router = useRouter();
  const { translations, loading: langLoading, language } = useLanguage();
  const { token, isAuthenticated } = useAuth();
  const [sections, setSections] = useState<LegislationSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (language) {
      fetchSections();
    }
  }, [language]);

  useEffect(() => {
    if (testStarted && !testCompleted) {
      const timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, testCompleted]);

  const fetchSections = async () => {
    try {
      const response = await apiRequest<{ sections: LegislationSection[] }>(`/api/legislation-sections?lang=${language}`, {
        method: 'GET',
      });
      setSections(response.sections);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setIsLoading(false);
    }
  };

  const fetchQuestions = async (section: string) => {
    try {
      setIsLoading(true);
      const questions = await apiRequest<Question[]>(`/api/questions/trainer?section=${section}&lang=${language}`, {
        method: 'GET',
      });
      setQuestions(questions);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setIsLoading(false);
    }
  };

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSection(sectionId);
    fetchQuestions(sectionId);
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
          mode: 'trainer' as const,
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
    if (!isAuthenticated) {
      router.push('/profile');
      return;
    }
    setTestStarted(true);
  };

  const handleFinishTest = async () => {
    if (submitting || !isAuthenticated || !token || !selectedSection) return;
    
    // Сохраняем результаты для просмотра перед отправкой
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
        mode: 'trainer' as const,
        language: language,
      };
      sessionStorage.setItem('testResults', JSON.stringify(testResults));
    }
    
    setSubmitting(true);
    setTestCompleted(true);

    try {
      const answers: ExamAnswer[] = questions.map((q) => ({
        question_id: q.id,
        answer: selectedAnswers[q.id] ?? -1,
      }));

      const examData: ExamSubmit = {
        mode: 'trainer',
        answers,
        section: selectedSection,
        time_spent: elapsedTime,
      };

      await apiRequest('/api/exams/submit', {
        method: 'POST',
        body: JSON.stringify(examData),
      }, token);
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Ошибка при отправке результатов');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (langLoading || !translations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7FF] to-white">
        <div className="text-2xl text-[#00AFCA] font-semibold">{translations?.common?.loading || translations?.trainer?.loading || 'Жүктелуде...'}</div>
      </div>
    );
  }

  if (isLoading && sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7FF] to-white">
        <div className="text-2xl text-[#00AFCA] font-semibold">{translations?.common?.loading || translations?.trainer?.loading || 'Жүктелуде...'}</div>
      </div>
    );
  }

  if (!selectedSection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-2xl w-full border-2 border-[#00AFCA]/20 relative">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#00AFCA] to-[#0099CC] bg-clip-text text-transparent">
              {translations?.trainer?.title || 'Тренажер'}
            </h1>
            <p className="text-gray-600 mb-6">
              {translations?.trainer?.selectSection || 'Таңдаған тақырып бойынша жаттығу'}
            </p>
          </div>

          <div className="space-y-3">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(section.id)}
                className="w-full bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white text-left py-4 px-6 rounded-xl hover:from-[#45a049] hover:to-[#3d8b40] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              >
                {section.name}
              </button>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-[#00AFCA] hover:underline">
              ← {translations?.trainer?.backButton || translations?.home?.backButton || 'Басты бетке'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7FF] to-white">
        <div className="text-2xl text-[#00AFCA] font-semibold">Загрузка вопросов...</div>
      </div>
    );
  }

  if (!testStarted) {
    const sectionName = sectionNames[selectedSection]?.[language] || selectedSection;
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full border-2 border-[#00AFCA]/20 relative">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#00AFCA] to-[#0099CC] bg-clip-text text-transparent">
              {translations?.trainer?.title || 'Тренажер'}
            </h1>
            <p className="text-gray-700 mb-2">
              <strong>{translations?.exam?.section || (language === 'kz' ? 'Тақырып' : 'Раздел')}:</strong> {sectionName}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>{translations?.trainer?.totalQuestions || 'Барлық сұрақтар'}:</strong> {questions.length}
            </p>
            <p className="text-gray-700">
              <strong>{translations?.exam?.timeLabel || translations?.common?.time || 'Уақыт'}:</strong> {translations?.trainer?.unlimited || translations?.exam?.unlimited || 'Шектеусіз'}
            </p>
          </div>

          <button
            onClick={handleStartTest}
            className="w-full bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white py-4 rounded-xl font-semibold text-lg hover:from-[#45a049] hover:to-[#3d8b40] transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {translations?.trainer?.startButton || 'Бастау'}
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setSelectedSection(null);
                setQuestions([]);
              }}
              className="text-[#00AFCA] hover:underline"
            >
              ← Выбрать другой раздел
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (testCompleted) {
    const answeredCount = Object.keys(selectedAnswers).length;
    const calculateScore = () => {
      let correct = 0;
      questions.forEach((q) => {
        if (selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] === q.correct) {
          correct++;
        }
      });
      const percentage = questions.length > 0 ? (correct / questions.length * 100) : 0;
      return { correct, total: questions.length, percentage: Math.round(percentage) };
    };
    const score = calculateScore();
    const t = translations.demo || {}; // Используем demo переводы, так как тренажер похож на демо
    const completed = t.completed || {};
    
    const handleRestart = () => {
      setTestCompleted(false);
      setTestStarted(false);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setElapsedTime(0);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('testResults');
      }
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full border-2 border-[#00AFCA]/20 text-center">
          <h2 className="text-2xl font-bold mb-4">{completed.title || 'Тренировка аяқталды'}</h2>
          <div className="space-y-2 mb-6">
            <p className="text-lg">
              {completed.correctAnswers || 'Правильных ответов'}: <span className="font-bold text-green-600">{score.correct}</span>
            </p>
            <p className="text-lg">
              {completed.wrongAnswers || 'Неправильных ответов'}: <span className="font-bold text-red-600">{score.total - score.correct}</span>
            </p>
            <p className="text-xl font-bold text-[#00AFCA]">
              {language === 'kz' ? 'Нәтиже' : 'Результат'}: {score.percentage}%
            </p>
            <p className="text-sm text-gray-500">
              {language === 'kz' ? 'Уақыт' : 'Время'}: {formatTime(elapsedTime)}
            </p>
          </div>
          {submitting ? (
            <p className="text-[#00AFCA]">{translations?.profile?.submitting || 'Нәтижелер жіберілуде...'}</p>
          ) : (
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
          )}
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
                  {translations?.trainer?.questionProgress || translations?.demo?.questionProgress || 'Сұрақ'} {currentQuestionIndex + 1} {translations?.common?.of || '/'} {questions.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleFinishTest}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              {translations?.trainer?.finishButton || 'Аяқтау'}
            </button>
          </div>

          <ProgressBar current={currentQuestionIndex + 1} total={questions.length} section="demo" />

          <div className="mt-6">
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
              {translations?.trainer?.previous || 'Алдыңғы'}
            </button>
            <button
              onClick={handleNextQuestion}
              className="bg-[#00AFCA] text-white px-6 py-2 rounded-lg hover:bg-[#0099CC] transition"
            >
              {currentQuestionIndex === questions.length - 1 ? (translations?.trainer?.finishButton || 'Аяқтау') : (translations?.trainer?.next || 'Келесі')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

