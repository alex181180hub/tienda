# Tienda POS System

A modern Point of Sale (POS) system built with Next.js and TiDB (MySQL compatible).

## Features
- **Sales Point**: Fast checking process with barcode support.
- **Inventory Management**: Track stock, costs, and pricing.
- **Reports**: View sales and purchase reports.
- **User Management**: Admin and staff roles.

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org) 14+
- **Database**: TiDB (MySQL)
- **Styling**: Tailwind CSS / CSS Modules
- **Deployment**: Vercel

## Getting Started

1. **Environment Setup**:
   Copy `.env.local.example` to `.env.local` and fill in your database credentials.

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## Database Reset
If you need to reset the database schema, run:
```bash
node scripts/reset-db.mjs
```

## Deployment
Push to the `master` branch to automatically deploy to Vercel.

