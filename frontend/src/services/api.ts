import { Note, NoteCreateResponse, NoteFilters, NoteListResponse, StatsResponse, SubjectsResponse } from '../types/note';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred.';
    let errorData = null;
    try {
      errorData = await response.json();
      if (typeof errorData?.detail === 'string') {
        errorDetail = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        errorDetail = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
      }
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new ApiError(errorDetail, response.status, errorData);
  }

  return response.json();
}

export const apiService = {
  async getNotes(filters: NoteFilters = {}): Promise<NoteListResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.resource_type) params.append('resource_type', filters.resource_type);
    if (filters.unit_number !== undefined && filters.unit_number !== null) {
      params.append('unit_number', filters.unit_number.toString());
    }
    if (filters.class_date) params.append('class_date', filters.class_date);
    if (filters.sort) params.append('sort', filters.sort);

    const queryString = params.toString();
    return request<NoteListResponse>(`/notes${queryString ? `?${queryString}` : ''}`);
  },

  async getNote(id: string): Promise<Note> {
    return request<Note>(`/notes/${id}`);
  },

  async createNote(formData: FormData): Promise<NoteCreateResponse> {
    return request<NoteCreateResponse>('/notes', {
      method: 'POST',
      body: formData,
    });
  },

  async getDownloadUrl(id: string): Promise<string> {
    const res = await request<{ download_url: string }>(`/notes/${id}/download`);
    return res.download_url;
  },

  async deleteNote(id: string, deletionToken: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/notes/${id}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deletion_token: deletionToken }),
    });
  },

  async getSubjects(): Promise<SubjectsResponse> {
    return request<SubjectsResponse>('/subjects');
  },

  async getStats(): Promise<StatsResponse> {
    return request<StatsResponse>('/stats');
  },

  async getHealth(): Promise<{ status: string; database: boolean; storage: boolean }> {
    return request('/health');
  },
};
