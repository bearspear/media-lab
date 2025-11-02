import { Request, Response } from 'express';
import passport from '../config/passport';
import User from '../models/User';
import { generateToken } from '../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        error: 'Validation error',
        message: 'All fields are required: email, password, firstName, lastName',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists',
      });
      return;
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
    });

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    // Return user data (without password) and token
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

export const login = (req: Request, res: Response): void => {
  passport.authenticate('local', { session: false }, (err: Error, user: User, info: any) => {
    if (err) {
      res.status(500).json({
        error: 'Authentication error',
        message: err.message,
      });
      return;
    }

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: info?.message || 'Invalid credentials',
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        isActive: user.isActive,
      },
    });
  })(req, res);
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authenticated user',
      });
      return;
    }

    const user = req.user as User;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};
