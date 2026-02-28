# RBAC Payment System - Backend API

A production-ready backend system demonstrating secure **Role-Based Access Control (RBAC)** with a structured **payment workflow integration** built using the MERN stack.

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture Highlights](#architecture-highlights)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Database Schema](#database-schema)
- [RBAC System](#rbac-system)
- [Payment Workflow](#payment-workflow)
- [API Documentation](#api-documentation)
- [Security Considerations](#security-considerations)
- [Project Structure](#project-structure)
- [Testing the API](#testing-the-api)
- [Assumptions & Design Decisions](#assumptions--design-decisions)

---

## Project Overview

This backend application implements a secure authentication and authorization system with role-based access control, integrated with a payment workflow that demonstrates state management and permission-based operations.

The system enforces strict access control where different user roles have different capabilities:
- **Admin**: Full system access
- **Manager**: Payment approval and processing capabilities
- **User**: Basic payment creation and viewing

### Purpose

This project demonstrates:
- Production-oriented backend architecture
- Secure authentication using JWT
- Permission-based authorization (not just role-based)
- Complex workflow state management
- API security best practices
- Clean code organization and separation of concerns

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express.js | 4.18.2 | Web application framework |
| MongoDB | Latest | NoSQL database |
| Mongoose | 8.0.0 | ODM for MongoDB |
| JWT | 9.0.2 | Authentication tokens |
| bcryptjs | 2.4.3 | Password hashing |
| express-validator | 7.0.1 | Input validation |
| express-rate-limit | 7.1.5 | Rate limiting |
| helmet | 7.1.0 | Security headers |
| cors | 2.8.5 | Cross-origin resource sharing |
| express-mongo-sanitize | 2.2.0 | NoSQL injection prevention |

---

## Features

### Authentication System
- User registration with email validation
- Secure login with bcrypt password hashing
- JWT-based access tokens (15-minute expiry)
- Refresh token mechanism (7-day expiry)
- Token blacklisting on logout
- Account status management (active/inactive)

### Role-Based Access Control
- **Hybrid RBAC**: Combines predefined roles with flexible permissions
- **Permission-based middleware**: Fine-grained access control
- **Three default roles**: Admin, Manager, User
- **Dynamic role management**: Admins can create custom roles with specific permissions
- **Ownership-based access**: Users can access their own resources regardless of permissions

### Payment Workflow
Complete payment lifecycle management:
1. **Creation**: Users create payment requests
2. **Approval**: Managers/Admins approve or reject payments
3. **Processing**: Approved payments are processed (simulated)
4. **Completion**: Payments complete successfully or fail
5. **Tracking**: Full audit trail of workflow state changes

### Security Measures
- Rate limiting on authentication endpoints
- Input validation and sanitization
- NoSQL injection prevention
- Security headers (helmet)
- CORS configuration
- Error handling without information leakage
- Environment variable management

---

## Architecture Highlights

### Clean Separation of Concerns
- **Models**: Data structure and business logic
- **Controllers**: Request handling and response formatting
- **Middleware**: Cross-cutting concerns (auth, validation, errors)
- **Routes**: Endpoint definitions with middleware chains
- **Validators**: Input validation rules
- **Utils**: Shared utilities and helpers

### Security-First Design
- Passwords never stored in plaintext
- Tokens with short expiry times
- Permission checks before every protected operation
- SQL/NoSQL injection prevention
- Rate limiting to prevent abuse

### Scalable Permission System
Instead of hardcoding role checks (`if (user.role === 'admin')`), the system uses permissions:
- Roles have arrays of permissions
- Middleware checks permissions, not roles
- New permissions can be added without code changes
- Flexible and maintainable

---

## Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or cloud URI)
- **npm** or **yarn**
- **Postman** or **curl** (for API testing)

---

## Installation & Setup

### 1. Clone or Download the Repository

```bash
cd /path/to/project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

The `.env` file is already configured with your MongoDB connection. If you need to modify it:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=your_mongodb_uri_here

# JWT Configuration
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=10
CORS_ORIGIN=*
```

**Important**: Never commit the `.env` file to version control. Use `.env.example` as a template.

### 4. Seed the Database

Run the seeding script to create default roles and test users:

```bash
npm run seed
```

This will create:
- 3 roles (Admin, Manager, User)
- 5 test users
- 7 sample payments in various states

**Test Accounts Created:**
```
Admin:    admin@example.com    / Admin@123
Manager:  manager@example.com  / Manager@123
User:     user@example.com     / User@123
```

To clear and reseed:
```bash
npm run seed:clean
```

### 5. Start the Server

**Development mode** (with auto-restart):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5000`

### 6. Verify Installation

Visit `http://localhost:5000` in your browser or:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Database Schema

### User Schema

```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String (required),
  lastName: String (required),
  role: ObjectId (ref: 'Role'),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `email`, `role`

### Role Schema

```javascript
{
  name: String (unique, required),
  permissions: [String] (array of permission strings),
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `name`

### Payment Schema

```javascript
{
  user: ObjectId (ref: 'User'),
  amount: Number (min: 0.01),
  currency: String (default: 'USD'),
  description: String,
  status: String (enum: ['pending', 'approved', 'rejected', 'processing', 'completed', 'failed']),
  paymentMethod: String (enum: ['card', 'bank_transfer', 'wallet']),

  // Workflow tracking
  approvedBy: ObjectId (ref: 'User'),
  approvedAt: Date,
  processedBy: ObjectId (ref: 'User'),
  processedAt: Date,
  completedAt: Date,

  // Metadata
  failureReason: String,
  transactionId: String (unique, auto-generated),
  metadata: Object,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: `user + status`, `transactionId`, `createdAt`

### RefreshToken Schema

```javascript
{
  token: String (unique, required),
  user: ObjectId (ref: 'User'),
  expiresAt: Date (required),
  createdAt: Date
}
```

**Indexes**: `token`, `user`, `expiresAt` (TTL index for auto-deletion)

### Relationships

```
User ──1:1──→ Role
User ──1:N──→ Payment (as creator)
User ──1:N──→ Payment (as approver)
User ──1:N──→ Payment (as processor)
User ──1:N──→ RefreshToken
```

---

## RBAC System

### Permission Structure

The system uses a **permission-based RBAC** approach:

**Permission Format**: `resource:action`

| Permission | Description |
|------------|-------------|
| `users:read` | View user information |
| `users:write` | Create/update users |
| `users:delete` | Delete users |
| `payments:create` | Create new payments |
| `payments:read` | View payments |
| `payments:approve` | Approve/reject pending payments |
| `payments:process` | Process approved payments |
| `payments:delete` | Delete payments |
| `roles:manage` | Full role management |

### Default Roles

#### Admin Role
```javascript
{
  name: 'admin',
  permissions: [
    'users:read', 'users:write', 'users:delete',
    'payments:create', 'payments:read', 'payments:approve',
    'payments:process', 'payments:delete',
    'roles:manage'
  ]
}
```

#### Manager Role
```javascript
{
  name: 'manager',
  permissions: [
    'users:read',
    'payments:create', 'payments:read', 'payments:approve',
    'payments:process', 'payments:delete'
  ]
}
```

#### User Role
```javascript
{
  name: 'user',
  permissions: [
    'payments:create',
    'payments:read'  // Can only read own payments
  ]
}
```

### Middleware Implementation

**requirePermissions** (OR logic):
```javascript
requirePermissions('payments:approve', 'payments:process')
// User needs ANY ONE of these permissions
```

**requireAllPermissions** (AND logic):
```javascript
requireAllPermissions('users:read', 'users:write')
// User needs ALL of these permissions
```

### Special Access Rules

1. **Ownership Override**: Users can view/edit their own profile regardless of permissions
2. **Self-Protection**: Users cannot delete themselves or change their own role
3. **Resource Ownership**: Users can view their own payments even without global read permission

---

## Payment Workflow

### Workflow States

```
pending → approved → processing → completed
        ↘ rejected              ↘ failed
```

### State Transitions

| Current Status | Allowed Next States |
|----------------|---------------------|
| `pending` | `approved`, `rejected` |
| `approved` | `processing` |
| `processing` | `completed`, `failed` |
| `rejected` | (final state) |
| `completed` | (final state) |
| `failed` | (final state) |

### Workflow Actions & Permissions

| Action | Endpoint | Required Permission | Effect |
|--------|----------|---------------------|--------|
| Create | `POST /payments` | `payments:create` | Creates payment in `pending` state |
| Approve | `PUT /payments/:id/approve` | `payments:approve` | Changes `pending` → `approved` |
| Reject | `PUT /payments/:id/reject` | `payments:approve` | Changes `pending` → `rejected` |
| Process | `PUT /payments/:id/process` | `payments:process` | Changes `approved` → `processing` → `completed/failed` |
| Delete | `DELETE /payments/:id` | `payments:delete` | Deletes payment (not allowed for processing/completed) |

### Workflow Rules

1. Only `pending` payments can be approved or rejected
2. Only `approved` payments can be processed
3. Processing is simulated (80% success rate)
4. Final states (`completed`, `failed`, `rejected`) cannot be modified
5. All state changes are tracked with timestamps and user references

### Example Workflow

**User creates a payment:**
```
Status: pending
User: user@example.com
Amount: $99.99
```

**Manager approves:**
```
Status: approved
Approved by: manager@example.com
Approved at: 2024-01-15 10:30:00
```

**Admin processes:**
```
Status: processing → completed
Processed by: admin@example.com
Processed at: 2024-01-15 10:35:00
Completed at: 2024-01-15 10:35:02
```

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

Most endpoints require authentication. Include the access token in the header:

```
Authorization: Bearer <access_token>
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass@123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "email": "newuser@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": { ... },
      "isActive": true
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

**Validation Rules:**
- Email must be valid format
- Password minimum 6 characters, must contain uppercase, lowercase, and number
- First/last name: 2-50 characters

**Rate Limit:** 5 requests per 15 minutes

---

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

**Rate Limit:** 5 requests per 15 minutes

---

#### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

---

#### Logout
```http
POST /api/auth/logout
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

#### Get Current User
```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "_id": "...",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": {
        "name": "admin",
        "permissions": [...]
      }
    }
  }
}
```

---

### User Management Endpoints

#### Get All Users
```http
GET /api/users?page=1&limit=10&search=john&isActive=true
```

**Required Permission:** `users:read`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or email
- `role` (optional): Filter by role ID
- `isActive` (optional): Filter by active status

**Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [ ... ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

---

#### Get User by ID
```http
GET /api/users/:id
```

**Required Permission:** Own profile OR `users:read`

**Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": { ... }
  }
}
```

---

#### Update User
```http
PUT /api/users/:id
```

**Required Permission:** Own profile OR `users:write`

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "isActive": false
}
```

**Note:** Users cannot change their own `isActive` status.

---

#### Delete User
```http
DELETE /api/users/:id
```

**Required Permission:** `users:delete`

**Note:** Cannot delete yourself.

---

#### Change User Role
```http
PUT /api/users/:id/role
```

**Required Permission:** `users:write`

**Request Body:**
```json
{
  "roleId": "role_object_id_here"
}
```

**Note:** Cannot change your own role.

---

### Payment Endpoints

#### Create Payment
```http
POST /api/payments
```

**Required Permission:** `payments:create`

**Request Body:**
```json
{
  "amount": 99.99,
  "currency": "USD",
  "description": "Monthly subscription",
  "paymentMethod": "card",
  "metadata": {
    "orderId": "ORD-12345"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "payment": {
      "_id": "...",
      "transactionId": "TXN-1234567890-ABC",
      "amount": 99.99,
      "status": "pending",
      "user": { ... },
      ...
    }
  }
}
```

---

#### Get All Payments
```http
GET /api/payments?status=pending&page=1&limit=10
```

**Required Permission:** `payments:read`

**Access Rules:**
- Regular users see only their own payments
- Managers/Admins see all payments

**Query Parameters:**
- `status` (optional): Filter by status
- `userId` (optional): Filter by user ID (admin/manager only)
- `page` (optional): Page number
- `limit` (optional): Items per page (max 100)

---

#### Get Payment by ID
```http
GET /api/payments/:id
```

**Required Permission:** `payments:read`

**Access Rules:** Own payment OR global read permission

---

#### Approve Payment
```http
PUT /api/payments/:id/approve
```

**Required Permission:** `payments:approve`

**Constraints:**
- Payment must be in `pending` status
- Records approver and approval time

**Response (200):**
```json
{
  "success": true,
  "message": "Payment approved successfully",
  "data": {
    "payment": {
      "status": "approved",
      "approvedBy": { ... },
      "approvedAt": "2024-01-15T10:30:00.000Z",
      ...
    }
  }
}
```

---

#### Reject Payment
```http
PUT /api/payments/:id/reject
```

**Required Permission:** `payments:approve`

**Request Body:**
```json
{
  "reason": "Exceeds approved limit"
}
```

**Constraints:**
- Payment must be in `pending` status

---

#### Process Payment
```http
PUT /api/payments/:id/process
```

**Required Permission:** `payments:process`

**Constraints:**
- Payment must be in `approved` status
- Simulates processing (80% success rate)
- Automatically transitions to `completed` or `failed`

**Response (200):**
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "payment": {
      "status": "completed",
      "processedBy": { ... },
      "processedAt": "...",
      "completedAt": "...",
      ...
    }
  }
}
```

---

#### Delete Payment
```http
DELETE /api/payments/:id
```

**Required Permission:** `payments:delete`

**Constraints:**
- Cannot delete payments in `processing` or `completed` status

---

### Role Management Endpoints

#### Get All Roles
```http
GET /api/roles
```

**Required Permission:** `roles:manage`

---

#### Get Role by ID
```http
GET /api/roles/:id
```

**Required Permission:** `roles:manage`

**Response includes user count for that role.**

---

#### Create Role
```http
POST /api/roles
```

**Required Permission:** `roles:manage`

**Request Body:**
```json
{
  "name": "support",
  "permissions": ["users:read", "payments:read"],
  "description": "Customer support role"
}
```

---

#### Update Role
```http
PUT /api/roles/:id
```

**Required Permission:** `roles:manage`

**Request Body:**
```json
{
  "permissions": ["users:read", "payments:read", "payments:create"],
  "description": "Updated description"
}
```

---

#### Delete Role
```http
DELETE /api/roles/:id
```

**Required Permission:** `roles:manage`

**Constraint:** Cannot delete if users are assigned to it.

---

## Security Considerations

### Implemented Security Measures

#### 1. Authentication Security
- **Password Hashing**: bcrypt with configurable salt rounds (default: 10)
- **Short-lived Tokens**: Access tokens expire in 15 minutes
- **Refresh Token Rotation**: Separate refresh tokens stored in database
- **Token Invalidation**: Refresh tokens removed on logout

#### 2. Authorization Security
- **Permission-based Access**: Fine-grained control beyond role checking
- **Ownership Validation**: Users can only modify their own resources
- **Self-protection**: Users cannot delete themselves or escalate privileges

#### 3. Input Security
- **Validation**: express-validator on all endpoints
- **Sanitization**: express-mongo-sanitize prevents NoSQL injection
- **Type Checking**: Mongoose schema validation
- **Size Limits**: Request body limited to 10MB

#### 4. API Security
- **Rate Limiting**:
  - Auth endpoints: 5 req/15min
  - General API: 100 req/15min
- **Helmet**: Sets security headers (XSS, clickjacking protection)
- **CORS**: Configured cross-origin policies
- **Error Handling**: No sensitive data leaked in error messages

#### 5. Database Security
- **Connection Security**: MongoDB URI with credentials
- **Indexes**: Performance optimization and unique constraints
- **TTL Indexes**: Auto-deletion of expired tokens
- **Validation**: Schema-level validation

### Production Recommendations

**Not implemented in this demo (but recommended for production):**

1. **HTTPS Enforcement**: Use HTTPS in production
2. **Environment Segregation**: Separate dev/staging/production databases
3. **Logging & Monitoring**: Implement structured logging (Winston, Pino)
4. **Audit Trails**: Log all sensitive operations
5. **Secret Management**: Use secret management services (AWS Secrets Manager, Vault)
6. **API Versioning**: Version your APIs (/api/v1)
7. **Request ID Tracking**: Add correlation IDs for request tracing
8. **Input Length Limits**: More granular field-level length restrictions
9. **IP Whitelisting**: For admin endpoints
10. **Two-Factor Authentication**: For high-privilege accounts
11. **Session Management**: IP-based session validation
12. **Automated Testing**: Unit and integration tests
13. **Dependency Scanning**: Regular security audits (npm audit)
14. **Database Backups**: Automated backup strategy

### Known Limitations (Demo Context)

1. **Payment Processing**: Simulated (not integrated with real gateway)
2. **Email Verification**: Not implemented
3. **Password Reset**: Not implemented
4. **File Upload**: Not implemented (if needed for receipts, etc.)
5. **Webhooks**: Not implemented for payment notifications

---

## Project Structure

```
rbac-payment-backend/
├── src/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   ├── Role.js                  # Role schema
│   │   ├── Payment.js               # Payment schema
│   │   └── RefreshToken.js          # Token storage schema
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication
│   │   ├── rbac.js                  # Permission checking
│   │   ├── errorHandler.js          # Global error handler
│   │   └── rateLimiter.js           # Rate limiting configs
│   ├── controllers/
│   │   ├── authController.js        # Auth logic
│   │   ├── userController.js        # User CRUD
│   │   ├── paymentController.js     # Payment workflow
│   │   └── roleController.js        # Role management
│   ├── routes/
│   │   ├── authRoutes.js            # Auth endpoints
│   │   ├── userRoutes.js            # User endpoints
│   │   ├── paymentRoutes.js         # Payment endpoints
│   │   ├── roleRoutes.js            # Role endpoints
│   │   └── index.js                 # Route aggregator
│   ├── validators/
│   │   ├── authValidator.js         # Auth validation rules
│   │   ├── userValidator.js         # User validation rules
│   │   └── paymentValidator.js      # Payment validation rules
│   ├── utils/
│   │   ├── constants.js             # App constants
│   │   ├── responseFormatter.js     # Response helpers
│   │   └── tokenUtils.js            # JWT utilities
│   ├── seeds/
│   │   └── seedDatabase.js          # Database seeding
│   ├── app.js                       # Express app setup
│   └── server.js                    # Server entry point
├── .env                             # Environment variables
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore rules
├── package.json                     # Dependencies & scripts
└── README.md                        # This file
```

### File Responsibilities

**Models**: Define data structure, validation, and model-specific methods
**Controllers**: Handle business logic and request/response
**Middleware**: Cross-cutting concerns (auth, validation, error handling)
**Routes**: Map URLs to controllers with middleware chains
**Validators**: Define input validation rules
**Utils**: Shared utilities and constants
**Seeds**: Database initialization scripts

---

## Testing the API

### Using Postman

1. **Import Collection** (or create manually):
   - Base URL: `http://localhost:5000/api`

2. **Test Authentication Flow**:
   ```
   1. POST /auth/login with admin credentials
   2. Copy accessToken from response
   3. Set as Bearer token in Authorization header
   4. Test protected endpoints
   ```

3. **Test Payment Workflow**:
   ```
   1. Login as user@example.com
   2. Create a payment (POST /payments)
   3. Login as manager@example.com
   4. Approve the payment (PUT /payments/:id/approve)
   5. Process the payment (PUT /payments/:id/process)
   ```

### Sample curl Commands

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123"
  }'
```

**Create Payment:**
```bash
curl -X POST http://localhost:5000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "amount": 99.99,
    "description": "Test payment"
  }'
```

**Get All Payments:**
```bash
curl -X GET "http://localhost:5000/api/payments?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Scenarios

#### Scenario 1: Complete Payment Workflow
1. Register new user
2. Login as user
3. Create payment (status: pending)
4. Try to approve own payment (should fail - no permission)
5. Login as manager
6. Approve payment
7. Process payment
8. Verify payment completed

#### Scenario 2: Permission Enforcement
1. Login as regular user
2. Try to access GET /users (should fail - no users:read)
3. Try to delete a payment (should fail - no payments:delete)
4. Login as admin
5. Same operations should succeed

#### Scenario 3: Ownership Validation
1. Login as user1
2. Create payment
3. Login as user2
4. Try to view user1's payment (should fail)
5. Login as manager
6. View user1's payment (should succeed)

---

## Assumptions & Design Decisions

### Assumptions Made

1. **Payment Processing**: Real payment gateway integration is out of scope. Processing is simulated with an 80% success rate.

2. **Default Role Assignment**: New users are automatically assigned the "user" role upon registration.

3. **Email Verification**: Not required for this demo. In production, email verification would be implemented.

4. **Password Requirements**: Strong password validation is enforced (uppercase, lowercase, number, min 6 chars). In production, stricter requirements might be needed.

5. **Single Role per User**: Users have one role at a time. Multi-role scenarios are not implemented.

6. **Currency**: USD is the default currency. Multi-currency support is basic.

7. **Pagination Defaults**: Default page size is 10 items, max is 100.

8. **Token Storage**: Refresh tokens are stored in MongoDB. In high-scale production, Redis might be preferred.

9. **Rate Limiting**: Applied per IP address. In production, might need user-based limiting.

10. **File Uploads**: Not implemented. Payment receipts/documents would require file handling.

### Design Decisions

#### Why Permission-Based RBAC?
- More flexible than pure role-based
- Easier to extend with new permissions
- Supports fine-grained access control
- Industry best practice

#### Why Separate Access and Refresh Tokens?
- Security: Short-lived access tokens limit exposure
- Performance: Access tokens can be stateless (JWT)
- Revocation: Refresh tokens stored in DB can be invalidated

#### Why Mongoose Over Native Driver?
- Schema validation
- Middleware hooks (e.g., password hashing)
- Cleaner query syntax
- Built-in population for references

#### Why Express Validator?
- Declarative validation rules
- Sanitization built-in
- Good error messages
- Industry standard

#### Why Not Use a Framework Like NestJS?
- Assignment focuses on backend architecture, not framework features
- Express is more universal and demonstrates core concepts
- Lighter weight and more flexible
- Easier to understand underlying patterns

### Simplifications for Demo

1. **No Frontend**: Backend-only to focus on architecture
2. **No Email Service**: Registration doesn't send confirmation emails
3. **No SMS/2FA**: Single-factor authentication only
4. **No Real Payment Gateway**: Processing is simulated
5. **No Background Jobs**: No queue system for async tasks
6. **No Caching**: No Redis for performance optimization
7. **No Comprehensive Logging**: Basic console logs only
8. **No Monitoring**: No APM or health check systems

---

## License

This project is created for educational/demonstration purposes.

---

## Contact & Support

For questions or issues related to this implementation, please refer to the codebase documentation or contact the development team.

---

**Built with production-oriented thinking and engineering maturity.**
