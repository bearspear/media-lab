import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Tag {
  id: number;
  userId: number;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  digitalItems?: Array<{
    id: number;
    title: string;
    coverImage?: string;
    type?: string;
  }>;
  physicalItems?: Array<{
    id: number;
    title: string;
    coverImage?: string;
    type?: string;
  }>;
}

export interface CreateTagDto {
  name: string;
  color?: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private apiUrl = `${environment.apiUrl}/tags`;

  constructor(private http: HttpClient) {}

  getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.apiUrl);
  }

  getTagById(id: number): Observable<Tag> {
    return this.http.get<Tag>(`${this.apiUrl}/${id}`);
  }

  createTag(tag: CreateTagDto): Observable<Tag> {
    return this.http.post<Tag>(this.apiUrl, tag);
  }

  updateTag(id: number, tag: UpdateTagDto): Observable<Tag> {
    return this.http.put<Tag>(`${this.apiUrl}/${id}`, tag);
  }

  deleteTag(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addTagToDigitalItem(tagId: number, digitalItemId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/${tagId}/digital-items`,
      { digitalItemId }
    );
  }

  addTagToPhysicalItem(tagId: number, physicalItemId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/${tagId}/physical-items`,
      { physicalItemId }
    );
  }

  removeTagFromDigitalItem(tagId: number, digitalItemId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${tagId}/digital-items/${digitalItemId}`
    );
  }

  removeTagFromPhysicalItem(tagId: number, physicalItemId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${tagId}/physical-items/${physicalItemId}`
    );
  }
}
