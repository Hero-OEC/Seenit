import { apiRequest } from "./queryClient";

export interface ApiError {
  message: string;
  errors?: any[];
}

export class ApiClient {
  static async get<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      credentials: "include",
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ 
        message: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(error.message);
    }
    
    return response.json();
  }

  static async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await apiRequest("POST", url, data);
    return response.json();
  }

  static async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await apiRequest("PATCH", url, data);
    return response.json();
  }

  static async delete(url: string): Promise<void> {
    await apiRequest("DELETE", url);
  }
}

// Content API functions
export const contentApi = {
  getAll: () => ApiClient.get<any[]>("/api/content"),
  getByType: (type: string) => ApiClient.get<any[]>(`/api/content/type/${type}`),
  search: (query: string) => ApiClient.get<any[]>(`/api/content/search?q=${encodeURIComponent(query)}`),
  getById: (id: string) => ApiClient.get<any>(`/api/content/${id}`),
};

// User content API functions
export const userContentApi = {
  getAll: (userId: string) => ApiClient.get<any[]>(`/api/users/${userId}/content`),
  getByStatus: (userId: string, status: string) => ApiClient.get<any[]>(`/api/users/${userId}/content/status/${status}`),
  add: (userId: string, data: any) => ApiClient.post(`/api/users/${userId}/content`, data),
  update: (userId: string, contentId: string, data: any) => ApiClient.patch(`/api/users/${userId}/content/${contentId}`, data),
  remove: (userId: string, contentId: string) => ApiClient.delete(`/api/users/${userId}/content/${contentId}`),
  getStats: (userId: string) => ApiClient.get<any>(`/api/users/${userId}/stats`),
};
