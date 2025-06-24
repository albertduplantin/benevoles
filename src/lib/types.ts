// Types de la base de données générés par Supabase, ou définis manuellement

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      inscriptions: {
        Row: {
          created_at: string
          id: number
          mission_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          mission_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          mission_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscriptions_mission_id_fkey"
            columns: ["mission_id"]
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      missions: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          id: number
          location: string | null
          manager_id: string | null
          max_volunteers: number
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: number
          location?: string | null
          manager_id?: string | null
          max_volunteers: number
          start_time: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: number
          location?: string | null
          manager_id?: string | null
          max_volunteers?: number
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_manager_id_fkey"
            columns: ["manager_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          accepts_contact_sharing: boolean
          avatar_url: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          membership_status: string | null
          membership_year: number | null
          membership_paid_at: string | null
        }
        Insert: {
          accepts_contact_sharing?: boolean
          avatar_url?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          membership_status?: string | null
          membership_year?: number | null
          membership_paid_at?: string | null
        }
        Update: {
          accepts_contact_sharing?: boolean
          avatar_url?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          membership_status?: string | null
          membership_year?: number | null
          membership_paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      membership_settings: {
        Row: {
          id: number
          year: number
          amount: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          year: number
          amount: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          year?: number
          amount?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      membership_payments: {
        Row: {
          id: number
          user_id: string
          year: number
          amount: number
          stripe_payment_id: string | null
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          year: number
          amount: number
          stripe_payment_id?: string | null
          status: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          year?: number
          amount?: number
          stripe_payment_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_payments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      user_role: "benevole" | "responsable" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Nos types personnalisés pour l'application
export type Mission = Database['public']['Tables']['missions']['Row'];
export type UserProfile = Database['public']['Tables']['users']['Row'];
export type Inscription = Database['public']['Tables']['inscriptions']['Row'];
export type MembershipSetting = Database['public']['Tables']['membership_settings']['Row'];
export type MembershipPayment = Database['public']['Tables']['membership_payments']['Row'];

// Types pour le système de notifications
export interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  mission_id?: number | null;
}

export interface NotificationInsert {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  mission_id?: number | null;
}

// Types pour les missions avec compteurs et volontaires
export interface MissionWithCounts extends Mission {
  inscriptions_count: { count: number }[];
}

// Pour les missions avec les détails des bénévoles inscrits
export type MissionWithVolunteers = Mission & {
  inscriptions_count: number;
  inscriptions: Array<{
    user_id: string;
    users: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  }>;
};

// Types pour le système de planning
export interface PlanningMission extends Mission {
  inscriptions_count: number;
  volunteers: Array<{
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  }>;
  manager?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface ConflictDetection {
  volunteer_id: string;
  volunteer_name: string;
  conflicts: Array<{
    mission1: PlanningMission;
    mission2: PlanningMission;
    overlap_start: string;
    overlap_end: string;
  }>;
}

export interface PlanningStats {
  total_missions: number;
  total_volunteer_slots: number;
  filled_slots: number;
  coverage_percentage: number;
  conflicts_count: number;
  missions_by_day: Record<string, number>;
}

export interface PlanningFilters {
  start_date?: string;
  end_date?: string;
  volunteer_id?: string;
  mission_type?: string;
  manager_id?: string;
  location?: string;
  status?: 'all' | 'full' | 'available' | 'conflicts';
}

// Types pour les vues de planning
export type PlanningView = 'calendar' | 'timeline' | 'volunteer' | 'sector'; 