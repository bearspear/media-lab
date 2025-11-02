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
  selector: 'app-register',
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
          <p class="mt-2 text-gray-600">Create your account</p>
        </div>

        <p-card>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  pInputText
                  id="firstName"
                  formControlName="firstName"
                  placeholder="John"
                  class="w-full"
                />
                <small
                  *ngIf="registerForm.get('firstName')?.invalid && registerForm.get('firstName')?.touched"
                  class="text-red-600"
                >
                  First name is required
                </small>
              </div>

              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  pInputText
                  id="lastName"
                  formControlName="lastName"
                  placeholder="Doe"
                  class="w-full"
                />
                <small
                  *ngIf="registerForm.get('lastName')?.invalid && registerForm.get('lastName')?.touched"
                  class="text-red-600"
                >
                  Last name is required
                </small>
              </div>
            </div>

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
              />
              <small
                *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
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
                [feedback]="true"
                placeholder="Choose a strong password"
                styleClass="w-full"
                inputStyleClass="w-full"
              />
              <small
                *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
                class="text-red-600"
              >
                Password must be at least 6 characters
              </small>
            </div>

            <p-messages *ngIf="messages.length > 0" [(value)]="messages" [closable]="true"></p-messages>

            <button
              pButton
              type="submit"
              label="Sign Up"
              [loading]="loading"
              [disabled]="registerForm.invalid || loading"
              class="w-full"
            ></button>

            <div class="text-center mt-4">
              <p class="text-sm text-gray-600">
                Already have an account?
                <a routerLink="/login" class="text-blue-600 hover:text-blue-500 font-medium">
                  Sign in
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
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  messages: Message[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.messages = [];

      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          this.messages = [{
            severity: 'error',
            summary: 'Registration Failed',
            detail: error.error?.message || 'An error occurred during registration'
          }];
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
}
