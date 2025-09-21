# Photomaton Backend

A NestJS-based backend for a photo booth application that handles image processing, printing, and email functionality.

## Features

- 📸 Image upload and processing with Sharp
- 🖨️ PDF generation and printing capabilities
- 📧 Email notifications with attachments
- 🎨 Image filters and frames application
- 📱 QR code generation
- 🔗 CORS-enabled API for frontend integration

## Tech Stack

- **Framework**: NestJS v11.x
- **Runtime**: Node.js
- **Language**: TypeScript
- **Package Manager**: PNPM
- **Image Processing**: Sharp
- **PDF Generation**: PDF-Lib
- **Email**: Nodemailer with Google Mail integration
- **Testing**: Jest
- **Linting**: ESLint v9 with TypeScript support

## Prerequisites

- Node.js (v18 or higher)
- PNPM package manager
- Google App Password (for email functionality)

## Installation

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Environment Configuration**

   For email functionality, rename `.env.sample` to `.env` and configure:

   ```bash
   cp .env.sample .env
   ```

   Then edit `.env` with your Google Mail credentials:

   ```env
   GOOGLE_MAIL_APP_EMAIL=youremail@gmail.com
   GOOGLE_MAIL_APP_PASSWORD=your_app_password
   ```

   Generate an app password from: [Google App Passwords](https://myaccount.google.com/apppasswords)

## Available Scripts

### Development

```bash
# Start in development mode with hot reload
pnpm run start:dev

# Start in debug mode
pnpm run start:debug
```

### Production

```bash
# Build the application
pnpm run build

# Start in production mode
pnpm run start:prod
```

### Code Quality

```bash
# Run linting
pnpm run lint

# Format code with Prettier
pnpm run format
```

### Testing

```bash
# Run unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:cov

# Run e2e tests
pnpm run test:e2e
```

## API Endpoints

The application runs on port `3001` by default and includes:

- Image upload and processing endpoints
- Print job management
- Email sending functionality
- Static file serving for client assets

## Project Structure

```
src/
├── app.controller.ts      # Main API controller
├── app.service.ts         # Core business logic
├── app.module.ts          # Application module
├── main.ts               # Application entry point
├── mail.ts               # Email service
├── print.ts              # Printing service
├── code.service.ts       # QR code generation
└── images/               # Image processing module
    ├── images.controller.ts
    └── images.module.ts

client/
├── filters/              # Image filters
│   ├── landscape/        # Landscape format filters
│   └── polaroid/         # Polaroid format filters
└── frames/               # Image frames
    └── polaroid/         # Polaroid format frames
```

## Recent Updates (September 2025)

- ✅ Updated NestJS from v10 to v11
- ✅ Updated TypeScript and ESLint ecosystem
- ✅ Updated testing framework (Jest v30)
- ✅ Updated Node.js type definitions
- ✅ Updated core dependencies (Sharp, Nodemailer, Multer, etc.)
- ✅ Migrated to ESLint v9 flat config
- ✅ Fixed security vulnerabilities in dependencies

## Security

The application has been audited for security vulnerabilities. Most issues have been resolved, with only one remaining deep dependency issue in `html-minifier` that currently has no available fix.

## License

UNLICENSED
