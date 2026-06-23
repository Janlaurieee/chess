export interface AIConfig {
  endpoint: string;
  model: string;
  personality: 'gemma_master' | 'pixel_paladin' | 'chiptune_glitch' | 'boss_slime';
  temperature: number;
  thinkingDelay: number; // in ms
  maxRetries: number;
}

export type AIPersonalityId = AIConfig['personality'];

export interface AIPersonality {
  id: AIPersonalityId;
  name: string;
  title: string;
  avatar: string; // Emoji or short layout
  greeting: string;
  victoryPhrase: string;
  defeatPhrase: string;
  checkPhrase: string;
  capturePhrase: string;
  description: string;
  flavorText: string;
}

export interface MoveLog {
  san: string;
  uci: string;
  from: string;
  to: string;
  piece: string;
  color: 'w' | 'b';
  captured?: string;
  timestamp: string;
  comment?: string;
}

export interface ConsoleLog {
  id: string;
  type: 'system' | 'player' | 'ai' | 'glitch';
  text: string;
  timestamp: string;
}

export interface GameStats {
  wins: number;
  losses: number;
  draws: number;
}
