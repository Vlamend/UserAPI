# User Authentication REST API

A RESTful API for user authentication and session management built with **Node.js**, **Express**, and **MongoDB**. Designed as a ready-to-use backend authentication layer for web and mobile applications.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Session Cleanup**: node-cron

---

## Features

- User registration and login
- JWT-based authentication with server-side session store
- Automatic token invalidation on logout
- Hourly cron job to purge expired session tokens
- Protected routes via reusable authentication middleware
- User profile updates (username, name, birth date, password)
- Subscription state management

---

## Project Structure

```
├── models/
│   └── user.js          # Mongoose schema, password hashing middleware
├── routes/
│   └── auth.js          # All authentication and user routes
├── .env                 # Environment variables (see setup below)
└── server.js            # Entry point (not included in this example)
```

---

## Environment Variables

Create a `.env` file in the root of the project:

```dotenv
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
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
node server.js

# Or with hot reload
npx nodemon server.js
```

---

## API Reference

### Auth

| Method | Endpoint | Auth required | Description |
|--------|----------|:---:|-------------|
| `POST` | `/login` | ✗ | Login and receive a JWT token |
| `POST` | `/register` | ✗ | Register a new user |
| `POST` | `/logout` | ✗ | Invalidate the current session token |
| `POST` | `/update` | ✓ | Update user profile data |

### User

| Method | Endpoint | Auth required | Description |
|--------|----------|:---:|-------------|
| `GET` | `/getUserFullName` | ✓ | Get the authenticated user's full name |
| `GET` | `/getUserID` | ✓ | Get the authenticated user's ID |
| `GET` | `/isSubscribed` | ✓ | Get the user's subscription state |
| `PATCH` | `/updateSubscriptionState` | ✓ | Update the user's subscription state |

---

### Authentication

Protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

The token is returned in the `Authorization` response header after a successful login.

---

## Endpoint Details

### `POST /register`

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

**Response `201`:**
```json
{ "message": "User registered successfully." }
```

---

### `POST /login`

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

### `POST /logout`

**Request body:**
```json
{ "token": "<jwt_token>" }
```

---

### `POST /update` 🔒

**Request body** (all fields optional):
```json
{
  "user": "newusername",
  "psw": "newpassword",
  "nome": "New Name",
  "birth": "1995-05-20"
}
```

---

### `PATCH /updateSubscriptionState` 🔒

**Request body:**
```json
{ "subState": true }
```

---

## Security Notes

- Passwords are hashed with **bcrypt** before storage and never returned in responses
- JWT tokens are stored server-side and validated on every request — simply possessing a token is not enough if it has been logged out
- Login returns a generic error message for both wrong username and wrong password to prevent user enumeration
- Input is cast to `String` on all routes to prevent NoSQL injection

---

## Dependencies

```json
{
  "express": "^4.x",
  "mongoose": "^7.x",
  "jsonwebtoken": "^9.x",
  "bcrypt": "^5.x",
  "node-cron": "^3.x",
  "dotenv": "^16.x"
}
```

Install with:
```bash
npm install express mongoose jsonwebtoken bcrypt node-cron dotenv
```
