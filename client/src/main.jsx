import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import App from './App';
import { createAppTheme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { ThemeContextProvider, useAppTheme } from './context/ThemeContext';
import './index.css';

const Root = () => {
    const { mode } = useAppTheme();
    const theme = useMemo(() => createAppTheme(mode), [mode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </LocalizationProvider>
        </ThemeProvider>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeContextProvider>
                <Root />
            </ThemeContextProvider>
        </BrowserRouter>
    </React.StrictMode>
);
