<h1 align="center">acephalusCMS</h1>

<p align="center">
  <strong>A modern, headless Content Management System built with Laravel 12 and MongoDB</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#requirements">Requirements</a> •
  <a href="#installation">Installation</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#api-documentation">API</a> •
  <a href="#architecture">Architecture</a>
</p>

---

## ✨ Features

### Core Features

- **Headless CMS Architecture** - RESTful API for content delivery to any frontend
- **MongoDB Backend** - Flexible document storage for dynamic content schemas
- **Block-Based Editor** - Modern content editing with customizable element types
- **Version Control** - Full content versioning with diff comparison and restore
- **Media Management** - GridFS-based media storage with folders and metadata
- **Multi-Edition Support** - Serve different content variants to different audiences
- **Resource Locking** - Prevent concurrent editing conflicts on Collections, Contents, and Elements

### Content Management

- **Collections** - Define custom content types with flexible schemas
- **Dynamic Schemas** - JSON-based schema definitions for meta fields
- **Content Status Workflow** - Draft, Published, and Archived states
- **Content Duplication** - Clone existing contents with all elements
- **Element Types** - Support for Text, Media, HTML, SVG, KaTeX, JSON, XML, References, and Wrappers
- **Custom Elements** - JSON-defined custom elements with configurable fields
- **Wrapper Elements** - Nestable containers with semantic purposes (Infobox, Quote, Accordion, etc.)
- **Internal References** - Link to other content, collections, filter views, or specific elements

### Advanced Filtering

- **Filter Views** - Save and reuse complex content filters
- **Filter Builder** - Visual condition builder with AND/OR groups
- **Rich Operators** - 17+ filter operators (equals, contains, regex, comparisons, etc.)
- **Custom Sorting** - Multi-field sort configuration
- **Raw MongoDB Queries** - Advanced users can write raw MongoDB queries

### Media Library

- **GridFS Storage** - MongoDB GridFS for efficient binary storage
- **Folder Organization** - Hierarchical folder structure with collection-specific folders
- **Custom Meta Fields** - Configurable metadata fields (Alt, Caption, Copyright, Photographer, etc.)
- **Media Types** - Support for Images, Videos, Audio, and Documents
- **Thumbnail Generation** - Automatic thumbnail creation with configurable sizes
- **Focus Area Selector** - Define image crop focus points
- **Document Preview** - In-browser preview for PDF, DOCX, PPTX, and XLSX files

### User & Permission System

- **Role-Based Access Control** - Flexible permission system with Spatie Laravel Permission
- **Predefined Roles** - Super Admin, Admin, Editor, Author, and Viewer
- **Granular Permissions** - Fine-grained permissions for all CMS operations
- **API Scopes** - Separate permissions for API access (read/write/delete)
- **Lock Permissions** - Control who can lock/unlock resources

### Administration

- **Modern Admin Panel** - React 19 UI with Inertia.js
- **Tailwind CSS 4** - Beautiful, responsive design with dark mode support
- **Internationalization** - Multi-language support (English, German)
- **Pinned Navigation** - Customize sidebar with shortcuts to collections with filters
- **Settings Management** - Configure Roles, Editions, Wrapper Purposes, Media Meta Fields, and more
- **User Management** - Create and manage CMS users

### Content Editing

- **TipTap Rich Text Editor** - WYSIWYG editing with tables, images, links, and code blocks
- **CodeMirror Integration** - Syntax highlighting for HTML, JSON, XML, CSS, JavaScript, PHP
- **KaTeX Support** - Beautiful mathematical formula rendering
- **Media Picker** - Inline media selection and upload
- **Reference Picker** - Browse and link to related content

### API

- **RESTful API** - Full CRUD operations for all content
- **OAuth2 Authentication** - Laravel Passport for API authentication
- **OpenAPI Documentation** - Swagger UI for API exploration
- **Content Versioning API** - Compare and restore content versions
- **Permission-Based Scopes** - API endpoints respect user permissions

---

## 📋 Requirements

- **PHP** >= 8.2
- **MongoDB** >= 6.0
- **Node.js** >= 18
- **Composer** >= 2.0

### PHP Extensions

- `mongodb` (PHP MongoDB driver)
- `mysql/sqlite` (for user authentication storage)
- `gd` or `imagick` (for thumbnail generation)
- Standard Laravel extensions

---

## 🚀 Installation

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/REIZFLUT/acephalus
   cd acephalus
   ```

2. **Run the setup script**
   ```bash
   composer setup
   ```
   This will install dependencies, create `.env`, generate app key, run migrations, and build assets.

3. **Configure MongoDB** (see [Configuration](#configuration))

4. **Enable setup mode** in your `.env` file:
   ```env
   SETUP_ENABLED=true
   ```

5. **Open in browser** and complete the setup wizard
   ```
   https://acephalus.test/setup
   ```
   The setup wizard will guide you through:
   - Creating your super admin account
   - Seeding initial system data

6. **Disable setup mode** after completing the setup:
   ```env
   SETUP_ENABLED=false
   ```

> ⚠️ **Security Note**: Always set `SETUP_ENABLED=false` after completing the initial setup to prevent unauthorized access to the setup wizard.

### Manual Installation

```bash
# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Install Node dependencies
npm install

# Run database migrations
php artisan migrate

# Build frontend assets
npm run build

# Seed initial data (after configuring MongoDB)
php artisan db:seed --class=SystemSetupSeeder

# Create your admin user via setup wizard or tinker
```

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

#### Application Settings

```env
APP_NAME="acephalus CMS"
APP_ENV=local
APP_KEY=                    # Generated with php artisan key:generate
APP_DEBUG=true
APP_URL=http://acephalus.test
SETUP_ENABLED=false         # Set to true only during initial setup
```

> **Security**: The `SETUP_ENABLED` variable controls access to the `/setup` wizard. Set it to `true` only during initial installation, then set it back to `false` after creating your admin account.

#### Database Configuration

**SQLite (User Authentication)**
```env
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database/database.sqlite
```

**MongoDB (Content Storage)**
```env
MONGO_DSN=mongodb://localhost:27017
MONGO_DATABASE=acephalus
```

> **Important**: MongoDB stores all CMS content (Collections, Contents, Media, etc.), while SQLite stores user accounts, roles, and permissions.

#### MongoDB Connection Options

For MongoDB Atlas or authenticated connections:
```env
MONGO_DSN=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGO_DATABASE=acephalus_production
```

For local MongoDB with authentication:
```env
MONGO_DSN=mongodb://username:password@localhost:27017/acephalus?authSource=admin
MONGO_DATABASE=acephalus
```

#### Session & Cache

```env
SESSION_DRIVER=database
CACHE_STORE=file
QUEUE_CONNECTION=database
```

#### Laravel Passport (API Authentication)

Passport keys are generated automatically during setup. For manual generation:
```bash
php artisan passport:keys
```

---

## 📖 API Documentation

acephalus provides a comprehensive RESTful API for headless content delivery.

### Authentication

All API endpoints (except login/register) require Bearer token authentication:

```bash
# Login to get access token
curl -X POST https://acephalus.test/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token in subsequent requests
curl -X GET https://acephalus.test/api/v1/collections \
  -H "Authorization: Bearer {your_access_token}"
```

### API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/v1/auth/login` | POST | Authenticate user |
| `/api/v1/auth/register` | POST | Register new user |
| `/api/v1/auth/logout` | POST | Revoke token |
| `/api/v1/auth/user` | GET | Get authenticated user |
| `/api/v1/collections` | GET, POST | List/Create collections |
| `/api/v1/collections/{slug}` | GET, PUT, DELETE | Manage collection |
| `/api/v1/collections/{slug}/lock` | POST, DELETE | Lock/Unlock collection |
| `/api/v1/collections/{slug}/contents` | GET, POST | List/Create contents |
| `/api/v1/collections/{slug}/filter-views` | GET | Get collection filter views |
| `/api/v1/collections/{slug}/filter-fields` | GET | Get available filter fields |
| `/api/v1/filter-views/operators` | GET | Get available filter operators |
| `/api/v1/filter-views/{id}` | GET | Get specific filter view |
| `/api/v1/contents/{id}` | GET, PUT, DELETE | Manage content |
| `/api/v1/contents/{id}/publish` | POST | Publish content |
| `/api/v1/contents/{id}/unpublish` | POST | Unpublish content |
| `/api/v1/contents/{id}/archive` | POST | Archive content |
| `/api/v1/contents/{id}/lock` | POST, DELETE | Lock/Unlock content |
| `/api/v1/contents/{id}/versions` | GET | List versions |
| `/api/v1/contents/{id}/versions/{version}` | GET | Get specific version |
| `/api/v1/contents/{id}/versions/{from}/compare/{to}` | GET | Compare versions |
| `/api/v1/contents/{id}/versions/{version}/restore` | POST | Restore version |
| `/api/v1/contents/{id}/elements` | POST | Create element |
| `/api/v1/elements/{id}` | PUT, DELETE | Manage elements |
| `/api/v1/elements/{id}/move` | POST | Move element position |
| `/api/v1/elements/{id}/lock` | POST, DELETE | Lock/Unlock element |
| `/api/v1/media` | GET, POST | List/Upload media |
| `/api/v1/media/{id}` | GET, DELETE | Manage media |
| `/api/v1/users` | GET, POST | List/Create users |
| `/api/v1/users/{id}` | GET, PUT, DELETE | Manage users |

### Swagger UI

Interactive API documentation is available at:
```
https://acephalus.test/swagger
```

---

## 🏗️ Architecture

### Database Architecture

acephalus uses a **hybrid database approach**:

- **SQLite** - User management, roles, permissions, OAuth tokens
- **MongoDB** - All CMS content (collections, contents, media, etc.)

This separation provides:
- Reliable relational storage for authentication
- Flexible document storage for dynamic content schemas

### MongoDB Collections

| Collection | Description |
|------------|-------------|
| `collections` | Content type definitions with schemas |
| `contents` | Actual content documents |
| `content_versions` | Version history for contents |
| `elements` | Content block elements |
| `media` | Media file metadata |
| `media_folders` | Folder hierarchy for media |
| `media_meta_fields` | Custom metadata field definitions |
| `editions` | Edition configurations |
| `wrapper_purposes` | Semantic wrapper types |
| `filter_views` | Saved filter configurations |
| `pinned_navigation_items` | Sidebar navigation shortcuts |
| `fs.files` / `fs.chunks` | GridFS binary storage |

### Element Types

Built-in element types:

| Type | Description | Data Fields |
|------|-------------|-------------|
| `text` | Rich text content | `content`, `format` |
| `media` | Images, videos, audio | `file_id`, `media_type`, `alt`, `caption` |
| `html` | Custom HTML | `content` |
| `svg` | SVG illustrations | `content`, `viewBox`, `title` |
| `katex` | Mathematical formulas | `formula`, `display_mode` |
| `json` | Structured data | `data` |
| `xml` | XML content | `content`, `schema` |
| `wrapper` | Container element | `children`, `layout`, `style`, `purpose` |
| `reference` | Internal link | `reference_type`, `collection_id`, `content_id`, `element_id`, `filter_view_id` |

### Custom Elements

Define custom elements in `resources/custom-elements/*.json`:

```json
{
    "type": "custom_info_box",
    "label": "Infobox",
    "description": "Colored box for hints, warnings, or tips",
    "icon": "info",
    "category": "content",
    "fields": [
        {
            "name": "type",
            "label": "Type",
            "inputType": "select",
            "options": [
                { "value": "info", "label": "Information" },
                { "value": "warning", "label": "Warning" }
            ]
        },
        {
            "name": "content",
            "label": "Content",
            "inputType": "editor",
            "required": true
        }
    ]
}
```

Included custom elements:
- **Infobox** - Colored boxes for hints, warnings, tips
- **Quote** - Styled quotations with attribution
- **Accordion** - Collapsible content sections
- **Call to Action** - Promotional blocks with buttons
- **Contact Data** - Structured contact information
- **Related Content** - Links to related articles
- **Embed** - External content embeds

### Filter Views

Filter views allow saving complex content filters with:

- **Condition Groups** - AND/OR logic for combining conditions
- **17+ Operators** - equals, not_equals, contains, starts_with, ends_with, in, not_in, gt, gte, lt, lte, exists, not_exists, regex, is_empty, is_not_empty
- **Field Support** - Filter by meta fields, title, status, dates, and more
- **Custom Sorting** - Multi-field ascending/descending sort
- **Raw Queries** - Advanced MongoDB query syntax for power users

---

## 👥 Roles & Permissions

### Default Roles

| Role | Description |
|------|-------------|
| `super-admin` | Full access, bypasses all permission checks |
| `admin` | Full access to all features |
| `editor` | Create, edit, publish content; manage media |
| `author` | Create and edit content; upload media |
| `viewer` | Read-only access |

### Permission Categories

- **Contents** - `view`, `create`, `update`, `delete`, `publish`, `lock`, `unlock`
- **Collections** - `view`, `create`, `update`, `delete`, `schema.view`, `schema.update`, `lock`, `unlock`
- **Elements** - `lock`, `unlock`
- **Media** - `view`, `create`, `update`, `delete`
- **Users** - `view`, `create`, `update`, `delete`
- **Roles** - `view`, `create`, `update`, `delete`
- **Settings** - `view`
- **Editions** - `view`, `create`, `update`, `delete`
- **Wrapper Purposes** - `view`, `create`, `update`, `delete`
- **Media Meta Fields** - `view`, `create`, `update`, `delete`
- **Pinned Navigation** - `view`, `create`, `update`, `delete`

---

## 🌐 Internationalization

acephalus supports multiple languages in the admin panel:

- **English** (default)
- **German**

Language files are located in `lang/` directory. Users can switch languages via their profile settings.

### Adding a New Language

1. Create a new JSON file in `lang/` (e.g., `lang/fr.json`)
2. Copy the structure from `lang/en.json`
3. Translate all keys to the target language

---

## 🛠️ Development

### Running Locally

```bash
# Start development server with hot reload
composer run dev

# Or run services separately
php artisan serve
npm run dev
php artisan queue:listen
```

### Testing

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/Api/ContentTest.php

# Run with filter
php artisan test --filter=testName

# Run with coverage
php artisan test --coverage
```

### Code Style

```bash
# Fix code style with Laravel Pint
vendor/bin/pint

# Check only changed files
vendor/bin/pint --dirty
```

### Artisan Commands

```bash
# Refresh custom elements cache
php artisan custom-elements:refresh

# Generate media thumbnails
php artisan media:thumbnails

# Migrate MongoDB arrays to native format
php artisan mongo:migrate-arrays
```

---

## 📂 Project Structure

```
acephalus/
├── app/
│   ├── Console/Commands/    # Artisan commands
│   ├── Enums/               # PHP Enums (ContentStatus, ElementType, MediaType, FilterOperator)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/V1/      # API Controllers
│   │   │   └── Web/         # Admin Panel Controllers
│   │   ├── Middleware/      # Custom Middleware
│   │   ├── Requests/        # Form Request Validation
│   │   └── Resources/       # API Resources
│   ├── Models/
│   │   └── Mongodb/         # MongoDB Eloquent Models
│   ├── Policies/            # Authorization Policies
│   └── Services/            # Business Logic Services
├── database/
│   ├── migrations/          # SQLite Migrations
│   └── seeders/             # Database Seeders
├── lang/                    # Translation files (en.json, de.json)
├── resources/
│   ├── custom-elements/     # Custom Element JSON Definitions
│   ├── js/
│   │   ├── components/      # React Components
│   │   │   ├── data-table/  # DataTable components
│   │   │   ├── editor/      # Block editor components
│   │   │   ├── filters/     # Filter builder components
│   │   │   ├── media/       # Media management components
│   │   │   ├── schema/      # Schema editor components
│   │   │   ├── ui/          # UI components (shadcn/ui)
│   │   │   └── versions/    # Version comparison components
│   │   ├── hooks/           # React hooks
│   │   ├── pages/           # Inertia Page Components
│   │   └── types/           # TypeScript type definitions
│   ├── swagger/             # OpenAPI Specification
│   └── views/               # Blade Templates
├── routes/
│   ├── api.php              # API Routes
│   ├── console.php          # Console Routes
│   └── web.php              # Web Routes
└── tests/
    ├── Feature/             # Feature Tests
    │   ├── Api/V1/          # API Tests
    │   └── Web/             # Web Tests
    └── Unit/                # Unit Tests
```

---

## 🔧 Tech Stack

### Backend
- **Laravel 12** - PHP Framework
- **MongoDB** (via laravel-mongodb) - Document Database
- **Laravel Passport** - OAuth2 Authentication
- **Spatie Laravel Permission** - Role & Permission Management
- **Intervention Image** - Image Processing

### Frontend
- **React 19** - UI Library
- **Inertia.js** - SPA without an API
- **TypeScript** - Type Safety
- **Tailwind CSS 4** - Utility-first CSS
- **TipTap** - Rich Text Editor
- **CodeMirror** - Code Editor
- **Radix UI** - Accessible Components
- **TanStack Table** - Data Tables
- **React Hook Form** - Form Handling
- **Zod** - Schema Validation

---

## 🔒 Security

- All API endpoints require authentication
- Passwords are hashed using bcrypt
- CSRF protection on all web forms
- Rate limiting on authentication endpoints
- OAuth2 tokens with configurable expiration
- Resource locking prevents concurrent editing conflicts
- Permission-based access control at route and resource level

---

## 📜 License

acephalus CMS is open-sourced software licensed under the [MIT license](LICENSE).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For questions and support, please open an issue on GitHub.
