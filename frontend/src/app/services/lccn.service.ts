import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs';
import { map } from 'rxjs/operators';

export interface LCCNBookMetadata {
  title: string;
  description?: string;
  authors?: string[];
  publisher?: string;
  publishedYear?: number;
  isbn10?: string;
  isbn13?: string;
  lccn?: string;
  language?: string;
  pageCount?: number;
  categories?: string[];
  coverImage?: string;
  rating?: number;
}

export interface LCCNLookupResponse {
  found: boolean;
  source?: string;
  data?: LCCNBookMetadata;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LCCNService {
  private apiUrl = 'http://localhost:3001/api/lccn';

  constructor(private http: HttpClient) {}

  /**
   * Search for a book by LCCN using the backend API
   */
  searchByLCCN(lccn: string): Observable<LCCNBookMetadata | null> {
    if (!lccn) {
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    }

    return this.http.get<LCCNLookupResponse>(`${this.apiUrl}/lookup/${encodeURIComponent(lccn)}`)
      .pipe(
        map(response => {
          if (response.found && response.data) {
            return response.data;
          }
          return null;
        })
      );
  }

  /**
   * Check if an LCCN already exists in the user's library
   */
  checkDuplicate(lccn: string): Observable<{
    isDuplicate: boolean;
    itemType?: 'physical' | 'digital';
    item?: any;
  }> {
    return this.http.get<any>(`${this.apiUrl}/check-duplicate/${encodeURIComponent(lccn)}`);
  }

  /**
   * Download cover image and convert to File object
   */
  async downloadCoverImage(coverImageUrl: string): Promise<File | null> {
    try {
      // Use backend proxy to bypass CORS restrictions
      const response = await fetch(`http://localhost:3001/public/proxy-image?url=${encodeURIComponent(coverImageUrl)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const filename = `cover_${Date.now()}.jpg`;
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

      return file;
    } catch (error) {
      console.error('Failed to download cover image:', error);
      return null;
    }
  }
}
