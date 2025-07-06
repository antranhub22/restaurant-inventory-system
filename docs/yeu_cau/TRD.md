# Technical Requirements Document (TRD)
## Restaurant Inventory Management System with OCR

**Version:** 1.0  
**Date:** July 2025  
**Related:** BRD v1.0

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

### 1.1 High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Frontend  │    │  Admin Panel    │
│   (PWA/React)   │    │   (React/TS)    │    │   (React/TS)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼───────────────┐
                    │     API Gateway             │
                    │     (Express.js)            │
                    └─────────────┬───────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼───────┐       ┌─────────▼─────────┐       ┌───────▼───────┐
│   OCR Service │       │  Core API Service │       │ Analytics     │
│   (Vision API)│       │   (Node.js/TS)    │       │ Service       │
└───────────────┘       └─────────┬─────────┘       └───────────────┘
                                  │
                        ┌─────────▼─────────┐
                        │   Database Layer  │
                        │   (PostgreSQL)    │
                        └───────────────────┘
```

### 1.2 Technology Stack

#### Frontend Technologies
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS 3.x
- **State Management**: Zustand + React Query
- **Routing**: React Router 6
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Headless UI + Custom components
- **Mobile**: Progressive Web App (PWA)
- **Camera**: React Camera Pro
- **Charts**: Recharts
- **Build Tool**: Vite

#### Backend Technologies
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT + Refresh tokens
- **Validation**: Zod schemas
- **File Upload**: Multer + Sharp (image processing)
- **Database ORM**: Prisma
- **Caching**: Redis
- **Background Jobs**: Bull Queue
- **API Documentation**: OpenAPI 3.0 + Swagger UI

#### Database & Storage
- **Primary Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **File Storage**: Cloudinary (images) + Local storage (backup)
- **Search**: PostgreSQL Full-text search
- **Backup**: Automated daily snapshots

#### Third-Party Services
- **OCR Engine**: Google Vision API (primary), Tesseract.js (fallback)
- **AI Processing**: OpenAI API (smart matching)
- **Notifications**: Firebase Cloud Messaging
- **Analytics**: Custom implementation
- **Email**: SendGrid (optional)

#### Infrastructure & DevOps
- **Hosting**: Digital Ocean Droplets
- **CDN**: Cloudflare
- **SSL**: Let's Encrypt via Cloudflare
- **Process Management**: PM2
- **Monitoring**: Custom dashboard + Uptime Robot
- **CI/CD**: GitHub Actions
- **Environment**: Docker (optional)

---

## 2. DETAILED TECHNICAL SPECIFICATIONS

### 2.1 Database Architecture

#### 2.1.1 Core Tables Schema
```sql
-- Users and Authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('owner', 'manager', 'supervisor', 'staff') NOT NULL,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories and Items
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color_code VARCHAR(7), -- Hex color
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    unit VARCHAR(50) NOT NULL, -- kg, chai, thùng, etc.
    unit_cost DECIMAL(12,2),
    min_stock DECIMAL(10,2) DEFAULT 0,
    max_stock DECIMAL(10,2),
    expiry_days INTEGER, -- Days until expiry
    aliases TEXT[], -- Alternative names for OCR
    barcode VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Management
CREATE TABLE inventory (
    item_id INTEGER PRIMARY KEY REFERENCES items(id),
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    reserved_stock DECIMAL(10,2) DEFAULT 0, -- Allocated but not used
    total_value DECIMAL(12,2) GENERATED ALWAYS AS (current_stock * (SELECT unit_cost FROM items WHERE id = item_id)) STORED,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_checked TIMESTAMP, -- Last physical count
    next_expiry DATE -- Earliest expiry date for this item
);

-- Transaction Tracking
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    type ENUM('IN', 'OUT', 'RETURN', 'ADJUSTMENT', 'WASTE', 'STAFF_USE', 'SAMPLING') NOT NULL,
    item_id INTEGER REFERENCES items(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_value DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    department VARCHAR(100),
    reference_doc VARCHAR(255), -- Receipt number, bill number, etc.
    batch_id UUID, -- Group related transactions
    shift_id INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    ocr_confidence DECIMAL(3,2), -- 0.00-1.00
    original_image_url TEXT,
    processed_data JSONB -- Store OCR extracted data
);

-- Reconciliation System
CREATE TABLE department_reconciliation (
    id SERIAL PRIMARY KEY,
    department VARCHAR(100) NOT NULL,
    item_id INTEGER REFERENCES items(id),
    shift_date DATE NOT NULL,
    shift_type ENUM('morning', 'afternoon', 'evening', 'night') NOT NULL,
    
    -- Quantities
    withdrawn DECIMAL(10,2) DEFAULT 0,
    sold DECIMAL(10,2) DEFAULT 0,
    returned DECIMAL(10,2) DEFAULT 0,
    wasted DECIMAL(10,2) DEFAULT 0,
    staff_consumed DECIMAL(10,2) DEFAULT 0,
    sampled DECIMAL(10,2) DEFAULT 0,
    
    -- Calculated fields
    discrepancy DECIMAL(10,2) GENERATED ALWAYS AS (withdrawn - sold - returned - wasted - staff_consumed - sampled) STORED,
    discrepancy_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN withdrawn > 0 THEN (discrepancy / withdrawn) * 100 ELSE 0 END
    ) STORED,
    discrepancy_value DECIMAL(12,2),
    
    -- Status and approvals
    status ENUM('pending', 'acceptable', 'warning', 'investigation', 'critical', 'resolved') DEFAULT 'pending',
    requires_approval BOOLEAN DEFAULT false,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    resolution_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(department, item_id, shift_date, shift_type)
);

-- Suppliers and Purchase Orders
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    payment_terms TEXT,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(100) UNIQUE,
    supplier_id INTEGER REFERENCES suppliers(id),
    order_date DATE NOT NULL,
    expected_delivery DATE,
    actual_delivery DATE,
    status ENUM('pending', 'confirmed', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(12,2),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    ordered_quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    received_quantity DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(12,2) GENERATED ALWAYS AS (ordered_quantity * unit_price) STORED
);
```

#### 2.1.2 Indexes and Performance
```sql
-- Performance indexes
CREATE INDEX idx_transactions_date ON transactions(created_at);
CREATE INDEX idx_transactions_department ON transactions(department);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_inventory_stock_levels ON inventory(current_stock) WHERE current_stock < 10;
CREATE INDEX idx_reconciliation_status ON department_reconciliation(status) WHERE status != 'resolved';
CREATE INDEX idx_items_search ON items USING gin(to_tsvector('simple', name || ' ' || array_to_string(aliases, ' ')));

-- Partial indexes for active records
CREATE INDEX idx_active_items ON items(name) WHERE is_active = true;
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;
```

### 2.2 API Architecture

#### 2.2.1 REST API Structure
```typescript
// Base API configuration
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

// Authentication endpoints
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

// Inventory management
GET    /api/inventory/items
POST   /api/inventory/items
PUT    /api/inventory/items/:id
DELETE /api/inventory/items/:id
GET    /api/inventory/items/:id/history

// Stock operations
GET    /api/stock/current
POST   /api/stock/receive      // Nhập kho
POST   /api/stock/withdraw     // Xuất kho
POST   /api/stock/return       // Hoàn về
POST   /api/stock/adjust       // Điều chỉnh
GET    /api/stock/movements    // Lịch sử xuất nhập

// OCR processing
POST   /api/ocr/process-receipt
GET    /api/ocr/jobs/:id/status
POST   /api/ocr/verify-results

// Reconciliation
GET    /api/reconciliation/dashboard
POST   /api/reconciliation/submit
PUT    /api/reconciliation/:id/approve
GET    /api/reconciliation/discrepancies

// Reports and analytics
GET    /api/reports/dashboard
GET    /api/reports/inventory-summary
GET    /api/reports/loss-analysis
GET    /api/reports/department-performance
POST   /api/reports/custom

// User management
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

#### 2.2.2 Request/Response Examples
```typescript
// OCR Processing Request
POST /api/ocr/process-receipt
Content-Type: multipart/form-data

{
  "image": File,
  "department": "kitchen_main",
  "type": "purchase_receipt"
}

// Response
{
  "success": true,
  "data": {
    "jobId": "ocr_job_123",
    "status": "processing",
    "estimatedTime": 30
  }
}

// Stock Withdrawal Request
POST /api/stock/withdraw
{
  "department": "bar",
  "items": [
    {
      "itemId": 123,
      "quantity": 10,
      "notes": "For lunch service"
    }
  ],
  "requestedBy": 456,
  "shiftId": 789
}

// Discrepancy Alert Response
{
  "success": true,
  "data": {
    "alertId": "disc_001",
    "department": "bar",
    "item": {
      "id": 123,
      "name": "Bia Saigon 330ml"
    },
    "discrepancy": {
      "withdrawn": 10,
      "sold": 9,
      "returned": 0,
      "missing": 1,
      "percentage": 10.0,
      "status": "critical"
    },
    "requiresAction": true,
    "deadline": "2025-07-02T15:30:00Z"
  }
}
```

### 2.3 OCR Processing Pipeline

#### 2.3.1 Image Processing Flow
```typescript
interface OCRPipeline {
  // Step 1: Image preprocessing
  preprocessImage(imageBuffer: Buffer): Promise<{
    enhanced: Buffer;
    metadata: ImageMetadata;
  }>;

  // Step 2: OCR processing
  extractText(processedImage: Buffer): Promise<{
    rawText: string;
    confidence: number;
    boundingBoxes: BoundingBox[];
  }>;

  // Step 3: Data extraction
  parseReceiptData(rawText: string): Promise<{
    date: Date;
    supplier: string;
    items: ExtractedItem[];
    total: number;
    confidence: number;
  }>;

  // Step 4: Smart matching
  matchItems(extractedItems: ExtractedItem[]): Promise<{
    matches: ItemMatch[];
    suggestions: NewItemSuggestion[];
  }>;
}

interface ExtractedItem {
  rawName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  confidence: number;
}

interface ItemMatch {
  extractedItem: ExtractedItem;
  matchedItem: {
    id: number;
    name: string;
    confidence: number;
  };
  requiresReview: boolean;
}
```

#### 2.3.2 Smart Matching Algorithm
```typescript
class SmartMatcher {
  async findBestMatch(
    extractedName: string,
    context: MatchingContext
  ): Promise<ItemMatch[]> {
    const strategies = [
      this.exactMatch,
      this.fuzzyMatch,
      this.aliasMatch,
      this.semanticMatch,
      this.contextualMatch
    ];

    for (const strategy of strategies) {
      const matches = await strategy(extractedName, context);
      if (matches.length > 0) {
        return matches;
      }
    }

    return [];
  }

  private async fuzzyMatch(name: string): Promise<ItemMatch[]> {
    // Implementation using Levenshtein distance, soundex, metaphone
    // Return matches with >80% similarity
    const threshold = 0.8;
    const candidates = await this.getAllActiveItems();
    
    return candidates
      .map(item => ({
        item,
        score: this.calculateSimilarity(name, item.name)
      }))
      .filter(match => match.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private async aliasMatch(name: string): Promise<ItemMatch[]> {
    // Check against item aliases array
    return await this.db.items.findMany({
      where: {
        aliases: {
          has: name.toLowerCase()
        },
        isActive: true
      }
    });
  }

  private async semanticMatch(name: string): Promise<ItemMatch[]> {
    // Use OpenAI embeddings for semantic similarity
    const embedding = await this.openai.createEmbedding(name);
    // Compare with pre-calculated item embeddings
    return await this.findSimilarEmbeddings(embedding, 0.85);
  }
}
```

### 2.4 Real-time Systems

#### 2.4.1 WebSocket Implementation
```typescript
// Real-time event system
interface WebSocketEvent {
  type: 'inventory_update' | 'discrepancy_alert' | 'approval_request' | 'system_notification';
  data: any;
  target: 'all' | 'department' | 'role' | 'user';
  targetId?: string;
  timestamp: string;
}

class RealtimeService {
  private io: SocketIO.Server;
  
  // Broadcast inventory changes
  async broadcastInventoryUpdate(itemId: number, newStock: number) {
    this.io.emit('inventory_update', {
      itemId,
      newStock,
      timestamp: new Date().toISOString()
    });
  }

  // Send discrepancy alerts to managers
  async sendDiscrepancyAlert(discrepancy: DiscrepancyData) {
    this.io.to('managers').emit('discrepancy_alert', {
      ...discrepancy,
      requiresAction: discrepancy.status === 'critical'
    });
  }

  // Department-specific notifications
  async notifyDepartment(department: string, message: any) {
    this.io.to(`dept_${department}`).emit('notification', message);
  }
}
```

#### 2.4.2 Background Job Processing
```typescript
// Job queue for async processing
interface JobQueue {
  // OCR processing jobs
  'ocr:process': {
    imageUrl: string;
    userId: number;
    department: string;
  };

  // Reconciliation checks
  'reconciliation:check': {
    department: string;
    shiftId: number;
    itemIds: number[];
  };

  // Report generation
  'reports:generate': {
    type: 'daily' | 'weekly' | 'monthly';
    params: ReportParams;
    userId: number;
  };

  // Expiry notifications
  'inventory:expiry_check': {
    checkDate: Date;
  };
}

class JobProcessor {
  async processOCR(job: JobQueue['ocr:process']) {
    try {
      const result = await this.ocrService.processImage(job.imageUrl);
      const matches = await this.smartMatcher.matchItems(result.items);
      
      await this.notificationService.sendToUser(job.userId, {
        type: 'ocr_complete',
        data: { result, matches }
      });
    } catch (error) {
      await this.handleJobError(job, error);
    }
  }

  async checkReconciliation(job: JobQueue['reconciliation:check']) {
    const discrepancies = await this.reconciliationService
      .calculateDiscrepancies(job.department, job.shiftId);
    
    for (const discrepancy of discrepancies) {
      if (discrepancy.status === 'critical') {
        await this.alertService.sendCriticalAlert(discrepancy);
      }
    }
  }
}
```

## 3. PERFORMANCE SPECIFICATIONS

### 3.1 Response Time Requirements
```typescript
interface PerformanceTargets {
  // API Response times (95th percentile)
  'GET /api/inventory/items': '< 200ms';
  'POST /api/stock/withdraw': '< 500ms';
  'POST /api/ocr/process-receipt': '< 30s';
  'GET /api/reports/dashboard': '< 1s';

  // Frontend metrics
  'First Contentful Paint': '< 1.5s';
  'Largest Contentful Paint': '< 2.5s';
  'Cumulative Layout Shift': '< 0.1';
  'First Input Delay': '< 100ms';

  // Mobile performance
  'Mobile page load': '< 3s on 3G';
  'Camera initialization': '< 2s';
  'Image capture to preview': '< 1s';
}
```

### 3.2 Scalability Architecture
```typescript
// Horizontal scaling configuration
interface ScalingConfig {
  // Load balancing
  loadBalancer: {
    algorithm: 'round_robin';
    healthCheck: '/api/health';
    stickySession: false;
  };

  // Database optimization
  database: {
    connectionPool: {
      min: 2;
      max: 20;
      acquireTimeout: 30000;
      idleTimeout: 300000;
    };
    readReplicas: 2;
    cachingStrategy: 'redis';
  };

  // File storage
  storage: {
    primary: 'cloudinary';
    backup: 'local';
    cdnEnabled: true;
    compressionLevel: 85;
  };
}
```

### 3.3 Caching Strategy
```typescript
interface CacheStrategy {
  // Redis cache layers
  layers: {
    // L1: Application cache (in-memory)
    application: {
      ttl: '5 minutes';
      maxSize: '100MB';
      strategy: 'LRU';
    };

    // L2: Redis cache
    redis: {
      ttl: '1 hour';
      keyPattern: 'inv:{type}:{id}';
      compression: true;
    };

    // L3: CDN cache (static assets)
    cdn: {
      ttl: '24 hours';
      purgeOnUpdate: true;
    };
  };

  // Cache invalidation rules
  invalidation: {
    inventory_update: ['inventory:*', 'dashboard:*'];
    item_created: ['items:*', 'categories:*'];
    user_action: ['user:{userId}:*'];
  };
}
```

## 4. SECURITY SPECIFICATIONS

### 4.1 Authentication & Authorization
```typescript
interface SecurityConfig {
  // JWT configuration
  jwt: {
    accessTokenExpiry: '15 minutes';
    refreshTokenExpiry: '7 days';
    algorithm: 'RS256';
    issuer: 'restaurant-inventory';
  };

  // Password requirements
  password: {
    minLength: 8;
    requireUppercase: true;
    requireLowercase: true;
    requireNumbers: true;
    requireSpecialChars: false;
    bcryptRounds: 12;
  };

  // Session management
  session: {
    maxConcurrentSessions: 3;
    absoluteTimeout: '4 hours';
    inactivityTimeout: '30 minutes';
  };
}

// Role-based permissions
interface RolePermissions {
  owner: {
    inventory: ['read', 'write', 'delete'];
    users: ['read', 'write', 'delete'];
    reports: ['read', 'write'];
    settings: ['read', 'write'];
    approvals: ['all'];
  };

  manager: {
    inventory: ['read', 'write'];
    users: ['read'];
    reports: ['read', 'write'];
    approvals: ['discrepancies', 'adjustments'];
  };

  supervisor: {
    inventory: ['read'];
    departmentInventory: ['read', 'write'];
    reports: ['read'];
    approvals: ['department_requests'];
  };

  staff: {
    inventory: ['read'];
    departmentRequests: ['write'];
    reports: ['read_own_department'];
  };
}
```

### 4.2 Data Protection
```typescript
interface DataProtection {
  // Encryption
  encryption: {
    atRest: {
      algorithm: 'AES-256-GCM';
      keyRotation: 'quarterly';
      fields: ['supplier_contacts', 'cost_data', 'financial_reports'];
    };
    
    inTransit: {
      tlsVersion: 'TLS 1.3';
      certificateType: 'Let\'s Encrypt';
      hsts: true;
      csp: 'strict';
    };
  };

  // Data retention
  retention: {
    transactions: '7 years';
    images: '2 years';
    logs: '1 year';
    userSessions: '30 days';
    auditTrail: '5 years';
  };

  // Backup strategy
  backup: {
    frequency: 'daily';
    retention: '30 days';
    encryption: true;
    offsite: true;
    testRestore: 'monthly';
  };
}
```

### 4.3 Input Validation & Sanitization
```typescript
// Validation schemas using Zod
const ItemSchema = z.object({
  name: z.string().min(1).max(255).regex(/^[a-zA-Z0-9\s\u00C0-\u024F\u1E00-\u1EFF]+$/),
  categoryId: z.number().int().positive(),
  unit: z.enum(['kg', 'gram', 'chai', 'thùng', 'lít', 'ml']),
  unitCost: z.number().positive().max(999999999.99),
  minStock: z.number().min(0),
  maxStock: z.number().min(0),
  aliases: z.array(z.string().max(100)).max(10)
});

const WithdrawalSchema = z.object({
  department: z.string().min(1).max(100),
  items: z.array(z.object({
    itemId: z.number().int().positive(),
    quantity: z.number().positive().max(99999),
    notes: z.string().max(500).optional()
  })).min(1).max(50),
  shiftId: z.number().int().positive()
});

// Input sanitization middleware
class InputSanitizer {
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }

  static sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  static validateImageFile(file: Express.Multer.File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    return allowedTypes.includes(file.mimetype) && file.size <= maxSize;
  }
}
```

## 5. INTEGRATION SPECIFICATIONS

### 5.1 POS System Integration
```typescript
interface POSIntegration {
  // Generic POS adapter interface
  interface POSAdapter {
    connect(): Promise<boolean>;
    getSalesData(from: Date, to: Date): Promise<SalesData[]>;
    getMenuItems(): Promise<MenuItem[]>;
    syncInventoryLevels(items: InventoryLevel[]): Promise<boolean>;
  }

  // Square POS implementation
  class SquarePOSAdapter implements POSAdapter {
    private client: SquareClient;
    
    async getSalesData(from: Date, to: Date): Promise<SalesData[]> {
      const orders = await this.client.ordersApi.searchOrders({
        locationIds: [this.locationId],
        query: {
          filter: {
            dateTimeFilter: {
              createdAt: {
                startAt: from.toISOString(),
                endAt: to.toISOString()
              }
            }
          }
        }
      });

      return this.transformSquareData(orders.result.orders);
    }
  }

  // Toast POS implementation
  class ToastPOSAdapter implements POSAdapter {
    // Implementation for Toast POS
  }
}

interface SalesData {
  orderId: string;
  timestamp: Date;
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  paymentMethod: string;
}
```

### 5.2 Accounting System Integration
```typescript
interface AccountingIntegration {
  // QuickBooks integration
  class QuickBooksAdapter {
    async syncInventoryValues(items: InventoryValue[]): Promise<void> {
      for (const item of items) {
        await this.updateItemValue(item.id, item.currentValue);
      }
    }

    async createPurchaseEntry(receipt: ProcessedReceipt): Promise<string> {
      const expense = {
        vendor: receipt.supplier,
        amount: receipt.total,
        date: receipt.date,
        items: receipt.items.map(item => ({
          description: item.name,
          quantity: item.quantity,
          rate: item.unitPrice
        }))
      };

      return await this.qbClient.createExpense(expense);
    }
  }

  // Excel export for manual accounting
  class ExcelExporter {
    async generateInventoryReport(data: InventoryData[]): Promise<Buffer> {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventory Report');
      
      worksheet.columns = [
        { header: 'Item Name', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Current Stock', key: 'stock', width: 12 },
        { header: 'Unit Cost', key: 'cost', width: 12 },
        { header: 'Total Value', key: 'value', width: 15 }
      ];

      worksheet.addRows(data);
      return await workbook.xlsx.writeBuffer();
    }
  }
}
```

## 6. MONITORING & LOGGING

### 6.1 Application Monitoring
```typescript
interface MonitoringConfig {
  // Health checks
  healthChecks: {
    database: {
      query: 'SELECT 1';
      timeout: 5000;
      interval: 30000;
    };
    redis: {
      command: 'PING';
      timeout: 2000;
      interval: 30000;
    };
    externalAPIs: {
      googleVision: {
        endpoint: '/health';
        timeout: 10000;
        interval: 60000;
      };
    };
  };

  // Performance metrics
  metrics: {
    responseTime: {
      buckets: [10, 50, 100, 500, 1000, 5000];
      percentiles: [50, 90, 95, 99];
    };
    
    throughput: {
      requestsPerSecond: true;
      concurrentUsers: true;
    };

    errors: {
      errorRate: true;
      errorsByType: true;
      errorsByEndpoint: true;
    };

    business: {
      ocrAccuracy: true;
      discrepancyRate: true;
      inventoryTurnover: true;
    };
  };
}

class MetricsCollector {
  private prometheus = require('prom-client');

  // Custom metrics
  private ocrAccuracyGauge = new this.prometheus.Gauge({
    name: 'ocr_accuracy_rate',
    help: 'OCR accuracy rate by document type',
    labelNames: ['document_type']
  });

  private discrepancyCounter = new this.prometheus.Counter({
    name: 'inventory_discrepancies_total',
    help: 'Total number of inventory discrepancies',
    labelNames: ['department', 'severity']
  });

  private inventoryValueGauge = new this.prometheus.Gauge({
    name: 'inventory_total_value',
    help: 'Total inventory value in VND',
    labelNames: ['category']
  });

  updateOCRAccuracy(documentType: string, accuracy: number) {
    this.ocrAccuracyGauge.set({ document_type: documentType }, accuracy);
  }

  recordDiscrepancy(department: string, severity: string) {
    this.discrepancyCounter.inc({ department, severity });
  }
}
```

### 6.2 Logging Strategy
```typescript
interface LoggingConfig {
  // Log levels and formats
  levels: {
    error: 0;
    warn: 1;
    info: 2;
    debug: 3;
  };

  // Structured logging format
  format: {
    timestamp: true;
    level: true;
    message: true;
    metadata: {
      userId?: number;
      requestId?: string;
      department?: string;
      action?: string;
      ipAddress?: string;
      userAgent?: string;
    };
  };

  // Log destinations
  transports: {
    console: {
      enabled: true;
      level: 'debug';
      colorize: true;
    };
    
    file: {
      enabled: true;
      level: 'info';
      filename: 'logs/app-%DATE%.log';
      maxSize: '20m';
      maxFiles: '14d';
    };

    database: {
      enabled: true;
      level: 'warn';
      table: 'application_logs';
    };
  };
}

class Logger {
  info(message: string, metadata?: any) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: any) {
    this.log('warn', message, metadata);
  }

  error(message: string, error?: Error, metadata?: any) {
    this.log('error', message, { ...metadata, error: error?.stack });
  }

  // Audit logging for sensitive operations
  audit(action: string, userId: number, details: any) {
    this.log('info', `AUDIT: ${action}`, {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }
}
```

## 7. DEPLOYMENT ARCHITECTURE

### 7.1 Infrastructure Setup
```yaml
# Docker Compose configuration
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=restaurant_inventory
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups

  redis:
    image: redis:7
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### 7.2 CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint
      
      - name: Type checking
        run: npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.PRIVATE_KEY }}
          script: |
            cd /var/www/restaurant-inventory
            git pull origin main
            npm ci --production
            npm run build
            pm2 restart restaurant-inventory
```

### 7.3 Environment Configuration
```bash
# Production environment variables
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/restaurant_inventory
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-256-bit-secret
JWT_REFRESH_SECRET=your-256-bit-refresh-secret
BCRYPT_ROUNDS=12

# Third-party services
GOOGLE_VISION_API_KEY=your-google-vision-key
OPENAI_API_KEY=your-openai-key
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Feature flags
ENABLE_POS_INTEGRATION=true
ENABLE_REAL_TIME_ALERTS=true
ENABLE_ANALYTICS=true

# Performance
MAX_UPLOAD_SIZE=10485760  # 10MB
CACHE_TTL=3600           # 1 hour
RATE_LIMIT_REQUESTS=100   # per minute
```

---

## 8. TESTING STRATEGY

### 8.1 Testing Pyramid
```typescript
interface TestingStrategy {
  // Unit tests (70%)
  unit: {
    framework: 'Jest';
    coverage: '>90%';
    scope: [
      'Business logic functions',
      'Utility functions', 
      'Data validation',
      'OCR processing algorithms'
    ];
  };

  // Integration tests (20%)
  integration: {
    framework: 'Jest + Supertest';
    scope: [
      'API endpoints',
      'Database operations',
      'Third-party service integration',
      'Background job processing'
    ];
  };

  // End-to-end tests (10%)
  e2e: {
    framework: 'Playwright';
    scope: [
      'Complete user workflows',
      'Mobile responsive behavior',
      'Real-time features',
      'OCR accuracy with sample images'
    ];
  };
}

// Example test cases
describe('OCR Processing', () => {
  test('should extract items from machine-printed receipt', async () => {
    const result = await ocrService.processReceipt(sampleReceipt);
    expect(result.confidence).toBeGreaterThan(0.95);
    expect(result.items).toHaveLength(5);
    expect(result.total).toBe(150000);
  });

  test('should handle handwritten receipts with lower confidence', async () => {
    const result = await ocrService.processReceipt(handwrittenReceipt);
    expect(result.confidence).toBeGreaterThan(0.80);
    expect(result.requiresReview).toBe(true);
  });
});
```

---

**Document Approval:**
- Technical Lead: _________________ Date: _______
- Security Officer: _______________ Date: _______
- DevOps Engineer: _______________ Date: _______