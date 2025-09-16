import axios from 'axios';
import { API_BASE_URL } from '../constants';

// Create axios instance with auth token
const createAuthInstance = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
};

export const memberImportApi = {
  // Import members from CSV data
  importMembers: async (members) => {
    try {
      console.log('MemberImportApi - Importing members:', members.length);
      console.log('MemberImportApi - Sample data:', members.slice(0, 1));
      
      const authInstance = createAuthInstance();
      const response = await authInstance.post('/members/import-csv', {
        members
      });
      
      console.log('MemberImportApi - Full response:', response);
      console.log('MemberImportApi - Response data:', response.data);
      console.log('MemberImportApi - Response status:', response.status);
      
      return response.data;
    } catch (error) {
      console.error('MemberImportApi - Import error:', error);
      console.error('MemberImportApi - Error response:', error.response);
      console.error('MemberImportApi - Error status:', error.response?.status);
      console.error('MemberImportApi - Error data:', error.response?.data);
      
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Import failed');
      }
      throw new Error('Network error during import');
    }
  },

  // Download CSV template
  downloadTemplate: () => {
    const templateData = [
      {
        name: 'राजेश कुमार शर्मा',
        businessName: 'ABC Mandap',
        businessType: 'mandap',
        phone: '9876543210',
        email: 'rajesh@example.com',
        city: 'Mumbai',
        state: 'Maharashtra',
        district: 'Mumbai',
        associationName: 'Mumbai Association',
        birthDate: '1990-01-01',
        address: '123 Main Street',
        pincode: '400001',
        gstNumber: '27ABCDE1234F1Z5',
        description: 'Professional mandap services',
        experience: '5'
      },
      {
        name: 'Priya Sharma',
        businessName: 'XYZ Catering',
        businessType: 'catering',
        phone: '9876543211',
        email: 'priya@example.com',
        city: 'Pune',
        state: 'Maharashtra',
        district: 'Pune',
        associationName: 'Pune Association',
        birthDate: '1985-05-15',
        address: '456 Oak Avenue',
        pincode: '411001',
        gstNumber: '27FGHIJ5678K9L2',
        description: 'Quality catering services',
        experience: '8'
      }
    ];

    const csvContent = convertToCSV(templateData);
    downloadCSV(csvContent, 'member-import-template.csv');
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in values
      if (value && typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};

// Helper function to download CSV
const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

