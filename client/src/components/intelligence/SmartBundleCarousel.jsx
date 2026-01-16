import React from 'react';
import { Card, CardContent, Typography, Box, Button, Avatar, Chip, IconButton } from '@mui/material';
import { Add, Inventory, Lightbulb } from '@mui/icons-material';
import { formatCurrency } from '../../utils/calculations';

const SmartBundleCarousel = ({ bundles, onAddBundle }) => {
    if (!bundles || bundles.length === 0) return null;

    return (
        <Box sx={{ mt: 4, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Lightbulb color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">
                    Smart Suggestions
                </Typography>
                <Chip label="AI Recommended" size="small" color="primary" variant="outlined" sx={{ ml: 2 }} />
            </Box>

            <Box sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                pb: 2,
                '::-webkit-scrollbar': { height: 8 },
                '::-webkit-scrollbar-thumb': { backgroundColor: '#ccc', borderRadius: 4 }
            }}>
                {bundles.map((item) => (
                    <Card key={item.id} sx={{ minWidth: 280, maxWidth: 280, flexShrink: 0, position: 'relative' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Avatar sx={{ bgcolor: 'secondary.light' }}>
                                    <Inventory />
                                </Avatar>
                                <Chip label={`${(parseFloat(item.confidence) * 100).toFixed(0)}% Match`} size="small" color="success" />
                            </Box>

                            <Typography variant="subtitle1" noWrap title={item.name}>
                                {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                {item.sku}
                            </Typography>

                            <Typography variant="body2" sx={{ mb: 2, minHeight: 40 }}>
                                {item.reason}
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" color="primary">
                                    {formatCurrency(item.price)}
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<Add />}
                                    onClick={() => onAddBundle(item)}
                                >
                                    Add
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );
};

export default SmartBundleCarousel;
