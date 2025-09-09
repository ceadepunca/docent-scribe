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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      administrative_positions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "administrative_positions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          antiguedad_docente_score: number | null
          antiguedad_titulo_score: number | null
          becas_otros_score: number | null
          concepto_score: number | null
          concurso_score: number | null
          created_at: string
          evaluator_id: string
          id: string
          inscription_id: string
          notes: string | null
          otros_antecedentes_score: number | null
          position_selection_id: string | null
          promedio_titulo_score: number | null
          red_federal_score: number | null
          status: string | null
          subject_selection_id: string | null
          title_type: string | null
          titulo_score: number | null
          total_score: number | null
          trabajo_publico_score: number | null
          updated_at: string
        }
        Insert: {
          antiguedad_docente_score?: number | null
          antiguedad_titulo_score?: number | null
          becas_otros_score?: number | null
          concepto_score?: number | null
          concurso_score?: number | null
          created_at?: string
          evaluator_id: string
          id?: string
          inscription_id: string
          notes?: string | null
          otros_antecedentes_score?: number | null
          position_selection_id?: string | null
          promedio_titulo_score?: number | null
          red_federal_score?: number | null
          status?: string | null
          subject_selection_id?: string | null
          title_type?: string | null
          titulo_score?: number | null
          total_score?: number | null
          trabajo_publico_score?: number | null
          updated_at?: string
        }
        Update: {
          antiguedad_docente_score?: number | null
          antiguedad_titulo_score?: number | null
          becas_otros_score?: number | null
          concepto_score?: number | null
          concurso_score?: number | null
          created_at?: string
          evaluator_id?: string
          id?: string
          inscription_id?: string
          notes?: string | null
          otros_antecedentes_score?: number | null
          position_selection_id?: string | null
          promedio_titulo_score?: number | null
          red_federal_score?: number | null
          status?: string | null
          subject_selection_id?: string | null
          title_type?: string | null
          titulo_score?: number | null
          total_score?: number | null
          trabajo_publico_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_position_selection_id_fkey"
            columns: ["position_selection_id"]
            isOneToOne: false
            referencedRelation: "inscription_position_selections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_subject_selection_id_fkey"
            columns: ["subject_selection_id"]
            isOneToOne: false
            referencedRelation: "inscription_subject_selections"
            referencedColumns: ["id"]
          },
        ]
      }
      inscription_deletion_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          inscription_id: string
          reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          inscription_id: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          inscription_id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscription_deletion_requests_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      inscription_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_url: string
          id: string
          inscription_id: string
          uploaded_at: string
        }
        Insert: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_url: string
          id?: string
          inscription_id: string
          uploaded_at?: string
        }
        Update: {
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_url?: string
          id?: string
          inscription_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscription_documents_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      inscription_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          inscription_id: string
          new_status: Database["public"]["Enums"]["inscription_status"]
          notes: string | null
          previous_status:
            | Database["public"]["Enums"]["inscription_status"]
            | null
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          inscription_id: string
          new_status: Database["public"]["Enums"]["inscription_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["inscription_status"]
            | null
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          inscription_id?: string
          new_status?: Database["public"]["Enums"]["inscription_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["inscription_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "inscription_history_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      inscription_periods: {
        Row: {
          available_levels: Database["public"]["Enums"]["teaching_level_enum"][]
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          available_levels: Database["public"]["Enums"]["teaching_level_enum"][]
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          available_levels?: Database["public"]["Enums"]["teaching_level_enum"][]
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      inscription_position_selections: {
        Row: {
          administrative_position_id: string
          created_at: string
          id: string
          inscription_id: string
        }
        Insert: {
          administrative_position_id: string
          created_at?: string
          id?: string
          inscription_id: string
        }
        Update: {
          administrative_position_id?: string
          created_at?: string
          id?: string
          inscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscription_position_selections_administrative_position_id_fkey"
            columns: ["administrative_position_id"]
            isOneToOne: false
            referencedRelation: "administrative_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscription_position_selections_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      inscription_subject_selections: {
        Row: {
          created_at: string
          id: string
          inscription_id: string
          position_type: string
          subject_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inscription_id: string
          position_type: string
          subject_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inscription_id?: string
          position_type?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscription_subject_selections_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscription_subject_selections_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      inscriptions: {
        Row: {
          availability: string | null
          created_at: string
          experience_years: number
          id: string
          inscription_period_id: string
          motivational_letter: string | null
          status: Database["public"]["Enums"]["inscription_status"]
          subject_area: string
          target_position_type_id: string | null
          teaching_level: Database["public"]["Enums"]["teaching_level_enum"]
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          experience_years?: number
          id?: string
          inscription_period_id: string
          motivational_letter?: string | null
          status?: Database["public"]["Enums"]["inscription_status"]
          subject_area: string
          target_position_type_id?: string | null
          teaching_level: Database["public"]["Enums"]["teaching_level_enum"]
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          experience_years?: number
          id?: string
          inscription_period_id?: string
          motivational_letter?: string | null
          status?: Database["public"]["Enums"]["inscription_status"]
          subject_area?: string
          target_position_type_id?: string | null
          teaching_level?: Database["public"]["Enums"]["teaching_level_enum"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inscriptions_user_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_inscription_period_id_fkey"
            columns: ["inscription_period_id"]
            isOneToOne: false
            referencedRelation: "inscription_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_target_position_type_id_fkey"
            columns: ["target_position_type_id"]
            isOneToOne: false
            referencedRelation: "position_types"
            referencedColumns: ["id"]
          },
        ]
      }
      position_types: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          teaching_level: Database["public"]["Enums"]["teaching_level_enum"]
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          teaching_level: Database["public"]["Enums"]["teaching_level_enum"]
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          teaching_level?: Database["public"]["Enums"]["teaching_level_enum"]
        }
        Relationships: []
      }
      profile_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_url: string
          id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_url: string
          id?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_url?: string
          id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          data_complete: boolean | null
          dni: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          legajo_number: string | null
          migrated: boolean | null
          phone: string | null
          titulo_1_fecha_egreso: string | null
          titulo_1_nombre: string | null
          titulo_1_promedio: number | null
          titulo_2_fecha_egreso: string | null
          titulo_2_nombre: string | null
          titulo_2_promedio: number | null
          titulo_3_fecha_egreso: string | null
          titulo_3_nombre: string | null
          titulo_3_promedio: number | null
          titulo_4_fecha_egreso: string | null
          titulo_4_nombre: string | null
          titulo_4_promedio: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_complete?: boolean | null
          dni?: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          legajo_number?: string | null
          migrated?: boolean | null
          phone?: string | null
          titulo_1_fecha_egreso?: string | null
          titulo_1_nombre?: string | null
          titulo_1_promedio?: number | null
          titulo_2_fecha_egreso?: string | null
          titulo_2_nombre?: string | null
          titulo_2_promedio?: number | null
          titulo_3_fecha_egreso?: string | null
          titulo_3_nombre?: string | null
          titulo_3_promedio?: number | null
          titulo_4_fecha_egreso?: string | null
          titulo_4_nombre?: string | null
          titulo_4_promedio?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_complete?: boolean | null
          dni?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          legajo_number?: string | null
          migrated?: boolean | null
          phone?: string | null
          titulo_1_fecha_egreso?: string | null
          titulo_1_nombre?: string | null
          titulo_1_promedio?: number | null
          titulo_2_fecha_egreso?: string | null
          titulo_2_nombre?: string | null
          titulo_2_promedio?: number | null
          titulo_3_fecha_egreso?: string | null
          titulo_3_nombre?: string | null
          titulo_3_promedio?: number | null
          titulo_4_fecha_egreso?: string | null
          titulo_4_nombre?: string | null
          titulo_4_promedio?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      schools: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          teaching_level: Database["public"]["Enums"]["teaching_level_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          teaching_level: Database["public"]["Enums"]["teaching_level_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          teaching_level?: Database["public"]["Enums"]["teaching_level_enum"]
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_registrations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          legajo_code: string
          position_type_id: string
          registration_date: string
          teaching_level: Database["public"]["Enums"]["teaching_level_enum"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          legajo_code: string
          position_type_id: string
          registration_date?: string
          teaching_level: Database["public"]["Enums"]["teaching_level_enum"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          legajo_code?: string
          position_type_id?: string
          registration_date?: string
          teaching_level?: Database["public"]["Enums"]["teaching_level_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_registrations_position_type_id_fkey"
            columns: ["position_type_id"]
            isOneToOne: false
            referencedRelation: "position_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_legajo_code: {
        Args: {
          p_position_type_code: string
          p_teaching_level: Database["public"]["Enums"]["teaching_level_enum"]
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_profile_completeness: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "evaluator" | "docente"
      document_type:
        | "cv"
        | "certificates"
        | "diplomas"
        | "recommendations"
        | "other"
        | "dni_frente"
        | "dni_dorso"
        | "titulo_pdf"
      inscription_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "requires_changes"
      position_type_enum:
        | "maestra_sala"
        | "maestro_grado"
        | "profesor"
        | "profesor_especial"
      teaching_level_enum: "inicial" | "primario" | "secundario"
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
    Enums: {
      app_role: ["super_admin", "evaluator", "docente"],
      document_type: [
        "cv",
        "certificates",
        "diplomas",
        "recommendations",
        "other",
        "dni_frente",
        "dni_dorso",
        "titulo_pdf",
      ],
      inscription_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "requires_changes",
      ],
      position_type_enum: [
        "maestra_sala",
        "maestro_grado",
        "profesor",
        "profesor_especial",
      ],
      teaching_level_enum: ["inicial", "primario", "secundario"],
    },
  },
} as const
