export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
}

export interface AchievementProgress {
  current: number;
  target: number;
}
