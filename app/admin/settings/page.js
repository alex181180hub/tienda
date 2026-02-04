
'use client';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { ChevronLeft, Monitor, Moon, Sun, Palette } from 'lucide-react';
import styles from './page.module.css';

export default function SettingsPage() {
    const { theme, changeTheme } = useTheme();
    const { user } = useAuth();

    if (!user || user.role !== 'ADMIN') return <div className="container">Acceso Denegado</div>;

    const themes = [
        { id: 'default', name: 'Original Dark (Premium)', color: '#0f172a' },
        { id: 'light-minimal', name: 'Minimalista Claro', color: '#f8fafc' },
        { id: 'vibrant-purple', name: 'Vibrante Púrpura', color: '#2e1065' },
        { id: 'forest-dark', name: 'Bosque Profundo', color: '#022c22' },
    ];

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <Link href="/" style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ChevronLeft size={24} />
                </Link>
                <h1 style={{ fontSize: '2rem', marginLeft: '1rem' }}>Configuración del Sistema</h1>
            </div>

            <div className={styles.section}>
                <h2><Palette size={24} style={{ marginRight: '0.5rem' }} /> Apariencia</h2>
                <p style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>Selecciona el tema visual para la interfaz.</p>

                <div className={styles.themeGrid}>
                    {themes.map(t => (
                        <button
                            key={t.id}
                            className={`${styles.themeCard} ${theme === t.id ? styles.active : ''}`}
                            onClick={() => changeTheme(t.id)}
                        >
                            <div className={styles.colorPreview} style={{ background: t.color }}>
                                {theme === t.id && <div className={styles.check}>✓</div>}
                            </div>
                            <span>{t.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
