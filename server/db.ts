import fs from 'fs/promises';
import path from 'path';
import { CompanionState, Message, Memory, MoodEntry, UserProfile } from '../src/types';

const DB_FILE = path.join(process.cwd(), 'data-store.json');

const DEFAULT_STATE: CompanionState = {
  profile: {
    name: 'Friend',
    onboardingCompleted: false,
    createdAt: new Date().toISOString()
  },
  memories: [],
  moodHistory: [],
  messages: []
};

// Safe reading and writing helper
class Database {
  private cachedState: CompanionState | null = null;

  async init(): Promise<void> {
    try {
      await fs.access(DB_FILE);
      const dataStr = await fs.readFile(DB_FILE, 'utf-8');
      this.cachedState = JSON.parse(dataStr);
    } catch (err) {
      // File doesn't exist or is corrupt, write default state
      this.cachedState = { ...DEFAULT_STATE };
      await this.save();
    }
  }

  async getState(): Promise<CompanionState> {
    if (!this.cachedState) {
      await this.init();
    }
    return this.cachedState!;
  }

  async save(): Promise<void> {
    if (this.cachedState) {
      await fs.writeFile(DB_FILE, JSON.stringify(this.cachedState, null, 2), 'utf-8');
    }
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const state = await this.getState();
    state.profile = {
      ...state.profile,
      ...profile,
      lastUpdated: new Date().toISOString()
    } as any;
    await this.save();
    return state.profile;
  }

  async getMessages(): Promise<Message[]> {
    const state = await this.getState();
    return state.messages;
  }

  async addMessage(msg: Message): Promise<Message> {
    const state = await this.getState();
    state.messages.push(msg);
    // Limit to last 200 items to prevent file-bloat in long chat sessions
    if (state.messages.length > 200) {
      state.messages = state.messages.slice(-200);
    }
    await this.save();
    return msg;
  }

  async getMemories(): Promise<Memory[]> {
    const state = await this.getState();
    return state.memories;
  }

  async addMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'lastUpdated'>): Promise<Memory> {
    const state = await this.getState();
    const id = 'mem_' + Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();
    
    // Check if a highly similar memory in this category already exists to avoid duplicates
    const duplicatedIdx = state.memories.findIndex(
      m => m.category === memory.category && 
      m.description.toLowerCase().trim() === memory.description.toLowerCase().trim()
    );

    if (duplicatedIdx !== -1) {
      state.memories[duplicatedIdx].lastUpdated = now;
      await this.save();
      return state.memories[duplicatedIdx];
    }

    const newMemory: Memory = {
      id,
      ...memory,
      createdAt: now,
      lastUpdated: now
    };
    state.memories.push(newMemory);
    await this.save();
    return newMemory;
  }

  async updateMemory(id: string, description: string): Promise<Memory | null> {
    const state = await this.getState();
    const idx = state.memories.findIndex(m => m.id === id);
    if (idx !== -1) {
      state.memories[idx].description = description;
      state.memories[idx].lastUpdated = new Date().toISOString();
      await this.save();
      return state.memories[idx];
    }
    return null;
  }

  async deleteMemory(id: string): Promise<boolean> {
    const state = await this.getState();
    const originalLength = state.memories.length;
    state.memories = state.memories.filter(m => m.id !== id);
    if (state.memories.length !== originalLength) {
      await this.save();
      return true;
    }
    return false;
  }

  async getMoods(): Promise<MoodEntry[]> {
    const state = await this.getState();
    return state.moodHistory;
  }

  async addMood(score: number, notes: string, triggers: string[]): Promise<MoodEntry> {
    const state = await this.getState();
    const id = 'mood_' + Math.random().toString(36).substring(2, 11);
    const newMood: MoodEntry = {
      id,
      score,
      notes,
      triggers,
      timestamp: new Date().toISOString()
    };
    state.moodHistory.push(newMood);
    await this.save();
    return newMood;
  }

  async resetAll(): Promise<void> {
    this.cachedState = {
      profile: {
        name: 'Friend',
        onboardingCompleted: false,
        createdAt: new Date().toISOString()
      },
      memories: [],
      moodHistory: [],
      messages: []
    };
    await this.save();
  }
}

export const db = new Database();
