import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessagesModule } from 'primeng/messages';
import { AuthService } from '../../services/auth.service';

interface Message {
  severity: string;
  summary: string;
  detail: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    MessagesModule
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Library Management</h1>
          <p class="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <p-card>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                pInputText
                id="email"
                formControlName="email"
                type="email"
                placeholder="you@example.com"
                class="w-full"
                [class.ng-invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              />
              <small
                *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                class="text-red-600"
              >
                Please enter a valid email address
              </small>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <p-password
                formControlName="password"
                [toggleMask]="true"
                [feedback]="false"
                placeholder="Enter your password"
                styleClass="w-full"
                inputStyleClass="w-full"
              />
              <small
                *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                class="text-red-600"
              >
                Password is required
              </small>
            </div>

            <p-messages *ngIf="messages.length > 0" [(value)]="messages" [closable]="true"></p-messages>

            <button
              pButton
              type="submit"
              label="Sign In"
              [loading]="loading"
              [disabled]="loginForm.invalid || loading"
              class="w-full"
            ></button>

            <div class="text-center mt-4">
              <p class="text-sm text-gray-600">
                Don't have an account?
                <a routerLink="/register" class="text-blue-600 hover:text-blue-500 font-medium">
                  Sign up
                </a>
              </p>
            </div>
          </form>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-password {
        width: 100%;
      }
      .p-password input {
        width: 100%;
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  messages: Message[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.messages = [];

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          this.messages = [{
            severity: 'error',
            summary: 'Login Failed',
            detail: error.error?.message || 'Invalid email or password'
          }];
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
}
