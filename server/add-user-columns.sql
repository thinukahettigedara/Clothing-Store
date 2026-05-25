USE DeepanClothingDB;
GO

-- Add Phone column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Phone')
BEGIN
    ALTER TABLE Users ADD Phone NVARCHAR(20);
END
GO

-- Add Address column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Address')
BEGIN
    ALTER TABLE Users ADD Address NVARCHAR(MAX);
END
GO

PRINT 'Phone and Address columns added to Users table successfully.';
