export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  description?: string;
}

export interface Character {
  id: string;
  name: string;
  personality: string;
  visualStyle: string;
  colorPalette: string[];
  voiceType: string;
  pixarReference: string;
  emoji: string;
}

export interface VideoGeneration {
  videoId: string;
  userId: string;
  date: string;
  characterType: string;
  userName: string;
  events: CalendarEvent[];
  userNote?: string;
  generatedScript?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: Date;
}
