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
import { PublisherService, Publisher } from '../../services/publisher.service';

@Component({
  selector: 'app-publishers',
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
            <h1 class="text-2xl font-bold text-gray-900">Publisher Management</h1>
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
              <h2 class="text-xl font-semibold">Publishers ({{ publishers.length }})</h2>
            </ng-template>
            <ng-template pTemplate="right">
              <button pButton label="New Publisher" icon="pi pi-plus" (click)="openNew()"></button>
            </ng-template>
          </p-toolbar>

          <p-table
            [value]="publishers"
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
                <th pSortableColumn="name" style="width:25%">Name <p-sortIcon field="name"></p-sortIcon></th>
                <th style="width:40%">Description</th>
                <th pSortableColumn="website" style="width:20%">Website <p-sortIcon field="website"></p-sortIcon></th>
                <th style="width:15%">Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-publisher>
              <tr>
                <td><strong>{{ publisher.name }}</strong></td>
                <td>{{ publisher.description || '-' }}</td>
                <td>
                  <a *ngIf="publisher.website" [href]="publisher.website" target="_blank" class="text-blue-600 hover:underline">
                    <i class="pi pi-external-link mr-1"></i>Link
                  </a>
                  <span *ngIf="!publisher.website">-</span>
                </td>
                <td>
                  <button pButton icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm mr-2" (click)="editPublisher(publisher)"></button>
                  <button pButton icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger p-button-sm" (click)="deletePublisher(publisher)"></button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="4" class="text-center py-8 text-gray-500">
                  No publishers found. Click "New Publisher" to add one.
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </main>

      <!-- Publisher Dialog -->
      <p-dialog
        [(visible)]="publisherDialog"
        [header]="publisher.id ? 'Edit Publisher' : 'New Publisher'"
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
              [(ngModel)]="publisher.name"
              required
              class="w-full"
              placeholder="Publisher name"
            />
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              id="description"
              pInputTextarea
              [(ngModel)]="publisher.description"
              rows="4"
              class="w-full"
              placeholder="Publisher description"
            ></textarea>
          </div>

          <div>
            <label for="website" class="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              id="website"
              type="url"
              pInputText
              [(ngModel)]="publisher.website"
              class="w-full"
              placeholder="https://example.com"
            />
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" icon="pi pi-times" (click)="hideDialog()" class="p-button-text"></button>
          <button pButton label="Save" icon="pi pi-check" (click)="savePublisher()" [disabled]="!publisher.name"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: []
})
export class PublishersComponent implements OnInit {
  publishers: Publisher[] = [];
  publisher: Partial<Publisher> = {};
  publisherDialog = false;
  loading = false;

  constructor(
    private publisherService: PublisherService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPublishers();
  }

  loadPublishers() {
    this.loading = true;
    this.publisherService.getAll().subscribe({
      next: (data) => {
        this.publishers = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading publishers:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load publishers'
        });
        this.loading = false;
      }
    });
  }

  openNew() {
    this.publisher = {};
    this.publisherDialog = true;
  }

  editPublisher(publisher: Publisher) {
    this.publisher = { ...publisher };
    this.publisherDialog = true;
  }

  hideDialog() {
    this.publisherDialog = false;
    this.publisher = {};
  }

  savePublisher() {
    if (!this.publisher.name) {
      return;
    }

    if (this.publisher.id) {
      // Update existing publisher
      this.publisherService.update(this.publisher.id, this.publisher).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Publisher updated successfully'
          });
          this.loadPublishers();
          this.hideDialog();
        },
        error: (error) => {
          console.error('Error updating publisher:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update publisher'
          });
        }
      });
    } else {
      // Create new publisher
      this.publisherService.create(this.publisher).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Publisher created successfully'
          });
          this.loadPublishers();
          this.hideDialog();
        },
        error: (error) => {
          console.error('Error creating publisher:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.error || 'Failed to create publisher'
          });
        }
      });
    }
  }

  deletePublisher(publisher: Publisher) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${publisher.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.publisherService.delete(publisher.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Publisher deleted successfully'
            });
            this.loadPublishers();
          },
          error: (error) => {
            console.error('Error deleting publisher:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete publisher'
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
