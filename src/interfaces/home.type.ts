         // Trễ hạn & KHÔNG đủ Shield (Mất Streak/Retain)

export interface StreakCheckResult {
  
  // Thông số Streak
  streak: {
    previous: number;
    max: number;
    current: number;
  };

  // Thông số Shield
  shield: {
    previous: number;
    current: number;
  };

  // Thông số Retain Circle & Habit
  retain: {
    previous: number;
    current: number;
  };

  habit: {
    previousPercent: number;
    currentPercent: number;
  };

  // Thông điệp / Toast hướng dẫn cho User
  message?: {
    title: string;
    subtitle: string;
    type: 'success' | 'warning' | 'danger';
  };
}