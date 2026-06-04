/**
 * Shared Type Definitions for Sana - AI Anxiety Companion
 */

export type MemoryCategory = 'trigger' | 'helpful_strategy' | 'unhelpful_strategy' | 'context' | 'preference';

export interface Memory {
  id: string;
  category: MemoryCategory;
  description: string;
  createdAt: string;
  lastUpdated: string;
}

export interface MoodEntry {
  id: string;
  score: number; // 1 (Very Anxious) to 5 (Peaceful)
  notes: string;
  triggers: string[];
  timestamp: string;
}

export interface UserProfile {
  name: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  messages: Message[];
}

export interface CompanionState {
  profile: UserProfile;
  memories: Memory[];
  moodHistory: MoodEntry[];
  messages: Message[];
}
