# Library Management System - Backend

Backend API for the Library Management System built with Node.js, Express, TypeScript, and Sequelize.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite with Sequelize ORM
- **Authentication**: Passport.js with JWT
- **File Upload**: Multer

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Copy the example environment file and update with your settings:

```bash
cp .env.example .env
```

### Development

Run the development server with hot reload:

```bash
npm run dev
```

The server will start on http://localhost:3000

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

### Production

Run the compiled application:

```bash
npm start
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api` - API information

More endpoints will be added as features are implemented.

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── app.ts          # Express application setup
│   └── index.ts        # Application entry point
├── dist/               # Compiled JavaScript (generated)
└── uploads/            # Uploaded files (generated)
```

## Development

This project is part of Phase 1: Foundation of the Library Management System.
