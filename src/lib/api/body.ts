import { supabase } from "../supabase";
import type { BodyStat, Workout, PersonalRecord, DailyCheckin } from "../data/types";

/* ── Estadísticas corporales (peso, medidas, récords) ───────────── */

export async function getBodyStats(profileId: string): Promise<BodyStat[]> {
    const { data, error } = await supabase
        .from("body_stats")
        .select("*")
        .eq("profile_id", profileId)
        .order("recorded_at", { ascending: true });

    if (error) {
        console.error("Error fetching body stats:", error);
        return [];
    }
    return (data ?? []).map((row: any) => ({ ...row, value: Number(row.value) })) as BodyStat[];
}

export async function createBodyStat(
    stat: Omit<BodyStat, "id">,
): Promise<BodyStat | null> {
    const { data, error } = await supabase
        .from("body_stats")
        .insert(stat)
        .select()
        .single();

    if (error) {
        console.error("Error creating body stat:", error);
        return null;
    }
    return { ...data, value: Number(data.value) } as BodyStat;
}

/* ── Entrenamientos ──────────────────────────────────────────────── */

export async function getWorkouts(profileId: string): Promise<Workout[]> {
    const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("profile_id", profileId)
        .order("date", { ascending: false });

    if (error) {
        console.error("Error fetching workouts:", error);
        return [];
    }
    return (data ?? []) as Workout[];
}

export async function createWorkout(
    workout: Omit<Workout, "id">,
): Promise<Workout | null> {
    const { data, error } = await supabase
        .from("workouts")
        .insert(workout)
        .select()
        .single();

    if (error) {
        console.error("Error creating workout:", error);
        return null;
    }
    return data as Workout;
}

/* ── Récords personales ──────────────────────────────────────────── */

export async function getPersonalRecords(profileId: string): Promise<PersonalRecord[]> {
    const { data, error } = await supabase
        .from("personal_records")
        .select("*")
        .eq("profile_id", profileId);

    if (error) {
        console.error("Error fetching personal records:", error);
        return [];
    }
    return (data ?? []).map((row: any) => ({
        ...row,
        current: Number(row.current),
        target: Number(row.target),
    })) as PersonalRecord[];
}

export async function createPersonalRecord(
    record: Omit<PersonalRecord, "id">,
): Promise<PersonalRecord | null> {
    const { data, error } = await supabase
        .from("personal_records")
        .insert(record)
        .select()
        .single();

    if (error) {
        console.error("Error creating personal record:", error);
        return null;
    }
    return {
        ...data,
        current: Number(data.current),
        target: Number(data.target),
    } as PersonalRecord;
}

export async function updatePersonalRecord(
    id: string,
    updates: Partial<PersonalRecord>,
): Promise<PersonalRecord | null> {
    const { data, error } = await supabase
        .from("personal_records")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating personal record:", error);
        return null;
    }
    return {
        ...data,
        current: Number(data.current),
        target: Number(data.target),
    } as PersonalRecord;
}

/* ── Check-ins diarios de energía ────────────────────────────────── */

function getTodayDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export async function getTodayCheckin(profileId: string): Promise<DailyCheckin | null> {
    const today = getTodayDateString();
    const { data, error } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("profile_id", profileId)
        .eq("checkin_date", today)
        .maybeSingle();

    if (error) {
        console.error("Error fetching today checkin:", error);
        return null;
    }
    if (!data) return null;
    return {
        ...data,
        energy_level: Number(data.energy_level),
        sleep_hours: data.sleep_hours != null ? Number(data.sleep_hours) : null,
    } as DailyCheckin;
}

export async function getRecentCheckins(profileId: string, days = 14): Promise<DailyCheckin[]> {
    const { data, error } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("profile_id", profileId)
        .order("checkin_date", { ascending: false })
        .limit(days);

    if (error) {
        console.error("Error fetching recent checkins:", error);
        return [];
    }
    return (data ?? []).map((row: any) => ({
        ...row,
        energy_level: Number(row.energy_level),
        sleep_hours: row.sleep_hours != null ? Number(row.sleep_hours) : null,
    })) as DailyCheckin[];
}

export async function upsertCheckin(
    profileId: string,
    checkin: {
        energy_level: number;
        mood?: string | null;
        sleep_hours?: number | null;
        checkin_date?: string;
    },
): Promise<DailyCheckin | null> {
    const today = checkin.checkin_date || getTodayDateString();
    const payload = {
        profile_id: profileId,
        checkin_date: today,
        energy_level: checkin.energy_level,
        mood: checkin.mood ?? null,
        sleep_hours: checkin.sleep_hours != null ? Number(checkin.sleep_hours) : null,
    };

    const { data, error } = await supabase
        .from("daily_checkins")
        .upsert(payload, { onConflict: "profile_id,checkin_date" })
        .select()
        .single();

    if (error) {
        console.error("Error upserting daily checkin:", error);
        return null;
    }

    return {
        ...data,
        energy_level: Number(data.energy_level),
        sleep_hours: data.sleep_hours != null ? Number(data.sleep_hours) : null,
    } as DailyCheckin;
}