![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)

# User Authentication REST API

A RESTful API for user authentication and session management built with **Node.js**, **Express**, and **MongoDB**. Designed as a ready-to-use backend authentication layer for web and mobile applications.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Input Validation**: Joi
- **Rate Limiting**: express-rate-limit
- **Session Cleanup**: node-cron

---

## Features

- User registration and login
- JWT-based authentication with server-side session store
- Automatic token invalidation on logout
- Hourly cron job to purge expired session tokens
- Protected routes via reusable authentication middleware
- Input validation on all write endpoints
- Rate limiting on authentication endpoints
- User profile updates (username, name, birth date, password)
- Subscription state management

---

## Project Structure

```
├── models/
│   └── user.js          # Mongoose schema, password hashing middleware
├── auth.js              # All authentication and user routes
├── server.js            # Entry point
└── .env                 # Environment variables (see setup below)
```

---

## Environment Variables

Create a `.env` file in the root of the project:

```dotenv
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
SALT_ROUNDS=10
PORT=3000
```

> Never commit `.env` to version control. Add it to `.gitignore`.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or with hot reload
npm run dev
```

---

## API Reference

All endpoints are prefixed with `/user`.

### Auth

| Method | Endpoint | Auth required | Description |
|--------|----------|:---:|-------------|
| `POST` | `/user/login` | ✗ | Login and receive a JWT token |
| `POST` | `/user/register` | ✗ | Register a new user |
| `POST` | `/user/logout` | ✗ | Invalidate the current session token |
| `POST` | `/user/update` | ✓ | Update user profile data |

### User

| Method | Endpoint | Auth required | Description |
|--------|----------|:---:|-------------|
| `GET` | `/user/getUserFullName` | ✓ | Get the authenticated user's full name |
| `GET` | `/user/getUserID` | ✓ | Get the authenticated user's ID |
| `GET` | `/user/isSubscribed` | ✓ | Get the user's subscription state |
| `PATCH` | `/user/updateSubscriptionState` | ✓ | Update the user's subscription state |

---

### Authentication

Protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

The token is returned in the `Authorization` response header after a successful login.

---

## Endpoint Details

### `POST /user/register`

**Request body:**
```json
{
  "user": "johndoe",
  "psw": "securepassword",
  "nome": "John Doe",
  "birth": "1990-01-01",
  "mail": "john@example.com"
}
```

**Validation rules:**
- `user`: alphanumeric, 3–30 characters, required
- `psw`: 8–128 characters, required
- `nome`: 2–50 characters, required
- `birth`: ISO date, must be in the past, optional
- `mail`: valid email format, optional

**Response `201`:**
```json
{ "message": "User registered successfully." }
```

---

### `POST /user/login`

**Request body:**
```json
{
  "user": "johndoe",
  "psw": "securepassword"
}
```

**Response `200`:**
```json
{
  "message": "Login successful.",
  "user": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "username": "johndoe"
  }
}
```
> The JWT token is returned in the `Authorization` response header.

---

### `POST /user/logout`

**Request body:**
```json
{ "token": "<jwt_token>" }
```

**Response `200`:**
```json
{ "message": "Logout successful." }
```

---

### `POST /user/update` 🔒

At least one field is required.

**Request body:**
```json
{
  "user": "newusername",
  "psw": "newpassword",
  "nome": "New Name",
  "birth": "1995-05-20"
}
```

**Response `200`:**
```json
{ "message": "Data updated successfully." }
```

---

### `GET /user/getUserFullName` 🔒

**Response `200`:**
```json
{ "fullName": "John Doe" }
```

---

### `GET /user/getUserID` 🔒

**Response `200`:**
```json
{ "id": "64f1a2b3c4d5e6f7a8b9c0d1" }
```

---

### `GET /user/isSubscribed` 🔒

**Response `200`:**
```json
{ "subscribed": false }
```

---

### `PATCH /user/updateSubscriptionState` 🔒

**Request body:**
```json
{ "subState": true }
```

**Response `200`:**
```json
{ "message": "Subscription state updated successfully." }
```

---

## Security Notes

- Passwords are hashed with **bcrypt** before storage and never returned in responses
- JWT tokens are stored server-side and validated on every request — simply possessing a token is not enough if it has been logged out
- Login returns a generic error message for both wrong username and wrong password to prevent user enumeration
- Input is validated with **Joi** on all write endpoints before hitting the database
- `/user/login` and `/user/register` are rate limited to 10 requests per 15 minutes to prevent brute force attacks

---

## Dependencies

```json
{
  "bcrypt": "^6.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.4.7",
  "express": "^4.21.0",
  "express-rate-limit": "^8.4.1",
  "joi": "^17.x",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.8.4",
  "node-cron": "^4.2.1"
}
```

Dev dependencies:
```json
{
  "nodemon": "^3.1.0"
}
```

Install with:
```bash
npm install bcrypt cors dotenv express express-rate-limit joi jsonwebtoken mongoose node-cron
npm install --save-dev nodemon
```
