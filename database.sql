-- Create database
CREATE DATABASE IF NOT EXISTS company_reviews_db;
USE company_reviews_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Insert sample data
INSERT INTO users (first_name, last_name, email, password, phone) VALUES
('John', 'Doe', 'john@example.com', '$2b$12$rSZ3S7k6q7V9q1W8XwBzO.DA4TZJkL8M9N0C1V2B3C4D5E6F7G8H9I', '+1234567890'),
('Jane', 'Smith', 'jane@example.com', '$2b$12$rSZ3S7k6q7V9q1W8XwBzO.DA4TZJkL8M9N0C1V2B3C4D5E6F7G8H9I', '+0987654321');

INSERT INTO reviews (user_id, title, content, rating) VALUES
(1, 'Excellent Service!', 'The team provided exceptional service and support throughout our project.', 5),
(2, 'Good experience', 'Professional and timely delivery of services.', 4),
(1, 'Could be better', 'The service was good but communication could be improved.', 3);