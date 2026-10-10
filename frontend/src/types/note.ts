export type ResourceType =
  | 'pdf'
  | 'doc'
  | 'docx'
  | 'image'
  | 'typed'
  | 'video_link'
  | 'website_link';

export interface Note {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  unit_number: number | null;
  topic: string | null;
  class_date: string | null;
  resource_type: ResourceType;
  typed_content?: string | null;
  external_url?: string | null;
  original_filename?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  created_at: string;
  updated_at: string;
}

export interface NoteCreateResponse {
  note: Note;
  deletion_token: string;
}

export interface NoteListResponse {
  items: Note[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SubjectsResponse {
  subjects: string[];
  total: number;
}

export interface StatsResponse {
  total_notes: number;
  total_subjects: number;
}

export interface NoteFilters {
  search?: string;
  subject?: string;
  resource_type?: ResourceType | '';
  unit_number?: number;
  class_date?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  page_size?: number;
}
