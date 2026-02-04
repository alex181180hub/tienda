
'use client';
import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Lock, User } from 'lucide-react';
import styles from './page.module.css';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                login(data.user);
            } else {
                setError(data.error || 'Error al iniciar sesión');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Punto de Venta</h1>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <User size={20} className={styles.icon} />
                        <input
                            type="text"
                            placeholder="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.input}
                            autoFocus
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <Lock size={20} className={styles.icon} />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
}
