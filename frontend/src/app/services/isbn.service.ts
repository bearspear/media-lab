import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface BookMetadata {
  isbn10?: string;
  isbn13?: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedYear?: number;
  description?: string;
  coverImage?: string;
  pageCount?: number;
  language?: string;
  categories?: string[];
}

export interface ISBNLookupResponse {
  found: boolean;
  source?: string;
  data?: BookMetadata;
  error?: string;
  message?: string;
}

export interface ISBNValidationResponse {
  valid: boolean;
  isbn: string;
  format?: string;
  error?: string;
}

export interface ISBNDuplicateCheckResponse {
  isDuplicate: boolean;
  itemType?: 'physical' | 'digital' | null;
  item?: {
    id: number;
    title: string;
    isbn: string;
    coverImage?: string;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class ISBNService {
  private apiUrl = 'http://localhost:3001/api/isbn';
  private cache: Map<string, ISBNLookupResponse> = new Map();

  constructor(private http: HttpClient) {}

  /**
   * Lookup book metadata by ISBN
   * Uses cache to avoid redundant API calls
   */
  lookupISBN(isbn: string): Observable<ISBNLookupResponse> {
    // Normalize ISBN
    const normalizedISBN = this.normalizeISBN(isbn);

    // Check cache first
    if (this.cache.has(normalizedISBN)) {
      return new Observable(observer => {
        observer.next(this.cache.get(normalizedISBN)!);
        observer.complete();
      });
    }

    return this.http.get<ISBNLookupResponse>(`${this.apiUrl}/lookup/${normalizedISBN}`).pipe(
      tap(response => {
        // Cache successful lookups
        if (response.found && response.data) {
          this.cache.set(normalizedISBN, response);
        }
      })
    );
  }

  /**
   * Validate ISBN format without doing a full lookup
   */
  validateISBN(isbn: string): Observable<ISBNValidationResponse> {
    const normalizedISBN = this.normalizeISBN(isbn);
    return this.http.get<ISBNValidationResponse>(`${this.apiUrl}/validate/${normalizedISBN}`);
  }

  /**
   * Check if ISBN already exists in the user's library
   */
  checkDuplicate(isbn: string): Observable<ISBNDuplicateCheckResponse> {
    const normalizedISBN = this.normalizeISBN(isbn);
    return this.http.get<ISBNDuplicateCheckResponse>(`${this.apiUrl}/check-duplicate/${normalizedISBN}`);
  }

  /**
   * Normalize ISBN by removing hyphens and spaces
   */
  private normalizeISBN(isbn: string): string {
    return isbn.replace(/[-\s]/g, '').toUpperCase();
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Client-side ISBN validation (quick check before API call)
   */
  isValidISBNFormat(isbn: string): boolean {
    const normalized = this.normalizeISBN(isbn);

    // Check if it's 10 or 13 digits (last digit of ISBN-10 can be 'X')
    if (normalized.length === 10) {
      return /^[0-9]{9}[0-9X]$/i.test(normalized);
    } else if (normalized.length === 13) {
      return /^[0-9]{13}$/.test(normalized);
    }

    return false;
  }

  /**
   * Format ISBN with hyphens for display
   * Note: This is a simple formatting, not the official ISBN hyphenation
   */
  formatISBN(isbn: string): string {
    const normalized = this.normalizeISBN(isbn);

    if (normalized.length === 10) {
      // Simple ISBN-10 formatting: X-XXX-XXXXX-X
      return `${normalized.substring(0, 1)}-${normalized.substring(1, 4)}-${normalized.substring(4, 9)}-${normalized.substring(9)}`;
    } else if (normalized.length === 13) {
      // Simple ISBN-13 formatting: XXX-X-XXX-XXXXX-X
      return `${normalized.substring(0, 3)}-${normalized.substring(3, 4)}-${normalized.substring(4, 7)}-${normalized.substring(7, 12)}-${normalized.substring(12)}`;
    }

    return isbn;
  }
}
