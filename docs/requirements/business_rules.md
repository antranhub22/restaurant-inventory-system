  // Calculation of reorder quantities
  quantity_calculation: {
    // Standard Economic Order Quantity approach adapted for restaurants
    formula: 'max_stock - current_stock + (daily_consumption * lead_time_days)';
    
    // Minimum order quantities by supplier
    supplier_minimums: {
      respect_supplier_moqs: true; // Minimum Order Quantities
      round_to_case_sizes: true;   // Round up to full cases/boxes
      bulk_discount_consideration: true;
    };
    
    // Seasonal adjustments
    seasonal_multipliers: {
      high_season: 1.3;  // Tet, holidays, festivals
      normal_season: 1.0;
      low_season: 0.8;   // Slow periods
    };
  };
  
  // Approval workflows for auto-orders
  approval_thresholds: {
    auto_approve: 'order_value <= 500000 VND';        // ~$20 USD
    supervisor_approval: 'order_value <= 2000000 VND'; // ~$80 USD
    manager_approval: 'order_value <= 10000000 VND';   // ~$400 USD
    owner_approval: 'order_value > 10000000 VND';
  };
}
```

### 1.2 Unit Conversion Rules

#### Standard Vietnamese Restaurant Units
```typescript
interface UnitConversionRules {
  // Weight conversions
  weight: {
    base_unit: 'kg';
    conversions: {
      'gram': { factor: 0.001, precision: 0 };
      'kg': { factor: 1.0, precision: 2 };
      'tấn': { factor: 1000, precision: 3 };
    };
  };
  
  // Volume conversions
  volume: {
    base_unit: 'lít';
    conversions: {
      'ml': { factor: 0.001, precision: 0 };
      'lít': { factor: 1.0, precision: 2 };
      'thùng_bia': { factor: 24 * 0.33, precision: 1 }; // 24 bottles of 330ml
      'chai_bia': { factor: 0.33, precision: 2 };
      'chai_nuoc_ngot': { factor: 0.35, precision: 2 };
    };
  };
  
  // Count-based items
  count: {
    base_unit: 'cái';
    conversions: {
      'cái': { factor: 1, precision: 0 };
      'chục': { factor: 10, precision: 0 };
      'thùng': { factor: 24, precision: 0 }; // Contextual - beer cases
      'bao': { factor: 1, precision: 0 };    // Bags of rice, etc.
      'cây': { factor: 1, precision: 0 };    // Vegetables like cabbage
      'con': { factor: 1, precision: 0 };    // Fish, chicken
    };
  };
  
  // Special handling for Vietnamese ingredients
  special_units: {
    'rau_muống': { unit: 'bó', weight_equivalent: '0.3 kg' };
    'cải_thảo': { unit: 'cây', weight_equivalent: '1.2 kg' };
    'gà_ta': { unit: 'con', weight_equivalent: '1.5 kg' };
    'cá_diêu_hồng': { unit: 'con', weight_equivalent: '0.8 kg' };
    'tôm_tươi': { unit: 'kg', count_equivalent: '30-40 con' };
  };
  
  // Validation rules
  validation: {
    prevent_invalid_conversions: true; // Can't convert weight to volume
    round_to_practical_values: true;   // Round 0.33333 kg to 0.33 kg
    enforce_minimum_units: true;       // Don't allow 0.001 portions
  };
}
```

### 1.3 FIFO (First In, First Out) Rules

#### Batch Management Logic
```typescript
interface FIFORules {
  // Automatic batch selection for withdrawals
  batch_selection_priority: [
    'earliest_expiry_date',
    'earliest_received_date', 
    'lowest_unit_cost',       // If dates are equal
    'smallest_batch_size'     // Use up smaller batches first
  ];
  
  // Override rules for specific situations
  override_conditions: {
    quality_issues: {
      allow_skip_batch: true;
      require_documentation: true;
      auto_quarantine: true;
    };
    
    customer_request: {
      allow_specific_batch: true; // Premium ingredients for VIP orders
      require_supervisor_approval: true;
    };
    
    emergency_situations: {
      allow_any_available: true;
      log_fifo_violation: true;
    };
  };
  
  // Expiry handling
  expiry_management: {
    auto_quarantine_expired: true;
    suggest_usage_3_days_before: true;
    markdown_pricing_1_day_before: true;
    
    // Grace periods for different categories
    grace_periods: {
      'dry_goods': 30, // Days past expiry still usable
      'canned_goods': 90,
      'fresh_vegetables': 0, // No grace period
      'fresh_meat': 0,
      'dairy': 1,
      'beverages': 30
    };
  };
}
```

---

## 2. RECONCILIATION SYSTEM RULES

### 2.1 Discrepancy Calculation Logic

#### Core Reconciliation Formula
```typescript
interface ReconciliationLogic {
  // Master equation for department reconciliation
  balance_equation: `
    OPENING_STOCK + RECEIVED + RETURNED + TRANSFERRED_IN = 
    SOLD + WITHDRAWN + WASTED + STAFF_CONSUMED + SAMPLED + TRANSFERRED_OUT + CLOSING_STOCK
  `;
  
  // Simplified tracking equation
  discrepancy_calculation: `
    DISCREPANCY = WITHDRAWN - (SOLD + RETURNED + WASTED + STAFF_CONSUMED + SAMPLED)
  `;
  
  // Tolerance levels by item category
  tolerance_thresholds: {
    beverages: {
      acceptable: 2.0,     // ≤2% discrepancy auto-approved
      warning: 5.0,        // 2-5% requires explanation
      investigation: 10.0, // 5-10% requires detailed investigation
      critical: 15.0       // >15% stops operations
    };
    
    fresh_meat_seafood: {
      acceptable: 1.0,     // Stricter due to high value
      warning: 3.0,
      investigation: 5.0,
      critical: 10.0
    };
    
    vegetables: {
      acceptable: 5.0,     // More lenient due to natural loss
      warning: 8.0,
      investigation: 12.0,
      critical: 20.0
    };
    
    dry_goods: {
      acceptable: 0.5,     // Should be very accurate
      warning: 2.0,
      investigation: 5.0,
      critical: 10.0
    };
    
    condiments_spices: {
      acceptable: 1.0,
      warning: 3.0,
      investigation: 8.0,
      critical: 15.0
    };
  };
}
```

#### Alert Level Determination
```typescript
interface AlertLevelLogic {
  calculateAlertLevel(discrepancy_rate: number, item_category: string): AlertLevel {
    const thresholds = tolerance_thresholds[item_category];
    
    if (Math.abs(discrepancy_rate) <= thresholds.acceptable) {
      return {
        level: 'ACCEPTABLE',
        auto_approve: true,
        requires_explanation: false,
        escalation_time: null
      };
    }
    
    if (Math.abs(discrepancy_rate) <= thresholds.warning) {
      return {
        level: 'WARNING',
        auto_approve: false,
        requires_explanation: true,
        escalation_time: '30 minutes',
        notify: ['supervisor', 'department_head']
      };
    }
    
    if (Math.abs(discrepancy_rate) <= thresholds.investigation) {
      return {
        level: 'INVESTIGATION',
        auto_approve: false,
        requires_explanation: true,
        requires_photo_evidence: true,
        escalation_time: '1 hour',
        notify: ['manager', 'owner'],
        actions: ['detailed_report_required', 'pattern_check']
      };
    }
    
    return {
      level: 'CRITICAL',
      auto_approve: false,
      immediate_action: true,
      stop_operations: true,
      escalation_time: '15 minutes',
      notify: ['all_managers', 'owner'],
      actions: ['emergency_investigation', 'inventory_freeze']
    };
  }
}
```

### 2.2 Department-Specific Rules

#### Bar/Beverage Department
```typescript
interface BarRules {
  // Special handling for liquid wastage
  acceptable_reasons: [
    'bottle_breakage',      // Physical damage
    'over_pouring',         // Service mistakes
    'customer_returns',     // Wrong order
    'cleaning_spillage',    // During cleaning
    'sampling_for_quality', // Taste testing
    'staff_training'        // Teaching new employees
  ];
  
  // Sampling limits
  sampling_limits: {
    per_shift: {
      beer: 2,              // Max 2 bottles per shift
      wine: 1,              // Max 1 glass per shift
      cocktail_ingredients: 0.1 // 10% of standard portion
    };
    requires_approval: true;
    must_document: true;
  };
  
  // Staff consumption rules
  staff_consumption: {
    allowed_items: ['water', 'soft_drinks', 'coffee', 'tea'];
    prohibited_items: ['alcohol', 'premium_beverages'];
    max_per_shift: {
      'soft_drinks': 2,
      'coffee': 3,
      'water': 'unlimited'
    };
    approval_required: false; // Pre-approved for listed items
  };
  
  // Breakage handling
  breakage_rules: {
    immediate_reporting: true;
    photo_evidence_required: true; // For insurance/supplier claims
    witness_statement: true;
    cleanup_procedure: 'safety_first_protocol';
    
    // Pattern detection
    pattern_thresholds: {
      same_staff_3_times: 'additional_training_required';
      same_supplier_bottles: 'quality_complaint_to_supplier';
      same_time_period: 'environmental_factor_investigation'
    };
  };
}
```

#### Kitchen Department
```typescript
interface KitchenRules {
  // Natural loss factors
  cooking_loss_factors: {
    'meat_grilling': 0.15,        // 15% weight loss during grilling
    'meat_stewing': 0.10,         // 10% weight loss during stewing
    'vegetable_cleaning': 0.20,   // 20% loss during prep (stems, bad parts)
    'rice_cooking': -1.5,         // Rice expands 150%
    'noodle_cooking': -0.8,       // Noodles expand 80%
    'oil_absorption': 0.05        // 5% oil absorbed during frying
  };
  
  // Prep waste calculation
  prep_waste_allowances: {
    'fish_cleaning': 0.30,        // 30% waste (head, bones, scales)
    'chicken_butchering': 0.25,   // 25% waste (bones, skin, fat)
    'vegetable_trimming': 0.15,   // 15% waste (stems, outer leaves)
    'fruit_peeling': 0.20,        // 20% waste (peels, cores)
  };
  
  // Quality control rules
  quality_standards: {
    temperature_violations: {
      immediate_discard: true;
      no_consumption_allowed: true;
      full_documentation_required: true;
    };
    
    visual_inspection_failures: {
      photo_evidence: true;
      supplier_notification: true;
      potential_credit_claim: true;
    };
    
    cross_contamination: {
      discard_all_affected: true;
      sanitization_protocol: true;
      incident_report: true;
    };
  };
}
```

### 2.3 Approval Workflow Rules

#### Escalation Matrix
```typescript
interface ApprovalWorkflow {
  // Automatic approval conditions
  auto_approval: {
    conditions: [
      'discrepancy_rate <= acceptable_threshold',
      'item_value <= 50000 VND',
      'standard_explanation_provided',
      'no_pattern_detected'
    ];
    action: 'immediate_approval';
    notification: 'log_only';
  };
  
  // Supervisor approval (Department heads)
  supervisor_approval: {
    triggers: [
      'warning_level_discrepancy',
      'item_value <= 200000 VND',
      'staff_consumption_within_limits',
      'standard_waste_reasons'
    ];
    response_time: '30 minutes';
    escalation_if_no_response: 'manager_approval';
    notification: ['department_supervisor', 'manager'];
  };
  
  // Manager approval
  manager_approval: {
    triggers: [
      'investigation_level_discrepancy',
      'item_value <= 1000000 VND',
      'pattern_detected',
      'supervisor_unavailable'
    ];
    response_time: '1 hour';
    escalation_if_no_response: 'owner_approval';
    notification: ['manager', 'owner'];
    required_documentation: ['detailed_explanation', 'corrective_actions'];
  };
  
  // Owner approval
  owner_approval: {
    triggers: [
      'critical_level_discrepancy',
      'item_value > 1000000 VND',
      'suspected_theft',
      'repeated_patterns',
      'manager_unavailable'
    ];
    response_time: '4 hours';
    escalation_if_no_response: 'external_audit';
    notification: ['owner', 'all_managers'];
    required_documentation: [
      'comprehensive_investigation_report',
      'witness_statements',
      'security_footage_review',
      'corrective_action_plan'
    ];
  };
}
```

---

## 3. OCR PROCESSING RULES

### 3.1 Document Recognition Logic

#### Receipt Type Classification
```typescript
interface OCRProcessingRules {
  // Document type detection
  document_classification: {
    machine_printed: {
      characteristics: [
        'uniform_font_size',
        'consistent_spacing',
        'clean_lines',
        'high_contrast'
      ];
      confidence_boost: 0.1;    // Add 10% to confidence
      processing_method: 'standard_ocr';
    };
    
    handwritten: {
      characteristics: [
        'irregular_spacing',
        'varying_line_heights',
        'pen_pressure_variations',
        'natural_writing_flow'
      ];
      confidence_penalty: 0.15; // Reduce confidence by 15%
      processing_method: 'handwriting_specific_ocr';
      require_manual_review: true;
    };
    
    mixed_format: {
      characteristics: [
        'printed_header_with_handwritten_items',
        'stamps_and_signatures',
        'pre_printed_forms'
      ];
      processing_method: 'hybrid_ocr';
      segment_processing: true;
    };
  };
  
  // Pre-processing rules
  image_enhancement: {
    auto_rotation: true;
    contrast_enhancement: true;
    noise_reduction: true;
    deskew_correction: true;
    
    // Quality thresholds
    minimum_resolution: '300 DPI';
    maximum_file_size: '10 MB';
    supported_formats: ['JPEG', 'PNG', 'WebP', 'PDF'];
  };
}
```

#### Text Extraction Confidence Scoring
```typescript
interface ConfidenceScoring {
  // Confidence calculation factors
  confidence_factors: {
    character_recognition: {
      weight: 0.40;
      factors: [
        'character_clarity',
        'font_consistency',
        'text_sharpness'
      ];
    };
    
    structure_recognition: {
      weight: 0.30;
      factors: [
        'table_detection_accuracy',
        'column_alignment',
        'row_separation'
      ];
    };
    
    business_logic_validation: {
      weight: 0.30;
      factors: [
        'date_format_validity',
        'price_calculation_accuracy',
        'supplier_name_match',
        'item_name_recognition'
      ];
    };
  };
  
  // Confidence thresholds for actions
  action_thresholds: {
    auto_process: 0.95,        // 95%+ confidence: auto-approve
    review_recommended: 0.85,   // 85-95%: suggest review
    manual_review_required: 0.70, // 70-85%: require review
    reject_and_retry: 0.70     // <70%: ask for better image
  };
}
```

### 3.2 Smart Matching Rules

#### Fuzzy Item Matching Logic
```typescript
interface SmartMatchingRules {
  // Multiple matching strategies in order of preference
  matching_strategies: [
    {
      name: 'exact_match';
      weight: 1.0;
      method: 'direct_string_comparison';
    },
    {
      name: 'alias_match';
      weight: 0.95;
      method: 'check_predefined_aliases';
    },
    {
      name: 'fuzzy_match';
      weight: 0.85;
      method: 'levenshtein_distance';
      threshold: 0.8; // 80% similarity required
    },
    {
      name: 'phonetic_match';
      weight: 0.75;
      method: 'soundex_metaphone';
    },
    {
      name: 'semantic_match';
      weight: 0.70;
      method: 'ai_embedding_similarity';
      require_openai_api: true;
    },
    {
      name: 'contextual_match';
      weight: 0.65;
      method: 'supplier_history_analysis';
    }
  ];
  
  // Vietnamese-specific text processing
  vietnamese_processing: {
    // Handle accented characters
    accent_normalization: true;
    accent_variants: {
      'thịt bò': ['thit bo', 'THỊT BÒ', 'thit bò', 'Thịt Bò'];
      'cà phê': ['ca phe', 'cafe', 'cà phê', 'CA PHE'];
      'tôm tươi': ['tom tuoi', 'tôm tươi', 'TÔM TƯƠI'];
    };
    
    // Common abbreviations
    abbreviations: {
      'TB': 'thịt bò';
      'TH': 'thịt heo';
      'CF': 'cà phê';
      'NM': 'nước mắm';
      'DG': 'dầu ăn';
    };
    
    // Regional variations
    regional_variants: {
      north: { 'thịt lợn': 'thịt heo' };
      south: { 'bánh mì': 'bánh mỳ' };
      central: { 'bún bò': 'bún bò huế' };
    };
  };
  
  // Learning system for continuous improvement
  learning_rules: {
    store_corrections: true;
    update_aliases_automatically: true;
    confidence_threshold_adjustment: true;
    
    // Learning from user corrections
    correction_feedback_loop: {
      immediate_alias_creation: true;
      weight_adjustment_for_suppliers: true;
      pattern_recognition_improvement: true;
    };
  };
}
```

---

## 4. BUSINESS LOGIC VALIDATION

### 4.1 Data Validation Rules

#### Transaction Validation
```typescript
interface TransactionValidation {
  // Pre-transaction validation
  pre_validation: {
    stock_availability: {
      check_current_stock: true;
      allow_negative_stock: false; // Strict inventory control
      reservation_handling: true;  // Consider reserved stock
    };
    
    business_rules: {
      check_expiry_dates: true;
      enforce_fifo: true;
      validate_unit_conversions: true;
      check_cost_reasonableness: true;
    };
    
    authorization: {
      verify_user_permissions: true;
      check_department_authority: true;
      validate_approval_requirements: true;
    };
  };
  
  // Reasonableness checks
  reasonableness_validation: {
    quantity_limits: {
      'beverages': { min: 0.1, max: 1000 };      // 0.1L to 1000L per transaction
      'meat': { min: 0.05, max: 50 };            // 50g to 50kg per transaction
      'vegetables': { min: 0.1, max: 100 };      // 100g to 100kg per transaction
      'condiments': { min: 0.01, max: 10 };      // 10g to 10kg per transaction
    };
    
    price_validation: {
      // Flag transactions with unusual unit costs
      variance_threshold: 0.3; // 30% deviation from average
      automatic_approval_limit: 0.1; // 10% deviation auto-approved
      require_explanation: 0.2; // 20% deviation requires explanation
    };
    
    timing_validation: {
      business_hours_only: false; // Allow 24/7 for restaurant operations
      shift_based_restrictions: true;
      weekend_different_rules: true;
    };
  };
}
```

#### Cost Control Rules
```typescript
interface CostControlRules {
  // Pricing validation
  cost_validation: {
    // Maximum allowed variance from last purchase price
    price_variance_limits: {
      'stable_items': 0.15,    // 15% for dry goods, canned items
      'volatile_items': 0.30,  // 30% for fresh produce, meat
      'seasonal_items': 0.50   // 50% for seasonal vegetables
    };
    
    // Automatic approval thresholds
    auto_approval_conditions: [
      'variance_within_stable_limit',
      'same_supplier_as_last_purchase',
      'quantity_within_normal_range'
    ];
    
    // Manual review triggers
    review_triggers: [
      'price_increase_above_threshold',
      'new_supplier',
      'unusually_large_quantity',
      'off_season_purchase'
    ];
  };
  
  // Budget controls
  budget_enforcement: {
    daily_spending_limits: {
      'total': 5000000,      // 5M VND per day maximum
      'fresh_items': 2000000,  // 2M VND for fresh items
      'beverages': 1500000,    // 1.5M VND for beverages
      'dry_goods': 1000000     // 1M VND for dry goods
    };
    
    monthly_budget_tracking: true;
    alert_at_80_percent: true;
    require_approval_at_90_percent: true;
    block_purchases_at_100_percent: false; // Allow emergency purchases
  };
}
```

### 4.2 Compliance and Audit Rules

#### Audit Trail Requirements
```typescript
interface AuditTrailRules {
  // Required logging for all transactions
  mandatory_logging: {
    user_identification: true;
    timestamp_with_timezone: true;
    ip_address_logging: true;
    device_information: true;
    action_details: true;
    before_after_values: true;
  };
  
  // Retention policies
  data_retention: {
    transaction_records: '7 years';    // Tax compliance
    user_activity_logs: '3 years';
    error_logs: '1 year';
    performance_metrics: '2 years';
    ocr_images: '2 years';             // Evidence preservation
  };
  
  // Immutable records
  immutability_rules: {
    no_deletion_of_transactions: true;
    correction_via_adjustment_entries: true;
    maintain_original_ocr_data: true;
    preserve_approval_chains: true;
  };
  
  // Audit access controls
  audit_access: {
    read_only_for_auditors: true;
    export_capabilities: ['PDF', 'Excel', 'CSV'];
    search_and_filter: true;
    date_range_restrictions: false;
  };
}
```

---

## 5. ALERT AND NOTIFICATION RULES

### 5.1 Real-time Alert System

#### Alert Priority and Routing
```typescript
interface AlertSystem {
  // Alert classification
  alert_levels: {
    INFO: {
      priority: 1;
      delivery_method: ['in_app_notification'];
      response_time: 'no_requirement';
      escalation: false;
    };
    
    WARNING: {
      priority: 2;
      delivery_method: ['in_app_notification', 'email'];
      response_time: '1 hour';
      escalation: 'supervisor_if_no_action';
    };
    
    CRITICAL: {
      priority: 3;
      delivery_method: ['in_app_notification', 'email', 'sms', 'push_notification'];
      response_time: '15 minutes';
      escalation: 'manager_and_owner';
      auto_escalation_timer: '30 minutes';
    };
    
    EMERGENCY: {
      priority: 4;
      delivery_method: ['all_available_channels', 'phone_call'];
      response_time: 'immediate';
      escalation: 'all_stakeholders';
      continue_until_acknowledged: true;
    };
  };
  
  // Alert routing rules
  routing_matrix: {
    inventory_alerts: {
      low_stock: ['purchasing_manager', 'department_supervisor'];
      out_of_stock: ['all_department_heads', 'manager'];
      overstock: ['purchasing_manager'];
      expiring_items: ['department_supervisor', 'kitchen_manager'];
    };
    
    discrepancy_alerts: {
      acceptable: ['log_only'];
      warning: ['department_supervisor'];
      investigation: ['department_supervisor', 'manager'];
      critical: ['manager', 'owner', 'all_supervisors'];
    };
    
    system_alerts: {
      ocr_failures: ['it_administrator', 'manager'];
      sync_errors: ['it_administrator'];
      performance_issues: ['it_administrator'];
      security_violations: ['manager', 'owner'];
    };
  };
}
```

### 5.2 Escalation and Response Rules

#### Response Time Requirements
```typescript
interface ResponseTimeRules {
  // Required response times by role and alert type
  response_requirements: {
    supervisor: {
      inventory_warning: '1 hour';
      discrepancy_warning: '30 minutes';
      staff_requests: '15 minutes';
    };
    
    manager: {
      critical_discrepancy: '15 minutes';
      system_failures: '30 minutes';
      budget_overruns: '1 hour';
      audit_requests: '4 hours';
    };
    
    owner: {
      emergency_situations: '1 hour';
      critical_losses: '2 hours';
      compliance_issues: '4 hours';
      strategic_decisions: '24 hours';
    };
  };
  
  // Automatic escalation logic
  escalation_rules: {
    no_response_escalation: {
      warning_level: 'escalate_after_2x_response_time';
      critical_level: 'escalate_after_1.5x_response_time';
      emergency_level: 'escalate_after_1x_response_time';
    };
    
    inadequate_response_escalation: {
      triggers: [
        'marked_as_will_handle_later',
        'partial_acknowledgment_only',
        'no_corrective_action_specified'
      ];
      action: 'escalate_to_next_level_immediately';
    };
  };
}
```

---

## 6. PERFORMANCE AND OPTIMIZATION RULES

### 6.1 System Performance Standards

#### Response Time Requirements
```typescript
interface PerformanceStandards {
  // API response time targets (95th percentile)
  api_performance: {
    'GET /inventory/items': 200,           // milliseconds
    'POST /transactions': 500,
    'POST /ocr/process': 30000,           // 30 seconds for OCR
    'GET /dashboard': 1000,
    'GET /reports/daily': 2000,
    'GET /reconciliation/status': 300
  };
  
  // Frontend performance targets
  frontend_performance: {
    first_contentful_paint: 1500,        // milliseconds
    largest_contentful_paint: 2500,
    cumulative_layout_shift: 0.1,
    first_input_delay: 100,
    time_to_interactive: 3000
  };
  
  // Database performance
  database_performance: {
    simple_queries: 50,                   // milliseconds
    complex_queries: 500,
    report_queries: 2000,
    batch_operations: 5000
  };
  
  // Mobile performance
  mobile_performance: {
    camera_initialization: 2000,         // milliseconds
    image_capture_to_preview: 1000,
    offline_sync_time: 5000,
    app_startup_time: 3000
  };
}
```

### 6.2 Caching and Optimization Rules

#### Intelligent Caching Strategy
```typescript
interface CachingRules {
  // Cache layers and TTL (Time To Live)
  cache_strategy: {
    // Level 1: Application memory cache
    application_cache: {
      user_permissions: { ttl: 300 },      // 5 minutes
      item_details: { ttl: 600 },          // 10 minutes
      category_lists: { ttl: 1800 },       // 30 minutes
      supplier_info: { ttl: 3600 }         // 1 hour
    };
    
    // Level 2: Redis cache
    redis_cache: {
      inventory_levels: { ttl: 60 },       // 1 minute
      dashboard_data: { ttl: 300 },        // 5 minutes
      report_results: { ttl: 3600 },       // 1 hour
      ocr_results: { ttl: 86400 }          // 24 hours
    };
    
    // Level 3: CDN cache
    cdn_cache: {
      static_assets: { ttl: 86400 },       // 24 hours
      item_images: { ttl: 604800 },        // 7 days
      receipt_images: { ttl: 2592000 }     // 30 days
    };
  };
  
  // Cache invalidation rules
  invalidation_triggers: {
    inventory_update: ['inventory_levels', 'dashboard_data'];
    item_created_# Business Rules và Logic Document
## Restaurant Inventory Management System

**Version:** 1.0  
**Date:** July 2025  
**Related:** BRD v1.0, TRD v1.0

---

## 1. INVENTORY MANAGEMENT RULES

### 1.1 Stock Level Management

#### Stock Status Classification
```typescript
interface StockLevelRules {
  OUT_OF_STOCK: {
    condition: 'current_stock <= 0';
    actions: ['block_withdrawals', 'urgent_reorder_alert', 'notify_all_departments'];
    priority: 'CRITICAL';
  };
  
  LOW_STOCK: {
    condition: 'current_stock <= min_stock';
    thresholds: {
      drinks: 'min_stock * 1.2'; // 20% buffer for high-turnover items
      perishables: 'min_stock * 1.5'; // 50% buffer for fresh items
      dry_goods: 'min_stock * 1.1'; // 10% buffer for stable items
    };
    actions: ['reorder_alert', 'notify_purchasing'];
    priority: 'HIGH';
  };
  
  OVERSTOCK: {
    condition: 'current_stock >= max_stock';
    actions: ['storage_alert', 'suggest_promotions', 'review_ordering'];
    priority: 'MEDIUM';
  };
  
  EXPIRING_SOON: {
    conditions: {
      red_alert: 'days_until_expiry <= 1';
      yellow_alert: 'days_until_expiry <= 3';
      advance_warning: 'days_until_expiry <= 7';
    };
    actions: ['fifo_promotion', 'usage_priority', 'markdown_suggestion'];
    priority: 'HIGH';
  };
}
```

#### Automatic Reorder Rules
```typescript
interface ReorderRules {
  // When to trigger automatic reorder suggestions
  triggers: {
    stock_level: 'current_stock <= reorder_point';
    consumption_velocity: 'projected_depletion_date <= lead_time + safety_buffer';
    seasonal_demand: 'upcoming_high_demand_period AND current_stock < seasonal_min';
  };
  
  // Calculation of reorder