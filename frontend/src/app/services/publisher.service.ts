import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Publisher {
  id: number;
  name: string;
  website?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PublisherService {
  private apiUrl = 'http://localhost:3001/api/publishers';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Publisher[]> {
    return this.http.get<Publisher[]>(this.apiUrl);
  }

  getById(id: number): Observable<Publisher> {
    return this.http.get<Publisher>(`${this.apiUrl}/${id}`);
  }

  search(query: string): Observable<Publisher[]> {
    return this.http.get<Publisher[]>(`${this.apiUrl}/search/${query}`);
  }

  create(publisher: Partial<Publisher>): Observable<Publisher> {
    return this.http.post<Publisher>(this.apiUrl, publisher);
  }

  update(id: number, publisher: Partial<Publisher>): Observable<Publisher> {
    return this.http.put<Publisher>(`${this.apiUrl}/${id}`, publisher);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
