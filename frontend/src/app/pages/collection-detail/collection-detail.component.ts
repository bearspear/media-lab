import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CollectionService, Collection } from '../../services/collection.service';
import { DigitalItem, PhysicalItem, ReadingStatus } from '../../models/item.model';
import { CollectionDialogComponent } from '../../components/collection-dialog.component';

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TagModule,
    RatingModule,
    ConfirmDialogModule,
    ToastModule,
    CollectionDialogComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './collection-detail.component.html',
  styleUrl: './collection-detail.component.css'
})
export class CollectionDetailComponent implements OnInit {
  collection: Collection | null = null;
  digitalItems: DigitalItem[] = [];
  physicalItems: PhysicalItem[] = [];
  isLoading = false;
  editDialogVisible = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private collectionService: CollectionService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCollection(+id);
    }
  }

  loadCollection(id: number): void {
    this.isLoading = true;
    this.collectionService.getCollectionById(id).subscribe({
      next: (collection) => {
        this.collection = collection;
        this.digitalItems = collection.digitalItems || [];
        this.physicalItems = collection.physicalItems || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load collection'
        });
        this.router.navigate(['/library']);
      }
    });
  }

  get totalItemCount(): number {
    return this.digitalItems.length + this.physicalItems.length;
  }

  openEditDialog(): void {
    this.editDialogVisible = true;
  }

  onCollectionUpdated(updatedCollection: Collection): void {
    this.editDialogVisible = false;
    if (this.collection) {
      this.loadCollection(this.collection.id);
    }
  }

  deleteCollection(): void {
    if (!this.collection) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete the collection "${this.collection.name}"? This will not delete the items themselves.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (this.collection) {
          this.collectionService.deleteCollection(this.collection.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Deleted',
                detail: 'Collection deleted successfully'
              });
              this.router.navigate(['/library']);
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to delete collection'
              });
            }
          });
        }
      }
    });
  }

  removeDigitalItem(item: DigitalItem): void {
    if (!this.collection) return;

    this.confirmationService.confirm({
      message: `Remove "${item.title}" from this collection?`,
      header: 'Confirm Remove',
      icon: 'pi pi-info-circle',
      accept: () => {
        if (this.collection) {
          this.collectionService.removeDigitalItemFromCollection(this.collection.id, item.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Removed',
                detail: 'Item removed from collection'
              });
              this.loadCollection(this.collection!.id);
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to remove item'
              });
            }
          });
        }
      }
    });
  }

  removePhysicalItem(item: PhysicalItem): void {
    if (!this.collection) return;

    this.confirmationService.confirm({
      message: `Remove "${item.title}" from this collection?`,
      header: 'Confirm Remove',
      icon: 'pi pi-info-circle',
      accept: () => {
        if (this.collection) {
          this.collectionService.removePhysicalItemFromCollection(this.collection.id, item.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Removed',
                detail: 'Item removed from collection'
              });
              this.loadCollection(this.collection!.id);
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to remove item'
              });
            }
          });
        }
      }
    });
  }

  viewDigitalItem(id: number): void {
    this.router.navigate(['/items/digital', id]);
  }

  viewPhysicalItem(id: number): void {
    this.router.navigate(['/items/physical', id]);
  }

  goBack(): void {
    this.router.navigate(['/library']);
  }

  getAuthorNames(authors: any[]): string {
    return authors?.map(a => a.name).join(', ') || '';
  }

  getGenreNames(genres: any[]): string {
    return genres?.map(g => g.name).join(', ') || '';
  }

  getReadingStatusLabel(status?: string): string {
    if (!status) return '';

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
}
