import { createTheme } from '@mui/material/styles';

export const createAppTheme = (mode) => {
    return createTheme({
        palette: {
            mode,
            ...(mode === 'light'
                ? {
                    // Light mode palette
                    primary: {
                        main: '#1a365d',
                        light: '#2d4a7c',
                        dark: '#0f2240',
                        contrastText: '#ffffff',
                    },
                    secondary: {
                        main: '#3182ce',
                        light: '#4299e1',
                        dark: '#2b6cb0',
                        contrastText: '#ffffff',
                    },
                    background: {
                        default: '#f7fafc',
                        paper: '#ffffff',
                    },
                    text: {
                        primary: '#1a202c',
                        secondary: '#4a5568',
                    },
                }
                : {
                    // Dark mode palette
                    primary: {
                        main: '#90cdf4',
                        light: '#63b3ed',
                        dark: '#4299e1',
                        contrastText: 'rgba(0, 0, 0, 0.87)',
                    },
                    secondary: {
                        main: '#63b3ed',
                        light: '#90cdf4',
                        dark: '#4299e1',
                        contrastText: 'rgba(0, 0, 0, 0.87)',
                    },
                    background: {
                        default: '#0f172a', // Slate 900
                        paper: '#1e293b',   // Slate 800
                    },
                    text: {
                        primary: '#f8fafc',
                        secondary: '#94a3b8',
                    },
                    divider: 'rgba(255, 255, 255, 0.12)',
                }),
            success: {
                main: '#38a169',
                light: '#48bb78',
                dark: '#2f855a',
            },
            warning: {
                main: '#dd6b20',
                light: '#ed8936',
                dark: '#c05621',
            },
            error: {
                main: '#e53e3e',
                light: '#fc8181',
                dark: '#c53030',
            },
        },
        typography: {
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            h1: {
                fontSize: '2.25rem',
                fontWeight: 700,
                lineHeight: 1.2,
            },
            h2: {
                fontSize: '1.875rem',
                fontWeight: 600,
                lineHeight: 1.3,
            },
            h3: {
                fontSize: '1.5rem',
                fontWeight: 600,
                lineHeight: 1.4,
            },
            h4: {
                fontSize: '1.25rem',
                fontWeight: 600,
                lineHeight: 1.4,
            },
            h5: {
                fontSize: '1.125rem',
                fontWeight: 600,
                lineHeight: 1.5,
            },
            h6: {
                fontSize: '1rem',
                fontWeight: 600,
                lineHeight: 1.5,
            },
            body1: {
                fontSize: '1rem',
                lineHeight: 1.6,
            },
            body2: {
                fontSize: '0.875rem',
                lineHeight: 1.6,
            },
            button: {
                textTransform: 'none',
                fontWeight: 500,
            },
        },
        shape: {
            borderRadius: 8,
        },
        shadows: [
            'none',
            '0px 1px 2px rgba(0, 0, 0, 0.05)',
            '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
            '0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.06)',
            '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)',
            '0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)',
            '0px 25px 50px rgba(0, 0, 0, 0.25)',
            ...Array(18).fill('0px 25px 50px rgba(0, 0, 0, 0.25)'),
        ],
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        padding: '10px 20px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                    },
                    contained: {
                        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
                        '&:hover': {
                            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        boxShadow: mode === 'light'
                            ? '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)'
                            : '0px 4px 6px rgba(0, 0, 0, 0.3)',
                        borderRadius: 12,
                        backgroundImage: 'none',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        color: mode === 'light' ? '#1a202c' : '#f8fafc',
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 8,
                        },
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    head: {
                        fontWeight: 600,
                        backgroundColor: mode === 'light' ? '#f7fafc' : '#1e293b',
                        color: mode === 'light' ? '#1a365d' : '#f8fafc',
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        fontWeight: 500,
                    },
                },
            },
        },
    });
};
