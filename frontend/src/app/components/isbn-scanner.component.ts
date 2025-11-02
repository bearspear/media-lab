import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ISBNService, BookMetadata, ISBNLookupResponse, ISBNDuplicateCheckResponse } from '../services/isbn.service';
import { forkJoin } from 'rxjs';

interface ScanHistoryItem {
  isbn: string;
  timestamp: Date;
  status: 'loading' | 'success' | 'error';
  data?: BookMetadata;
  error?: string;
  isDuplicate?: boolean;
  duplicateInfo?: {
    itemType: 'physical' | 'digital';
    itemId: number;
    title: string;
  };
}

@Component({
  selector: 'app-isbn-scanner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    TabViewModule,
    CardModule,
    TooltipModule
  ],
  template: `
    <p-dialog
      header="ISBN Scanner"
      [(visible)]="visible"
      [modal]="true"
      [style]="{width: '700px', maxWidth: '95vw'}"
      [draggable]="false"
      (onHide)="onCancel()"
      (onShow)="onDialogShow()"
    >
      <div class="scanner-content">
        <p-tabView [(activeIndex)]="activeTabIndex">
          <!-- Scanner Mode (Primary - for physical USB scanners) -->
          <p-tabPanel header="Scanner" leftIcon="pi pi-qrcode">
            <div class="scanner-tab-content">
              <div class="scanner-instructions">
                <i class="pi pi-info-circle"></i>
                <p>
                  <strong>Using a USB Barcode Scanner:</strong><br>
                  Click in the input field below and scan the barcode on your book.
                  The scanner will automatically type the ISBN and look it up.
                </p>
              </div>

              <div class="isbn-input-container">
                <label for="isbn-scanner-input" class="field-label">
                  <i class="pi pi-qrcode"></i> Scan ISBN
                </label>
                <input
                  #isbnInput
                  id="isbn-scanner-input"
                  type="text"
                  pInputText
                  [(ngModel)]="currentISBN"
                  (keypress)="onISBNKeyPress($event)"
                  (paste)="onISBNPaste($event)"
                  placeholder="Click here and scan barcode..."
                  class="w-full isbn-input"
                  [class.invalid]="invalidISBN"
                  autocomplete="off"
                />
                <small class="field-hint">
                  ISBN-10 or ISBN-13 format supported
                </small>
                <small class="field-error" *ngIf="invalidISBN">
                  Invalid ISBN format
                </small>
              </div>

              <div class="status-display" *ngIf="statusMessage">
                <i [class]="statusIcon"></i>
                <span>{{ statusMessage }}</span>
              </div>
            </div>
          </p-tabPanel>

          <!-- Manual Entry Mode -->
          <p-tabPanel header="Manual" leftIcon="pi pi-pencil">
            <div class="manual-tab-content">
              <div class="manual-instructions">
                <i class="pi pi-info-circle"></i>
                <p>Enter the ISBN manually and click "Look Up" to search for book information.</p>
              </div>

              <div class="isbn-input-container">
                <label for="isbn-manual-input" class="field-label">
                  ISBN Number
                </label>
                <input
                  id="isbn-manual-input"
                  type="text"
                  pInputText
                  [(ngModel)]="manualISBN"
                  placeholder="Enter ISBN-10 or ISBN-13"
                  class="w-full"
                  [class.invalid]="invalidManualISBN"
                />
                <small class="field-hint">
                  Example: 978-0-7432-7356-5 or 9780743273565
                </small>
                <small class="field-error" *ngIf="invalidManualISBN">
                  Invalid ISBN format
                </small>
              </div>

              <button
                pButton
                label="Look Up"
                icon="pi pi-search"
                (click)="onManualLookup()"
                [loading]="isLookingUp"
                [disabled]="!manualISBN"
                class="lookup-button"
              ></button>
            </div>
          </p-tabPanel>
        </p-tabView>

        <!-- Scan History -->
        <div class="scan-history" *ngIf="scanHistory.length > 0">
          <div class="history-header">
            <h3>
              <i class="pi pi-history"></i>
              Scan History ({{ scanHistory.length }})
            </h3>
            <button
              pButton
              label="Clear All"
              icon="pi pi-trash"
              (click)="clearHistory()"
              class="p-button-text p-button-sm"
            ></button>
          </div>

          <div class="history-items">
            <div class="history-item" *ngFor="let item of scanHistory; let i = index">
              <div class="history-item-icon">
                <i *ngIf="item.status === 'loading'" class="pi pi-spin pi-spinner"></i>
                <i *ngIf="item.status === 'success'" class="pi pi-check-circle success-icon"></i>
                <i *ngIf="item.status === 'error'" class="pi pi-times-circle error-icon"></i>
              </div>

              <div class="history-item-content">
                <div class="history-item-title" *ngIf="item.status === 'success' && item.data">
                  {{ item.data.title }}
                  <span class="duplicate-badge" *ngIf="item.isDuplicate">
                    <i class="pi pi-exclamation-triangle"></i> Already in library
                  </span>
                </div>
                <div class="history-item-title" *ngIf="item.status === 'error'">
                  Not found
                </div>
                <div class="history-item-title" *ngIf="item.status === 'loading'">
                  Looking up...
                </div>
                <div class="history-item-isbn">ISBN: {{ formatISBN(item.isbn) }}</div>
                <div class="history-item-authors" *ngIf="item.status === 'success' && item.data && item.data.authors.length > 0">
                  by {{ item.data.authors.join(', ') }}
                </div>
                <div class="history-item-duplicate" *ngIf="item.isDuplicate && item.duplicateInfo">
                  <i class="pi pi-info-circle"></i>
                  Exists as {{ item.duplicateInfo.itemType }} item: "{{ item.duplicateInfo.title }}"
                </div>
                <div class="history-item-error" *ngIf="item.status === 'error' && item.error">
                  {{ item.error }}
                </div>
              </div>

              <div class="history-item-actions">
                <button
                  pButton
                  *ngIf="item.status === 'success' && !item.isDuplicate"
                  label="Add to Library"
                  icon="pi pi-plus"
                  (click)="addToLibrary(item)"
                  class="p-button-sm p-button-success"
                ></button>
                <button
                  pButton
                  *ngIf="item.status === 'success' && item.isDuplicate"
                  label="Add Anyway"
                  icon="pi pi-plus"
                  (click)="addToLibrary(item)"
                  class="p-button-sm p-button-warning"
                  pTooltip="Add another copy to your library"
                ></button>
                <button
                  pButton
                  *ngIf="item.status === 'error'"
                  label="Retry"
                  icon="pi pi-refresh"
                  (click)="retryLookup(item)"
                  class="p-button-sm p-button-text"
                ></button>
                <button
                  pButton
                  icon="pi pi-times"
                  (click)="removeFromHistory(i)"
                  class="p-button-sm p-button-text p-button-danger"
                ></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button
          pButton
          label="Close"
          icon="pi pi-times"
          (click)="onCancel()"
          class="p-button-text"
        ></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .scanner-content {
      min-height: 400px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .scanner-tab-content,
    .manual-tab-content {
      padding: 1rem 0;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .scanner-instructions,
    .manual-instructions {
      background: #E3F2FD;
      border-left: 4px solid #2196F3;
      padding: 1rem;
      border-radius: 4px;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .scanner-instructions i,
    .manual-instructions i {
      color: #2196F3;
      font-size: 1.25rem;
      margin-top: 0.125rem;
    }

    .scanner-instructions p,
    .manual-instructions p {
      margin: 0;
      color: #1565C0;
      line-height: 1.5;
    }

    .isbn-input-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .isbn-input {
      font-size: 1.125rem !important;
      font-weight: 500 !important;
      padding: 0.875rem 1rem !important;
      font-family: 'Courier New', monospace !important;
      letter-spacing: 0.05em !important;
      border: 2px solid #D1D5DB !important;
    }

    .isbn-input:focus {
      border-color: #6366F1 !important;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
    }

    .isbn-input.invalid {
      border-color: #EF4444 !important;
    }

    .field-hint {
      color: #6B7280;
      font-size: 0.75rem;
    }

    .field-error {
      color: #EF4444;
      font-size: 0.75rem;
    }

    .status-display {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: #F3F4F6;
      border-radius: 0.5rem;
      font-weight: 500;
    }

    .status-display i {
      font-size: 1.25rem;
    }

    .status-display.loading {
      background: #FEF3C7;
      color: #92400E;
    }

    .status-display.success {
      background: #D1FAE5;
      color: #065F46;
    }

    .status-display.error {
      background: #FEE2E2;
      color: #991B1B;
    }

    .lookup-button {
      align-self: flex-start;
    }

    .scan-history {
      border-top: 1px solid #E5E7EB;
      padding-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .history-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .history-items {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .history-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #F9FAFB;
      border-radius: 0.5rem;
      border: 1px solid #E5E7EB;
    }

    .history-item-icon {
      flex-shrink: 0;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
    }

    .success-icon {
      color: #10B981;
    }

    .error-icon {
      color: #EF4444;
    }

    .history-item-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .history-item-title {
      font-weight: 600;
      color: #111827;
      font-size: 0.9375rem;
    }

    .history-item-isbn {
      font-size: 0.75rem;
      color: #6B7280;
      font-family: 'Courier New', monospace;
    }

    .history-item-authors {
      font-size: 0.8125rem;
      color: #4B5563;
    }

    .history-item-error {
      font-size: 0.8125rem;
      color: #EF4444;
    }

    .history-item-duplicate {
      font-size: 0.8125rem;
      color: #F59E0B;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 500;
    }

    .duplicate-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: #FEF3C7;
      color: #92400E;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    .duplicate-badge i {
      font-size: 0.75rem;
    }

    .history-item-actions {
      flex-shrink: 0;
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
    }

    :host ::ng-deep .w-full {
      width: 100%;
    }

    :host ::ng-deep .p-tabview .p-tabview-nav {
      background: #F9FAFB;
    }

    :host ::ng-deep .p-tabview .p-tabview-panels {
      background: #FFFFFF;
      padding: 1.5rem;
    }
  `]
})
export class ISBNScannerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() bookFound = new EventEmitter<BookMetadata>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('isbnInput') isbnInputRef!: ElementRef;

  activeTabIndex = 0;
  currentISBN = '';
  manualISBN = '';
  invalidISBN = false;
  invalidManualISBN = false;
  isLookingUp = false;
  statusMessage = '';
  statusIcon = '';

  scanHistory: ScanHistoryItem[] = [];
  private scanTimeout: any;
  private lastScanTime = 0;
  private readonly SCAN_DELAY = 300; // ms to wait after last character before triggering lookup

  constructor(
    private isbnService: ISBNService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    // Auto-focus will happen in onDialogShow
  }

  ngOnDestroy(): void {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
  }

  onDialogShow(): void {
    // Auto-focus the scanner input when dialog opens
    setTimeout(() => {
      if (this.isbnInputRef && this.activeTabIndex === 0) {
        this.isbnInputRef.nativeElement.focus();
      }
    }, 100);
  }

  /**
   * Handle key press events in scanner input
   * Physical USB scanners type the ISBN and send Enter
   */
  onISBNKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      // Scanner sent Enter key - trigger lookup
      event.preventDefault();
      this.triggerLookup(this.currentISBN);
    } else {
      // Reset scan timeout on each keystroke
      if (this.scanTimeout) {
        clearTimeout(this.scanTimeout);
      }

      // Auto-trigger lookup after delay (in case scanner doesn't send Enter)
      this.scanTimeout = setTimeout(() => {
        if (this.currentISBN && this.currentISBN.length >= 10) {
          this.triggerLookup(this.currentISBN);
        }
      }, this.SCAN_DELAY);
    }
  }

  /**
   * Handle paste events (some scanners may paste instead of typing)
   */
  onISBNPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text');
    if (pastedText) {
      this.currentISBN = pastedText.trim();
      setTimeout(() => {
        this.triggerLookup(this.currentISBN);
      }, 100);
    }
  }

  /**
   * Trigger ISBN lookup
   */
  private triggerLookup(isbn: string): void {
    if (!isbn || isbn.trim().length === 0) {
      return;
    }

    // Validate ISBN format
    if (!this.isbnService.isValidISBNFormat(isbn)) {
      this.invalidISBN = true;
      this.statusMessage = 'Invalid ISBN format';
      this.statusIcon = 'pi pi-exclamation-triangle';
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid ISBN',
        detail: 'Please enter a valid ISBN-10 or ISBN-13'
      });
      return;
    }

    this.invalidISBN = false;
    this.lookupISBN(isbn);

    // Clear input for next scan
    this.currentISBN = '';

    // Re-focus input
    setTimeout(() => {
      if (this.isbnInputRef) {
        this.isbnInputRef.nativeElement.focus();
      }
    }, 100);
  }

  /**
   * Manual lookup from manual entry tab
   */
  onManualLookup(): void {
    if (!this.manualISBN || this.manualISBN.trim().length === 0) {
      return;
    }

    // Validate ISBN format
    if (!this.isbnService.isValidISBNFormat(this.manualISBN)) {
      this.invalidManualISBN = true;
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid ISBN',
        detail: 'Please enter a valid ISBN-10 or ISBN-13'
      });
      return;
    }

    this.invalidManualISBN = false;
    this.lookupISBN(this.manualISBN);
  }

  /**
   * Perform ISBN lookup with duplicate detection
   */
  private lookupISBN(isbn: string): void {
    const historyItem: ScanHistoryItem = {
      isbn: isbn.trim(),
      timestamp: new Date(),
      status: 'loading'
    };

    this.scanHistory.unshift(historyItem);
    this.isLookingUp = true;
    this.statusMessage = 'Looking up ISBN...';
    this.statusIcon = 'pi pi-spin pi-spinner';

    // Run both lookup and duplicate check in parallel
    forkJoin({
      lookup: this.isbnService.lookupISBN(isbn),
      duplicate: this.isbnService.checkDuplicate(isbn)
    }).subscribe({
      next: ({ lookup, duplicate }) => {
        this.isLookingUp = false;

        if (lookup.found && lookup.data) {
          historyItem.status = 'success';
          historyItem.data = lookup.data;

          // Check for duplicate
          if (duplicate.isDuplicate && duplicate.item) {
            historyItem.isDuplicate = true;
            historyItem.duplicateInfo = {
              itemType: duplicate.itemType!,
              itemId: duplicate.item.id,
              title: duplicate.item.title
            };

            this.statusMessage = `Found: ${lookup.data.title} (Already in library)`;
            this.statusIcon = 'pi pi-exclamation-circle';

            this.messageService.add({
              severity: 'warn',
              summary: 'Duplicate Found',
              detail: `"${lookup.data.title}" is already in your ${duplicate.itemType} library`,
              life: 5000
            });
          } else {
            this.statusMessage = `Found: ${lookup.data.title}`;
            this.statusIcon = 'pi pi-check-circle';

            this.messageService.add({
              severity: 'success',
              summary: 'Book Found',
              detail: lookup.data.title
            });
          }
        } else {
          historyItem.status = 'error';
          historyItem.error = lookup.message || 'Book not found';
          this.statusMessage = 'Book not found';
          this.statusIcon = 'pi pi-times-circle';

          this.messageService.add({
            severity: 'warn',
            summary: 'Not Found',
            detail: `No book found with ISBN: ${isbn}`
          });
        }
      },
      error: (error) => {
        this.isLookingUp = false;
        historyItem.status = 'error';
        historyItem.error = error.error?.message || 'Lookup failed';
        this.statusMessage = 'Lookup failed';
        this.statusIcon = 'pi pi-exclamation-triangle';

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to lookup ISBN'
        });
      }
    });
  }

  /**
   * Retry lookup for a history item
   */
  retryLookup(item: ScanHistoryItem): void {
    item.status = 'loading';
    delete item.error;
    delete item.data;

    this.isbnService.lookupISBN(item.isbn).subscribe({
      next: (response: ISBNLookupResponse) => {
        if (response.found && response.data) {
          item.status = 'success';
          item.data = response.data;
          this.messageService.add({
            severity: 'success',
            summary: 'Book Found',
            detail: response.data.title
          });
        } else {
          item.status = 'error';
          item.error = response.message || 'Book not found';
        }
      },
      error: (error) => {
        item.status = 'error';
        item.error = error.error?.message || 'Lookup failed';
      }
    });
  }

  /**
   * Add book to library (emit event to parent)
   */
  addToLibrary(item: ScanHistoryItem): void {
    if (item.data) {
      this.bookFound.emit(item.data);
      this.messageService.add({
        severity: 'info',
        summary: 'Adding to Library',
        detail: 'Redirecting to add item form...'
      });
    }
  }

  /**
   * Remove item from history
   */
  removeFromHistory(index: number): void {
    this.scanHistory.splice(index, 1);
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.scanHistory = [];
    this.statusMessage = '';
  }

  /**
   * Format ISBN for display
   */
  formatISBN(isbn: string): string {
    return this.isbnService.formatISBN(isbn);
  }

  /**
   * Close dialog
   */
  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancelled.emit();
  }
}
