import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface GoogleBooksVolume {
  volumeInfo: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    language?: string;
    averageRating?: number;
  };
}

export interface BookMetadata {
  title: string;
  description?: string;
  authors?: string[];
  publisher?: string;
  publishedYear?: number;
  isbn?: string;
  language?: string;
  pageCount?: number;
  categories?: string[];
  coverImageUrl?: string;
  rating?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleBooksService {
  private apiUrl = 'https://www.googleapis.com/books/v1/volumes';

  constructor(private http: HttpClient) {}

  /**
   * Search for a book by ISBN
   */
  searchByISBN(isbn: string): Observable<BookMetadata | null> {
    // Clean ISBN (remove hyphens and spaces)
    const cleanISBN = isbn.replace(/[-\s]/g, '');

    if (!cleanISBN || cleanISBN.length < 10) {
      return of(null);
    }

    return this.http.get<{ items?: GoogleBooksVolume[] }>(
      `${this.apiUrl}?q=isbn:${cleanISBN}`
    ).pipe(
      map(response => {
        if (!response.items || response.items.length === 0) {
          return null;
        }

        const volume = response.items[0];
        return this.mapToBookMetadata(volume, cleanISBN);
      }),
      catchError(error => {
        console.error('Google Books API error:', error);
        return of(null);
      })
    );
  }

  /**
   * Search for books by title
   */
  searchByTitle(title: string): Observable<BookMetadata[]> {
    if (!title || title.trim().length === 0) {
      return of([]);
    }

    return this.http.get<{ items?: GoogleBooksVolume[] }>(
      `${this.apiUrl}?q=intitle:${encodeURIComponent(title)}&maxResults=10`
    ).pipe(
      map(response => {
        if (!response.items || response.items.length === 0) {
          return [];
        }

        return response.items.map(volume => this.mapToBookMetadata(volume));
      }),
      catchError(error => {
        console.error('Google Books API error:', error);
        return of([]);
      })
    );
  }

  /**
   * Map Google Books volume to our BookMetadata interface
   */
  private mapToBookMetadata(volume: GoogleBooksVolume, isbn?: string): BookMetadata {
    const volumeInfo = volume.volumeInfo;

    // Extract year from publishedDate (format: YYYY-MM-DD or YYYY)
    let publishedYear: number | undefined;
    if (volumeInfo.publishedDate) {
      const year = parseInt(volumeInfo.publishedDate.substring(0, 4), 10);
      if (!isNaN(year)) {
        publishedYear = year;
      }
    }

    // Get ISBN from identifiers if not provided
    let bookISBN = isbn;
    if (!bookISBN && volumeInfo.industryIdentifiers) {
      const isbn13 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_13');
      const isbn10 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_10');
      bookISBN = isbn13?.identifier || isbn10?.identifier;
    }

    // Get cover image URL (prefer thumbnail over smallThumbnail)
    let coverImageUrl: string | undefined;
    if (volumeInfo.imageLinks) {
      coverImageUrl = volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail;
      // Google Books returns http URLs, upgrade to https
      if (coverImageUrl) {
        coverImageUrl = coverImageUrl.replace('http://', 'https://');
      }
    }

    return {
      title: volumeInfo.title || 'Unknown Title',
      description: volumeInfo.description,
      authors: volumeInfo.authors,
      publisher: volumeInfo.publisher,
      publishedYear,
      isbn: bookISBN,
      language: volumeInfo.language,
      pageCount: volumeInfo.pageCount,
      categories: volumeInfo.categories,
      coverImageUrl,
      rating: volumeInfo.averageRating
    };
  }

  /**
   * Download cover image from URL and convert to File
   */
  async downloadCoverImage(url: string): Promise<File | null> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      // Create a File from the Blob
      const filename = `cover-${Date.now()}.jpg`;
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error('Failed to download cover image:', error);
      return null;
    }
  }
}
