# OpportunityTracker - Sales CRM Application

## Overview
OpportunityTracker is a modern, full-stack CRM application for sales opportunity management. It offers a clean interface for managing accounts and sales opportunities with comprehensive CRUD operations, search functionality, and relationship management. The project aims to provide a robust, easy-to-deploy solution with consistent reference data and a standardized user experience, focusing on enterprise-grade security and efficient data management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Frameworks**: React, TypeScript, Radix UI, shadcn/ui.
- **Styling**: Tailwind CSS with CSS variables.
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter.
- **Forms**: React Hook Form with Zod validation.
- **Build Tool**: Vite.
- **UI Components**: Reusable `LookupField` component for consistent lookup functionality across forms, dynamically adapting to business rules (e.g., conditional mandatory fields).
- **Label Styling**: Standardized label styling using `text-muted-foreground` for consistent appearance across all forms.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database**: Drizzle ORM with PostgreSQL (Neon serverless).
- **Schema**: Shared schema definitions between frontend and backend using Drizzle-Zod.
- **API Design**: RESTful endpoints with standardized error handling.
- **Universal Metadata System**: XML-based metadata loading for universal value sets (e.g., currencies, countries), eliminating database dependencies for static reference data and providing dedicated API endpoints (`/api/universal/currencies`, `/api/universal/countries`).

### Data Model
- **Entities**: Accounts, Opportunities, Assets, with comprehensive CRUD operations, search, sorting, and filtering.
- **Relationships**: One-to-many relationships (e.g., accounts to opportunities/assets).
- **Validation**: Zod schemas for runtime validation.
- **Accounts**: Includes structured address fields with Google Maps integration.
- **Assets**: Linked to accounts and products, with serial numbers and installation details.
- **Companies**: Includes tax residency country field (stores country code, references XML metadata for display).

### Architecture Decisions
- **Monorepo Structure**: Client, server, and shared code in a single repository.
- **Type Safety**: End-to-end TypeScript with shared schema definitions.
- **Component Library**: shadcn/ui for consistent design and accessibility.
- **Database Strategy**: Drizzle ORM for type safety and PostgreSQL compatibility.
- **State Management**: TanStack Query for server state over client state solutions.
- **Centralized Company Settings**: React Context Provider pattern with TanStack Query for global, cached settings management.

### Security Implementation
- **Authentication**: Replit Auth integration (multi-provider), Express Session with PostgreSQL store, Passport.js for OIDC.
- **Session Security**: Session fixation prevention, secure session cookies (`httpOnly`, `secure`, `sameSite`), explicit session clearing on logout.
- **API Protection**: All CRM endpoints require authentication.
- **CSRF Protection**: Implemented via `sameSite: 'lax'` session cookie configuration.
- **Multi-Tenant Isolation**: Strict company context filtering on all data access operations and at the route level to prevent cross-tenant data access.
- **Registration Flow**: Automated license agreement provisioning, company and user creation, license seat actualization, and company settings serialization.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL.
- **Drizzle ORM**: Type-safe database toolkit.

### Authentication & Security
- **Replit Auth**: Multi-provider authentication.
- **Express Session**: Secure session management.
- **Passport.js**: Authentication middleware.

### UI and Styling
- **Radix UI**: Unstyled, accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Google Maps JavaScript API**: Places Autocomplete and mapping.

### Development Tools
- **Vite**: Build tool.

### Runtime Libraries
- **TanStack Query**: Server state management.
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.
- **Wouter**: Lightweight routing library.
- **date-fns**: Date manipulation.