-- Create Database
CREATE DATABASE DeepanClothingDB;
GO

USE DeepanClothingDB;
GO

-- Products Table
CREATE TABLE Products (
    ProductId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Image NVARCHAR(MAX),
    Sizes NVARCHAR(MAX), -- JSON string
    Description NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Orders Table
CREATE TABLE Orders (
    OrderId INT IDENTITY(1,1) PRIMARY KEY,
    Items NVARCHAR(MAX) NOT NULL, -- JSON string
    Total DECIMAL(10,2) NOT NULL,
    Shipping NVARCHAR(MAX), -- JSON string
    Status NVARCHAR(50) DEFAULT 'pending',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Users Table
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Name NVARCHAR(255),
    Phone NVARCHAR(20),
    Address NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Cart Table
CREATE TABLE Cart (
    CartId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NULL,
    Items NVARCHAR(MAX), -- JSON string
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

-- Settings Table
CREATE TABLE Settings (
    SettingId INT IDENTITY(1,1) PRIMARY KEY,
    StoreName NVARCHAR(255) DEFAULT 'Deepan Clothing',
    StoreEmail NVARCHAR(255) DEFAULT 'info@deepanclothing.com',
    StorePhone NVARCHAR(50) DEFAULT '+94 11 234 5678',
    CurrencySymbol NVARCHAR(10) DEFAULT 'Rs.',
    ContactPhones NVARCHAR(MAX),
    ContactEmails NVARCHAR(MAX),
    ContactAddress NVARCHAR(MAX),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Insert default settings
INSERT INTO Settings (StoreName, StoreEmail, StorePhone, CurrencySymbol, ContactPhones, ContactEmails, ContactAddress)
VALUES (
    'Deepan Clothing',
    'info@deepanclothing.com',
    '+94 11 234 5678',
    'Rs.',
    '+94 77 123 4567
+94 11 234 5678',
    'info@deepanclothing.lk
orders@deepanclothing.lk',
    'No. 45, Galle Road,
Colombo 03,
Sri Lanka'
);
GO

-- Newsletter Subscribers (10% first-order discount)
CREATE TABLE NewsletterSubscribers (
    SubscriberId INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    DiscountUsed BIT DEFAULT 0,
    SubscribedAt DATETIME DEFAULT GETDATE()
);
GO

-- Reviews Table
CREATE TABLE Reviews (
    ReviewId INT IDENTITY(1,1) PRIMARY KEY,
    ProductId INT,
    ProductName NVARCHAR(255),
    UserName NVARCHAR(255),
    UserEmail NVARCHAR(255),
    Rating INT CHECK (Rating >= 1 AND Rating <= 5),
    Review NVARCHAR(MAX),
    AdminReply NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProductId) REFERENCES Products(ProductId)
);
GO

-- Messages Table
CREATE TABLE Messages (
    MessageId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(50),
    Message NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Create Indexes for better performance
CREATE INDEX idx_products_category ON Products(Category);
CREATE INDEX idx_orders_status ON Orders(Status);
CREATE INDEX idx_orders_created ON Orders(CreatedAt);
CREATE INDEX idx_reviews_product ON Reviews(ProductId);
GO
