import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { memberImportApi } from '../services/memberImportApi';
import toast from 'react-hot-toast';

const CSVImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [step, setStep] = useState(1); // 1: File Selection, 2: Preview, 3: Import
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (validationErrors.length === 0) return;

    console.group('CSV Import - Validation Issues');
    validationErrors.forEach((error) => {
      if (error.type === 'row') {
        console.warn(
          `Row ${error.row}:`,
          {
            data: error.data,
            messages: error.errors
          }
        );
      } else {
        console.warn(error.message || error);
      }
    });
    console.groupEnd();
  }, [validationErrors]);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Prevent multiple file selections while processing
      if (isProcessing) {
        toast.error('Please wait for the current file to finish processing');
        return;
      }
      
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a valid CSV file');
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
      parseCSVFile(selectedFile);
    }
  };

  const parseCSVFile = (file) => {
    setIsProcessing(true);
    
    // Create a new FileReader instance for each file read operation
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        
        // Import papaparse dynamically
        import('papaparse').then((Papa) => {
          const result = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            transformHeader: (header) => header.trim(),
            transform: (value) => value.trim(),
            // Support for Unicode characters including Marathi/Devanagari
            delimiter: ',',
            quoteChar: '"',
            escapeChar: '"'
          });

          if (result.errors.length > 0) {
            console.error('CSV parsing errors:', result.errors);
            toast.error('CSV file has formatting errors');
            setValidationErrors(result.errors);
            setIsProcessing(false);
            return;
          }

          const data = result.data;
          if (data.length === 0) {
            toast.error('CSV file is empty');
            setIsProcessing(false);
            return;
          }

          if (data.length > 1000) {
            toast.error('CSV file contains more than 1000 rows. Please split into smaller files.');
            setIsProcessing(false);
            return;
          }

          // Validate CSV structure
          const errors = validateCSVStructure(data);
          setValidationErrors(errors);
          setParsedData(data);
          setStep(2);
          setIsProcessing(false);
          
          if (errors.length === 0) {
            toast.success(`CSV parsed successfully. Found ${data.length} members.`);
          } else {
            toast.error(`CSV parsed with ${errors.length} validation errors.`);
          }
        });
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast.error('Error parsing CSV file');
        setIsProcessing(false);
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      toast.error('Error reading CSV file');
      setIsProcessing(false);
    };
    
    // Read file with UTF-8 encoding to support Marathi/Devanagari characters
    reader.readAsText(file, 'UTF-8');
  };

  const validateCSVStructure = (data) => {
    const errors = [];
    const requiredFields = ['name', 'businessName', 'businessType', 'phone', 'email', 'city', 'state', 'district', 'associationName'];
    const validBusinessTypes = ['catering', 'sound', 'mandap', 'madap', 'light', 'decorator', 'photography', 'videography', 'transport', 'other'];
    
    // Check if all required fields are present
    const headers = Object.keys(data[0] || {});
    
    // Create a mapping for alternative column names
    const columnMapping = {
      'Name': 'name',
      'Business_Name': 'businessName',
      'BusinessType': 'businessType',
      'Contact_No.': 'phone',
      'Email_Id': 'email',
      'City': 'city',
      'State': 'state',
      'District': 'district',
      'AssociationName': 'associationName'
    };
    
    // Check for missing fields, considering both original and mapped names
    const missingFields = requiredFields.filter(field => {
      const hasOriginalField = headers.includes(field);
      const hasMappedField = headers.some(header => columnMapping[header] === field);
      return !hasOriginalField && !hasMappedField;
    });
    
    if (missingFields.length > 0) {
      errors.push({
        type: 'structure',
        message: `Missing required columns: ${missingFields.join(', ')}. Available columns: ${headers.join(', ')}`
      });
    }

    // Validate each row
    data.forEach((row, index) => {
      const rowErrors = [];
      
      // Helper function to get field value with mapping
      const getFieldValue = (field) => {
        // Try original field name first
        if (row[field] !== undefined) {
          return row[field];
        }
        // Try mapped field names
        for (const [mappedName, originalName] of Object.entries(columnMapping)) {
          if (originalName === field && row[mappedName] !== undefined) {
            return row[mappedName];
          }
        }
        return undefined;
      };
      
      // Check required fields
      requiredFields.forEach(field => {
        const value = getFieldValue(field);
        if (!value || value.toString().trim() === '') {
          rowErrors.push(`${field} is required`);
        }
      });

      // Validate business type
      const businessType = getFieldValue('businessType');
      if (businessType && !validBusinessTypes.includes(businessType.toLowerCase())) {
        rowErrors.push(`Invalid business type: ${businessType}`);
      }

      // Validate phone number (basic check)
      const phone = getFieldValue('phone');
      if (phone && !/^\d{10}$/.test(phone.toString().replace(/\D/g, ''))) {
        rowErrors.push('Invalid phone number format');
      }

      // Validate email
      const email = getFieldValue('email');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        rowErrors.push('Invalid email format');
      }

      // Validate birth date
      const birthDate = getFieldValue('birthDate');
      if (birthDate && birthDate.toString().trim() !== '') {
        const date = new Date(birthDate);
        if (isNaN(date.getTime())) {
          rowErrors.push('Invalid birth date format');
        } else {
          const age = new Date().getFullYear() - date.getFullYear();
          if (age < 18) {
            rowErrors.push('Member must be at least 18 years old');
          }
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          type: 'row',
          row: index + 1,
          data: row,
          errors: rowErrors
        });
      }
    });

    return errors;
  };

  const handleImport = async () => {
    if (!parsedData) return;
    
    setIsProcessing(true);
    setStep(3);
    
    try {
      // Map column names to expected format
      const columnMapping = {
        'Name': 'name',
        'Business_Name': 'businessName',
        'BusinessType': 'businessType',
        'Contact_No.': 'phone',
        'Email_Id': 'email',
        'City': 'city',
        'State': 'state',
        'District': 'district',
        'AssociationName': 'associationName'
      };
      
      const mappedData = parsedData.map(row => {
        const mappedRow = {};
        Object.keys(row).forEach(key => {
          const mappedKey = columnMapping[key] || key;
          mappedRow[mappedKey] = row[key];
        });
        return mappedRow;
      });
      
      console.log('Sending data to backend:', mappedData.slice(0, 2)); // Log first 2 records
      const result = await memberImportApi.importMembers(mappedData);
      console.log('Backend response:', result);
      
      if (result.success) {
        toast.success(`Import completed! ${result.summary.imported} members imported successfully.`);
        onImportSuccess && onImportSuccess();
        handleClose();
      } else {
        console.error('Import failed - result:', result);
        toast.error(`Import failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.message || 'Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData(null);
    setValidationErrors([]);
    setStep(1);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDownloadTemplate = () => {
    memberImportApi.downloadTemplate();
    toast.success('Template downloaded successfully');
  };

  const getValidRows = () => {
    if (!parsedData) return 0;
    const errorRows = validationErrors.filter(e => e.type === 'row').map(e => e.row);
    return parsedData.length - errorRows.length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import Members from CSV</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: File Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select CSV File</h3>
                <p className="text-gray-600 mb-6">
                  Choose a CSV file containing member data. Maximum file size: 5MB, Maximum rows: 1000
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Choose CSV File'}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  or drag and drop your CSV file here
                </p>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Template</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && parsedData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Preview Data</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {parsedData.length} total rows, {getValidRows()} valid rows
                  </span>
                </div>
              </div>

              {/* Validation Summary */}
              {validationErrors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Validation Issues Found</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        {validationErrors.length} issues found. Please review and fix before importing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Preview Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {Object.keys(parsedData[0] || {}).map((header) => (
                          <th
                            key={header}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedData.slice(0, 10).map((row, index) => {
                        const rowErrors = validationErrors.filter(e => e.type === 'row' && e.row === index + 1);
                        return (
                          <tr
                            key={index}
                            className={rowErrors.length > 0 ? 'bg-red-50' : 'hover:bg-gray-50'}
                          >
                            {Object.values(row).map((value, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate"
                                title={value}
                              >
                                {value}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 10 && (
                  <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 text-center">
                    Showing first 10 rows of {parsedData.length} total rows
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Back
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={getValidRows() === 0 || isProcessing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Importing...' : `Import ${getValidRows()} Members`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Import Progress */}
          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center">
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                ) : (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isProcessing ? 'Importing Members...' : 'Import Completed'}
                </h3>
                <p className="text-gray-600">
                  {isProcessing 
                    ? 'Please wait while we process your data...' 
                    : 'Your members have been imported successfully!'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;

