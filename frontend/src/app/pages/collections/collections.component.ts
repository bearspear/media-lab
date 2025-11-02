import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Collection, CollectionService, CreateCollectionDto, UpdateCollectionDto } from '../../services/collection.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputTextarea,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './collections.component.html',
  styleUrl: './collections.component.css'
})
export class CollectionsComponent implements OnInit {
  collections: Collection[] = [];
  loading = false;
  showDialog = false;
  isEditMode = false;

  currentCollection: CreateCollectionDto | UpdateCollectionDto = {
    name: '',
    description: '',
    isPublic: false
  };

  editingCollectionId: number | null = null;

  constructor(
    private collectionService: CollectionService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadCollections();
  }

  loadCollections() {
    this.loading = true;
    this.collectionService.getCollections().subscribe({
      next: (collections) => {
        this.collections = collections;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading collections:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load collections'
        });
        this.loading = false;
      }
    });
  }

  openCreateDialog() {
    this.isEditMode = false;
    this.editingCollectionId = null;
    this.currentCollection = {
      name: '',
      description: '',
      isPublic: false
    };
    this.showDialog = true;
  }

  openEditDialog(collection: Collection) {
    this.isEditMode = true;
    this.editingCollectionId = collection.id;
    this.currentCollection = {
      name: collection.name,
      description: collection.description,
      isPublic: collection.isPublic
    };
    this.showDialog = true;
  }

  saveCollection() {
    if (!this.currentCollection.name?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Collection name is required'
      });
      return;
    }

    if (this.isEditMode && this.editingCollectionId) {
      this.collectionService.updateCollection(this.editingCollectionId, this.currentCollection).subscribe({
        next: (updatedCollection) => {
          const index = this.collections.findIndex(c => c.id === this.editingCollectionId);
          if (index !== -1) {
            this.collections[index] = updatedCollection;
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Collection updated successfully'
          });
          this.showDialog = false;
        },
        error: (error) => {
          console.error('Error updating collection:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update collection'
          });
        }
      });
    } else {
      this.collectionService.createCollection(this.currentCollection as CreateCollectionDto).subscribe({
        next: (newCollection) => {
          this.collections.unshift(newCollection);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Collection created successfully'
          });
          this.showDialog = false;
        },
        error: (error) => {
          console.error('Error creating collection:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create collection'
          });
        }
      });
    }
  }

  deleteCollection(collection: Collection) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${collection.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.collectionService.deleteCollection(collection.id).subscribe({
          next: () => {
            this.collections = this.collections.filter(c => c.id !== collection.id);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Collection deleted successfully'
            });
          },
          error: (error) => {
            console.error('Error deleting collection:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete collection'
            });
          }
        });
      }
    });
  }

  getItemCount(collection: Collection): number {
    const digitalCount = collection.digitalItems?.length || 0;
    const physicalCount = collection.physicalItems?.length || 0;
    return digitalCount + physicalCount;
  }
}
