-- ════════════════════════════════════════════════════════════
-- MASTER FIXPC - PRODUCTION DATABASE SCHEMA (MySQL)
-- ════════════════════════════════════════════════════════════

-- 1. Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    nit VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0.00,
    stock INT DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'unidad',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Projects (Quotes, Active Reports, Invoices)
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL, -- e.g., COT-001, INF-002, CC-003
    client_id VARCHAR(36),
    date DATE NOT NULL,
    time TIME NOT NULL,
    status ENUM('survey', 'quoted', 'in_progress', 'completed') DEFAULT 'survey',
    
    -- Difficulty Config (JSON stored as text for flexibility)
    difficulty_config JSON,
    
    signature TEXT, -- Base64 Signature or URL
    total DECIMAL(12, 2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- 4. Project Quote Items (Labor/Tasks)
CREATE TABLE IF NOT EXISTS project_items (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(8, 2) DEFAULT 1.00,
    unit_price DECIMAL(10, 2) DEFAULT 0.00,
    difficulty_multiplier DECIMAL(4, 2) DEFAULT 1.00,
    total DECIMAL(12, 2) DEFAULT 0.00,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 5. Project Resources (Rentals & Materials used)
CREATE TABLE IF NOT EXISTS project_resources (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('helper', 'tool', 'material') NOT NULL,
    quantity DECIMAL(8, 2) DEFAULT 1.00,
    unit_price DECIMAL(10, 2) DEFAULT 0.00,
    days INT DEFAULT 1,
    total DECIMAL(12, 2) DEFAULT 0.00,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 6. Project Activity Log (Bitácora)
CREATE TABLE IF NOT EXISTS project_activities (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    description TEXT NOT NULL,
    estimated_hours DECIMAL(5, 2) DEFAULT 0.00,
    price DECIMAL(10, 2) DEFAULT 0.00,
    authorized_by VARCHAR(255),
    recipient_name VARCHAR(255),
    recipient_signature TEXT, -- Base64 Signature
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
