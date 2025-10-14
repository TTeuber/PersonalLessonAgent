/**
 * Interview Storage Utility
 * Handles saving and loading interview state to/from localStorage
 * to prevent data loss if course creation fails or browser crashes
 */

import type { Question } from '../agents/InitialQuestions';

export interface SavedInterviewState {
  type: 'subject' | 'course';
  subjectId?: string;
  allAnswers: Record<string, string>;
  courseName?: string;
  courseContext?: Record<string, unknown>;
  currentStep: 'initial' | 'followup' | 'complete';
  stepNumber: number;
  followUpQuestions?: Question[];
  timestamp: string;
}

/**
 * Interview Storage Service
 */
export class InterviewStorage {
  private static readonly PREFIX = 'interview_draft';

  /**
   * Generate storage key for a subject
   */
  private static getKey(subjectId: string): string {
    return `${this.PREFIX}_${subjectId}`;
  }

  /**
   * Save interview state to localStorage
   */
  static save(subjectId: string, state: Omit<SavedInterviewState, 'timestamp'>): void {
    try {
      const fullState: SavedInterviewState = {
        ...state,
        timestamp: new Date().toISOString(),
      };
      const key = this.getKey(subjectId);
      localStorage.setItem(key, JSON.stringify(fullState));
      console.log('[InterviewStorage] Saved draft:', key);
    } catch (error) {
      console.error('[InterviewStorage] Error saving state:', error);
      // Don't throw - auto-save failure shouldn't break the flow
    }
  }

  /**
   * Load saved interview state from localStorage
   */
  static load(subjectId: string): SavedInterviewState | null {
    try {
      const key = this.getKey(subjectId);
      const saved = localStorage.getItem(key);
      if (!saved) {
        return null;
      }
      const state = JSON.parse(saved) as SavedInterviewState;
      console.log('[InterviewStorage] Loaded draft:', key, state);
      return state;
    } catch (error) {
      console.error('[InterviewStorage] Error loading state:', error);
      return null;
    }
  }

  /**
   * Check if saved interview state exists
   */
  static has(subjectId: string): boolean {
    const key = this.getKey(subjectId);
    return localStorage.getItem(key) !== null;
  }

  /**
   * Clear saved interview state
   */
  static clear(subjectId: string): void {
    try {
      const key = this.getKey(subjectId);
      localStorage.removeItem(key);
      console.log('[InterviewStorage] Cleared draft:', key);
    } catch (error) {
      console.error('[InterviewStorage] Error clearing state:', error);
    }
  }

  /**
   * Get timestamp of saved draft
   */
  static getTimestamp(subjectId: string): string | null {
    const state = this.load(subjectId);
    return state?.timestamp || null;
  }

  /**
   * Get formatted time ago string
   */
  static getTimeAgo(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  }
}
