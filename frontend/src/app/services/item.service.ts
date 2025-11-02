import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DigitalItem, PhysicalItem } from '../models/item.model';

export interface DigitalItemFilters {
  type?: string;
  format?: string;
  authorId?: number;
  publisherId?: number;
  genreId?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  minRating?: number;
  maxRating?: number;
}

export interface PhysicalItemFilters {
  type?: string;
  condition?: string;
  authorId?: number;
  publisherId?: number;
  genreId?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  minRating?: number;
  maxRating?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  // Digital Items
  getDigitalItems(filters?: DigitalItemFilters): Observable<{ items: DigitalItem[]; total: number }> {
    let params = new HttpParams();

    if (filters) {
      if (filters.type) params = params.set('type', filters.type);
      if (filters.format) params = params.set('format', filters.format);
      if (filters.authorId) params = params.set('authorId', filters.authorId.toString());
      if (filters.publisherId) params = params.set('publisherId', filters.publisherId.toString());
      if (filters.genreId) params = params.set('genreId', filters.genreId.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
      if (filters.minRating !== undefined) params = params.set('minRating', filters.minRating.toString());
      if (filters.maxRating !== undefined) params = params.set('maxRating', filters.maxRating.toString());
    }

    return this.http.get<{ items: DigitalItem[]; total: number }>(`${this.apiUrl}/digital-items`, { params });
  }

  getDigitalItem(id: number): Observable<{ item: DigitalItem }> {
    return this.http.get<{ item: DigitalItem }>(`${this.apiUrl}/digital-items/${id}`);
  }

  createDigitalItem(item: Partial<DigitalItem>): Observable<{ message: string; item: DigitalItem }> {
    return this.http.post<{ message: string; item: DigitalItem }>(`${this.apiUrl}/digital-items`, item);
  }

  updateDigitalItem(id: number, item: Partial<DigitalItem>): Observable<{ message: string; item: DigitalItem }> {
    return this.http.put<{ message: string; item: DigitalItem }>(`${this.apiUrl}/digital-items/${id}`, item);
  }

  deleteDigitalItem(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/digital-items/${id}`);
  }

  // Physical Items
  getPhysicalItems(filters?: PhysicalItemFilters): Observable<{ items: PhysicalItem[]; total: number }> {
    let params = new HttpParams();

    if (filters) {
      if (filters.type) params = params.set('type', filters.type);
      if (filters.condition) params = params.set('condition', filters.condition);
      if (filters.authorId) params = params.set('authorId', filters.authorId.toString());
      if (filters.publisherId) params = params.set('publisherId', filters.publisherId.toString());
      if (filters.genreId) params = params.set('genreId', filters.genreId.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
      if (filters.minRating !== undefined) params = params.set('minRating', filters.minRating.toString());
      if (filters.maxRating !== undefined) params = params.set('maxRating', filters.maxRating.toString());
    }

    return this.http.get<{ items: PhysicalItem[]; total: number }>(`${this.apiUrl}/physical-items`, { params });
  }

  getPhysicalItem(id: number): Observable<{ item: PhysicalItem }> {
    return this.http.get<{ item: PhysicalItem }>(`${this.apiUrl}/physical-items/${id}`);
  }

  createPhysicalItem(item: Partial<PhysicalItem>): Observable<{ message: string; item: PhysicalItem }> {
    return this.http.post<{ message: string; item: PhysicalItem }>(`${this.apiUrl}/physical-items`, item);
  }

  updatePhysicalItem(id: number, item: Partial<PhysicalItem>): Observable<{ message: string; item: PhysicalItem }> {
    return this.http.put<{ message: string; item: PhysicalItem }>(`${this.apiUrl}/physical-items/${id}`, item);
  }

  deletePhysicalItem(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/physical-items/${id}`);
  }

  // Search
  searchAllItems(query: string, limit: number = 50, offset: number = 0): Observable<{ success: boolean; query: string; items: any[]; total: number }> {
    return this.http.get<{ success: boolean; query: string; items: any[]; total: number }>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
  }

  searchDigitalItems(query: string, limit: number = 50, offset: number = 0): Observable<{ success: boolean; query: string; items: DigitalItem[]; total: number }> {
    return this.http.get<{ success: boolean; query: string; items: DigitalItem[]; total: number }>(`${this.apiUrl}/search/digital?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
  }

  searchPhysicalItems(query: string, limit: number = 50, offset: number = 0): Observable<{ success: boolean; query: string; items: PhysicalItem[]; total: number }> {
    return this.http.get<{ success: boolean; query: string; items: PhysicalItem[]; total: number }>(`${this.apiUrl}/search/physical?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
  }

  // Alias for unified search
  searchItems(query: string, limit: number = 50, offset: number = 0): Observable<{ success: boolean; query: string; items: any[]; total: number }> {
    return this.searchAllItems(query, limit, offset);
  }

  // File Upload
  uploadCover(file: File): Observable<{ message: string; url: string; filename: string }> {
    const formData = new FormData();
    formData.append('cover', file);
    return this.http.post<{ message: string; url: string; filename: string }>(`${this.apiUrl}/upload/cover`, formData);
  }

  uploadFile(file: File): Observable<{ message: string; url: string; filename: string; size: number; mimetype: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string; url: string; filename: string; size: number; mimetype: string }>(`${this.apiUrl}/upload/file`, formData);
  }
}
