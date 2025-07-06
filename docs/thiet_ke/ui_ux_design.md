  transition: opacity 0.3s ease-in-out;
}

.slide-panel-overlay.show {
  opacity: 1;
  pointer-events: auto;
}
```

---

## 6. ANIMATION AND MICRO-INTERACTIONS

### 6.1 Transition Guidelines

#### Animation Principles
```css
/* Base transition settings */
:root {
  --transition-fast: 150ms ease-out;
  --transition-normal: 250ms ease-out;
  --transition-slow: 350ms ease-out;
  --transition-bounce: 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Hover and focus animations */
.interactive {
  transition: all var(--transition-fast);
}

.interactive:hover {
  transform: translateY(-1px);
}

.interactive:active {
  transform: translateY(0);
  transition-duration: 100ms;
}

/* Page transitions */
.page-enter {
  opacity: 0;
  transform: translateX(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.page-exit {
  opacity: 1;
  transform: translateX(0);
}

.page-exit-active {
  opacity: 0;
  transform: translateX(-20px);
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}

/* Loading animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Success/error feedback animations */
@keyframes checkmark {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Utility classes */
.animate-pulse { animation: pulse 2s infinite; }
.animate-spin { animation: spin 1s linear infinite; }
.animate-slideUp { animation: slideUp var(--transition-normal) ease-out; }
.animate-fadeIn { animation: fadeIn var(--transition-normal) ease-out; }
.animate-shake { animation: shake 0.5s ease-in-out; }
```

### 6.2 Feedback Micro-interactions

#### Success and Error States
```typescript
interface MicroInteractions {
  // Form validation feedback
  form_feedback: {
    success: {
      animation: 'checkmark_draw_in';
      color_change: 'border_to_green';
      duration: '350ms';
      sound: 'subtle_success_chime'; // Optional
    };
    
    error: {
      animation: 'shake_input_field';
      color_change: 'border_to_red';
      duration: '500ms';
      sound: 'error_beep'; // Optional
    };
    
    loading: {
      animation: 'spinner_in_button';
      disable_interaction: true;
      show_progress: true;
    };
  };
  
  // Button interactions
  button_feedback: {
    click: {
      animation: 'scale_down_up';
      haptic_feedback: 'light_impact'; // Mobile only
      duration: '150ms';
    };
    
    success: {
      animation: 'checkmark_replace_text';
      auto_revert: '2_seconds';
      color_change: 'green_background';
    };
    
    loading: {
      animation: 'spinner_replace_text';
      disable_clicks: true;
      progress_indicator: true;
    };
  };
  
  // List item interactions
  list_interactions: {
    swipe_reveal: {
      animation: 'slide_reveal_actions';
      haptic_feedback: 'medium_impact';
      auto_hide: '3_seconds_no_interaction';
    };
    
    delete_confirmation: {
      animation: 'item_highlight_red';
      require_double_tap: true;
      undo_option: '5_seconds';
    };
    
    refresh_items: {
      animation: 'fade_out_in';
      stagger_delay: '50ms_per_item';
      preserve_scroll_position: true;
    };
  };
}
```

#### Progressive Disclosure Animations
```css
/* Accordion/collapsible content */
.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height var(--transition-normal) ease-out,
              padding var(--transition-normal) ease-out;
}

.accordion-content.open {
  max-height: 1000px; /* Large enough value */
  padding: 1rem 0;
}

/* Tab switching animations */
.tab-content {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity var(--transition-fast),
              transform var(--transition-fast);
  position: absolute;
  pointer-events: none;
}

.tab-content.active {
  opacity: 1;
  transform: translateY(0);
  position: relative;
  pointer-events: auto;
}

/* Modal entrance animations */
.modal-enter {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

.modal-enter-active {
  opacity: 1;
  transform: scale(1) translateY(0);
  transition: opacity var(--transition-normal),
              transform var(--transition-normal);
}

/* Toast notification animations */
.toast-enter {
  opacity: 0;
  transform: translateX(100%);
}

.toast-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity var(--transition-normal),
              transform var(--transition-bounce);
}

.toast-exit {
  opacity: 1;
  transform: translateX(0);
}

.toast-exit-active {
  opacity: 0;
  transform: translateX(100%);
  transition: opacity var(--transition-normal),
              transform var(--transition-normal);
}
```

---

## 7. ACCESSIBILITY AND INCLUSIVE DESIGN

### 7.1 WCAG 2.1 Compliance

#### Color and Contrast Standards
```css
/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --gray-100: #ffffff;
    --gray-900: #000000;
    /* Increase contrast ratios */
  }
  
  .btn-primary {
    background-color: #000000;
    border: 2px solid #000000;
  }
  
  .input-base {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Color blind friendly palette */
.colorblind-safe {
  /* Use patterns and shapes in addition to colors */
  --success-pattern: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3e%3cpath fill='%23000' d='M0 0h4v4H0z'/%3e%3c/svg%3e");
  --warning-pattern: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3e%3cpath fill='%23000' d='M0 0l4 4H0z'/%3e%3c/svg%3e");
  --error-pattern: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3e%3cpath fill='%23000' d='M0 0h2v2H0zm2 2h2v2H2z'/%3e%3c/svg%3e");
}
```

#### Screen Reader Support
```html
<!-- Semantic HTML structure examples -->
<main role="main" aria-label="Inventory Dashboard">
  <section aria-labelledby="quick-stats-heading">
    <h2 id="quick-stats-heading" class="sr-only">Quick Statistics</h2>
    <div class="stats-grid">
      <div class="stat-card" role="img" aria-label="Total items: 234">
        <span aria-hidden="true">234</span>
        <span class="sr-only">Total items: 234</span>
      </div>
    </div>
  </section>
  
  <section aria-labelledby="alerts-heading">
    <h2 id="alerts-heading">Critical Alerts</h2>
    <ul role="list" aria-live="polite">
      <li role="listitem">
        <span class="alert-icon" aria-hidden="true">🔴</span>
        <span>Beer Saigon is out of stock</span>
        <button aria-label="Resolve out of stock alert for Beer Saigon">
          Resolve
        </button>
      </li>
    </ul>
  </section>
</main>

<!-- Form accessibility -->
<form role="form" aria-labelledby="add-item-form">
  <fieldset>
    <legend id="add-item-form">Add New Inventory Item</legend>
    
    <div class="input-group">
      <label for="item-name" class="input-label">
        Item Name
        <span aria-label="required" class="required">*</span>
      </label>
      <input
        id="item-name"
        type="text"
        class="input-base"
        required
        aria-describedby="item-name-hint item-name-error"
        aria-invalid="false"
      />
      <div id="item-name-hint" class="input-hint">
        Enter the full name of the inventory item
      </div>
      <div id="item-name-error" class="input-error-message" role="alert" aria-live="polite">
        <!-- Error messages appear here -->
      </div>
    </div>
  </fieldset>
</form>

<!-- Data table accessibility -->
<table role="table" aria-label="Inventory Items">
  <caption class="sr-only">
    Inventory items with current stock levels, last updated times, and available actions
  </caption>
  <thead>
    <tr>
      <th scope="col" aria-sort="none">
        <button class="sortable" aria-label="Sort by item name">
          Item Name
        </button>
      </th>
      <th scope="col" aria-sort="descending">
        <button class="sortable" aria-label="Sort by stock level, currently sorted descending">
          Stock Level
        </button>
      </th>
      <th scope="col">Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Beer Saigon 330ml</th>
      <td>
        <span class="sr-only">Stock level: </span>
        250 bottles
      </td>
      <td>
        <button aria-label="Edit Beer Saigon 330ml">Edit</button>
        <button aria-label="View details for Beer Saigon 330ml">Details</button>
      </td>
    </tr>
  </tbody>
</table>
```

### 7.2 Keyboard Navigation

#### Focus Management
```css
/* Custom focus indicators */
.focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip links for keyboard users */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-600);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}

/* Focus trap for modals */
.modal-open {
  overflow: hidden;
}

.modal-open *:not(.modal *) {
  pointer-events: none;
}

/* Keyboard-only interactions */
.keyboard-user .hover-only {
  display: none;
}

.keyboard-user .focus-only {
  display: block;
}

/* Tab order management */
.tab-group {
  display: flex;
}

.tab-group [role="tab"] {
  border: 1px solid var(--gray-300);
  padding: 0.5rem 1rem;
  background: var(--gray-100);
  cursor: pointer;
}

.tab-group [role="tab"]:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: -2px;
  z-index: 10;
}

.tab-group [role="tab"][aria-selected="true"] {
  background: white;
  border-bottom-color: white;
  position: relative;
}

/* Roving tabindex for complex widgets */
.item-grid [role="gridcell"]:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: -2px;
}
```

#### Keyboard Shortcuts
```typescript
interface KeyboardShortcuts {
  // Global shortcuts
  global: {
    'Ctrl+/': 'show_help_modal';
    'Ctrl+K': 'open_command_palette';
    'Escape': 'close_modal_or_cancel_action';
    'F1': 'show_keyboard_shortcuts';
  };
  
  // Navigation shortcuts
  navigation: {
    'G then D': 'go_to_dashboard';
    'G then I': 'go_to_inventory';
    'G then R': 'go_to_reports';
    'G then S': 'go_to_settings';
  };
  
  // Inventory management
  inventory: {
    'N': 'new_item';
    'F': 'focus_search';
    'R': 'refresh_list';
    'E': 'edit_selected_item';
    'Delete': 'delete_selected_item';
  };
  
  // Form shortcuts
  forms: {
    'Ctrl+Enter': 'submit_form';
    'Ctrl+S': 'save_draft';
    'Escape': 'cancel_form';
    'Tab': 'next_field';
    'Shift+Tab': 'previous_field';
  };
  
  // Camera and OCR
  camera: {
    'Space': 'take_photo';
    'Enter': 'confirm_capture';
    'R': 'retake_photo';
    'Escape': 'close_camera';
  };
}
```

---

## 8. ERROR HANDLING AND FEEDBACK

### 8.1 Error State Design

#### Error Message Patterns
```typescript
interface ErrorStates {
  // Network and connectivity errors
  network_errors: {
    offline: {
      icon: '📡';
      title: 'You\'re offline';
      message: 'Some features may not work. We\'ll sync your changes when you\'re back online.';
      actions: ['retry', 'work_offline'];
      style: 'info_banner';
    };
    
    timeout: {
      icon: '⏱️';
      title: 'Request timed out';
      message: 'The server is taking longer than usual to respond. Please try again.';
      actions: ['retry', 'contact_support'];
      style: 'warning_banner';
    };
    
    server_error: {
      icon: '⚠️';
      title: 'Something went wrong';
      message: 'We\'re experiencing technical difficulties. Please try again in a few minutes.';
      actions: ['retry', 'contact_support'];
      style: 'error_banner';
    };
  };
  
  // Validation errors
  validation_errors: {
    required_field: {
      message: 'This field is required';
      display: 'inline_with_field';
      timing: 'on_blur_or_submit';
    };
    
    invalid_format: {
      message: 'Please enter a valid {field_type}';
      display: 'inline_with_field';
      timing: 'real_time_after_first_attempt';
    };
    
    out_of_range: {
      message: 'Value must be between {min} and {max}';
      display: 'inline_with_field';
      suggestions: 'show_valid_range';
    };
  };
  
  // Business logic errors
  business_errors: {
    insufficient_stock: {
      icon: '📦';
      title: 'Insufficient stock';
      message: 'Only {available} {unit} available. Requested: {requested} {unit}';
      actions: ['adjust_quantity', 'check_other_locations'];
      style: 'modal_dialog';
    };
    
    ocr_failed: {
      icon: '📷';
      title: 'Could not read receipt';
      message: 'Please try taking a clearer photo or enter the information manually.';
      actions: ['retake_photo', 'manual_entry', 'tips_for_better_photos'];
      style: 'inline_alert';
    };
    
    permission_denied: {
      icon: '🔒';
      title: 'Access denied';
      message: 'You don\'t have permission to perform this action.';
      actions: ['contact_manager', 'view_permissions'];
      style: 'modal_dialog';
    };
  };
}
```

#### Error Recovery Flows
```css
/* Error state layouts */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  min-height: 200px;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.error-message {
  color: var(--gray-600);
  margin-bottom: 1.5rem;
  max-width: 400px;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* Inline error styling */
.field-error {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--error-600);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.field-error-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

/* Banner error styling */
.error-banner {
  background: var(--error-50);
  border: 1px solid var(--error-200);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.error-banner-icon {
  color: var(--error-500);
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.error-banner-content {
  flex: 1;
}

.error-banner-title {
  font-weight: 600;
  color: var(--error-800);
  margin-bottom: 0.25rem;
}

.error-banner-message {
  color: var(--error-700);
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.error-banner-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Empty state styling */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1rem;
  color: var(--gray-500);
}

.empty-state-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.empty-state-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--gray-700);
  margin-bottom: 0.5rem;
}

.empty-state-message {
  margin-bottom: 1.5rem;
  max-width: 300px;
  line-height: 1.5;
}

/* Loading states */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--gray-200);
  border-top: 4px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 1rem;
  color: var(--gray-600);
  font-size: 0.875rem;
}

/* Skeleton loading for content */
.skeleton {
  background: linear-gradient(90deg, var(--gray-200) 25%, var(--gray-100) 50%, var(--gray-200) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 1rem;
  margin-bottom: 0.5rem;
}

.skeleton-text.short {
  width: 60%;
}

.skeleton-text.medium {
  width: 80%;
}

.skeleton-text.long {
  width: 100%;
}

.skeleton-button {
  height: 2.5rem;
  width: 120px;
}

.skeleton-card {
  height: 200px;
  width: 100%;
}
```

---

## 9. LOCALIZATION AND CULTURAL CONSIDERATIONS

### 9.1 Vietnamese Language Support

#### Typography and Text Handling
```css
/* Vietnamese-specific typography */
.text-vietnamese {
  font-family: 'Inter', 'Segoe UI', 'San Francisco', 'Helvetica Neue', sans-serif;
  font-feature-settings: "kern" 1, "liga" 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Tone mark spacing adjustments */
.vietnamese-text {
  line-height: 1.6; /* Extra line height for tone marks */
  letter-spacing: 0.01em; /* Slight letter spacing for clarity */
}

/* Input field adjustments for Vietnamese */
.input-vietnamese {
  font-size: 16px; /* Prevents zoom on iOS */
  line-height: 1.5;
  padding: 0.75rem 1rem; /* Extra padding for tone marks */
}

/* Search and autocomplete for Vietnamese */
.search-vietnamese {
  /* Support for both with and without tone marks */
  font-variant-caps: normal;
  text-transform: none;
}
```

#### Cultural Design Considerations
```typescript
interface CulturalDesign {
  // Color preferences and cultural meanings
  color_culture: {
    preferred_colors: {
      red: 'auspicious_but_use_carefully'; // Lucky but can mean danger
      gold: 'prosperity_and_success';      // Very positive
      green: 'growth_and_harmony';         // Generally positive
      blue: 'trust_and_stability';         // Professional
    };
    
    color_combinations: {
      red_and_gold: 'traditional_festive';
      blue_and_white: 'clean_professional';
      green_and_white: 'fresh_natural';
    };
    
    avoid_combinations: {
      black_and_white: 'funeral_associations';
      all_red: 'too_intense_for_work_app';
    };
  };
  
  // Number and currency formatting
  number_formatting: {
    thousands_separator: '.';     // 1.000.000
    decimal_separator: ',';       // 1,50
    currency_position: 'suffix';  // 100.000 VND
    currency_symbol: 'VND';
    large_numbers: 'use_K_M_notation'; // 1,2M VND
  };
  
  // Date and time preferences
  datetime_formatting: {
    date_format: 'DD/MM/YYYY';    // 02/07/2025
    time_format: '24_hour';       // 14:30
    week_start: 'monday';
    business_hours: '07:00-22:00';
    lunch_break: '11:30-13:30';
  };
  
  // Business terminology
  business_terms: {
    inventory: 'kho';
    receipt: 'hóa_đơn';
    supplier: 'nhà_cung_cấp';
    department: 'bộ_phận';
    stock: 'tồn_kho';
    waste: 'hao_hụt';
    expiry: 'hết_hạn';
  };
}
```

### 9.2 RTL and Accessibility Adaptations

#### Responsive Design for Different Text Lengths
```css
/* Flexible layouts for Vietnamese text */
.label-container {
  min-width: 120px; /* Vietnamese labels can be longer */
  flex-shrink: 0;
}

.button-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

/* Responsive navigation for longer menu items */
.nav-item {
  padding: 0.75rem 1rem;
  text-align: center;
  min-width: 80px;
}

@media (max-width: 480px) {
  .nav-item {
    font-size: 0.75rem;
    padding: 0.5rem 0.25rem;
  }
  
  .nav-item-text {
    display: block;
    line-height: 1.2;
  }
}

/* Form layout adjustments */
.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .form-row {
    flex-direction: row;
    align-items: center;
  }
  
  .form-row .label {
    min-width: 140px; /* Space for Vietnamese labels */
    margin-bottom: 0;
  }
}

/* Data table responsive design */
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-responsive table {
  min-width: 600px; /* Ensure table doesn't get too cramped */
}

/* Mobile card layout for complex tables */
@media (max-width: 768px) {
  .table-mobile-cards .table-row {
    display: block;
    border: 1px solid var(--gray-200);
    border-radius: 8px;
    margin-bottom: 1rem;
    padding: 1rem;
  }
  
  .table-mobile-cards .table-cell {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--gray-100);
  }
  
  .table-mobile-cards .table-cell:last-child {
    border-bottom: none;
  }
  
  .table-mobile-cards .cell-label {
    font-weight: 500;
    color: var(--gray-600);
  }
  
  .table-mobile-cards .cell-value {
    text-align: right;
  }
}
```

---

## 10. PERFORMANCE OPTIMIZATION

### 10.1 Image and Asset Optimization

#### Responsive Images and Progressive Loading
```css
/* Responsive image containers */
.image-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: var(--gray-100);
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity var(--transition-normal);
}

/* Loading placeholder */
.image-loading {
  opacity: 0;
}

.image-loaded {
  opacity: 1;
}

/* Progressive image loading */
.image-progressive {
  position: relative;
}

.image-progressive .image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
  z-index: 1;
}

.image-progressive .image-full {
  position: relative;
  z-index: 2;
}

/* Lazy loading intersection observer targets */
.lazy-load {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.lazy-load.loaded {
  opacity: 1;
  transform: translateY(0);
}

/* Critical CSS inlining for above-the-fold content */
.above-fold {
  /* Inline critical styles here */
  font-family: var(--font-primary);
  background-color: var(--gray-50);
}

/* Resource hints for performance */
.preload-hint {
  /* Used with JavaScript to add preload hints */
}
```

#### Code Splitting and Bundle Optimization
```typescript
interface PerformanceOptimization {
  // Code splitting strategy
  code_splitting: {
    route_based: {
      dashboard: 'lazy_load_on_route_change';
      inventory: 'lazy_load_on_route_change';
      reports: 'lazy_load_on_route_change';
      settings: 'lazy_load_on_route_change';
    };
    
    component_based: {
      chart_components: 'load_when_needed';
      camera_module: 'load_on_first_use';
      export_utilities: 'load_on_export_action';
      advanced_filters: 'load_on_filter_expand';
    };
    
    vendor_splitting: {
      react_vendor: 'separate_chunk';
      chart_libraries: 'separate_chunk';
      date_utilities: 'separate_chunk';
      ocr_processing: 'separate_chunk';
    };
  };
  
  // Asset optimization
  asset_optimization: {
    images: {
      format: 'webp_with_fallback';
      compression: 85; // 85% quality
      responsive_sizes: [320, 640, 1024, 1280];
      lazy_loading: true;
      progressive_jpeg: true;
    };
    
    fonts: {
      format: 'woff2_primary';
      preload: ['inter-400', 'inter-600']; // Most used weights
      fallback_stack: 'system_fonts';
      display: 'swap'; // font-display: swap
    };
    
    icons: {
      format: 'svg_sprite';
      critical_icons: 'inline_svg';
      lazy_icons: 'load_on_demand';
    };
  };
  
  // Runtime performance
  runtime_optimization: {
    virtual_scrolling: {
      enabled_for: 'lists_over_100_items';
      buffer_size: 10; // Items outside viewport
      item_height: 'dynamic_with_estimation';
    };
    
    debounced_search: {
      delay: 300; // milliseconds
      min_characters: 2;
      cache_results: true;
    };
    
    memoization: {
      expensive_calculations: 'react_memo';
      api_responses: 'swr_cache';
      computed_values: 'useMemo_hook';
    };
  };
}
```

### 10.2 Mobile Performance Optimizations

#### Battery and Data Usage Considerations
```css
/* Reduced animations for low power mode */
@media (prefers-reduced-motion: reduce) {
  .animate-pulse,
  .animate-spin,
  .animate-slideUp {
    animation: none;
  }
  
  .transition-all {
    transition: none;
  }
}

/* Optimize for slow connections */
@media (max-width: 480px) and (max-resolution: 1dppx) {
  /* Reduce image quality for low-res displays */
  .image-quality-adaptive {
    image-rendering: optimizeSpeed;
  }
  
  /* Simplify complex layouts */
  .complex-grid {
    display: block;
  }
  
  .complex-grid > * {
    margin-bottom: 1rem;
  }
}

/* Touch optimization */
.touch-optimized {
  /* Larger touch targets */
  min-height: 44px;
  min-width: 44px;
  
  /* Remove hover effects on touch devices */
  @media (hover: none) {
    &:hover {
      transform: none;
      background-color: inherit;
    }
  }
}

/* Reduce layout thrashing */
.layout-stable {
  /* Use transform instead of changing layout properties */
  will-change: transform, opacity;
  transform: translateZ(0); /* Force hardware acceleration */
}

/* Optimize scrolling performance */
.scroll-container {
  -webkit-overflow-scrolling: touch;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Reduce paint complexity */
.paint-optimized {
  /* Avoid expensive CSS properties during animations */
  will-change: transform;
  contain: layout style paint;
}
```

---

## 11. TESTING AND VALIDATION

### 11.1 Visual Testing Guidelines

#### Component Testing Standards
```typescript
interface VisualTestingStandards {
  // Cross-browser testing requirements
  browser_support: {
    primary: ['Chrome 90+', 'Safari 14+', 'Firefox 88+'];
    secondary: ['Edge 90+', 'Samsung Internet 14+'];
    mobile: ['iOS Safari 14+', 'Chrome Mobile 90+'];
  };
  
  // Responsive testing breakpoints
  responsive_testing: {
    breakpoints: [375, 768, 1024, 1280, 1920]; // px
    orientations: ['portrait', 'landscape'];
    zoom_levels: [100, 125, 150, 200]; // percentage
  };
  
  // Accessibility testing
  a11y_testing: {
    automated_tools: ['axe-core', 'lighthouse'];
    manual_testing: ['keyboard_navigation', 'screen_reader'];
    color_contrast: 'wcag_aa_minimum';
    focus_management: 'logical_tab_order';
  };
  
  // Performance testing
  performance_testing: {
    lighthouse_scores: {
      performance: 90; // minimum score
      accessibility: 95;
      best_practices: 90;
      seo: 85;
    };
    
    core_web_vitals: {
      lcp: '2.5s'; // Largest Contentful Paint
      fid: '100ms'; // First Input Delay
      cls: '0.1'; // Cumulative Layout Shift
    };
  };
}
```

#### User Testing Scenarios
```typescript
interface UserTestingScenarios {
  // Task-based testing scenarios
  core_workflows: [
    {
      name: 'Receipt Processing';
      steps: [
        'Open camera from dashboard',
        'Capture receipt image',
        'Review OCR results',
        'Correct any errors',
        'Save to inventory'
      ];
      success_criteria: ['Complete in under 2 minutes', 'OCR accuracy > 90%'];
      user_types: ['staff', 'supervisor'];
    },
    
    {
      name: 'Inventory Withdrawal';
      steps: [
        'Navigate to inventory',
        'Search for item',
        'Enter withdrawal quantity',
        'Select department',
        'Confirm withdrawal'
      ];
      success_criteria: ['Complete in under 1 minute', 'No errors'];
      user_types: ['all_roles'];
    },
    
    {
      name: 'Discrepancy Resolution';
      steps: [
        'Receive discrepancy alert',
        'Review discrepancy details',
        'Provide explanation',
        'Upload photo evidence',
        'Submit for approval'
      ];
      success_criteria: ['Complete in under 3 minutes', 'Clear understanding'];
      user_types: ['staff', 'supervisor'];
    }
  ];
  
  // Usability testing criteria
  usability_metrics: {
    task_completion_rate: 95; // percentage
    error_rate: 5; // percentage max
    time_on_task: {
      expert_users: 'baseline';
      new_users: 'baseline_x_3'; // 3x longer acceptable for new users
    };
    satisfaction_score: 4.0; // out of 5.0
  };
  
  // Edge case testing
  edge_cases: [
    'Poor lighting conditions for camera',
    'Very long item names',
    'Network connectivity issues',
    'Large discrepancy values',
    'Multiple rapid transactions',
    'Low device storage',
    'Slow device performance'
  ];
}
```

### 11.2 Design System Validation

#### Component Library Testing
```css
/* Component testing utilities */
.test-container {
  padding: 2rem;
  background: var(--gray-50);
  border: 1px dashed var(--gray-300);
  margin: 1rem 0;
}

.test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.test-item {
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--gray-200);
}

.test-label {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* State testing helpers */
.state-normal { /* default state */ }
.state-hover { /* simulate hover */ }
.state-focus { /* simulate focus */ }
.state-active { /* simulate active */ }
.state-disabled { /* disabled state */ }
.state-loading { /* loading state */ }
.state-error { /* error state */ }
.state-success { /* success state */ }

/* Responsive testing helpers */
.mobile-preview {
  max-width: 375px;
  border: 2px solid var(--gray-300);
  border-radius: 20px;
  padding: 20px 10px;
  margin: 1rem auto;
  background: white;
}

.tablet-preview {
  max-width: 768px;
  border: 2px solid var(--gray-300);
  border-radius: 12px;
  padding: 20px;
  margin: 1rem auto;
  background: white;
}

.desktop-preview {
  max-width: 1200px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  padding: 20px;
  margin: 1rem auto;
  background: white;
}

/* Accessibility testing helpers */
.high-contrast-test {
  filter: contrast(200%);
}

.colorblind-test {
  filter: grayscale(100%);
}

.focus-test * {
  outline: 2px solid red !important;
  outline-offset: 2px !important;
}

/* Typography testing */
.typography-scale {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.typography-sample {
  padding: 1rem;
  border-left: 3px solid var(--primary-500);
  background: var(--gray-50);
}

.typography-sample .label {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-bottom: 0.25rem;
}

/* Color palette testing */
.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.color-swatch {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.color-info {
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--gray-600);
}
```

---

## 12. IMPLEMENTATION CHECKLIST

### 12.1 Development Handoff Checklist

#### Design Assets and Documentation
```typescript
interface DesignHandoff {
  // Required deliverables
  deliverables: {
    design_system: {
      component_library: 'figma_with_code_snippets';
      color_palette: 'css_custom_properties';
      typography_scale: 'css_classes_and_utilities';
      spacing_system: 'grid_and_spacing_tokens';
      icon_library: 'svg_sprite_and_individual_files';
    };
    
    mockups_and_wireframes: {
      mobile_screens: 'key_user_flows_documented';
      desktop_layouts: 'responsive_behavior_specified';
      interaction_states: 'hover_focus_active_documented';
      empty_states: 'no_data_scenarios_designed';
      error_states: 'error_handling_flows_mapped';
    };
    
    technical_specifications: {
      responsive_breakpoints: 'documented_in_css';
      animation_specifications: 'duration_and_easing_defined';
      accessibility_requirements: 'wcag_compliance_noted';
      browser_support: 'testing_matrix_provided';
      performance_targets: 'metrics_and_thresholds_set';
    };
  };
  
  // Developer resources
  developer_resources: {
    style_guide: 'comprehensive_design_system_docs';
    component_examples: 'html_css_examples_for_each_component';
    interaction_patterns: 'javascript_behavior_specifications';
    asset_preparation: 'optimized_images_and_icons';
    testing_guidelines: 'visual_regression_test_cases';
  };
  
  // Quality assurance
  qa_requirements: {
    design_review: 'pixel_perfect_implementation_check';
    responsive_testing: 'all_breakpoints_validated';
    accessibility_audit: 'keyboard_and_screen_reader_testing';
    performance_validation: 'lighthouse_scores_meeting_targets';
    cross_browser_testing: 'supported_browsers_verified';
  };
}
```

### 12.2 Launch Readiness Criteria

#### Pre-Launch Validation
```typescript
interface LaunchReadiness {
  // Technical validation
  technical_criteria: {
    performance: {
      lighthouse_performance: 90;
      lighthouse_accessibility: 95;
      lighthouse_seo: 85;
      core_web_vitals: 'all_green';
    };
    
    functionality: {
      critical_path_testing: 'all_core_workflows_working';
      error_handling: 'graceful_degradation_verified';
      offline_functionality: 'offline_modes_tested';
      data_integrity: 'transaction_accuracy_validated';
    };
    
    security: {
      authentication: 'secure_login_implemented';
      authorization: 'role_based_access_working';
      data_protection: 'sensitive_data_encrypted';
      input_validation: 'xss_and_injection_prevented';
    };
  };
  
  // User experience validation
  ux_criteria: {
    usability_testing: {
      task_completion_rate: 95;
      user_satisfaction: 4.0;
      error_recovery_rate: 90;
      learning_curve: 'acceptable_for_target_users';
    };
    
    accessibility: {
      keyboard_navigation: 'fully_functional';
      screen_reader_compatibility: 'tested_with_nvda_jaws';
      color_contrast: 'wcag_aa_compliant';
      focus_management: 'logical_and_visible';
    };
    
    responsive_design: {
      mobile_optimization: 'touch_friendly_interface';
      tablet_layout: 'optimized_for_restaurant_tablets';
      desktop_functionality: 'full_feature_parity';
      cross_device_sync: 'seamless_experience';
    };
  };
  
  // Content and localization
  content_criteria: {
    vietnamese_localization: {
      translation_accuracy: 'native_speaker_reviewed';
      cultural_appropriateness: 'restaurant_industry_terms';
      text_expansion_handled: 'layouts_accommodate_longer_text';
      number_formatting: 'vietnamese_standards_followed';
    };
    
    help_documentation: {
      user_onboarding: 'step_by_step_tutorials';
      feature_explanations: 'contextual_help_available';
      troubleshooting_guide: 'common_issues_documented';
      video_tutorials: 'key_workflows_demonstrated';
    };
  };
  
  // Business requirements
  business_criteria: {
    inventory_accuracy: {
      ocr_performance: 'meets_accuracy_targets';
      reconciliation_logic: 'business_rules_correctly_implemented';
      reporting_accuracy: 'financial_calculations_verified';
      audit_trail: 'complete_transaction_history';
    };
    
    operational_readiness: {
      staff_training: 'training_materials_prepared';
      change_management: 'adoption_strategy_planned';
      support_procedures: 'escalation_paths_defined';
      backup_processes: 'fallback_procedures_documented';
    };
  };
}
```

---

**Document Control:**
- **Version:** 1.0
- **Date:** July 2025
- **Next Review:** August 2025
- **Owner:** UI/UX Designer
- **Contributors:** Frontend Developer, Accessibility Specialist

**Approval Signatures:**
- **Design Lead:** _________________ Date: _______
- **Frontend Lead:** _________________ Date: _______
- **Product Manager:** _________________ Date: _______
- **Business Owner:** _________________ Date: _______

---

*This UI/UX Design Specifications document provides comprehensive guidelines for creating a user-friendly, accessible, and culturally appropriate interface for the Restaurant Inventory Management System. All visual and interaction designs should adhere to these specifications to ensure consistency and quality throughout the application.*│ [Complete Reconciliation]           │
└─────────────────────────────────────┘
```

#### Discrepancy Explanation Flow
```
┌─────────────────────────────────────┐
│ ← Back    Explain Discrepancy        │
│                                     │
│ 🍺 Bia Saigon 330ml                 │
│ Discrepancy: 1 chai (10%)           │
│                                     │
│ What happened to the missing item?  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ○ Bottle broke during service   │ │ ← Radio buttons
│ │ ○ Customer return/wrong order    │ │
│ │ ○ Sampling for quality check    │ │
│ │ ○ Staff consumption (approved)   │ │
│ │ ○ Spilled during cleaning       │ │
│ │ ○ Other reason (specify below)  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Additional Details:                 │
│ ┌─────────────────────────────────┐ │
│ │ [Text area for explanation]     │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Photo Evidence (Optional):          │
│ ┌─────────────────────────────────┐ │
│ │ [📷 Take Photo] [📁 From Gallery]│ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Cancel]              [Submit]      │
└─────────────────────────────────────┘

Approval Flow:
┌─────────────────────────────────────┐
│ ← Back    Approve Discrepancy        │
│                                     │
│ 🍺 Bia Saigon 330ml                 │
│ Reason: Bottle broke during service │
│ Photo: [thumbnail image]            │
│ Reported by: Nguyen Van A           │
│                                     │
│ Value Impact: 15,000 VND            │
│ Department: Bar                     │
│ Shift: Afternoon (12:00-18:00)      │
│                                     │
│ Manager Decision:                   │
│ ┌─────────────────────────────────┐ │
│ │ ○ Approve - Acceptable loss     │ │
│ │ ○ Approve - Training needed     │ │
│ │ ○ Reject - Need more info       │ │
│ │ ○ Escalate to owner             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Comments:                           │
│ ┌─────────────────────────────────┐ │
│ │ [Manager notes...]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Reject]                [Approve]   │
└─────────────────────────────────────┘
```

### 3.5 Reports and Analytics Interface

#### Reports Dashboard
```
┌─────────────────────────────────────┐
│ ☰ Reports & Analytics       📅 ⚙️   │
│                                     │
│ Quick Date Range:                   │
│ [Today] [Yesterday] [This Week] [▼] │
│                                     │
│ ═══ Key Metrics ═══                 │
│ ┌───────┬───────┬───────┬─────────┐ │
│ │Inventory│Loss  │Orders │ Accuracy│ │
│ │  45.2M  │ 2.8% │  12   │  98.5%  │ │
│ │   VND   │      │       │         │ │
│ └───────┴───────┴───────┴─────────┘ │
│                                     │
│ ═══ Trending Charts ═══             │
│ ┌─────────────────────────────────┐ │
│ │ 📈 Inventory Value (7 days)     │ │
│ │        /\                       │ │
│ │       /  \     /\               │ │
│ │      /    \   /  \    /\        │ │
│ │     /      \_/    \__/  \       │ │
│ │    /                    \__     │ │
│ │ Mon Tue Wed Thu Fri Sat Sun     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ═══ Department Performance ═══      │
│ ┌─────────────────────────────────┐ │
│ │ Bar:     ████████░░ 80% ⚠️      │ │
│ │ Kitchen: ███████████ 95% ✅     │ │
│ │ Prep:    ██████████░ 85% ⚠️     │ │
│ │ Storage: ███████████ 98% ✅     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ═══ Quick Reports ═══               │
│ ┌─────────┬─────────┬─────────────┐ │
│ │📊 Daily │📈 Loss  │📋 Inventory │ │
│ │Summary  │Analysis │ Summary     │ │
│ └─────────┴─────────┴─────────────┘ │
│                                     │
│ [Generate Custom Report]            │
└─────────────────────────────────────┘
```

#### Loss Analysis Report
```
┌─────────────────────────────────────┐
│ ← Back    Loss Analysis - This Week  │
│                                     │
│ 📅 June 26 - July 2, 2025          │
│ 💰 Total Loss: 1,247,500 VND        │
│ 📊 Loss Rate: 2.8% (Target: <3%)    │
│                                     │
│ ═══ Loss by Category ═══            │
│ ┌─────────────────────────────────┐ │
│ │ Beverages      750K (60%) 🍺    │ │
│ │ ████████████░░░░░░░░░░          │ │
│ │                                 │ │
│ │ Fresh Meat     312K (25%) 🥩    │ │
│ │ █████░░░░░░░░░░░░░░░            │ │
│ │                                 │ │
│ │ Vegetables     125K (10%) 🥬    │ │
│ │ ██░░░░░░░░░░░░░░░░░░           │ │
│ │                                 │ │
│ │ Other          60K  (5%)  📦    │ │
│ │ █░░░░░░░░░░░░░░░░░░░           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ═══ Loss by Reason ═══              │
│ ┌─────────────────────────────────┐ │
│ │ Breakage/Damage  45% 💥         │ │
│ │ Expiry/Spoilage  30% ⏰         │ │
│ │ Measurement Error 15% 📏        │ │
│ │ Unknown/Theft    10% ❓         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ═══ Top Loss Items ═══              │
│ ┌─────────────────────────────────┐ │
│ │ 1. Bia Saigon    180K (14.4%)   │ │
│ │ 2. Thịt bò úc    125K (10.0%)   │ │
│ │ 3. Coca Cola     95K  (7.6%)    │ │
│ │ 4. Tôm tươi      80K  (6.4%)    │ │
│ │ 5. Cải thảo      67K  (5.4%)    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [📤 Export] [📊 Drill Down] [📧 Email]│
└─────────────────────────────────────┘
```

---

## 4. MOBILE-SPECIFIC DESIGN PATTERNS

### 4.1 Touch-Friendly Interface Design

#### Touch Target Specifications
```css
/* Touch target guidelines */
.touch-target {
  min-height: 44px;  /* iOS Human Interface Guidelines */
  min-width: 44px;
  padding: 12px;     /* Comfortable padding */
}

/* Large touch targets for primary actions */
.touch-target-large {
  min-height: 56px;
  min-width: 56px;
  padding: 16px;
}

/* Extra spacing between adjacent touch targets */
.touch-group {
  gap: 8px; /* Minimum 8px between targets */
}

/* Thumb-friendly navigation zones */
@media (max-width: 480px) {
  .thumb-zone-easy {
    bottom: 0;
    height: 25vh; /* Bottom 25% of screen - easy reach */
  }
  
  .thumb-zone-comfortable {
    bottom: 25vh;
    height: 50vh; /* Middle 50% - comfortable reach */
  }
  
  .thumb-zone-difficult {
    top: 0;
    height: 25vh; /* Top 25% - difficult reach */
  }
}
```

#### Gesture Support
```typescript
interface GesturePatterns {
  // Swipe gestures
  swipe_actions: {
    list_items: {
      swipe_left: 'delete_action';
      swipe_right: 'edit_action';
      long_press: 'context_menu';
    };
    
    cards: {
      swipe_up: 'view_details';
      swipe_down: 'dismiss';
    };
  };
  
  // Pull-to-refresh
  pull_refresh: {
    enabled_screens: ['dashboard', 'inventory_list', 'reports'];
    trigger_distance: '80px';
    animation: 'custom_loading_spinner';
  };
  
  // Pinch and zoom
  zoom_support: {
    enabled_on: ['receipt_images', 'charts', 'item_photos'];
    max_zoom: 300; // 3x zoom
    min_zoom: 50;  // 0.5x zoom
  };
}
```

### 4.2 Offline-First Design

#### Offline State Indicators
```css
/* Offline mode styling */
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--warning-500);
  color: white;
  padding: 0.5rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1000;
  transform: translateY(-100%);
  transition: transform 0.3s ease-in-out;
}

.offline-banner.show {
  transform: translateY(0);
}

/* Sync status indicators */
.sync-status {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--gray-500);
}

.sync-status.syncing {
  color: var(--primary-500);
}

.sync-status.error {
  color: var(--error-500);
}

.sync-status.success {
  color: var(--success-500);
}

/* Offline-ready content styling */
.content-offline-ready {
  opacity: 1;
}

.content-needs-sync {
  position: relative;
}

.content-needs-sync::after {
  content: '📡';
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  font-size: 0.75rem;
}

/* Queue indicators for pending actions */
.pending-queue-indicator {
  position: fixed;
  bottom: 80px; /* Above bottom navigation */
  right: 1rem;
  background-color: var(--warning-500);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}
```

#### Progressive Loading States
```typescript
interface LoadingStates {
  // Skeleton screens for initial loads
  skeleton_screens: {
    dashboard: 'show_layout_with_gray_placeholders';
    inventory_list: 'show_item_card_skeletons';
    reports: 'show_chart_placeholders';
  };
  
  // Progressive image loading
  image_loading: {
    placeholder: 'low_quality_blur';
    progressive: 'load_higher_quality_on_demand';
    fallback: 'default_item_icons';
  };
  
  // Chunked content loading
  infinite_scroll: {
    page_size: 20;
    load_trigger: 'scroll_to_80_percent';
    loading_indicator: 'inline_spinner';
  };
}
```

### 4.3 Camera and Image Capture UX

#### Camera Interface Design
```css
/* Camera overlay UI */
.camera-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10;
}

/* Viewfinder frame */
.viewfinder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 60%;
  border: 2px solid var(--primary-500);
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
}

/* Corner indicators */
.viewfinder::before,
.viewfinder::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid var(--primary-500);
}

.viewfinder::before {
  top: -3px;
  left: -3px;
  border-right: none;
  border-bottom: none;
}

.viewfinder::after {
  bottom: -3px;
  right: -3px;
  border-left: none;
  border-top: none;
}

/* Capture button */
.capture-button {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: white;
  border: 4px solid var(--gray-300);
  cursor: pointer;
  transition: all 0.2s ease;
}

.capture-button:active {
  transform: translateX(-50%) scale(0.95);
  border-color: var(--primary-500);
}

/* Camera controls */
.camera-controls {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.camera-control-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

/* Image preview and editing */
.image-preview {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--gray-100);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-edit-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 1rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.image-edit-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 0.875rem;
  cursor: pointer;
}
```

#### Smart Capture Guidance
```typescript
interface CaptureGuidance {
  // Real-time feedback during capture
  realtime_feedback: {
    document_detection: {
      show_green_outline: 'when_receipt_detected';
      show_red_outline: 'when_no_document_found';
      vibrate_on_detection: true;
    };
    
    quality_indicators: {
      too_blurry: 'show_steady_hand_message';
      too_dark: 'show_more_light_message';
      too_bright: 'show_reduce_glare_message';
      tilted: 'show_straighten_message';
    };
    
    distance_guidance: {
      too_close: 'move_camera_back';
      too_far: 'move_camera_closer';
      optimal: 'green_checkmark';
    };
  };
  
  // Auto-capture when conditions are met
  auto_capture: {
    enabled: false; // Manual capture preferred for control
    conditions: [
      'document_detected_for_2_seconds',
      'quality_score_above_threshold',
      'minimal_camera_movement'
    ];
  };
  
  // Enhancement suggestions
  capture_tips: [
    'Place receipt on flat, well-lit surface',
    'Ensure all text is visible and clear',
    'Avoid shadows and glare',
    'Keep camera steady while capturing'
  ];
}
```

---

## 5. DESKTOP LAYOUT ADAPTATIONS

### 5.1 Responsive Grid System

#### Desktop Dashboard Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ ☰ Restaurant Inventory    🔍 Search...     🔔(3) ⚙️ 👤 Logout  │ ← Header bar
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┬─────────────┬─────────────┬─────────────────────┐ │
│ │ Total Items │ Stock Value │ Low Stock   │ Alerts             │ │
│ │     234     │   45.2M     │      8      │        3           │ │
│ │   items     │    VND      │    items    │    critical        │ │
│ └─────────────┴─────────────┴─────────────┴─────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────┬───────────────────────────────┐ │
│ │ 📈 Inventory Trend (30 days) │ 🏢 Department Status          │ │
│ │                             │ ┌───────────────────────────┐ │ │
│ │      Chart Area             │ │ Bar:      🔴 3 issues     │ │ │
│ │                             │ │ Kitchen:  ✅ All good     │ │ │
│ │                             │ │ Prep:     ⚠️ 1 warning    │ │ │
│ │                             │ │ Storage:  ✅ All good     │ │ │
│ │                             │ └───────────────────────────┘ │ │
│ └─────────────────────────────┴───────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🚨 Critical Alerts & Recent Activity                       │ │
│ │ ┌─────────────────────────┬─────────────────────────────────┐ │ │
│ │ │ Alerts (3)             │ Recent Transactions             │ │ │
│ │ │ • Bia Saigon - Out     │ • 09:15 - Nhập 5kg thịt bò     │ │ │
│ │ │ • Bar discrepancy 10%  │ • 09:30 - Xuất 2kg rau muống   │ │ │
│ │ │ • 5 items expire today │ • 10:00 - Trả về 3 chai bia    │ │ │
│ │ └─────────────────────────┴─────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Multi-Panel Inventory Management
```
┌─────────────────────────────────────────────────────────────────┐
│ ☰ Inventory Management                         [+ Add Item] ⚙️  │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┬───────────────────────────────────────┐ │
│ │ Sidebar Navigation  │ Main Content Area                     │ │
│ │                     │                                       │ │
│ │ 📦 All Items (234)  │ [🔍 Search...] [Filter ▼] [Sort ▼]  │ │
│ │ 🔴 Low Stock (8)    │                                       │ │
│ │ ⚠️ Expiring (5)     │ ┌─────────────────────────────────────┐ │ │
│ │ 🏪 By Category:     │ │ Item List/Grid View                 │ │ │
│ │   • Fresh Meat (45) │ │                                     │ │ │
│ │   • Vegetables (67) │ │ [Item cards in responsive grid]     │ │ │
│ │   • Beverages (89)  │ │                                     │ │ │
│ │   • Dry Goods (33)  │ │                                     │ │ │
│ │                     │ │                                     │ │ │
│ │ 🏢 By Department:   │ │                                     │ │ │
│ │   • Kitchen (156)   │ │                                     │ │ │
│ │   • Bar (78)        │ │                                     │ │ │
│ │                     │ └─────────────────────────────────────┘ │ │
│ │ [Quick Actions]     │                                       │ │
│ │ • 📷 Scan Receipt   │ Pagination: [< Prev] [1][2][3] [Next >]│ │
│ │ • 📊 Generate Report│                                       │ │
│ │ • 📤 Export Data    │                                       │ │
│ └─────────────────────┴───────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Enhanced Data Tables

#### Advanced Inventory Table
```css
/* Responsive data table */
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-table th {
  background: var(--gray-50);
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: var(--gray-700);
  border-bottom: 1px solid var(--gray-200);
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--gray-100);
  vertical-align: middle;
}

.data-table tr:hover {
  background: var(--gray-50);
}

/* Sortable columns */
.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.sortable::after {
  content: '↕️';
  position: absolute;
  right: 8px;
  opacity: 0.5;
  font-size: 0.75rem;
}

.sortable.asc::after {
  content: '↑';
  opacity: 1;
}

.sortable.desc::after {
  content: '↓';
  opacity: 1;
}

/* Column-specific styling */
.col-item-name {
  min-width: 200px;
  font-weight: 500;
}

.col-stock {
  text-align: right;
  font-family: var(--font-mono);
  min-width: 100px;
}

.col-status {
  text-align: center;
  min-width: 80px;
}

.col-actions {
  text-align: center;
  min-width: 120px;
}

/* Status indicators in table */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-in-stock {
  background: var(--success-100);
  color: var(--success-700);
}

.status-low-stock {
  background: var(--warning-100);
  color: var(--warning-700);
}

.status-out-of-stock {
  background: var(--error-100);
  color: var(--error-700);
}

/* Action buttons in table */
.table-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--gray-300);
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}

.action-btn.primary {
  background: var(--primary-500);
  color: white;
  border-color: var(--primary-500);
}

.action-btn.primary:hover {
  background: var(--primary-600);
}
```

### 5.3 Modal and Dialog Patterns

#### Full-Featured Modals for Desktop
```css
/* Modal overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

/* Modal container */
.modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  max-height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

/* Modal header */
.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.modal-close {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  color: var(--gray-400);
  transition: color 0.2s;
}

.modal-close:hover {
  color: var(--gray-600);
  background: var(--gray-100);
}

/* Modal body */
.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

/* Modal footer */
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--gray-200);
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  background: var(--gray-50);
}

/* Slide-out panels for detailed views */
.slide-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 6px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease-in-out;
  z-index: 999;
  overflow-y: auto;
}

.slide-panel.open {
  right: 0;
}

.slide-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 998;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease.text-lg { font-size: 1.125rem; line-height: 1.75rem; } /* 18px */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }  /* 20px */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }     /* 24px */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; } /* 30px */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }  /* 36px */

/* Font Weights */
.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }

/* Vietnamese text optimizations */
.text-vietnamese {
  font-feature-settings: "kern" 1, "liga" 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
```

#### Typography Usage Guidelines
```typescript
interface TypographyUsage {
  // Headings
  h1: 'text-3xl font-bold text-gray-900';     // Page titles
  h2: 'text-2xl font-semibold text-gray-800'; // Section headers
  h3: 'text-xl font-medium text-gray-700';    // Subsection headers
  h4: 'text-lg font-medium text-gray-600';    // Card headers
  
  // Body text
  body_large: 'text-base text-gray-700';      // Main content
  body_medium: 'text-sm text-gray-600';       // Secondary content
  body_small: 'text-xs text-gray-500';        // Captions, metadata
  
  // Interactive elements
  button_text: 'text-sm font-medium';         // Button labels
  link_text: 'text-sm text-primary-600 hover:text-primary-700';
  input_label: 'text-sm font-medium text-gray-700';
  input_text: 'text-base text-gray-900';
  
  // Data display
  numbers: 'font-mono text-base';             // Quantities, prices
  currency: 'font-mono text-lg font-semibold'; // Money amounts
  percentages: 'font-mono text-sm';           // Percentages
  dates: 'text-sm text-gray-500';             // Timestamps
}
```

### 1.4 Spacing and Layout System

#### Spacing Scale
```css
/* Spacing Scale (based on 4px grid) */
:root {
  --spacing-0: 0;
  --spacing-1: 0.25rem;  /* 4px */
  --spacing-2: 0.5rem;   /* 8px */
  --spacing-3: 0.75rem;  /* 12px */
  --spacing-4: 1rem;     /* 16px */
  --spacing-5: 1.25rem;  /* 20px */
  --spacing-6: 1.5rem;   /* 24px */
  --spacing-8: 2rem;     /* 32px */
  --spacing-10: 2.5rem;  /* 40px */
  --spacing-12: 3rem;    /* 48px */
  --spacing-16: 4rem;    /* 64px */
  --spacing-20: 5rem;    /* 80px */
}

/* Layout grid */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

/* Responsive breakpoints */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

---

## 2. COMPONENT LIBRARY

### 2.1 Button Components

#### Button Variants and States
```css
/* Base button styles */
.btn-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border: none;
  text-decoration: none;
  user-select: none;
  
  /* Touch targets */
  min-height: 44px; /* iOS accessibility guideline */
  min-width: 44px;
  padding: 0.75rem 1.5rem;
}

/* Button sizes */
.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  min-height: 36px;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  min-height: 52px;
}

/* Button variants */
.btn-primary {
  background-color: var(--primary-500);
  color: white;
}
.btn-primary:hover {
  background-color: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}
.btn-primary:active {
  background-color: var(--primary-700);
  transform: translateY(0);
}

.btn-secondary {
  background-color: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
}
.btn-secondary:hover {
  background-color: var(--gray-200);
  border-color: var(--gray-400);
}

.btn-success {
  background-color: var(--success-500);
  color: white;
}
.btn-success:hover {
  background-color: var(--success-600);
}

.btn-warning {
  background-color: var(--warning-500);
  color: white;
}
.btn-warning:hover {
  background-color: var(--warning-600);
}

.btn-danger {
  background-color: var(--error-500);
  color: white;
}
.btn-danger:hover {
  background-color: var(--error-600);
}

/* Button states */
.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-loading {
  position: relative;
  color: transparent;
}
.btn-loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 2.2 Form Components

#### Input Fields
```css
/* Base input styles */
.input-base {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  font-size: 1rem;
  line-height: 1.5;
  background-color: white;
  transition: all 0.2s ease-in-out;
  
  /* Mobile optimization */
  min-height: 44px;
  font-size: 16px; /* Prevents zoom on iOS */
}

.input-base:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-base:disabled {
  background-color: var(--gray-50);
  color: var(--gray-400);
  cursor: not-allowed;
}

/* Input variants */
.input-error {
  border-color: var(--error-500);
  background-color: var(--error-50);
}

.input-success {
  border-color: var(--success-500);
  background-color: var(--success-50);
}

/* Input groups */
.input-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-weight: 500;
  color: var(--gray-700);
  font-size: 0.875rem;
}

.input-hint {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.input-error-message {
  font-size: 0.75rem;
  color: var(--error-500);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Special input types */
.input-currency {
  text-align: right;
  font-family: var(--font-mono);
}

.input-quantity {
  text-align: center;
  font-family: var(--font-mono);
  font-weight: 600;
}

.input-search {
  padding-left: 2.5rem;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: left 0.75rem center;
  background-size: 1rem;
}
```

#### Select and Dropdown Components
```css
/* Custom select component */
.select-base {
  position: relative;
  width: 100%;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: between;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  background-color: white;
  cursor: pointer;
  min-height: 44px;
}

.select-trigger:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.select-content {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  margin-top: 0.25rem;
  background-color: white;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
}

.select-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.select-item:hover {
  background-color: var(--gray-50);
}

.select-item.selected {
  background-color: var(--primary-50);
  color: var(--primary-700);
}

/* Multi-select with tags */
.multiselect-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background-color: var(--primary-100);
  color: var(--primary-700);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag-remove {
  cursor: pointer;
  padding: 0.125rem;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.tag-remove:hover {
  background-color: var(--primary-200);
}
```

### 2.3 Card and Layout Components

#### Card Components
```css
/* Base card styles */
.card {
  background-color: white;
  border-radius: 0.75rem;
  border: 1px solid var(--gray-200);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.2s ease-in-out;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
  background-color: var(--gray-50);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--gray-200);
  background-color: var(--gray-50);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Card variants */
.card-elevated {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: none;
}

.card-alert {
  border-left: 4px solid var(--warning-500);
}

.card-success {
  border-left: 4px solid var(--success-500);
}

.card-error {
  border-left: 4px solid var(--error-500);
}

/* Compact card for mobile */
.card-compact .card-header,
.card-compact .card-body,
.card-compact .card-footer {
  padding: 1rem;
}
```

#### Grid and Layout Systems
```css
/* Responsive grid system */
.grid {
  display: grid;
  gap: 1rem;
}

.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

/* Responsive utilities */
@media (min-width: 640px) {
  .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (min-width: 768px) {
  .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (min-width: 1024px) {
  .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .lg\\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}

/* Flexbox utilities */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.items-end { align-items: flex-end; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }

/* Gap utilities */
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.gap-8 { gap: 2rem; }
```

---

## 3. SCREEN LAYOUTS AND WIREFRAMES

### 3.1 Mobile Dashboard Layout

#### Main Dashboard Wireframe
```
┌─────────────────────────────────────┐
│ ☰  Restaurant Inventory      🔔 👤 │ ← Header (60px)
├─────────────────────────────────────┤
│ 📊 Quick Stats Card                 │
│ ┌─────┬─────┬─────┬─────────────────┐ │
│ │Items│Stock│Value│ Alerts: 3      │ │
│ │ 234 │ 89% │45.2M│ 🔴 Low Stock    │ │
│ └─────┴─────┴─────┴─────────────────┘ │
├─────────────────────────────────────┤
│ ⚡ Quick Actions                     │
│ ┌─────────┬─────────┬─────────────┐ │
│ │ 📷 Nhập │ 📤 Xuất │ 📊 Báo cáo  │ │
│ │   Kho   │   Kho   │             │ │
│ └─────────┴─────────┴─────────────┘ │
├─────────────────────────────────────┤
│ 🚨 Critical Alerts                  │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️  Bia Saigon - Hết hàng       │ │
│ │ 🔴  Bar: Chênh lệch 10%         │ │
│ │ 📅  5 items hết hạn ngày mai    │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 📈 Today's Activity                 │
│ ┌─────────────────────────────────┐ │
│ │ Nhập: 12.5M VND                 │ │
│ │ Xuất: 8.7M VND                  │ │
│ │ Transactions: 24                │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 🏢 Department Status                │
│ ┌─────┬─────┬─────┬─────────────────┐ │
│ │ Bar │Bếp  │Prep │ Storage         │ │
│ │ 🔴  │ ✅  │ ⚠️  │ ✅              │ │
│ └─────┴─────┴─────┴─────────────────┘ │
└─────────────────────────────────────┘
│ ═══ Bottom Navigation ═══          │
│ 🏠 📦 📊 ⚙️ 👤                      │ ← Tab bar (60px)
└─────────────────────────────────────┘
```

#### Navigation Structure
```typescript
interface NavigationStructure {
  bottom_tabs: [
    {
      icon: '🏠';
      label: 'Dashboard';
      route: '/dashboard';
      badge?: number; // For alert count
    },
    {
      icon: '📦';
      label: 'Inventory';
      route: '/inventory';
      subroutes: ['/inventory/items', '/inventory/movements', '/inventory/batches'];
    },
    {
      icon: '📊';
      label: 'Reports';
      route: '/reports';
      role_restricted: ['supervisor', 'manager', 'owner'];
    },
    {
      icon: '⚙️';
      label: 'Settings';
      route: '/settings';
    },
    {
      icon: '👤';
      label: 'Profile';
      route: '/profile';
    }
  ];
  
  floating_action_button: {
    primary_action: 'camera_scan';
    secondary_actions: ['manual_entry', 'quick_withdrawal'];
    position: 'bottom_right';
    size: '56px';
  };
}
```

### 3.2 OCR Receipt Processing Interface

#### Camera Capture Flow
```
┌─────────────────────────────────────┐
│ ✕                           🔄 💡   │ ← Controls overlay
│                                     │
│                                     │
│            📷 Camera Feed           │
│                                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │    Aim camera at receipt        │ │ ← Guidance overlay
│ │    Keep text clear and flat     │ │
│ └─────────────────────────────────┘ │
│                                     │
│              [○] Capture            │ ← Capture button
│                                     │
│ [📷] Gallery  [🔄] Retake  [✓] Use   │ ← Action buttons
└─────────────────────────────────────┘

OCR Processing Screen:
┌─────────────────────────────────────┐
│ ← Back     Processing Receipt...     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │     [Receipt Image Preview]     │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚡ Analyzing text... 75%             │ ← Progress indicator
│ ████████████░░░                     │
│                                     │
│ 🧠 Matching items... 3/5            │
│ ████████████████░░                  │
│                                     │
│ ⏱️ Estimated time: 15 seconds        │
└─────────────────────────────────────┘

Review Results Screen:
┌─────────────────────────────────────┐
│ ← Back     Review & Confirm    ✓ Save│
│                                     │
│ 📄 Receipt: CHO-2025-0702-001       │
│ 📅 Date: 02/07/2025                │
│ 🏪 Supplier: Chợ Bến Thành          │
│                                     │
│ Items Found (Confidence: 92%)       │
│ ┌─────────────────────────────────┐ │
│ │ ✓ Thịt bò úc     2.5kg  625K   │ │ ← High confidence
│ │ ⚠️ Ca chua        1kg   35K    │ │ ← Needs review  
│ │ ❓ Tom tuoi       0.8kg  240K  │ │ ← Manual check
│ │ ✓ Rau muống      3 bó   45K    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Total: 945,000 VND                  │
│                                     │
│ [Edit Items] [Add Missing] [Save]   │
└─────────────────────────────────────┘
```

### 3.3 Inventory Management Interface

#### Item List View
```
┌─────────────────────────────────────┐
│ ☰ Inventory Items        🔍 ⚙️      │
│                                     │
│ [🔍 Search items...]               │ ← Search bar
│                                     │
│ Filters: All ▼ | Category ▼ | ⚠️ 3   │ ← Filter bar
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🥩 Thịt bò úc              🔴  │ │ ← Item card
│ │ Stock: 2.5kg | Min: 5kg         │ │
│ │ Value: 625K | Updated: 2h ago   │ │
│ │ [Quick Actions: + - 📊 ⚙️]     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🍺 Bia Saigon 330ml        ✅  │ │
│ │ Stock: 250 chai | Min: 100      │ │
│ │ Value: 3.75M | Updated: 30m ago │ │
│ │ [Quick Actions: + - 📊 ⚙️]     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🥬 Cải thảo                ⚠️  │ │
│ │ Stock: 12 cây | Expires: 2 days │ │
│ │ Value: 180K | Updated: 1h ago   │ │
│ │ [Quick Actions: + - 📊 ⚙️]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ Add New Item]                    │
└─────────────────────────────────────┘
```

#### Item Detail View
```
┌─────────────────────────────────────┐
│ ← Back     Thịt bò úc         ✏️    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🥩 [Item Image]            🔴  │ │ ← Status indicator
│ │ LOW STOCK ALERT                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Current Stock: 2.5 kg               │ ← Large, prominent
│ Available: 2.5 kg | Reserved: 0 kg  │
│                                     │
│ ══════ Quick Actions ══════         │
│ [📥 Receive] [📤 Issue] [🔄 Transfer]│
│                                     │
│ ══════ Stock Levels ══════          │
│ Minimum: 5.0 kg                     │
│ Maximum: 25.0 kg                    │
│ Reorder: 7.0 kg                     │
│                                     │
│ ══════ Pricing ══════               │
│ Unit Cost: 250,000 VND/kg           │
│ Total Value: 625,000 VND            │
│ Avg Cost: 248,500 VND/kg            │
│                                     │
│ ══════ Details ══════               │
│ Category: Fresh Meat                │
│ Unit: Kilogram                      │
│ Shelf Life: 3 days                  │
│ Storage: Cold (2-4°C)               │
│                                     │
│ ══════ Recent Activity ══════       │
│ ┌─────────────────────────────────┐ │
│ │ 📥 +5kg    Supplier A   2h ago  │ │
│ │ 📤 -2kg    Kitchen      4h ago  │ │
│ │ 📤 -0.5kg  Kitchen      6h ago  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 3.4 Department Reconciliation Interface

#### Reconciliation Dashboard
```
┌─────────────────────────────────────┐
│ ← Back    Reconciliation - Bar       │
│                                     │
│ 📅 Today, July 2, 2025              │
│ 🕐 Afternoon Shift (12:00-18:00)    │
│                                     │
│ ═══ Overall Status ═══              │
│ ┌─────────────────────────────────┐ │
│ │ Items to Review: 3              │ │
│ │ Total Discrepancy: 245K VND     │ │
│ │ Status: ⚠️ NEEDS ATTENTION       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ═══ Items Need Review ═══           │
│ ┌─────────────────────────────────┐ │
│ │ 🍺 Bia Saigon 330ml        🔴  │ │
│ │ Withdrawn: 10 | Sold: 9         │ │
│ │ Discrepancy: 1 chai (10%)       │ │
│ │ [Explain] [Photo] [Approve]     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🥤 Coca Cola 350ml         ⚠️  │ │
│ │ Withdrawn: 20 | Sold: 18        │ │
│ │ Discrepancy: 2 lon (10%)        │ │
│ │ [Explain] [Photo] [Approve]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ═══ Completed Items ═══             │
│ ┌─────────────────────────────────┐ │
│ │ ✅ 15 items reconciled          │ │
│ │ ✅ 3 items auto-approved        │ │
│ │ [View Details]                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Complete Reconciliation]           │
└─# UI/UX Design Specifications
## Restaurant Inventory Management System

**Version:** 1.0  
**Date:** July 2025  
**Related:** BRD v1.0, TRD v1.0

---

## 1. DESIGN SYSTEM FOUNDATION

### 1.1 Design Principles

#### Core Design Philosophy
```typescript
interface DesignPrinciples {
  mobile_first: {
    description: 'Designed primarily for mobile/tablet use in restaurant environment';
    rationale: 'Staff primarily use mobile devices for inventory tasks';
    implementation: 'Progressive enhancement from mobile to desktop';
  };
  
  simplicity_over_features: {
    description: 'Simple, intuitive interfaces over complex feature-rich screens';
    rationale: 'Fast-paced restaurant environment requires quick interactions';
    implementation: 'Maximum 3 taps to complete common tasks';
  };
  
  visual_hierarchy: {
    description: 'Clear information hierarchy with emphasis on critical data';
    rationale: 'Quick decision making requires immediate access to key information';
    implementation: 'Color coding, typography, and spacing for priority';
  };
  
  accessibility_first: {
    description: 'Accessible to all users regardless of technical skill level';
    rationale: 'Restaurant staff have varying technical backgrounds';
    implementation: 'Large touch targets, high contrast, clear labels';
  };
  
  contextual_awareness: {
    description: 'UI adapts based on user role, department, and current task';
    rationale: 'Different roles need different information and capabilities';
    implementation: 'Role-based dashboards and contextual navigation';
  };
}
```

### 1.2 Color Palette

#### Primary Color System
```css
/* Primary Colors */
:root {
  /* Brand Colors */
  --primary-50: #eff6ff;   /* Very light blue */
  --primary-100: #dbeafe;  /* Light blue */
  --primary-500: #3b82f6;  /* Main brand blue */
  --primary-600: #2563eb;  /* Hover blue */
  --primary-700: #1d4ed8;  /* Active blue */
  --primary-900: #1e3a8a;  /* Dark blue */

  /* Semantic Colors */
  --success-50: #ecfdf5;   /* Light green background */
  --success-500: #10b981; /* Success green */
  --success-700: #047857; /* Dark success green */
  
  --warning-50: #fffbeb;   /* Light yellow background */
  --warning-500: #f59e0b; /* Warning yellow */
  --warning-700: #b45309; /* Dark warning yellow */
  
  --error-50: #fef2f2;     /* Light red background */
  --error-500: #ef4444;   /* Error red */
  --error-700: #b91c1c;   /* Dark error red */
  
  --info-50: #f0f9ff;      /* Light info blue */
  --info-500: #06b6d4;    /* Info cyan */
  --info-700: #0e7490;    /* Dark info cyan */

  /* Neutral Colors */
  --gray-50: #f9fafb;      /* Background light */
  --gray-100: #f3f4f6;     /* Background medium */
  --gray-200: #e5e7eb;     /* Border light */
  --gray-300: #d1d5db;     /* Border medium */
  --gray-400: #9ca3af;     /* Text light */
  --gray-500: #6b7280;     /* Text medium */
  --gray-600: #4b5563;     /* Text dark */
  --gray-700: #374151;     /* Text darker */
  --gray-800: #1f2937;     /* Text darkest */
  --gray-900: #111827;     /* Text black */
}

/* Department-specific accent colors */
.department-kitchen { --accent-color: #f97316; }  /* Orange */
.department-bar { --accent-color: #8b5cf6; }      /* Purple */
.department-storage { --accent-color: #059669; }   /* Emerald */
.department-prep { --accent-color: #dc2626; }      /* Red */
```

#### Color Usage Guidelines
```typescript
interface ColorUsage {
  // Status indicators
  inventory_status: {
    in_stock: 'var(--success-500)';
    low_stock: 'var(--warning-500)';
    out_of_stock: 'var(--error-500)';
    overstock: 'var(--info-500)';
  };
  
  // Alert levels
  alert_colors: {
    acceptable: 'var(--success-500)';
    warning: 'var(--warning-500)';
    investigation: 'var(--warning-700)';
    critical: 'var(--error-500)';
  };
  
  // Transaction types
  transaction_colors: {
    in: 'var(--success-500)';        // Incoming inventory
    out: 'var(--primary-500)';       // Outgoing inventory
    waste: 'var(--error-500)';       // Waste/loss
    return: 'var(--info-500)';       // Returns
    adjustment: 'var(--warning-500)'; // Adjustments
  };
}
```

### 1.3 Typography System

#### Font Stack and Sizing
```css
/* Font Families */
:root {
  --font-primary: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', monospace;
  --font-display: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

/* Typography Scale */
.text-xs { font-size: 0.75rem; line-height: 1rem; }     /* 12px */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; } /* 14px */
.text-base { font-size: 1rem; line-height: 1.5rem; }    /* 16px */