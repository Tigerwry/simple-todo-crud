-- ============================================================
--  simple-todo-crud-batch18  |  MySQL schema
--  Run with:  mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS todo_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE todo_app;

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(255)  NOT NULL,
  email    VARCHAR(255)  NOT NULL UNIQUE,
  password VARCHAR(255)  NOT NULL
) ENGINE=InnoDB;

-- ---------- tasks ----------
CREATE TABLE IF NOT EXISTS tasks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  userId      INT           NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  description TEXT          NULL,
  dueDate     DATE          NULL,
  priority    ENUM('Low','Medium','High')   NOT NULL DEFAULT 'Medium',
  status      ENUM('Pending','Completed')   NOT NULL DEFAULT 'Pending',
  createdAt   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_user
    FOREIGN KEY (userId) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Helpful index for per-user task lookups & searches
CREATE INDEX idx_tasks_userId ON tasks (userId);
