import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SliderModule } from 'primeng/slider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import ePub from 'epubjs';

@Component({
  selector: 'app-epub-viewer',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, SliderModule, ToastModule, FormsModule],
  providers: [MessageService],
  templateUrl: './epub-viewer.component.html',
  styleUrls: ['./epub-viewer.component.scss']
})
export class EpubViewerComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() src: string = '';
  @Input() initialLocation: string = '';
  @Output() progressUpdate = new EventEmitter<{ location: string; percentage: number }>();

  @ViewChild('epubContainer', { static: false }) epubContainer!: ElementRef;

  private readonly MAX_BOOKMARKS = 100;
  private book: any;
  private rendition: any;

  isLoading: boolean = true;
  error: string = '';
  currentLocation: string = '';
  currentPage: number = 1;
  totalPages: number = 0;
  percentage: number = 0;

  // Table of Contents
  tableOfContents: any[] = [];
  showToc: boolean = false;

  // Search
  searchQuery: string = '';
  searchResults: any[] = [];
  showSearch: boolean = false;
  isSearching: boolean = false;
  currentSearchIndex: number = -1;
  searchResultsTruncated: boolean = false;
  private searchCancelled: boolean = false;

  // Bookmarks & Annotations
  bookmarks: any[] = [];
  showBookmarks: boolean = false;

  // Help
  showHelp: boolean = false;

  // Settings
  fontSize: number = 100; // percentage
  theme: 'light' | 'dark' | 'sepia' = 'light';

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    console.log('EPUB Viewer initialized with src:', this.src, 'initialLocation:', this.initialLocation);
  }

  ngAfterViewInit(): void {
    if (this.src) {
      this.loadEpub();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && !changes['src'].firstChange && this.src) {
      this.loadEpub();
    }
  }

  ngOnDestroy(): void {
    if (this.rendition) {
      this.rendition.destroy();
    }
  }

  private async loadEpub(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = '';

      console.log('Starting EPUB load, src:', this.src);

      // Create book instance
      this.book = ePub(this.src);
      console.log('Book instance created');

      // Render book
      this.rendition = this.book.renderTo(this.epubContainer.nativeElement, {
        width: '100%',
        height: '100%',
        spread: 'none',
        flow: 'paginated'
      });
      console.log('Rendition created');

      // Display book at initial location or start
      console.log('Attempting to display book...');
      if (this.initialLocation) {
        await this.rendition.display(this.initialLocation);
      } else {
        await this.rendition.display();
      }
      console.log('Book displayed');

      // Load locations for page counting
      console.log('Generating locations...');
      await this.book.locations.generate(1024);
      this.totalPages = this.book.locations.total;
      console.log('Locations generated, total pages:', this.totalPages);

      // Load table of contents
      console.log('Loading table of contents...');
      await this.loadTableOfContents();

      // Set up event listeners
      this.rendition.on('relocated', (location: any) => {
        this.handleLocationChange(location);
      });

      // Apply theme
      this.applyTheme();

      // Apply font size
      this.applyFontSize();

      // Load bookmarks
      this.loadBookmarks();

      this.isLoading = false;
      console.log('EPUB loaded successfully');
    } catch (error: any) {
      console.error('EPUB loading error:', error);
      console.error('Error details:', error.message, error.stack);
      this.isLoading = false;
      this.error = `Failed to load EPUB file: ${error.message || 'Unknown error'}`;
    }
  }

  private handleLocationChange(location: any): void {
    if (!location || !this.book) return;

    // Get CFI (Canonical Fragment Identifier)
    this.currentLocation = location.start.cfi;

    // Calculate percentage
    const currentPage = this.book.locations.locationFromCfi(location.start.cfi);
    if (currentPage !== null && currentPage !== undefined) {
      this.currentPage = currentPage + 1;
      this.percentage = (this.currentPage / this.totalPages) * 100;
    }

    // Emit progress update
    this.progressUpdate.emit({
      location: this.currentLocation,
      percentage: this.percentage
    });

    console.log('Location changed:', {
      cfi: this.currentLocation,
      page: this.currentPage,
      total: this.totalPages,
      percentage: this.percentage
    });
  }

  // Navigation methods
  nextPage(): void {
    if (this.rendition) {
      this.rendition.next();
    }
  }

  previousPage(): void {
    if (this.rendition) {
      this.rendition.prev();
    }
  }

  goToLocation(cfi: string): void {
    if (this.rendition && cfi) {
      this.rendition.display(cfi);
    }
  }

  goToPercentage(percentage: number): void {
    if (!this.book || !this.rendition || !this.totalPages) return;

    const targetPage = Math.floor((percentage / 100) * this.totalPages);
    const cfi = this.book.locations.cfiFromLocation(targetPage);
    if (cfi) {
      this.rendition.display(cfi);
    }
  }

  onSliderChange(event: any): void {
    const value = event.value;
    if (value !== undefined && value !== null) {
      this.goToPercentage(value);
    }
  }

  // Settings methods
  increaseFontSize(): void {
    if (this.fontSize < 200) {
      this.fontSize += 10;
      this.applyFontSize();
    }
  }

  decreaseFontSize(): void {
    if (this.fontSize > 50) {
      this.fontSize -= 10;
      this.applyFontSize();
    }
  }

  onFontSizeChange(): void {
    this.applyFontSize();
  }

  private applyFontSize(): void {
    if (!this.rendition) return;
    this.rendition.themes.fontSize(`${this.fontSize}%`);
  }

  changeTheme(theme: 'light' | 'dark' | 'sepia'): void {
    this.theme = theme;
    this.applyTheme();
  }

  private applyTheme(): void {
    if (!this.rendition) return;

    const themes = {
      light: {
        body: {
          background: '#ffffff',
          color: '#000000'
        }
      },
      dark: {
        body: {
          background: '#1a1a1a',
          color: '#e0e0e0'
        }
      },
      sepia: {
        body: {
          background: '#f4ecd8',
          color: '#5c4a3a'
        }
      }
    };

    this.rendition.themes.override('background', themes[this.theme].body.background);
    this.rendition.themes.override('color', themes[this.theme].body.color);
  }

  // Helper methods
  canGoToPreviousPage(): boolean {
    // EPUB.js doesn't provide a simple way to check if we're at the start
    // We'll allow the button to be enabled always and let epub.js handle it
    return true;
  }

  canGoToNextPage(): boolean {
    // EPUB.js doesn't provide a simple way to check if we're at the end
    // We'll allow the button to be enabled always and let epub.js handle it
    return true;
  }

  getPageInfo(): string {
    if (this.totalPages > 0) {
      return `${this.currentPage} / ${this.totalPages}`;
    }
    return 'Loading...';
  }

  // Table of Contents methods
  private async loadTableOfContents(): Promise<void> {
    try {
      const nav = await this.book.loaded.navigation;
      this.tableOfContents = nav.toc;
      console.log('Table of contents loaded:', this.tableOfContents);
    } catch (error) {
      console.error('Error loading table of contents:', error);
      this.tableOfContents = [];
    }
  }

  toggleToc(): void {
    this.showToc = !this.showToc;
    // Close other panels when opening TOC
    if (this.showToc) {
      this.showSearch = false;
      this.showBookmarks = false;
    }
  }

  goToChapter(href: string): void {
    if (this.rendition && href) {
      this.rendition.display(href);
      this.showToc = false; // Close TOC after navigation
    }
  }

  // Search methods
  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (this.showSearch) {
      // Close other panels when opening Search
      this.showToc = false;
      this.showBookmarks = false;
    } else {
      this.clearSearch();
    }
  }

  async performSearch(): Promise<void> {
    if (!this.searchQuery || !this.book || this.searchQuery.trim().length === 0) {
      this.searchResults = [];
      return;
    }

    // Cancel any previous search
    this.searchCancelled = true;

    // Small delay to allow previous search to detect cancellation
    await new Promise(resolve => setTimeout(resolve, 10));

    // Reset cancellation flag for this search
    this.searchCancelled = false;
    const searchId = Date.now(); // Unique ID for this search

    this.isSearching = true;
    this.searchResults = [];
    this.currentSearchIndex = -1;
    this.searchResultsTruncated = false;

    try {
      const searchTerm = this.searchQuery.toLowerCase();
      const results: any[] = [];
      const MAX_RESULTS = 500;

      // Use EPUB.js spine to iterate through sections
      const spineItems = this.book.spine.spineItems;

      console.log(`Searching ${spineItems.length} sections for "${this.searchQuery}"`);

      for (let i = 0; i < spineItems.length; i++) {
        // Check if search was cancelled
        if (this.searchCancelled) {
          console.log('Search cancelled');
          this.isSearching = false;
          return;
        }
        // Stop if we've reached the limit
        if (results.length >= MAX_RESULTS) {
          console.log(`Reached maximum search results (${MAX_RESULTS}), stopping search`);
          this.searchResultsTruncated = true;
          break;
        }

        const item = spineItems[i];

        try {
          // Use EPUB.js find() method if available for precise CFIs
          if (typeof item.find === 'function') {
            const matches = await item.find(this.searchQuery);

            for (const match of matches) {
              if (results.length >= MAX_RESULTS) {
                this.searchResultsTruncated = true;
                break;
              }

              results.push({
                cfi: match.cfi, // Precise CFI from EPUB.js
                excerpt: match.excerpt || '',
                searchTerm: searchTerm,
                sectionIndex: i,
                sectionLabel: item.href,
                sectionTitle: item.label || item.href
              });
            }
          } else {
            // Fallback to manual search if find() not available
            const contents = await item.load(this.book.load.bind(this.book));
            let textContent = '';

            if (contents instanceof Document) {
              textContent = contents.body?.textContent || '';
            } else if (typeof contents === 'string') {
              const parser = new DOMParser();
              const doc = parser.parseFromString(contents, 'text/html');
              textContent = doc.body?.textContent || '';
            } else if (contents.textContent) {
              textContent = contents.textContent;
            }

            if (textContent) {
              const lowerText = textContent.toLowerCase();
              let searchIndex = 0;

              while ((searchIndex = lowerText.indexOf(searchTerm, searchIndex)) !== -1) {
                if (results.length >= MAX_RESULTS) {
                  this.searchResultsTruncated = true;
                  break;
                }

                const start = Math.max(0, searchIndex - 100);
                const end = Math.min(textContent.length, searchIndex + searchTerm.length + 100);
                let excerpt = textContent.substring(start, end).trim().replace(/\s+/g, ' ');

                if (start > 0) excerpt = '...' + excerpt;
                if (end < textContent.length) excerpt = excerpt + '...';

                results.push({
                  cfi: item.cfiBase, // Fallback to base CFI
                  excerpt: excerpt,
                  searchTerm: searchTerm,
                  sectionIndex: i,
                  sectionLabel: item.href,
                  sectionTitle: item.label || item.href
                });

                searchIndex += searchTerm.length;
              }
            }

            item.unload();
          }
        } catch (error) {
          console.warn('Error searching section:', item.href, error);
        }
      }

      this.searchResults = results;
      console.log(`Found ${results.length} matches for "${this.searchQuery}"`);
    } catch (error) {
      console.error('Search error:', error);
      this.searchResults = [];
    } finally {
      this.isSearching = false;
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.currentSearchIndex = -1;
    this.isSearching = false;
    this.searchResultsTruncated = false;
  }

  goToSearchResult(result: any, index: number): void {
    if (this.rendition && result.cfi) {
      this.currentSearchIndex = index;
      this.rendition.display(result.cfi);
      // Optionally close search panel after navigation
      // this.showSearch = false;
    }
  }

  previousSearchResult(): void {
    if (this.searchResults.length === 0) return;

    if (this.currentSearchIndex > 0) {
      this.currentSearchIndex--;
    } else {
      this.currentSearchIndex = this.searchResults.length - 1;
    }

    this.goToSearchResult(this.searchResults[this.currentSearchIndex], this.currentSearchIndex);
  }

  nextSearchResult(): void {
    if (this.searchResults.length === 0) return;

    if (this.currentSearchIndex < this.searchResults.length - 1) {
      this.currentSearchIndex++;
    } else {
      this.currentSearchIndex = 0;
    }

    this.goToSearchResult(this.searchResults[this.currentSearchIndex], this.currentSearchIndex);
  }

  onSearchQueryChange(): void {
    // Debounce search - only search when user stops typing
    // For now, we'll trigger on Enter key or search button click
  }

  // Bookmarks methods
  toggleBookmarks(): void {
    this.showBookmarks = !this.showBookmarks;
    // Close other panels when opening Bookmarks
    if (this.showBookmarks) {
      this.showToc = false;
      this.showSearch = false;
    }
  }

  private getBookmarkStorageKey(): string {
    // Use the src URL as a unique identifier for this book
    return `epub_bookmarks_${btoa(this.src).substring(0, 32)}`;
  }

  private loadBookmarks(): void {
    try {
      const key = this.getBookmarkStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        this.bookmarks = JSON.parse(stored);
      } else {
        this.bookmarks = [];
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      this.bookmarks = [];
    }
  }

  private saveBookmarks(): void {
    try {
      const key = this.getBookmarkStorageKey();
      localStorage.setItem(key, JSON.stringify(this.bookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  }

  addBookmark(note: string = ''): void {
    if (!this.currentLocation) return;

    const bookmark = {
      id: Date.now().toString(),
      cfi: this.currentLocation,
      page: this.currentPage,
      percentage: this.percentage,
      note: note,
      createdAt: new Date().toISOString()
    };

    this.bookmarks.unshift(bookmark); // Add to beginning

    // Enforce bookmark limit - remove oldest bookmarks if exceeding MAX_BOOKMARKS
    if (this.bookmarks.length > this.MAX_BOOKMARKS) {
      const removedCount = this.bookmarks.length - this.MAX_BOOKMARKS;
      this.bookmarks = this.bookmarks.slice(0, this.MAX_BOOKMARKS);
      console.log(`Bookmark limit reached. Removed ${removedCount} oldest bookmark(s).`);
    }

    this.saveBookmarks();

    console.log('Bookmark added:', bookmark);

    // Show toast notification
    this.messageService.add({
      severity: 'success',
      summary: 'Bookmark Added',
      detail: `Page ${this.currentPage} (${this.percentage.toFixed(0)}%)`,
      life: 2000
    });
  }

  removeBookmark(bookmarkId: string): void {
    this.bookmarks = this.bookmarks.filter(b => b.id !== bookmarkId);
    this.saveBookmarks();

    // Show toast notification
    this.messageService.add({
      severity: 'info',
      summary: 'Bookmark Removed',
      life: 2000
    });
  }

  goToBookmark(bookmark: any): void {
    if (this.rendition && bookmark.cfi) {
      this.rendition.display(bookmark.cfi);
    }
  }

  isCurrentLocationBookmarked(): boolean {
    if (!this.currentLocation) return false;
    return this.bookmarks.some(b => b.cfi === this.currentLocation);
  }

  toggleCurrentBookmark(): void {
    if (!this.currentLocation) return;

    const existing = this.bookmarks.find(b => b.cfi === this.currentLocation);
    if (existing) {
      this.removeBookmark(existing.id);
    } else {
      this.addBookmark();
    }
  }

  // Help methods
  toggleHelp(): void {
    this.showHelp = !this.showHelp;
  }

  // Keyboard shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Don't handle shortcuts if user is typing in an input field
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousPage();
        break;

      case 'ArrowRight':
        event.preventDefault();
        this.nextPage();
        break;

      case 'Home':
        event.preventDefault();
        this.goToPercentage(0);
        break;

      case 'End':
        event.preventDefault();
        this.goToPercentage(100);
        break;

      case 'b':
      case 'B':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.toggleCurrentBookmark();
        }
        break;

      case 's':
      case 'S':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.toggleSearch();
        }
        break;

      case 'f':
      case 'F':
        // Ctrl+F or Cmd+F to open search (standard browser shortcut)
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (!this.showSearch) {
            this.toggleSearch();
          }
        }
        break;

      case 't':
      case 'T':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.toggleToc();
        }
        break;

      case 'm':
      case 'M':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.toggleBookmarks();
        }
        break;

      case 'Escape':
        event.preventDefault();
        // Close any open sidebars and help
        this.showSearch = false;
        this.showToc = false;
        this.showBookmarks = false;
        this.showHelp = false;
        break;

      case '?':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.toggleHelp();
        }
        break;

      case '+':
      case '=':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.increaseFontSize();
        }
        break;

      case '-':
      case '_':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.decreaseFontSize();
        }
        break;

      case 'f':
      case 'F':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.toggleSearch();
        }
        break;

      // Number keys for quick percentage jumps (1 = 10%, 2 = 20%, etc.)
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          const percentage = parseInt(event.key) * 10;
          this.goToPercentage(percentage);
        }
        break;

      case '0':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.goToPercentage(100);
        }
        break;
    }
  }
}
