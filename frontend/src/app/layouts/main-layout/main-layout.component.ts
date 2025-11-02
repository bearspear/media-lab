import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  isSidebarCollapsed = false;

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      route: '/dashboard'
    },
    {
      label: 'Library',
      icon: 'pi pi-book',
      route: '/library'
    },
    {
      label: 'Collections',
      icon: 'pi pi-folder',
      route: '/collections'
    },
    {
      label: 'Tags',
      icon: 'pi pi-tags',
      route: '/tags'
    },
    {
      label: 'Management',
      icon: 'pi pi-cog',
      route: '/management',
      children: [
        { label: 'Authors', icon: 'pi pi-users', route: '/management/authors' },
        { label: 'Publishers', icon: 'pi pi-building', route: '/management/publishers' },
        { label: 'Genres', icon: 'pi pi-list', route: '/management/genres' }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
