import type { Question } from '../types/question';

export function shuffleAnswers(question: Question): Question {
  const answers = [...question.answers];
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }
  return { ...question, answers };
}

export function getRandomQuestions(questions: Question[], count: number = 10): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getMainCategory(questions: Question[]): string {
  const cats: Record<string, number> = {};
  questions.forEach(q => {
    cats[q.category] = (cats[q.category] || 0) + 1;
  });
  let main = '';
  let max = 0;
  for (const [cat, count] of Object.entries(cats)) {
    if (count > max) {
      max = count;
      main = cat;
    }
  }
  return main;
}
