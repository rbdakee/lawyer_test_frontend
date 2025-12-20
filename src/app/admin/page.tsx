'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/config/api';
import { Question, LegislationSection } from '@/types';
import { AdminQuestion, PaginatedResponse } from '@/types/admin';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

const sectionOptions = [
  { 
    value: 'civil_code', 
    label: { kz: 'Азаматтық кодекс', ru: 'Гражданский кодекс' }
  },
  { 
    value: 'civil_process_code', 
    label: { kz: 'Азаматтық процестік кодекс', ru: 'Гражданский процессуальный кодекс' }
  },
  { 
    value: 'criminal_code', 
    label: { kz: 'Қылмыстық кодекс', ru: 'Уголовный кодекс' }
  },
  { 
    value: 'criminal_process_code', 
    label: { kz: 'Қылмыстық процестік кодекс', ru: 'Уголовно процессуальный кодекс' }
  },
  { 
    value: 'administrative_offenses_code', 
    label: { kz: 'Әкімшілік құқықбұзушылықтар туралы кодекс', ru: 'Кодекс об административных правонарушениях' }
  },
  { 
    value: 'anti_corruption_law', 
    label: { kz: 'Коррупцияға қарсы күрес туралы заң', ru: 'Закон "О противодействии коррупции"' }
  },
  { 
    value: 'administrative_procedure_code', 
    label: { kz: 'Әкімшілік процедуралық-процестік кодекс', ru: 'Административный процедурно-процессуальный кодекс' }
  },
  { 
    value: 'advocacy_law', 
    label: { kz: 'Адвокаттық қызмет және заңды көмек туралы заң', ru: 'Закон "Об адвокатской деятельности и юридической помощи"' }
  },
  { 
    value: 'aml_law', 
    label: { kz: 'Қылмыстық жолмен алынған кірістерді легализациялауға (ақтауға) қарсы күрес және терроризмді қаржыландыруға қарсы күрес туралы заң', ru: 'Закон "О противодействии легализации (отмыванию) доходов..."' }
  },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();
  const { language, translations } = useLanguage();
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [formData, setFormData] = useState({
    question_kz: '',
    question_ru: '',
    option1_kz: '',
    option1_ru: '',
    option2_kz: '',
    option2_ru: '',
    option3_kz: '',
    option3_ru: '',
    option4_kz: '',
    option4_ru: '',
    correct: 0,
    explanation_kz: '',
    explanation_ru: '',
    section: 'civil_code',
  });

  useEffect(() => {
    if (!isAuthenticated || !user?.is_admin) {
      router.push('/');
      return;
    }
    loadQuestions(1); // Загружаем первую страницу при монтировании
  }, [isAuthenticated, user, token]);

  // Отдельный useEffect для изменения страницы
  useEffect(() => {
    if (isAuthenticated && user?.is_admin) {
      loadQuestions(currentPage);
    }
  }, [currentPage]);

  const loadQuestions = async (page: number = currentPage) => {
    try {
      setLoading(true);
      const response = await apiRequest<PaginatedResponse<AdminQuestion>>(
        `/api/admin/questions?page=${page}&page_size=${pageSize}`,
        {
          method: 'GET',
        },
        token || undefined
      );
      setQuestions(response.items);
      setCurrentPage(response.page);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const questionData = {
        question: {
          kz: formData.question_kz,
          ru: formData.question_ru,
        },
        options: [
          { kz: formData.option1_kz, ru: formData.option1_ru },
          { kz: formData.option2_kz, ru: formData.option2_ru },
          { kz: formData.option3_kz, ru: formData.option3_ru },
          { kz: formData.option4_kz, ru: formData.option4_ru },
        ],
        correct: formData.correct,
        explanation: {
          kz: formData.explanation_kz,
          ru: formData.explanation_ru,
        },
        section: formData.section,
      };

      if (editingQuestion) {
        await apiRequest(`/api/admin/questions/${editingQuestion.id}`, {
          method: 'PUT',
          body: JSON.stringify(questionData),
        }, token);
      } else {
        await apiRequest('/api/admin/questions', {
          method: 'POST',
          body: JSON.stringify(questionData),
        }, token);
      }

      if (editingQuestion) {
        setEditingQuestion(null);
        setEditingQuestionId(null);
      } else {
        setShowAddForm(false);
      }
      resetForm();
      loadQuestions();
    } catch (error: any) {
      alert(error.message || translations?.home?.admin?.saveError || 'Ошибка при сохранении вопроса');
    }
  };

  const handleEdit = (question: AdminQuestion) => {
    setEditingQuestion(question);
    setEditingQuestionId(question.id);
    setFormData({
      question_kz: question.question.kz || '',
      question_ru: question.question.ru || '',
      option1_kz: question.options[0]?.kz || '',
      option1_ru: question.options[0]?.ru || '',
      option2_kz: question.options[1]?.kz || '',
      option2_ru: question.options[1]?.ru || '',
      option3_kz: question.options[2]?.kz || '',
      option3_ru: question.options[2]?.ru || '',
      option4_kz: question.options[3]?.kz || '',
      option4_ru: question.options[3]?.ru || '',
      correct: question.correct,
      explanation_kz: question.explanation.kz || '',
      explanation_ru: question.explanation.ru || '',
      section: question.section,
    });
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditingQuestionId(null);
    resetForm();
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm(translations?.home?.admin?.deleteConfirm || 'Вы уверены, что хотите удалить этот вопрос?')) return;
    if (!token) return;

    try {
      await apiRequest(`/api/admin/questions/${questionId}`, {
        method: 'DELETE',
      }, token);
      // Если текущая страница станет пустой, переходим на предыдущую
      if (questions.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        loadQuestions(currentPage);
      }
    } catch (error: any) {
      alert(error.message || translations?.home?.admin?.deleteError || 'Ошибка при удалении вопроса');
    }
  };

  const resetForm = () => {
    setFormData({
      question_kz: '',
      question_ru: '',
      option1_kz: '',
      option1_ru: '',
      option2_kz: '',
      option2_ru: '',
      option3_kz: '',
      option3_ru: '',
      option4_kz: '',
      option4_ru: '',
      correct: 0,
      explanation_kz: '',
      explanation_ru: '',
      section: 'civil_code',
    });
  };

  if (!isAuthenticated || !user?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F7FF] via-[#F0F9FF] to-white p-2 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-6 lg:p-10 border-2 border-[#00AFCA]/20 relative">
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
            <LanguageSwitcher />
          </div>

          <div className="mb-4 sm:mb-6 pr-20 sm:pr-0">
            <div className="mb-3 sm:mb-4">
              <Link href="/" className="inline-block text-[#00AFCA] hover:underline text-sm sm:text-base lg:text-lg font-medium mb-3 sm:mb-4">
                ← {translations?.common?.toMain || translations?.home?.backButton || 'На главную'}
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 lg:mb-6 bg-gradient-to-r from-[#00AFCA] to-[#0099CC] bg-clip-text text-transparent">
              {translations?.home?.admin?.adminPanel || translations?.home?.admin?.title || 'Админ-панель'}
            </h1>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                if (!showAddForm) {
                  setEditingQuestion(null);
                  setEditingQuestionId(null);
                  resetForm();
                }
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-[#0099CC] hover:to-[#0088BB] transition text-sm sm:text-base lg:text-lg font-semibold"
            >
              {showAddForm ? (translations?.home?.admin?.cancel || translations?.common?.cancel || 'Отмена') : `+ ${translations?.home?.admin?.addQuestion || 'Добавить вопрос'}`}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 sm:mb-8 p-4 sm:p-6 lg:p-8 border border-gray-200 rounded-lg space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">{translations?.home?.admin?.questionLabel || 'Вопрос'} (KZ)</label>
                  <textarea
                    value={formData.question_kz}
                    onChange={(e) => setFormData({ ...formData, question_kz: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">{translations?.home?.admin?.questionLabel || 'Вопрос'} (RU)</label>
                  <textarea
                    value={formData.question_ru}
                    onChange={(e) => setFormData({ ...formData, question_ru: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                    rows={4}
                    required
                  />
                </div>
              </div>

              {[1, 2, 3, 4].map((num) => {
                const optionIndex = num - 1;
                return (
                  <div key={num} className="border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <label className="block text-xs sm:text-sm lg:text-base font-medium">{translations?.home?.admin?.variant || 'Вариант'} {num}</label>
                      <label className="flex items-center gap-1 text-xs sm:text-sm lg:text-base text-green-600 font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="correct"
                          checked={formData.correct === optionIndex}
                          onChange={() => setFormData({ ...formData, correct: optionIndex })}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
                        />
                        {translations?.home?.admin?.correctAnswer || 'Правильный ответ'}
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">KZ</label>
                        <input
                          type="text"
                          value={formData[`option${num}_kz` as keyof typeof formData] as string}
                          onChange={(e) => setFormData({ ...formData, [`option${num}_kz`]: e.target.value } as any)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">RU</label>
                        <input
                          type="text"
                          value={formData[`option${num}_ru` as keyof typeof formData] as string}
                          onChange={(e) => setFormData({ ...formData, [`option${num}_ru`]: e.target.value } as any)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">{translations?.home?.admin?.explanationLabel || 'Объяснение'} (KZ)</label>
                  <textarea
                    value={formData.explanation_kz}
                    onChange={(e) => setFormData({ ...formData, explanation_kz: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">{translations?.home?.admin?.explanationLabel || 'Объяснение'} (RU)</label>
                  <textarea
                    value={formData.explanation_ru}
                    onChange={(e) => setFormData({ ...formData, explanation_ru: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                    rows={4}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">{translations?.home?.admin?.section || 'Раздел'}</label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                >
                  {sectionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {typeof opt.label === 'string' ? opt.label : opt.label[language]}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white px-6 sm:px-8 py-2 sm:py-3 lg:py-4 rounded-lg hover:from-[#0099CC] hover:to-[#0088BB] transition text-sm sm:text-base lg:text-lg font-semibold"
              >
                {translations?.home?.admin?.createQuestion || 'Создать вопрос'}
              </button>
            </form>
          )}

          {loading ? (
            <p>{translations?.home?.admin?.loading || translations?.common?.loading || 'Загрузка...'}</p>
          ) : (
            <>
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="border border-gray-200 rounded-lg">
                  {editingQuestionId === question.id ? (
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4 lg:space-y-6 bg-blue-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                        <div>
                          <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">{translations?.home?.admin?.questionLabel || 'Вопрос'} (KZ)</label>
                          <textarea
                            value={formData.question_kz}
                            onChange={(e) => setFormData({ ...formData, question_kz: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                            rows={4}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">{translations?.home?.admin?.questionLabel || 'Вопрос'} (RU)</label>
                          <textarea
                            value={formData.question_ru}
                            onChange={(e) => setFormData({ ...formData, question_ru: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                            rows={4}
                          />
                        </div>
                      </div>

                      {[1, 2, 3, 4].map((num) => {
                        const optionIndex = num - 1;
                        return (
                          <div key={num} className="border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-6 bg-white">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                              <label className="block text-xs sm:text-sm lg:text-base font-medium">{translations?.home?.admin?.variant || 'Вариант'} {num}</label>
                              <label className="flex items-center gap-1 text-xs sm:text-sm lg:text-base text-green-600 font-medium cursor-pointer">
                                <input
                                  type="radio"
                                  name={`correct-${question.id}`}
                                  checked={formData.correct === optionIndex}
                                  onChange={() => setFormData({ ...formData, correct: optionIndex })}
                                  className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
                                />
                                {translations?.home?.admin?.correctAnswer || 'Правильный ответ'}
                              </label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">KZ</label>
                                <input
                                  type="text"
                                  value={formData[`option${num}_kz` as keyof typeof formData] as string}
                                  onChange={(e) => setFormData({ ...formData, [`option${num}_kz`]: e.target.value } as any)}
                                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">RU</label>
                                <input
                                  type="text"
                                  value={formData[`option${num}_ru` as keyof typeof formData] as string}
                                  onChange={(e) => setFormData({ ...formData, [`option${num}_ru`]: e.target.value } as any)}
                                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                        <div>
                          <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">{translations?.home?.admin?.explanationLabel || 'Объяснение'} (KZ)</label>
                          <textarea
                            value={formData.explanation_kz}
                            onChange={(e) => setFormData({ ...formData, explanation_kz: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                            rows={4}
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">{translations?.home?.admin?.explanationLabel || 'Объяснение'} (RU)</label>
                          <textarea
                            value={formData.explanation_ru}
                            onChange={(e) => setFormData({ ...formData, explanation_ru: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                            rows={4}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm lg:text-base font-medium mb-1 sm:mb-2">{translations?.home?.admin?.section || 'Раздел'}</label>
                        <select
                          value={formData.section}
                          onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg"
                        >
                          {sectionOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {typeof opt.label === 'string' ? opt.label : opt.label[language]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                          type="submit"
                          className="w-full sm:w-auto bg-gradient-to-r from-[#00AFCA] to-[#0099CC] text-white px-6 sm:px-8 py-2 sm:py-3 lg:py-4 rounded-lg hover:from-[#0099CC] hover:to-[#0088BB] transition text-sm sm:text-base lg:text-lg font-semibold"
                        >
                          {translations?.home?.admin?.saveChanges || 'Сохранить изменения'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="w-full sm:w-auto bg-gray-300 text-gray-700 px-6 sm:px-8 py-2 sm:py-3 lg:py-4 rounded-lg hover:bg-gray-400 transition text-sm sm:text-base lg:text-lg font-semibold"
                        >
                          {translations?.home?.admin?.cancel || translations?.common?.cancel || 'Отмена'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-3 sm:p-4 lg:p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3 break-words">{language === 'kz' ? question.question.kz : question.question.ru}</p>
                          <p className="text-xs sm:text-sm lg:text-base text-gray-500 mb-1 sm:mb-2">
                            {translations?.home?.admin?.section || 'Раздел'}: {question.section_name[language] || question.section}
                          </p>
                          <p className="text-xs sm:text-sm lg:text-base text-gray-500">
                            {translations?.home?.admin?.correctAnswer || 'Правильный ответ'}: {question.correct + 1}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                          <button
                            onClick={() => handleEdit(question)}
                            className="w-full sm:w-auto bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-600 transition text-sm sm:text-base lg:text-lg font-semibold"
                          >
                            {translations?.home?.admin?.edit || 'Редактировать'}
                          </button>
                          <button
                            onClick={() => handleDelete(question.id)}
                            className="w-full sm:w-auto bg-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-600 transition text-sm sm:text-base lg:text-lg font-semibold"
                          >
                            {translations?.home?.admin?.delete || 'Удалить'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2">
                  <button
                    onClick={() => {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      loadQuestions(newPage);
                    }}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {translations?.home?.admin?.previous || 'Назад'}
                  </button>
                  
                  <span className="px-4 py-2 text-gray-700">
                    {translations?.home?.admin?.pageInfo || 'Страница'} {currentPage} {translations?.home?.admin?.of || translations?.common?.of || 'из'} {totalPages} ({translations?.home?.admin?.total || 'всего'}: {total})
                  </span>
                  
                  <button
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      loadQuestions(newPage);
                    }}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {translations?.home?.admin?.next || 'Вперед'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

