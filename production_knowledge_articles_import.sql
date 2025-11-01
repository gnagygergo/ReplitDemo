-- ============================================================================
-- KNOWLEDGE ARTICLES - PRODUCTION DATA IMPORT
-- ============================================================================
-- This script imports all knowledge articles from development to production
-- Created: 2025-11-01
--
-- Total articles: 5
--
-- Usage:
--   Run this script directly on your production database using psql or your
--   database management tool. The script uses ON CONFLICT DO NOTHING to safely
--   skip records that already exist.
-- ============================================================================

-- Clear existing knowledge articles (optional - comment out if you want to keep existing)
-- TRUNCATE TABLE knowledge_articles;

-- ============================================================================
-- KNOWLEDGE ARTICLES
-- ============================================================================

-- Article 1: What is Smart Account management?
INSERT INTO knowledge_articles (
  id, article_title, article_content, article_functional_domain, article_functionality_name, 
  article_tags, article_keywords, is_published, language_code, author_id, 
  created_date, is_internal, article_code, functional_domain_id, functionality_id
) VALUES (
  '93c48b01-f599-42a3-a160-5d536dc728b0',
  'What is Smart Account management?',
  '<p>With Smart Account Management, you get predefined rules about how to handle different account types, such as the relevant fields on the layouts and how each Type can be linked to each other.</p><h2>You can mark your account records as one or more of these types:</h2><ol><li><p>Person Account - a person without a company registration id.</p><ul><li><p>Instead of the simple "name" field, you''ll see <strong>First Name</strong> and <strong>Last Name</strong> fields on the layout.</p></li></ul></li><li><p>Self Employed Person - also a person, but on the layout, you can populate their <strong>company registration id</strong>.</p><ul><li><p>Besides First Name and Last Name, you''ll also get the "<strong>Account Name</strong>" field on the layout that you can use in case on business documents (such as Quotes, Sales Orders or Invoices) you need to designate the official name of their registered one-person entrepreneurship.</p></li></ul></li><li><p>Company Contact - a contact person under a company account.</p><ul><li><p>This type is not an option when creating a contact (Account) manually. The system automatically marks a record with this type, when you create it from under a Legal Entity or a Shipping Address.</p></li><li><p>When a record represents only a Company Contact person, the layout does not include the Address field. The reason is simple: the record reflects the individual in their professional capacity, not their personal one, so their address should not be recorded.</p></li></ul></li><li><p>Legal Entity - a record that represents the legal entity (Company) itself.</p></li><li><p>Shipping Address - a record that belongs under a Legal Entity but is in a different physical address from the Legal Entity.</p></li></ol><h2>You also get a couple of Related Lists on the Account Detail view</h2><ol><li><p>Company Contacts</p><ul><li><p>Visible on Legal Entity or Shipping Address records.</p></li></ul></li><li><p>Subsidiaries</p><ul><li><p>Visible on Legal Entity records. Shows Legal Entities under Legal Entities.</p></li></ul></li><li><p>Shipping Addresses</p><ul><li><p>Shows Ship-to locations under Legal Entities such as warehouses, branches or offices that are not legal entities.</p></li></ul></li></ol><p></p>',
  'Account Management',
  'Smart Account Management',
  NULL,
  NULL,
  'f',
  'en',
  '52b008d4-ce35-4eeb-8555-614306f0e025',
  '2025-10-14 18:10:46.224766',
  'f',
  'smart_account_management_intro',
  '7f3c729c-a357-418e-aea5-8561129822d7',
  '33f99f1e-3caa-4f52-8610-baaf3c69e90f'
) ON CONFLICT (id) DO NOTHING;

-- Article 2: Template Page Layout - 2 pane layout, 1 file implementation
INSERT INTO knowledge_articles (
  id, article_title, article_content, article_functional_domain, article_functionality_name, 
  article_tags, article_keywords, is_published, language_code, author_id, 
  created_date, is_internal, article_code, functional_domain_id, functionality_id
) VALUES (
  'c4dfcc4b-47dc-403b-b8f1-9cd41f427cc7',
  'Template Page Layout - 2 pane layout, 1 file implementation',
  '<p><code>client/page-templates/setup-templates/knowledge-like-2-pane-layout-list-and-detail-1file/two-pane-setup-template.tsx</code></p><p>This template includes:</p><p>✅ <strong>Complete usage instructions</strong> at the top explaining exactly how to customize it<br>✅ <strong>Step-by-step guide</strong> with numbered steps for easy implementation<br>✅ <strong>All the key patterns</strong> from knowledge-articles.tsx:</p><ul><li><p>Two-pane resizable layout</p></li><li><p>View/Edit mode toggle</p></li><li><p>Search functionality</p></li><li><p>Create/Update/Delete operations</p></li><li><p>Performance optimization (list vs detail queries)</p></li><li><p>Rich text editor pattern (optional)</p></li><li><p>User lookup pattern (optional)</p></li><li><p>Form validation with Zod</p></li></ul><p>✅ <strong>Generic placeholders</strong> marked with comments like:</p><ul><li><p><code>// Replace with your entity type</code></p></li><li><p><code>// STEP 3: REPLACE THESE IMPORTS</code></p></li><li><p><code>// CUSTOMIZE: Replace with your fields</code></p></li><li><p>Placeholder API endpoints: <code>/api/your-entities</code></p></li></ul><p>✅ <strong>Well-commented code</strong> explaining what each section does</p><p>The template is ready to use! Just copy it to your components folder, do a find-and-replace for "YourEntity" → your actual entity name, and customize the fields. All the architectural patterns and structure are already in place.</p>',
  'Setup',
  'Reusable Page Template',
  NULL,
  NULL,
  'f',
  NULL,
  '52b008d4-ce35-4eeb-8555-614306f0e025',
  '2025-10-14 20:43:02.126944',
  't',
  NULL,
  '7f3c729c-a357-418e-aea5-8561129822d7',
  '33f99f1e-3caa-4f52-8610-baaf3c69e90f'
) ON CONFLICT (id) DO NOTHING;

-- Article 3: UI Elements of Detail Views (Panel, PanelGroup, Card)
INSERT INTO knowledge_articles (
  id, article_title, article_content, article_functional_domain, article_functionality_name, 
  article_tags, article_keywords, is_published, language_code, author_id, 
  created_date, is_internal, article_code, functional_domain_id, functionality_id
) VALUES (
  '1c4f733e-52fb-42df-ba3c-ced76f5fcf0a',
  'UI Elements of Detail Views (Panel, PanelGroup, Card)',
  '<p>Here''s the breakdown of the UI technologies QuickWins platform is using:</p><p><span style="color: rgb(230, 232, 237); font-size: 14px;"><strong>Panel &amp; PanelGroup</strong> - </span><span style="color: rgb(107, 114, 128);">react-resizable-panels</span></p><p><strong>Technology</strong>: React component library for creating resizable layouts<br><strong>Created by</strong>: Brian Vaughn (React core team member)<br><strong>Official Documentation</strong>:</p><ul><li><p><strong>GitHub Repo</strong>: <a target="_blank" rel="noopener noreferrer nofollow" href="https://github.com/bvaughn/react-resizable-panels"><u>https://github.com/bvaughn/react-resizable-panels</u></a></p></li><li><p><strong>README</strong>: <a target="_blank" rel="noopener noreferrer nofollow" href="https://github.com/bvaughn/react-resizable-panels/blob/main/packages/react-resizable-panels/README.md"><u>https://github.com/bvaughn/react-resizable-panels/blob/main/packages/react-resizable-panels/README.md</u></a></p></li><li><p><strong>Live Demo</strong>: <a target="_blank" rel="noopener noreferrer nofollow" href="https://react-resizable-panels.vercel.app/"><u>https://react-resizable-panels.vercel.app/</u></a></p></li></ul><p><strong>What it does</strong>:</p><ul><li><p>Creates draggable, resizable panel layouts (like VS Code''s split views)</p></li><li><p>Supports horizontal and vertical directions</p></li><li><p>Works with mouse, touch, and keyboard</p></li><li><p>Can save layout preferences to localStorage</p></li><li><p>Perfect for dashboards and complex layouts</p></li></ul><hr><p><span style="color: rgb(230, 232, 237); font-size: 14px;"><strong>Card</strong> - </span><span style="color: rgb(107, 114, 128);">shadcn/ui</span></p><p><strong>Technology</strong>: UI component collection built on Radix UI + Tailwind CSS<br><strong>Official Documentation</strong>: <a target="_blank" rel="noopener noreferrer nofollow" href="https://ui.shadcn.com/docs/components/card"><u>https://ui.shadcn.com/docs/components/card</u></a></p><p><strong>What it is</strong>:</p><ul><li><p>A design system with copy-paste components (not a traditional npm library)</p></li><li><p>Components are added directly to your project and fully customizable</p></li><li><p>Built on top of Radix UI (for accessibility) and styled with Tailwind CSS</p></li></ul><p><strong>Card sub-components</strong>:</p><ul><li><p><code>Card</code> - Root container</p></li><li><p><code>CardHeader</code> - Top section</p></li><li><p><code>CardTitle</code> - Heading</p></li><li><p><code>CardDescription</code> - Supporting text</p></li><li><p><code>CardContent</code> - Main content area</p></li><li><p><code>CardFooter</code> - Bottom section for actions</p></li></ul><hr><h3>Quick Summary</h3><p>Your layout uses:</p><ol><li><p><strong>react-resizable-panels</strong> for the resizable column structure (the drag-to-resize functionality)</p></li><li><p><strong>shadcn/ui Card</strong> for the visual card containers holding your account information, opportunities, and quotes</p></li></ol><p>Both are React-based, well-maintained, and widely used in modern web applications!</p>',
  'Platform',
  NULL,
  NULL,
  NULL,
  'f',
  'en',
  '52b008d4-ce35-4eeb-8555-614306f0e025',
  '2025-10-14 20:57:46.487493',
  't',
  NULL,
  'ca46561d-fd7d-4679-89c5-a4ba1db76d27',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Article 4: Secret management
INSERT INTO knowledge_articles (
  id, article_title, article_content, article_functional_domain, article_functionality_name, 
  article_tags, article_keywords, is_published, language_code, author_id, 
  created_date, is_internal, article_code, functional_domain_id, functionality_id
) VALUES (
  '118a510f-3fd4-4de4-b935-6bcfd3e4c36b',
  'Secret management',
  '<h2>What are Secrets?</h2><p><strong>Secrets</strong> are encrypted environment variables where you store sensitive information that your app needs to work - things like:</p><ul><li><p>API keys (OpenAI, Stripe, SendGrid, etc.)</p></li><li><p>Database passwords</p></li><li><p>Authentication tokens</p></li><li><p>Any other private credentials</p></li></ul><h2>Where are they stored?</h2><p>Secrets are stored <strong>securely on Replit''s infrastructure</strong> using Google Cloud''s secure storage with military-grade encryption (AES-256). They are:</p><ul><li><p><strong>NOT stored in your code files</strong></p></li><li><p><strong>NOT stored in GitHub</strong> when you push your code</p></li><li><p><strong>NOT visible in your file system</strong></p></li></ul><p>When your app runs on Replit, these secrets are automatically made available as environment variables (like <code>process.env.OPENAI_API_KEY</code>).</p><h2>What happens when you move to AWS or another platform?</h2><p><strong>You''ll need to set them up again manually.</strong> Secrets are tied to the Replit platform and don''t transfer automatically when you:</p><ul><li><p>Export your code to GitHub</p></li><li><p>Deploy to AWS, Google Cloud, or another hosting provider</p></li><li><p>Share your code with someone else</p></li></ul><p>This is actually a <strong>good security practice</strong> - it prevents your sensitive credentials from accidentally leaking when you share or move your code.</p><h2>What you need to do when migrating:</h2><ol><li><p><strong>Make a list</strong> of all the secrets your app uses (check the Secrets pane in Replit)</p></li><li><p><strong>Set them up in the new platform</strong> using that platform''s secret management system:</p><ul><li><p>AWS: AWS Secrets Manager or Parameter Store</p></li><li><p>Vercel: Environment Variables in project settings</p></li><li><p>Other platforms: Usually they have their own environment variable configuration</p></li></ul></li></ol><p>Your code stays the same because it just reads from environment variables - only the platform storing those variables changes.</p><p></p>',
  NULL,
  NULL,
  NULL,
  NULL,
  'f',
  'en',
  '47703289',
  '2025-10-22 10:53:21.669358',
  't',
  NULL,
  '7899a5b1-947a-426d-8c36-7562a2beea0e',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Article 5: Custom Field architecture - discussion about options
INSERT INTO knowledge_articles (
  id, article_title, article_content, article_functional_domain, article_functionality_name, 
  article_tags, article_keywords, is_published, language_code, author_id, 
  created_date, is_internal, article_code, functional_domain_id, functionality_id
) VALUES (
  '34c0caa7-209a-4294-9022-1eeaf878be01',
  'Custom Field architecture - discussion about options',
  '<p>I want to externalize fields so that I can have "field definitions" on business objects.<br>Do you recommend to have it as data (field definition table) or as files, like one file for each field definition under folders per object?</p><p>Features that I plan to have for my platform, that must be considered:</p><ul><li><p>UI layout editor for objects'' detail views (drag and drop field arrangement capability)</p></li><li><p>custom field creation functionality in the setup</p></li></ul><h1>AGENT</h1><p>For your use case, I strongly recommend <strong>database-based field definitions</strong> rather than files. Here''s why:</p><h2>Database Approach Wins For Your Features</h2><p><strong>1. Runtime Custom Field Creation</strong></p><ul><li><p>Users can create custom fields through your setup UI instantly</p></li><li><p>No file system writes, no app restarts</p></li><li><p>Changes are immediately available across all users</p></li></ul><p><strong>2. Drag &amp; Drop Layout Editor</strong></p><ul><li><p>Layout configurations (field positions, widths, visibility) need to be saved per user/role</p></li><li><p>Database makes it trivial to store and retrieve these preferences</p></li><li><p>Easy to version and rollback layout changes</p></li></ul><p><strong>3. Multi-tenancy Ready</strong></p><ul><li><p>Each company can have different field definitions</p></li><li><p>Simple company_id filtering</p></li><li><p>No file path complexity or conflicts</p></li></ul><p><strong>4. Query &amp; Validation Power</strong></p><ul><li><p>Find all fields of a certain type: <code>SELECT * FROM field_definitions WHERE field_type = ''text''</code></p></li><li><p>Validate dependencies: "Field X requires Field Y to exist"</p></li><li><p>Audit trail: Who created what field when</p></li></ul><p><strong>5. Dynamic &amp; Scalable</strong></p><ul><li><p>Add field metadata without schema migrations (JSON columns for validation rules, display options)</p></li><li><p>Handle relationships between fields easily</p></li><li><p>Support conditional field visibility based on other field values</p></li></ul><h2>Recommended Schema Structure</h2><pre><code>field_definitions
- id
- object_type (e.g., ''account'', ''opportunity'')
- field_name
- field_label
- field_type (text, number, date, dropdown, etc.)
- is_required
- is_custom (system vs user-created)
- validation_rules (JSON)
- display_order
- company_id (for custom fields)
- created_by, created_date
field_layout_configs
- id
- object_type
- user_id or role_id
- layout_definition (JSON: positions, widths, sections)
- company_id</code></pre><p><strong>Files only make sense when:</strong></p><ul><li><p>You need version control for field definitions across environments</p></li><li><p>Field definitions are truly static and never change at runtime</p></li><li><p>You want developers to manage fields, not end users</p></li></ul><p>But neither applies to your platform.</p><h1>GERGO</h1><p><span style="color: rgb(0, 0, 0); font-size: 14px;">If I chose database-based field definitions, how will new fields become part of the schema, become new fields in existing tables?</span></p><h1>AGENT</h1><p>You have three architectural approaches, each with different trade-offs:</p><p><span style="color: rgb(230, 232, 237); font-size: 14px;">1. <strong>EAV (Entity-Attribute-Value) Pattern</strong> ⭐ </span><span style="color: rgb(107, 114, 128);">Recommended for You</span></p><p>Custom fields <strong>don''t</strong> modify the schema at all. Instead, they''re stored separately:</p><pre><code>Base table (accounts):
id | name | industry | address | created_date
-------------------------------------------
1 | Acme | tech | 123 St | 2024-01-01
Custom field values (field_values):
entity_id | field_definition_id | value
---------------------------------------
1 | "custom_phone" | "555-1234"
1 | "custom_revenue" | "1000000"</code></pre><p><strong>Pros:</strong></p><ul><li><p>Add unlimited custom fields without touching schema</p></li><li><p>Perfect for multi-tenant SaaS</p></li><li><p>Works with your drag-drop editor naturally</p></li><li><p>No database migrations for custom fields</p></li></ul><p><strong>Cons:</strong></p><ul><li><p>Queries are more complex (JOINs required)</p></li><li><p>Slightly slower for large datasets</p></li></ul><p><span style="color: rgb(107, 114, 128);">2. <strong>JSONB Column Approach</strong> (PostgreSQL specific)</span></p><p>Store all custom fields in a single JSON column:</p><pre><code>accounts table:
id | name | industry | custom_fields (JSONB)
------------------------------------------------
1 | Acme | tech | {"phone": "555-1234", "revenue": 1000000}</code></pre><p><strong>Pros:</strong></p><ul><li><p>Simple schema</p></li><li><p>Can index specific JSON keys</p></li><li><p>No JOINs needed</p></li></ul><p><strong>Cons:</strong></p><ul><li><p>Type safety is weaker</p></li><li><p>Harder to enforce validation</p></li><li><p>All custom fields in one blob</p></li></ul><p><span style="color: rgb(230, 232, 237); font-size: 14px;">3. <strong>Dynamic Schema (ALTER TABLE)</strong></span></p><p>Actually add new columns when users create custom fields:</p><pre><code>ALTER TABLE accounts ADD COLUMN custom_phone VARCHAR(255);</code></pre><p><strong>Pros:</strong></p><ul><li><p>Traditional relational model</p></li><li><p>Best query performance</p></li></ul><p><strong>Cons:</strong></p><ul><li><p>❌ Database migrations at runtime = risky</p></li><li><p>❌ Schema bloat with many custom fields</p></li><li><p>❌ Can''t have different custom fields per company (multi-tenant)</p></li><li><p>❌ Potential conflicts with reserved column names</p></li></ul><p><span style="color: rgb(107, 114, 128);">My Recommendation:</span><span style="color: rgb(230, 232, 237); font-size: 14px;"> <strong>EAV Pattern</strong></span></p><p>Given your requirements (custom field creation UI, multi-tenant, drag-drop layouts), EAV is the industry standard. Companies like Salesforce, HubSpot, and Zendesk all use variations of this.</p><p><strong>How it works in practice:</strong></p><ol><li><p>User creates a custom field through your UI</p></li><li><p>You insert a row into field_definitions table</p></li><li><p>Your layout editor can immediately display this field</p></li><li><p>When users fill in the field, values go to field_values table</p></li><li><p>When rendering a record, JOIN field_values to get custom field data</p></li></ol><p>This gives you maximum flexibility without database schema changes.</p><p></p>',
  NULL,
  NULL,
  NULL,
  NULL,
  'f',
  'en',
  '52b008d4-ce35-4eeb-8555-614306f0e025',
  '2025-10-23 12:03:49.515076',
  't',
  NULL,
  '7899a5b1-947a-426d-8c36-7562a2beea0e',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Article 6: Definition of a Card List View
INSERT INTO knowledge_articles (
  id, article_title, article_content, article_functional_domain, article_functionality_name, 
  article_tags, article_keywords, is_published, language_code, author_id, 
  created_date, is_internal, article_code, functional_domain_id, functionality_id
) VALUES (
  '1df5a0a1-7697-424f-a692-efb242886f2c',
  'Definition of a Card List View',
  '<h1>Query the necessary records</h1><pre><code>export default function AccountQuoteListCard({
  accountId,
  accountName,
  isEditing,
}: AccountQuoteListCardProps) {
  // Fetch quotes for this account
  const { data: quotes = [], isLoading } = useQuery&lt;Quote[]&gt;({
    queryKey: ["/api/accounts", accountId, "quotes"],
    enabled: !!accountId,
  });</code></pre><h2>Explanation:</h2><p>The default query function <strong>joins the queryKey array with "/"</strong> to build the final URL!</p><h3>So for your example:</h3><pre><code>queryKey: ["/api/accounts", accountId, "quotes"]</code></pre><p>If <code>accountId</code> is, for example, <code>"123"</code>, it becomes:</p><pre><code>"/api/accounts" + "/" + "123" + "/" + "quotes"</code></pre><p><code>= "/api/accounts/123/quotes"</code></p><p><strong>Final API endpoint called</strong>: <code>GET /api/accounts/123/quotes</code></p><h3>Why use array format?</h3><p>This pattern provides several benefits:</p><ol><li><p><strong>Hierarchical cache invalidation</strong> - You can invalidate all quotes across accounts with <code>["/api/accounts"]</code>, or just one account''s quotes with <code>["/api/accounts", accountId]</code></p></li><li><p><strong>Dynamic URL building</strong> - The URL is constructed from the array elements, making it easy to add parameters</p></li><li><p><strong>Type safety</strong> - TanStack Query can track dependencies on <code>accountId</code> changes</p></li><li><p><strong>Readability</strong> - The cache key structure is clear: "accounts → specific account → quotes"</p></li></ol><p>This is why the development guidelines say "use an array for cache segments" - it makes cache management much easier!</p>',
  NULL,
  NULL,
  NULL,
  NULL,
  'f',
  'en',
  '52b008d4-ce35-4eeb-8555-614306f0e025',
  '2025-10-23 14:09:21.782489',
  'f',
  NULL,
  '7899a5b1-947a-426d-8c36-7562a2beea0e',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- IMPORT COMPLETE
-- ============================================================================
-- Total knowledge articles imported: 6
--
-- Verify the import:
-- SELECT COUNT(*) FROM knowledge_articles;
-- SELECT article_title, language_code, is_internal FROM knowledge_articles ORDER BY created_date;
-- ============================================================================
