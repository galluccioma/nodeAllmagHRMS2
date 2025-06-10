-- Add last_access column to users table
ALTER TABLE users ADD COLUMN last_access TIMESTAMP NULL;

-- Update last_access on login
DELIMITER //
CREATE TRIGGER update_last_access_on_login
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.password_hash != OLD.password_hash THEN
        SET NEW.last_access = CURRENT_TIMESTAMP;
    END IF;
END;//
DELIMITER ; 