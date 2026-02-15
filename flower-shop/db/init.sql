-- Flower Shop Database Initialization
-- Creates tables and seeds sample data

-- Session store table (for connect-pg-simple)
CREATE TABLE IF NOT EXISTS "user_sessions" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL,
  PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "user_sessions" ("expire");

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flowers table
CREATE TABLE IF NOT EXISTS flowers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category VARCHAR(50),
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    flower_id INTEGER REFERENCES flowers(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed flower data with real Unsplash images
INSERT INTO flowers (name, description, price, image_url, category) VALUES
('Red Rose Bouquet', 'A classic symbol of love and passion. Hand-picked vibrant red roses arranged in a stunning bouquet.', 24.99, 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=400&fit=crop', 'Roses'),
('Sunflower Bundle', 'Bright and cheerful sunflowers that bring warmth and happiness to any room. Farm-fresh quality.', 18.99, 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&h=400&fit=crop', 'Seasonal'),
('White Lily Arrangement', 'Elegant white lilies symbolizing purity and refined beauty. Perfect for special occasions.', 29.99, 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=400&fit=crop', 'Lilies'),
('Pink Tulip Collection', 'Delicate pink tulips representing grace, elegance, and perfect love. Spring favorites.', 21.99, 'https://images.unsplash.com/photo-1589994160839-163cd867cfe8?w=400&h=400&fit=crop', 'Tulips'),
('Lavender Bouquet', 'Fragrant lavender bundle for relaxation and a touch of purple elegance. Naturally calming.', 16.99, 'https://images.unsplash.com/photo-1468327768560-75b778cbb551?w=400&h=400&fit=crop', 'Specialty'),
('Cherry Blossom Branch', 'Stunning cherry blossom branches celebrating the beauty of spring. Limited seasonal availability.', 34.99, 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=400&fit=crop', 'Seasonal'),
('Purple Orchid', 'Exotic and luxurious orchids that add sophistication to any space. Long-lasting blooms.', 39.99, 'https://images.unsplash.com/photo-1566873535350-a3f5d4a804b7?w=400&h=400&fit=crop', 'Exotic'),
('Mixed Daisy Bouquet', 'A cheerful mix of colorful daisies to brighten your day instantly. Great everyday flowers.', 14.99, 'https://images.unsplash.com/photo-1606041011872-596597976b25?w=400&h=400&fit=crop', 'Classic');
