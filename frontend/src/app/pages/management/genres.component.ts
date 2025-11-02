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
import { GenreService, Genre } from '../../services/genre.service';

@Component({
  selector: 'app-genres',
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
            <h1 class="text-2xl font-bold text-gray-900">Genre Management</h1>
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
              <h2 class="text-xl font-semibold">Genres ({{ genres.length }})</h2>
            </ng-template>
            <ng-template pTemplate="right">
              <button pButton label="New Genre" icon="pi pi-plus" (click)="openNew()"></button>
            </ng-template>
          </p-toolbar>

          <p-table
            [value]="genres"
            [loading]="loading"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [globalFilterFields]="['name', 'description']"
            styleClass="p-datatable-sm"
            class="mt-4"
          >
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="name" style="width:30%">Name <p-sortIcon field="name"></p-sortIcon></th>
                <th style="width:55%">Description</th>
                <th style="width:15%">Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-genre>
              <tr>
                <td><strong>{{ genre.name }}</strong></td>
                <td>{{ genre.description || '-' }}</td>
                <td>
                  <button pButton icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm mr-2" (click)="editGenre(genre)"></button>
                  <button pButton icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger p-button-sm" (click)="deleteGenre(genre)"></button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="3" class="text-center py-8 text-gray-500">
                  No genres found. Click "New Genre" to add one.
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </main>

      <!-- Genre Dialog -->
      <p-dialog
        [(visible)]="genreDialog"
        [header]="genre.id ? 'Edit Genre' : 'New Genre'"
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
              [(ngModel)]="genre.name"
              required
              class="w-full"
              placeholder="Genre name"
            />
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              id="description"
              pInputTextarea
              [(ngModel)]="genre.description"
              rows="4"
              class="w-full"
              placeholder="Genre description"
            ></textarea>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" icon="pi pi-times" (click)="hideDialog()" class="p-button-text"></button>
          <button pButton label="Save" icon="pi pi-check" (click)="saveGenre()" [disabled]="!genre.name"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: []
})
export class GenresComponent implements OnInit {
  genres: Genre[] = [];
  genre: Partial<Genre> = {};
  genreDialog = false;
  loading = false;

  constructor(
    private genreService: GenreService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadGenres();
  }

  loadGenres() {
    this.loading = true;
    this.genreService.getAll().subscribe({
      next: (data) => {
        this.genres = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading genres:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load genres'
        });
        this.loading = false;
      }
    });
  }

  openNew() {
    this.genre = {};
    this.genreDialog = true;
  }

  editGenre(genre: Genre) {
    this.genre = { ...genre };
    this.genreDialog = true;
  }

  hideDialog() {
    this.genreDialog = false;
    this.genre = {};
  }

  saveGenre() {
    if (!this.genre.name) {
      return;
    }

    if (this.genre.id) {
      // Update existing genre
      this.genreService.update(this.genre.id, this.genre).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Genre updated successfully'
          });
          this.loadGenres();
          this.hideDialog();
        },
        error: (error) => {
          console.error('Error updating genre:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update genre'
          });
        }
      });
    } else {
      // Create new genre
      this.genreService.create(this.genre).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Genre created successfully'
          });
          this.loadGenres();
          this.hideDialog();
        },
        error: (error) => {
          console.error('Error creating genre:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.error || 'Failed to create genre'
          });
        }
      });
    }
  }

  deleteGenre(genre: Genre) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${genre.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.genreService.delete(genre.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Genre deleted successfully'
            });
            this.loadGenres();
          },
          error: (error) => {
            console.error('Error deleting genre:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete genre'
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
