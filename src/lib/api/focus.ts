import { supabase } from "../supabase";
import type { FocusSession } from "../data/types";

/* ── Sector Foco: Sesiones de concentración del cazador ───────────── */

export async function getSessions(profileId: string): Promise<FocusSession[]> {
  try {
    const { data, error } = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("profile_id", profileId)
      .order("started_at", { ascending: false });

    if (error) {
      console.error("Error fetching focus sessions:", error);
      return [];
    }
    return (data ?? []) as FocusSession[];
  } catch (err) {
    console.error("Error in getSessions:", err);
    return [];
  }
}

export async function getSessionsSince(
  profileId: string,
  sinceDate: string,
): Promise<FocusSession[]> {
  try {
    const { data, error } = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("profile_id", profileId)
      .gte("started_at", sinceDate)
      .order("started_at", { ascending: false });

    if (error) {
      console.error("Error fetching focus sessions since date:", error);
      return [];
    }
    return (data ?? []) as FocusSession[];
  } catch (err) {
    console.error("Error in getSessionsSince:", err);
    return [];
  }
}

export async function createSession(
  session: Omit<FocusSession, "id" | "created_at">,
): Promise<FocusSession | null> {
  try {
    const { data, error } = await supabase
      .from("focus_sessions")
      .insert(session)
      .select()
      .single();

    if (error) {
      console.error("Error creating focus session:", error);
      return null;
    }
    return data as FocusSession;
  } catch (err) {
    console.error("Error in createSession:", err);
    return null;
  }
}
