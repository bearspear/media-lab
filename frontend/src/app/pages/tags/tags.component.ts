import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tag, TagService, CreateTagDto, UpdateTagDto } from '../../services/tag.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ColorPickerModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.css'
})
export class TagsComponent implements OnInit {
  tags: Tag[] = [];
  loading = false;
  showDialog = false;
  isEditMode = false;

  currentTag: CreateTagDto | UpdateTagDto = {
    name: '',
    color: '#3B82F6'
  };

  editingTagId: number | null = null;

  constructor(
    private tagService: TagService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadTags();
  }

  loadTags() {
    this.loading = true;
    this.tagService.getTags().subscribe({
      next: (tags) => {
        this.tags = tags;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tags:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load tags'
        });
        this.loading = false;
      }
    });
  }

  openCreateDialog() {
    this.isEditMode = false;
    this.editingTagId = null;
    this.currentTag = {
      name: '',
      color: '#3B82F6'
    };
    this.showDialog = true;
  }

  openEditDialog(tag: Tag) {
    this.isEditMode = true;
    this.editingTagId = tag.id;
    this.currentTag = {
      name: tag.name,
      color: tag.color || '#3B82F6'
    };
    this.showDialog = true;
  }

  saveTag() {
    if (!this.currentTag.name?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Tag name is required'
      });
      return;
    }

    if (this.isEditMode && this.editingTagId) {
      this.tagService.updateTag(this.editingTagId, this.currentTag).subscribe({
        next: (updatedTag) => {
          const index = this.tags.findIndex(t => t.id === this.editingTagId);
          if (index !== -1) {
            this.tags[index] = updatedTag;
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Tag updated successfully'
          });
          this.showDialog = false;
        },
        error: (error) => {
          console.error('Error updating tag:', error);
          const message = error.error?.error || 'Failed to update tag';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: message
          });
        }
      });
    } else {
      this.tagService.createTag(this.currentTag as CreateTagDto).subscribe({
        next: (newTag) => {
          this.tags.push(newTag);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Tag created successfully'
          });
          this.showDialog = false;
        },
        error: (error) => {
          console.error('Error creating tag:', error);
          const message = error.error?.error || 'Failed to create tag';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: message
          });
        }
      });
    }
  }

  deleteTag(tag: Tag) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${tag.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.tagService.deleteTag(tag.id).subscribe({
          next: () => {
            this.tags = this.tags.filter(t => t.id !== tag.id);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Tag deleted successfully'
            });
          },
          error: (error) => {
            console.error('Error deleting tag:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete tag'
            });
          }
        });
      }
    });
  }

  getItemCount(tag: Tag): number {
    const digitalCount = tag.digitalItems?.length || 0;
    const physicalCount = tag.physicalItems?.length || 0;
    return digitalCount + physicalCount;
  }
}
