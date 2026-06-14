-- schema.sql

-- Drop existing tables
DROP VIEW IF EXISTS property_living_scores CASCADE;
DROP TABLE IF EXISTS transfer_approvals CASCADE;
DROP TABLE IF EXISTS transfer_requests CASCADE;
DROP TABLE IF EXISTS room_transfers CASCADE;
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
    rating_food INT NOT NULL CHECK (rating_food BETWEEN 1 AND 10),
    rating_wifi INT NOT NULL CHECK (rating_wifi BETWEEN 1 AND 10),
    rating_safety INT NOT NULL CHECK (rating_safety BETWEEN 1 AND 10),
    rating_study_env INT NOT NULL CHECK (rating_study_env BETWEEN 1 AND 10),
    rating_water INT NOT NULL CHECK (rating_water BETWEEN 1 AND 10),
    rating_cleanliness INT NOT NULL CHECK (rating_cleanliness BETWEEN 1 AND 10),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW property_living_scores AS
SELECT 
    b.property_id,
    ROUND(AVG(
        (r.rating_food + r.rating_wifi + r.rating_safety + r.rating_study_env + r.rating_water + r.rating_cleanliness) / 6.0
    ), 2) AS living_score,
    ROUND(AVG(r.rating_food), 1) as avg_food,
    ROUND(AVG(r.rating_wifi), 1) as avg_wifi,
    ROUND(AVG(r.rating_safety), 1) as avg_safety,
    ROUND(AVG(r.rating_study_env), 1) as avg_study_env,
    ROUND(AVG(r.rating_water), 1) as avg_water,
    ROUND(AVG(r.rating_cleanliness), 1) as avg_cleanliness,
    COUNT(r.id) as total_reviews
FROM reviews r
JOIN bookings b ON r.booking_id = b.id
GROUP BY b.property_id;

CREATE TABLE favorites (
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, property_id)
);

CREATE TABLE room_transfers (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'matched', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transfer_requests (
    id SERIAL PRIMARY KEY,
    transfer_id INT NOT NULL REFERENCES room_transfers(id) ON DELETE CASCADE,
    requester_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transfer_approvals (
    id SERIAL PRIMARY KEY,
    request_id INT UNIQUE NOT NULL REFERENCES transfer_requests(id) ON DELETE CASCADE,
    approved_by INT NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
('John Doe', 'customer@test.com', '$2b$10$WwO03164GfMWe.hWJ7pQJ.G8oM9w3h2Q.Y6t2iU/r7F580w6x0sO2', 'customer'),
('Jane Student', 'student2@test.com', '$2b$10$WwO03164GfMWe.hWJ7pQJ.G8oM9w3h2Q.Y6t2iU/r7F580w6x0sO2', 'customer');

INSERT INTO agents (user_id, bio, rating) VALUES
(2, 'Top real estate agent in the city.', 4.8);

INSERT INTO properties (agent_id, title, description, city, price, type, status) VALUES
(1, 'Student PG A', 'Premium PG with fast wifi and 3 meals', 'Bengaluru', 15000, 'apartment', 'available'),
(1, 'Student Hostel B', 'Affordable shared rooms near campus', 'Bengaluru', 8000, 'apartment', 'available'),
(1, 'Private Studio C', 'Quiet studio for serious students', 'Bengaluru', 20000, 'house', 'available'),
(1, 'Co-living Space D', 'Modern co-living with great study env', 'Bengaluru', 18000, 'apartment', 'available'),
(1, 'Shared Villa E', 'Luxury student living with pool', 'Bengaluru', 25000, 'villa', 'available');

-- Some initial completed bookings to allow reviews
INSERT INTO bookings (user_id, property_id, start_date, end_date, status) VALUES
(3, 1, '2023-01-01', '2023-01-10', 'completed'),
(3, 2, '2023-02-01', '2023-02-05', 'completed'),
(3, 3, '2026-12-01', '2026-12-10', 'confirmed');

INSERT INTO payments (booking_id, amount, method) VALUES
(1, 15000, 'credit_card'),
(2, 8000, 'paypal');

INSERT INTO reviews (booking_id, user_id, rating_food, rating_wifi, rating_safety, rating_study_env, rating_water, rating_cleanliness, comment) VALUES
(1, 3, 8, 9, 10, 8, 9, 9, 'Absolutely amazing place for students!'),
(2, 3, 6, 7, 8, 6, 7, 6, 'Great location, slightly noisy for studying.');
