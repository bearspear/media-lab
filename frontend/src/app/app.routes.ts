import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login.component';
import { RegisterComponent } from './pages/auth/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LibraryComponent } from './pages/library/library.component';
import { DigitalItemFormComponent } from './pages/library/digital-item-form.component';
import { DigitalItemDetailComponent } from './pages/library/digital-item-detail.component';
import { PhysicalItemFormComponent } from './pages/library/physical-item-form.component';
import { PhysicalItemDetailComponent } from './pages/library/physical-item-detail.component';
import { AuthorsComponent } from './pages/management/authors.component';
import { PublishersComponent } from './pages/management/publishers.component';
import { GenresComponent } from './pages/management/genres.component';
import { CollectionsComponent } from './pages/collections/collections.component';
import { CollectionDetailComponent } from './pages/collection-detail/collection-detail.component';
import { TagsComponent } from './pages/tags/tags.component';
import { SearchResultsComponent } from './pages/search/search-results.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'library', component: LibraryComponent },
      { path: 'items/digital/new', component: DigitalItemFormComponent },
      { path: 'items/digital/:id', component: DigitalItemDetailComponent },
      { path: 'items/digital/:id/edit', component: DigitalItemFormComponent },
      { path: 'items/physical/new', component: PhysicalItemFormComponent },
      { path: 'items/physical/:id', component: PhysicalItemDetailComponent },
      { path: 'items/physical/:id/edit', component: PhysicalItemFormComponent },
      { path: 'management/authors', component: AuthorsComponent },
      { path: 'management/publishers', component: PublishersComponent },
      { path: 'management/genres', component: GenresComponent },
      { path: 'collections', component: CollectionsComponent },
      { path: 'collections/:id', component: CollectionDetailComponent },
      { path: 'tags', component: TagsComponent },
      { path: 'search', component: SearchResultsComponent }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
