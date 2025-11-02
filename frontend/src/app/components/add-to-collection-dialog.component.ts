import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ListboxModule } from 'primeng/listbox';
import { MessageService } from 'primeng/api';
import { CollectionService, Collection } from '../services/collection.service';
import { CollectionDialogComponent } from './collection-dialog.component';

@Component({
  selector: 'app-add-to-collection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    ListboxModule,
    CollectionDialogComponent
  ],
  template: `
    <p-dialog
      header="Add to Collection"
      [(visible)]="visible"
      [modal]="true"
      [style]="{width: '500px'}"
      [draggable]="false"
      (onHide)="onCancel()"
    >
      <div class="add-to-collection-content">
        <p class="dialog-description">
          Select one or more collections to add this item to:
        </p>

        <div *ngIf="isLoading" class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading collections...</span>
        </div>

        <div *ngIf="!isLoading && collections.length === 0" class="empty-state">
          <i class="pi pi-inbox"></i>
          <p>No collections available</p>
          <p class="empty-state-hint">Create your first collection to get started</p>
        </div>

        <p-listbox
          *ngIf="!isLoading && collections.length > 0"
          [options]="collections"
          [(ngModel)]="selectedCollections"
          optionLabel="name"
          [multiple]="true"
          [checkbox]="true"
          [filter]="true"
          filterPlaceHolder="Search collections..."
          [listStyle]="{'max-height':'300px', 'min-height': '200px'}"
          styleClass="w-full collection-listbox"
        >
          <ng-template let-collection pTemplate="item">
            <div class="collection-item">
              <div class="collection-info">
                <span class="collection-name">{{ collection.name }}</span>
                <span class="collection-count" *ngIf="getItemCount(collection) > 0">
                  {{ getItemCount(collection) }} item(s)
                </span>
              </div>
              <p class="collection-description" *ngIf="collection.description">
                {{ collection.description }}
              </p>
            </div>
          </ng-template>
        </p-listbox>

        <button
          pButton
          label="Create New Collection"
          icon="pi pi-plus"
          (click)="openCreateCollectionDialog()"
          class="p-button-outlined w-full create-collection-btn"
        ></button>
      </div>

      <ng-template pTemplate="footer">
        <button
          pButton
          label="Cancel"
          icon="pi pi-times"
          (click)="onCancel()"
          class="p-button-text"
        ></button>
        <button
          pButton
          label="Add to Collections"
          icon="pi pi-check"
          (click)="onAdd()"
          [loading]="isAdding"
          [disabled]="selectedCollections.length === 0"
        ></button>
      </ng-template>
    </p-dialog>

    <app-collection-dialog
      [(visible)]="createCollectionDialogVisible"
      (saved)="onCollectionCreated($event)"
    ></app-collection-dialog>
  `,
  styles: [`
    .add-to-collection-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .dialog-description {
      font-size: 0.875rem;
      color: #6B7280;
      margin: 0 0 0.5rem 0;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;
      color: #6B7280;
    }

    .loading-state i {
      font-size: 1.5rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      color: #6B7280;
    }

    .empty-state i {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      color: #9CA3AF;
    }

    .empty-state p {
      margin: 0.25rem 0;
    }

    .empty-state-hint {
      font-size: 0.875rem;
      color: #9CA3AF;
    }

    .collection-item {
      padding: 0.5rem 0;
    }

    .collection-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .collection-name {
      font-weight: 600;
      color: #111827;
      font-size: 0.875rem;
    }

    .collection-count {
      font-size: 0.75rem;
      color: #6B7280;
      background: #F3F4F6;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
    }

    .collection-description {
      font-size: 0.75rem;
      color: #6B7280;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .create-collection-btn {
      margin-top: 0.5rem;
    }

    :host ::ng-deep .w-full {
      width: 100%;
    }

    :host ::ng-deep .collection-listbox {
      border: 1px solid #E5E7EB;
      border-radius: 0.375rem;
    }

    :host ::ng-deep .collection-listbox .p-listbox-list {
      padding: 0.5rem;
    }

    :host ::ng-deep .collection-listbox .p-listbox-item {
      padding: 0.5rem;
      border-radius: 0.375rem;
      margin-bottom: 0.25rem;
    }

    :host ::ng-deep .collection-listbox .p-listbox-item:hover {
      background: #F9FAFB;
    }

    :host ::ng-deep .collection-listbox .p-listbox-item.p-highlight {
      background: #EEF2FF;
      color: #4338CA;
    }

    :host ::ng-deep .p-dialog-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #E5E7EB;
    }

    :host ::ng-deep .p-dialog-footer .p-button {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
    }
  `]
})
export class AddToCollectionDialogComponent implements OnInit {
  @Input() visible = false;
  @Input() itemId!: number;
  @Input() itemType!: 'digital' | 'physical';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() added = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  collections: Collection[] = [];
  selectedCollections: Collection[] = [];
  isLoading = false;
  isAdding = false;
  createCollectionDialogVisible = false;

  constructor(
    private collectionService: CollectionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    if (this.visible) {
      this.loadCollections();
    }
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.loadCollections();
    }
  }

  loadCollections(): void {
    this.isLoading = true;
    this.collectionService.getCollections().subscribe({
      next: (collections) => {
        this.collections = collections;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load collections'
        });
      }
    });
  }

  getItemCount(collection: Collection): number {
    const digitalCount = collection.digitalItems?.length || 0;
    const physicalCount = collection.physicalItems?.length || 0;
    return digitalCount + physicalCount;
  }

  openCreateCollectionDialog(): void {
    this.createCollectionDialogVisible = true;
  }

  onCollectionCreated(collection: Collection): void {
    this.createCollectionDialogVisible = false;
    this.loadCollections();
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Collection created successfully'
    });
  }

  onAdd(): void {
    if (this.selectedCollections.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Selection',
        detail: 'Please select at least one collection'
      });
      return;
    }

    this.isAdding = true;
    let successCount = 0;
    let errorCount = 0;
    const total = this.selectedCollections.length;

    this.selectedCollections.forEach((collection) => {
      const addObservable = this.itemType === 'digital'
        ? this.collectionService.addDigitalItemToCollection(collection.id, this.itemId)
        : this.collectionService.addPhysicalItemToCollection(collection.id, this.itemId);

      addObservable.subscribe({
        next: () => {
          successCount++;
          this.checkCompletion(successCount, errorCount, total);
        },
        error: (error) => {
          errorCount++;
          this.checkCompletion(successCount, errorCount, total);
        }
      });
    });
  }

  checkCompletion(successCount: number, errorCount: number, total: number): void {
    if (successCount + errorCount === total) {
      this.isAdding = false;

      if (successCount > 0) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Item added to ${successCount} collection(s)`
        });
      }

      if (errorCount > 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to add item to ${errorCount} collection(s)`
        });
      }

      if (successCount > 0) {
        this.added.emit();
        this.closeDialog();
      }
    }
  }

  onCancel(): void {
    this.closeDialog();
    this.cancelled.emit();
  }

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.selectedCollections = [];
  }
}
