// TypeScript types for Tennis Lesson Intelligence System

export interface StudentSummaryData {
  student_name?: string;
  key_areas_focused?: string[];
  key_areas_notes?: Record<string, string>; // Notes for each key area, e.g., { "forehand topspin": "Working on...", "backhand": "..." }
  physical_limitations?: string[];
  physical_limitations_notes?: Record<string, string>; // Notes for each physical limitation
  future_goals?: string[];
  future_goals_notes?: Record<string, string>; // Notes for each future goal
  next_lesson_date?: string;
  next_lesson_notes?: string; // Notes for next lesson
  last_updated?: string;
  phone_number?: string; // For SMS updates
  email?: string; // For email updates
}

export interface ParsedLessonData {
  student_name: string;
  key_areas_focused: string[];
  physical_limitations: string[];
  future_goals: string[];
  next_lesson_date: string;
}

export interface Student {
  id: string;
  name: string;
  summary_data: StudentSummaryData;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  student_id: string;
  transcript: string | null;
  parsed_data: ParsedLessonData | null;
  date: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      students: {
        Row: Student;
        Insert: Omit<Student, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Student, 'id' | 'created_at'>>;
      };
      lessons: {
        Row: Lesson;
        Insert: Omit<Lesson, 'id' | 'created_at'>;
        Update: Partial<Omit<Lesson, 'id' | 'created_at'>>;
      };
    };
  };
}
