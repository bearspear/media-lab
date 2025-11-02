# Library Management System - Frontend

Frontend application for the Library Management System built with Angular 18, PrimeNG, and Tailwind CSS.

## Tech Stack

- **Framework**: Angular 18
- **UI Library**: PrimeNG 18
- **CSS Framework**: Tailwind CSS 3
- **HTTP Client**: Angular HttpClient
- **Routing**: Angular Router
- **Animations**: Angular Animations

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

Dependencies are already installed during project creation. If you need to reinstall:

```bash
npm install
```

### Development

Run the development server:

```bash
npm start
```

Navigate to http://localhost:4200

The application will automatically reload when you change source files.

### Build

Build the project for production:

```bash
npm run build
```

Build artifacts will be stored in the `dist/` directory.

### Testing

Run unit tests:

```bash
npm test
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/    # Reusable components (to be created)
│   │   ├── pages/         # Page components (to be created)
│   │   ├── services/      # Services (to be created)
│   │   ├── models/        # TypeScript interfaces (to be created)
│   │   ├── guards/        # Route guards (to be created)
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── styles.css         # Global styles
│   └── index.html
└── public/                # Static assets
```

## Configuration

- **Angular CLI**: `angular.json`
- **TypeScript**: `tsconfig.json`
- **Tailwind CSS**: `tailwind.config.js`

## Features (Planned - Phase 1)

- Authentication UI (login, register)
- Main layout with responsive design
- Dashboard with basic statistics
- Library view (grid/list toggle, filters)
- Item detail pages
- Add/Edit item forms

## Development Notes

This project uses:
- Angular standalone components (no NgModules)
- PrimeNG for UI components
- Tailwind CSS for utility-first styling
- HttpClient with interceptors support
- Angular Router for navigation
