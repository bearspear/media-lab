import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { CollectionService, Collection, CreateCollectionDto, UpdateCollectionDto } from '../services/collection.service';

@Component({
  selector: 'app-collection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    InputTextarea,
    ButtonModule
  ],
  template: `
    <p-dialog
      [header]="isEditMode ? 'Edit Collection' : 'Create New Collection'"
      [(visible)]="visible"
      [modal]="true"
      [style]="{width: '500px'}"
      [draggable]="false"
      (onHide)="onCancel()"
    >
      <div class="collection-dialog-content">
        <div class="form-field">
          <label for="name" class="field-label">
            Name <span class="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            pInputText
            [(ngModel)]="formData.name"
            placeholder="Enter collection name"
            class="w-full"
            [class.invalid]="submitted && !formData.name"
          />
          <small class="field-error" *ngIf="submitted && !formData.name">
            Collection name is required
          </small>
        </div>

        <div class="form-field">
          <label for="description" class="field-label">Description</label>
          <textarea
            id="description"
            pInputTextarea
            [(ngModel)]="formData.description"
            placeholder="Enter collection description (optional)"
            rows="4"
            class="w-full"
          ></textarea>
        </div>
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
          [label]="isEditMode ? 'Update' : 'Create'"
          icon="pi pi-check"
          (click)="onSave()"
          [loading]="isSaving"
        ></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .collection-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 0.5rem 0;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .required {
      color: #EF4444;
    }

    .field-error {
      color: #EF4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    :host ::ng-deep .invalid {
      border-color: #EF4444 !important;
    }

    :host ::ng-deep .invalid:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }

    :host ::ng-deep .w-full {
      width: 100%;
    }

    :host ::ng-deep .p-inputtext,
    :host ::ng-deep .p-inputtextarea {
      font-size: 0.875rem;
      padding: 0.625rem 0.75rem;
      border: 1px solid #D1D5DB;
      border-radius: 0.375rem;
      transition: all 0.15s ease;
    }

    :host ::ng-deep .p-inputtext:hover,
    :host ::ng-deep .p-inputtextarea:hover {
      border-color: #9CA3AF;
    }

    :host ::ng-deep .p-inputtext:focus,
    :host ::ng-deep .p-inputtextarea:focus {
      border-color: #6366F1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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
export class CollectionDialogComponent implements OnInit {
  @Input() visible = false;
  @Input() collection: Collection | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Collection>();
  @Output() cancelled = new EventEmitter<void>();

  formData: CreateCollectionDto = {
    name: '',
    description: '',
    isPublic: false
  };

  submitted = false;
  isSaving = false;
  isEditMode = false;

  constructor(
    private collectionService: CollectionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    if (this.collection) {
      this.isEditMode = true;
      this.formData = {
        name: this.collection.name,
        description: this.collection.description || '',
        isPublic: this.collection.isPublic
      };
    }
  }

  ngOnChanges(): void {
    if (this.collection) {
      this.isEditMode = true;
      this.formData = {
        name: this.collection.name,
        description: this.collection.description || '',
        isPublic: this.collection.isPublic
      };
    } else {
      this.isEditMode = false;
      this.resetForm();
    }
  }

  onSave(): void {
    this.submitted = true;

    if (!this.formData.name || this.formData.name.trim().length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please provide a collection name'
      });
      return;
    }

    this.isSaving = true;

    if (this.isEditMode && this.collection) {
      // Update existing collection
      const updateDto: UpdateCollectionDto = {
        name: this.formData.name.trim(),
        description: this.formData.description?.trim() || undefined,
        isPublic: this.formData.isPublic
      };

      this.collectionService.updateCollection(this.collection.id, updateDto).subscribe({
        next: (updatedCollection) => {
          this.isSaving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Collection updated successfully'
          });
          this.saved.emit(updatedCollection);
          this.closeDialog();
        },
        error: (error) => {
          this.isSaving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to update collection'
          });
        }
      });
    } else {
      // Create new collection
      const createDto: CreateCollectionDto = {
        name: this.formData.name.trim(),
        description: this.formData.description?.trim() || undefined,
        isPublic: this.formData.isPublic
      };

      this.collectionService.createCollection(createDto).subscribe({
        next: (newCollection) => {
          this.isSaving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Collection created successfully'
          });
          this.saved.emit(newCollection);
          this.closeDialog();
        },
        error: (error) => {
          this.isSaving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to create collection'
          });
        }
      });
    }
  }

  onCancel(): void {
    this.closeDialog();
    this.cancelled.emit();
  }

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }

  resetForm(): void {
    this.formData = {
      name: '',
      description: '',
      isPublic: false
    };
    this.submitted = false;
  }
}
