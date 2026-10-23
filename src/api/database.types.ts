export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      cat_foods: {
        Row: {
          cat_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          kcal_per_100g: number | null;
          kind: Database['public']['Enums']['food_kind'];
          name: string;
          updated_at: string;
        };
        Insert: {
          cat_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kcal_per_100g?: number | null;
          kind?: Database['public']['Enums']['food_kind'];
          name: string;
          updated_at?: string;
        };
        Update: {
          cat_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kcal_per_100g?: number | null;
          kind?: Database['public']['Enums']['food_kind'];
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cat_foods_cat_id_fkey';
            columns: ['cat_id'];
            isOneToOne: false;
            referencedRelation: 'cats';
            referencedColumns: ['id'];
          },
        ];
      };
      cat_members: {
        Row: {
          cat_id: string;
          created_at: string;
          role: Database['public']['Enums']['cat_member_role'];
          user_id: string;
        };
        Insert: {
          cat_id: string;
          created_at?: string;
          role: Database['public']['Enums']['cat_member_role'];
          user_id: string;
        };
        Update: {
          cat_id?: string;
          created_at?: string;
          role?: Database['public']['Enums']['cat_member_role'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cat_members_cat_id_fkey';
            columns: ['cat_id'];
            isOneToOne: false;
            referencedRelation: 'cats';
            referencedColumns: ['id'];
          },
        ];
      };
      cats: {
        Row: {
          archived_at: string | null;
          birth_date: string | null;
          breed: string | null;
          chip_number: string | null;
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          photo_path: string | null;
          sex: Database['public']['Enums']['cat_sex'];
          sterilized: boolean | null;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          birth_date?: string | null;
          breed?: string | null;
          chip_number?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          name: string;
          photo_path?: string | null;
          sex?: Database['public']['Enums']['cat_sex'];
          sterilized?: boolean | null;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          birth_date?: string | null;
          breed?: string | null;
          chip_number?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          photo_path?: string | null;
          sex?: Database['public']['Enums']['cat_sex'];
          sterilized?: boolean | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      feeding_schedule: {
        Row: {
          amount_grams: number | null;
          cat_id: string;
          created_at: string;
          created_by: string;
          days_of_week: number[];
          enabled: boolean;
          food_id: string | null;
          food_name: string | null;
          id: string;
          time_of_day: string;
          updated_at: string;
        };
        Insert: {
          amount_grams?: number | null;
          cat_id: string;
          created_at?: string;
          created_by?: string;
          days_of_week?: number[];
          enabled?: boolean;
          food_id?: string | null;
          food_name?: string | null;
          id?: string;
          time_of_day: string;
          updated_at?: string;
        };
        Update: {
          amount_grams?: number | null;
          cat_id?: string;
          created_at?: string;
          created_by?: string;
          days_of_week?: number[];
          enabled?: boolean;
          food_id?: string | null;
          food_name?: string | null;
          id?: string;
          time_of_day?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feeding_schedule_food_id_cat_id_fkey';
            columns: ['food_id', 'cat_id'];
            isOneToOne: false;
            referencedRelation: 'cat_foods';
            referencedColumns: ['id', 'cat_id'];
          },
          {
            foreignKeyName: 'feeding_schedule_cat_id_fkey';
            columns: ['cat_id'];
            isOneToOne: false;
            referencedRelation: 'cats';
            referencedColumns: ['id'];
          },
        ];
      };
      litter_events: {
        Row: {
          cat_id: string;
          created_at: string;
          created_by: string;
          id: string;
          kind: Database['public']['Enums']['litter_kind'];
          note: string | null;
          occurred_at: string;
        };
        Insert: {
          cat_id: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          kind: Database['public']['Enums']['litter_kind'];
          note?: string | null;
          occurred_at?: string;
        };
        Update: {
          cat_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          kind?: Database['public']['Enums']['litter_kind'];
          note?: string | null;
          occurred_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'litter_events_cat_id_fkey';
            columns: ['cat_id'];
            isOneToOne: false;
            referencedRelation: 'cats';
            referencedColumns: ['id'];
          },
        ];
      };
      meals: {
        Row: {
          amount_grams: number | null;
          cat_id: string;
          created_at: string;
          created_by: string;
          fed_at: string;
          food_id: string | null;
          food_name: string | null;
          id: string;
          note: string | null;
          schedule_id: string | null;
        };
        Insert: {
          amount_grams?: number | null;
          cat_id: string;
          created_at?: string;
          created_by?: string;
          fed_at?: string;
          food_id?: string | null;
          food_name?: string | null;
          id?: string;
          note?: string | null;
          schedule_id?: string | null;
        };
        Update: {
          amount_grams?: number | null;
          cat_id?: string;
          created_at?: string;
          created_by?: string;
          fed_at?: string;
          food_id?: string | null;
          food_name?: string | null;
          id?: string;
          note?: string | null;
          schedule_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'meals_food_id_cat_id_fkey';
            columns: ['food_id', 'cat_id'];
            isOneToOne: false;
            referencedRelation: 'cat_foods';
            referencedColumns: ['id', 'cat_id'];
          },
          {
            foreignKeyName: 'meals_schedule_id_cat_id_fkey';
            columns: ['schedule_id', 'cat_id'];
            isOneToOne: false;
            referencedRelation: 'feeding_schedule';
            referencedColumns: ['id', 'cat_id'];
          },
          {
            foreignKeyName: 'meals_cat_id_fkey';
            columns: ['cat_id'];
            isOneToOne: false;
            referencedRelation: 'cats';
            referencedColumns: ['id'];
          },
        ];
      };
      notes: {
        Row: {
          body: string;
          cat_id: string;
          created_at: string;
          created_by: string;
          id: string;
          noted_at: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          cat_id: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          noted_at?: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          cat_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          noted_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_cat_id_fkey';
            columns: ['cat_id'];
            isOneToOne: false;
            referencedRelation: 'cats';
            referencedColumns: ['id'];
          },
        ];
      };
      photos: {
        Row: {
          caption: string | null;
          cat_id: string;
          created_at: string;
          created_by: string;
          id: string;
          mood: string | null;
          mood_caption: string | null;
          storage_path: string;
          taken_at: string;
        };
        Insert: {
          caption?: string | null;
          cat_id: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          mood?: string | null;
          mood_caption?: string | null;
          storage_path: string;
          taken_at?: string;
        };
        Update: {
          caption?: string | null;
          cat_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          mood?: string | null;
          mood_caption?: string | null;
          storage_path?: string;
          taken_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'photos_cat_id_fkey';
            columns: ['cat_id'];
            isOneToOne: false;
            referencedRelation: 'cats';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          is_plus: boolean;
          language: string | null;
          theme: Database['public']['Enums']['theme_preference'];
          updated_at: string;
          weight_unit: Database['public']['Enums']['weight_unit'];
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          is_plus?: boolean;
          language?: string | null;
          theme?: Database['public']['Enums']['theme_preference'];
          updated_at?: string;
          weight_unit?: Database['public']['Enums']['weight_unit'];
        };
        Update: {
          avatar_path?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_plus?: boolean;
          language?: string | null;
          theme?: Database['public']['Enums']['theme_preference'];
          updated_at?: string;
          weight_unit?: Database['public']['Enums']['weight_unit'];
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          cat_id: string;
          created_at: string;
          created_by: string;
          enabled: boolean;
          id: string;
          last_done_at: string | null;
          last_done_by: string | null;
          repeat_rule: string | null;
          starts_at: string;
          title: string | null;
          type: Database['public']['Enums']['reminder_type'];
          updated_at: string;
          vet_event_id: string | null;
        };
        Insert: {
          cat_id: string;
          created_at?: string;
          created_by?: string;
          enabled?: boolean;
          id?: string;
          last_done_at?: string | null;
          last_done_by?: string | null;
          repeat_rule?: string | null;
          starts_at: string;
          title?: string | null;
          type: Database['public']['Enums']['reminder_type'];
          updated_at?: string;
          vet_event_id?: string | null;
        };
        Update: {
          cat_id?: string;
          created_at?: string;
          created_by?: string;
          enabled?: boolean;
          id?: string;
          last_done_at?: string | null;
          last_done_by?: string | null;
          repeat_rule?: string | null;
          starts_at?: string;
          title?: string | null;
          type?: Database['public']['Enums']['reminder_type'];
          updated_at?: string;
          vet_event_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reminders_cat_id_fkey';
            columns: ['cat_id'];
            isOneToOne: false;
            referencedRelation: 'cats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reminders_vet_event_id_fkey';
            columns: ['vet_event_id'];
            isOneToOne: false;
            referencedRelation: 'vet_events';
            referencedColumns: ['id'];
          },
        ];
      };
      vet_events: {
        Row: {
          cat_id: string;
          clinic: string | null;
          created_at: string;
          created_by: string;
          id: string;
          next_due_on: string | null;
          note: string | null;
          occurred_on: string;
          title: string | null;
          type: Database['public']['Enums']['vet_event_type'];
          updated_at: string;
        };
        Insert: {
          cat_id: string;
          clinic?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          next_due_on?: string | null;
          note?: string | null;
          occurred_on: string;
          title?: string | null;
          type: Database['public']['Enums']['vet_event_type'];
          updated_at?: string;
        };
        Update: {
          cat_id?: string;
          clinic?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          next_due_on?: string | null;
          note?: string | null;
          occurred_on?: string;
          title?: string | null;
          type?: Database['public']['Enums']['vet_event_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vet_events_cat_id_fkey';
            columns: ['cat_id'];
            isOneToOne: false;
            referencedRelation: 'cats';
            referencedColumns: ['id'];
          },
        ];
      };
      weights: {
        Row: {
          cat_id: string;
          created_at: string;
          created_by: string;
          id: string;
          measured_at: string;
          note: string | null;
          weight_grams: number;
        };
        Insert: {
          cat_id: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          measured_at?: string;
          note?: string | null;
          weight_grams: number;
        };
        Update: {
          cat_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          measured_at?: string;
          note?: string | null;
          weight_grams?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'weights_cat_id_fkey';
            columns: ['cat_id'];
            isOneToOne: false;
            referencedRelation: 'cats';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      storage_cat_id: { Args: { object_name: string }; Returns: string };
    };
    Enums: {
      cat_member_role: 'owner' | 'family';
      cat_sex: 'male' | 'female' | 'unknown';
      food_kind: 'dry' | 'wet' | 'treat' | 'other';
      litter_kind: 'pee' | 'poop' | 'both';
      reminder_type: 'feeding' | 'medication' | 'vaccination' | 'vet_visit' | 'custom';
      theme_preference: 'system' | 'light' | 'dark';
      vet_event_type: 'vaccination' | 'deworming' | 'flea_tick' | 'visit' | 'other';
      weight_unit: 'kg' | 'lb';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      cat_member_role: ['owner', 'family'],
      cat_sex: ['male', 'female', 'unknown'],
      food_kind: ['dry', 'wet', 'treat', 'other'],
      litter_kind: ['pee', 'poop', 'both'],
      reminder_type: ['feeding', 'medication', 'vaccination', 'vet_visit', 'custom'],
      theme_preference: ['system', 'light', 'dark'],
      vet_event_type: ['vaccination', 'deworming', 'flea_tick', 'visit', 'other'],
      weight_unit: ['kg', 'lb'],
    },
  },
} as const;
