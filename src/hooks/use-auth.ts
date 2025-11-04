// src/hooks/use-auth.ts
import { useAuth as useAuthContext } from "@/contexts/SupabaseAuthContext";

export function useAuth() {
  return useAuthContext();
}