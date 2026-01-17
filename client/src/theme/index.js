import { createTheme, alpha } from '@mui/material/styles';

// Modern vibrant color palette
const colors = {
    // Primary - Vibrant Purple/Indigo gradient feel
    primary: {
        light: '#818cf8',
        main: '#6366f1',
        dark: '#4f46e5',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    },
    // Secondary - Teal/Cyan for contrast
    secondary: {
        light: '#22d3ee',
        main: '#06b6d4',
        dark: '#0891b2',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)',
    },
    // Accent - Coral/Orange for highlights
    accent: {
        light: '#fb7185',
        main: '#f43f5e',
        dark: '#e11d48',
        gradient: 'linear-gradient(135deg, #f43f5e 0%, #f97316 100%)',
    },
    // Success - Fresh green
    success: {
        light: '#4ade80',
        main: '#22c55e',
        dark: '#16a34a',
    },
    // Warning - Amber
    warning: {
        light: '#fbbf24',
        main: '#f59e0b',
        dark: '#d97706',
    },
    // Error - Vibrant red
    error: {
        light: '#f87171',
        main: '#ef4444',
        dark: '#dc2626',
    },
};

export const createAppTheme = (mode) => {
    const isDark = mode === 'dark';

    return createTheme({
        palette: {
            mode,
            primary: {
                main: colors.primary.main,
                light: colors.primary.light,
                dark: colors.primary.dark,
                contrastText: '#ffffff',
            },
            secondary: {
                main: colors.secondary.main,
                light: colors.secondary.light,
                dark: colors.secondary.dark,
                contrastText: '#ffffff',
            },
            success: colors.success,
            warning: colors.warning,
            error: colors.error,
            background: isDark
                ? {
                    default: '#0f0f23', // Deep space blue
                    paper: '#1a1a2e',   // Slightly lighter
                    card: '#16162a',    // Card background
                }
                : {
                    default: '#f8faff', // Soft blue-white
                    paper: '#ffffff',
                    card: '#ffffff',
                },
            text: isDark
                ? {
                    primary: '#f1f5f9',
                    secondary: '#94a3b8',
                }
                : {
                    primary: '#1e293b',
                    secondary: '#64748b',
                },
            divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        },
        typography: {
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            h1: {
                fontSize: '2.5rem',
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
            },
            h2: {
                fontSize: '2rem',
                fontWeight: 700,
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
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
                lineHeight: 1.7,
            },
            body2: {
                fontSize: '0.875rem',
                lineHeight: 1.6,
            },
            button: {
                textTransform: 'none',
                fontWeight: 600,
            },
        },
        shape: {
            borderRadius: 12,
        },
        shadows: [
            'none',
            '0px 1px 2px rgba(99, 102, 241, 0.05)',
            '0px 2px 4px rgba(99, 102, 241, 0.08)',
            isDark
                ? '0px 4px 12px rgba(0, 0, 0, 0.4)'
                : '0px 4px 12px rgba(99, 102, 241, 0.12)',
            isDark
                ? '0px 8px 24px rgba(0, 0, 0, 0.5)'
                : '0px 8px 24px rgba(99, 102, 241, 0.15)',
            isDark
                ? '0px 16px 40px rgba(0, 0, 0, 0.6)'
                : '0px 16px 40px rgba(99, 102, 241, 0.18)',
            '0px 24px 60px rgba(99, 102, 241, 0.22)',
            ...Array(18).fill('0px 24px 60px rgba(99, 102, 241, 0.22)'),
        ],
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundImage: isDark
                            ? 'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)'
                            : 'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.04) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.03) 0%, transparent 50%)',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        padding: '10px 24px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease-in-out',
                    },
                    contained: {
                        background: colors.primary.gradient,
                        boxShadow: '0px 4px 14px rgba(99, 102, 241, 0.35)',
                        '&:hover': {
                            background: colors.primary.gradient,
                            boxShadow: '0px 6px 20px rgba(99, 102, 241, 0.45)',
                            transform: 'translateY(-1px)',
                        },
                    },
                    containedSecondary: {
                        background: colors.secondary.gradient,
                        boxShadow: '0px 4px 14px rgba(6, 182, 212, 0.35)',
                        '&:hover': {
                            background: colors.secondary.gradient,
                            boxShadow: '0px 6px 20px rgba(6, 182, 212, 0.45)',
                            transform: 'translateY(-1px)',
                        },
                    },
                    outlined: {
                        borderWidth: 2,
                        '&:hover': {
                            borderWidth: 2,
                            backgroundColor: alpha(colors.primary.main, 0.08),
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(99, 102, 241, 0.08)',
                        boxShadow: isDark
                            ? '0px 4px 24px rgba(0, 0, 0, 0.4)'
                            : '0px 4px 24px rgba(99, 102, 241, 0.08)',
                        backgroundImage: 'none',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: isDark
                                ? '0px 8px 40px rgba(0, 0, 0, 0.5)'
                                : '0px 8px 40px rgba(99, 102, 241, 0.12)',
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        background: isDark
                            ? 'rgba(15, 15, 35, 0.85)'
                            : 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(20px)',
                        borderBottom: isDark
                            ? '1px solid rgba(255, 255, 255, 0.05)'
                            : '1px solid rgba(99, 102, 241, 0.08)',
                        boxShadow: 'none',
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        background: isDark
                            ? 'linear-gradient(180deg, #1a1a2e 0%, #0f0f23 100%)'
                            : 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)',
                        borderRight: isDark
                            ? '1px solid rgba(255, 255, 255, 0.05)'
                            : '1px solid rgba(99, 102, 241, 0.08)',
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 10,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                boxShadow: `0 0 0 3px ${alpha(colors.primary.main, 0.08)}`,
                            },
                            '&.Mui-focused': {
                                boxShadow: `0 0 0 3px ${alpha(colors.primary.main, 0.15)}`,
                            },
                        },
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    head: {
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.05em',
                        backgroundColor: isDark ? '#1a1a2e' : '#f8faff',
                        color: isDark ? colors.primary.light : colors.primary.main,
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        fontWeight: 600,
                        borderRadius: 8,
                    },
                    colorSuccess: {
                        background: alpha(colors.success.main, 0.15),
                        color: colors.success.main,
                        border: `1px solid ${alpha(colors.success.main, 0.3)}`,
                    },
                    colorWarning: {
                        background: alpha(colors.warning.main, 0.15),
                        color: colors.warning.dark,
                        border: `1px solid ${alpha(colors.warning.main, 0.3)}`,
                    },
                    colorError: {
                        background: alpha(colors.error.main, 0.15),
                        color: colors.error.main,
                        border: `1px solid ${alpha(colors.error.main, 0.3)}`,
                    },
                },
            },
            MuiTabs: {
                styleOverrides: {
                    indicator: {
                        height: 3,
                        borderRadius: 3,
                        background: colors.primary.gradient,
                    },
                },
            },
            MuiTab: {
                styleOverrides: {
                    root: {
                        fontWeight: 600,
                        textTransform: 'none',
                        minHeight: 48,
                        '&.Mui-selected': {
                            color: colors.primary.main,
                        },
                    },
                },
            },
            MuiLinearProgress: {
                styleOverrides: {
                    root: {
                        borderRadius: 4,
                        height: 6,
                    },
                    bar: {
                        background: colors.primary.gradient,
                    },
                },
            },
            MuiAvatar: {
                styleOverrides: {
                    root: {
                        background: colors.primary.gradient,
                        fontWeight: 700,
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        margin: '2px 8px',
                        '&.Mui-selected': {
                            background: alpha(colors.primary.main, 0.12),
                            borderLeft: `3px solid ${colors.primary.main}`,
                            '&:hover': {
                                background: alpha(colors.primary.main, 0.18),
                            },
                        },
                        '&:hover': {
                            background: alpha(colors.primary.main, 0.06),
                        },
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: 20,
                        boxShadow: isDark
                            ? '0px 24px 80px rgba(0, 0, 0, 0.6)'
                            : '0px 24px 80px rgba(99, 102, 241, 0.2)',
                    },
                },
            },
            MuiAlert: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                    },
                    standardSuccess: {
                        background: alpha(colors.success.main, 0.12),
                        border: `1px solid ${alpha(colors.success.main, 0.3)}`,
                    },
                    standardError: {
                        background: alpha(colors.error.main, 0.12),
                        border: `1px solid ${alpha(colors.error.main, 0.3)}`,
                    },
                    standardWarning: {
                        background: alpha(colors.warning.main, 0.12),
                        border: `1px solid ${alpha(colors.warning.main, 0.3)}`,
                    },
                    standardInfo: {
                        background: alpha(colors.primary.main, 0.12),
                        border: `1px solid ${alpha(colors.primary.main, 0.3)}`,
                    },
                },
            },
            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        borderRadius: 8,
                        backgroundColor: isDark ? '#2a2a3e' : '#1e293b',
                        fontSize: '0.8rem',
                        padding: '8px 14px',
                    },
                },
            },
        },
    });
};
