import { useState, useRef } from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { UploadFile as UploadIcon } from '@mui/icons-material';
import { parseExcelQuote } from '../../services/quoteService';

const ExcelImportButton = ({ onImportSuccess, onImportError }) => {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Basic validation
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!validExtensions.includes(extension)) {
            if (onImportError) onImportError('Please upload a valid Excel or CSV file.');
            return;
        }

        try {
            setLoading(true);
            const result = await parseExcelQuote(file);

            if (result.success && result.data) {
                if (onImportSuccess) onImportSuccess(result.data);
            } else {
                if (onImportError) onImportError('Failed to parse Excel file.');
            }
        } catch (error) {
            console.error('Excel import error:', error);
            if (onImportError) {
                onImportError(error.response?.data?.message || 'Error uploading file');
            }
        } finally {
            setLoading(false);
            // Reset input so the same file can be uploaded again if needed
            event.target.value = '';
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
            />
            <Tooltip title="Import line items from supplier Excel quote">
                <Button
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
                    onClick={handleButtonClick}
                    disabled={loading}
                    size="large"
                >
                    {loading ? 'Parsing...' : 'Import from Excel'}
                </Button>
            </Tooltip>
        </>
    );
};

export default ExcelImportButton;
