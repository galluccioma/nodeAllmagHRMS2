-- Aggiungi colonna per URL pubblico dei file
ALTER TABLE documents ADD COLUMN public_url VARCHAR(500) AFTER file_path;

-- Aggiorna i documenti esistenti (opzionale)
-- UPDATE documents SET public_url = CONCAT('/uploads/documents/', file_name) WHERE public_url IS NULL;
