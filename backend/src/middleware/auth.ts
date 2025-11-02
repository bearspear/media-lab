import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import UserModel from '../models/User';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User extends UserModel {}
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: Error, user: UserModel) => {
    if (err) {
      res.status(500).json({ error: 'Authentication error', message: err.message });
      return;
    }

    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
      return;
    }

    req.user = user;
    next();
  })(req, res, next);
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (_err: Error, user: UserModel) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};
