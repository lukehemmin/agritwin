import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // 저장된 테마 설정 확인
    const savedTheme = localStorage.getItem('agritwin_theme') as Theme | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // 시스템 설정 확인
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    // DOM에 테마 적용
    document.documentElement.setAttribute('data-theme', theme);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('agritwin_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');

  return {
    theme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };
};