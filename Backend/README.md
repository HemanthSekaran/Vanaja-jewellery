# Jewelry E-commerce Backend API

A secure, scalable, and efficient backend for a jewelry e-commerce application built with Node.js, Express, and MySQL.

## 🚀 Features

- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Role-Based Access Control**: User and Admin roles with protected routes
- **Custom Jewelry Design Requests**: Users can submit custom design requests with image uploads
- **Product Management**: Full CRUD operations for products (Admin only)
- **File Upload**: Secure image upload handling with validation
- **Input Validation**: Comprehensive validation using express-validator
- **Security**: Helmet, CORS, rate limiting, SQL injection prevention
- **Error Handling**: Centralized error handling with detailed logging
- **Pagination**: Efficient pagination for product listings

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (via XAMPP or standalone)
- npm or yarn

## 🛠️ Installation

### 1. Clone or Navigate to Project Directory

```bash
cd C:\Users\Harish\Desktop\Freelance
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

The `.env` file is already configured with default values. Review and update if needed:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=jewelry_ecommerce
JWT_SECRET=jewelry_ecommerce_super_secret_jwt_key_2024_change_in_production
```

### 4. Setup Database

**Start XAMPP MySQL** and ensure it's running on port 3306.

**Create the database and tables:**

```bash
# Using MySQL command line
mysql -u root < database_schema.sql

# OR using XAMPP phpMyAdmin
# - Open http://localhost/phpmyadmin
# - Import database_schema.sql
```

### 5. Seed Admin User

```bash
npm run seed-admin
```

This will create the default admin account:
- **Email**: admin@gmail.com
- **Password**: admin

⚠️ **IMPORTANT**: Change the admin password after first login!

### 6. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login user |
| GET | `/api/auth/me` | Private | Get current user |

### Custom Designs

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/designs` | User | Create custom design request |
| GET | `/api/designs` | User | Get user's designs |
| GET | `/api/designs/:id` | User | Get single design |
| GET | `/api/designs/admin/all` | Admin | Get all designs |
| PUT | `/api/designs/:id/status` | Admin | Update design status |

### Products

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/products` | Public | Get all products (with pagination) |
| GET | `/api/products/:id` | Public | Get single product |
| GET | `/api/products/categories/list` | Public | Get all categories |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📝 Example Requests

### Register User

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "SecurePass123"
}
```

### Login

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@gmail.com",
  "password": "admin"
}
```

### Create Custom Design

```bash
POST http://localhost:5000/api/designs
Authorization: Bearer <token>
Content-Type: multipart/form-data

design_name: Custom Ring
material_preference: Gold
approximate_weight: 15.5
description: Beautiful custom ring design
reference_image: [file upload]
```

### Create Product (Admin)

```bash
POST http://localhost:5000/api/products
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

name: Diamond Necklace
grams: 45
wastage: 12
category: NECKLACE
description: Elegant diamond necklace
availability: YES
image: [file upload]
```

## 🗂️ Project Structure

```
Freelance/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── designController.js  # Custom design logic
│   │   └── productController.js # Product CRUD logic
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Error handling
│   │   ├── upload.js            # File upload
│   │   └── validators.js        # Input validation
│   ├── routes/
│   │   ├── authRoutes.js        # Auth routes
│   │   ├── designRoutes.js      # Design routes
│   │   └── productRoutes.js     # Product routes
│   ├── scripts/
│   │   └── seedAdmin.js         # Admin seeding script
│   ├── utils/
│   │   ├── helpers.js           # Helper functions
│   │   └── logger.js            # Winston logger
│   └── server.js                # Main application
├── uploads/                      # Uploaded files
│   ├── designs/                 # Design reference images
│   └── products/                # Product images
├── logs/                        # Application logs
├── database_schema.sql          # Database schema
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
└── package.json                 # Dependencies
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: express-validator for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: Prevents brute force attacks
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin requests
- **File Upload Security**: Type and size validation

## 📊 Database Schema

### Users Table
- id, name, email, phone, password (hashed), role, timestamps

### Custom Designs Table
- id, user_id, design_name, material_preference, approximate_weight, description, reference_image, status, timestamps

### Products Table
- id, name, grams, wastage, category, description, availability, image, timestamps

## 🧪 Testing

Use tools like **Postman**, **Insomnia**, or **Thunder Client** to test the API endpoints.

## 📝 Logging

Logs are stored in the `logs/` directory:
- `combined.log`: All logs
- `error.log`: Error logs only

## 🚀 Deployment Considerations

1. **Change JWT Secret**: Use a strong, unique secret in production
2. **Change Admin Password**: Update default admin credentials
3. **Use HTTPS**: Always use SSL/TLS in production
4. **Environment Variables**: Never commit `.env` to version control
5. **Database**: Use proper MySQL user with limited privileges
6. **File Storage**: Consider cloud storage (AWS S3, Cloudinary) for production
7. **Rate Limiting**: Adjust based on your traffic patterns
8. **CORS**: Configure allowed origins properly

## 📄 License

ISC

## 👨‍💻 Author

Built with ❤️ for jewelry e-commerce
