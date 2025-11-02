import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Collection {
  id: number;
  name: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  digitalItems?: any[];
  physicalItems?: any[];
}

export interface CreateCollectionDto {
  name: string;
  description?: string;
  coverImage?: string;
  isPublic?: boolean;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  coverImage?: string;
  isPublic?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private apiUrl = 'http://localhost:3001/api/collections';

  constructor(private http: HttpClient) {}

  // Get all collections
  getCollections(): Observable<Collection[]> {
    return this.http.get<Collection[]>(this.apiUrl);
  }

  // Get a single collection by ID
  getCollectionById(id: number): Observable<Collection> {
    return this.http.get<Collection>(`${this.apiUrl}/${id}`);
  }

  // Create a new collection
  createCollection(collection: CreateCollectionDto): Observable<Collection> {
    return this.http.post<Collection>(this.apiUrl, collection);
  }

  // Update a collection
  updateCollection(id: number, collection: UpdateCollectionDto): Observable<Collection> {
    return this.http.put<Collection>(`${this.apiUrl}/${id}`, collection);
  }

  // Delete a collection
  deleteCollection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Add a digital item to a collection
  addDigitalItemToCollection(collectionId: number, digitalItemId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${collectionId}/digital-items`, { digitalItemId });
  }

  // Add a physical item to a collection
  addPhysicalItemToCollection(collectionId: number, physicalItemId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${collectionId}/physical-items`, { physicalItemId });
  }

  // Remove a digital item from a collection
  removeDigitalItemFromCollection(collectionId: number, digitalItemId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${collectionId}/digital-items/${digitalItemId}`);
  }

  // Remove a physical item from a collection
  removePhysicalItemFromCollection(collectionId: number, physicalItemId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${collectionId}/physical-items/${physicalItemId}`);
  }
}
