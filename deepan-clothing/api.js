// API Service for Deepan Clothing
const API_BASE_URL = 'http://localhost:3000/api';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'API call failed');
    }
    
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Products API
export const productsAPI = {
  getAll: () => apiCall('/products'),
  create: (product) => apiCall('/products', 'POST', product),
  delete: (id) => apiCall(`/products/${id}`, 'DELETE'),
};

// Orders API
export const ordersAPI = {
  getAll: () => apiCall('/orders'),
  create: (order) => apiCall('/orders', 'POST', order),
  updateStatus: (id, status) => apiCall(`/orders/${id}/status`, 'PUT', { status }),
};

// Users API
export const usersAPI = {
  getAll: () => apiCall('/users'),
  create: (user) => apiCall('/users', 'POST', user),
};

// Settings API
export const settingsAPI = {
  get: () => apiCall('/settings'),
  update: (settings) => apiCall('/settings', 'PUT', settings),
};

// Health check
export const healthCheck = () => apiCall('/health');
