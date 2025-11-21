/**
 * Excel Upload Button Component
 * Reusable component for uploading Excel files with bulk data
 */

import React, { useRef, useState } from 'react';
import { parseExcelFile, validateRequiredColumns, type ExcelRow } from '../utils/excelUpload';

interface ExcelUploadButtonProps {
  onUpload: (data: ExcelRow[]) => Promise<{ created: number; updated: number; errors: string[] }>;
  requiredColumns: string[];
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

export const ExcelUploadButton: React.FC<ExcelUploadButtonProps> = ({
  onUpload,
  requiredColumns,
  buttonText = 'Upload Excel',
  className = '',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    created: number;
    updated: number;
    errors: string[];
  } | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous results
    setUploadResult(null);
    setUploading(true);

    try {
      // Parse Excel file
      const parseResult = await parseExcelFile(file);
      
      if (!parseResult.success || !parseResult.data) {
        alert(`Failed to parse Excel file:\n${parseResult.errors?.join('\n')}`);
        return;
      }

      // Validate required columns
      const validationResult = validateRequiredColumns(parseResult.data, requiredColumns);
      
      if (!validationResult.success || !validationResult.data) {
        alert(`Invalid Excel format:\n${validationResult.errors?.join('\n')}`);
        return;
      }

      // Upload data
      const result = await onUpload(validationResult.data);
      setUploadResult(result);

      // Show result
      let message = `Upload complete!\n\nCreated: ${result.created}\nUpdated: ${result.updated}`;
      
      if (result.errors.length > 0) {
        message += `\n\nErrors (${result.errors.length}):\n${result.errors.slice(0, 10).join('\n')}`;
        if (result.errors.length > 10) {
          message += `\n... and ${result.errors.length - 10} more errors`;
        }
      }
      
      alert(message);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={disabled || uploading}
      />
      <button
        onClick={handleButtonClick}
        disabled={disabled || uploading}
        className={`excel-upload-button ${className}`}
        style={{
          padding: '8px 16px',
          backgroundColor: uploading ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: uploading || disabled ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        {uploading ? 'Uploading...' : buttonText}
      </button>
      {uploadResult && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          Created: {uploadResult.created}, Updated: {uploadResult.updated}
          {uploadResult.errors.length > 0 && `, Errors: ${uploadResult.errors.length}`}
        </div>
      )}
    </>
  );
};

