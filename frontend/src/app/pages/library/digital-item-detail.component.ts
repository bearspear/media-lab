import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ItemService } from '../../services/item.service';
import { DigitalFileService } from '../../services/digital-file.service';
import { DigitalItem, DigitalFile, ReadingStatus } from '../../models/item.model';

@Component({
  selector: 'app-digital-item-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TagModule,
    RatingModule,
    ChipModule,
    DividerModule,
    ConfirmDialogModule,
    ToastModule,
    TableModule,
    TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './digital-item-detail.component.html',
  styleUrl: './digital-item-detail.component.css'
})
export class DigitalItemDetailComponent implements OnInit {
  item: DigitalItem | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemService,
    public digitalFileService: DigitalFileService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadItem(parseInt(id));
    } else {
      this.router.navigate(['/library']);
    }
  }

  loadItem(id: number): void {
    this.loading = true;
    this.itemService.getDigitalItem(id).subscribe({
      next: ({ item }) => {
        this.item = item;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load item'
        });
        this.router.navigate(['/library']);
      }
    });
  }

  editItem(): void {
    if (this.item) {
      this.router.navigate(['/items/digital', this.item.id, 'edit']);
    }
  }

  deleteItem(): void {
    if (!this.item) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${this.item.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (this.item) {
          this.itemService.deleteDigitalItem(this.item.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Deleted',
                detail: 'Digital item deleted successfully'
              });
              this.router.navigate(['/library']);
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to delete item'
              });
            }
          });
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/library']);
  }

  getAuthorNames(authors: any[]): string {
    return authors?.map(a => a.name).join(', ') || 'Unknown';
  }

  getGenreNames(genres: any[]): string {
    return genres?.map(g => g.name).join(', ') || 'None';
  }

  getTagNames(tags: any[]): string {
    return tags?.map(t => t.name).join(', ') || 'None';
  }

  getTagLabel(tag: any): string {
    return typeof tag === 'string' ? tag : tag?.name || '';
  }

  getPublisherName(publisher: any): string {
    return publisher?.name || 'Unknown';
  }

  getReadingStatusLabel(status?: string): string {
    if (!status) return 'Not Set';

    switch (status) {
      case ReadingStatus.TO_READ: return 'To Read';
      case ReadingStatus.READING: return 'Reading';
      case ReadingStatus.COMPLETED: return 'Completed';
      case ReadingStatus.ON_HOLD: return 'On Hold';
      case ReadingStatus.DROPPED: return 'Dropped';
      default: return status;
    }
  }

  getReadingStatusSeverity(status?: string): 'success' | 'info' | 'warn' | 'danger' {
    if (!status) return 'info';

    switch (status) {
      case ReadingStatus.TO_READ: return 'info';
      case ReadingStatus.READING: return 'warn';
      case ReadingStatus.COMPLETED: return 'success';
      case ReadingStatus.ON_HOLD: return 'warn';
      case ReadingStatus.DROPPED: return 'danger';
      default: return 'info';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  getCoverUrl(): string {
    if (this.item?.coverImage) {
      // Add 'covers/' prefix if not already present (for backwards compatibility)
      const imagePath = this.item.coverImage.startsWith('covers/')
        ? this.item.coverImage
        : `covers/${this.item.coverImage}`;
      return `http://localhost:3001/uploads/${imagePath}`;
    }
    return 'https://via.placeholder.com/300x450?text=No+Cover';
  }

  downloadFile(): void {
    if (this.item?.filePath) {
      window.open(`http://localhost:3001${this.item.filePath}`, '_blank');
    }
  }

  getPrimaryFile(): DigitalFile | undefined {
    return this.item?.files?.find(f => f.isPrimary);
  }

  hasFiles(): boolean {
    return (this.item?.files?.length || 0) > 0;
  }

  downloadFileById(file: DigitalFile): void {
    if (file.filePath) {
      window.open(`http://localhost:3001/${file.filePath}`, '_blank');
    }
  }

  readFile(file: DigitalFile): void {
    if (this.item) {
      this.router.navigate(['/reader', this.item.id, file.id]);
    }
  }

  getFileSizeDisplay(fileSize?: number): string {
    return this.digitalFileService.formatFileSize(fileSize);
  }

  getFormatDisplay(format: string): string {
    return this.digitalFileService.getFormatDisplayName(format);
  }
}
