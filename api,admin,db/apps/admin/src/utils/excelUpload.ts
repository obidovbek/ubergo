/**
 * Excel Upload Utility
 * Handles parsing and validation of Excel files for bulk data import
 */

import * as XLSX from 'xlsx';
export interface ExcelRow {
  [key: string]: any;
}

export interface ExcelUploadResult {
  success: boolean;
  data?: ExcelRow[];
  errors?: string[];
  warnings?: string[];
}

/**
 * Parse Excel file to JSON
 */
export const parseExcelFile = async (file: File): Promise<ExcelUploadResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        errors: ['Excel file is empty or has no sheets'],
      };
    }
    
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
      raw: false,
    });
    
    if (!jsonData || jsonData.length === 0) {
      return {
        success: false,
        errors: ['Excel sheet is empty or has no data rows'],
      };
    }
    
    return {
      success: true,
      data: jsonData as ExcelRow[],
    };
  } catch (error) {
    console.error('Failed to parse Excel file:', error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to parse Excel file'],
    };
  }
};

/**
 * Validate required columns
 */
export const validateRequiredColumns = (
  data: ExcelRow[],
  requiredColumns: string[]
): ExcelUploadResult => {
  if (!data || data.length === 0) {
    return {
      success: false,
      errors: ['No data to validate'],
    };
  }
  
  const firstRow = data[0];
  const actualColumns = Object.keys(firstRow);
  
  // Normalize column names (trim whitespace, lowercase for comparison)
  const normalizedActualColumns = actualColumns.map(col => col.trim().toLowerCase());
  const normalizedRequiredColumns = requiredColumns.map(col => col.trim().toLowerCase());
  
  // Find missing columns
  const missingColumns = requiredColumns.filter((requiredCol, index) => {
    const normalizedRequired = normalizedRequiredColumns[index];
    return !normalizedActualColumns.includes(normalizedRequired);
  });
  
  if (missingColumns.length > 0) {
    return {
      success: false,
      errors: [
        `Missing required columns: ${missingColumns.join(', ')}`,
        `Found columns: ${actualColumns.join(', ')}`,
      ],
    };
  }
  
  // Normalize the data keys to match expected column names (trim whitespace)
  const normalizedData = data.map(row => {
    const normalizedRow: ExcelRow = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = key.trim();
      // Find the matching required column (case-insensitive)
      const matchingRequiredCol = requiredColumns.find(
        reqCol => reqCol.trim().toLowerCase() === normalizedKey.toLowerCase()
      );
      if (matchingRequiredCol) {
        normalizedRow[matchingRequiredCol] = row[key];
      } else {
        // Keep other columns as-is
        normalizedRow[normalizedKey] = row[key];
      }
    });
    return normalizedRow;
  });
  
  return {
    success: true,
    data: normalizedData,
  };
};

/**
 * Validate row data
 */
export const validateRows = (
  data: ExcelRow[],
  validator: (row: ExcelRow, index: number) => string | null
): ExcelUploadResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  data.forEach((row, index) => {
    const error = validator(row, index);
    if (error) {
      errors.push(`Row ${index + 2}: ${error}`); // +2 because Excel rows start at 1 and we skip header
    }
  });
  
  if (errors.length > 0) {
    return {
      success: false,
      data,
      errors,
    };
  }
  
  return {
    success: true,
    data,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * Download Excel template
 */
export const downloadExcelTemplate = (
  filename: string,
  headers: string[],
  exampleRows?: any[][]
) => {
  const worksheet = XLSX.utils.aoa_to_sheet([
    headers,
    ...(exampleRows || []),
  ]);
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  
  XLSX.writeFile(workbook, filename);
};

/**
 * Format Excel data for API submission
 */
export const formatExcelDataForAPI = (
  data: ExcelRow[],
  fieldMapping: Record<string, string>
): any[] => {
  return data.map(row => {
    const formattedRow: any = {};
    
    Object.keys(fieldMapping).forEach(excelColumn => {
      const apiField = fieldMapping[excelColumn];
      const value = row[excelColumn];
      
      // Skip null/undefined values
      if (value === null || value === undefined || value === '') {
        return;
      }
      
      formattedRow[apiField] = value;
    });
    
    return formattedRow;
  });
};

