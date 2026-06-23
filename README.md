# Utility Bills - Web Application

Next.js web frontend for the Utility Bills platform.

## Features

- **Authentication**: Login/registration with httpOnly cookie tokens + silent refresh
- **Two-Factor Authentication**: TOTP 2FA setup, enable, disable
- **Password Reset**: Email-based forgot/reset password flow
- **Change Password**: In-settings password change
- **Dashboard**: 4-tab interface (Neplaćeni, Plaćeni, Ignorirani, Dobavljači)
- **Invoice Management**: View, edit, pay, unmark, ignore, unignore, soft-delete
- **Gmail Integration**: Connect Gmail via OAuth, fetch invoice emails
- **Payment Barcode**: Generate payment barcodes with Model/Poziv na broj
- **Vendor Blocking**: Block/unblock vendors to auto-ignore future invoices
- **Days Back Selector**: Choose how many days of emails to fetch (1, 3, 7, 14, 30)
- **Settings**: Manage Gmail connection, 2FA, password

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- TailwindCSS 4
- Axios (API client with auto token refresh)

## Architecture

The web app uses **Next.js API routes as a secure proxy** between the browser and backend:

```
Browser → Next.js /api/* routes → Backend :5001/api/*
```

Tokens are stored as **httpOnly cookies** — never accessible to JavaScript. The proxy layer handles cookie forwarding, token refresh on 401, and auth header injection.

## Project Structure

```
app/
├── api/
│   ├── auth/                  # Auth proxy routes (login, register, refresh, me, logout, 2fa, etc.)
│   └── gmail/                 # Gmail proxy routes
├── components/
│   └── PaymentBarcode.tsx     # Payment barcode display
├── lib/
│   ├── api-proxy.ts           # Shared proxy utilities (forwardRequest, copyCookies, etc.)
│   ├── api.ts                 # Axios client + interceptors + auth helpers
│   └── barcodes.ts            # Barcode generation utilities
├── dashboard/
│   ├── invoices/
│   │   └── page.tsx           # Invoice list with 4 tabs
│   └── page.tsx               # Home dashboard menu
├── login/
│   └── page.tsx               # Login page (with 2FA support)
├── register/
│   └── page.tsx               # Registration page
├── forgot-password/
│   └── page.tsx               # Request password reset email
├── reset-password/
│   └── page.tsx               # Reset password with token
├── change-password/
│   └── page.tsx               # Change password (authenticated)
├── 2fa-setup/
│   └── page.tsx               # 2FA setup (QR code + enable/disable)
├── settings/
│   └── page.tsx               # User settings
├── layout.tsx
└── page.tsx                   # Landing / redirect
```

## Environment Setup

Create `.env.local` in the `web/` directory:

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

### API Proxy (`app/api/`)
Next.js route handlers forward requests to the backend. They:
- Inject `Authorization` headers from httpOnly cookies
- Copy `Set-Cookie` headers back from backend responses
- Handle silent token refresh on 401 before retrying

### Invoice List Page (`dashboard/invoices/page.tsx`)
- 4-tab navigation: Unpaid, Paid, Ignored, Vendors
- Gmail connection status + connect button
- Days back selector for fetching
- Payment barcode modal
- Edit invoice modal

### Payment Barcode (`components/PaymentBarcode.tsx`)
- Displays payment information (IBAN, Model, Poziv na broj, Amount)
- Generates visual barcode for bank scanning

### API Client (`lib/api.ts`)
- Axios instance with `withCredentials: true`
- Automatic token refresh on 401 with race condition handling
- All auth helpers (login, register, logout, 2FA, password reset)

## Theme

Light theme with consistent colors:
- Background: `#EDE8DF`
- Surface: `#F5F0E8`
- Primary (maroon): `#8B1A1A`
- Text: `#2C1810`
- Muted: `#7A6255`
- Borders: `#C9BFB0`

## API Endpoints Used

**Auth:**
- `POST /api/auth/login` — Login (206 if 2FA required)
- `POST /api/auth/register` — Register
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Get current user (with silent refresh)
- `POST /api/auth/refresh` — Refresh tokens
- `POST /api/auth/change-password` — Change password
- `POST /api/auth/request-password-reset` — Request reset email
- `POST /api/auth/reset-password` — Reset password with token
- `POST /api/auth/2fa/setup` — Setup 2FA
- `POST /api/auth/2fa/enable` — Enable 2FA
- `POST /api/auth/2fa/disable` — Disable 2FA

**Invoices:**
- `GET /api/invoices` — List invoices (paginated)
- `PATCH /api/invoices/:id` — Update invoice
- `PATCH /api/invoices/:id/pay` — Mark as paid
- `PATCH /api/invoices/:id/unmark` — Unmark paid
- `PATCH /api/invoices/:id/ignore` — Ignore invoice
- `DELETE /api/invoices/:id` — Soft delete

**Vendors:**
- `GET /api/vendors` — List blocked vendors
- `POST /api/vendors/:vendor/block` — Block vendor
- `DELETE /api/vendors/:vendor/unblock` — Unblock vendor

**Gmail:**
- `POST /api/gmail/fetch-invoices` — Fetch from Gmail
- `GET /api/gmail/connection-status` — Check Gmail status
- `DELETE /api/gmail/disconnect` — Disconnect Gmail

## Build

```bash
npm run build
npm start
```

Output is in `.next/` directory.
