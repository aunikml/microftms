import React, { createContext, useState, useMemo, useEffect, useContext } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { themeConfig } from '../theme';

const ThemeColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light',
});

export const ThemeColorModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('tms_theme_mode');
    return savedMode ? savedMode : 'light';
  });

  useEffect(() => {
    localStorage.setItem('tms_theme_mode', mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(() => themeConfig(mode), [mode]);

  return (
    <ThemeColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeColorModeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeColorModeContext);
