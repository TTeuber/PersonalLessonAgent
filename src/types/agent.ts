/**
 * Agent-related type definitions
 */

import type { Message, Tool, ContentBlock } from '../services/api/openrouter';

export type { Message, Tool, ContentBlock };

/**
 * Tool call from AI
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  toolUseId: string;
  result: string | Record<string, unknown>;
  isError?: boolean;
}

/**
 * Agent response after processing
 */
export interface AgentResponse {
  text: string;
  toolCalls?: ToolCall[];
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Interview completion data for subjects
 */
export interface SubjectInterviewResult {
  subjectName: string;
  subjectContext: Record<string, unknown>;
}

/**
 * Interview completion data for courses
 */
export interface CourseInterviewResult {
  courseName: string;
  courseContext: Record<string, unknown>;
}

/**
 * Module outline from course designer
 */
export interface ModuleOutline {
  type: 'lesson' | 'exercise' | 'quiz';
  title: string;
  description: string;
  order: number;
}

/**
 * Course outline from course designer
 */
export interface CourseOutline {
  modules: ModuleOutline[];
}
