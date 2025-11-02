import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthorService, Author } from '../../services/author.service';

@Component({
  selector: 'app-authors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputTextarea,
    ConfirmDialogModule,
    ToastModule,
    ToolbarModule
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="min-h-screen bg-gray-50">
      <p-toast />
      <p-confirmDialog />

      <!-- Header -->
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-900">Author Management</h1>
            <div class="flex items-center space-x-4">
              <button pButton label="Dashboard" icon="pi pi-home" (click)="goToDashboard()" class="p-button-outlined"></button>
              <button pButton label="Library" icon="pi pi-book" (click)="goToLibrary()" class="p-button-outlined"></button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white shadow rounded-lg p-6">
          <p-toolbar>
            <ng-template pTemplate="left">
              <h2 class="text-xl font-semibold">Authors ({{ authors.length }})</h2>
            </ng-template>
            <ng-template pTemplate="right">
              <button pButton label="New Author" icon="pi pi-plus" (click)="openNew()"></button>
            </ng-template>
          </p-toolbar>

          <p-table
            [value]="authors"
            [loading]="loading"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [globalFilterFields]="['name', 'bio']"
            styleClass="p-datatable-sm"
            class="mt-4"
          >
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="name" style="width:25%">Name <p-sortIcon field="name"></p-sortIcon></th>
                <th style="width:40%">Bio</th>
                <th pSortableColumn="website" style="width:20%">Website <p-sortIcon field="website"></p-sortIcon></th>
                <th style="width:15%">Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-author>
              <tr>
                <td><strong>{{ author.name }}</strong></td>
                <td>{{ author.bio || '-' }}</td>
                <td>
                  <a *ngIf="author.website" [href]="author.website" target="_blank" class="text-blue-600 hover:underline">
                    <i class="pi pi-external-link mr-1"></i>Link
                  </a>
                  <span *ngIf="!author.website">-</span>
                </td>
                <td>
                  <button pButton icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm mr-2" (click)="editAuthor(author)"></button>
                  <button pButton icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger p-button-sm" (click)="deleteAuthor(author)"></button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="4" class="text-center py-8 text-gray-500">
                  No authors found. Click "New Author" to add one.
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </main>

      <!-- Author Dialog -->
      <p-dialog
        [(visible)]="authorDialog"
        [header]="author.id ? 'Edit Author' : 'New Author'"
        [modal]="true"
        [style]="{width: '500px'}"
        [closable]="true"
      >
        <div class="flex flex-col gap-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              id="name"
              type="text"
              pInputText
              [(ngModel)]="author.name"
              required
              class="w-full"
              placeholder="Author name"
            />
          </div>

          <div>
            <label for="bio" class="block text-sm font-medium text-gray-700 mb-2">Biography</label>
            <textarea
              id="bio"
              pInputTextarea
              [(ngModel)]="author.bio"
              rows="4"
              class="w-full"
              placeholder="Author biography"
            ></textarea>
          </div>

          <div>
            <label for="website" class="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              id="website"
              type="url"
              pInputText
              [(ngModel)]="author.website"
              class="w-full"
              placeholder="https://example.com"
            />
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" icon="pi pi-times" (click)="hideDialog()" class="p-button-text"></button>
          <button pButton label="Save" icon="pi pi-check" (click)="saveAuthor()" [disabled]="!author.name"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: []
})
export class AuthorsComponent implements OnInit {
  authors: Author[] = [];
  author: Partial<Author> = {};
  authorDialog = false;
  loading = false;

  constructor(
    private authorService: AuthorService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAuthors();
  }

  loadAuthors() {
    this.loading = true;
    this.authorService.getAll().subscribe({
      next: (data) => {
        this.authors = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading authors:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load authors'
        });
        this.loading = false;
      }
    });
  }

  openNew() {
    this.author = {};
    this.authorDialog = true;
  }

  editAuthor(author: Author) {
    this.author = { ...author };
    this.authorDialog = true;
  }

  hideDialog() {
    this.authorDialog = false;
    this.author = {};
  }

  saveAuthor() {
    if (!this.author.name) {
      return;
    }

    if (this.author.id) {
      // Update existing author
      this.authorService.update(this.author.id, this.author).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Author updated successfully'
          });
          this.loadAuthors();
          this.hideDialog();
        },
        error: (error) => {
          console.error('Error updating author:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update author'
          });
        }
      });
    } else {
      // Create new author
      this.authorService.create(this.author).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Author created successfully'
          });
          this.loadAuthors();
          this.hideDialog();
        },
        error: (error) => {
          console.error('Error creating author:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.error || 'Failed to create author'
          });
        }
      });
    }
  }

  deleteAuthor(author: Author) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${author.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.authorService.delete(author.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Author deleted successfully'
            });
            this.loadAuthors();
          },
          error: (error) => {
            console.error('Error deleting author:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete author'
            });
          }
        });
      }
    });
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToLibrary() {
    this.router.navigate(['/library']);
  }
}
