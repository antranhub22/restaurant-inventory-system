-- =============================================
-- Restaurant Inventory Management Database Schema
-- Version: 1.0
-- Date: July 2025
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =============================================
-- CORE SYSTEM TABLES
-- =============================================

-- Categories for organizing items
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI
    sort_order INTEGER DEFAULT 0,
    parent_id INTEGER REFERENCES categories(id), -- For hierarchical categories
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Units of measurement
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- kg, chai, thùng, lít
    abbreviation VARCHAR(10) NOT NULL UNIQUE, -- kg, c, t, l
    type ENUM('weight', 'volume', 'count') NOT NULL,
    base_unit_id INTEGER REFERENCES units(id), -- For conversions
    conversion_factor DECIMAL(10,4), -- How many base units = 1 of this unit
    is_active BOOLEAN DEFAULT true
);

-- Insert common Vietnamese units
INSERT INTO units (name, abbreviation, type, conversion_factor) VALUES
('kilogram', 'kg', 'weight', 1.0),
('gram', 'g', 'weight', 0.001),
('lít', 'l', 'volume', 1.0),
('mililít', 'ml', 'volume', 0.001),
('chai', 'chai', 'count', 1.0),
('thùng', 'thùng', 'count', 24.0), -- Assuming 24 bottles per case
('bao', 'bao', 'count', 1.0),
('cây', 'cây', 'count', 1.0);

-- Suppliers information
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    tax_code VARCHAR(50),
    payment_terms TEXT,
    delivery_days INTEGER[], -- Days of week: 1=Monday, 7=Sunday
    average_delivery_time INTEGER, -- Hours
    rating DECIMAL(2,1) CHECK (rating >= 1.0 AND rating <= 5.0),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main items/products table
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    unit_id INTEGER REFERENCES units(id) NOT NULL,
    
    -- Pricing
    unit_cost DECIMAL(12,2), -- Cost per unit in VND
    selling_price DECIMAL(12,2), -- If applicable
    
    -- Stock management
    min_stock DECIMAL(10,2) DEFAULT 0,
    max_stock DECIMAL(10,2),
    reorder_point DECIMAL(10,2),
    
    -- Product details
    sku VARCHAR(100) UNIQUE, -- Stock Keeping Unit
    barcode VARCHAR(255),
    description TEXT,
    aliases TEXT[], -- Alternative names for OCR matching
    
    -- Perishability
    is_perishable BOOLEAN DEFAULT false,
    shelf_life_days INTEGER, -- Days from receipt to expiry
    storage_conditions TEXT, -- Cold, dry, frozen, etc.
    
    -- Supplier info
    primary_supplier_id INTEGER REFERENCES suppliers(id),
    secondary_supplier_id INTEGER REFERENCES suppliers(id),
    
    -- System fields
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER, -- Will reference users table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USER MANAGEMENT
-- =============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Role and permissions
    role ENUM('owner', 'manager', 'supervisor', 'staff') NOT NULL,
    department VARCHAR(100), -- kitchen_main, bar, storage, etc.
    permissions JSONB, -- Flexible permissions system
    
    -- Authentication
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    -- Profile
    avatar_url TEXT,
    language ENUM('vi', 'en') DEFAULT 'vi',
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    
    -- Audit
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens for JWT
CREATE TABLE user_refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    device_info JSONB -- Browser, OS, IP, etc.
);

-- =============================================
-- INVENTORY MANAGEMENT
-- =============================================

-- Current inventory levels
CREATE TABLE inventory (
    item_id INTEGER PRIMARY KEY REFERENCES items(id),
    
    -- Stock quantities
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    reserved_stock DECIMAL(10,2) DEFAULT 0, -- Allocated but not yet used
    available_stock DECIMAL(10,2) GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
    
    -- Value calculations
    average_cost DECIMAL(12,2), -- Weighted average cost
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (current_stock * average_cost) STORED,
    
    -- Stock status
    stock_status ENUM('in_stock', 'low_stock', 'out_of_stock', 'overstock'),
    
    -- Dates
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_counted TIMESTAMP, -- Last physical count
    next_expiry_date DATE, -- Earliest expiry date for this item
    
    -- Alerts
    low_stock_alert_sent BOOLEAN DEFAULT false,
    expiry_alert_sent BOOLEAN DEFAULT false,
    
    CONSTRAINT positive_stock CHECK (current_stock >= 0),
    CONSTRAINT valid_reserved CHECK (reserved_stock >= 0 AND reserved_stock <= current_stock)
);

-- Inventory batches for FIFO tracking and expiry management
CREATE TABLE inventory_batches (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id),
    batch_number VARCHAR(100), -- Supplier batch number or generated
    
    -- Quantities
    initial_quantity DECIMAL(10,2) NOT NULL,
    current_quantity DECIMAL(10,2) NOT NULL,
    reserved_quantity DECIMAL(10,2) DEFAULT 0,
    
    -- Costs and dates
    unit_cost DECIMAL(12,2) NOT NULL,
    received_date DATE NOT NULL,
    expiry_date DATE,
    manufactured_date DATE,
    
    -- Source information
    supplier_id INTEGER REFERENCES suppliers(id),
    purchase_order_id INTEGER, -- Will reference purchase_orders
    receipt_number VARCHAR(100),
    
    -- Status
    status ENUM('active', 'expired', 'consumed', 'damaged', 'returned') DEFAULT 'active',
    location VARCHAR(100), -- Storage location
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT positive_quantities CHECK (
        initial_quantity >= 0 AND 
        current_quantity >= 0 AND 
        current_quantity <= initial_quantity AND
        reserved_quantity >= 0 AND 
        reserved_quantity <= current_quantity
    )
);

-- =============================================
-- TRANSACTION SYSTEM
-- =============================================

-- All inventory movements
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated: TR-20250702-001
    
    -- Transaction type and details
    type ENUM('IN', 'OUT', 'RETURN', 'ADJUSTMENT', 'TRANSFER', 'WASTE', 'STAFF_USE', 'SAMPLING') NOT NULL,
    item_id INTEGER REFERENCES items(id) NOT NULL,
    batch_id INTEGER REFERENCES inventory_batches(id),
    
    -- Quantities and costs
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(12,2),
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (ABS(quantity) * COALESCE(unit_cost, 0)) STORED,
    
    -- Source/destination
    department VARCHAR(100), -- Which department initiated
    location_from VARCHAR(100),
    location_to VARCHAR(100),
    
    -- References
    reference_type ENUM('receipt', 'withdrawal_slip', 'return_slip', 'adjustment', 'pos_sale', 'manual') NOT NULL,
    reference_number VARCHAR(100), -- Receipt number, POS transaction, etc.
    parent_transaction_id INTEGER REFERENCES transactions(id), -- For returns/reversals
    
    -- Processing details
    processed_by INTEGER REFERENCES users(id) NOT NULL,
    approved_by INTEGER REFERENCES users(id),
    shift_id INTEGER, -- Which work shift
    
    -- OCR and automation
    source ENUM('manual', 'ocr', 'pos_sync', 'auto_adjustment') DEFAULT 'manual',
    ocr_confidence DECIMAL(3,2), -- 0.00 to 1.00
    original_image_url TEXT,
    ocr_raw_data JSONB, -- Store original OCR extraction
    
    -- Status and workflow
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'approved',
    requires_approval BOOLEAN DEFAULT false,
    
    -- Audit and notes
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    
    CONSTRAINT valid_quantity CHECK (
        (type IN ('IN', 'RETURN') AND quantity > 0) OR 
        (type IN ('OUT', 'WASTE', 'STAFF_USE', 'SAMPLING') AND quantity > 0) OR
        (type = 'ADJUSTMENT')
    )
);

-- =============================================
-- RECONCILIATION SYSTEM
-- =============================================

-- Department-based reconciliation tracking
CREATE TABLE department_reconciliation (
    id SERIAL PRIMARY KEY,
    
    -- Identification
    department VARCHAR(100) NOT NULL,
    item_id INTEGER REFERENCES items(id) NOT NULL,
    shift_date DATE NOT NULL,
    shift_type ENUM('morning', 'afternoon', 'evening', 'night') NOT NULL,
    shift_id INTEGER, -- Reference to shifts table if needed
    
    -- Reconciliation quantities
    opening_stock DECIMAL(10,2) DEFAULT 0, -- Stock at start of shift
    withdrawn DECIMAL(10,2) DEFAULT 0,     -- Total taken from storage
    sold DECIMAL(10,2) DEFAULT 0,          -- Sold to customers (from POS)
    returned DECIMAL(10,2) DEFAULT 0,      -- Returned to storage
    wasted DECIMAL(10,2) DEFAULT 0,        -- Damaged/spoiled/broken
    staff_consumed DECIMAL(10,2) DEFAULT 0, -- Staff meals/drinks
    sampled DECIMAL(10,2) DEFAULT 0,       -- Customer tastings
    transferred_out DECIMAL(10,2) DEFAULT 0, -- Sent to other departments
    transferred_in DECIMAL(10,2) DEFAULT 0,  -- Received from other departments
    
    -- Calculated fields
    expected_remaining DECIMAL(10,2) GENERATED ALWAYS AS (
        opening_stock + withdrawn + transferred_in - sold - returned - wasted - staff_consumed - sampled - transferred_out
    ) STORED,
    
    actual_remaining DECIMAL(10,2), -- Manually entered or auto-calculated
    discrepancy DECIMAL(10,2) GENERATED ALWAYS AS (expected_remaining - COALESCE(actual_remaining, expected_remaining)) STORED,
    
    discrepancy_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN withdrawn > 0 THEN (ABS(discrepancy) / withdrawn) * 100 
            ELSE 0 
        END
    ) STORED,
    
    discrepancy_value DECIMAL(12,2), -- Monetary impact
    
    -- Status and workflow
    status ENUM('open', 'pending_review', 'acceptable', 'warning', 'investigation', 'critical', 'resolved') DEFAULT 'open',
    alert_level ENUM('none', 'low', 'medium', 'high', 'critical') GENERATED ALWAYS AS (
        CASE 
            WHEN ABS(discrepancy_rate) <= 2 THEN 'none'
            WHEN ABS(discrepancy_rate) <= 5 THEN 'low'
            WHEN ABS(discrepancy_rate) <= 10 THEN 'medium'
            WHEN ABS(discrepancy_rate) <= 20 THEN 'high'
            ELSE 'critical'
        END
    ) STORED,
    
    requires_approval BOOLEAN DEFAULT false,
    auto_approved BOOLEAN DEFAULT false,
    
    -- Approval workflow
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    resolution_notes TEXT,
    
    -- Audit
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(department, item_id, shift_date, shift_type)
);

-- Discrepancy reports for detailed explanations
CREATE TABLE discrepancy_reports (
    id SERIAL PRIMARY KEY,
    reconciliation_id INTEGER REFERENCES department_reconciliation(id) NOT NULL,
    
    -- Report details
    reason_code ENUM('breakage', 'spoilage', 'theft', 'measurement_error', 'data_entry_error', 'sampling_excess', 'unknown') NOT NULL,
    description TEXT NOT NULL,
    estimated_loss_value DECIMAL(12,2),
    
    -- Evidence and documentation
    photo_evidence TEXT[], -- Array of image URLs
    witness_statements TEXT[],
    corrective_actions TEXT,
    
    -- Workflow
    reported_by INTEGER REFERENCES users(id) NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP,
    
    status ENUM('submitted', 'under_review', 'verified', 'approved', 'rejected') DEFAULT 'submitted',
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_notes TEXT
);

-- =============================================
-- POS INTEGRATION
-- =============================================

-- POS systems configuration
CREATE TABLE pos_systems (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- Square, Toast, etc.
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    location_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    sync_frequency INTEGER DEFAULT 300, -- Seconds between syncs
    configuration JSONB -- System-specific settings
);

-- Menu items mapping POS to inventory
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    pos_system_id INTEGER REFERENCES pos_systems(id),
    pos_item_id VARCHAR(255) NOT NULL, -- ID in POS system
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    selling_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe/composition of menu items
CREATE TABLE menu_item_ingredients (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) NOT NULL, -- Inventory item used
    quantity_per_serving DECIMAL(10,3) NOT NULL, -- How much inventory item per menu item
    is_optional BOOLEAN DEFAULT false,
    
    UNIQUE(menu_item_id, item_id)
);

-- Sales data from POS
CREATE TABLE pos_sales (
    id SERIAL PRIMARY KEY,
    pos_system_id INTEGER REFERENCES pos_systems(id),
    pos_transaction_id VARCHAR(255) NOT NULL,
    
    -- Sale details
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    
    -- Timing
    sale_timestamp TIMESTAMP NOT NULL,
    shift_date DATE GENERATED ALWAYS AS (sale_timestamp::date) STORED,
    shift_type ENUM('morning', 'afternoon', 'evening', 'night') GENERATED ALWAYS AS (
        CASE 
            WHEN EXTRACT(hour FROM sale_timestamp) BETWEEN 6 AND 11 THEN 'morning'
            WHEN EXTRACT(hour FROM sale_timestamp) BETWEEN 12 AND 17 THEN 'afternoon'
            WHEN EXTRACT(hour FROM sale_timestamp) BETWEEN 18 AND 22 THEN 'evening'
            ELSE 'night'
        END
    ) STORED,
    
    -- Status
    processed_for_inventory BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(pos_system_id, pos_transaction_id, menu_item_id)
);

-- =============================================
-- PURCHASING AND RECEIVING
-- =============================================

-- Purchase orders
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id) NOT NULL,
    
    -- Dates
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Status
    status ENUM('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled') DEFAULT 'draft',
    
    -- Totals
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (subtotal + tax_amount) STORED,
    
    -- Workflow
    created_by INTEGER REFERENCES users(id) NOT NULL,
    approved_by INTEGER REFERENCES users(id),
    
    -- Delivery
    delivery_address TEXT,
    delivery_instructions TEXT,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase order line items
CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) NOT NULL,
    
    -- Ordering
    ordered_quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(12,2) GENERATED ALWAYS AS (ordered_quantity * unit_cost) STORED,
    
    -- Receiving
    received_quantity DECIMAL(10,2) DEFAULT 0,
    remaining_quantity DECIMAL(10,2) GENERATED ALWAYS AS (ordered_quantity - received_quantity) STORED,
    
    -- Quality
    quality_notes TEXT,
    accepted_quantity DECIMAL(10,2),
    rejected_quantity DECIMAL(10,2),
    
    CONSTRAINT valid_received CHECK (received_quantity >= 0 AND received_quantity <= ordered_quantity),
    CONSTRAINT valid_quality CHECK (
        COALESCE(accepted_quantity, 0) + COALESCE(rejected_quantity, 0) <= received_quantity
    )
);

-- =============================================
-- REPORTING AND ANALYTICS
-- =============================================

-- Predefined reports configuration
CREATE TABLE report_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type ENUM('inventory_summary', 'loss_analysis', 'department_performance', 'supplier_analysis', 'financial_summary') NOT NULL,
    parameters JSONB, -- Configurable parameters
    sql_query TEXT, -- Pre-built query
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated reports history
CREATE TABLE report_executions (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES report_templates(id),
    name VARCHAR(255) NOT NULL,
    
    -- Parameters used
    date_from DATE,
    date_to DATE,
    departments TEXT[],
    categories INTEGER[],
    parameters JSONB,
    
    -- Output
    report_data JSONB, -- The actual report data
    file_url TEXT, -- If exported to file
    format ENUM('json', 'csv', 'excel', 'pdf') DEFAULT 'json',
    
    -- Status
    status ENUM('generating', 'completed', 'failed') DEFAULT 'generating',
    error_message TEXT,
    
    -- Audit
    generated_by INTEGER REFERENCES users(id) NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP -- Auto-cleanup old reports
);

-- =============================================
-- SYSTEM CONFIGURATION
-- =============================================

-- System settings
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    data_type ENUM('string', 'number', 'boolean', 'json') NOT NULL,
    description TEXT,
    category VARCHAR(50), -- inventory, ocr, alerts, etc.
    is_editable BOOLEAN DEFAULT true,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO system_settings (key, value, data_type, description, category) VALUES
('inventory.low_stock_threshold', '0.1', 'number', 'Percentage of min_stock that triggers low stock alert', 'inventory'),
('inventory.overstock_threshold', '1.1', 'number', 'Percentage of max_stock that triggers overstock alert', 'inventory'),
('reconciliation.auto_approve_threshold', '2.0', 'number', 'Discrepancy percentage below which auto-approval occurs', 'reconciliation'),
('reconciliation.critical_threshold', '10.0', 'number', 'Discrepancy percentage above which critical alert is sent', 'reconciliation'),
('ocr.confidence_threshold', '0.85', 'number', 'Minimum confidence score to auto-accept OCR results', 'ocr'),
('alerts.email_enabled', 'true', 'boolean', 'Enable email notifications', 'alerts'),
('alerts.real_time_enabled', 'true', 'boolean', 'Enable real-time WebSocket alerts', 'alerts');

-- Audit trail for all changes
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Primary search and filter indexes
CREATE INDEX idx_items_active ON items(name) WHERE is_active = true;
CREATE INDEX idx_items_category ON items(category_id) WHERE is_active = true;
CREATE INDEX idx_items_search ON items USING gin(to_tsvector('simple', name || ' ' || COALESCE(array_to_string(aliases, ' '), '')));

-- Transaction indexes
CREATE INDEX idx_transactions_date ON transactions(created_at DESC);
CREATE INDEX idx_transactions_item ON transactions(item_id, created_at DESC);
CREATE INDEX idx_transactions_department ON transactions(department, created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type, created_at DESC);
CREATE INDEX idx_transactions_pending ON transactions(status) WHERE status = 'pending';

-- Reconciliation indexes
CREATE INDEX idx_reconciliation_open ON department_reconciliation(status, shift_date) WHERE status != 'resolved';
CREATE INDEX idx_reconciliation_department ON department_reconciliation(department, shift_date DESC);
CREATE INDEX idx_reconciliation_alerts ON department_reconciliation(alert_level, created_at) WHERE alert_level != 'none';

-- Inventory indexes
CREATE INDEX idx_inventory_low_stock ON inventory(stock_status, item_id) WHERE stock_status = 'low_stock';
CREATE INDEX idx_inventory_value ON inventory(total_value DESC) WHERE total_value > 0;

-- Batch tracking indexes
CREATE INDEX idx_batches_expiry ON inventory_batches(expiry_date ASC) WHERE status = 'active' AND expiry_date IS NOT NULL;
CREATE INDEX idx_batches_item ON inventory_batches(item_id, received_date DESC) WHERE status = 'active';

-- POS integration indexes
CREATE INDEX idx_pos_sales_timestamp ON pos_sales(sale_timestamp DESC);
CREATE INDEX idx_pos_sales_unprocessed ON pos_sales(processed_for_inventory, sale_timestamp) WHERE processed_for_inventory = false;

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update inventory after transactions
CREATE OR REPLACE FUNCTION update_inventory_on_transaction()
RETURNS TRIGGER AS $
BEGIN
    -- Update current stock based on transaction type
    IF NEW.type = 'IN' THEN
        UPDATE inventory 
        SET current_stock = current_stock + NEW.quantity,
            last_updated = CURRENT_TIMESTAMP
        WHERE item_id = NEW.item_id;
        
        -- If no inventory record exists, create one
        INSERT INTO inventory (item_id, current_stock, last_updated)
        VALUES (NEW.item_id, NEW.quantity, CURRENT_TIMESTAMP)
        ON CONFLICT (item_id) DO NOTHING;
        
    ELSIF NEW.type IN ('OUT', 'WASTE', 'STAFF_USE', 'SAMPLING') THEN
        UPDATE inventory 
        SET current_stock = current_stock - NEW.quantity,
            last_updated = CURRENT_TIMESTAMP
        WHERE item_id = NEW.item_id;
        
    ELSIF NEW.type = 'RETURN' THEN
        UPDATE inventory 
        SET current_stock = current_stock + NEW.quantity,
            last_updated = CURRENT_TIMESTAMP
        WHERE item_id = NEW.item_id;
        
    ELSIF NEW.type = 'ADJUSTMENT' THEN
        UPDATE inventory 
        SET current_stock = current_stock + NEW.quantity, -- Can be negative for decreases
            last_updated = CURRENT_TIMESTAMP
        WHERE item_id = NEW.item_id;
    END IF;
    
    -- Update stock status
    UPDATE inventory 
    SET stock_status = CASE 
        WHEN current_stock <= 0 THEN 'out_of_stock'
        WHEN current_stock <= (SELECT min_stock FROM items WHERE id = NEW.item_id) THEN 'low_stock'
        WHEN current_stock >= (SELECT max_stock FROM items WHERE id = NEW.item_id) THEN 'overstock'
        ELSE 'in_stock'
    END
    WHERE item_id = NEW.item_id;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to automatically update inventory
CREATE TRIGGER trigger_update_inventory_on_transaction
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_transaction();

-- Function to generate transaction numbers
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TRIGGER AS $
BEGIN
    NEW.transaction_number := 'TR-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                              LPAD(NEXTVAL('transaction_sequence')::TEXT, 3, '0');
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Sequence for transaction numbering
CREATE SEQUENCE transaction_sequence START 1;

-- Trigger to auto-generate transaction numbers
CREATE TRIGGER trigger_generate_transaction_number
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION generate_transaction_number();

-- Function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), 
                COALESCE(current_setting('app.current_user_id', true)::integer, 0), 
                CURRENT_TIMESTAMP);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW),
                COALESCE(current_setting('app.current_user_id', true)::integer, 0), 
                CURRENT_TIMESTAMP);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW),
                COALESCE(current_setting('app.current_user_id', true)::integer, 0), 
                CURRENT_TIMESTAMP);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_items AFTER INSERT OR UPDATE OR DELETE ON items
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_inventory AFTER INSERT OR UPDATE OR DELETE ON inventory
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- BUSINESS RULES VIEWS
-- =============================================

-- View for current inventory status with alerts
CREATE VIEW v_inventory_status AS
SELECT 
    i.id,
    i.name,
    i.sku,
    c.name as category_name,
    u.name as unit_name,
    inv.current_stock,
    inv.available_stock,
    inv.stock_status,
    i.min_stock,
    i.max_stock,
    i.unit_cost,
    inv.total_value,
    inv.next_expiry_date,
    
    -- Alert calculations
    CASE 
        WHEN inv.current_stock <= 0 THEN 'OUT_OF_STOCK'
        WHEN inv.current_stock <= i.min_stock THEN 'LOW_STOCK'
        WHEN inv.next_expiry_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'EXPIRING_SOON'
        WHEN inv.current_stock >= i.max_stock THEN 'OVERSTOCK'
        ELSE 'OK'
    END as alert_status,
    
    -- Days until expiry
    CASE 
        WHEN inv.next_expiry_date IS NOT NULL 
        THEN inv.next_expiry_date - CURRENT_DATE 
        ELSE NULL 
    END as days_until_expiry,
    
    inv.last_updated,
    inv.last_counted
    
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN units u ON i.unit_id = u.id
LEFT JOIN inventory inv ON i.id = inv.item_id
WHERE i.is_active = true;

-- View for department performance summary
CREATE VIEW v_department_performance AS
SELECT 
    department,
    DATE_TRUNC('week', shift_date) as week_start,
    COUNT(*) as total_reconciliations,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
    AVG(ABS(discrepancy_rate)) as avg_discrepancy_rate,
    SUM(ABS(discrepancy_value)) as total_loss_value,
    COUNT(*) FILTER (WHERE alert_level = 'critical') as critical_alerts,
    COUNT(*) FILTER (WHERE requires_approval = true) as approvals_needed
FROM department_reconciliation
WHERE shift_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY department, DATE_TRUNC('week', shift_date)
ORDER BY week_start DESC, total_loss_value DESC;

-- View for item movement summary
CREATE VIEW v_item_movements AS
SELECT 
    i.id as item_id,
    i.name as item_name,
    c.name as category_name,
    DATE_TRUNC('day', t.created_at) as movement_date,
    
    SUM(CASE WHEN t.type = 'IN' THEN t.quantity ELSE 0 END) as total_in,
    SUM(CASE WHEN t.type = 'OUT' THEN t.quantity ELSE 0 END) as total_out,
    SUM(CASE WHEN t.type = 'WASTE' THEN t.quantity ELSE 0 END) as total_waste,
    SUM(CASE WHEN t.type = 'RETURN' THEN t.quantity ELSE 0 END) as total_returned,
    
    SUM(CASE WHEN t.type IN ('IN', 'RETURN') THEN t.total_value 
             WHEN t.type IN ('OUT', 'WASTE') THEN -t.total_value 
             ELSE 0 END) as net_value_change
             
FROM transactions t
JOIN items i ON t.item_id = i.id
LEFT JOIN categories c ON i.category_id = c.id
WHERE t.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY i.id, i.name, c.name, DATE_TRUNC('day', t.created_at)
ORDER BY movement_date DESC, net_value_change DESC;