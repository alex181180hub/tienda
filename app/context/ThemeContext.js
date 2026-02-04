
'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('default');

    useEffect(() => {
        const storedTheme = localStorage.getItem('pos_theme');
        if (storedTheme) {
            setTheme(storedTheme);
            document.documentElement.setAttribute('data-theme', storedTheme);
        }
    }, []);

    const changeTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('pos_theme', newTheme);
        if (newTheme === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', newTheme);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
