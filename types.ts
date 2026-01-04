
export interface Assignment {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  notes: string;
  timeSpent: number; // in minutes
}

export interface Weekend {
  id: number;
  title: string;
  assignments: Assignment[];
}

export interface UserProgress {
  userId: string;
  weekends: Weekend[];
}

export interface Suggestion {
  suggestedTasks: string[];
  reasoning: string;
}
