-- Seed initial data for testing

-- Insert sample departments
INSERT INTO departments (name) VALUES
('Human Resources'),
('Information Technology'),
('Finance'),
('Marketing'),
('Operations');

-- Insert sample users (password_hash is 'password123' hashed)
INSERT INTO users (first_name, last_name, email, password_hash, role, department_id) VALUES
('John', 'Doe', 'john.doe@example.com', '$2b$10$YourHashedPasswordHere', 'administrator', 1),
('Jane', 'Smith', 'jane.smith@example.com', '$2b$10$YourHashedPasswordHere', 'user', 2),
('Bob', 'Johnson', 'bob.johnson@example.com', '$2b$10$YourHashedPasswordHere', 'user', 3),
('Alice', 'Williams', 'alice.williams@example.com', '$2b$10$YourHashedPasswordHere', 'user', 4),
('Charlie', 'Brown', 'charlie.brown@example.com', '$2b$10$YourHashedPasswordHere', 'user', 5);

-- Insert sample documents
INSERT INTO documents (title, description, file_name, file_size, mime_type, uploaded_by) VALUES
('Employee Handbook', 'Company policies and procedures', 'handbook.pdf', 1024, 'application/pdf', 1),
('IT Security Guidelines', 'Security best practices', 'security.pdf', 2048, 'application/pdf', 2),
('Financial Report Q1', 'Q1 financial overview', 'q1_report.pdf', 3072, 'application/pdf', 3);

-- Insert sample notes
INSERT INTO notes (title, content, created_by) VALUES
('Team Meeting Notes', 'Discussed project timeline and deliverables', 1),
('Client Call Summary', 'Client requested new features', 2),
('Training Schedule', 'Upcoming training sessions for new employees', 3);

-- Set up document visibility
INSERT INTO document_department_visibility (document_id, department_id) VALUES
(1, 1), -- Employee Handbook visible to HR
(2, 2), -- IT Security Guidelines visible to IT
(3, 3); -- Financial Report visible to Finance

-- Set up note visibility
INSERT INTO note_department_visibility (note_id, department_id) VALUES
(1, 1), -- Team Meeting Notes visible to HR
(2, 2), -- Client Call Summary visible to IT
(3, 3); -- Training Schedule visible to Finance

-- Insert some sample notifications
INSERT INTO notifications (user_id, title, message, type, reference_id) VALUES
(1, 'New Document Uploaded', 'Employee Handbook has been updated', 'document', 1),
(2, 'New Note Created', 'Team Meeting Notes have been shared', 'note', 1),
(3, 'Document Access Granted', 'You now have access to Financial Report Q1', 'document', 3);
