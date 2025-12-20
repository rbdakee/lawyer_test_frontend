export interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  section: string;
  section_name: {
    kz: string;
    ru: string;
  };
}

export interface QuestionResponse {
  questions: Question[];
}

export interface User {
  id: string;
  phone: string;
  name: string;
  is_admin: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserRegister {
  phone: string;
  password: string;
  name: string;
}

export interface UserLogin {
  phone: string;
  password: string;
}

export interface ExamAnswer {
  question_id: string;
  answer: number;
}

export interface ExamSubmit {
  mode: 'exam' | 'demo' | 'trainer';
  answers: ExamAnswer[];
  section?: string;
  time_spent?: number;
}

export interface ExamResult {
  id: string;
  user_id: string;
  mode: 'exam' | 'demo' | 'trainer';
  total_questions: number;
  correct_answers: number;
  score: number;
  passed: boolean;
  section?: string;
  section_results?: Record<string, { correct: number; total: number }>;
  time_spent?: number;
  created_at: string;
}

export interface ExamHistoryResponse {
  exams: ExamResult[];
  total_exams: number;
  overall_statistics: Record<string, { correct: number; total: number }>;
}

export interface LegislationSection {
  id: string;
  name: string;
}

export interface ReportCreate {
  text: string;
}
