import type { QuestionCategory, QuestionSubcategory } from '../catalog/question-taxonomy';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type { QuestionCategory, QuestionSubcategory };

export interface QuestionOption {
  id: string;
  text: string;
}

export type QuestionType = 'multiple_choice' | 'hybrid' | 'free_text';
export type GameSessionStatus = 'phase1' | 'phase2' | 'phase3' | 'completed';

type EmptyRelationships = [];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_url?: string | null;
        };
        Relationships: EmptyRelationships;
      };
      couples: {
        Row: {
          id: string;
          name: string | null;
          created_by: string;
          invite_code: string;
          invite_expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          created_by: string;
          invite_code: string;
          invite_expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string | null;
          invite_expires_at?: string | null;
        };
        Relationships: EmptyRelationships;
      };
      couple_members: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: EmptyRelationships;
      };
      questions: {
        Row: {
          id: string;
          question_id: string | null;
          couple_id: string | null;
          type: QuestionType;
          category: QuestionCategory;
          subcategory: QuestionSubcategory;
          intensity: number;
          text: string;
          options: QuestionOption[] | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id?: string | null;
          couple_id?: string | null;
          type: QuestionType;
          category: QuestionCategory;
          subcategory: QuestionSubcategory;
          intensity: number;
          text: string;
          options?: QuestionOption[] | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          is_active?: boolean;
          text?: string;
          options?: QuestionOption[] | null;
          category?: QuestionCategory;
          subcategory?: QuestionSubcategory;
        };
        Relationships: EmptyRelationships;
      };
      game_sessions: {
        Row: {
          id: string;
          couple_id: string;
          category: QuestionCategory | null;
          status: GameSessionStatus;
          created_by: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id: string;
          category?: QuestionCategory | null;
          status?: GameSessionStatus;
          created_by: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string;
          category?: QuestionCategory | null;
          status?: GameSessionStatus;
          created_by?: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: EmptyRelationships;
      };
      session_questions: {
        Row: {
          id: string;
          session_id: string;
          question_id: string;
          position: number;
        };
        Insert: {
          id?: string;
          session_id: string;
          question_id: string;
          position: number;
        };
        Update: {
          id?: string;
          session_id?: string;
          question_id?: string;
          position?: number;
        };
        Relationships: EmptyRelationships;
      };
      user_session_state: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          phase1_completed: boolean;
          phase1_completed_at: string | null;
          phase2_completed: boolean;
          phase2_completed_at: string | null;
          reveal_position: number;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          phase1_completed?: boolean;
          phase1_completed_at?: string | null;
          phase2_completed?: boolean;
          phase2_completed_at?: string | null;
          reveal_position?: number;
        };
        Update: {
          phase1_completed?: boolean;
          phase2_completed?: boolean;
          reveal_position?: number;
        };
        Relationships: EmptyRelationships;
      };
      answers: {
        Row: {
          id: string;
          session_id: string;
          question_id: string;
          user_id: string;
          selected_option_id: string | null;
          free_text: string | null;
          answered_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          question_id: string;
          user_id: string;
          selected_option_id?: string | null;
          free_text?: string | null;
          answered_at?: string;
        };
        Update: {
          selected_option_id?: string | null;
          free_text?: string | null;
        };
        Relationships: EmptyRelationships;
      };
      predictions: {
        Row: {
          id: string;
          session_id: string;
          question_id: string;
          predictor_id: string;
          predicted_option_id: string | null;
          predicted_free_text: string | null;
          is_correct: boolean | null;
          predicted_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          question_id: string;
          predictor_id: string;
          predicted_option_id?: string | null;
          predicted_free_text?: string | null;
          predicted_at?: string;
        };
        Update: {
          predicted_option_id?: string | null;
          predicted_free_text?: string | null;
          is_correct?: boolean | null;
        };
        Relationships: EmptyRelationships;
      };
      free_text_validations: {
        Row: {
          id: string;
          prediction_id: string;
          validator_id: string;
          is_correct: boolean;
          validated_at: string;
        };
        Insert: {
          id?: string;
          prediction_id: string;
          validator_id: string;
          is_correct: boolean;
          validated_at?: string;
        };
        Update: {
          is_correct?: boolean;
        };
        Relationships: EmptyRelationships;
      };
    };
    Views: Record<string, never>;
    Functions: {
      fn_create_session: {
        Args: { p_couple_id: string; p_category: QuestionCategory };
        Returns: string;
      };
      fn_join_couple: {
        Args: { p_invite_code: string };
        Returns: string;
      };
      is_couple_member: {
        Args: { p_couple_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
