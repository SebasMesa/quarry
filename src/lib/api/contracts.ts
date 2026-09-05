import { supabase } from '../supabase';
import type { Contract } from '../data/types';

// Obtener todos los contratos del cazador activo
export async function getContracts(profileId: string): Promise<Contract[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('profile_id', profileId)
        .order('due_date', { ascending: true }); // Ordenados por fecha de vencimiento

    if (error) {
        console.error('Error fetching contracts:', error);
        throw error;
    }

    return data as Contract[];
}

// Crear un nuevo contrato (asignar una misión)
export async function createContract(
    contract: Omit<Contract, 'id' | 'created_at' | 'completed_at' | 'reward_credits' | 'is_financial' | 'status' | 'streak_count'> & {
        reward_credits?: number;
        is_financial?: boolean;
        status?: Contract["status"];
        streak_count?: number;
    }
): Promise<Contract> {
    const { data, error } = await supabase
        .from('contracts')
        .insert({
            status: "pendiente",
            streak_count: 0,
            ...contract,
            reward_credits: contract.reward_credits ?? 0,
            is_financial: contract.is_financial ?? false,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating contract:', error);
        throw error;
    }

    return data as Contract;
}

// Actualizar un contrato (ej: marcar como completado, cambiar estado)
export async function updateContract(
    contractId: string,
    updates: Partial<Contract>
): Promise<Contract> {
    const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', contractId)
        .select()
        .single();

    if (error) {
        console.error('Error updating contract:', error);
        throw error;
    }

    return data as Contract;
}

// Eliminar un contrato (borrar del registro)
export async function deleteContract(contractId: string): Promise<void> {
    const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId);

    if (error) {
        console.error('Error deleting contract:', error);
        throw error;
    }
}

// Obtener logs de rutinas por contratos
export async function getRoutineLogs(profileId: string, contractIds: string[]): Promise<Record<string, string[]>> {
    if (!contractIds.length) return {};
    const { data, error } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('profile_id', profileId)
        .eq('completed', true)
        .in('contract_id', contractIds);

    if (error) {
        console.error('Error fetching routine logs:', error);
        return {};
    }

    const map: Record<string, string[]> = {};
    for (const row of data ?? []) {
        if (!map[row.contract_id]) map[row.contract_id] = [];
        map[row.contract_id].push(row.log_date);
    }
    return map;
}

// Registrar o alternar un día completado en una rutina
export async function toggleRoutineLog(profileId: string, contractId: string, date: string, add: boolean): Promise<void> {
    if (add) {
        const { error } = await supabase
            .from('routine_logs')
            .upsert(
                { profile_id: profileId, contract_id: contractId, log_date: date, completed: true },
                { onConflict: 'profile_id,contract_id,log_date' }
            );
        if (error) console.error('Error inserting routine log:', error);
    } else {
        const { error } = await supabase
            .from('routine_logs')
            .delete()
            .eq('profile_id', profileId)
            .eq('contract_id', contractId)
            .eq('log_date', date);
        if (error) console.error('Error deleting routine log:', error);
    }
}