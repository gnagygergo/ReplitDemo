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
- **Object Builder Module**: Comprehensive administrative interface for managing business objects and their configurations:
    - **List View**: Displays all business objects defined in `[companyId]/objects/` folders as cards with search functionality.
    - **Detail View**: Tabbed interface with Object Details, Fields, and Layouts tabs.
    - **Fields Tab**: Integrates the Custom Field Builder for managing field definitions with multi-step dialog for creation/editing, type-specific validation, and persistence to XML files. Supports TextField (with subtypes), NumberField, DateTimeField, PicklistField, CheckboxField, and AddressField types.
    - **AddressField Type**: Prefix-based auto-generation of 5 database columns (street_address, city, state_province, zip_code, country). Users provide a prefix (e.g., "physical_location") and the system automatically generates column names like "physical_location_street_address". Column names are disabled for editing and displayed in both create (live preview) and edit (read-only) modes.
    - **Dynamic Loading**: Queries `*.object_meta.xml` files to discover and display available business objects.
- **Company-Specific Component Architecture**: Full component duplication per company (`companies/[companyId]/objects/[objectName]/layouts/`) for maximum customization, loaded dynamically at runtime via `loadCompanyComponent`. Default components are sourced from `companies/0_default/`. All major business objects (accounts, assets, opportunities, products, quotes) use this architecture with companyId normalization and useRef-based component caching.
- **Dynamic Tab System**: Company-specific tabs are defined in `companies/[companyId]/custom-tabs/` folder using XML files (e.g., `Quotes.tab_meta.xml`). Each tab definition includes:
    - **TabLabel**: Display name shown in header navigation
    - **TabCode**: Unique identifier for the tab
    - **ObjectCode**: Links to the corresponding object folder (e.g., "quotes" links to `objects/quotes/`)
    - **Icon**: Lucide icon name for the tab
    - **TabOrder**: Numeric ordering for tab display sequence
- **Dynamic Routing**: App.tsx generates routes dynamically from tab definitions via `/api/tab-definitions`. Uses generic `ObjectListPage` and `ObjectDetailPage` wrapper components that load the appropriate layouts based on the tab's objectCode.
- **Layout File Naming Convention**: Layout files follow a priority-based naming convention:
    - **NEW Clean Format** (recommended):
        - Detail views: `[singular]-detail.layout.tsx` (e.g., `product-detail.layout.tsx`)
        - Table views: `[plural].table_layout.tsx` (e.g., `products.table_layout.tsx`)
    - **Legacy Format** (still supported):
        - Detail views: `[singular]-detail.detail_view_meta.tsx` (e.g., `asset-detail.detail_view_meta.tsx`)
        - Table views: `[plural].table_view_meta.tsx` (e.g., `assets.table_view_meta.tsx`)
- **Clean Layout Architecture** (New Pattern - Products as proof of concept):
    - **LayoutContext** (`client/src/contexts/LayoutContext.tsx`): React context providing form, record, mode, and objectCode to all child components
    - **Smart Field Component** (`companies/[companyId]/components/ui/Field.tsx`): Auto-detects field type from XML metadata and renders appropriate component with auto-wired props
    - **DetailViewHandler** (`companies/[companyId]/components/ui/DetailViewHandler.tsx`): Generic wrapper handling loading, error states, header, edit/save buttons, and LayoutContext provision
    - **TableViewHandler** (`companies/[companyId]/components/ui/TableViewHandler.tsx`): Generic wrapper handling loading, empty states, search, and table structure
    - **Benefits**: Reduces layout files from ~250 lines to ~30-50 lines of pure field arrangement
    - **Backward Compatible**: ObjectDetailPage/ObjectListPage check for `.layout.tsx` first, fall back to legacy format if not found
    - **Incremental Rollout**: New format can be adopted per-object without breaking existing layouts
- **Generic Data Hooks**: Two hooks handle all CRUD operations for any object type:
    - `useObjectDetail(objectCode, id)`: Manages detail page state including fetch, create, update, delete with proper loading/error states and navigation
    - `useObjectList(objectCode)`: Manages list page state including search, sorting, pagination with delete confirmation
- **Dependency Injection for Layouts**: Layout files receive all dependencies via props instead of imports:
    - `layoutDependencies.ts` exports bundled UI components, field components, icons, hooks, and utilities
    - `ObjectDetailPage` and `ObjectListPage` inject these dependencies into dynamically loaded layouts
    - Reduces import boilerplate and ensures consistent component versions across layouts
- **Layout Mandatory Fields**: Form-level validation system for fields that must have values before saving:
    - `LayoutModeContext` provides validation state management via `LayoutModeProvider`
    - `useLayoutMandatoryField` hook registers fields and tracks empty state
    - All field components (TextField, NumberField, DropDownListField, DateTimeField, LookupFormField, AddressField) support `layoutMandatory` prop
    - Error message "This field is mandatory" displays on empty mandatory fields when validation fails
    - `validateMandatoryFields()` is called before form submission to block saving with empty mandatory fields
    - Layout-level requirement (same field can be mandatory in one layout but optional in another)
    - **Important**: Use `key={objectCode-id}` on LayoutModeProvider to reset validation state when navigating between records
- **Pluralization Utility**: `client/src/lib/pluralize.ts` handles irregular plurals correctly:
    - 'opportunities' → 'opportunity', 'companies' → 'company', 'categories' → 'category'
    - Used throughout the routing and data hooks for proper URL/file path resolution

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **Database**: Drizzle ORM with PostgreSQL (Neon serverless).
- **API Design**: RESTful endpoints with standardized error handling.
- **Universal Metadata System**: XML-based metadata for static reference data (e.g., currencies, countries) via dedicated API endpoints.
- **Dynamic Metadata API**: `/api/metadata/*` endpoint serves and updates XML files dynamically from universal and company-specific paths with security validation.
- **Object Definitions API**: `/api/object-definitions` endpoint scans company-specific `objects/` folders and returns business object metadata from `*.object-meta.xml` files.
- **Tab Definitions API**: `/api/tab-definitions` endpoint scans company-specific `custom-tabs/` folders and returns tab metadata from `*.tab_meta.xml` files.

### Data Model
- **Entities**: Accounts, Opportunities, Assets, Companies, Users with CRUD operations, search, sorting, and filtering.
- **Relationships**: One-to-many relationships (e.g., accounts to opportunities/assets).
- **Validation**: Zod schemas for runtime validation.
- **Key Fields**: Accounts include structured address fields; Assets link to accounts and products; Companies include tax residency country; Users include timezone preferences.
- **Decimal Field Standard**: All numeric/decimal fields use DECIMAL(17,5) precision (17 total digits, 5 decimal places) for consistency across the application.

### Number Formatting System
- **Culture-Aware Formatting**: Numbers are formatted using the user's preferred language/culture settings from `culture_codes.xml`.
- **useCultureFormat Hook**: Provides culture-specific thousand separators and decimal separators based on user's `preferredLanguage` field.
- **DecimalPlaces Control**: Field definition XML files specify `DecimalPlaces` tag to control:
    - Maximum decimal digits users can enter in edit mode
    - Number of decimals displayed in view/table modes
- **Precision Validation**: Edit mode enforces maximum 17 total digits (precision limit) and respects DecimalPlaces from field metadata.

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