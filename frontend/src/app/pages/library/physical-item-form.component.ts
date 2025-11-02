import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { MessagesModule } from 'primeng/messages';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ItemService } from '../../services/item.service';
import { GoogleBooksService } from '../../services/google-books.service';
import { LCCNService } from '../../services/lccn.service';
import { AuthorService } from '../../services/author.service';
import { PublisherService } from '../../services/publisher.service';
import { GenreService } from '../../services/genre.service';
import { PhysicalItemType, PhysicalItemCondition, ReadingStatus, Author, Publisher, Genre } from '../../models/item.model';

interface Message {
  severity: string;
  summary: string;
  detail: string;
}

@Component({
  selector: 'app-physical-item-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    InputNumberModule,
    DropdownModule,
    MultiSelectModule,
    CheckboxModule,
    CardModule,
    MessagesModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './physical-item-form.component.html',
  styleUrl: './physical-item-form.component.css'
})
export class PhysicalItemFormComponent implements OnInit {
  itemForm: FormGroup;
  loading = false;
  messages: Message[] = [];
  isEditMode = false;
  itemId: number | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  currentCoverImage: string | null = null;
  tagInput = '';
  tags: string[] = [];
  lookupLoading = false;

  // Relationship data
  authors: Author[] = [];
  publishers: Publisher[] = [];
  genres: Genre[] = [];

  itemTypes = [
    { label: 'Book', value: PhysicalItemType.BOOK },
    { label: 'DVD', value: PhysicalItemType.DVD },
    { label: 'Blu-ray', value: PhysicalItemType.BLURAY },
    { label: 'CD', value: PhysicalItemType.CD },
    { label: 'Vinyl', value: PhysicalItemType.VINYL },
    { label: 'Magazine', value: PhysicalItemType.MAGAZINE },
    { label: 'Comic', value: PhysicalItemType.COMIC },
    { label: 'Other', value: PhysicalItemType.OTHER }
  ];

  itemConditions = [
    { label: 'New', value: PhysicalItemCondition.NEW },
    { label: 'Like New', value: PhysicalItemCondition.LIKE_NEW },
    { label: 'Very Good', value: PhysicalItemCondition.VERY_GOOD },
    { label: 'Good', value: PhysicalItemCondition.GOOD },
    { label: 'Acceptable', value: PhysicalItemCondition.ACCEPTABLE },
    { label: 'Poor', value: PhysicalItemCondition.POOR }
  ];

  readingStatusOptions = [
    { label: 'To Read', value: ReadingStatus.TO_READ },
    { label: 'Reading', value: ReadingStatus.READING },
    { label: 'Completed', value: ReadingStatus.COMPLETED },
    { label: 'On Hold', value: ReadingStatus.ON_HOLD },
    { label: 'Dropped', value: ReadingStatus.DROPPED }
  ];

  constructor(
    private fb: FormBuilder,
    private itemService: ItemService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private googleBooksService: GoogleBooksService,
    private lccnService: LCCNService,
    private authorService: AuthorService,
    private publisherService: PublisherService,
    private genreService: GenreService
  ) {
    this.itemForm = this.fb.group({
      title: ['', [Validators.required]],
      type: [PhysicalItemType.BOOK, [Validators.required]],
      condition: [null],
      description: [''],
      isbn: [''],
      lccn: [''],
      barcode: [''],
      publisher: [''],
      publisherId: [null],
      publishedYear: [null],
      language: [''],
      location: [''],
      quantity: [1],
      rating: [null],
      coverImage: [''],
      tags: [[]],
      authorIds: [[]],
      genreIds: [[]],
      readingStatus: [null],
      isFavorite: [false],
      notes: [''],
      review: ['']
    });
  }

  ngOnInit(): void {
    // Load relationship data
    this.loadAuthors();
    this.loadPublishers();
    this.loadGenres();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.itemId = parseInt(id, 10);
      this.loadItem();
    } else {
      // Check for ISBN scanner metadata in session storage
      this.loadISBNMetadata();
    }
  }

  loadItem(): void {
    if (this.itemId) {
      this.itemService.getPhysicalItem(this.itemId).subscribe({
        next: (response) => {
          const item = response.item;

          // Extract relationship IDs
          const authorIds = item.authors?.map(a => a.id) || [];
          const genreIds = item.genres?.map(g => g.id) || [];

          this.itemForm.patchValue({
            ...item,
            authorIds,
            genreIds
          });

          // Load tags
          if (item.tags && Array.isArray(item.tags)) {
            this.tags = item.tags;
          }

          // Load cover image
          if (item.coverImage) {
            this.currentCoverImage = item.coverImage;
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load item'
          });
        }
      });
    }
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      this.loading = true;
      this.messages = [];

      // If there's a selected file, upload it first
      if (this.selectedFile) {
        this.itemService.uploadCover(this.selectedFile).subscribe({
          next: (uploadResponse) => {
            // Update form with uploaded image path (includes covers/ subfolder)
            this.itemForm.patchValue({ coverImage: `covers/${uploadResponse.filename}` });
            this.saveItem();
          },
          error: (error) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Upload Failed',
              detail: error.error?.message || 'Failed to upload image'
            });
          }
        });
      } else {
        this.saveItem();
      }
    }
  }

  private saveItem(): void {
    const itemData = this.itemForm.value;

    const operation = this.isEditMode && this.itemId
      ? this.itemService.updatePhysicalItem(this.itemId, itemData)
      : this.itemService.createPhysicalItem(itemData);

    operation.subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: response.message
        });
        setTimeout(() => this.goBack(), 1500);
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'An error occurred'
        });
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid File',
          detail: 'Please select an image file'
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.messageService.add({
          severity: 'error',
          summary: 'File Too Large',
          detail: 'Image must be less than 5MB'
        });
        return;
      }

      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.currentCoverImage = null;
    this.itemForm.patchValue({ coverImage: '' });
  }

  addTag(): void {
    if (this.tagInput.trim() && !this.tags.includes(this.tagInput.trim())) {
      this.tags.push(this.tagInput.trim());
      this.itemForm.patchValue({ tags: this.tags });
      this.tagInput = '';
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
    this.itemForm.patchValue({ tags: this.tags });
  }

  onTagInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  goBack(): void {
    this.router.navigate(['/library']);
  }

  lookupFromISBN(): void {
    const isbn = this.itemForm.get('isbn')?.value;
    if (!isbn) return;

    this.lookupLoading = true;
    this.googleBooksService.searchByISBN(isbn).subscribe({
      next: async (metadata) => {
        if (!metadata) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Not Found',
            detail: 'No book found for this ISBN'
          });
          this.lookupLoading = false;
          return;
        }

        // Populate form fields (skip publisher as it requires ID matching)
        this.itemForm.patchValue({
          title: metadata.title || this.itemForm.get('title')?.value,
          description: metadata.description || this.itemForm.get('description')?.value,
          publishedYear: metadata.publishedYear || this.itemForm.get('publishedYear')?.value,
          language: metadata.language || this.itemForm.get('language')?.value,
          rating: metadata.rating || this.itemForm.get('rating')?.value
        });

        // Add categories as tags
        if (metadata.categories && metadata.categories.length > 0) {
          this.tags = [...new Set([...this.tags, ...metadata.categories])];
          this.itemForm.patchValue({ tags: this.tags });
        }

        // Download cover image if available
        if (metadata.coverImageUrl) {
          const coverFile = await this.googleBooksService.downloadCoverImage(metadata.coverImageUrl);
          if (coverFile) {
            this.selectedFile = coverFile;
            const reader = new FileReader();
            reader.onload = (e) => {
              this.imagePreview = e.target?.result as string;
            };
            reader.readAsDataURL(coverFile);
          }
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Book details loaded from Google Books'
        });
        this.lookupLoading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to lookup ISBN'
        });
        this.lookupLoading = false;
      }
    });
  }

  lookupFromLCCN(): void {
    const lccn = this.itemForm.get('lccn')?.value;
    if (!lccn) return;

    this.lookupLoading = true;
    this.lccnService.searchByLCCN(lccn).subscribe({
      next: async (metadata) => {
        if (!metadata) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Not Found',
            detail: 'No book found for this LCCN'
          });
          this.lookupLoading = false;
          return;
        }

        // Populate form fields (skip publisher as it requires ID matching)
        this.itemForm.patchValue({
          title: metadata.title || this.itemForm.get('title')?.value,
          description: metadata.description || this.itemForm.get('description')?.value,
          publishedYear: metadata.publishedYear || this.itemForm.get('publishedYear')?.value,
          language: metadata.language || this.itemForm.get('language')?.value,
          rating: metadata.rating || this.itemForm.get('rating')?.value
        });

        // If ISBN is available from the LCCN lookup, populate it
        if (metadata.isbn13 && !this.itemForm.get('isbn')?.value) {
          this.itemForm.patchValue({ isbn: metadata.isbn13 });
        } else if (metadata.isbn10 && !this.itemForm.get('isbn')?.value) {
          this.itemForm.patchValue({ isbn: metadata.isbn10 });
        }

        // Add categories as tags
        if (metadata.categories && metadata.categories.length > 0) {
          this.tags = [...new Set([...this.tags, ...metadata.categories])];
          this.itemForm.patchValue({ tags: this.tags });
        }

        // Download cover image if available
        if (metadata.coverImage) {
          const coverFile = await this.lccnService.downloadCoverImage(metadata.coverImage);
          if (coverFile) {
            this.selectedFile = coverFile;
            const reader = new FileReader();
            reader.onload = (e) => {
              this.imagePreview = e.target?.result as string;
            };
            reader.readAsDataURL(coverFile);
          }
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Book details loaded from Open Library'
        });
        this.lookupLoading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to lookup LCCN'
        });
        this.lookupLoading = false;
      }
    });
  }

  loadAuthors(): void {
    this.authorService.getAll().subscribe({
      next: (response: any) => {
        this.authors = response.authors || response;
      },
      error: (error) => {
        console.error('Failed to load authors:', error);
      }
    });
  }

  loadPublishers(): void {
    this.publisherService.getAll().subscribe({
      next: (response: any) => {
        this.publishers = response.publishers || response;
      },
      error: (error) => {
        console.error('Failed to load publishers:', error);
      }
    });
  }

  loadGenres(): void {
    this.genreService.getAll().subscribe({
      next: (response: any) => {
        this.genres = response.genres || response;
      },
      error: (error) => {
        console.error('Failed to load genres:', error);
      }
    });
  }

  loadISBNMetadata(): void {
    const metadataJson = sessionStorage.getItem('isbnBookMetadata');
    if (!metadataJson) {
      console.log('[ISBN] No metadata found in sessionStorage');
      return;
    }

    try {
      const metadata = JSON.parse(metadataJson);
      console.log('[ISBN] Loaded metadata from sessionStorage:', metadata);

      // Pre-populate form with ISBN metadata
      this.itemForm.patchValue({
        title: metadata.title || '',
        description: metadata.description || '',
        isbn: metadata.isbn || '',
        publisher: metadata.publisher || '',
        publishedYear: metadata.publishedYear || null,
        language: metadata.language || '',
        rating: metadata.rating || null
      });

      // Add authors as tags if available
      if (metadata.authors && metadata.authors.length > 0) {
        this.tags = [...metadata.authors];
        this.itemForm.patchValue({ tags: this.tags });
        console.log('[ISBN] Added authors as tags:', this.tags);
      }

      // Add categories as tags if available
      if (metadata.categories && metadata.categories.length > 0) {
        this.tags = [...new Set([...this.tags, ...metadata.categories])];
        this.itemForm.patchValue({ tags: this.tags });
        console.log('[ISBN] Added categories as tags:', this.tags);
      }

      // Download and set cover image if available
      if (metadata.coverImage) {
        console.log('[ISBN] Cover image URL found:', metadata.coverImage);
        this.downloadCoverImage(metadata.coverImage);
      } else {
        console.log('[ISBN] No cover image URL in metadata');
      }

      // Clear session storage after loading
      sessionStorage.removeItem('isbnBookMetadata');

      // Show success message
      this.messageService.add({
        severity: 'success',
        summary: 'Book Loaded',
        detail: `Pre-filled from ISBN: ${metadata.title}`
      });
    } catch (error) {
      console.error('[ISBN] Failed to load ISBN metadata:', error);
      sessionStorage.removeItem('isbnBookMetadata');
    }
  }

  async downloadCoverImage(coverImageUrl: string): Promise<void> {
    try {
      console.log('[ISBN] Downloading cover image from:', coverImageUrl);

      // Use backend proxy to bypass CORS restrictions
      const response = await fetch(`http://localhost:3001/public/proxy-image?url=${encodeURIComponent(coverImageUrl)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const filename = `cover_${Date.now()}.jpg`;
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

      this.selectedFile = file;
      console.log('[ISBN] Cover image downloaded successfully, size:', file.size);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
        console.log('[ISBN] Cover image preview created');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('[ISBN] Failed to download cover image:', error);
      this.messageService.add({
        severity: 'warn',
        summary: 'Cover Download Failed',
        detail: 'Could not download cover image. You can upload one manually.'
      });
    }
  }
}
