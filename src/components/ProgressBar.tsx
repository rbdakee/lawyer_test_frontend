'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface ProgressBarProps {
  current: number;
  total: number;
  section?: 'demo' | 'exam';
}

export default function ProgressBar({ current, total, section = 'demo' }: ProgressBarProps) {
  const { translations } = useLanguage();
  const percentage = (current / total) * 100;
  const t = translations?.[section] || {};
  const common = translations?.common || {};

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2 text-sm text-gray-700 font-medium">
        <span>{t.questionProgress || 'Сұрақ'} {current} {common.of || '/'} {total}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
        <div
          className="bg-gradient-to-r from-[#00AFCA] to-[#FFB700] h-3 rounded-full transition-all duration-300 shadow-md"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

