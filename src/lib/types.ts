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
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          accepts_contact_sharing?: boolean
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          accepts_contact_sharing?: boolean
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
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

// Pour enrichir les missions avec le nombre d'inscrits
export type MissionWithCounts = Mission & {
  inscriptions_count: number;
}; 