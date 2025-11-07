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
- **Accounts**: Companies with structured address fields (street, city, state/province, ZIP, country) plus legacy address field for display
  - Includes Google Maps integration for address autocomplete and mapping
  - Address fields: streetAddress, city, stateProvince, zipCode, country
  - Legacy address field auto-populated from structured fields for display in view mode
- **Opportunities**: Sales opportunities linked to accounts with revenue tracking and close dates
- **Assets**: Equipment and assets tracked with serial numbers, purchase dates, warranty information, and status
  - Fields: serialNumber (required), name, description, quantity, purchaseDate, warrantyExpiryDate, installationDate, status (active/inactive/retired/in_repair), location, notes
  - Links to accounts (which company/contact owns the asset) and products (what product the asset represents)
  - Full CRUD operations with search, sorting, and filtering capabilities
  - Company-scoped access with strict multi-tenant isolation
- **Relationships**: One-to-many relationships between accounts and opportunities/assets
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
- **Centralized Company Settings**: React Context Provider pattern with TanStack Query for global settings management
  - All company settings loaded once at login via `/api/company-settings` endpoint
  - Settings cached with `staleTime: Infinity` - only refetched on browser refresh
  - `useCompanySettings()` hook provides `isSettingEnabled()` and `getSetting()` helper methods
  - Eliminates redundant per-page setting queries throughout the application

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect
- **Database Connection**: Uses Replit-provided DATABASE_URL environment variable for both development and production
  - DO NOT use APP_DB_USER or APP_DB_PASSWORD secrets - they override correct credentials and cause authentication failures
  - DATABASE_URL contains all necessary credentials automatically managed by Replit

### Authentication & Security
- **Replit Auth**: Multi-provider authentication (Google, GitHub, X, Apple, email/password)
- **Express Session**: Secure session management with PostgreSQL store
- **Passport.js**: Authentication middleware for OIDC integration
- **Enterprise Security**: Session fixation prevention, CSRF protection, API route protection

### UI and Styling
- **Radix UI**: Unstyled, accessible UI primitives for core components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent iconography
- **Google Maps JavaScript API**: Places Autocomplete for address entry and Google Maps integration for viewing locations

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
- **API Protection**: All CRM endpoints require authentication (`/api/accounts`, `/api/opportunities`, `/api/assets`, `/api/cases`, `/api/send-email`)
- **CSRF Protection**: Implemented via `sameSite: 'lax'` session cookie configuration
- **Token Refresh**: Automatic refresh with session persistence for seamless user experience
- **Multi-Tenant Isolation**: Strict company context filtering on all data access operations
  - All CRUD operations filter by company ID to prevent cross-tenant data access
  - Asset operations require company context and return 401 Unauthorized if missing
  - Schema prevents client-side manipulation of company assignments
  - Update operations explicitly strip company ID to prevent reassignment

### Security Architecture Notes
- Session middleware enforces `sameSite: 'lax'` on every request to prevent CSRF attacks
- PostgreSQL session store with graceful fallback to MemoryStore for development
- Session regeneration on login/logout prevents session fixation vulnerabilities
- Explicit session cookie clearing on logout ensures complete session cleanup
- Company context enforced at route level (returns 401 if missing) and storage level (filters by both ID and company ID)
- Insert/update schemas omit server-managed fields (id, companyId, createdDate) to prevent client spoofing

## Registration Flow & License Management

### Automated License Agreement Creation
The registration process includes automatic license agreement provisioning:

1. **Template Validation**: Before creating any records, the system verifies an active License Agreement Template exists
   - Queries for templates where current date falls between `ValidFrom` and `ValidTo` dates
   - Filters by template code: `"Online_Registration_Free"` (unique identifier for registration templates)
   - If no valid template exists, registration fails with error: "The system did not find a valid Licence Agreement Template to which this registration could be linked."

2. **Company Creation**: Only proceeds after template validation
   - Creates company record with official name, alias, and registration ID
   - Ensures transactional integrity - no orphaned records if template is missing

3. **Automated Agreement Provisioning**: Created before user
   - Creates license agreement with company ID and template ID
   - Calculates agreement validity period based on template's `agreementBaseDurationMonths`
   - Sets initial license seat allocation
   - Returns licence agreement with ID to be used in user creation

4. **User Creation**: Creates first admin user
   - Creates first admin user linked to the company AND licence agreement
   - Requires licenceAgreementId from step 3
   - User is created with isAdmin = true for first company user

5. **License Seat Actualization**: Updates seat counts
   - Calls `actualizeLicenceAgreementSeatsUsed()` to calculate and update used seats
   - Ensures accurate seat tracking from the start

6. **Company Settings Serialization**: Initializes settings with defaults
   - Calls `serializeCompanySettingsForCompany()` to create company settings records
   - Generates settings for all master settings with default values
   - Ensures new company has all settings configured immediately

### Storage Methods
- `getActiveOnlineRegistrationTemplate()`: Finds valid template for current date with "Online_Registration_Free" licence code
- `createLicenceAgreementAutomated()`: Creates agreement with automated date calculation and pricing from template
- `actualizeLicenceAgreementSeatsUsed()`: Recalculates and updates used seat count for a license agreement
- `serializeCompanySettingsForCompany()`: Creates company settings records for a specific company based on all master settings