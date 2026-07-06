import axios from 'axios';

type APIResponse<T = any> = Promise<T>;

// Vite provides import.meta.env for environment variables
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:8000',
});

export const authAPI = {
  login: async (email: string, password: string): APIResponse => {
    const data = new URLSearchParams();
    data.append('username', email);
    data.append('password', password);
    const response = await api.post('/api/v1/auth/login', data);
    return response.data;
  },
  getMe: async (token: string): APIResponse => {
    const response = await api.get('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  register: async (payload: any): APIResponse => {
    const response = await api.post('/api/v1/auth/register', payload);
    return response.data;
  },
  forgotPassword: async (email: string): APIResponse => {
    const response = await api.post('/api/v1/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (userId: string, otp: string, newPassword: string): APIResponse => {
    const response = await api.post('/api/v1/auth/reset-password', {
      user_id: userId,
      otp,
      new_password: newPassword,
    });
    return response.data;
  },
  verifyMFA: async (userId: string, code: string): APIResponse => {
    const response = await api.post('/api/v1/auth/verify-mfa', {
      user_id: userId,
      code,
    });
    return response.data;
  },
  faceLogin: async (email: string, imageBase64: string): APIResponse => {
    const response = await api.post('/api/v1/auth/face-login', { email, image_base64: imageBase64 });
    return response.data;
  },
  enrollFace: async (userId: string, imageBase64: string): APIResponse => {
    const response = await api.post('/api/v1/auth/enroll-face', { user_id: userId, image_base64: imageBase64 });
    return response.data;
  },
  updateMe: async (updates: any): APIResponse => {
    const token = localStorage.getItem('authToken');
    const response = await api.put('/api/v1/auth/me', updates, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
  changePassword: async (currentPassword: string, newPassword: string): APIResponse => {
    const token = localStorage.getItem('authToken');
    const response = await api.post(
      '/api/v1/auth/change-password',
      { current_password: currentPassword, new_password: newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response;
  },
  toggleMFA: async (): APIResponse => {
    const token = localStorage.getItem('authToken');
    const response = await api.post('/api/v1/auth/toggle-mfa', {}, { headers: { Authorization: `Bearer ${token}` } });
    return response;
  },
};

// Assets API
export const assetsAPI = {
  getAll: async (): APIResponse => api.get('/api/v1/assets'),
  getStats: async (): APIResponse => api.get('/api/v1/assets/stats'),
  create: async (payload: any): APIResponse => api.post('/api/v1/assets', payload),
  delete: async (id: string): APIResponse => api.delete(`/api/v1/assets/${id}`),
};

// Incidents API
export const incidentsAPI = {
  getAll: async (): APIResponse => api.get('/api/v1/incidents'),
  create: async (payload: any): APIResponse => api.post('/api/v1/incidents', payload),
  update: async (id: string, payload: any): APIResponse => api.put(`/api/v1/incidents/${id}`, payload),
  delete: async (id: string): APIResponse => api.delete(`/api/v1/incidents/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (): APIResponse => api.get('/api/v1/dashboard/stats'),
};

// Threats API
export const threatsAPI = {
  getAll: async (): APIResponse => api.get('/api/v1/threats'),
  analyzeURL: async (url: string): APIResponse => api.post('/api/v1/threats/analyze-url', { url }),
  analyzeNetwork: async (data: any[]): APIResponse => api.post('/api/v1/threats/analyze-network', { data }),
};

// Compliance API
export const complianceAPI = {
  getAll: async (): APIResponse => api.get('/api/v1/compliance'),
  // Updated to accept frameworkId, controlId, payload
  updateControl: async (frameworkId: string, controlId: string, payload: any): APIResponse =>
    api.put(`/api/v1/compliance/${frameworkId}/${controlId}`, payload),
};

// AI Assistant API
export const aiAPI = {
  chat: async (messages: any[]): APIResponse => api.post('/api/v1/assistant/chat', { messages }),
  analyzeURL: async (url: string): APIResponse => api.post('/api/v1/threats/analyze-url', { url }),
  analyzeNetwork: async (data: any[]): APIResponse => api.post('/api/v1/threats/analyze-network', { data }),
};
