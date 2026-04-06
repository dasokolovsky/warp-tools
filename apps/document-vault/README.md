# 📄 Document Vault

> Free, open-source freight document management. Upload, organize, and track every BOL, POD, rate con, and insurance cert — no more email digging.

## Features

- ✅ Drag-and-drop file upload (single + batch)
- ✅ 10 freight-specific document types (BOL, POD, Rate Con, Invoice, Insurance Cert, etc.)
- ✅ Grid and list view toggle
- ✅ Missing document tracker (know what's missing per load)
- ✅ Expiring document alerts (insurance certs, authority letters)
- ✅ Per-load document checklist with completeness tracking
- ✅ Carrier documents view (docs grouped by type with expiry tracking)
- ✅ Full-text search across all document metadata
- ✅ Batch tagging for bulk organization
- ✅ PDF and image preview
- ✅ Dark theme, mobile responsive
- 🔲 PDF thumbnail generation
- 🔲 OCR text extraction
- 🔲 Integration with Carrier Management & Invoice Tracker

## Screenshots

![Dashboard](screenshots/docvault-dashboard.png)
![Documents Grid](screenshots/docvault-documents.png)
![Document Detail](screenshots/docvault-detail.png)
![Load Documents](screenshots/docvault-loads.png)
![Settings](screenshots/docvault-settings.png)
![Mobile View](screenshots/docvault-dashboard-mobile.png)

## Quick Start

```bash
git clone https://github.com/wearewarp/warp-tools
cd warp-tools/apps/document-vault
npm install
npm run db:migrate && npm run db:seed
npm run dev
# → http://localhost:3004
```

## Tech Stack

Next.js 16, Drizzle ORM + SQLite, Tailwind CSS, Sharp (image processing), Zod, TypeScript

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/documents` | List documents (supports `?search=`, `?docType=`, `?loadRef=`, `?page=`, `?limit=`) |
| `POST` | `/api/documents` | Upload a new document (multipart/form-data) |
| `GET` | `/api/documents/:id` | Get document metadata by ID |
| `PATCH` | `/api/documents/:id` | Update document metadata (tags, notes, expiryDate, etc.) |
| `DELETE` | `/api/documents/:id` | Delete a document and its file |
| `GET` | `/api/documents/:id/file` | Serve the raw file (PDF, image, etc.) |
| `GET` | `/api/documents/:id/thumbnail` | Serve thumbnail (generated for images) |
| `POST` | `/api/documents/batch-tag` | Bulk-apply tags to multiple documents |
| `GET` | `/api/documents/expiring` | List documents with expiry dates within 30 days |
| `GET` | `/api/documents/missing` | List unfulfilled document requirements per load |
| `GET` | `/api/dashboard/summary` | Aggregated stats (counts by type, expiring soon, missing) |

## Data Model

### `documents`

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | UUID |
| `filename` | text | Stored filename on disk |
| `original_name` | text | Original upload filename |
| `mime_type` | text | MIME type (e.g. `application/pdf`) |
| `file_size` | integer | Size in bytes |
| `file_path` | text | Absolute path on disk |
| `thumbnail_path` | text | Path to generated thumbnail (nullable) |
| `doc_type` | enum | One of: `bol`, `pod`, `rate_confirmation`, `invoice`, `insurance_cert`, `authority_letter`, `customs_declaration`, `weight_certificate`, `lumper_receipt`, `other` |
| `load_ref` | text | Load/shipment reference number (nullable) |
| `carrier_id` | text | Linked carrier ID (nullable) |
| `carrier_name` | text | Carrier name (nullable) |
| `customer_id` | text | Customer ID (nullable) |
| `customer_name` | text | Customer name (nullable) |
| `document_date` | text | Date on the document |
| `expiry_date` | text | Expiry date (for insurance certs, authority letters) |
| `notes` | text | Free-form notes |
| `tags` | text | JSON array of tag strings |
| `uploaded_by` | text | Uploader name or ID |
| `status` | enum | `active` or `archived` |
| `created_at` | text | ISO timestamp |
| `updated_at` | text | ISO timestamp |

### `document_requirements`

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | UUID |
| `load_ref` | text | Load reference this requirement belongs to |
| `load_status` | enum | `booked`, `in_transit`, `delivered`, `invoiced`, `closed` |
| `required_type` | enum | Same doc_type enum as `documents` |
| `fulfilled` | boolean | Whether a matching document has been uploaded |
| `document_id` | text (FK) | References `documents.id` (nullable) |
| `created_at` | text | ISO timestamp |

## Ideas & Next Steps

### 🟢 Easy

- Add document download count tracking
- Add "copy link" button for sharing document URLs
- Add tag autocomplete from previously used tags
- CSV export of document metadata

### 🟡 Medium

- PDF thumbnail generation (render first page)
- OCR text extraction with Tesseract.js
- Document version history (re-upload same doc)
- Email documents as attachments
- ~~Carrier-specific document portal view~~ ✅ Done

### 🔴 Hard

- AI-powered document classification (auto-detect type from content)
- Integration with Carrier Management (pull carrier list, link insurance)
- Integration with Invoice Tracker (auto-create requirements from loads)
- Cloud storage backend (S3/R2) for hosted version
- Document template generation (generate rate cons, BOLs)

## License

MIT
