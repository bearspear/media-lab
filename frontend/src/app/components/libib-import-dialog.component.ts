import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import { FileUploadModule } from 'primeng/fileupload';
import { ExportImportService, ImportResult } from '../services/export-import.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-libib-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    ProgressBarModule,
    MessageModule,
    FileUploadModule
  ],
  template: `
    <p-dialog
      header="Import from Libib CSV"
      [(visible)]="visible"
      [modal]="true"
      [style]="{width: '600px'}"
      [draggable]="false"
      (onHide)="onCancel()"
    >
      <div class="libib-import-dialog-content">
        <p class="description">
          Import your library data from a Libib CSV export file.
        </p>

        <div class="instructions" *ngIf="!importing && !importResult">
          <h4>Instructions:</h4>
          <ol>
            <li>Log in to your Libib account</li>
            <li>Go to <strong>Library Settings</strong> > <strong>Export</strong></li>
            <li>Download your library as <strong>CSV</strong></li>
            <li>Upload the CSV file below</li>
          </ol>
        </div>

        <div class="upload-area" *ngIf="!importing && !importResult">
          <p-fileUpload
            mode="basic"
            chooseLabel="Select CSV File"
            accept=".csv"
            [maxFileSize]="10000000"
            [auto]="false"
            (onSelect)="onFileSelect($event)"
            [disabled]="importing"
          ></p-fileUpload>

          <div class="selected-file" *ngIf="selectedFile">
            <i class="pi pi-file"></i>
            <span>{{ selectedFile.name }}</span>
            <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
          </div>
        </div>

        <div class="import-progress" *ngIf="importing">
          <p-progressBar mode="indeterminate"></p-progressBar>
          <p class="progress-text">Importing your library data...</p>
        </div>

        <div class="import-result" *ngIf="importResult">
          <p-message
            *ngIf="importResult.success"
            severity="success"
            [text]="importResult.message"
          ></p-message>

          <p-message
            *ngIf="!importResult.success"
            severity="error"
            [text]="importResult.message || 'Import failed'"
          ></p-message>

          <div class="result-stats" *ngIf="importResult.success">
            <h4>Import Summary:</h4>
            <ul>
              <li *ngIf="importResult.imported.physicalItems">
                <strong>{{ importResult.imported.physicalItems }}</strong> physical items imported
              </li>
              <li *ngIf="importResult.imported.digitalItems">
                <strong>{{ importResult.imported.digitalItems }}</strong> digital items imported
              </li>
              <li *ngIf="importResult.imported.skipped">
                <strong>{{ importResult.imported.skipped }}</strong> items skipped
              </li>
            </ul>

            <div class="errors" *ngIf="importResult.imported.errors && importResult.imported.errors.length > 0">
              <h4>Errors:</h4>
              <ul class="error-list">
                <li *ngFor="let error of importResult.imported.errors">{{ error }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <button
            pButton
            label="Cancel"
            icon="pi pi-times"
            class="p-button-text"
            (click)="onCancel()"
            [disabled]="importing"
          ></button>
          <button
            *ngIf="!importResult"
            pButton
            label="Import"
            icon="pi pi-upload"
            class="p-button-primary"
            (click)="onImport()"
            [disabled]="!selectedFile || importing"
          ></button>
          <button
            *ngIf="importResult"
            pButton
            label="Done"
            icon="pi pi-check"
            class="p-button-success"
            (click)="onDone()"
          ></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .libib-import-dialog-content {
      padding: 1rem 0;
    }

    .description {
      margin-bottom: 1.5rem;
      color: #666;
    }

    .instructions {
      background-color: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
    }

    .instructions h4 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .instructions ol {
      margin: 0;
      padding-left: 1.5rem;
    }

    .instructions li {
      margin-bottom: 0.5rem;
      color: #555;
    }

    .upload-area {
      margin: 1.5rem 0;
    }

    .selected-file {
      margin-top: 1rem;
      padding: 0.75rem;
      background-color: #e3f2fd;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .selected-file i {
      color: #1976d2;
    }

    .file-size {
      color: #666;
      font-size: 0.9rem;
      margin-left: auto;
    }

    .import-progress {
      margin: 2rem 0;
    }

    .progress-text {
      text-align: center;
      margin-top: 1rem;
      color: #666;
    }

    .import-result {
      margin: 1rem 0;
    }

    .result-stats {
      margin-top: 1.5rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 4px;
    }

    .result-stats h4 {
      margin-top: 0;
      margin-bottom: 0.75rem;
      color: #333;
    }

    .result-stats ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .result-stats li {
      padding: 0.5rem 0;
      border-bottom: 1px solid #dee2e6;
    }

    .result-stats li:last-child {
      border-bottom: none;
    }

    .errors {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 2px solid #dee2e6;
    }

    .error-list {
      max-height: 200px;
      overflow-y: auto;
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .error-list li {
      padding: 0.5rem;
      background-color: #ffebee;
      border-radius: 4px;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      color: #c62828;
      border-bottom: none;
    }

    .dialog-footer {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
  `]
})
export class LibibImportDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() importSuccess = new EventEmitter<void>();

  selectedFile: File | null = null;
  importing = false;
  importResult: ImportResult | null = null;

  constructor(
    private exportImportService: ExportImportService,
    private messageService: MessageService
  ) {}

  onFileSelect(event: any): void {
    if (event.files && event.files.length > 0) {
      this.selectedFile = event.files[0];
    }
  }

  onImport(): void {
    if (!this.selectedFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No File Selected',
        detail: 'Please select a CSV file to import'
      });
      return;
    }

    this.importing = true;
    this.exportImportService.importLibibCSV(this.selectedFile).subscribe({
      next: (result) => {
        this.importing = false;
        this.importResult = result;

        if (result.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Import Successful',
            detail: `Imported ${result.imported.physicalItems + result.imported.digitalItems} items`
          });
          this.importSuccess.emit();
        }
      },
      error: (error) => {
        this.importing = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Import Failed',
          detail: error.error?.error || 'Failed to import Libib CSV'
        });
        this.importResult = {
          success: false,
          message: error.error?.error || 'Import failed',
          imported: {
            digitalItems: 0,
            physicalItems: 0
          }
        };
      }
    });
  }

  onCancel(): void {
    if (!this.importing) {
      this.visible = false;
      this.visibleChange.emit(false);
      this.reset();
    }
  }

  onDone(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.reset();
  }

  reset(): void {
    this.selectedFile = null;
    this.importing = false;
    this.importResult = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
