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
  "errors": [ ... ] // Optional validation errors
}
```

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

**Access**: Public

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "SecurePass123"
}
```

**Validation Rules**:
- `name`: 2-100 characters
- `email`: Valid email format
- `phone`: Exactly 10 digits
- `password`: Min 6 characters, must contain uppercase, lowercase, and number

**Success Response** (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "user",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login User

**POST** `/auth/login`

**Access**: Public

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Current User

**GET** `/auth/me`

**Access**: Private (Authenticated users)

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "user"
    }
  }
}
```

---

## Custom Design Endpoints

### Create Custom Design

**POST** `/designs`

**Access**: Private (Authenticated users)

**Content-Type**: `multipart/form-data`

**Form Data**:
- `design_name` (string, required): 2-255 characters
- `material_preference` (string, required): 2-255 characters
- `approximate_weight` (float, required): Positive number
- `description` (string, optional): Max 2000 characters
- `reference_image` (file, optional): Image file (jpeg, jpg, png, gif, webp), max 5MB

**Success Response** (201):
```json
{
  "success": true,
  "message": "Custom design request submitted successfully",
  "data": {
    "design": {
      "id": 1,
      "user_id": 1,
      "design_name": "Custom Ring",
      "material_preference": "Gold",
      "approximate_weight": 15.5,
      "description": "Beautiful custom ring design",
      "reference_image": "reference_image-1234567890-123456789.jpg",
      "status": "pending",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### Get User's Designs

**GET** `/designs`

**Access**: Private (Authenticated users)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Designs retrieved successfully",
  "data": {
    "designs": [ ... ],
    "count": 5
  }
}
```

---

### Get Single Design

**GET** `/designs/:id`

**Access**: Private (User can view own designs, Admin can view all)

**URL Parameters**:
- `id` (integer): Design ID

**Success Response** (200):
```json
{
  "success": true,
  "message": "Design retrieved successfully",
  "data": {
    "design": { ... }
  }
}
```

---

### Get All Designs (Admin)

**GET** `/designs/admin/all`

**Access**: Private (Admin only)

**Success Response** (200):
```json
{
  "success": true,
  "message": "All designs retrieved successfully",
  "data": {
    "designs": [
      {
        "id": 1,
        "user_id": 2,
        "user_name": "John Doe",
        "user_email": "john@example.com",
        "design_name": "Custom Ring",
        ...
      }
    ],
    "count": 10
  }
}
```

---

### Update Design Status (Admin)

**PUT** `/designs/:id/status`

**Access**: Private (Admin only)

**Request Body**:
```json
{
  "status": "in_progress"
}
```

**Valid Status Values**: `pending`, `in_progress`, `completed`, `rejected`

**Success Response** (200):
```json
{
  "success": true,
  "message": "Design status updated successfully",
  "data": {
    "design": { ... }
  }
}
```

---

## Product Endpoints

### Get All Products

**GET** `/products`

**Access**: Public

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 10)
- `category` (string, optional): Filter by category
- `availability` (string, optional): Filter by availability (YES/NO)

**Example**: `/products?page=1&limit=10&category=NECKLACE&availability=YES`

**Success Response** (200):
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "name": "ANTIQUE MAANGA FLOWER SET",
        "grams": "39/21",
        "wastage": 10,
        "category": "ANTIQUE SET",
        "description": "Beautiful antique maanga flower set",
        "availability": "YES",
        "image": "image-1234567890-123456789.jpg",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "perPage": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### Get Single Product

**GET** `/products/:id`

**Access**: Public

**URL Parameters**:
- `id` (integer): Product ID

**Success Response** (200):
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "product": { ... }
  }
}
```

---

### Get Categories

**GET** `/products/categories/list`

**Access**: Public

**Success Response** (200):
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "categories": ["ANTIQUE SET", "NECKLACE", "EARRINGS", "RINGS"]
  }
}
```

---

### Create Product (Admin)

**POST** `/products`

**Access**: Private (Admin only)

**Content-Type**: `multipart/form-data`

**Form Data**:
- `name` (string, required): 2-255 characters
- `grams` (string, required): Max 50 characters
- `wastage` (integer, required): Non-negative integer
- `category` (string, required): 2-100 characters
- `description` (string, optional): Max 2000 characters
- `availability` (string, optional): YES or NO (default: YES)
- `image` (file, optional): Image file (jpeg, jpg, png, gif, webp), max 5MB

**Success Response** (201):
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": { ... }
  }
}
```

---

### Update Product (Admin)

**PUT** `/products/:id`

**Access**: Private (Admin only)

**Content-Type**: `multipart/form-data`

**Form Data**: All fields are optional (partial update supported)
- `name` (string, optional)
- `grams` (string, optional)
- `wastage` (integer, optional)
- `category` (string, optional)
- `description` (string, optional)
- `availability` (string, optional)
- `image` (file, optional)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product": { ... }
  }
}
```

---

### Delete Product (Admin)

**DELETE** `/products/:id`

**Access**: Private (Admin only)

**URL Parameters**:
- `id` (integer): Product ID

**Success Response** (200):
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": null
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (Validation Error) |
| 401 | Unauthorized (Invalid/Missing Token) |
| 403 | Forbidden (Insufficient Permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (Rate Limit) |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Response**: 429 Too Many Requests

---

## File Upload Specifications

### Allowed Image Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### File Size Limit
- Maximum: 5MB per file

### Storage Locations
- Design images: `/uploads/designs/`
- Product images: `/uploads/products/`

### Accessing Uploaded Files
```
http://localhost:5000/uploads/designs/filename.jpg
http://localhost:5000/uploads/products/filename.jpg
```

---

## Common Error Examples

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Email is required",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "User role 'user' is not authorized to access this route"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Product not found"
}
```
