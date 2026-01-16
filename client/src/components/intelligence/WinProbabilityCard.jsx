import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { TrendingUp, TrendingDown, Speed, CheckCircle, Warning } from '@mui/icons-material';

const WinProbabilityCard = ({ winProbability, aiAnalysis }) => {
    if (winProbability === undefined || winProbability === null) return null;

    const { score, factors } = aiAnalysis || {};

    const getColor = (val) => {
        if (val >= 70) return 'success';
        if (val >= 40) return 'warning';
        return 'error';
    };

    const color = getColor(winProbability);

    return (
        <Card sx={{ mb: 2, borderLeft: 6, borderColor: `${color}.main` }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Speed color={color} sx={{ mr: 1 }} />
                    <Typography variant="h6">
                        Win Probability
                    </Typography>
                    <Chip
                        label={`${winProbability}%`}
                        color={color}
                        sx={{ ml: 'auto', fontWeight: 'bold' }}
                    />
                </Box>

                <LinearProgress
                    variant="determinate"
                    value={winProbability}
                    color={color}
                    sx={{ height: 10, borderRadius: 5, mb: 2 }}
                />

                {factors && factors.length > 0 && (
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Key Factors:
                        </Typography>
                        <List dense disablePadding>
                            {factors.map((factor, index) => (
                                <ListItem key={index} disableGutters sx={{ py: 0.5 }}>
                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                        {factor.impact.startsWith('+') ?
                                            <TrendingUp color="success" fontSize="small" /> :
                                            <TrendingDown color="error" fontSize="small" />
                                        }
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={factor.factor}
                                        secondary={factor.description}
                                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                    <Typography variant="caption" color={factor.impact.startsWith('+') ? 'success.main' : 'error.main'}>
                                        {factor.impact}
                                    </Typography>
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default WinProbabilityCard;
