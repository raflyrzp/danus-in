# danus.in - Express API (MySQL)

Fitur:

- Autentikasi (register/login) dengan JWT
- Role-based: buyer vs seller
- CRUD Produk (danusan) oleh seller
- Browse & Search produk dengan filter dan pagination
- Pre-Order (PO) oleh buyer, validasi window PO (open/close)
- Update status order oleh seller (Menunggu Pembayaran | Diproses | Siap Diambil | Selesai | Dibatalkan)
- Notifikasi otomatis (order dibuat, status berubah)
- Dashboard:
  - Buyer: riwayat PO
  - Seller: produk sendiri + pesanan masuk

## Setup

1. Install dependencies

```bash
npm install
```

2. Copy env

```bash
cp .env.example .env
```

Edit nilai environment sesuai DB Anda.

3. Prisma migrate & generate

```bash
npx prisma migrate dev --name init
```

4. Run

```bash
npm run dev
```

## Database: MySQL

Connection string contoh:

```
DATABASE_URL="mysql://root:rootpassword@localhost:3306/danus_in"
```

Jalankan MySQL via Docker:

```bash
docker compose up -d
```

Akan menjalankan MySQL 8 dan membuat database `danus_in`.

## Endpoints (ringkas)

Auth:

- POST /auth/register {name, email, password, role: "buyer"|"seller"}
- POST /auth/login {email, password}
- GET /auth/me (requires auth)

Products:

- POST /products (seller only)
- GET /products?query=&seller_id=&open_now=true&min_price=&max_price=&page=1&page_size=10
- GET /products/:id
- PATCH /products/:id (seller owner only)
- DELETE /products/:id (seller owner only)

Orders:

- POST /orders {product_id, quantity} (buyer only)
- GET /orders/:id (buyer owner atau seller pemilik produk)
- PATCH /orders/:id/status {status} (seller owner only)
- GET /me/orders (buyer) => list orders sebagai buyer
- GET /me/sales-orders (seller) => list orders untuk produk seller

Notifications:

- GET /notifications (auth)
- PATCH /notifications/:id/read (auth)

Catatan:

- Status order valid: "Menunggu Pembayaran" | "Diproses" | "Siap Diambil" | "Selesai" | "Dibatalkan"
- Window PO valid saat `po_open_date <= now <= po_close_date` saat membuat order
- image_url disimpan sebagai string URL (upload static/CDN di luar scope)
