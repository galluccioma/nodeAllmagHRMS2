-- Create user-department junction table for multiple department assignments
CREATE TABLE IF NOT EXISTS user_departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    department_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_department (user_id, department_id)
);

-- Migrate existing single department assignments to junction table
INSERT INTO user_departments (user_id, department_id)
SELECT id, department_id 
FROM users 
WHERE department_id IS NOT NULL;

-- Update documents query to work with multiple departments
-- Update notes query to work with multiple departments

-- Add index for better performance
CREATE INDEX idx_user_departments_user ON user_departments(user_id);
CREATE INDEX idx_user_departments_dept ON user_departments(department_id);
