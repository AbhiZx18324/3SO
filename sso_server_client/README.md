# OneLogin SSO Server Implementation

A custom Single Sign-On (SSO) server implementation with multi-client support and Redis-based token management.

## 🚀 Features

- **Single Sign-On** - Log in once and access all connected applications
- **Single Sign-Out** - Log out from all applications with one click
- **Session Dashboard** - View and manage all active sessions from a central interface
- **Redis Token Store** - Fast and efficient token management using Redis
- **Scalable Architecture** - Easily add new client applications to your SSO ecosystem

## 📋 Prerequisites

- Node.js (v12.0.0 or higher)
- npm (v6.0.0 or higher)
- Redis server (v5.0.0 or higher)

## 💻 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd onelogin-sso-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Redis connection in `config.js` or using environment variables.

## ⚙️ Configuration

The system consists of multiple components:

### SSO Server
The main authentication service that manages user sessions and tokens.

### Client Applications
Applications that rely on the SSO server for authentication.

### Dashboard
Web interface for monitoring and managing sessions across all applications.

## 🏃‍♂️ Getting Started

To start all components of the system, run the following commands in separate terminal windows:

### Main SSO Server
```bash
nodemon server.js
```

### Client Applications
```bash
nodemon client1.js
nodemon client2.js
```

### Adding More Clients
For additional clients, follow the same pattern:
```bash
nodemon clientX.js
```

## 🔌 Adding New Client Applications

1. Create a new client file (e.g., `client3.js`) based on the existing client templates
2. Configure the client ID and client secret in both:
   - The new client file
   - The SSO server configuration
3. Start the new client using:
   ```bash
   nodemon client3.js
   ```

## 📊 Dashboard Features

The dashboard provides comprehensive session management:

### Active Sessions
View all currently logged-in devices and their details

### Session History
Track recently logged-out devices and session durations

### Logout Controls
- **Single Logout**: Force logout from all connected applications at once
- **Selective Logout**: Log out from specific applications as needed

## 🏗️ Architecture

The system uses a token-based authentication flow:

1. User authenticates on the SSO server
2. SSO server generates a token and stores it in Redis
3. Token is shared with authorized client applications
4. Client applications validate tokens with the SSO server
5. On logout, tokens are invalidated in Redis, affecting all connected applications

## 🔒 Security Considerations

- All communication between server and clients should use HTTPS in production
- Implement regular rotation of client secrets
- Set appropriate token expiration times
- Consider implementing rate limiting to prevent brute force attacks

## ❓ Troubleshooting

### Connection Issues
- **Redis connection refused**: Ensure Redis server is running
- **Port conflicts**: Check if ports are already in use by other applications

### Authentication Problems
- **Login failures**: Verify client IDs and secrets match between server and clients
- **Token validation issues**: Check Redis connection and token format

