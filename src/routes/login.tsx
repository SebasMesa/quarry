import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export const Route = createFileRoute('/login')({
    component: LoginPage,
});

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            navigate({ to: '/' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <form onSubmit={handleLogin} className="border border-border p-6 max-w-sm w-full bg-panel-deep/50">
                <h1 className="text-2xl font-display text-amber tracking-widest">ACCESO</h1>
                <p className="label-mono mt-1">Terminal de cazador</p>
                <input
                    type="email"
                    placeholder="Correo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-input bg-panel-deep px-3 py-2 mt-4 text-sm"
                    required
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-input bg-panel-deep px-3 py-2 mt-3 text-sm"
                    required
                />
                {error && <p className="text-rust text-xs mt-2">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 border border-amber bg-amber/15 px-4 py-2 w-full font-mono text-xs tracking-widest text-amber hover:bg-amber/25 disabled:opacity-50"
                >
                    {loading ? 'Conectando...' : 'Acceder'}
                </button>
                <p className="mt-4 text-xs text-muted-foreground text-center">
                    ¿Sin registro? <a href="/registro" className="text-amber hover:underline">Crear cuenta</a>
                </p>
            </form>
        </div>
    );
}