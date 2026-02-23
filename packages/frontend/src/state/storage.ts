import type {
  UserProgress,
  UserPreferences,
  Lifelines,
  QuizClass,
  Question,
  SaveProgressRequest,
  LoadProgressResponse,
} from '@milionerzy/shared';
import { formatMoney as sharedFormatMoney } from '@milionerzy/shared';

const KEYS = {
  MONEY: 'milionerzy_money',
  TOTAL_EARNED: 'milionerzy_total_earned',
  THEMES: 'milionerzy_themes',
  BACKGROUNDS: 'milionerzy_backgrounds',
  LIFELINES: 'milionerzy_lifelines',
  ACTIVE_THEME: 'milionerzy_active_theme',
  ACTIVE_BACKGROUND: 'milionerzy_active_background',
  GAMES_PLAYED: 'milionerzy_games_played',
  GAMES_WON: 'milionerzy_games_won',
  ACHIEVEMENTS: 'milionerzy_achievements',
  LEADERBOARD: 'milionerzy_leaderboard',
  DAILY_COMPLETED: 'milionerzy_daily_completed',
  BEST_STREAK: 'milionerzy_best_streak',
  SOUND_SFX: 'milionerzy_sound_sfx',
  SOUND_MUSIC: 'milionerzy_sound_music',
  CATEGORY_STATS: 'milionerzy_category_stats',
  FASTEST_ANSWER: 'milionerzy_fastest_answer',
  PERFECT_GAMES: 'milionerzy_perfect_games',
  DAILY_CHALLENGES_COMPLETED: 'milionerzy_daily_challenges_completed',
  GAMES_WON_NO_LIFELINES: 'milionerzy_games_won_no_lifelines',
  CLASSES_REGISTRY: 'milionerzy_classes_registry',
  ACTIVE_CLASS: 'milionerzy_active_class',
} as const;

function getInt(key: string): number | null {
  const v = localStorage.getItem(key);
  return v !== null ? parseInt(v, 10) : null;
}

function getFloat(key: string): number | null {
  const v = localStorage.getItem(key);
  return v !== null ? parseFloat(v) : null;
}

function getJSON<T>(key: string): T | null {
  const v = localStorage.getItem(key);
  if (v === null) return null;
  try { return JSON.parse(v); } catch { return null; }
}

function setJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  init() {
    if (this.getMoney() === null) this.setMoney(0);
    if (this.getTotalEarned() === null) this.setTotalEarned(0);
    if (this.getThemes() === null) this.setThemes([]);
    if (this.getBackgrounds() === null) this.setBackgrounds([]);
    if (this.getLifelines() === null) this.setLifelines({ fifty: 0, skip: 0, time: 0 });
    if (this.getActiveTheme() === null) this.setActiveTheme('default');
    if (this.getActiveBackground() === null) this.setActiveBackground('default');
    if (this.getGamesPlayed() === null) this.setGamesPlayed(0);
    if (this.getGamesWon() === null) this.setGamesWon(0);
    if (this.getAchievements() === null) this.setAchievements([]);
    if (this.getLeaderboard() === null) this.setLeaderboard([]);
    if (this.getBestStreak() === null) this.setBestStreak(0);
    if (this.getCategoryStats() === null) this.setCategoryStats({});
    if (this.getPerfectGames() === null) this.setPerfectGames(0);
    if (this.getDailyChallengesCompleted() === null) this.setDailyChallengesCompleted(0);
    if (this.getGamesWonNoLifelines() === null) this.setGamesWonNoLifelines(0);

    if (this.getClassesRegistry() === null) {
      this.setClassesRegistry([{
        id: 'default_fizyka7',
        name: 'Fizyka - Klasa 7',
        isDefault: true,
        questionCount: 65,
      }]);
      this.setActiveClass('default_fizyka7');
    }
  },

  // Money
  getMoney(): number | null { return getInt(KEYS.MONEY); },
  setMoney(n: number) { localStorage.setItem(KEYS.MONEY, Math.max(0, n).toString()); },
  addMoney(n: number) {
    this.setMoney((this.getMoney() || 0) + n);
    if (n > 0) this.addTotalEarned(n);
  },

  getTotalEarned(): number | null { return getInt(KEYS.TOTAL_EARNED); },
  setTotalEarned(n: number) { localStorage.setItem(KEYS.TOTAL_EARNED, n.toString()); },
  addTotalEarned(n: number) { this.setTotalEarned((this.getTotalEarned() || 0) + n); },

  // Themes & backgrounds
  getThemes(): string[] | null { return getJSON<string[]>(KEYS.THEMES); },
  setThemes(t: string[]) { setJSON(KEYS.THEMES, t); },
  addTheme(id: string) {
    const t = this.getThemes() || [];
    if (!t.includes(id)) { t.push(id); this.setThemes(t); }
  },
  hasTheme(id: string): boolean { return (this.getThemes() || []).includes(id); },

  getBackgrounds(): string[] | null { return getJSON<string[]>(KEYS.BACKGROUNDS); },
  setBackgrounds(b: string[]) { setJSON(KEYS.BACKGROUNDS, b); },
  addBackground(id: string) {
    const b = this.getBackgrounds() || [];
    if (!b.includes(id)) { b.push(id); this.setBackgrounds(b); }
  },
  hasBackground(id: string): boolean { return (this.getBackgrounds() || []).includes(id); },

  getActiveTheme(): string | null { return localStorage.getItem(KEYS.ACTIVE_THEME); },
  setActiveTheme(id: string) { localStorage.setItem(KEYS.ACTIVE_THEME, id); },
  getActiveBackground(): string | null { return localStorage.getItem(KEYS.ACTIVE_BACKGROUND); },
  setActiveBackground(id: string) { localStorage.setItem(KEYS.ACTIVE_BACKGROUND, id); },

  // Lifelines
  getLifelines(): Lifelines | null { return getJSON<Lifelines>(KEYS.LIFELINES); },
  setLifelines(l: Lifelines) { setJSON(KEYS.LIFELINES, l); },
  addLifeline(type: keyof Lifelines, amount = 1) {
    const l = this.getLifelines() || { fifty: 0, skip: 0, time: 0 };
    l[type] = (l[type] || 0) + amount;
    this.setLifelines(l);
  },
  useLifeline(type: keyof Lifelines): boolean {
    const l = this.getLifelines() || { fifty: 0, skip: 0, time: 0 };
    if (l[type] > 0) { l[type]--; this.setLifelines(l); return true; }
    return false;
  },
  getLifelineCount(type: keyof Lifelines): number {
    return (this.getLifelines() || { fifty: 0, skip: 0, time: 0 })[type] || 0;
  },

  // Stats
  getGamesPlayed(): number | null { return getInt(KEYS.GAMES_PLAYED); },
  setGamesPlayed(n: number) { localStorage.setItem(KEYS.GAMES_PLAYED, n.toString()); },
  incrementGamesPlayed() { this.setGamesPlayed((this.getGamesPlayed() || 0) + 1); },

  getGamesWon(): number | null { return getInt(KEYS.GAMES_WON); },
  setGamesWon(n: number) { localStorage.setItem(KEYS.GAMES_WON, n.toString()); },
  incrementGamesWon() { this.setGamesWon((this.getGamesWon() || 0) + 1); },

  // Achievements
  getAchievements(): string[] | null { return getJSON<string[]>(KEYS.ACHIEVEMENTS); },
  setAchievements(a: string[]) { setJSON(KEYS.ACHIEVEMENTS, a); },

  // Leaderboard
  getLeaderboard(): any[] | null { return getJSON<any[]>(KEYS.LEADERBOARD); },
  setLeaderboard(l: any[]) { setJSON(KEYS.LEADERBOARD, l); },

  // Daily
  getDailyCompleted(): string | null { return localStorage.getItem(KEYS.DAILY_COMPLETED); },
  setDailyCompleted(d: string) { localStorage.setItem(KEYS.DAILY_COMPLETED, d); },

  // Best streak
  getBestStreak(): number | null { return getInt(KEYS.BEST_STREAK); },
  setBestStreak(n: number) { localStorage.setItem(KEYS.BEST_STREAK, n.toString()); },

  // Sound
  getSoundSfx(): boolean | null {
    const v = localStorage.getItem(KEYS.SOUND_SFX);
    return v === null ? null : v === 'true';
  },
  setSoundSfx(e: boolean) { localStorage.setItem(KEYS.SOUND_SFX, e.toString()); },
  getSoundMusic(): boolean | null {
    const v = localStorage.getItem(KEYS.SOUND_MUSIC);
    return v === null ? null : v === 'true';
  },
  setSoundMusic(e: boolean) { localStorage.setItem(KEYS.SOUND_MUSIC, e.toString()); },

  // Category stats
  getCategoryStats(): Record<string, number> | null { return getJSON(KEYS.CATEGORY_STATS); },
  setCategoryStats(s: Record<string, number>) { setJSON(KEYS.CATEGORY_STATS, s); },
  incrementCategoryCorrect(cat: string) {
    const s = this.getCategoryStats() || {};
    s[cat] = (s[cat] || 0) + 1;
    this.setCategoryStats(s);
  },

  // Fastest answer
  getFastestAnswer(): number | null { return getFloat(KEYS.FASTEST_ANSWER); },
  setFastestAnswer(t: number) {
    const cur = this.getFastestAnswer();
    if (cur === null || t < cur) localStorage.setItem(KEYS.FASTEST_ANSWER, t.toString());
  },

  // Perfect games
  getPerfectGames(): number | null { return getInt(KEYS.PERFECT_GAMES); },
  setPerfectGames(n: number) { localStorage.setItem(KEYS.PERFECT_GAMES, n.toString()); },
  incrementPerfectGames() { this.setPerfectGames((this.getPerfectGames() || 0) + 1); },

  // Daily challenges completed
  getDailyChallengesCompleted(): number | null { return getInt(KEYS.DAILY_CHALLENGES_COMPLETED); },
  setDailyChallengesCompleted(n: number) { localStorage.setItem(KEYS.DAILY_CHALLENGES_COMPLETED, n.toString()); },
  incrementDailyChallengesCompleted() { this.setDailyChallengesCompleted((this.getDailyChallengesCompleted() || 0) + 1); },

  // No lifelines wins
  getGamesWonNoLifelines(): number | null { return getInt(KEYS.GAMES_WON_NO_LIFELINES); },
  setGamesWonNoLifelines(n: number) { localStorage.setItem(KEYS.GAMES_WON_NO_LIFELINES, n.toString()); },
  incrementGamesWonNoLifelines() { this.setGamesWonNoLifelines((this.getGamesWonNoLifelines() || 0) + 1); },

  // Multi-class system
  getClassesRegistry(): QuizClass[] | null { return getJSON<QuizClass[]>(KEYS.CLASSES_REGISTRY); },
  setClassesRegistry(c: QuizClass[]) { setJSON(KEYS.CLASSES_REGISTRY, c); },
  getActiveClass(): string { return localStorage.getItem(KEYS.ACTIVE_CLASS) || 'default_fizyka7'; },
  setActiveClass(id: string) { localStorage.setItem(KEYS.ACTIVE_CLASS, id); },

  getClassQuestions(classId: string): Question[] | null {
    return getJSON<Question[]>('milionerzy_questions_' + classId);
  },
  setClassQuestions(classId: string, q: Question[]) {
    const key = 'milionerzy_questions_' + classId;
    localStorage.removeItem(key);
    setJSON(key, q);
  },
  removeClassQuestions(classId: string) {
    localStorage.removeItem('milionerzy_questions_' + classId);
  },

  getClassIncorrect(classId: string): (number | string)[] {
    return getJSON<(number | string)[]>('milionerzy_incorrect_' + classId) || [];
  },
  setClassIncorrect(classId: string, arr: (number | string)[]) {
    setJSON('milionerzy_incorrect_' + classId, arr);
  },
  addClassIncorrect(classId: string, qId: number | string) {
    const arr = this.getClassIncorrect(classId);
    if (!arr.includes(qId)) { arr.push(qId); this.setClassIncorrect(classId, arr); }
  },
  removeClassIncorrect(classId: string, qId: number | string) {
    const arr = this.getClassIncorrect(classId);
    const i = arr.indexOf(qId);
    if (i > -1) { arr.splice(i, 1); this.setClassIncorrect(classId, arr); }
  },

  // Wrappers delegating to active class
  getIncorrectQuestions(): (number | string)[] { return this.getClassIncorrect(this.getActiveClass()); },
  addIncorrectQuestion(qId: number | string) { this.addClassIncorrect(this.getActiveClass(), qId); },
  removeIncorrectQuestion(qId: number | string) { this.removeClassIncorrect(this.getActiveClass(), qId); },
  getIncorrectCount(): number { return this.getClassIncorrect(this.getActiveClass()).length; },

  // Class management
  addClass(cls: QuizClass) {
    const reg = this.getClassesRegistry() || [];
    reg.push(cls);
    this.setClassesRegistry(reg);
  },
  removeClass(classId: string) {
    let reg = this.getClassesRegistry() || [];
    reg = reg.filter(c => c.id !== classId);
    this.setClassesRegistry(reg);
    this.removeClassQuestions(classId);
    localStorage.removeItem('milionerzy_incorrect_' + classId);
  },
  getClassById(classId: string): QuizClass | null {
    return (this.getClassesRegistry() || []).find(c => c.id === classId) || null;
  },

  formatMoney: sharedFormatMoney,

  // Progress sync helpers
  collectProgressData(): SaveProgressRequest {
    return {
      progress: {
        money: this.getMoney() || 0,
        totalEarned: this.getTotalEarned() || 0,
        gamesPlayed: this.getGamesPlayed() || 0,
        gamesWon: this.getGamesWon() || 0,
        bestStreak: this.getBestStreak() || 0,
        perfectGames: this.getPerfectGames() || 0,
        gamesWonNoLifelines: this.getGamesWonNoLifelines() || 0,
        categoryStats: this.getCategoryStats() || {},
        fastestAnswer: this.getFastestAnswer(),
        dailyChallengesCompleted: this.getDailyChallengesCompleted() || 0,
        dailyCompleted: this.getDailyCompleted(),
      },
      preferences: {
        activeTheme: this.getActiveTheme() || 'default',
        activeBackground: this.getActiveBackground() || 'default',
        soundSfx: this.getSoundSfx() ?? true,
        soundMusic: this.getSoundMusic() ?? false,
        ownedThemes: this.getThemes() || [],
        ownedBackgrounds: this.getBackgrounds() || [],
      },
      lifelines: this.getLifelines() || { fifty: 0, skip: 0, time: 0 },
      achievements: this.getAchievements() || [],
      activeClassId: this.getActiveClass(),
      incorrectQuestions: {},
      classes: (this.getClassesRegistry() || []).filter(c => !c.isDefault),
    };
  },

  restoreProgressData(data: LoadProgressResponse) {
    if (data.progress) {
      this.setMoney(data.progress.money);
      this.setTotalEarned(data.progress.totalEarned);
      this.setGamesPlayed(data.progress.gamesPlayed);
      this.setGamesWon(data.progress.gamesWon);
      this.setBestStreak(data.progress.bestStreak);
      this.setPerfectGames(data.progress.perfectGames);
      this.setGamesWonNoLifelines(data.progress.gamesWonNoLifelines);
      this.setCategoryStats(data.progress.categoryStats);
      if (data.progress.fastestAnswer !== null) {
        localStorage.setItem(KEYS.FASTEST_ANSWER, data.progress.fastestAnswer.toString());
      }
      this.setDailyChallengesCompleted(data.progress.dailyChallengesCompleted);
      if (data.progress.dailyCompleted) this.setDailyCompleted(data.progress.dailyCompleted);
    }
    if (data.preferences) {
      this.setActiveTheme(data.preferences.activeTheme);
      this.setActiveBackground(data.preferences.activeBackground);
      this.setSoundSfx(data.preferences.soundSfx);
      this.setSoundMusic(data.preferences.soundMusic);
      this.setThemes(data.preferences.ownedThemes);
      this.setBackgrounds(data.preferences.ownedBackgrounds);
    }
    if (data.lifelines) this.setLifelines(data.lifelines);
    if (data.achievements) this.setAchievements(data.achievements);
    if (data.activeClassId) this.setActiveClass(data.activeClassId);
  },

  resetAll() {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('milionerzy_questions_') || key.startsWith('milionerzy_incorrect_'))) {
        toRemove.push(key);
      }
    }
    toRemove.forEach(key => localStorage.removeItem(key));
    this.init();
  },
};
