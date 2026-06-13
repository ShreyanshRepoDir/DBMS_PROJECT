-- schema.sql

-- Drop existing tables
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'agent', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    rating NUMERIC(3, 2) DEFAULT 0.00
);

CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    agent_id INT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    city VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    type VARCHAR(50) NOT NULL CHECK (type IN ('apartment', 'house', 'villa', 'commercial')),
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'maintenance')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (end_date > start_date)
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INT UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    method VARCHAR(50) NOT NULL CHECK (method IN ('credit_card', 'paypal', 'bank_transfer')),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id INT UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favorites (
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, property_id)
);

-- Indexes
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Triggers
-- 1. After a booking is confirmed, set property status = 'booked'
CREATE OR REPLACE FUNCTION update_property_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' THEN
        UPDATE properties SET status = 'booked' WHERE id = NEW.property_id;
    END IF;
    -- If booking cancelled/completed, maybe free up? Let's assume handled manually or by another job, but let's free it up if cancelled
    IF NEW.status = 'cancelled' OR NEW.status = 'completed' THEN
         UPDATE properties SET status = 'available' WHERE id = NEW.property_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_status_change
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_property_status();

-- 2. Prevent duplicate active bookings on same property (overlapping dates not strictly requested, but "prevent duplicate active bookings on same property" is)
-- Let's define active as status IN ('pending', 'confirmed')
CREATE OR REPLACE FUNCTION prevent_duplicate_bookings()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM bookings
        WHERE property_id = NEW.property_id
          AND status IN ('pending', 'confirmed')
          AND id != COALESCE(NEW.id, 0)
    ) THEN
        RAISE EXCEPTION 'Property already has an active booking.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_booking
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.status IN ('pending', 'confirmed'))
EXECUTE FUNCTION prevent_duplicate_bookings();

-- PostgreSQL Functions

-- 1. confirm_booking(booking_id, amount, method) — wraps booking + payment insert in a transaction
CREATE OR REPLACE FUNCTION confirm_booking(p_booking_id INT, p_amount NUMERIC, p_method VARCHAR)
RETURNS VOID AS $$
BEGIN
    -- Insert payment
    INSERT INTO payments (booking_id, amount, method)
    VALUES (p_booking_id, p_amount, p_method);

    -- Update booking status
    UPDATE bookings SET status = 'confirmed' WHERE id = p_booking_id;
END;
$$ LANGUAGE plpgsql;

-- 2. get_agent_stats(agent_id) — returns total bookings, revenue, avg rating
CREATE OR REPLACE FUNCTION get_agent_stats(p_agent_id INT)
RETURNS TABLE (
    total_bookings BIGINT,
    total_revenue NUMERIC,
    avg_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(b.id) AS total_bookings,
        COALESCE(SUM(p.amount), 0) AS total_revenue,
        COALESCE(AVG(r.rating), 0) AS avg_rating
    FROM properties prop
    LEFT JOIN bookings b ON b.property_id = prop.id AND b.status = 'confirmed'
    LEFT JOIN payments p ON p.booking_id = b.id
    LEFT JOIN reviews r ON r.booking_id = b.id
    WHERE prop.agent_id = p_agent_id;
END;
$$ LANGUAGE plpgsql;


-- Seed Data

-- Hashed passwords for 'password123'
-- admin@test.com
-- agent@test.com
-- customer@test.com

INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@test.com', '$2b$10$WwO03164GfMWe.hWJ7pQJ.G8oM9w3h2Q.Y6t2iU/r7F580w6x0sO2', 'admin'),
('Agent Smith', 'agent@test.com', '$2b$10$WwO03164GfMWe.hWJ7pQJ.G8oM9w3h2Q.Y6t2iU/r7F580w6x0sO2', 'agent'),
('John Doe', 'customer@test.com', '$2b$10$WwO03164GfMWe.hWJ7pQJ.G8oM9w3h2Q.Y6t2iU/r7F580w6x0sO2', 'customer');

INSERT INTO agents (user_id, bio, rating) VALUES
(2, 'Top real estate agent in the city.', 4.8);

INSERT INTO properties (agent_id, title, description, city, price, type, status) VALUES
(1, 'Luxury Villa', 'Beautiful 4 bedroom villa with pool', 'Miami', 500000, 'villa', 'available'),
(1, 'Downtown Apartment', 'Modern apartment in city center', 'New York', 250000, 'apartment', 'available'),
(1, 'Suburban House', 'Quiet family home', 'Chicago', 300000, 'house', 'available'),
(1, 'Commercial Space', 'Large office space', 'San Francisco', 800000, 'commercial', 'available'),
(1, 'Beachfront Condo', 'Stunning ocean views', 'Miami', 450000, 'apartment', 'available');

-- Some initial completed bookings to allow reviews
INSERT INTO bookings (user_id, property_id, start_date, end_date, status) VALUES
(3, 1, '2023-01-01', '2023-01-10', 'completed'),
(3, 2, '2023-02-01', '2023-02-05', 'completed'),
(3, 3, '2026-12-01', '2026-12-10', 'pending');

INSERT INTO payments (booking_id, amount, method) VALUES
(1, 500000, 'credit_card'),
(2, 250000, 'paypal');

INSERT INTO reviews (booking_id, user_id, rating, comment) VALUES
(1, 3, 5, 'Absolutely amazing place!'),
(2, 3, 4, 'Great location, slightly noisy.');
