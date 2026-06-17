# Utility Bills - Web Application

Next.js web frontend for the Utility Bills platform.

## Features

- **Authentication**: JWT-based login/registration with secure token storage
- **Dashboard**: 4-tab interface (Neplaćeni, Plaćeni, Ignorirani, Dobavljači)
- **Invoice Management**: View, edit, pay, ignore, and delete invoices
- **Gmail Integration**: Fetch invoices from Gmail with OAuth
- **Payment Barcode**: Generate payment barcodes with Model/Poziv na broj
- **Vendor Blocking**: Block/unblock vendors to auto-ignore future invoices
- **Days Back Selector**: Choose how many days of emails to fetch (1, 3, 7, 14, 30)

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- Axios (API client)
- js-cookie (token storage)

## Project Structure

```
app/
├── dashboard/
│   ├── invoices/
│   │   └── page.tsx          # Invoice list with 4 tabs
│   └── page.tsx              # Home dashboard menu
├── components/
│   └── PaymentBarcode.tsx    # Payment barcode display
├── lib/
│   ├── api.ts                # API client + auth helpers
│   └── barcode.ts            # Barcode generation utilities
├── login/
│   └── page.tsx              # Login page
├── register/
│   └── page.tsx              # Registration page
├── layout.tsx                # Root layout with providers
└── page.tsx                  # Landing page
```

## Environment Setup

```bash
cd web
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

## Development

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`

## Key Components

### Invoice List Page (`dashboard/invoices/page.tsx`)
- 4-tab navigation: Unpaid, Paid, Ignored, Vendors
- Gmail connection status
- Days back selector for fetching
- Payment barcode modal
- Edit invoice modal

### Payment Barcode (`components/PaymentBarcode.tsx`)
- Displays payment information (IBAN, Model, Poziv na broj, Amount)
- Generates visual barcode for bank scanning

### API Client (`lib/api.ts`)
- Axios instance with interceptors
- Automatic token refresh on 401
- Secure cookie storage

## Theme

Light theme with consistent colors:
- Background: `#EDE8DF`
- Surface: `#F5F0E8`
- Primary (maroon): `#8B1A1A`
- Text: `#2C1810`
- Muted: `#7A6255`
- Borders: `#C9BFB0`

## API Endpoints Used

- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `GET /invoices` - List invoices (paginated)
- `PATCH /invoices/:id` - Update invoice
- `PATCH /invoices/:id/pay` - Mark as paid
- `PATCH /invoices/:id/ignore` - Ignore invoice
- `PATCH /invoices/:id/unmark` - Unmark paid
- `DELETE /invoices/:id` - Soft delete
- `GET /vendors` - List blocked vendors
- `POST /vendors/:vendor/block` - Block vendor
- `DELETE /vendors/:vendor/unblock` - Unblock vendor
- `POST /gmail/fetch-invoices` - Fetch from Gmail
- `GET /gmail/connection-status` - Check Gmail status

## Build

```bash
npm run build
```

Output is in `.next/` directory.
