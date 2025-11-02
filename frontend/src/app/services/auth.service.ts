import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3001/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load user from localStorage on service initialization
    const token = this.getToken();
    console.log('[AuthService] Constructor - token exists:', !!token);
    if (token) {
      console.log('[AuthService] Loading current user...');
      this.loadCurrentUser();
    }
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(response => {
        this.setToken(response.token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, data).pipe(
      tap(response => {
        this.setToken(response.token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): void {
    console.log('[AuthService] Logout called');
    console.trace('[AuthService] Logout stack trace');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  loadCurrentUser(): void {
    this.http.get<{ user: User }>(`${this.apiUrl}/auth/me`).subscribe({
      next: (response) => {
        console.log('[AuthService] User loaded successfully:', response.user.email);
        this.currentUserSubject.next(response.user);
      },
      error: (error) => {
        console.log('[AuthService] Load user failed:', error.status, error.message);
        // Token might be invalid, clear it
        this.logout();
      }
    });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
