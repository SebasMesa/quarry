import { supabase } from "../supabase";
import type {
    Account,
    Transaction,
    BudgetEnvelope,
    SavingsGoal,
    NetWorthPoint,
} from "../data/types";

/* ── Cuentas ─────────────────────────────────────────────────────── */

export async function getAccounts(profileId: string): Promise<Account[]> {
    const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("profile_id", profileId);

    if (error) {
        console.error("Error fetching accounts:", error);
        return [];
    }
    return (data ?? []).map((row: any) => ({ ...row, balance: Number(row.balance) })) as Account[];
}

export async function createAccount(
    account: Omit<Account, "id">,
): Promise<Account | null> {
    const { currency, ...accountPayload } = account as any;
    const { data, error } = await supabase
        .from("accounts")
        .insert(accountPayload)
        .select()
        .single();

    if (error) {
        console.error("Error creating account:", error);
        return null;
    }
    return { ...data, balance: Number(data.balance) } as Account;
}

export async function updateAccountBalance(accountId: string, balance: number) {
    const { error } = await supabase
        .from("accounts")
        .update({ balance })
        .eq("id", accountId);

    if (error) console.error("Error updating account balance:", error);
}

/* ── Transacciones ───────────────────────────────────────────────── */

export async function getTransactions(profileId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("profile_id", profileId)
        .order("date", { ascending: false });

    if (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }
    return (data ?? []).map((row: any) => ({ ...row, amount: Number(row.amount) })) as Transaction[];
}

export async function createTransaction(
    tx: Omit<Transaction, "id">,
): Promise<Transaction | null> {
    const { data, error } = await supabase
        .from("transactions")
        .insert(tx)
        .select()
        .single();

    if (error) {
        console.error("Error creating transaction:", error);
        return null;
    }
    return { ...data, amount: Number(data.amount) } as Transaction;
}

/* ── Presupuesto (sobres) ────────────────────────────────────────── */

export async function getBudgets(profileId: string): Promise<BudgetEnvelope[]> {
    const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("profile_id", profileId);

    if (error) {
        console.error("Error fetching budgets:", error);
        return [];
    }
    return (data ?? []).map((row: any) => ({
        ...row,
        assigned: Number(row.assigned),
        spent: Number(row.spent),
    })) as BudgetEnvelope[];
}

export async function createBudget(
    budget: Omit<BudgetEnvelope, "id">,
): Promise<BudgetEnvelope | null> {
    const { data, error } = await supabase
        .from("budgets")
        .insert({
            ...budget,
            spent: budget.spent ?? 0,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating budget:", error);
        return null;
    }
    return {
        ...data,
        assigned: Number(data.assigned),
        spent: Number(data.spent),
    } as BudgetEnvelope;
}

/* ── Metas de ahorro ─────────────────────────────────────────────── */

export async function getSavingsGoals(profileId: string): Promise<SavingsGoal[]> {
    const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("profile_id", profileId);

    if (error) {
        console.error("Error fetching savings goals:", error);
        return [];
    }
    return (data ?? []).map((row: any) => ({
        ...row,
        target: Number(row.target),
        saved: Number(row.saved),
        monthly_contribution: Number(row.monthly_contribution),
    })) as SavingsGoal[];
}

export async function createSavingsGoal(
    goal: Omit<SavingsGoal, "id">,
): Promise<SavingsGoal | null> {
    const { data, error } = await supabase
        .from("savings_goals")
        .insert({
            ...goal,
            saved: goal.saved ?? 0,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating savings goal:", error);
        return null;
    }
    return {
        ...data,
        target: Number(data.target),
        saved: Number(data.saved),
        monthly_contribution: Number(data.monthly_contribution),
    } as SavingsGoal;
}

export async function contributeToSavingsGoal(
    goalId: string,
    amount: number,
): Promise<SavingsGoal | null> {
    const { data: currentGoal, error: fetchErr } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("id", goalId)
        .single();

    if (fetchErr || !currentGoal) {
        console.error("Error fetching savings goal to contribute:", fetchErr);
        return null;
    }

    const newSaved = Number(currentGoal.saved || 0) + Number(amount);

    const { data, error } = await supabase
        .from("savings_goals")
        .update({ saved: newSaved })
        .eq("id", goalId)
        .select()
        .single();

    if (error) {
        console.error("Error contributing to savings goal:", error);
        return null;
    }

    return {
        ...data,
        target: Number(data.target),
        saved: Number(data.saved),
        monthly_contribution: Number(data.monthly_contribution),
    } as SavingsGoal;
}

/* ── Historial de patrimonio neto ───────────────────────────────── */
/* Ojo: la columna en Supabase se llama "month_date", el tipo del
   frontend (NetWorthPoint) usa "month" — se traduce aquí. */

export async function getNetWorthHistory(profileId: string): Promise<NetWorthPoint[]> {
    const { data, error } = await supabase
        .from("net_worth_history")
        .select("*")
        .eq("profile_id", profileId)
        .order("month_date", { ascending: true });

    if (error) {
        console.error("Error fetching net worth history:", error);
        return [];
    }
    return (data ?? []).map((row: any) => ({
        id: row.id,
        profile_id: row.profile_id,
        month: row.month_date,
        net_worth: Number(row.net_worth),
    }));
}

export async function createNetWorthPoint(
    profileId: string,
    month: string,
    netWorth: number,
): Promise<NetWorthPoint | null> {
    const { data, error } = await supabase
        .from("net_worth_history")
        .insert({ profile_id: profileId, month_date: month, net_worth: netWorth })
        .select()
        .single();

    if (error) {
        console.error("Error creating net worth point:", error);
        return null;
    }
    return {
        id: data.id,
        profile_id: data.profile_id,
        month: data.month_date,
        net_worth: Number(data.net_worth),
    };
}

export async function upsertNetWorthPoint(
    profileId: string,
    monthDate: string,
    netWorth: number,
): Promise<NetWorthPoint | null> {
    const monthPrefix = monthDate.slice(0, 7); // e.g. "YYYY-MM"

    // Comprobar si ya existe un corte para el mes en curso para este perfil
    const { data: existingRows, error: fetchErr } = await supabase
        .from("net_worth_history")
        .select("*")
        .eq("profile_id", profileId);

    if (fetchErr) {
        console.error("Error checking net worth history:", fetchErr);
    }

    const existing = (existingRows ?? []).find((r: any) =>
        String(r.month_date).startsWith(monthPrefix)
    );

    if (existing) {
        if (Number(existing.net_worth) === netWorth) {
            return {
                id: existing.id,
                profile_id: existing.profile_id,
                month: existing.month_date,
                net_worth: Number(existing.net_worth),
            };
        }

        const { data, error } = await supabase
            .from("net_worth_history")
            .update({ net_worth: netWorth })
            .eq("id", existing.id)
            .select()
            .single();

        if (error) {
            console.error("Error updating net worth point:", error);
            return null;
        }
        return {
            id: data.id,
            profile_id: data.profile_id,
            month: data.month_date,
            net_worth: Number(data.net_worth),
        };
    } else {
        const { data, error } = await supabase
            .from("net_worth_history")
            .insert({ profile_id: profileId, month_date: monthDate, net_worth: netWorth })
            .select()
            .single();

        if (error) {
            console.error("Error creating monthly net worth point:", error);
            return null;
        }
        return {
            id: data.id,
            profile_id: data.profile_id,
            month: data.month_date,
            net_worth: Number(data.net_worth),
        };
    }
}