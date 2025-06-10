-- Seed initial data for testing

-- Insert departments
INSERT INTO departments (name) VALUES 
('Human Resources'),
('Information Technology'),
('Finance'),
('Marketing'),
('Operations');

-- Insert admin user (password: admin123)
INSERT INTO users (first_name, last_name, email, password_hash, role, department_id) VALUES 
('Admin', 'User', 'admin@company.com', '$2b$10$rQZ8kHWiZ8.vQGJ5vQGJ5uO8kHWiZ8.vQGJ5vQGJ5uO8kHWiZ8.vQ', 'administrator', 2);

-- Insert sample users (password: user123)
INSERT INTO users (first_name, last_name, email, password_hash, role, department_id) VALUES 
('John', 'Doe', 'john.doe@company.com', '$2b$10$rQZ8kHWiZ8.vQGJ5vQGJ5uO8kHWiZ8.vQGJ5vQGJ5uO8kHWiZ8.vQ', 'user', 1),
('Jane', 'Smith', 'jane.smith@company.com', '$2b$10$rQZ8kHWiZ8.vQGJ5vQGJ5uO8kHWiZ8.vQGJ5vQGJ5uO8kHWiZ8.vQ', 'user', 2),
('Mike', 'Johnson', 'mike.johnson@company.com', '$2b$10$rQZ8kHWiZ8.vQGJ5vQGJ5uO8kHWiZ8.vQGJ5vQGJ5uO8kHWiZ8.vQ', 'user', 3),
('Sarah', 'Wilson', 'sarah.wilson@company.com', '$2b$10$rQZ8kHWiZ8.vQGJ5vQGJ5uO8kHWiZ8.vQGJ5vQGJ5uO8kHWiZ8.vQ', 'user', 4);
