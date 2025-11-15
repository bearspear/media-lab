import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ItemService } from '../../services/item.service';
import { DigitalFileService } from '../../services/digital-file.service';
import { ReadingProgressService } from '../../services/reading-progress.service';
import { DigitalItem, DigitalFile } from '../../models/item.model';
import { ReadingProgress } from '../../models/reading-progress.model';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { EpubViewerComponent } from './components/epub-viewer/epub-viewer.component';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ToastModule,
    TooltipModule,
    PdfViewerComponent,
    EpubViewerComponent
  ],
  providers: [MessageService],
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.scss']
})
export class ReaderComponent implements OnInit, OnDestroy {
  item?: DigitalItem;
  currentFile?: DigitalFile;
  fileUrl: string = '';
  loading: boolean = true;
  error: string = '';
  savedProgress?: ReadingProgress;
  initialPage: number = 1;
  initialLocation: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemService,
    private digitalFileService: DigitalFileService,
    private progressService: ReadingProgressService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const itemId = this.route.snapshot.paramMap.get('itemId');
    const fileId = this.route.snapshot.paramMap.get('fileId');

    if (!itemId) {
      this.error = 'No item ID provided';
      this.loading = false;
      return;
    }

    this.loadItem(parseInt(itemId), fileId ? parseInt(fileId) : undefined);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadItem(itemId: number, fileId?: number): void {
    this.loading = true;
    this.itemService.getDigitalItem(itemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { item: DigitalItem }) => {
          this.item = response.item;

          if (!this.item?.files || this.item.files.length === 0) {
            this.error = 'No files available for this item';
            this.loading = false;
            return;
          }

          // Select the file to display
          if (fileId) {
            this.currentFile = this.item.files.find(f => f.id === fileId);
          } else {
            // Default to primary file or first file
            this.currentFile = this.item.files.find(f => f.isPrimary) || this.item.files[0];
          }

          if (!this.currentFile) {
            this.error = 'File not found';
            this.loading = false;
            return;
          }

          this.loadFile();
        },
        error: (error: any) => {
          console.error('Error loading item:', error);
          this.error = 'Failed to load item';
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load digital item'
          });
        }
      });
  }

  loadFile(): void {
    if (!this.currentFile || !this.item) return;

    // Construct file URL
    this.fileUrl = `http://localhost:3001/${this.currentFile.filePath}`;

    // Load saved progress
    this.progressService.getProgress(this.item.id, this.currentFile.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.savedProgress = response.progress;
          // Parse initial location based on file type
          if (this.isPDF() && this.savedProgress?.location) {
            this.initialPage = parseInt(this.savedProgress.location) || 1;
          } else if (this.isEPUB() && this.savedProgress?.location) {
            this.initialLocation = this.savedProgress.location;
          }
          console.log('Loaded progress:', this.savedProgress);
          this.loading = false;
        },
        error: (error) => {
          // No saved progress is not an error - just start from beginning
          console.log('No saved progress found, starting from beginning');
          this.initialPage = 1;
          this.initialLocation = '';
          this.loading = false;
        }
      });
  }

  goBack(): void {
    if (this.item) {
      this.router.navigate(['/library/digital', this.item.id]);
    } else {
      this.router.navigate(['/library/digital']);
    }
  }

  changeFile(file: DigitalFile): void {
    this.currentFile = file;
    this.loadFile();
  }

  getFileFormat(): string {
    return this.currentFile?.format || '';
  }

  isPDF(): boolean {
    return this.getFileFormat().toLowerCase() === 'pdf';
  }

  isEPUB(): boolean {
    return this.getFileFormat().toLowerCase() === 'epub';
  }

  isText(): boolean {
    const format = this.getFileFormat().toLowerCase();
    return format === 'txt' || format === 'md';
  }

  isAudio(): boolean {
    const format = this.getFileFormat().toLowerCase();
    return ['mp3', 'm4a', 'flac', 'wav'].includes(format);
  }

  isVideo(): boolean {
    const format = this.getFileFormat().toLowerCase();
    return ['mp4', 'mkv', 'avi'].includes(format);
  }

  download(): void {
    if (this.fileUrl) {
      window.open(this.fileUrl, '_blank');
    }
  }

  // Handle progress updates from child viewer components
  onProgressUpdate(data: { page?: number; totalPages?: number; location?: string; percentage?: number }): void {
    if (!this.item || !this.currentFile) return;

    let location = '';
    let percentage = data.percentage || 0;

    // Format location based on file type
    if (this.isPDF() && data.page !== undefined && data.totalPages !== undefined) {
      location = data.page.toString();
      percentage = (data.page / data.totalPages) * 100;
    } else if (this.isEPUB() && data.location) {
      // For EPUB, use the CFI (Canonical Fragment Identifier) as location
      location = data.location;
      percentage = data.percentage || 0;
    }

    // Update progress using the service (debounced)
    this.progressService.updateProgress({
      digitalItemId: this.item.id,
      digitalFileId: this.currentFile.id,
      location,
      percentage
    });
  }

  // Save progress immediately before leaving
  saveProgressBeforeExit(): void {
    // This will be called when navigating away or closing the reader
    // Implementation will be added when we integrate with component lifecycle
  }
}
