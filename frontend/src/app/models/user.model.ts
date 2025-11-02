export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
