import { supabase } from '../supabase';
import type { Sector } from '../data/types';

export async function getSectors(): Promise<Sector[]> {
  const { data, error } = await supabase
    .from('sectors')
    .select('*');

  if (error) {
    console.error('Error fetching sectors from Supabase:', error);
    return [];
  }

  return data as Sector[];
}
