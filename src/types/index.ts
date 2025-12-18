export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface QuestionResponse {
  questions: Question[];
}

