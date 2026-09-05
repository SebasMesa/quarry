import { supabase } from '../supabase';
import { Profile } from '../data/types';

export async function getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data as Profile;
}

// También función para crear perfil al registrarse
export async function createProfile(profile: Omit<Profile, 'id'> & { id: string }) {
    const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();

    if (error) throw error;
    return data as Profile;
}

export async function getStats(profileId: string) {
    const { data, error } = await supabase
        .from('stats')
        .select('*')
        .eq('profile_id', profileId);

    if (error) {
        console.error('Error fetching stats:', error);
        return [];
    }
    return data;
}

export async function updateStat(statId: string, updates: Record<string, any>) {
    const { error } = await supabase
        .from('stats')
        .update(updates)
        .eq('id', statId);

    if (error) console.error('Error updating stat:', error);
}

export async function createStat(stat: Omit<import('../data/types').Stat, 'id'>) {
    const { data, error } = await supabase
        .from('stats')
        .insert(stat)
        .select()
        .single();
    if (error) throw error;
    return data as import('../data/types').Stat;
}

export async function getCompanion(profileId: string) {
    const { data, error } = await supabase
        .from('companions')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching companion:', error);
        return null;
    }
    return data;
}

export async function updateCompanion(companionId: string, updates: Record<string, any>) {
    const { data, error } = await supabase
        .from('companions')
        .update(updates)
        .eq('id', companionId)
        .select()
        .single();

    if (error) {
        console.error('Error updating companion:', error);
        return null;
    }
    return data;
}

export async function createCompanion(companion: Omit<import('../data/types').Companion, 'id'>) {
    const { data, error } = await supabase
        .from('companions')
        .insert(companion)
        .select()
        .single();
    if (error) throw error;
    return data as import('../data/types').Companion;
}