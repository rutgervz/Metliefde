/**
 * Placeholder voor Supabase database-types. In Stap 4 vervangen we dit door
 * gegenereerde types via de Supabase CLI (`supabase gen types typescript`).
 *
 * De structuur hier volgt de Supabase-conventie zodat de SSR-clients correct
 * typen. Zolang we nog niet alle tabellen hebben ingetypt, werken we op basis
 * van de subset die de auth-laag nodig heeft.
 */

export type UserRole = "eigenaar" | "boekhouder" | "kijker";

export type UsersRow = {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type UsersInsert = {
  id: string;
  email: string;
  display_name: string;
  role?: UserRole;
  active?: boolean;
};

export type UsersUpdate = Partial<{
  email: string;
  display_name: string;
  role: UserRole;
  active: boolean;
}>;

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UsersRow;
        Insert: UsersInsert;
        Update: UsersUpdate;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
