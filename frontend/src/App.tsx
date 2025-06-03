import React, { useState, useMemo } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Header from './components/Header';
import JobPortal from './components/JobPortal';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: isDarkMode ? '#90caf9' : '#212121',
          },
          background: {
            default: isDarkMode ? '#121212' : '#ffffff',
            paper: isDarkMode ? '#1e1e1e' : '#ffffff',
          },
          text: {
            primary: isDarkMode ? '#ffffff' : '#212121',
            secondary: isDarkMode ? '#b0bec5' : '#757575',
          },
          divider: isDarkMode ? '#424242' : '#e0e0e0',
          action: {
            hover: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          },
        },
        typography: {
          fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
          ].join(','),
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
              },
              contained: {
                backgroundColor: isDarkMode ? '#90caf9' : '#212121',
                color: isDarkMode ? '#000000' : '#ffffff',
                '&:hover': {
                  backgroundColor: isDarkMode ? '#64b5f6' : '#000000',
                },
              },
              outlined: {
                borderColor: isDarkMode ? '#90caf9' : '#212121',
                color: isDarkMode ? '#90caf9' : '#212121',
                '&:hover': {
                  borderColor: isDarkMode ? '#64b5f6' : '#000000',
                  backgroundColor: isDarkMode ? 'rgba(144, 202, 249, 0.08)' : 'rgba(33, 33, 33, 0.04)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
                borderColor: isDarkMode ? '#424242' : '#e0e0e0',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                '&.Mui-selected': {
                  backgroundColor: isDarkMode ? 'rgba(144, 202, 249, 0.08)' : '#f5f5f5',
                  borderColor: isDarkMode ? '#90caf9' : '#bdbdbd',
                },
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#fafafa',
                  borderColor: isDarkMode ? '#90caf9' : '#bdbdbd',
                },
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: isDarkMode ? '#424242' : '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: isDarkMode ? '#90caf9' : '#bdbdbd',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: isDarkMode ? '#90caf9' : '#212121',
                  },
                },
              },
            },
          },
        },
      }),
    [isDarkMode]
  );

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <JobPortal />
    </ThemeProvider>
  );
}

export default App;
