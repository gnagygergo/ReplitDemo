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
  - `TextField` - Self-contained text input component with internal FormLabel and FormControl rendering. Supports edit/view/table modes, optional copy-to-clipboard, truncation, multi-line support (visibleLinesInEdit/visibleLinesInView), clickable navigation links, and metadata-driven configuration via objectCode/fieldCode props. Labels automatically sourced from XML metadata or explicit `label` prop.
  - `NumberField` - Self-contained numeric input component with internal FormLabel and FormControl rendering. Supports edit/view/table modes, automatic formatting with thousands separators, percentage display support, and metadata-driven configuration via objectCode/fieldCode props. Labels automatically sourced from XML metadata or explicit `label` prop.
  - `DateTimeField` - Self-contained date/time component with internal FormLabel and FormControl rendering. Supports Date, Time, and DateTime field types with culture-aware formatting, UTC storage, local timezone display across edit/view/table modes, and metadata-driven configuration via objectCode/fieldCode props. Labels automatically sourced from XML metadata or explicit `label` prop.
  - `DropDownListField` - Self-contained dropdown component with internal FormLabel and FormControl rendering. Supports edit/view/table modes, XML metadata sources (universal and company-specific), optional search functionality via Command component, configurable value/display extractors, and metadata-driven configuration via objectCode/fieldCode props. Labels automatically sourced from XML metadata or explicit `label` prop.
  - `DropDownListFieldTypeEditor` - Metadata editor component for XML-based value sets with table view, inline editing, sortable columns (label, code, default, iconSet, icon), add/delete functionality, header-level fields (sorting direction and title), deterministic change detection using state snapshots, and persistence to XML files via PUT /api/metadata/* endpoint
  - `TiptapEditor` - Rich text editor with comprehensive formatting capabilities including underline, highlight, text alignment (left/center/right/justify), links with dialog-based URL input, blockquotes, line spacing control, font sizes, text colors, code blocks, and clear formatting. Features a sticky toolbar that remains visible when scrolling long content
- **Self-Contained Field Components**: Field components (TextField, NumberField, DateTimeField, DropDownListField) internally render `FormLabel` and `FormControl` components, eliminating the need for explicit `<FormLabel>` and `<FormControl>` tags in forms. Labels are automatically sourced from XML metadata via the `useFieldDefinition` hook when `objectCode` and `fieldCode` props are provided, or from the explicit `label` prop. This pattern significantly reduces form boilerplate. Usage: `<FormItem><TextField objectCode="assets" fieldCode="name" mode="edit" value={value} onChange={onChange} /><FormMessage /></FormItem>`. Labels display in both edit and view modes with consistent `text-muted-foreground` styling.
- **Metadata-Driven Field Configuration**: Field components (TextField, NumberField, DateTimeField, DropDownListField) support optional `objectCode` and `fieldCode` props that automatically fetch field definitions from XML metadata files using the `useFieldDefinition` hook. When provided, field properties (label, placeholder, maxLength, testId, copyable, truncate, visibleLines, decimalPlaces, percentageDisplay, allowSearch, metadataSource) are loaded from `companies/[companyId]/objects/[objectCode]/fields/[fieldCode].field_meta.xml` and merged with explicit props (explicit props take precedence). TestId values are auto-generated based on field code and mode (e.g., `input-serialNumber` for edit mode, `text-serialNumber` for view mode) if not explicitly provided. This pattern enables centralized field configuration management through the Object Builder module while maintaining backwards compatibility with hardcoded props
- **Object Builder Module**: Administrative interface for viewing and managing custom field definitions across business objects
  - `BusinessObjectsBuilderModule` - Main component with object type selector and field definition table displaying Field Type, Field Code, and Label columns from XML metadata files
  - `CreateEditFieldDialog` - Multi-step dialog for creating and editing custom fields with conditional workflow: (1) Field type selection (7 types), (2) Subtype selection (TextField: Text/Email/Phone/URL; DateTimeField: Date/Time/DateTime), (3) Field configuration form with type-specific Zod validation
  - Location: `/setup/business-objects` route, accessible via Setup menu
  - Data Source: Company-specific XML files at `companies/[companyId]/objects/[objectName]/fields/*.field_meta.xml`
  - API Endpoints: 
    - `GET /api/object-fields/:object` - Lists all field definitions
    - `GET /api/object-fields/:object/:fieldCode` - Fetches single field for editing
    - `POST /api/object-fields/:object` - Creates new field XML file with xml2js Builder and type-specific properties
    - `PUT /api/object-fields/:object/:fieldCode` - Updates existing field XML file with type-specific properties
  - Template System: Uses template files from `companies/0_custom_field_templates/` directory for XML structure guidance
  - **Supported Field Types**:
    - **TextField**: Full support with subtypes (Text/Email/Phone/URL), maxLength, copyable, truncate, visibleLines properties
    - **NumberField**: Full support with step (validated as numeric), format (Integer/Decimal/Currency/Percentage), decimalPlaces (validated 0-10 range)
    - **DateTimeField**: Full support with fieldType selector (Date/Time/DateTime)
    - **PicklistField**: Full support with common field properties (API Code, Label, Help Text, Placeholder)
    - Other types (LookupField, RichTextField, BooleanField) show "Coming Soon" message
  - **Validation**: Discriminated union schemas with type-specific validation (numeric constraints, range checks), error display in UI prevents invalid submissions
  - Query Pattern: TanStack Query with mutations for create/update operations and automatic cache invalidation
  - Security: Multi-tenant isolation, authenticated access, path validation, company context filtering
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