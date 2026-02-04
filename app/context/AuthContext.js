
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check local storage on load
        const storedUser = localStorage.getItem('pos_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('pos_user', JSON.stringify(userData));
        router.push('/');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('pos_user');
        router.push('/login');
    };

    // Route Protection
    useEffect(() => {
        if (!loading) {
            if (!user && pathname !== '/login') {
                router.push('/login');
            }
            // Add permission check logic here if needed
        }
    }, [user, loading, pathname]);

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
