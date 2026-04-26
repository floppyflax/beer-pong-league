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
      achievements: {
        Row: {
          created_at: string
          description: string
          icon_key: string
          label: string
          slug: string
        }
        Insert: {
          created_at?: string
          description: string
          icon_key?: string
          label: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string
          icon_key?: string
          label?: string
          slug?: string
        }
        Relationships: []
      }
      elo_history: {
        Row: {
          created_at: string | null
          elo_after: number
          elo_before: number
          elo_change: number
          id: string
          league_id: string | null
          match_id: string
          player_id: string | null
          event_id: string | null
        }
        Insert: {
          created_at?: string | null
          elo_after: number
          elo_before: number
          elo_change: number
          id?: string
          league_id?: string | null
          match_id: string
          player_id?: string | null
          event_id?: string | null
        }
        Update: {
          created_at?: string | null
          elo_after?: number
          elo_before?: number
          elo_change?: number
          id?: string
          league_id?: string | null
          match_id?: string
          player_id?: string | null
          event_id?: string | null
        }
        Relationships: [
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
            foreignKeyName: "elo_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elo_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      league_memberships: {
        Row: {
          archived_at: string | null
          elo: number
          id: string
          joined_at: string
          league_id: string
          losses: number
          matches_played: number
          player_id: string
          pseudo_override: string | null
          streak: number
          wins: number
        }
        Insert: {
          archived_at?: string | null
          elo?: number
          id?: string
          joined_at?: string
          league_id: string
          losses?: number
          matches_played?: number
          player_id: string
          pseudo_override?: string | null
          streak?: number
          wins?: number
        }
        Update: {
          archived_at?: string | null
          elo?: number
          id?: string
          joined_at?: string
          league_id?: string
          losses?: number
          matches_played?: number
          player_id?: string
          pseudo_override?: string | null
          streak?: number
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_memberships_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_memberships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          anti_cheat_enabled: boolean
          created_at: string | null
          creator_user_id: string | null
          id: string
          join_code: string | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          anti_cheat_enabled?: boolean
          created_at?: string | null
          creator_user_id?: string | null
          id?: string
          join_code?: string | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          anti_cheat_enabled?: boolean
          created_at?: string | null
          creator_user_id?: string | null
          id?: string
          join_code?: string | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
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
          balloon_possession: string | null
          created_at: string | null
          created_by_user_id: string | null
          cups_remaining: number | null
          format: string
          id: string
          is_live: boolean
          is_match_point: boolean
          is_ranked: boolean | null
          league_id: string | null
          photo_url: string | null
          score_a: number
          score_b: number
          status: string | null
          team_a_player_ids: string[]
          team_b_player_ids: string[]
          event_id: string | null
        }
        Insert: {
          balloon_possession?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          cups_remaining?: number | null
          format: string
          id?: string
          is_live?: boolean
          is_match_point?: boolean
          is_ranked?: boolean | null
          league_id?: string | null
          photo_url?: string | null
          score_a: number
          score_b: number
          status?: string | null
          team_a_player_ids: string[]
          team_b_player_ids: string[]
          event_id?: string | null
        }
        Update: {
          balloon_possession?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          cups_remaining?: number | null
          format?: string
          id?: string
          is_live?: boolean
          is_match_point?: boolean
          is_ranked?: boolean | null
          league_id?: string | null
          photo_url?: string | null
          score_a?: number
          score_b?: number
          status?: string | null
          team_a_player_ids?: string[]
          team_b_player_ids?: string[]
          event_id?: string | null
        }
        Relationships: [
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
            foreignKeyName: "matches_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      player_achievements: {
        Row: {
          achievement_slug: string
          earned_at: string
          id: string
          player_id: string
        }
        Insert: {
          achievement_slug: string
          earned_at?: string
          id?: string
          player_id: string
        }
        Update: {
          achievement_slug?: string
          earned_at?: string
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_achievements_achievement_slug_fkey"
            columns: ["achievement_slug"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["slug"]
          },
        ]
      }
      players: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          id: string
          pseudo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          pseudo: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          pseudo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_memberships: {
        Row: {
          archived_at: string | null
          id: string
          joined_at: string
          player_id: string
          pseudo_override: string | null
          event_id: string
        }
        Insert: {
          archived_at?: string | null
          id?: string
          joined_at?: string
          player_id: string
          pseudo_override?: string | null
          event_id: string
        }
        Update: {
          archived_at?: string | null
          id?: string
          joined_at?: string
          player_id?: string
          pseudo_override?: string | null
          event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_memberships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_memberships_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          creator_user_id: string | null
          date: string
          format: string | null
          format_type: string | null
          id: string
          is_finished: boolean | null
          is_private: boolean | null
          join_code: string | null
          league_id: string | null
          location: string | null
          max_players: number | null
          mode: string
          name: string
          status: string | null
          team1_size: number | null
          team2_size: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_user_id?: string | null
          date: string
          format?: string | null
          format_type?: string | null
          id?: string
          is_finished?: boolean | null
          is_private?: boolean | null
          join_code?: string | null
          league_id?: string | null
          location?: string | null
          max_players?: number | null
          mode?: string
          name: string
          status?: string | null
          team1_size?: number | null
          team2_size?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_user_id?: string | null
          date?: string
          format?: string | null
          format_type?: string | null
          id?: string
          is_finished?: boolean | null
          is_private?: boolean | null
          join_code?: string | null
          league_id?: string | null
          location?: string | null
          max_players?: number | null
          mode?: string
          name?: string
          status?: string | null
          team1_size?: number | null
          team2_size?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string | null
          device_fingerprint: string | null
          id: string
          is_anonymous: boolean
          is_premium: boolean | null
          pseudo: string
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          id: string
          is_anonymous?: boolean
          is_premium?: boolean | null
          pseudo: string
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          is_anonymous?: boolean
          is_premium?: boolean | null
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
      claim_player: { Args: { p_player_id: string }; Returns: Json }
      link_anonymous_to_auth: {
        Args: { p_anonymous_user_id: string }
        Returns: Json
      }
      users_is_caller: { Args: { p_user_id: string }; Returns: boolean }
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
