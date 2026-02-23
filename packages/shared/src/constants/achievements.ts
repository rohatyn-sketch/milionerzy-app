import type { Achievement } from '../types/achievement';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_game', name: 'Pierwsza gra', description: 'Zagraj w swoja pierwsza gre', icon: '🎮', condition: 'gamesPlayed >= 1' },
  { id: 'first_win', name: 'Pierwsze zwyciestwo', description: 'Wygraj swoja pierwsza gre', icon: '🏆', condition: 'gamesWon >= 1' },
  { id: 'millionaire', name: 'Milioner', description: 'Zdobadz 1,000,000 PLN', icon: '💰', condition: 'money >= 1000000' },
  { id: 'streak_3', name: 'Seria 3', description: 'Odpowiedz poprawnie 3 razy z rzedu', icon: '🔥', condition: 'bestStreak >= 3' },
  { id: 'streak_5', name: 'Seria 5', description: 'Odpowiedz poprawnie 5 razy z rzedu', icon: '🔥🔥', condition: 'bestStreak >= 5' },
  { id: 'streak_10', name: 'Seria 10', description: 'Odpowiedz poprawnie 10 razy z rzedu', icon: '🔥🔥🔥', condition: 'bestStreak >= 10' },
  { id: 'perfect_game', name: 'Perfekcyjna gra', description: 'Odpowiedz poprawnie na wszystkie pytania', icon: '⭐', condition: 'perfectGames >= 1' },
  { id: 'no_lifelines', name: 'Bez pomocy', description: 'Wygraj gre bez uzycia kol ratunkowych', icon: '💪', condition: 'gamesWonNoLifelines >= 1' },
  { id: 'games_10', name: '10 gier', description: 'Zagraj 10 gier', icon: '🎯', condition: 'gamesPlayed >= 10' },
  { id: 'games_50', name: '50 gier', description: 'Zagraj 50 gier', icon: '🎯🎯', condition: 'gamesPlayed >= 50' },
  { id: 'fast_answer', name: 'Blyskawica', description: 'Odpowiedz w mniej niz 3 sekundy', icon: '⚡', condition: 'fastestAnswer < 3' },
  { id: 'daily_challenge', name: 'Wyzwanie dnia', description: 'Ukonczwyzwanie dnia', icon: '📅', condition: 'dailyChallengesCompleted >= 1' },
  { id: 'rich', name: 'Bogacz', description: 'Zdobadz lacznie 10,000,000 PLN', icon: '💎', condition: 'totalEarned >= 10000000' },
];
