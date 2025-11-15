import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, interval } from 'rxjs';
import { debounce } from 'rxjs/operators';
import { ReadingProgress, SaveProgressRequest } from '../models/reading-progress.model';

@Injectable({
  providedIn: 'root'
})
export class ReadingProgressService {
  private apiUrl = 'http://localhost:3001/api/reading-progress';

  // Subject for auto-saving progress (debounced)
  private progressUpdate$ = new Subject<SaveProgressRequest>();

  constructor(private http: HttpClient) {
    // Auto-save with debounce (save at most once every 2 seconds)
    this.progressUpdate$
      .pipe(debounce(() => interval(2000)))
      .subscribe(progress => {
        this.saveProgress(progress).subscribe({
          next: () => console.log('Progress auto-saved'),
          error: (err) => console.error('Failed to auto-save progress:', err)
        });
      });
  }

  // Get progress for a specific item
  getProgress(itemId: number, fileId?: number): Observable<{ progress: ReadingProgress }> {
    let params = new HttpParams();
    if (fileId) {
      params = params.set('fileId', fileId.toString());
    }
    return this.http.get<{ progress: ReadingProgress }>(`${this.apiUrl}/${itemId}`, { params });
  }

  // Save or update progress
  saveProgress(data: SaveProgressRequest): Observable<{ message: string; progress: ReadingProgress }> {
    return this.http.post<{ message: string; progress: ReadingProgress }>(this.apiUrl, data);
  }

  // Auto-save progress (debounced)
  updateProgress(progress: SaveProgressRequest): void {
    this.progressUpdate$.next(progress);
  }

  // Force immediate save (bypass debounce)
  saveProgressImmediately(data: SaveProgressRequest): Observable<{ message: string; progress: ReadingProgress }> {
    return this.saveProgress(data);
  }

  // Get recent reading activity
  getRecentProgress(limit: number = 10): Observable<{ progress: ReadingProgress[]; total: number }> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<{ progress: ReadingProgress[]; total: number }>(`${this.apiUrl}/recent`, { params });
  }

  // Get all progress
  getAllProgress(): Observable<{ progress: ReadingProgress[]; total: number }> {
    return this.http.get<{ progress: ReadingProgress[]; total: number }>(`${this.apiUrl}/all`);
  }

  // Delete progress
  deleteProgress(itemId: number, fileId?: number): Observable<{ message: string }> {
    let params = new HttpParams();
    if (fileId) {
      params = params.set('fileId', fileId.toString());
    }
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${itemId}`, { params });
  }
}
