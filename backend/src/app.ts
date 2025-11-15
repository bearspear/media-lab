import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import './config/passport';
import passport from 'passport';
import authRoutes from './routes/authRoutes';
import digitalItemRoutes from './routes/digitalItemRoutes';
import digitalFileRoutes from './routes/digitalFileRoutes';
import physicalItemRoutes from './routes/physicalItemRoutes';
import uploadRoutes from './routes/uploadRoutes';
import searchRoutes from './routes/searchRoutes';
import authorRoutes from './routes/authorRoutes';
import publisherRoutes from './routes/publisherRoutes';
import genreRoutes from './routes/genreRoutes';
import collectionRoutes from './routes/collectionRoutes';
import tagRoutes from './routes/tagRoutes';
import exportImportRoutes from './routes/exportImportRoutes';
import isbnRoutes from './routes/isbnRoutes';
import lccnRoutes from './routes/lccnRoutes';
import publicRoutes from './routes/publicRoutes';
import readingProgressRoutes from './routes/readingProgressRoutes';

dotenv.config();

const app: Application = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4300',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.join(__dirname, '..', uploadDir)));

// Serve digital files (books, audiobooks, etc.)
const booksDir = process.env.BOOKS_DIR || './books';
app.use('/books', express.static(path.join(__dirname, '..', booksDir)));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Library Management System API',
    version: '1.0.0'
  });
});

// Public routes (no authentication required)
app.use('/public', publicRoutes);

// Authentication routes
app.use('/api/auth', authRoutes);

// Item routes
app.use('/api/digital-items', digitalItemRoutes);
app.use('/api/digital', digitalFileRoutes);
app.use('/api/physical-items', physicalItemRoutes);

// Search routes
app.use('/api/search', searchRoutes);

// Upload routes
app.use('/api/upload', uploadRoutes);

// Author, Publisher, and Genre routes
app.use('/api/authors', authorRoutes);
app.use('/api/publishers', publisherRoutes);
app.use('/api/genres', genreRoutes);

// Collection routes
app.use('/api/collections', collectionRoutes);

// Tag routes
app.use('/api/tags', tagRoutes);

// Export/Import routes
app.use('/api', exportImportRoutes);

// ISBN lookup routes
app.use('/api/isbn', isbnRoutes);

// LCCN lookup routes
app.use('/api/lccn', lccnRoutes);

// Reading progress routes
app.use('/api/reading-progress', readingProgressRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
