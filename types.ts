
export interface Position {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  createdAt: number;
  interviewDate?: string;
  logoUrl?: string;
  bannerUrl?: string;
  researchHistory?: ChatMessage[];
  analysisHistory?: AnalysisRecord[];
}

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  metrics: {
    subject: string;
    A: number;
    fullMark: number;
  }[];
  transcript: string;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  RESUME_OPTIMIZE = 'resume_optimize',
  PERSONALITY_TEST = 'personality_test',
  POSITION_INFO = 'position_info',
  RESEARCH_CHAT = 'research_chat',
  LIVE_INTERVIEW = 'live_interview',
  ANALYSIS = 'analysis'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  links?: { title: string; uri: string }[];
}

export interface PersonalityQuestion {
  id: number;
  text: string;
  options: { label: string; value: string; trait: string }[];
}

export type Language = 'zh' | 'en';
