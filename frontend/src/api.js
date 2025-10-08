// api.js - Frontend API client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    // Si es FormData, eliminar Content-Type para que el browser lo configure
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/';
        throw new Error('No autorizado');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en la solicitud');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data.user;
  }

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  logout() {
    this.clearToken();
  }

  // Documents endpoints
  async getDocuments(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const queryString = params.toString();
    return this.request(`/api/documents${queryString ? '?' + queryString : ''}`);
  }

  async uploadDocument(file, metadata) {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });

    return this.request('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async deleteDocument(id) {
    return this.request(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreDocument(id) {
    return this.request(`/api/documents/${id}/restore`, {
      method: 'POST',
    });
  }

  // Chat endpoints
  async sendQuery(message, conversationId = null) {
    return this.request('/api/chat/query', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    });
  }

  async getConversations() {
    return this.request('/api/conversations');
  }

  async getConversationMessages(conversationId) {
    return this.request(`/api/conversations/${conversationId}/messages`);
  }

  // Analytics endpoints
  async getAnalytics() {
    return this.request('/api/analytics/stats');
  }

  // User management endpoints
  async getUsers() {
    return this.request('/api/users');
  }

  async updateUserStatus(userId, active) {
    return this.request(`/api/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiClient();