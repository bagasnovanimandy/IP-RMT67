# API Documentation - Galindo Car Rental

Base URL: `http://localhost:3000/api`

---

## 🔐 Authentication

Sebagian besar endpoint memerlukan authentication token. Token harus dikirim di header:
```
Authorization: Bearer <token>
```

Token didapatkan dari endpoint `/login` atau `/google-login`.

---

## 📋 Public Endpoints

### 1. Register User
**POST** `/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "phoneNumber": "081234567890"
}
```

**Note:** `phoneNumber` adalah optional field.

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "customer",
    "phoneNumber": "081234567890",
    "pictureUrl": null
  }
}
```

---

### 2. Login
**POST** `/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "customer",
    "pictureUrl": null
  }
}
```

---

### 3. Google Login
**POST** `/google-login`

**Request Body:**
```json
{
  "id_token": "google_oauth_token_here"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "name": "User Name",
    "role": "customer",
    "pictureUrl": "https://..."
  }
}
```

---

### 4. List Vehicles
**GET** `/vehicles`

**Query Parameters:**
- `q` (optional): Search query (name, brand, type, plateNumber)
- `city` (optional): Filter by city
- `min` (optional): Minimum price per day
- `max` (optional): Maximum price per day
- `sort` (optional): Sort field (default: `createdAt`)
- `order` (optional): Sort order `ASC` or `DESC` (default: `DESC`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 9)

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Toyota Avanza",
      "brand": "Toyota",
      "type": "MPV",
      "year": 2024,
      "seat": 7,
      "dailyPrice": 500000,
      "plateNumber": "B 1234 XYZ",
      "imgUrl": "https://...",
      "Branch": {
        "id": 1,
        "name": "Galindo Car Rental - Jakarta",
        "city": "Jakarta",
        "address": "Jl. Sudirman No. 1"
      }
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 9,
    "totalPages": 2
  }
}
```

---

### 5. Get Vehicle Detail
**GET** `/vehicles/:id`

**Response (200):**
```json
{
  "id": 1,
  "name": "Toyota Avanza",
  "brand": "Toyota",
  "type": "MPV",
  "year": 2024,
  "seat": 7,
  "dailyPrice": 500000,
  "plateNumber": "B 1234 XYZ",
  "imgUrl": "https://...",
  "Branch": {
    "id": 1,
    "name": "Galindo Car Rental - Jakarta",
    "city": "Jakarta",
    "address": "Jl. Sudirman No. 1"
  }
}
```

---

## 🤖 AI Endpoints

### 6. AI Ping (Test Connection)
**GET** `/ai/ping`

Test koneksi ke Gemini API.

**Response (200):**
```json
{
  "ok": true,
  "model": "gemini-2.5-flash",
  "text": "ok"
}
```

**Error Response (500):**
```json
{
  "ok": false,
  "source": "gemini",
  "message": "Error message from Gemini API"
}
```

atau

```json
{
  "ok": false,
  "source": "server",
  "message": "Internal server error"
}
```

---

### 7. AI Recommendation
**POST** `/ai/recommend`

**Headers:**
- `Authorization: Bearer <token>` (optional, untuk logged in users)

**Request Body:**
```json
{
  "prompt": "berangkat dari jakarta, keluarga 6 orang, 3 hari di Bandung, butuh bagasi besar, budget 400-600 ribu/hari"
}
```

**Response (200):**
```json
{
  "reason": "Analisis kebutuhan perjalanan berhasil dilakukan.",
  "filters": {
    "city": "Jakarta",
    "originCity": "Jakarta",
    "min": 400000,
    "max": 600000,
    "type": "MPV",
    "people": 6,
    "days": 3
  },
  "data": [
    {
      "id": 1,
      "name": "Toyota Avanza",
      "dailyPrice": 500000,
      "seat": 7,
      "Branch": {
        "city": "Jakarta"
      }
    }
  ],
  "meta": {
    "total": 3
  }
}
```

**Error Response (502):**
```json
{
  "message": "AI service unavailable",
  "detail": "Error message from Gemini API"
}
```

---

## 👤 Customer Endpoints

*Semua endpoint di bawah ini memerlukan authentication token.*

### 8. Create Booking
**POST** `/bookings`

**Request Body:**
```json
{
  "VehicleId": 1,
  "startDate": "2024-12-01",
  "endDate": "2024-12-03"
}
```

**Note:** 
- `VehicleId` harus menggunakan camelCase (huruf V dan I kapital)
- `totalPrice` tidak perlu dikirim, akan dihitung otomatis berdasarkan `dailyPrice` vehicle dan durasi hari
- Durasi minimal 1 hari

**Response (201):**
```json
{
  "message": "Booking created",
  "booking": {
    "id": 1,
    "VehicleId": 1,
    "UserId": 1,
    "startDate": "2024-12-01T00:00:00.000Z",
    "endDate": "2024-12-03T00:00:00.000Z",
    "totalPrice": 1500000,
    "status": "PENDING_PAYMENT"
  }
}
```

---

### 9. Get My Bookings
**GET** `/bookings/me`

**Response (200):**
```json
[
  {
    "id": 1,
    "startDate": "2024-12-01T00:00:00.000Z",
    "endDate": "2024-12-03T00:00:00.000Z",
    "totalPrice": 1500000,
    "status": "PENDING_PAYMENT",
    "Vehicle": {
      "name": "Toyota Avanza",
      "dailyPrice": 500000,
      "imgUrl": "https://..."
    }
  }
]
```

**Note:** Response adalah array langsung, bukan object dengan property `data`.

---

### 10. Cancel Booking
**PATCH** `/bookings/:id/cancel`

**Note:** Hanya booking dengan status `PENDING_PAYMENT` yang bisa dibatalkan.

**Response (200):**
```json
{
  "message": "Booking dibatalkan",
  "booking": {
    "id": 1,
    "status": "CANCELED"
  }
}
```

**Error Response (400):**
```json
{
  "message": "Hanya PENDING_PAYMENT yang bisa dibatalkan"
}
```

---

### 11. Delete Booking
**DELETE** `/bookings/:id`

**Note:** Hanya owner booking atau admin yang bisa menghapus booking.

**Response (200):**
```json
{
  "message": "Booking deleted"
}
```

---

## 👨‍💼 Admin Endpoints

*Semua endpoint di bawah ini memerlukan authentication token dan role `admin`.*

### 12. List All Bookings
**GET** `/admin/bookings`

**Query Parameters:**
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "data": [ ... ],
  "meta": { ... }
}
```

---

### 13. Update Booking Status
**PATCH** `/admin/bookings/:id/status`

**Request Body:**
```json
{
  "status": "CONFIRMED"
}
```

**Valid Status Values:**
- `PENDING`
- `CONFIRMED`
- `COMPLETED`
- `REJECTED`
- `CANCELED`

**Response (200):**
```json
{
  "message": "Status updated",
  "booking": {
    "id": 1,
    "status": "CONFIRMED",
    ...
  }
}
```

**Error Response (400):**
```json
{
  "message": "Invalid status"
}
```

---

### 14. Delete Booking (Admin)
**DELETE** `/admin/bookings/:id`

**Response (200):**
```json
{
  "message": "Booking deleted"
}
```

---

### 15. List Vehicles (Admin)
**GET** `/admin/vehicles`

**Response (200):**
```json
{
  "data": [ ... ],
  "meta": { ... }
}
```

---

### 16. Create Vehicle
**POST** `/admin/vehicles`

**Request Body:**
```json
{
  "name": "Toyota Avanza",
  "brand": "Toyota",
  "type": "MPV",
  "year": 2024,
  "seat": 7,
  "dailyPrice": 500000,
  "plateNumber": "B 1234 XYZ",
  "BranchId": 1
}
```

**Response (201):**
```json
{
  "message": "Vehicle created",
  "vehicle": {
    "id": 1,
    "name": "Toyota Avanza",
    "brand": "Toyota",
    "type": "MPV",
    "year": 2024,
    "seat": 7,
    "dailyPrice": 500000,
    "plateNumber": "B 1234 XYZ",
    "BranchId": 1
  }
}
```

---

### 17. Update Vehicle
**PUT** `/admin/vehicles/:id`

**Request Body:** (same as create)

**Response (200):**
```json
{
  "message": "Vehicle updated",
  "vehicle": {
    "id": 1,
    "name": "Toyota Avanza Updated",
    ...
  }
}
```

---

### 18. Delete Vehicle
**DELETE** `/admin/vehicles/:id`

**Response (200):**
```json
{
  "message": "Vehicle deleted"
}
```

---

### 19. Upload Vehicle Image
**PATCH** `/admin/vehicles/:id/image`

**Content-Type:** `multipart/form-data`

**Request Body:**
- `image`: File (image)

**Response (200):**
```json
{
  "message": "Image uploaded",
  "imgUrl": "https://res.cloudinary.com/.../image.jpg",
  "publicId": "vehicle_1"
}
```

---

## 💳 Payment Endpoints

*Semua endpoint di bawah ini memerlukan authentication token (kecuali webhook).*

### 20. Create Payment Checkout
**POST** `/payments/midtrans/checkout`

**Request Body:**
```json
{
  "bookingId": 1
}
```

**Note:** 
- Hanya booking dengan status `PENDING_PAYMENT` yang bisa di-checkout
- Booking harus milik user yang sedang login

**Response (200):**
```json
{
  "message": "Payment transaction created",
  "snapToken": "abc123...",
  "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/abc123...",
  "payment": {
    "id": 1,
    "orderId": "ORDER-123",
    "status": "pending"
  }
}
```

**Error Response (400):**
```json
{
  "message": "Cannot checkout booking with status: CONFIRMED"
}
```

---

### 21. Get Payment Status
**GET** `/payments/:bookingId`

**Note:** 
- Customer hanya bisa melihat payment untuk booking mereka sendiri
- Admin dapat melihat semua payment

**Response (200):**
```json
{
  "payment": {
    "id": 1,
    "orderId": "ORDER-123",
    "transactionStatus": "settlement",
    "fraudStatus": "accept",
    "paymentType": "credit_card",
    "grossAmount": 1500000,
    "paidAt": "2024-12-01T10:00:00Z",
    "createdAt": "2024-12-01T09:00:00Z"
  },
  "booking": {
    "id": 1,
    "status": "CONFIRMED",
    "totalPrice": 1500000
  }
}
```

**Error Response (404):**
```json
{
  "message": "Payment not found for this booking",
  "booking": {
    "id": 1,
    "status": "PENDING_PAYMENT",
    "totalPrice": 1500000
  }
}
```

---

### 22. Midtrans Webhook (Notification)
**POST** `/payments/midtrans/notification`

**Note:** 
- Endpoint ini tidak memerlukan authentication (dipanggil oleh Midtrans)
- Harus ditempatkan sebelum middleware authentication di routes

**Request Body:** (dikirim oleh Midtrans)
```json
{
  "transaction_status": "settlement",
  "order_id": "ORDER-123",
  "fraud_status": "accept",
  "payment_type": "credit_card",
  "gross_amount": "1500000",
  ...
}
```

**Response (200):**
```json
{
  "message": "Notification processed",
  "orderId": "ORDER-123",
  "transactionStatus": "settlement",
  "bookingStatus": "CONFIRMED"
}
```

**Error Response (404):**
```json
{
  "message": "Payment not found"
}
```

---

## 🔧 Health Check

### 23. Health Check
**GET** `/health`

**Response (200):**
```json
{
  "status": "ok",
  "service": "galindo-car-rental"
}
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## 📝 Notes

- Semua tanggal menggunakan format ISO 8601: `YYYY-MM-DD` atau `YYYY-MM-DDTHH:mm:ss.sssZ`
- Harga dalam Rupiah (IDR)
- **Status Booking:**
  - `PENDING_PAYMENT` - Status default saat booking dibuat, menunggu pembayaran
  - `PENDING` - Menunggu konfirmasi admin
  - `CONFIRMED` - Booking dikonfirmasi admin
  - `COMPLETED` - Booking selesai
  - `REJECTED` - Booking ditolak admin
  - `CANCELED` - Booking dibatalkan (hanya bisa dari `PENDING_PAYMENT`)
- **Role User:** `customer`, `admin`
- Field `VehicleId` menggunakan camelCase (huruf V dan I kapital)
- Field `totalPrice` dihitung otomatis: `dailyPrice × jumlah hari`
- Hanya booking dengan status `PENDING_PAYMENT` yang bisa dibatalkan oleh customer
- Payment checkout hanya bisa dilakukan untuk booking dengan status `PENDING_PAYMENT`

