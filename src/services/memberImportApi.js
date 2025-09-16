import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mandapam-backend-97mi.onrender.com';

// Create axios instance with auth token
const createAuthInstance = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: `${API_BASE_URL}/api`,
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
      const authInstance = createAuthInstance();
      const response = await authInstance.post('/members/import-csv', {
        members
      });
      console.log('MemberImportApi - Import response:', response.data);
      return response.data;
    } catch (error) {
      console.error('MemberImportApi - Import error:', error);
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
        name: 'John Doe',
        businessName: 'ABC Mandap',
        businessType: 'mandap',
        phone: '9876543210',
        email: 'john@example.com',
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

