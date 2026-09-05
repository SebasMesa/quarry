import { supabase } from "@/lib/supabase";
import type { Achievement } from "@/lib/data/types";

export async function getAchievements(profileId: string): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error fetching achievements:", error);
    return [];
  }

  return (data || []) as Achievement[];
}

export async function unlockAchievement(
  profileId: string,
  achievementKey: string,
  meta: { title: string; description: string }
): Promise<Achievement | null> {
  const now = new Date().toISOString();

  // Comprobar si ya existe fila para este perfil y key
  const { data: existing, error: findErr } = await supabase
    .from("achievements")
    .select("*")
    .eq("profile_id", profileId)
    .eq("key", achievementKey)
    .maybeSingle();

  if (findErr) {
    console.error("Error checking achievement:", findErr);
  }

  if (existing) {
    if (existing.unlocked_at) {
      return existing as Achievement;
    }

    const { data, error } = await supabase
      .from("achievements")
      .update({
        unlocked_at: now,
        title: meta.title,
        description: meta.description,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error("Error unlocking achievement:", error);
      return null;
    }
    return data as Achievement;
  } else {
    const { data, error } = await supabase
      .from("achievements")
      .insert({
        profile_id: profileId,
        key: achievementKey,
        title: meta.title,
        description: meta.description,
        unlocked_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating and unlocking achievement:", error);
      return null;
    }
    return data as Achievement;
  }
}
