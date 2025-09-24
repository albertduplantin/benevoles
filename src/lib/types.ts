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
          is_urgent: boolean // nouveau champ
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
          is_urgent?: boolean
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
          is_urgent?: boolean
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

<<<<<<< HEAD
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
=======
// Types pour les missions avec compteurs et volontaires
export interface MissionWithCounts extends Mission {
  inscriptions_count: number;
  inscriptions?: Array<{
    user_id: string;
    users: {
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
    } | null;
  }>;
}

// Pour les missions avec les détails des bénévoles inscrits
export type MissionWithVolunteers = Mission & {
  inscriptions_count: number;
>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
  inscriptions: Array<{
    user_id: string;
    users: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  }>;
<<<<<<< HEAD
}; 
=======
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

// ============================================
// TYPES POUR DISPONIBILITÉS ET COMPÉTENCES
// ============================================

// Types des jours de la semaine
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Niveau de compétence/intérêt pour un secteur
export type SectorLevel = 0 | 1 | 2 | 3; // 0=Non intéressé, 1=Débutant, 2=Intermédiaire, 3=Expert

// Interface pour les disponibilités d'un bénévole
export interface UserAvailability {
  id: number;
  user_id: string;
  preferred_days: WeekDay[];
  preferred_morning: boolean;
  preferred_afternoon: boolean;
  preferred_evening: boolean;
  max_hours_per_week?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Interface pour les indisponibilités d'un bénévole
export interface UserUnavailability {
  id: number;
  user_id: string;
  start_date: string; // Date format YYYY-MM-DD
  end_date: string;   // Date format YYYY-MM-DD
  reason?: string | null;
  created_at: string;
}

// Interface pour les préférences de secteurs
export interface UserSectorPreferences {
  id: number;
  user_id: string;
  accueil_billetterie: SectorLevel;
  projections: SectorLevel;
  technique: SectorLevel;
  restauration: SectorLevel;
  communication: SectorLevel;
  logistique: SectorLevel;
  animation: SectorLevel;
  securite: SectorLevel;
  entretien: SectorLevel;
  autre: SectorLevel;
  technical_notes?: string | null;
  experience_notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Interface complète des préférences d'un bénévole
export interface VolunteerCompleteProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: 'benevole' | 'responsable' | 'admin';
  
  // Disponibilités
  preferred_days: WeekDay[] | null;
  preferred_morning: boolean | null;
  preferred_afternoon: boolean | null;
  preferred_evening: boolean | null;
  max_hours_per_week: number | null;
  availability_notes: string | null;
  
  // Secteurs/Compétences
  accueil_billetterie: SectorLevel | null;
  projections: SectorLevel | null;
  technique: SectorLevel | null;
  restauration: SectorLevel | null;
  communication: SectorLevel | null;
  logistique: SectorLevel | null;
  animation: SectorLevel | null;
  securite: SectorLevel | null;
  entretien: SectorLevel | null;
  autre: SectorLevel | null;
  technical_notes: string | null;
  experience_notes: string | null;
}

// Types pour les formulaires
export interface AvailabilityFormData {
  preferred_days: WeekDay[];
  preferred_morning: boolean;
  preferred_afternoon: boolean;
  preferred_evening: boolean;
  max_hours_per_week?: number;
  notes?: string;
}

export interface SectorPreferencesFormData {
  accueil_billetterie: SectorLevel;
  projections: SectorLevel;
  technique: SectorLevel;
  restauration: SectorLevel;
  communication: SectorLevel;
  logistique: SectorLevel;
  animation: SectorLevel;
  securite: SectorLevel;
  entretien: SectorLevel;
  autre: SectorLevel;
  technical_notes?: string;
  experience_notes?: string;
}

export interface UnavailabilityFormData {
  start_date: string;
  end_date: string;
  reason?: string;
}

// Métadonnées pour l'affichage des secteurs
export interface SectorMetadata {
  key: keyof Omit<UserSectorPreferences, 'id' | 'user_id' | 'technical_notes' | 'experience_notes' | 'created_at' | 'updated_at'>;
  label: string;
  description: string;
  icon: string;
} 
>>>>>>> f04bd292517aef758b35a542c8acbf0c58acef3e
