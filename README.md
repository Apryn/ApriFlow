# 💸 ApriFlow — Asisten Cash Flow Pribadi Pintar & Terkontrol

> Cash flow pribadi lebih jelas, otomatis, aman, dan terkontrol. Dilengkapi fitur pendeteksi AI, manajemen aset valid, dan perlindungan privasi instan.

---

## ✨ Fitur Unggulan

### 🔒 1. Privacy Visibility Toggle (Sembunyikan Saldo & Aset)
Lindungi privasi finansial Anda dari pandangan orang lain dengan satu ketukan.
*   **Sekali Klik:** Sembunyikan total aset, pemasukan, pengeluaran, nominal transaksi, sisa bersih, anggaran bulanan, dan progres tabungan.
*   **Efek Neo-Brutalist:** Tombol mata interaktif (`Eye` / `EyeOff`) yang didesain secara premium dengan *micro-interactions* responsif.
*   **Persisten:** Pilihan visibilitas Anda disimpan di `localStorage` sehingga tidak akan ter-reset saat halaman di-refresh.

### 🤖 2. Asisten AI Pintar (Tanya AI & Catat Cepat)
Catat transaksi Anda dengan mengetik kalimat alami seperti di aplikasi chat.
*   *e.g. "gajian 5 juta masuk rekening bank"* atau *"beli kopi 25rb tunai"* – AI akan otomatis mendeteksi kategori, nominal, metode pembayaran, dan tipe transaksi Anda.

### 📊 3. Ringkasan Dashboard & Neo-Brutalist UI
Tampilan visual menarik bertema dark-mode premium yang responsif di berbagai perangkat.
*   **Status Cash Flow:** Indikator otomatis (*Aman*, *Waspada*, atau *Bocor*) berdasarkan rasio pengeluaran.
*   **Limit Anggaran Bulanan:** Batas pengeluaran per kategori yang dilengkapi bar progres interaktif.
*   **Target Keuangan (Goals):** Lacak progres tabungan impian Anda lengkap dengan persentase pencapaian.

### 📱 4. Multi-Platform Support (Web, PWA, Android, & iOS)
*   **PWA Standalone Mode:** Jalankan langsung dari Home Screen iPhone/Android secara layar penuh (*full screen*) tanpa bar navigasi browser Safari/Chrome.
*   **Capacitor Native Mobile:** Kode dasar yang sama dapat di-build langsung menjadi aplikasi mobile native untuk **Android** dan **iOS**.

---

## 🛠️ Teknologi yang Digunakan

*   **Frontend & Core:** [Next.js 15](https://nextjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Tailwind CSS v4](https://tailwindcss.com/)
*   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL + RLS Security Policies + Supabase Auth)
*   **Mobile Wrapper:** [Capacitor CLI v8](https://capacitorjs.com/) (Android & iOS)

---

## 🚀 Setup & Instalasi Lokal

### 1. Kloning & Instal Dependensi
```bash
git clone https://github.com/Apryn/ApriFlow.git
cd ApriFlow
npm install
```

### 2. Konfigurasi Supabase
1. Buat proyek baru di [supabase.com](https://supabase.com).
2. Jalankan berkas migrasi database di SQL Editor Supabase Anda menggunakan isi dari file:
   ```bash
   supabase/migrations/001_phase1_schema.sql
   ```
3. Buat file `.env.local` dari template:
   ```bash
   cp .env.local.example .env.local
   ```
4. Masukkan URL dan Kunci Anonim Supabase Anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=kunci-anon-anda
   ```

### 3. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📱 Panduan Mobile & PWA

### Cara Menjadikan Aplikasi Layar Penuh di iOS (Safari PWA)
1. Buka link web Anda (misal `apriflow.vercel.app`) di **Safari** pada iPhone.
2. Klik tombol **Share** (kotak dengan panah ke atas).
3. Pilih **"Add to Home Screen"** (Tambahkan ke Layar Utama).
4. Buka aplikasi melalui ikon baru di Home Screen. Aplikasi akan otomatis berjalan dalam mode *standalone* (layar penuh tanpa navigasi Safari).

### Sinkronisasi ke Aplikasi Android & iOS (Capacitor)
Jika ingin melakukan build mobile native:
1. Jalankan Next.js static build:
   ```bash
   npm run build
   ```
2. Singkronkan file build statis ke folder native Android/iOS:
   ```bash
   npx cap sync
   ```
3. Buka proyek di Android Studio atau Xcode:
   ```bash
   npx cap open android   # Untuk Android Studio
   npx cap open ios       # Untuk Xcode (Membutuhkan macOS)
   ```

---

## 🗺️ Roadmap Pengembangan

*   [x] **Phase 1 (Fondasi):** Auth, PostgreSQL, RLS, Dashboard, CRUD Transaksi & Aset, Privacy Toggle.
*   [ ] **Phase 2 (Peningkatan AI):** Tanya AI Chat penuh, auto-duplicate detection, analitik laporan AI mingguan.
*   [ ] **Phase 3 (Ekspansi input):** Fitur OCR scan struk fisik, import bukti transaksi via screenshot, parser mutasi bank otomatis.
*   [ ] **Phase 4 (Rilis & Integrasi):** Rilis App Store & Play Store, integrasi akun bank resmi.
