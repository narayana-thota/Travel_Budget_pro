CREATE DATABASE IF NOT EXISTS travel_budget_pro;

USE travel_budget_pro;


-- ============================================
-- 1. USERS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 2. EXPENSE CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);


-- ============================================
-- 3. TRIPS
-- ============================================

CREATE TABLE IF NOT EXISTS trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    trip_name VARCHAR(150) NOT NULL,
    source VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    travelers INT NOT NULL,
    total_budget DECIMAL(12, 2) NOT NULL,
    status ENUM('Planned', 'Ongoing', 'Completed') DEFAULT 'Planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_trips_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_trip_travelers
        CHECK (travelers > 0),

    CONSTRAINT chk_trip_budget
        CHECK (total_budget >= 0),

    CONSTRAINT chk_trip_dates
        CHECK (end_date >= start_date)
);


-- ============================================
-- 4. EXPENSES
-- ============================================

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    category_id INT NOT NULL,
    expense_name VARCHAR(150) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    expense_date DATE NOT NULL,
    expense_type ENUM('Planned', 'Actual') NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_expenses_trip
        FOREIGN KEY (trip_id)
        REFERENCES trips(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_expenses_category
        FOREIGN KEY (category_id)
        REFERENCES expense_categories(id),

    CONSTRAINT chk_expense_amount
        CHECK (amount >= 0)
);


-- ============================================
-- DEFAULT EXPENSE CATEGORIES
-- ============================================

INSERT IGNORE INTO expense_categories
    (category_name, description)
VALUES
    ('Travel', 'Going and return transportation expenses'),

    ('Hotel', 'Accommodation and hotel expenses'),

    ('Food', 'Breakfast, lunch, dinner and other food expenses'),

    ('Shopping', 'Shopping and personal purchases'),

    ('Activities', 'Tourist attractions and activities'),

    ('Local Transport', 'Taxi, bus, metro, rental vehicle and local transportation'),

    ('Other', 'Other miscellaneous expenses');