# ApriFlow

Cash flow pribadi lebih jelas, otomatis, dan terkontrol.

## Phase 1 — Fondasi

- Next.js 15 + TypeScript + Tailwind CSS
- Supabase Auth + PostgreSQL + RLS
- Dashboard ringkasan bulanan
- CRUD transaksi manual
- CRUD aset valid
- Format Rupiah (IDR)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Buat project di [supabase.com](https://supabase.com)
2. Jalankan migration di SQL Editor:

   ```
   supabase/migrations/001_phase1_schema.sql
   ```

3. Copy env:

   ```bash
   cp .env.local.example .env.local
   ```

4. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Jalankan dev server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Struktur

```
src/
├── actions/          # Server Actions (auth, transaksi, aset)
├── app/
│   ├── (auth)/       # Login & register
│   └── (app)/        # Halaman utama (protected)
├── components/       # UI & domain components
├── lib/
│   ├── db/           # Query helpers
│   ├── supabase/     # Client & middleware
│   └── utils/        # Currency, date, cn
└── types/            # TypeScript types
```

## Roadmap

- **Phase 2:** AI chat, duplicate detection, laporan AI
- **Phase 3:** Scan struk, screenshot, import mutasi bank
- **Phase 4:** Integrasi bank resmi, polish, PWA
