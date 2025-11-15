import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, PdfViewerModule, ButtonModule, TooltipModule],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent implements OnInit, OnChanges {
  @Input() src: string = '';
  @Input() initialPage: number = 1;
  @Output() progressUpdate = new EventEmitter<{ page: number; totalPages: number; percentage: number }>();

  // PDF.js properties
  page: number = 1;
  totalPages: number = 0;
  zoom: number = 1.0;
  rotation: number = 0;
  isLoading: boolean = true;
  error: string = '';

  // Zoom levels
  zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];
  currentZoomIndex: number = 2; // 1.0

  ngOnInit(): void {
    console.log('PDF Viewer initialized with src:', this.src, 'initialPage:', this.initialPage);
    this.page = this.initialPage || 1;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialPage'] && !changes['initialPage'].firstChange) {
      this.page = this.initialPage || 1;
    }
  }

  onLoadComplete(pdf: any): void {
    console.log('PDF loaded successfully');
    this.totalPages = pdf.numPages;
    this.isLoading = false;
    this.error = '';

    // Set initial page if provided
    if (this.initialPage && this.initialPage > 0 && this.initialPage <= this.totalPages) {
      this.page = this.initialPage;
    }

    // Emit initial progress
    this.emitProgress();
  }

  onError(error: any): void {
    console.error('PDF loading error:', error);
    this.isLoading = false;
    this.error = 'Failed to load PDF. Please try again.';
  }

  onProgress(progressData: any): void {
    // Optional: Show loading progress
    console.log('PDF loading progress:', progressData);
  }

  onPageRendered(event: any): void {
    console.log('Page rendered:', event);
  }

  // Navigation methods
  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.emitProgress();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.emitProgress();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.page = page;
      this.emitProgress();
    }
  }

  // Zoom methods
  zoomIn(): void {
    if (this.currentZoomIndex < this.zoomLevels.length - 1) {
      this.currentZoomIndex++;
      this.zoom = this.zoomLevels[this.currentZoomIndex];
    }
  }

  zoomOut(): void {
    if (this.currentZoomIndex > 0) {
      this.currentZoomIndex--;
      this.zoom = this.zoomLevels[this.currentZoomIndex];
    }
  }

  resetZoom(): void {
    this.currentZoomIndex = 2; // 1.0
    this.zoom = this.zoomLevels[this.currentZoomIndex];
  }

  fitToWidth(): void {
    // This would require calculating based on container width
    // For now, use a reasonable default
    this.zoom = 1.2;
  }

  fitToPage(): void {
    // This would require calculating based on container height
    // For now, use a reasonable default
    this.zoom = 1.0;
  }

  // Rotation methods
  rotateClockwise(): void {
    this.rotation = (this.rotation + 90) % 360;
  }

  rotateCounterClockwise(): void {
    this.rotation = (this.rotation - 90 + 360) % 360;
  }

  // Helper methods
  canGoToPreviousPage(): boolean {
    return this.page > 1;
  }

  canGoToNextPage(): boolean {
    return this.page < this.totalPages;
  }

  canZoomIn(): boolean {
    return this.currentZoomIndex < this.zoomLevels.length - 1;
  }

  canZoomOut(): boolean {
    return this.currentZoomIndex > 0;
  }

  getZoomPercentage(): string {
    return `${Math.round(this.zoom * 100)}%`;
  }

  // Emit progress update
  private emitProgress(): void {
    if (this.totalPages > 0) {
      const percentage = (this.page / this.totalPages) * 100;
      this.progressUpdate.emit({
        page: this.page,
        totalPages: this.totalPages,
        percentage
      });
    }
  }
}
