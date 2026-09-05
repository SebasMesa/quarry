import { supabase } from "../supabase";
import type { JournalEntry } from "../data/types";

/* ── Bitácora / Cuaderno de campo del cazador ───────────────────── */

export async function getEntries(profileId: string): Promise<JournalEntry[]> {
    try {
        const { data, error } = await supabase
            .from("journal_entries")
            .select("*")
            .eq("profile_id", profileId)
            .order("entry_date", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching journal entries:", error);
            return [];
        }
        return (data ?? []) as JournalEntry[];
    } catch (err) {
        console.error("Error in getEntries:", err);
        return [];
    }
}

export async function getEntriesByDate(profileId: string, date: string): Promise<JournalEntry[]> {
    try {
        const { data, error } = await supabase
            .from("journal_entries")
            .select("*")
            .eq("profile_id", profileId)
            .eq("entry_date", date)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching journal entries by date:", error);
            return [];
        }
        return (data ?? []) as JournalEntry[];
    } catch (err) {
        console.error("Error in getEntriesByDate:", err);
        return [];
    }
}

export async function createEntry(
    entry: Omit<JournalEntry, "id" | "created_at">,
): Promise<JournalEntry | null> {
    try {
        const { data, error } = await supabase
            .from("journal_entries")
            .insert(entry)
            .select()
            .single();

        if (error) {
            console.error("Error creating journal entry:", error);
            return null;
        }
        return data as JournalEntry;
    } catch (err) {
        console.error("Error in createEntry:", err);
        return null;
    }
}

export async function updateEntry(
    id: string,
    updates: Partial<JournalEntry>,
): Promise<JournalEntry | null> {
    try {
        const { data, error } = await supabase
            .from("journal_entries")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating journal entry:", error);
            return null;
        }
        return data as JournalEntry;
    } catch (err) {
        console.error("Error in updateEntry:", err);
        return null;
    }
}

export async function deleteEntry(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("journal_entries")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting journal entry:", error);
            return false;
        }
        return true;
    } catch (err) {
        console.error("Error in deleteEntry:", err);
        return false;
    }
}
