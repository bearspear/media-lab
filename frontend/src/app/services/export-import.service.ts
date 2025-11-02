import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ImportResult {
  success: boolean;
  message: string;
  imported: {
    digitalItems: number;
    physicalItems: number;
    collections?: number;
    tags?: number;
    skipped?: number;
    errors?: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ExportImportService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  // Export library data as JSON
  exportJSON(): void {
    const url = `${this.apiUrl}/export/json`;
    window.open(url, '_blank');
  }

  // Export library data as CSV
  exportCSV(): void {
    const url = `${this.apiUrl}/export/csv`;
    window.open(url, '_blank');
  }

  // Import library data from JSON
  importJSON(jsonData: any): Observable<ImportResult> {
    return this.http.post<ImportResult>(`${this.apiUrl}/import/json`, jsonData);
  }

  // Helper method to read a file and parse JSON
  readJSONFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Import library data from Libib CSV export
  importLibibCSV(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResult>(`${this.apiUrl}/import/libib-csv`, formData);
  }
}
