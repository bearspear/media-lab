import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { ItemService } from '../../services/item.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  digitalCount: number = 0;
  physicalCount: number = 0;
  totalCount: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private itemService: ItemService
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
}
