import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../services/auth.service';
import { ItemService } from '../../services/item.service';
import { ReadingProgressService } from '../../services/reading-progress.service';
import { User } from '../../models/user.model';
import { DigitalItem } from '../../models/item.model';
import { ReadingProgress } from '../../models/reading-progress.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, ProgressBarModule, TagModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  digitalCount: number = 0;
  physicalCount: number = 0;
  totalCount: number = 0;
  continueReadingItems: Array<DigitalItem & { progress: ReadingProgress }> = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private itemService: ItemService,
    private progressService: ReadingProgressService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Fetch digital items count
    this.itemService.getDigitalItems().subscribe({
      next: (response) => {
        this.digitalCount = response.total || response.items.length;
        this.updateTotalCount();
      },
      error: (error) => {
        console.error('Failed to load digital items count', error);
      }
    });

    // Fetch physical items count
    this.itemService.getPhysicalItems().subscribe({
      next: (response) => {
        this.physicalCount = response.total || response.items.length;
        this.updateTotalCount();
      },
      error: (error) => {
        console.error('Failed to load physical items count', error);
      }
    });

    // Load recent reading progress
    this.loadContinueReading();
  }

  updateTotalCount(): void {
    this.totalCount = this.digitalCount + this.physicalCount;
  }

  goToLibrary(): void {
    this.router.navigate(['/library']);
  }

  addDigitalItem(): void {
    this.router.navigate(['/items/digital/new']);
  }

  addPhysicalItem(): void {
    this.router.navigate(['/items/physical/new']);
  }

  goToAuthors(): void {
    this.router.navigate(['/management/authors']);
  }

  goToPublishers(): void {
    this.router.navigate(['/management/publishers']);
  }

  goToGenres(): void {
    this.router.navigate(['/management/genres']);
  }

  goToCollections(): void {
    this.router.navigate(['/collections']);
  }

  goToTags(): void {
    this.router.navigate(['/tags']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadContinueReading(): void {
    this.progressService.getRecentProgress(5).subscribe({
      next: (response) => {
        // Map progress items to their digital items
        this.continueReadingItems = response.progress
          .filter(p => p.digitalItem && p.percentage > 0 && p.percentage < 100)
          .map(progress => ({
            ...(progress.digitalItem as DigitalItem),
            progress: progress
          }));
      },
      error: (error) => {
        console.error('Failed to load continue reading items', error);
      }
    });
  }

  continueReading(item: DigitalItem & { progress: ReadingProgress }): void {
    const fileId = item.progress.digitalFileId;
    this.router.navigate(['/reader', item.id, fileId || 'default']);
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
    } else {
      return readDate.toLocaleDateString();
    }
  }
}
