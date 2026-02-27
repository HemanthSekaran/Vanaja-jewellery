# API Documentation

Complete API documentation for the Jewelry E-commerce Backend.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained by completing the **OTP verification** step.

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]
}
```

---

## Authentication Endpoints

> **Authentication is OTP-based (no passwords required).**
> Both registration and login use a two-step flow: request OTP → verify OTP.

---

### Register – Step 1: Send OTP

**POST** `/auth/register`

**Access**: Public

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "address": "123 Main Street, City"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "OTP sent to your email. Please verify to complete registration.",
  "data": { "email": "john@example.com" }
}
```

---

### Register – Step 2: Verify OTP

**POST** `/auth/register/verify`

**Request Body**:

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Success Response** (201):

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiJ..."
  }
}
```

---

### Login – Step 1: Send OTP

**POST** `/auth/login`

**Request Body**:

```json
{ "email": "john@example.com" }
```

---

### Login – Step 2: Verify OTP

**POST** `/auth/login/verify`

**Request Body**:

```json
{ "email": "john@example.com", "otp": "654321" }
```

---

## Custom Design Endpoints

### Create Custom Design

**POST** `/designs`

**Access**: Private (User)

**Form Data**:

- `design_name` (required)
- `material_preference` (required)
- `approximate_weight` (required, float)
- `description` (required)
- `reference_images` (files, up to 3)

**Status columns on creation**:

- `request`: "Not Viewed"
- `work_status`: "Pending"

**Success Response** (201):

```json
{
  "success": true,
  "message": "Custom design request submitted successfully",
  "data": { "design": { ... "request": "Not Viewed", "work_status": "Pending" } }
}
```

---

### Update Design Status (Admin Only)

**PUT** `/designs/:id/status`

**Request Body** (at least one field required):

```json
{
  "request": "Accepted",
  "work_status": "On Progress"
}
```

**Valid Values**:

- `request`: `Not Viewed` | `Accepted` | `Rejected`
- `work_status`: `Pending` | `On Progress` | `Completed`

---

## Order Endpoints

### Create Order (Checkout)

**POST** `/orders/checkout`

Each product checks out as a standalone row in `order_items` with its own `order_id`.

**Request Body**:

```json
{
  "productIds": [1, 2, 3],
  "weights": [null, 5.5, null],
  "sizes": [null, "2-6", null],
  "chain_lengths": [null, null, 18]
}
```

**Fields**:

- `productIds`: Array of IDs, required.
- `weights`: Optional positional array of weights (grams).
- `sizes`: Optional positional size strings (Bangles / Rings / Stone rings).
- `chain_lengths`: Optional positional integers. **Valid values**: `18`, `20`, `22`, `24` only.

**Success Response** (201):

```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "orders": [
      {
        "order_id": 101,
        "request": "Not Viewed",
        "work_status": "Pending",
        "product_name": "ANTIQUE MAANGA FLOWER SET",
        "weight": 1.500,
        "chain_length": 18,
        "product_images": ["image-123.jpg"],
        ...
      }
    ]
  }
}
```

---

### Update Order Status (Admin Only)

**PUT** `/orders/:id/status`

**Request Body** (at least one field required):

```json
{
  "request": "Accepted",
  "work_status": "Completed"
}
```

**Valid Values**:

- `request`: `Not Viewed` | `Accepted` | `Rejected`
- `work_status`: `Pending` | `On Progress` | `Completed`

---

### Get All Orders (Admin)

**GET** `/orders/admin/all`

Returns all order item rows with user information and the current `request` / `work_status` columns.

---

## File Uploads

- Products/Designs: Images accessible via `/uploads/products/` or `/uploads/designs/`.
- Designs allow up to 3 reference images per request.
