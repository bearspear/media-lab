import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DigitalFile } from '../models/item.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DigitalFileService {
  private apiUrl = `${environment.apiUrl}/digital`;

  constructor(private http: HttpClient) {}

  /**
   * Get all files for a digital item
   */
  getFilesForItem(itemId: number): Observable<{ files: DigitalFile[] }> {
    return this.http.get<{ files: DigitalFile[] }>(`${this.apiUrl}/items/${itemId}/files`);
  }

  /**
   * Add a new file to a digital item
   */
  addFileToItem(itemId: number, fileData: {
    format: string;
    filePath: string;
    fileSize?: number;
    version?: string;
    notes?: string;
    isPrimary?: boolean;
  }): Observable<{ file: DigitalFile }> {
    return this.http.post<{ file: DigitalFile }>(`${this.apiUrl}/items/${itemId}/files`, fileData);
  }

  /**
   * Update a digital file
   */
  updateFile(fileId: number, fileData: {
    format?: string;
    filePath?: string;
    fileSize?: number;
    version?: string;
    notes?: string;
    isPrimary?: boolean;
  }): Observable<{ file: DigitalFile }> {
    return this.http.put<{ file: DigitalFile }>(`${this.apiUrl}/files/${fileId}`, fileData);
  }

  /**
   * Delete a digital file
   */
  deleteFile(fileId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/files/${fileId}`);
  }

  /**
   * Set a file as primary
   */
  setPrimaryFile(fileId: number): Observable<{ file: DigitalFile }> {
    return this.http.patch<{ file: DigitalFile }>(`${this.apiUrl}/files/${fileId}/primary`, {});
  }

  /**
   * Format file size to human-readable format
   */
  formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown size';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Get format display name
   */
  getFormatDisplayName(format: string): string {
    const formatMap: { [key: string]: string } = {
      'epub': 'EPUB',
      'pdf': 'PDF',
      'mobi': 'MOBI',
      'azw3': 'AZW3',
      'mp3': 'MP3',
      'm4a': 'M4A',
      'mp4': 'MP4',
      'mkv': 'MKV',
      'avi': 'AVI',
      'flac': 'FLAC',
      'wav': 'WAV',
      'other': 'Other'
    };

    return formatMap[format.toLowerCase()] || format.toUpperCase();
  }
}
