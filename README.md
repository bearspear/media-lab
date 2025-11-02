# Media Lab

A comprehensive personal media library management system for organizing and cataloging your digital and physical media collections.

## Overview

Media Lab is a full-stack web application that helps you manage your personal library of books, audiobooks, videos, music, and physical media. It features advanced search capabilities, ISBN/LCCN lookup integration, metadata management, and a modern, responsive user interface.

## Features

### Core Functionality
- **Dual Item Types**: Manage both digital and physical media items
- **Advanced Metadata**: Track titles, authors, publishers, genres, ISBN, LCCN, ratings, and more
- **Cover Image Management**: Upload and display cover images for your items
- **Smart Cataloging**: Organize items with tags, reading status, favorites, and personal notes
- **Full-Text Search**: Powerful FTS5-based search across all item fields
- **Advanced Filtering**: Filter by type, format, authors, publishers, genres, and custom criteria

### Metadata Enrichment
- **ISBN Lookup**: Auto-populate book details from ISBN using Google Books API
- **LCCN Lookup**: Look up Library of Congress Control Numbers for older books
- **Automatic Cover Fetching**: Retrieve cover images during ISBN/LCCN lookup

### Data Management
- **Import/Export**: Export your entire library to JSON format
- **Libib Integration**: Import your existing library from Libib export files
- **Backup & Restore**: Easy data portability and backup

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Built with PrimeNG components for a polished interface
- **Detail Views**: Comprehensive item details with all metadata
- **Grid/List Views**: Multiple viewing options for your library

## Tech Stack

### Frontend
- **Framework**: Angular 19
- **UI Components**: PrimeNG 17
- **Styling**: SCSS
- **HTTP Client**: Angular HttpClient
- **Routing**: Angular Router

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite with Sequelize ORM
- **Search**: SQLite FTS5 (Full-Text Search)
- **Authentication**: JWT with Passport.js
- **File Upload**: Multer
- **External APIs**: Google Books API

### Development Tools
- **TypeScript**: Strong typing across the stack
- **Nodemon**: Auto-restart during development
- **dotenv**: Environment variable management

## Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Angular CLI**: v19.x (`npm install -g @angular/cli`)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd media-lab
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create environment file
cat > .env << EOF
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=7d
GOOGLE_BOOKS_API_KEY=your-google-books-api-key
EOF
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

## Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
PORT=3001                                    # Backend server port
NODE_ENV=development                         # Environment (development/production)
JWT_SECRET=your-secret-key                   # JWT signing secret (change in production)
JWT_EXPIRATION=7d                            # JWT token expiration time
GOOGLE_BOOKS_API_KEY=your-api-key           # Google Books API key (optional)
```

### Google Books API Key (Optional)

To enable ISBN/LCCN lookup:

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Books API
4. Create credentials (API Key)
5. Add the API key to your `.env` file

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will start at `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
ng serve --port 4300
```
Frontend will start at `http://localhost:4300`

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
ng build --configuration production
# Serve the dist/frontend directory with your preferred web server
```

## Default User Account

When you first run the application, you'll need to create a user account. You can register via the API:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@medialab.com",
    "password": "your-secure-password",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

Then use these credentials to log in through the application.

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user information (requires authentication)

### Library Endpoints

All library endpoints require JWT authentication via `Authorization: Bearer <token>` header.

#### Digital Items
- `GET /api/digital-items` - List all digital items
- `GET /api/digital-items/:id` - Get a specific digital item
- `POST /api/digital-items` - Create a new digital item
- `PUT /api/digital-items/:id` - Update a digital item
- `DELETE /api/digital-items/:id` - Delete a digital item

#### Physical Items
- `GET /api/physical-items` - List all physical items
- `GET /api/physical-items/:id` - Get a specific physical item
- `POST /api/physical-items` - Create a new physical item
- `PUT /api/physical-items/:id` - Update a physical item
- `DELETE /api/physical-items/:id` - Delete a physical item

#### Metadata Management
- `GET /api/authors` - List all authors
- `POST /api/authors` - Create a new author
- `GET /api/publishers` - List all publishers
- `POST /api/publishers` - Create a new publisher
- `GET /api/genres` - List all genres
- `POST /api/genres` - Create a new genre

#### Search & Lookup
- `GET /api/search?q=query` - Full-text search across all items
- `GET /api/lookup/isbn/:isbn` - Look up book details by ISBN
- `GET /api/lookup/lccn/:lccn` - Look up book details by LCCN

#### Import/Export
- `GET /api/export` - Export entire library as JSON
- `POST /api/import` - Import library from JSON file
- `POST /api/import/libib` - Import from Libib export file

#### File Upload
- `POST /api/upload` - Upload cover images (multipart/form-data)

## Project Structure

```
media-lab/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and passport configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Authentication and validation middleware
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions (JWT, validation)
│   │   └── index.ts         # Application entry point
│   ├── uploads/             # Uploaded cover images
│   │   └── covers/
│   ├── database.sqlite      # SQLite database (generated)
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── core/           # Core services (auth, API)
    │   │   ├── models/         # TypeScript interfaces
    │   │   ├── pages/          # Feature components
    │   │   │   ├── auth/       # Login/register
    │   │   │   ├── dashboard/  # Dashboard
    │   │   │   ├── library/    # Library management
    │   │   │   └── search/     # Search functionality
    │   │   ├── shared/         # Shared components
    │   │   └── app.component.ts
    │   ├── styles.scss         # Global styles
    │   └── index.html
    ├── angular.json
    ├── package.json
    └── tsconfig.json
```

## Key Features in Detail

### Digital Items

Digital items represent electronic media such as:
- **E-books** (EPUB, PDF, MOBI, AZW3)
- **Audiobooks** (MP3, M4A)
- **Videos** (MP4, MKV)
- **Music** (MP3, M4A)
- **Other digital formats**

Each digital item can track:
- Title, type, and format
- Description and metadata
- ISBN/LCCN
- Authors and genres
- Publisher and publication year
- Language
- File size and path
- Cover image
- Personal rating and notes
- Reading status
- Tags

### Physical Items

Physical items represent tangible media:
- **Books**
- **DVDs and Blu-rays**
- **CDs and Vinyl records**
- **Magazines and Comics**
- **Other physical media**

Each physical item includes:
- All metadata fields from digital items
- **Condition** tracking (New, Like New, Very Good, Good, Acceptable, Poor)
- **Barcode** for scanning
- **Location** in your physical space
- **Quantity** for multiple copies

### ISBN and LCCN Lookup

The lookup feature integrates with Google Books API to automatically populate metadata:

1. Enter an ISBN (e.g., 978-0-123456-78-9) or LCCN
2. Click the "Lookup" button
3. The system fetches and auto-fills:
   - Title
   - Authors
   - Publisher
   - Publication year
   - Description
   - Cover image
   - Language
   - Page count (if available)

### Full-Text Search

Powered by SQLite FTS5, the search feature:
- Searches across titles, descriptions, authors, publishers, and tags
- Returns ranked results
- Handles partial word matching
- Supports complex queries
- Provides instant results

### Import/Export

**Export Options:**
- JSON format with complete library data
- Includes all items, metadata, and relationships
- Preserves custom fields and notes

**Import Options:**
- Restore from Media Lab JSON export
- Import from Libib export files
- Automatic duplicate detection
- Progress reporting during import

## Development

### Database Management

The SQLite database is automatically created on first run. To reset the database:

```bash
cd backend
rm -f database.sqlite
rm -rf uploads/covers/*
npm run dev  # Will recreate database
```

### Adding New Features

1. **Backend**: Add models, routes, and controllers in respective directories
2. **Frontend**: Create components in `src/app/pages/` or `src/app/shared/`
3. **API Integration**: Add service methods in frontend services

### Database Schema

The application uses Sequelize ORM with the following main models:
- `User` - User accounts and authentication
- `DigitalItem` - Digital media items
- `PhysicalItem` - Physical media items
- `Author` - Book authors
- `Publisher` - Publishers
- `Genre` - Categories/genres

Relationships:
- Many-to-many between Items and Authors
- Many-to-many between Items and Genres
- Many-to-one between Items and Publishers
- One-to-many between Users and Items

## Troubleshooting

### Backend won't start
- Check if port 3001 is available: `lsof -ti:3001`
- Verify environment variables in `.env`
- Check database file permissions

### Frontend build errors
- Clear Angular cache: `rm -rf .angular`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version`

### Images not displaying
- Verify uploads directory exists: `backend/uploads/covers/`
- Check file permissions on uploads directory
- Ensure backend URL in frontend matches your setup

### Database locked errors
- Close all connections to the database
- Restart the backend server
- Check for multiple backend instances running

## Security Considerations

- Change the default `JWT_SECRET` in production
- Use HTTPS in production environments
- Implement rate limiting for API endpoints
- Regularly update dependencies for security patches
- Store uploaded files outside of the web root in production

## License

This project is provided as-is for personal use.

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request with a clear description

## Support

For issues, questions, or feature requests, please open an issue in the repository.
