export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      anonymous_users: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          id: string
          merged_at: string | null
          merged_to_user_id: string | null
          pseudo: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          merged_at?: string | null
          merged_to_user_id?: string | null
          pseudo: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          merged_at?: string | null
          merged_to_user_id?: string | null
          pseudo?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_users_merged_to_user_id_fkey"
            columns: ["merged_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      elo_history: {
        Row: {
          anonymous_user_id: string | null
          created_at: string | null
          elo_after: number
          elo_before: number
          elo_change: number
          id: string
          league_id: string | null
          match_id: string
          tournament_id: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_user_id?: string | null
          created_at?: string | null
          elo_after: number
          elo_before: number
          elo_change: number
          id?: string
          league_id?: string | null
          match_id: string
          tournament_id?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_user_id?: string | null
          created_at?: string | null
          elo_after?: number
          elo_before?: number
          elo_change?: number
          id?: string
          league_id?: string | null
          match_id?: string
          tournament_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elo_history_anonymous_user_id_fkey"
            columns: ["anonymous_user_id"]
            isOneToOne: false
            referencedRelation: "anonymous_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elo_history_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elo_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elo_history_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elo_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      league_players: {
        Row: {
          anonymous_user_id: string | null
          id: string
          joined_at: string | null
          league_id: string
          pseudo_in_league: string
          user_id: string | null
        }
        Insert: {
          anonymous_user_id?: string | null
          id?: string
          joined_at?: string | null
          league_id: string
          pseudo_in_league: string
          user_id?: string | null
        }
        Update: {
          anonymous_user_id?: string | null
          id?: string
          joined_at?: string | null
          league_id?: string
          pseudo_in_league?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "league_players_anonymous_user_id_fkey"
            columns: ["anonymous_user_id"]
            isOneToOne: false
            referencedRelation: "anonymous_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_players_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string | null
          creator_anonymous_user_id: string | null
          creator_user_id: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_anonymous_user_id?: string | null
          creator_user_id?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_anonymous_user_id?: string | null
          creator_user_id?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leagues_creator_anonymous_user_id_fkey"
            columns: ["creator_anonymous_user_id"]
            isOneToOne: false
            referencedRelation: "anonymous_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leagues_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          created_by_anonymous_user_id: string | null
          created_by_user_id: string | null
          format: string
          id: string
          is_ranked: boolean | null
          league_id: string | null
          score_a: number
          score_b: number
          team_a_player_ids: string[]
          team_b_player_ids: string[]
          tournament_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_anonymous_user_id?: string | null
          created_by_user_id?: string | null
          format: string
          id?: string
          is_ranked?: boolean | null
          league_id?: string | null
          score_a: number
          score_b: number
          team_a_player_ids: string[]
          team_b_player_ids: string[]
          tournament_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_anonymous_user_id?: string | null
          created_by_user_id?: string | null
          format?: string
          id?: string
          is_ranked?: boolean | null
          league_id?: string | null
          score_a?: number
          score_b?: number
          team_a_player_ids?: string[]
          team_b_player_ids?: string[]
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_created_by_anonymous_user_id_fkey"
            columns: ["created_by_anonymous_user_id"]
            isOneToOne: false
            referencedRelation: "anonymous_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_players: {
        Row: {
          anonymous_user_id: string | null
          id: string
          joined_at: string | null
          pseudo_in_tournament: string
          tournament_id: string
          user_id: string | null
        }
        Insert: {
          anonymous_user_id?: string | null
          id?: string
          joined_at?: string | null
          pseudo_in_tournament: string
          tournament_id: string
          user_id?: string | null
        }
        Update: {
          anonymous_user_id?: string | null
          id?: string
          joined_at?: string | null
          pseudo_in_tournament?: string
          tournament_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_players_anonymous_user_id_fkey"
            columns: ["anonymous_user_id"]
            isOneToOne: false
            referencedRelation: "anonymous_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_players_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string | null
          creator_anonymous_user_id: string | null
          creator_user_id: string | null
          date: string
          id: string
          is_finished: boolean | null
          league_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_anonymous_user_id?: string | null
          creator_user_id?: string | null
          date: string
          id?: string
          is_finished?: boolean | null
          league_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_anonymous_user_id?: string | null
          creator_user_id?: string | null
          date?: string
          id?: string
          is_finished?: boolean | null
          league_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_creator_anonymous_user_id_fkey"
            columns: ["creator_anonymous_user_id"]
            isOneToOne: false
            referencedRelation: "anonymous_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_identity_merges: {
        Row: {
          anonymous_user_id: string
          id: string
          merged_at: string | null
          stats_migrated: boolean | null
          user_id: string
        }
        Insert: {
          anonymous_user_id: string
          id?: string
          merged_at?: string | null
          stats_migrated?: boolean | null
          user_id: string
        }
        Update: {
          anonymous_user_id?: string
          id?: string
          merged_at?: string | null
          stats_migrated?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_identity_merges_anonymous_user_id_fkey"
            columns: ["anonymous_user_id"]
            isOneToOne: false
            referencedRelation: "anonymous_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_identity_merges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          pseudo: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          pseudo: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          pseudo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const



