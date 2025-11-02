import axios from 'axios';

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

export class ISBNLookupService {
  private cache: Map<string, { data: BookMetadata; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Lookup book metadata by ISBN
   * Tries Google Books API first, then falls back to Open Library
   */
  async lookupByISBN(isbn: string): Promise<BookMetadata | null> {
    // Normalize ISBN
    const normalizedISBN = this.normalizeISBN(isbn);

    // Validate ISBN format
    if (!this.validateISBN(normalizedISBN)) {
      throw new Error('Invalid ISBN format');
    }

    // Check cache first
    const cached = this.getFromCache(normalizedISBN);
    if (cached) {
      return cached;
    }

    // Try Google Books API first
    try {
      const googleData = await this.fetchFromGoogleBooks(normalizedISBN);
      if (googleData) {
        this.addToCache(normalizedISBN, googleData);
        return googleData;
      }
    } catch (error) {
      console.error('Google Books API error:', error);
    }

    // Fallback to Open Library API
    try {
      const openLibraryData = await this.fetchFromOpenLibrary(normalizedISBN);
      if (openLibraryData) {
        this.addToCache(normalizedISBN, openLibraryData);
        return openLibraryData;
      }
    } catch (error) {
      console.error('Open Library API error:', error);
    }

    return null;
  }

  /**
   * Fetch book metadata from Google Books API
   */
  private async fetchFromGoogleBooks(isbn: string): Promise<BookMetadata | null> {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
        { timeout: 5000 }
      );

      if (!response.data.items || response.data.items.length === 0) {
        return null;
      }

      const book = response.data.items[0].volumeInfo;

      // Extract ISBN-10 and ISBN-13
      let isbn10: string | undefined;
      let isbn13: string | undefined;

      if (book.industryIdentifiers) {
        book.industryIdentifiers.forEach((identifier: any) => {
          if (identifier.type === 'ISBN_10') {
            isbn10 = identifier.identifier;
          } else if (identifier.type === 'ISBN_13') {
            isbn13 = identifier.identifier;
          }
        });
      }

      // If we don't have both, use the input ISBN
      if (!isbn10 && !isbn13) {
        if (isbn.length === 10) {
          isbn10 = isbn;
        } else if (isbn.length === 13) {
          isbn13 = isbn;
        }
      }

      return {
        isbn10,
        isbn13,
        title: book.title || 'Unknown',
        authors: book.authors || [],
        publisher: book.publisher,
        publishedYear: book.publishedDate ? parseInt(book.publishedDate.substring(0, 4)) : undefined,
        description: book.description,
        coverImage: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail,
        pageCount: book.pageCount,
        language: book.language,
        categories: book.categories,
      };
    } catch (error) {
      console.error('Error fetching from Google Books:', error);
      return null;
    }
  }

  /**
   * Fetch book metadata from Open Library API
   */
  private async fetchFromOpenLibrary(isbn: string): Promise<BookMetadata | null> {
    try {
      const response = await axios.get(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
        { timeout: 5000 }
      );

      const bookKey = `ISBN:${isbn}`;
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

      // Determine ISBN-10 and ISBN-13
      let isbn10: string | undefined;
      let isbn13: string | undefined;

      if (isbn.length === 10) {
        isbn10 = isbn;
        isbn13 = book.identifiers?.isbn_13?.[0];
      } else if (isbn.length === 13) {
        isbn13 = isbn;
        isbn10 = book.identifiers?.isbn_10?.[0];
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
        language: undefined, // Open Library doesn't always provide language in this format
        categories: book.subjects?.map((subject: any) => subject.name).slice(0, 5),
      };
    } catch (error) {
      console.error('Error fetching from Open Library:', error);
      return null;
    }
  }

  /**
   * Normalize ISBN by removing hyphens, spaces, and converting to uppercase
   */
  private normalizeISBN(isbn: string): string {
    return isbn.replace(/[-\s]/g, '').toUpperCase();
  }

  /**
   * Validate ISBN format (ISBN-10 or ISBN-13)
   */
  private validateISBN(isbn: string): boolean {
    if (isbn.length === 10) {
      return this.validateISBN10(isbn);
    } else if (isbn.length === 13) {
      return this.validateISBN13(isbn);
    }
    return false;
  }

  /**
   * Validate ISBN-10 format with checksum
   */
  private validateISBN10(isbn: string): boolean {
    if (!/^[0-9]{9}[0-9X]$/i.test(isbn)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(isbn[i]) * (10 - i);
    }

    const checkDigit = isbn[9] === 'X' ? 10 : parseInt(isbn[9]);
    sum += checkDigit;

    return sum % 11 === 0;
  }

  /**
   * Validate ISBN-13 format with checksum
   */
  private validateISBN13(isbn: string): boolean {
    if (!/^[0-9]{13}$/.test(isbn)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = parseInt(isbn[12]);
    const calculatedCheck = (10 - (sum % 10)) % 10;

    return checkDigit === calculatedCheck;
  }

  /**
   * Get book metadata from cache
   */
  private getFromCache(isbn: string): BookMetadata | null {
    const cached = this.cache.get(isbn);
    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(isbn);
      return null;
    }

    return cached.data;
  }

  /**
   * Add book metadata to cache
   */
  private addToCache(isbn: string, data: BookMetadata): void {
    this.cache.set(isbn, {
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
export const isbnLookupService = new ISBNLookupService();
