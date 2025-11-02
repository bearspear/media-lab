import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { ItemService } from '../../services/item.service';
import { AuthorService, Author } from '../../services/author.service';
import { PublisherService, Publisher } from '../../services/publisher.service';
import { GenreService, Genre } from '../../services/genre.service';
import { DigitalItem, PhysicalItem, ReadingStatus } from '../../models/item.model';

interface SearchResult {
  type: 'digital' | 'physical';
  item: DigitalItem | PhysicalItem;
}

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TagModule,
    RatingModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    DropdownModule,
    ChipModule,
    DividerModule,
    SkeletonModule
  ],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.css'
})
export class SearchResultsComponent implements OnInit {
  searchQuery = '';
  results: SearchResult[] = [];
  totalResults = 0;
  isSearching = false;
  hasSearched = false;

  // Filter data
  authors: Author[] = [];
  publishers: Publisher[] = [];
  genres: Genre[] = [];

  // Filters
  selectedItemType: string | null = null;
  selectedAuthorId: number | null = null;
  selectedPublisherId: number | null = null;
  selectedGenreId: number | null = null;
  selectedReadingStatus: string | null = null;

  itemTypeOptions = [
    { label: 'All Items', value: null },
    { label: 'Digital Only', value: 'digital' },
    { label: 'Physical Only', value: 'physical' }
  ];

  readingStatusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'To Read', value: ReadingStatus.TO_READ },
    { label: 'Reading', value: ReadingStatus.READING },
    { label: 'Completed', value: ReadingStatus.COMPLETED },
    { label: 'On Hold', value: ReadingStatus.ON_HOLD },
    { label: 'Dropped', value: ReadingStatus.DROPPED }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemService,
    private authorService: AuthorService,
    private publisherService: PublisherService,
    private genreService: GenreService
  ) {}

  ngOnInit(): void {
    // Load filter data
    this.loadFilterData();

    // Get search query from URL
    this.route.queryParams.subscribe(params => {
      const query = params['q'];
      if (query) {
        this.searchQuery = query;
        this.performSearch();
      }
    });
  }

  loadFilterData(): void {
    this.authorService.getAll().subscribe({
      next: (authors) => {
        this.authors = [{ id: 0, name: 'All Authors' } as Author, ...authors];
      }
    });

    this.publisherService.getAll().subscribe({
      next: (publishers) => {
        this.publishers = [{ id: 0, name: 'All Publishers' } as Publisher, ...publishers];
      }
    });

    this.genreService.getAll().subscribe({
      next: (genres) => {
        this.genres = [{ id: 0, name: 'All Genres' } as Genre, ...genres];
      }
    });
  }

  performSearch(): void {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.isSearching = true;
    this.hasSearched = true;

    this.itemService.searchItems(this.searchQuery).subscribe({
      next: (response) => {
        this.results = response.items.map((item: any) => ({
          type: item.itemType || (item.format ? 'digital' : 'physical'),
          item: item
        }));
        this.totalResults = response.total;
        this.applyClientSideFilters();
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Search error:', error);
        this.results = [];
        this.totalResults = 0;
        this.isSearching = false;
      }
    });
  }

  applyClientSideFilters(): void {
    let filtered = [...this.results];

    // Filter by item type
    if (this.selectedItemType) {
      filtered = filtered.filter(r => r.type === this.selectedItemType);
    }

    // Filter by author
    if (this.selectedAuthorId && this.selectedAuthorId > 0) {
      filtered = filtered.filter(r =>
        r.item.authors?.some(a => a.id === this.selectedAuthorId)
      );
    }

    // Filter by publisher
    if (this.selectedPublisherId && this.selectedPublisherId > 0) {
      filtered = filtered.filter(r =>
        r.item.publisherId === this.selectedPublisherId
      );
    }

    // Filter by genre
    if (this.selectedGenreId && this.selectedGenreId > 0) {
      filtered = filtered.filter(r =>
        r.item.genres?.some(g => g.id === this.selectedGenreId)
      );
    }

    // Filter by reading status
    if (this.selectedReadingStatus) {
      filtered = filtered.filter(r =>
        r.item.readingStatus === this.selectedReadingStatus
      );
    }

    this.results = filtered;
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;

    // Update URL with search query
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.searchQuery },
      queryParamsHandling: 'merge'
    });
  }

  onFilterChange(): void {
    this.applyClientSideFilters();
  }

  clearFilters(): void {
    this.selectedItemType = null;
    this.selectedAuthorId = null;
    this.selectedPublisherId = null;
    this.selectedGenreId = null;
    this.selectedReadingStatus = null;
    this.applyClientSideFilters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.selectedItemType ||
      (this.selectedAuthorId && this.selectedAuthorId > 0) ||
      (this.selectedPublisherId && this.selectedPublisherId > 0) ||
      (this.selectedGenreId && this.selectedGenreId > 0) ||
      this.selectedReadingStatus
    );
  }

  viewItem(result: SearchResult): void {
    if (result.type === 'digital') {
      this.router.navigate(['/items/digital', result.item.id]);
    } else {
      this.router.navigate(['/items/physical', result.item.id]);
    }
  }

  editItem(result: SearchResult): void {
    if (result.type === 'digital') {
      this.router.navigate(['/items/digital', result.item.id, 'edit']);
    } else {
      this.router.navigate(['/items/physical', result.item.id, 'edit']);
    }
  }

  getAuthorNames(authors: any[]): string {
    return authors?.map(a => a.name).join(', ') || 'Unknown';
  }

  getPublisherName(item: any): string {
    return item.publisherInfo?.name || 'Unknown';
  }

  getGenreNames(genres: any[]): string {
    return genres?.map(g => g.name).join(', ') || 'None';
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

  getCoverUrl(item: any): string {
    if (item.coverImage) {
      return `http://localhost:3001/uploads/${item.coverImage}`;
    }
    return 'https://via.placeholder.com/300x450?text=No+Cover';
  }

  isDigitalItem(result: SearchResult): boolean {
    return result.type === 'digital';
  }

  isPhysicalItem(result: SearchResult): boolean {
    return result.type === 'physical';
  }

  goToLibrary(): void {
    this.router.navigate(['/library']);
  }
}
