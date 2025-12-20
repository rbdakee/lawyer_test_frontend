'use client';

import { Question } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: number | null;
  onAnswerSelect: (answerIndex: number) => void;
  showExplanation?: boolean;
  isDemo?: boolean;
}

export default function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  showExplanation,
  isDemo,
}: QuestionCardProps) {
  const { translations } = useLanguage();
  const isCorrect = selectedAnswer === question.correct;
  const t = translations?.demo || {};

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 border-2 border-gray-100">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-800 leading-relaxed break-words">
        {question.question}
      </h2>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 font-medium ";
          
          if (showExplanation && isDemo) {
            if (index === question.correct) {
              buttonClass += "bg-green-50 border-green-500 text-green-800 shadow-md";
            } else if (index === selectedAnswer && index !== question.correct) {
              buttonClass += "bg-red-50 border-red-500 text-red-800 shadow-md";
            } else {
              buttonClass += "border-gray-300 bg-gray-50 text-gray-600 opacity-75";
            }
          } else {
            if (selectedAnswer === index) {
              buttonClass += "bg-gradient-to-r from-[#00AFCA] to-[#0099CC] border-[#00AFCA] text-white shadow-md hover:shadow-lg";
            } else {
              buttonClass += "border-gray-300 bg-white hover:bg-[#F0F9FF] hover:border-[#00AFCA] text-gray-800";
            }
          }

          return (
            <button
              key={index}
              onClick={() => !showExplanation && onAnswerSelect(index)}
              disabled={showExplanation && isDemo}
              className={buttonClass}
            >
              <div className="flex items-start gap-2">
                <span className="font-bold text-lg flex-shrink-0">{String.fromCharCode(65 + index)}.</span>
                <span className="flex-1 text-left break-words">{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className={`mt-6 p-5 rounded-lg border-l-4 ${
          isCorrect 
            ? 'bg-green-50 border-green-500' 
            : 'bg-red-50 border-red-500'
        }`}>
          <p className={`font-bold mb-2 text-lg ${
            isCorrect ? 'text-green-700' : 'text-red-700'
          }`}>
            {isCorrect ? `✓ ${t.correctAnswer || 'Дұрыс жауап'}` : `✗ ${t.wrongAnswer || 'Қате жауап'}`}
          </p>
          <p className="text-gray-700 leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

