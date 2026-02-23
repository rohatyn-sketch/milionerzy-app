export interface UserProfile {
  googleId: string;
  email: string;
  name: string;
  picture: string;
  createdAt: string;
  lastLogin: string;
}

export interface UserProgress {
  money: number;
  totalEarned: number;
  gamesPlayed: number;
  gamesWon: number;
  bestStreak: number;
  perfectGames: number;
  gamesWonNoLifelines: number;
  categoryStats: Record<string, number>;
  fastestAnswer: number | null;
  dailyChallengesCompleted: number;
  dailyCompleted: string | null;
}

export interface UserPreferences {
  activeTheme: string;
  activeBackground: string;
  soundSfx: boolean;
  soundMusic: boolean;
  ownedThemes: string[];
  ownedBackgrounds: string[];
}

export interface Lifelines {
  fifty: number;
  skip: number;
  time: number;
}
