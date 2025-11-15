import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { ChipModule } from 'primeng/chip';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ItemService, DigitalItemFilters, PhysicalItemFilters } from '../../services/item.service';
import { AuthService } from '../../services/auth.service';
import { AuthorService, Author } from '../../services/author.service';
import { PublisherService, Publisher } from '../../services/publisher.service';
import { GenreService, Genre } from '../../services/genre.service';
import { ExportImportService, ImportResult } from '../../services/export-import.service';
import { CollectionService, Collection } from '../../services/collection.service';
import { DigitalItem, PhysicalItem, ReadingStatus } from '../../models/item.model';
import { ReadingProgress } from '../../models/reading-progress.model';
import { User } from '../../models/user.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CollectionDialogComponent } from '../../components/collection-dialog.component';
import { AddToCollectionDialogComponent } from '../../components/add-to-collection-dialog.component';
import { ISBNScannerComponent } from '../../components/isbn-scanner.component';
import { LibibImportDialogComponent } from '../../components/libib-import-dialog.component';
import { ISBNService, BookMetadata } from '../../services/isbn.service';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabViewModule,
    DataViewModule,
    ButtonModule,
    CardModule,
    TagModule,
    RatingModule,
    ProgressBarModule,
    ConfirmDialogModule,
    ToastModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    DropdownModule,
    ChipModule,
    CheckboxModule,
    DialogModule,
    MenuModule,
    TooltipModule,
    CollectionDialogComponent,
    AddToCollectionDialogComponent,
    ISBNScannerComponent,
    LibibImportDialogComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './library.component.html',
  styleUrl: './library.component.css'
})
export class LibraryComponent implements OnInit {
  digitalItems: DigitalItem[] = [];
  physicalItems: PhysicalItem[] = [];
  currentUser: User | null = null;
  searchQuery = '';
  isSearching = false;
  searchResultsCount: number | null = null;
  private searchSubject = new Subject<string>();

  // Utility for template
  Object = Object;

  // Filter data
  authors: Author[] = [];
  publishers: Publisher[] = [];
  genres: Genre[] = [];

  // Digital item filters
  digitalFilters: DigitalItemFilters = {};
  digitalTypeOptions = [
    { label: 'Book', value: 'book' },
    { label: 'Magazine', value: 'magazine' },
    { label: 'Comic', value: 'comic' },
    { label: 'Document', value: 'document' }
  ];
  digitalFormatOptions = [
    { label: 'PDF', value: 'pdf' },
    { label: 'EPUB', value: 'epub' },
    { label: 'MOBI', value: 'mobi' },
    { label: 'AZW', value: 'azw' }
  ];

  // Physical item filters
  physicalFilters: PhysicalItemFilters = {};
  physicalTypeOptions = [
    { label: 'Book', value: 'book' },
    { label: 'Magazine', value: 'magazine' },
    { label: 'Comic', value: 'comic' },
    { label: 'DVD', value: 'dvd' },
    { label: 'CD', value: 'cd' }
  ];
  physicalConditionOptions = [
    { label: 'New', value: 'new' },
    { label: 'Like New', value: 'like_new' },
    { label: 'Good', value: 'good' },
    { label: 'Fair', value: 'fair' },
    { label: 'Poor', value: 'poor' }
  ];

  // Sort options
  sortOptions = [
    { label: 'Newest First', value: { sortBy: 'createdAt', sortOrder: 'DESC' } },
    { label: 'Oldest First', value: { sortBy: 'createdAt', sortOrder: 'ASC' } },
    { label: 'Title A-Z', value: { sortBy: 'title', sortOrder: 'ASC' } },
    { label: 'Title Z-A', value: { sortBy: 'title', sortOrder: 'DESC' } },
    { label: 'Highest Rated', value: { sortBy: 'rating', sortOrder: 'DESC' } },
    { label: 'Lowest Rated', value: { sortBy: 'rating', sortOrder: 'ASC' } },
    { label: 'Year (Newest)', value: { sortBy: 'publishedYear', sortOrder: 'DESC' } },
    { label: 'Year (Oldest)', value: { sortBy: 'publishedYear', sortOrder: 'ASC' } }
  ];

  // Bulk selection state
  selectedDigitalItems: Set<number> = new Set();
  selectedPhysicalItems: Set<number> = new Set();
  selectionMode = false;
  selectAllDigitalChecked = false;
  selectAllPhysicalChecked = false;

  // Export/Import state
  exportMenuItems: MenuItem[] = [];
  importMenuItems: MenuItem[] = [];
  importDialogVisible = false;
  libibImportDialogVisible = false;
  selectedFile: File | null = null;
  isImporting = false;
  isExporting = false;
  importError: string | null = null;
  importSuccess = false;
  importResult: ImportResult | null = null;

  // Collections state
  collections: Collection[] = [];
  selectedCollectionId: number | null = null;
  collectionDialogVisible = false;
  addToCollectionDialogVisible = false;
  selectedItemForCollection: { id: number; type: 'digital' | 'physical' } | null = null;
  editingCollection: Collection | null = null;

  // ISBN Scanner state
  isbnScannerVisible = false;

  constructor(
    private itemService: ItemService,
    private authService: AuthService,
    private authorService: AuthorService,
    private publisherService: PublisherService,
    private genreService: GenreService,
    private exportImportService: ExportImportService,
    private collectionService: CollectionService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    // Initialize export menu items
    this.exportMenuItems = [
      {
        label: 'Export as JSON',
        icon: 'pi pi-file',
        command: () => this.exportJSON()
      },
      {
        label: 'Export as CSV',
        icon: 'pi pi-file-excel',
        command: () => this.exportCSV()
      }
    ];

    // Initialize import menu items
    this.importMenuItems = [
      {
        label: 'Import JSON',
        icon: 'pi pi-file',
        command: () => this.showImportDialog()
      },
      {
        label: 'Import from Libib',
        icon: 'pi pi-upload',
        command: () => this.openLibibImportDialog()
      }
    ];
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Set up debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });

    this.loadFilterData();
    this.loadCollections();
    this.loadDigitalItems();
    this.loadPhysicalItems();
  }

  loadFilterData(): void {
    // Load authors
    this.authorService.getAll().subscribe({
      next: (authors: Author[]) => {
        this.authors = authors;
      },
      error: (error: any) => {
        console.error('Failed to load authors:', error);
      }
    });

    // Load publishers
    this.publisherService.getAll().subscribe({
      next: (publishers: Publisher[]) => {
        this.publishers = publishers;
      },
      error: (error: any) => {
        console.error('Failed to load publishers:', error);
      }
    });

    // Load genres
    this.genreService.getAll().subscribe({
      next: (genres: Genre[]) => {
        this.genres = genres;
      },
      error: (error: any) => {
        console.error('Failed to load genres:', error);
      }
    });
  }

  get totalPhysicalQuantity(): number {
    return this.physicalItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  loadDigitalItems(): void {
    this.itemService.getDigitalItems(this.digitalFilters).subscribe({
      next: (response) => {
        this.digitalItems = response.items;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load digital items'
        });
      }
    });
  }

  loadPhysicalItems(): void {
    this.itemService.getPhysicalItems(this.physicalFilters).subscribe({
      next: (response) => {
        this.physicalItems = response.items;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load physical items'
        });
      }
    });
  }

  // Filter change handlers
  onDigitalFilterChange(): void {
    this.loadDigitalItems();
  }

  onPhysicalFilterChange(): void {
    this.loadPhysicalItems();
  }

  clearDigitalFilters(): void {
    this.digitalFilters = {};
    this.loadDigitalItems();
  }

  clearPhysicalFilters(): void {
    this.physicalFilters = {};
    this.loadPhysicalItems();
  }

  removeDigitalFilter(filterKey: string): void {
    delete (this.digitalFilters as any)[filterKey];
    this.loadDigitalItems();
  }

  removePhysicalFilter(filterKey: string): void {
    delete (this.physicalFilters as any)[filterKey];
    this.loadPhysicalItems();
  }

  getFilterLabel(filterKey: string, filterValue: any): string {
    switch (filterKey) {
      case 'type':
        return `Type: ${filterValue}`;
      case 'format':
        return `Format: ${filterValue}`;
      case 'condition':
        return `Condition: ${filterValue}`;
      case 'authorId':
        const author = this.authors.find(a => a.id === filterValue);
        return author ? `Author: ${author.name}` : `Author: ${filterValue}`;
      case 'publisherId':
        const publisher = this.publishers.find(p => p.id === filterValue);
        return publisher ? `Publisher: ${publisher.name}` : `Publisher: ${filterValue}`;
      case 'genreId':
        const genre = this.genres.find(g => g.id === filterValue);
        return genre ? `Genre: ${genre.name}` : `Genre: ${filterValue}`;
      case 'sortBy':
        return `Sort: ${filterValue}`;
      case 'sortOrder':
        return filterValue === 'ASC' ? 'Ascending' : 'Descending';
      case 'minRating':
        return `Min Rating: ${filterValue}`;
      case 'maxRating':
        return `Max Rating: ${filterValue}`;
      default:
        return `${filterKey}: ${filterValue}`;
    }
  }

  hasActiveDigitalFilters(): boolean {
    return Object.keys(this.digitalFilters).length > 0;
  }

  hasActivePhysicalFilters(): boolean {
    return Object.keys(this.physicalFilters).length > 0;
  }

  getDigitalFilterValue(key: string): any {
    return (this.digitalFilters as any)[key];
  }

  getPhysicalFilterValue(key: string): any {
    return (this.physicalFilters as any)[key];
  }

  addDigitalItem(): void {
    this.router.navigate(['/items/digital/new']);
  }

  addPhysicalItem(): void {
    this.router.navigate(['/items/physical/new']);
  }

  viewDigitalItem(id: number): void {
    this.router.navigate(['/items/digital', id]);
  }

  viewPhysicalItem(id: number): void {
    this.router.navigate(['/items/physical', id]);
  }

  editDigitalItem(id: number): void {
    this.router.navigate(['/items/digital', id, 'edit']);
  }

  editPhysicalItem(id: number): void {
    this.router.navigate(['/items/physical', id, 'edit']);
  }

  deleteDigitalItem(item: DigitalItem): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${item.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.itemService.deleteDigitalItem(item.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Digital item deleted successfully'
            });
            this.loadDigitalItems();
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
    });
  }

  deletePhysicalItem(item: PhysicalItem): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${item.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.itemService.deletePhysicalItem(item.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Physical item deleted successfully'
            });
            this.loadPhysicalItems();
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
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  performSearch(query: string): void {
    if (!query || query.trim().length === 0) {
      // If search is empty, reload all items
      this.searchResultsCount = null;
      this.loadDigitalItems();
      this.loadPhysicalItems();
      return;
    }

    this.isSearching = true;

    // Search digital items
    this.itemService.searchDigitalItems(query).subscribe({
      next: (response) => {
        this.digitalItems = response.items;
        this.isSearching = false;
      },
      error: (error) => {
        this.isSearching = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Search Error',
          detail: 'Failed to search digital items'
        });
      }
    });

    // Search physical items
    this.itemService.searchPhysicalItems(query).subscribe({
      next: (response) => {
        this.physicalItems = response.items;
        this.searchResultsCount = this.digitalItems.length + this.physicalItems.length;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Search Error',
          detail: 'Failed to search physical items'
        });
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResultsCount = null;
    this.loadDigitalItems();
    this.loadPhysicalItems();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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

  getCoverUrl(coverImage?: string): string {
    if (!coverImage) {
      return 'https://via.placeholder.com/300x450?text=No+Cover';
    }
    // Add 'covers/' prefix if not already present (for backwards compatibility)
    const imagePath = coverImage.startsWith('covers/') ? coverImage : `covers/${coverImage}`;
    return `http://localhost:3001/uploads/${imagePath}`;
  }

  // Bulk selection methods
  toggleSelectionMode(): void {
    this.selectionMode = !this.selectionMode;
    if (!this.selectionMode) {
      this.clearSelection();
    }
  }

  toggleDigitalItemSelection(id: number): void {
    if (this.selectedDigitalItems.has(id)) {
      this.selectedDigitalItems.delete(id);
    } else {
      this.selectedDigitalItems.add(id);
    }
  }

  togglePhysicalItemSelection(id: number): void {
    if (this.selectedPhysicalItems.has(id)) {
      this.selectedPhysicalItems.delete(id);
    } else {
      this.selectedPhysicalItems.add(id);
    }
  }

  isDigitalItemSelected(id: number): boolean {
    return this.selectedDigitalItems.has(id);
  }

  isPhysicalItemSelected(id: number): boolean {
    return this.selectedPhysicalItems.has(id);
  }

  selectAllDigital(): void {
    this.selectedDigitalItems.clear();
    this.digitalItems.forEach(item => this.selectedDigitalItems.add(item.id));
  }

  selectAllPhysical(): void {
    this.selectedPhysicalItems.clear();
    this.physicalItems.forEach(item => this.selectedPhysicalItems.add(item.id));
  }

  clearSelection(): void {
    this.selectedDigitalItems.clear();
    this.selectedPhysicalItems.clear();
  }

  getSelectedCount(): number {
    return this.selectedDigitalItems.size + this.selectedPhysicalItems.size;
  }

  areAllDigitalSelected(): boolean {
    return this.digitalItems.length > 0 && this.selectedDigitalItems.size === this.digitalItems.length;
  }

  areAllPhysicalSelected(): boolean {
    return this.physicalItems.length > 0 && this.selectedPhysicalItems.size === this.physicalItems.length;
  }

  // Bulk operations
  bulkDeleteSelected(): void {
    const count = this.getSelectedCount();
    if (count === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Selection',
        detail: 'Please select items to delete'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${count} selected item(s)?`,
      header: 'Confirm Bulk Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const digitalDeletes = Array.from(this.selectedDigitalItems).map(id =>
          this.itemService.deleteDigitalItem(id)
        );

        const physicalDeletes = Array.from(this.selectedPhysicalItems).map(id =>
          this.itemService.deletePhysicalItem(id)
        );

        let completed = 0;
        const total = digitalDeletes.length + physicalDeletes.length;

        [...digitalDeletes, ...physicalDeletes].forEach(deleteObs => {
          deleteObs.subscribe({
            next: () => {
              completed++;
              if (completed === total) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Deleted',
                  detail: `${count} item(s) deleted successfully`
                });
                this.clearSelection();
                this.loadDigitalItems();
                this.loadPhysicalItems();
              }
            },
            error: (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to delete some items'
              });
            }
          });
        });
      }
    });
  }

  onSelectAllDigitalChange(): void {
    if (this.selectAllDigitalChecked) {
      this.selectAllDigital();
    } else {
      this.selectedDigitalItems.clear();
    }
  }

  onSelectAllPhysicalChange(): void {
    if (this.selectAllPhysicalChecked) {
      this.selectAllPhysical();
    } else {
      this.selectedPhysicalItems.clear();
    }
  }

  // Export/Import methods
  exportJSON(): void {
    this.exportImportService.exportJSON();
  }

  exportCSV(): void {
    this.exportImportService.exportCSV();
  }

  showImportDialog(): void {
    this.importDialogVisible = true;
    this.selectedFile = null;
    this.importError = null;
    this.importSuccess = false;
    this.importResult = null;
  }

  closeImportDialog(): void {
    this.importDialogVisible = false;
    this.selectedFile = null;
    this.importError = null;
    this.importSuccess = false;
    this.importResult = null;
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.importError = null;
    }
  }

  async performImport(): Promise<void> {
    if (!this.selectedFile) {
      return;
    }

    this.isImporting = true;
    this.importError = null;
    this.importSuccess = false;

    try {
      const jsonData = await this.exportImportService.readJSONFile(this.selectedFile);

      this.exportImportService.importJSON(jsonData).subscribe({
        next: (result) => {
          this.importSuccess = true;
          this.importResult = result;
          this.isImporting = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Import Successful',
            detail: `Imported ${result.imported.digitalItems} digital items and ${result.imported.physicalItems} physical items`
          });

          // Reload items after successful import
          setTimeout(() => {
            this.loadDigitalItems();
            this.loadPhysicalItems();
            this.closeImportDialog();
          }, 2000);
        },
        error: (error) => {
          this.isImporting = false;
          this.importError = error.error?.error || 'Failed to import data';
          this.messageService.add({
            severity: 'error',
            summary: 'Import Failed',
            detail: this.importError || undefined
          });
        }
      });
    } catch (error) {
      this.isImporting = false;
      this.importError = (error as Error).message || 'Invalid JSON file';
      this.messageService.add({
        severity: 'error',
        summary: 'Import Failed',
        detail: this.importError || undefined
      });
    }
  }

  // Collection methods
  loadCollections(): void {
    this.collectionService.getCollections().subscribe({
      next: (collections) => {
        this.collections = collections;
      },
      error: (error) => {
        console.error('Failed to load collections:', error);
      }
    });
  }

  openManageCollectionsDialog(): void {
    this.editingCollection = null;
    this.collectionDialogVisible = true;
  }

  openEditCollectionDialog(collection: Collection): void {
    this.editingCollection = collection;
    this.collectionDialogVisible = true;
  }

  onCollectionSaved(collection: Collection): void {
    this.collectionDialogVisible = false;
    this.loadCollections();
  }

  openAddToCollectionDialog(itemId: number, itemType: 'digital' | 'physical'): void {
    this.selectedItemForCollection = { id: itemId, type: itemType };
    this.addToCollectionDialogVisible = true;
  }

  onItemAddedToCollection(): void {
    this.addToCollectionDialogVisible = false;
    this.selectedItemForCollection = null;
  }

  // ISBN Scanner methods
  openISBNScanner(): void {
    this.isbnScannerVisible = true;
  }

  onBookFound(bookMetadata: BookMetadata): void {
    // Keep scanner open for batch scanning mode
    // Users can scan multiple books and add them one by one
    // The scanner dialog remains visible with scan history
    // this.isbnScannerVisible = false; // Commented out to enable batch mode

    // Store book metadata in session storage for the add item form
    sessionStorage.setItem('isbnBookMetadata', JSON.stringify(bookMetadata));

    // Navigate to add physical item page (most books scanned are physical items)
    // Scanner stays visible in background, allowing user to return and continue scanning
    this.router.navigate(['/items/physical/new']);
  }

  selectCollection(collectionId: number | null): void {
    this.selectedCollectionId = collectionId;
    if (collectionId === null) {
      // Show all items
      this.loadDigitalItems();
      this.loadPhysicalItems();
    } else {
      // Filter by collection
      this.loadCollectionItems(collectionId);
    }
  }

  loadCollectionItems(collectionId: number): void {
    this.collectionService.getCollectionById(collectionId).subscribe({
      next: (collection) => {
        this.digitalItems = collection.digitalItems || [];
        this.physicalItems = collection.physicalItems || [];
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load collection items'
        });
      }
    });
  }

  viewCollection(collectionId: number): void {
    this.router.navigate(['/collections', collectionId]);
  }

  getCollectionItemCount(collection: Collection): number {
    const digitalCount = collection.digitalItems?.length || 0;
    const physicalCount = collection.physicalItems?.length || 0;
    return digitalCount + physicalCount;
  }

  // Libib Import methods
  openLibibImportDialog(): void {
    this.libibImportDialogVisible = true;
  }

  onLibibImportSuccess(): void {
    // Reload library items after successful import
    this.loadDigitalItems();
    this.loadPhysicalItems();
    this.loadFilterData(); // Reload authors, publishers, genres
  }

  // Reading progress helper methods
  getItemProgress(item: DigitalItem): ReadingProgress | null {
    if (!item.readingProgress || item.readingProgress.length === 0) {
      return null;
    }
    // Return the most recent progress (sorted by lastReadAt)
    return item.readingProgress.reduce((latest, current) => {
      const latestDate = new Date(latest.lastReadAt);
      const currentDate = new Date(current.lastReadAt);
      return currentDate > latestDate ? current : latest;
    });
  }

  getReadingProgressLabel(progress: ReadingProgress): string {
    if (progress.percentage === 0) {
      return 'Not started';
    } else if (progress.percentage >= 100) {
      return 'Completed';
    } else if (progress.percentage > 75) {
      return 'Almost done';
    } else if (progress.percentage > 50) {
      return 'Halfway through';
    } else if (progress.percentage > 25) {
      return 'In progress';
    } else {
      return 'Just started';
    }
  }

  getRelativeTime(date: Date | string): string {
    const now = new Date();
    const readDate = new Date(date);
    const diffMs = now.getTime() - readDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years === 1 ? '' : 's'} ago`;
    }
  }
}
