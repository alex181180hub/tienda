
'use client';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

export function Providers({ children }) {
    return (
        <AuthProvider>
            <ThemeProvider>
                {children}
            </ThemeProvider>
        </AuthProvider>
    );
}
