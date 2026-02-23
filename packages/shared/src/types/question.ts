export interface Answer {
  text: string;
  correct: boolean;
}

export interface Question {
  id?: number | string;
  question: string;
  answers: Answer[];
  correctAnswer?: boolean | string;
  category: string;
  explanation?: string;
  type?: "multiple-choice" | "true-false";
}

export function isTrueFalse(q: Question): q is TrueFalseQuestion {
  return q.type === 'true-false' || q.answers.length === 2;
}

export interface MultipleChoiceQuestion extends Question {
  type: "multiple-choice";
  answers: [Answer, Answer, Answer, Answer];
}

export interface TrueFalseQuestion extends Question {
  type: "true-false";
  answers: [Answer, Answer];
}
