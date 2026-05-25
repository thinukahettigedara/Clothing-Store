const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const sql = require('mssql');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// SQL Server Configuration
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

// Database Connection Pool
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

async function ensureNewsletterTable() {
  await executeQuery(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NewsletterSubscribers' AND xtype='U')
    CREATE TABLE NewsletterSubscribers (
      SubscriberId INT IDENTITY(1,1) PRIMARY KEY,
      Email NVARCHAR(255) NOT NULL UNIQUE,
      DiscountUsed BIT DEFAULT 0,
      SubscribedAt DATETIME DEFAULT GETDATE()
    );
  `);
}

poolConnect.then(async () => {
  console.log('Connected to SQL Server');
  try {
    await ensureNewsletterTable();
  } catch (err) {
    console.warn('Newsletter table setup:', err.message);
  }
}).catch(err => {
  console.error('Database connection failed:', err);
});

// Helper function to execute queries
async function executeQuery(query, params = {}) {
  try {
    await poolConnect;
    const request = pool.request();
    
    // Add parameters to request
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
    
    const result = await request.query(query);
    return result.recordset;
  } catch (err) {
    console.error('Query execution failed:', err);
    throw err;
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Products ORDER BY CreatedAt DESC');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, category, price, image, sizes, description } = req.body;

    // Check if product with same name already exists
    const existingProduct = await executeQuery('SELECT * FROM Products WHERE Name = @name', { name });
    if (existingProduct.length > 0) {
      return res.json({ success: false, message: 'Product with this name already exists' });
    }

    const query = `
      INSERT INTO Products (Name, Category, Price, Image, Sizes, Description)
      VALUES (@name, @category, @price, @image, @sizes, @description);
      SELECT SCOPE_IDENTITY() as ProductId;
    `;
    const result = await executeQuery(query, {
      name,
      category,
      price,
      image,
      sizes: sizes ? JSON.stringify(sizes) : null,
      description
    });
    res.json({ success: true, productId: result[0].ProductId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/all', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Products');
    res.json({ success: true, message: 'All products deleted from database' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // First, delete reviews associated with this product
    await executeQuery('DELETE FROM Reviews WHERE ProductId = @id', { id });

    // Then delete the product
    await executeQuery('DELETE FROM Products WHERE ProductId = @id', { id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Products');
    res.json({ success: true, message: 'All products deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Orders API
app.get('/api/orders', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Orders ORDER BY CreatedAt DESC');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, total, shipping, status } = req.body;
    const query = `
      INSERT INTO Orders (Items, Total, Shipping, Status)
      VALUES (@items, @total, @shipping, @status);
      SELECT SCOPE_IDENTITY() as OrderId;
    `;
    const result = await executeQuery(query, {
      items: JSON.stringify(items),
      total,
      shipping: JSON.stringify(shipping),
      status: status || 'pending'
    });
    res.json({ success: true, orderId: result[0].OrderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await executeQuery('UPDATE Orders SET Status = @status WHERE OrderId = @id', { id, status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM Orders WHERE OrderId = @id', { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders/reset-ids', async (req, res) => {
  try {
    // Delete all orders first
    await executeQuery('DELETE FROM Orders');
    
    // Reset identity seed to 1
    await executeQuery('DBCC CHECKIDENT (Orders, RESEED, 1)');
    
    res.json({ success: true, message: 'Order IDs reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Users API
app.get('/api/users', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Users');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, password, name, phone, address } = req.body;

    // Check if user with same email already exists (case-insensitive)
    const existingUser = await executeQuery('SELECT * FROM Users WHERE LOWER(Email) = LOWER(@email)', { email });
    if (existingUser.length > 0) {
      return res.json({ success: false, message: 'Email already exists' });
    }

    const query = `
      INSERT INTO Users (Email, Password, Name, Phone, Address)
      VALUES (@email, @password, @name, @phone, @address);
      SELECT SCOPE_IDENTITY() as UserId;
    `;
    const result = await executeQuery(query, { email, password, name, phone, address });
    res.json({ success: true, userId: result[0].UserId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    await executeQuery('DELETE FROM Users WHERE LOWER(Email) = LOWER(@email)', { email });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings API
app.get('/api/settings', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Settings');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { storeName, storeEmail, storePhone, currencySymbol, contactPhones, contactEmails, contactAddress } = req.body;
    const query = `
      UPDATE Settings
      SET StoreName = @storeName,
          StoreEmail = @storeEmail,
          StorePhone = @storePhone,
          CurrencySymbol = @currencySymbol,
          ContactPhones = @contactPhones,
          ContactEmails = @contactEmails,
          ContactAddress = @contactAddress
      WHERE SettingId = 1;
    `;
    await executeQuery(query, {
      storeName,
      storeEmail,
      storePhone,
      currencySymbol,
      contactPhones,
      contactEmails,
      contactAddress
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Newsletter / 10% first-order discount
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    await ensureNewsletterTable();
    const existing = await executeQuery(
      'SELECT DiscountUsed FROM NewsletterSubscribers WHERE LOWER(Email) = @email',
      { email }
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        message: 'Already subscribed',
        eligible: !existing[0].DiscountUsed,
        discountPercent: 10
      });
    }

    await executeQuery('INSERT INTO NewsletterSubscribers (Email) VALUES (@email)', { email });
    res.json({ success: true, eligible: true, discountPercent: 10 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/newsletter/discount', async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) return res.json({ eligible: false });

    await ensureNewsletterTable();
    const rows = await executeQuery(
      'SELECT DiscountUsed FROM NewsletterSubscribers WHERE LOWER(Email) = @email',
      { email }
    );

    if (rows.length === 0) return res.json({ eligible: false });
    res.json({ eligible: !rows[0].DiscountUsed, discountPercent: 10 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/newsletter/use-discount', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false });

    await ensureNewsletterTable();
    await executeQuery(
      'UPDATE NewsletterSubscribers SET DiscountUsed = 1 WHERE LOWER(Email) = @email',
      { email }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reviews API
function slugifyProductName(name) {
  return (name || '').toLowerCase().replace(/\s+/g, '-');
}

app.get('/api/reviews', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Reviews ORDER BY CreatedAt DESC');
    const reviews = result.map((r) => ({
      ReviewId: r.ReviewId,
      ProductId: r.ProductId,
      ProductName: r.ProductName,
      UserName: r.UserName,
      UserEmail: r.UserEmail,
      Rating: r.Rating,
      Review: r.Review,
      AdminReply: r.AdminReply,
      CreatedAt: r.CreatedAt,
      ItemId: slugifyProductName(r.ProductName)
    }));
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { itemId, itemName, userName, userEmail, rating, review } = req.body;

    if (!itemName || !userName || !userEmail || !rating || !review) {
      return res.status(400).json({ error: 'Missing required review fields' });
    }

    const products = await executeQuery(
      `SELECT ProductId, Name FROM Products
       WHERE LOWER(REPLACE(Name, ' ', '-')) = @itemId OR Name = @itemName`,
      { itemId: itemId || '', itemName }
    );
    const productId = products.length > 0 ? products[0].ProductId : null;

    const query = `
      INSERT INTO Reviews (ProductId, ProductName, UserName, UserEmail, Rating, Review)
      VALUES (@productId, @productName, @userName, @userEmail, @rating, @review);
      SELECT SCOPE_IDENTITY() as ReviewId;
    `;
    const result = await executeQuery(query, {
      productId,
      productName: itemName,
      userName,
      userEmail,
      rating,
      review
    });

    res.json({
      success: true,
      ReviewId: result[0].ReviewId,
      ItemId: itemId || slugifyProductName(itemName),
      ProductName: itemName,
      UserName: userName,
      UserEmail: userEmail,
      Rating: rating,
      Review: review,
      CreatedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reviews', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Reviews');
    res.json({ success: true, message: 'All reviews deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM Reviews WHERE ReviewId = @id', { id });
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset order numbers
app.post('/api/orders/reset', async (req, res) => {
  try {
    await executeQuery('DBCC CHECKIDENT (\'Orders\', RESEED, 0)');
    res.json({ success: true, message: 'Order numbers reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review, adminReply } = req.body;

    if (adminReply !== undefined) {
      await executeQuery(
        'UPDATE Reviews SET AdminReply = @adminReply WHERE ReviewId = @id',
        { id, adminReply }
      );
    }
    if (rating !== undefined && review !== undefined) {
      await executeQuery(
        'UPDATE Reviews SET Rating = @rating, Review = @review WHERE ReviewId = @id',
        { id, rating, review }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend UI
const uiPath = path.join(__dirname, '..', 'deepan-clothing');
console.log('Serving static files from:', uiPath);
app.use(express.static(uiPath));
app.get('/', (req, res) => {
  res.sendFile(path.join(uiPath, 'index.html'));
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`UI: http://localhost:${PORT}/`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use. Stop the other process or change PORT in server/.env`);
    process.exit(1);
  }
  throw err;
});
