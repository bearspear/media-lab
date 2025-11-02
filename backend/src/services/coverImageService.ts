import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { isbnLookupService } from './isbnLookupService';
import { lccnLookupService } from './lccnLookupService';

export class CoverImageService {
  private readonly uploadDir = path.join(__dirname, '../../uploads');
  private readonly coversDir = path.join(this.uploadDir, 'covers');

  constructor() {
    // Ensure covers directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.coversDir)) {
      fs.mkdirSync(this.coversDir, { recursive: true });
    }
  }

  /**
   * Fetch and download cover image for a book with ISBN
   * Returns the local file path or null if no cover found
   */
  async fetchCoverByISBN(isbn: string): Promise<string | null> {
    if (!isbn) {
      return null;
    }

    try {
      // Use ISBN lookup service to get book metadata including cover URL
      const bookMetadata = await isbnLookupService.lookupByISBN(isbn);

      if (!bookMetadata || !bookMetadata.coverImage) {
        console.log(`No cover image found for ISBN: ${isbn}`);
        return null;
      }

      // Download and save the cover image
      return await this.downloadAndSaveImage(bookMetadata.coverImage, isbn);
    } catch (error) {
      console.error(`Error fetching cover for ISBN ${isbn}:`, error);
      return null;
    }
  }

  /**
   * Fetch and download cover image for a book with LCCN
   * Returns the local file path or null if no cover found
   */
  async fetchCoverByLCCN(lccn: string): Promise<string | null> {
    if (!lccn) {
      return null;
    }

    try {
      // Use LCCN lookup service to get book metadata including cover URL
      const bookMetadata = await lccnLookupService.lookupByLCCN(lccn);

      if (!bookMetadata || !bookMetadata.coverImage) {
        console.log(`No cover image found for LCCN: ${lccn}`);
        return null;
      }

      // Download and save the cover image
      return await this.downloadAndSaveImage(bookMetadata.coverImage, lccn);
    } catch (error) {
      console.error(`Error fetching cover for LCCN ${lccn}:`, error);
      return null;
    }
  }

  /**
   * Download cover image from URL and save it locally
   * Returns the relative path to the saved image
   */
  async downloadAndSaveImage(imageUrl: string, isbn: string): Promise<string | null> {
    try {
      // Fetch the image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LibraryManagementSystem/1.0)',
        },
      });

      // Determine file extension from content type
      const contentType = response.headers['content-type'] || '';
      let extension = '.jpg';

      if (contentType.includes('png')) {
        extension = '.png';
      } else if (contentType.includes('gif')) {
        extension = '.gif';
      } else if (contentType.includes('webp')) {
        extension = '.webp';
      }

      // Generate filename based on ISBN
      const sanitizedISBN = isbn.replace(/[^a-zA-Z0-9]/g, '');
      const filename = `cover-${sanitizedISBN}-${Date.now()}${extension}`;
      const filepath = path.join(this.coversDir, filename);

      // Save the image
      fs.writeFileSync(filepath, response.data);

      // Return relative path from uploads directory
      return path.join('covers', filename);
    } catch (error) {
      console.error(`Error downloading image from ${imageUrl}:`, error);
      return null;
    }
  }

  /**
   * Download cover image from a direct URL (e.g., from Libib export)
   * Returns the relative path to the saved image
   */
  async downloadFromURL(imageUrl: string, itemTitle: string = 'unknown'): Promise<string | null> {
    try {
      // Fetch the image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LibraryManagementSystem/1.0)',
        },
      });

      // Determine file extension from content type
      const contentType = response.headers['content-type'] || '';
      let extension = '.jpg';

      if (contentType.includes('png')) {
        extension = '.png';
      } else if (contentType.includes('gif')) {
        extension = '.gif';
      } else if (contentType.includes('webp')) {
        extension = '.webp';
      }

      // Generate filename based on title
      const sanitizedTitle = itemTitle
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .substring(0, 50);
      const filename = `cover-${sanitizedTitle}-${Date.now()}${extension}`;
      const filepath = path.join(this.coversDir, filename);

      // Save the image
      fs.writeFileSync(filepath, response.data);

      // Return relative path from uploads directory
      return path.join('covers', filename);
    } catch (error) {
      console.error(`Error downloading image from ${imageUrl}:`, error);
      return null;
    }
  }

  /**
   * Delete a cover image file
   */
  deleteCoverImage(relativePath: string): boolean {
    try {
      const filepath = path.join(this.uploadDir, relativePath);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting cover image ${relativePath}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const coverImageService = new CoverImageService();
