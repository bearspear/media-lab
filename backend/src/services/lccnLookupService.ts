import axios from 'axios';
import { BookMetadata } from './isbnLookupService';

export class LCCNLookupService {
  private cache: Map<string, { data: BookMetadata; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Lookup book metadata by LCCN (Library of Congress Control Number)
   * Uses Open Library API
   */
  async lookupByLCCN(lccn: string): Promise<BookMetadata | null> {
    // Normalize LCCN (remove spaces and special characters)
    const normalizedLCCN = this.normalizeLCCN(lccn);

    if (!normalizedLCCN) {
      return null;
    }

    // Check cache first
    const cached = this.getFromCache(normalizedLCCN);
    if (cached) {
      return cached;
    }

    // Try Open Library API
    try {
      const openLibraryData = await this.fetchFromOpenLibrary(normalizedLCCN);
      if (openLibraryData) {
        this.addToCache(normalizedLCCN, openLibraryData);
        return openLibraryData;
      }
    } catch (error) {
      console.error('Open Library LCCN API error:', error);
    }

    return null;
  }

  /**
   * Fetch book metadata from Open Library API using LCCN
   */
  private async fetchFromOpenLibrary(lccn: string): Promise<BookMetadata | null> {
    try {
      const response = await axios.get(
        `https://openlibrary.org/api/books?bibkeys=LCCN:${lccn}&format=json&jscmd=data`,
        { timeout: 5000 }
      );

      const bookKey = `LCCN:${lccn}`;
      const book = response.data[bookKey];

      if (!book) {
        return null;
      }

      // Extract authors
      const authors = book.authors?.map((author: any) => author.name) || [];

      // Extract publishers
      const publisher = book.publishers?.[0]?.name;

      // Extract published year
      let publishedYear: number | undefined;
      if (book.publish_date) {
        const yearMatch = book.publish_date.match(/\d{4}/);
        if (yearMatch) {
          publishedYear = parseInt(yearMatch[0]);
        }
      }

      // Extract ISBNs if available
      let isbn10: string | undefined;
      let isbn13: string | undefined;

      if (book.identifiers?.isbn_10?.[0]) {
        isbn10 = book.identifiers.isbn_10[0];
      }
      if (book.identifiers?.isbn_13?.[0]) {
        isbn13 = book.identifiers.isbn_13[0];
      }

      return {
        isbn10,
        isbn13,
        title: book.title || 'Unknown',
        authors,
        publisher,
        publishedYear,
        description: book.notes || book.subtitle,
        coverImage: book.cover?.large || book.cover?.medium || book.cover?.small,
        pageCount: book.number_of_pages,
        language: undefined,
        categories: book.subjects?.map((subject: any) => subject.name).slice(0, 5),
      };
    } catch (error) {
      console.error('Error fetching from Open Library (LCCN):', error);
      return null;
    }
  }

  /**
   * Normalize LCCN by removing spaces, hyphens, and converting to lowercase
   */
  private normalizeLCCN(lccn: string): string {
    if (!lccn) return '';
    // Remove spaces, hyphens, and other common separators
    return lccn.replace(/[\s-]/g, '').toLowerCase();
  }

  /**
   * Get book metadata from cache
   */
  private getFromCache(lccn: string): BookMetadata | null {
    const cached = this.cache.get(lccn);
    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(lccn);
      return null;
    }

    return cached.data;
  }

  /**
   * Add book metadata to cache
   */
  private addToCache(lccn: string, data: BookMetadata): void {
    this.cache.set(lccn, {
      data,
      timestamp: Date.now(),
    });

    // Clean up old cache entries if cache gets too large
    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.CACHE_DURATION) {
          this.cache.delete(key);
        }
      }
    }
  }
}

// Export singleton instance
export const lccnLookupService = new LCCNLookupService();
