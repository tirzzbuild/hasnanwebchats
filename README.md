# HasnanChat — Vercel starter

Starter ini berisi UI chat responsif dan API serverless dasar. UI bukan layanan chat produksi lengkap: untuk dipakai lintas perangkat, data harus disimpan di database bersama. API memakai Vercel KV/Redis, sehingga Anda harus menghubungkan KV dan mengatur variabel lingkungan sebelum fitur API dapat digunakan.

## Fitur yang sudah disiapkan
- `index.html` sebagai halaman utama.
- UI bergaya aplikasi pesan hijau, ikon SVG (tanpa emoji), navigasi Chat/Status/Panggilan.
- Form nomor telepon dengan pilihan negara dan kode panggilan.
- Penyimpanan preferensi sesi di browser agar tidak perlu login berulang di perangkat yang sama (bukan autentikasi aman).
- API dasar untuk menyimpan/membaca profil dan kontak melalui Vercel KV.
- Tidak ada chat/kontak palsu yang dimasukkan sebagai data.

## Deploy ke Vercel
1. Unggah folder ini ke repositori Git, lalu impor repositori di Vercel.
2. Buat/Hubungkan Vercel KV (atau Redis compatible) pada proyek.
3. Atur environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `APP_ORIGIN` = domain web Anda, misalnya `https://contoh.vercel.app`
4. Deploy. Untuk pengembangan lokal, jalankan `npm install`, `npx vercel dev`.

## Penting — keamanan dan batasan
- Tidak ada aplikasi yang bisa dijamin “100% aman/anti-error”. File ini adalah starter yang perlu diuji.
- Login nomor telepon pada UI belum memverifikasi kepemilikan nomor lewat OTP. Jangan gunakan sebagai login produksi sebelum menambahkan provider OTP dan sesi server-side.
- Jangan pernah menyimpan password, token rahasia, atau kredensial di HTML/frontend.
- KV menyimpan data bersama antarperangkat, tetapi API starter ini tidak boleh dianggap sebagai sistem kontak/chat privat: endpoint membutuhkan autentikasi dan aturan akses produksi sebelum dipakai publik.
- Fitur realtime, panggilan suara/video, upload media, status kedaluwarsa, grup/komunitas, blokir, enkripsi end-to-end, moderasi, dan AI belum diimplementasikan sebagai layanan produksi.
- Kode frontend yang dikirim ke browser selalu dapat dilihat pengguna. Minifikasi/obfuscation tidak membuatnya “tidak bisa diambil”; rahasia harus berada di backend.
