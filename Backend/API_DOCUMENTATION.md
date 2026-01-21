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
      "address": "123 Main Street, City, State",
      "role": "user"
    }
  }
}
```

---

### Update User Profile

**PUT** `/auth/profile`

**Access**: Private (Authenticated users)

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body** (all fields optional, but at least one required):
```json
{
  "name": "John Smith",
  "phone": "9876543210",
  "address": "456 New Street, City, State",
  "wishlist": [1, 5, 12],
  "add_to_cart": [3, 7]
}
```

**Validation Rules**:
- `name`: 2-100 characters (optional)
- `phone`: Exactly 10 digits (optional)
- `address`: 5-500 characters (optional)
- `wishlist`: Array of product IDs stored as JSON (optional)
- `add_to_cart`: Array of product IDs stored as JSON (optional)
- At least one field must be provided

**Success Response** (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "9876543210",
      "address": "456 New Street, City, State",
      "wishlist": "[1,5,12]",
      "add_to_cart": "[3,7]",
      "role": "user",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Response** (400):
```json
{
  "success": false,
  "message": "Please provide at least one field to update"
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
- `reference_images` (files, optional): Up to 3 image files (jpeg, jpg, png, gif, webp), max 5MB each

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
      "reference_images": [
        "reference_images-1234567890-123456789.jpg",
        "reference_images-1234567890-987654321.jpg"
      ],
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

**Valid Status Values**: `pending`, `completed`, `rejected`

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

### Acknowledge Design (Admin)

**PUT** `/designs/:id/acknowledge`

**Access**: Private (Admin only)

**Description**: Marks a custom design as acknowledged by the admin. This updates the `is_acknowledge_or_not` field to true/1.

**URL Parameters**:
- `id` (integer): Design ID

**Success Response** (200):
```json
{
  "success": true,
  "message": "Design acknowledged successfully",
  "data": {
    "design": {
      "id": 1,
      "user_id": 2,
      "design_name": "Custom Ring",
      "material_preference": "Gold",
      "approximate_weight": 15.5,
      "description": "Beautiful custom ring design",
      "reference_images": [...],
      "status": "pending",
      "is_acknowledge_or_not": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T03:30:00.000Z"
    }
  }
}
```

**Error Response** (400):
```json
{
  "success": false,
  "message": "Design has already been acknowledged"
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
- `filterType` (string, optional): Type of filter to apply (category/metal/metalPurity/weight)
- `filterValue` (string, optional): Value to filter by (use "All" to get all products)
- `availability` (string, optional): Filter by availability (YES/NO/All)

**Filter Types**:
- `category`: Filter by product category (exact match)
- `metal`: Filter by metal type (exact match)
- `metalPurity`: Filter by metal purity level (exact match)
- `weight`: Filter by weight range (e.g., "0-2" returns products with weight between 0 and 2 grams)

**Examples**: 
- `/products?page=1&limit=10&filterType=category&filterValue=NECKLACE&availability=YES`
- `/products?page=1&limit=10&filterType=metal&filterValue=Gold`
- `/products?page=1&limit=10&filterType=metalPurity&filterValue=22K`
- `/products?page=1&limit=10&filterType=weight&filterValue=0-2` (weight between 0 and 2 grams)
- `/products?page=1&limit=10&filterType=category&filterValue=All` (returns all categories)

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
        "metal": "Gold",
        "metal_purity": "22K",
        "weight": 1.5,
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

### Get Top Selling Products

**GET** `/products/top-selling`

**Access**: Public

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 10)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Top selling products retrieved successfully",
  "data": {
    "data": [ ... ],
    "pagination": { ... }
  }
}
```

---

### Get Featured Products

**GET** `/products/featured`

**Access**: Public

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 10)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Featured products retrieved successfully",
  "data": {
    "data": [ ... ],
    "pagination": { ... }
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

### Get User's Cart Products

**GET** `/products/user/cart`

**Access**: Private (Authenticated users)

**Headers**:
```
Authorization: Bearer <token>
```

**Description**: Retrieves all products that are in the authenticated user's cart. Returns full product details with pricing information.

**Success Response** (200):
```json
{
  "success": true,
  "message": "Cart products retrieved successfully",
  "data": {
    "products": [
      {
        "id": 1,
        "name": "ANTIQUE MAANGA FLOWER SET",
        "grams": "39/21",
        "wastage": 10,
        "category": "ANTIQUE SET",
        "metal": "Gold",
        "metal_purity": "22K",
        "weight": 1.5,
        "description": "Beautiful antique maanga flower set",
        "availability": "YES",
        "images": ["image-1234567890-123456789.jpg"],
        "price": 13200,
        "gst": 396,
        "total_price": 13596,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

**Empty Cart Response** (200):
```json
{
  "success": true,
  "message": "Cart is empty",
  "data": {
    "products": [],
    "count": 0
  }
}
```

---

### Get User's Wishlist Products

**GET** `/products/user/wishlist`

**Access**: Private (Authenticated users)

**Headers**:
```
Authorization: Bearer <token>
```

**Description**: Retrieves all products that are in the authenticated user's wishlist. Returns full product details with pricing information.

**Success Response** (200):
```json
{
  "success": true,
  "message": "Wishlist products retrieved successfully",
  "data": {
    "products": [
      {
        "id": 5,
        "name": "TRADITIONAL NECKLACE",
        "grams": "45",
        "wastage": 12,
        "category": "NECKLACE",
        "metal": "Gold",
        "metal_purity": "22K",
        "weight": 2.5,
        "description": "Classic traditional gold necklace",
        "availability": "YES",
        "images": ["image-9876543210-987654321.jpg"],
        "price": 30000,
        "gst": 900,
        "total_price": 30900,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

**Empty Wishlist Response** (200):
```json
{
  "success": true,
  "message": "Wishlist is empty",
  "data": {
    "products": [],
    "count": 0
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
- `metal` (string, optional): Metal type (e.g., "Gold", "Silver")
- `metal_purity` (string, optional): Metal purity level (e.g., "22K", "24K")
- `weight` (number, optional): Weight in grams (e.g., 1.5, 2.3)
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
- `metal` (string, optional)
- `metal_purity` (string, optional)
- `weight` (string, optional)
- `description` (string, optional)
- `availability` (string, optional)
- `top_selling` (boolean, optional): Mark product as top selling
- `featured` (boolean, optional): Mark product as featured
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

## Metal Prices Endpoints

### Get All Metal Prices

**GET** `/metal-prices`

**Access**: Public

**Description**: Retrieves all metal prices from the database. This endpoint can be used to display current metal rates to users.

**Success Response** (200):
```json
{
  "success": true,
  "message": "Metal prices retrieved successfully",
  "data": {
    "metalPrices": [
      {
        "s_no": 1,
        "metal_name": "gold-22k",
        "price": 7000.00,
        "created_at": "2026-01-20T00:00:00.000Z",
        "updated_at": "2026-01-20T00:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

### Update Metal Price (Admin)

**PUT** `/metal-prices/:metalName`

**Access**: Private (Admin only)

**Headers**:
```
Authorization: Bearer <admin_token>
```

**URL Parameters**:
- `metalName` (string): Name of the metal (e.g., "gold-22k", "silver-925")

**Request Body**:
```json
{
  "price": 7500.50
}
```

**Validation Rules**:
- `metalName`: 2-100 characters, must exist in database
- `price`: Positive float number (minimum 0.01)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Metal price updated successfully",
  "data": {
    "metalPrice": {
      "s_no": 1,
      "metal_name": "gold-22k",
      "price": 7500.50,
      "created_at": "2026-01-20T00:00:00.000Z",
      "updated_at": "2026-01-20T07:00:00.000Z"
    }
  }
}
```

**Error Response** (404):
```json
{
  "success": false,
  "message": "Metal 'gold-24k' not found"
}
```

**Error Response** (401):
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

**Error Response** (403):
```json
{
  "success": false,
  "message": "User role 'user' is not authorized to access this route"
}
```

---

## Email Notifications

The system automatically sends email notifications for custom design events:

### Design Creation Notification
- **Recipient**: harishcsengineer@gmail.com
- **Trigger**: When a user creates a new custom design
- **Content**: Design details and customer information

### Unacknowledged Design Alert
- **Recipient**: sekaranhemanth7@gmail.com
- **Trigger**: Designs not acknowledged within 3 hours of creation
- **Frequency**: Checked every hour via scheduled job
- **Content**: List of all unacknowledged designs with time elapsed

### Email Configuration

Add the following environment variables to your `.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@vanajajewellery.com
```

**For Gmail**:
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated app password in `SMTP_PASSWORD`

**For other SMTP providers**:
- Update `SMTP_HOST` and `SMTP_PORT` accordingly
- Set `SMTP_SECURE=true` if using port 465

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

### Upload Limits
- Design images: Up to 3 images per request
- Product images: 1 image per product

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
