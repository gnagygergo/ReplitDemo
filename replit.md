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
- **UI Components**: 
  - `LookupField` - Reusable component for consistent lookup functionality across forms, supporting edit/view/table modes with dialog-based selection
  - `TextField` - Standardized text input component with edit/view/table modes, optional copy-to-clipboard, truncation, multi-line support (visibleLinesInEdit/visibleLinesInView), and clickable navigation links
  - `NumberField` - Standardized numeric input component with edit/view/table modes, automatic formatting with thousands separators, and percentage display support
  - `DateTimeField` - Standardized date/time component supporting Date, Time, and DateTime field types with culture-aware formatting, UTC storage, and local timezone display across edit/view/table modes
  - `DropDownListField` - Standardized dropdown component with edit/view/table modes, supporting XML metadata sources (universal and company-specific), optional search functionality via Command component, and configurable value/display extractors
  - `DropDownListFieldTypeEditor` - Metadata editor component for XML-based value sets with table view, inline editing, sortable columns (label, code, default, iconSet, icon), add/delete functionality, and persistence to XML files via PUT /api/metadata/* endpoint
  - `TiptapEditor` - Rich text editor with comprehensive formatting capabilities including underline, highlight, text alignment (left/center/right/justify), links with dialog-based URL input, blockquotes, line spacing control, font sizes, text colors, code blocks, and clear formatting. Features a sticky toolbar that remains visible when scrolling long content
- **Label Styling**: Standardized label styling using `text-muted-foreground` for consistent appearance across all forms.
- **Date/Time Formatting**: Culture-aware date/time formatting using `useDateTimeFormat` hook that fetches user's preferred language settings and applies culture-specific formats from XML metadata
- **Rich Text Editing**: TipTap editor with custom LineHeight extension, multi-color highlighting, and sticky toolbar using CSS position:sticky with backdrop blur for optimal UX on long documents

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database**: Drizzle ORM with PostgreSQL (Neon serverless).
- **Schema**: Shared schema definitions between frontend and backend using Drizzle-Zod.
- **API Design**: RESTful endpoints with standardized error handling.
- **Universal Metadata System**: XML-based metadata loading for universal value sets (e.g., currencies, countries), eliminating database dependencies for static reference data and providing dedicated API endpoints (`/api/universal/currencies`, `/api/universal/countries`).
- **Dynamic Metadata API**: `/api/metadata/*` endpoint serves XML files dynamically from both universal (`0_universal_value_sets/`) and company-specific (`companies/[companyId]/`) paths with strict security validation, path whitelisting, and automatic company context interpolation. PUT endpoint supports admin-only XML metadata updates with xml2js Builder for serialization.

### Data Model
- **Entities**: Accounts, Opportunities, Assets, with comprehensive CRUD operations, search, sorting, and filtering.
- **Relationships**: One-to-many relationships (e.g., accounts to opportunities/assets).
- **Validation**: Zod schemas for runtime validation.
- **Accounts**: Includes structured address fields with Google Maps integration.
- **Assets**: Linked to accounts and products, with serial numbers and installation details.
- **Companies**: Includes tax residency country field (stores country code, references XML metadata for display).
- **Users**: Includes timezone preference field (stores IANA timezone ID for timezone-aware date/time display).

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