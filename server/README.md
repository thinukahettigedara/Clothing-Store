# Deepan Clothing Server

Backend server for Deepan Clothing website with SQL Server database integration.

## Prerequisites

1. SQL Server (SSMS) installed and running
2. Node.js installed
3. Create a database named `DeepanClothingDB` in SQL Server

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Configure database connection in `.env`:
```
DB_SERVER=localhost
DB_NAME=DeepanClothingDB
DB_USER=sa
DB_PASSWORD=your_password
PORT=3000
```

3. Run the database schema script in SSMS:
- Open `database-schema.sql` in SQL Server Management Studio
- Execute the script to create the database and tables

4. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create a new product
- `DELETE /api/products/:id` - Delete a product

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id/status` - Update order status

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

## Database Schema

The database includes the following tables:
- Products
- Orders
- Users
- Cart
- Settings
- Reviews
- Messages
