# OpportunityTracker - Sales CRM Application

## Overview

OpportunityTracker is a modern, full-stack CRM application designed for sales opportunity management. Built with React, TypeScript, and Express.js, it provides a clean interface for managing accounts and sales opportunities with comprehensive CRUD operations, search functionality, and relationship management between accounts and opportunities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query for server state management, caching, and synchronization
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for REST API endpoints
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Database**: Drizzle ORM with PostgreSQL (Neon serverless) for type-safe database operations
- **Schema**: Shared schema definitions between frontend and backend using Drizzle-Zod
- **Storage**: In-memory storage implementation with interface for easy database integration
- **API Design**: RESTful endpoints with standardized error handling and logging

### Data Model
- **Accounts**: Companies with name, address, and industry classification (tech, construction, services)
- **Opportunities**: Sales opportunities linked to accounts with revenue tracking and close dates
- **Relationships**: One-to-many relationship between accounts and opportunities
- **Validation**: Zod schemas for runtime validation and TypeScript integration

### Development Environment
- **Development Server**: Vite dev server with HMR and Express API proxy
- **Database Migrations**: Drizzle Kit for schema management and migrations
- **Code Quality**: TypeScript strict mode with path aliases for clean imports
- **Styling**: PostCSS with Tailwind CSS and Autoprefixer

### Architecture Decisions
- **Monorepo Structure**: Client, server, and shared code in single repository for simplified development
- **Type Safety**: End-to-end TypeScript with shared schema definitions
- **Component Library**: shadcn/ui for consistent design system and accessibility
- **Database Strategy**: Drizzle ORM chosen for type safety and PostgreSQL compatibility
- **State Management**: TanStack Query for server state over client state solutions like Redux

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect

### Authentication & Security
- **Replit Auth**: Multi-provider authentication (Google, GitHub, X, Apple, email/password)
- **Express Session**: Secure session management with PostgreSQL store
- **Passport.js**: Authentication middleware for OIDC integration
- **Enterprise Security**: Session fixation prevention, CSRF protection, API route protection

### UI and Styling
- **Radix UI**: Unstyled, accessible UI primitives for core components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Build tool with plugins for React, TypeScript, and development features
- **Replit Integration**: Development environment plugins for Cartographer and dev banner

### Runtime Libraries
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation and TypeScript integration
- **Wouter**: Lightweight routing library
- **date-fns**: Date manipulation and formatting utilities

## Security Implementation

### Enterprise-Grade Authentication
- **Multi-Provider Support**: Replit Auth integration supporting Google, GitHub, X, Apple, and email/password authentication
- **Session Security**: 
  - Session fixation prevention with ID regeneration on login/logout
  - Secure session cookies with `httpOnly`, `secure`, and `sameSite` protection
  - 7-day session TTL with proper cleanup
- **API Protection**: All CRM endpoints require authentication (`/api/accounts`, `/api/opportunities`, `/api/cases`, `/api/send-email`)
- **CSRF Protection**: Implemented via `sameSite: 'lax'` session cookie configuration
- **Token Refresh**: Automatic refresh with session persistence for seamless user experience

### Security Architecture Notes
- Session middleware enforces `sameSite: 'lax'` on every request to prevent CSRF attacks
- PostgreSQL session store with graceful fallback to MemoryStore for development
- Session regeneration on login/logout prevents session fixation vulnerabilities
- Explicit session cookie clearing on logout ensures complete session cleanup