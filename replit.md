# OpportunityTracker - Sales CRM Application

## Overview
OpportunityTracker is a modern, full-stack CRM application for managing sales opportunities. It provides a clean interface for handling accounts and sales opportunities with full CRUD operations, search, and relationship management. The project aims to deliver a robust, easy-to-deploy solution with consistent reference data and a standardized user experience, prioritizing enterprise-grade security and efficient data management.

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
- **UI Components**:
    - **Self-Contained Field Components**: `LookupField`, `TextField`, `NumberField`, `DateTimeField`, `DropDownListField` components that internally render `FormLabel` and `FormControl`, sourcing labels automatically from XML metadata or explicit props.
    - **TiptapEditor**: Rich text editor with comprehensive formatting and sticky toolbar.
- **Metadata-Driven Field Configuration**: Field components fetch definitions from XML metadata using `objectCode` and `fieldCode` props, allowing centralized configuration via the Object Builder module.
- **Object Builder Module**: Administrative interface for managing custom field definitions with a multi-step dialog for creation/editing, type-specific validation, and persistence to XML files. Supports TextField (with subtypes), NumberField, DateTimeField, and PicklistField types.
- **Company-Specific Component Architecture**: Full component duplication per company (`companies/[companyId]/objects/[objectName]/layouts/`) for maximum customization, loaded dynamically at runtime via `loadCompanyComponent`. Default components are sourced from `companies/0_default/`. All major business objects (accounts, assets, opportunities, products, quotes) use this architecture with companyId normalization and useRef-based component caching.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database**: Drizzle ORM with PostgreSQL (Neon serverless).
- **API Design**: RESTful endpoints with standardized error handling.
- **Universal Metadata System**: XML-based metadata for static reference data (e.g., currencies, countries) via dedicated API endpoints.
- **Dynamic Metadata API**: `/api/metadata/*` endpoint serves and updates XML files dynamically from universal and company-specific paths with security validation.

### Data Model
- **Entities**: Accounts, Opportunities, Assets, Companies, Users with CRUD operations, search, sorting, and filtering.
- **Relationships**: One-to-many relationships (e.g., accounts to opportunities/assets).
- **Validation**: Zod schemas for runtime validation.
- **Key Fields**: Accounts include structured address fields; Assets link to accounts and products; Companies include tax residency country; Users include timezone preferences.

### Architecture Decisions
- **Monorepo Structure**: Client, server, and shared code in a single repository.
- **Type Safety**: End-to-end TypeScript with shared schema definitions (Drizzle-Zod).
- **Component Library**: shadcn/ui for consistent design and accessibility.
- **Database Strategy**: Drizzle ORM for type safety and PostgreSQL compatibility.
- **State Management**: TanStack Query for server state.
- **Centralized Company Settings**: React Context Provider with TanStack Query for global settings management.

### Security Implementation
- **Authentication**: Replit Auth, Express Session with PostgreSQL, Passport.js for OIDC.
- **Session Security**: Session fixation prevention, secure session cookies, explicit clearing on logout.
- **API Protection**: All CRM endpoints require authentication.
- **CSRF Protection**: Via `sameSite: 'lax'` session cookie.
- **Multi-Tenant Isolation**: Strict company context filtering on all data access and routes.
- **Registration Flow**: Automated license provisioning, company/user creation, and settings serialization.

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