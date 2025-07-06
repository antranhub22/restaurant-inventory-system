# Business Requirements Document (BRD)
## Restaurant Inventory Management System with OCR

**Version:** 1.0  
**Date:** July 2025  
**Project:** Smart Inventory Management for Small Restaurants

---

## 1. EXECUTIVE SUMMARY

### 1.1 Project Overview
Develop a web-based inventory management system for small restaurants (3-5 departments) that uses OCR technology to digitize receipt processing and provides real-time discrepancy tracking between withdrawals, sales, and returns.

### 1.2 Business Objectives
- **Reduce inventory management time** from 2-3 hours/day to 30 minutes/day
- **Minimize inventory loss** from 5-10% to 2-3% through better tracking
- **Improve accuracy** with automated OCR processing and reconciliation
- **Enhance accountability** with department-level tracking and reporting
- **Provide real-time visibility** into inventory status and discrepancies

### 1.3 Target Users
- **Restaurant Owner**: Full system access, analytics, strategic decisions
- **Manager**: Daily operations, approval workflows, performance monitoring
- **Department Supervisors**: Department-specific inventory and staff oversight
- **Staff**: Basic inventory operations, mobile-friendly interfaces

---

## 2. CURRENT STATE ANALYSIS

### 2.1 Existing Challenges
- **Manual processes**: Paper-based tracking prone to errors
- **Diverse receipt formats**: Mix of printed and handwritten invoices
- **Inventory discrepancies**: Unknown losses between 5-10% monthly
- **No real-time visibility**: Decisions based on outdated information
- **Department accountability gaps**: Unclear responsibility for losses
- **Time-intensive reconciliation**: Manual checking at end of shifts

### 2.2 Business Impact of Current State
- **Financial losses**: 5-10% inventory shrinkage = ~2-4M VND/month
- **Operational inefficiency**: 15-20 hours/week manual inventory work
- **Poor decision making**: Stockouts and overstocking due to poor visibility
- **Staff accountability issues**: No clear tracking of department performance

---

## 3. FUNCTIONAL REQUIREMENTS

### 3.1 Inventory Input (Nhập Kho)

#### 3.1.1 OCR Receipt Processing
**Priority: HIGH**
- **FR-001**: System shall accept receipt images via mobile camera or file upload
- **FR-002**: Support multiple receipt formats (machine-printed, handwritten, mixed)
- **FR-003**: Extract key information: date, supplier, items, quantities, units, prices
- **FR-004**: Provide confidence scoring (0-100%) for OCR accuracy
- **FR-005**: Allow manual review and correction of OCR results
- **FR-006**: Learn from corrections to improve future accuracy

#### 3.1.2 Smart Item Mapping
**Priority: HIGH**
- **FR-007**: Auto-match extracted item names with database using fuzzy logic
- **FR-008**: Support multiple aliases for same product (e.g., "thịt bò", "beef", "TB")
- **FR-009**: Auto-categorize items based on keywords and supplier patterns
- **FR-010**: Suggest new items when no match found
- **FR-011**: Handle unit conversions (kg to gram, thùng to chai)

#### 3.1.3 Data Validation & Storage
**Priority: HIGH**
- **FR-012**: Validate quantity and price data for reasonableness
- **FR-013**: Check against min/max stock levels and alert accordingly
- **FR-014**: Update inventory levels in real-time
- **FR-015**: Store original receipt image for audit purposes
- **FR-016**: Generate unique transaction IDs for traceability

### 3.2 Inventory Output (Xuất Kho)

#### 3.2.1 Department Requests
**Priority: HIGH**
- **FR-017**: Standardized withdrawal slip template for departments
- **FR-018**: OCR processing for handwritten withdrawal requests
- **FR-019**: Department assignment for each withdrawal
- **FR-020**: Real-time inventory availability checking
- **FR-021**: Block withdrawals when insufficient stock

#### 3.2.2 Mobile Interface
**Priority: HIGH**
- **FR-022**: Mobile-optimized camera interface for quick captures
- **FR-023**: Offline capability with sync when connected
- **FR-024**: One-tap approval/rejection for supervisors
- **FR-025**: Voice input for quantities (accessibility)

### 3.3 Reconciliation System

#### 3.3.1 Real-time Discrepancy Tracking
**Priority: CRITICAL**
- **FR-026**: Track formula: WITHDRAWN = SOLD + RETURNED + WASTE + OTHER_USE
- **FR-027**: Calculate discrepancies in real-time per department
- **FR-028**: Four-tier alert system: Acceptable (≤2%), Warning (2-5%), Investigation (5-10%), Critical (>10%)
- **FR-029**: Auto-generate discrepancy reports requiring explanations
- **FR-030**: Photo evidence upload for waste/damage claims

#### 3.3.2 POS Integration
**Priority: MEDIUM**
- **FR-031**: Sync sales data from POS systems automatically
- **FR-032**: Match sold quantities with withdrawn inventory
- **FR-033**: Handle partial returns and exchanges
- **FR-034**: Support multiple POS systems via API

#### 3.3.3 Manager Approval Workflow
**Priority: HIGH**
- **FR-035**: Automatic escalation for discrepancies above thresholds
- **FR-036**: Manager approval required for high-value losses
- **FR-037**: Time-bound responses (15 min for warnings, 1 hour for critical)
- **FR-038**: Audit trail for all approvals and rejections

### 3.4 Stock Management

#### 3.4.1 Inventory Tracking
**Priority: HIGH**
- **FR-039**: Real-time inventory levels per item and location
- **FR-040**: Expiry date tracking with alerts (3 days, 1 day warnings)
- **FR-041**: Min/max stock level management with auto-reorder suggestions
- **FR-042**: Multi-unit support (kg, gram, chai, thùng, etc.)
- **FR-043**: FIFO (First In, First Out) recommendations

#### 3.4.2 Physical Stock Checks
**Priority: MEDIUM**
- **FR-044**: Guided stock checking with mobile interface
- **FR-045**: Variance analysis between system and physical counts
- **FR-046**: Adjustment workflows with approval requirements
- **FR-047**: Pattern recognition for recurring discrepancies

### 3.5 Reporting & Analytics

#### 3.5.1 Operational Reports
**Priority: HIGH**
- **FR-048**: Real-time dashboard with key metrics and alerts
- **FR-049**: Daily inventory movement reports by department
- **FR-050**: Weekly loss analysis with trend identification
- **FR-051**: Monthly supplier performance reports
- **FR-052**: Cost analysis per department and menu item

#### 3.5.2 Strategic Analytics
**Priority: MEDIUM**
- **FR-053**: Inventory turnover analysis and optimization recommendations
- **FR-054**: Seasonal demand pattern recognition
- **FR-055**: Profitability analysis by menu item
- **FR-056**: Predictive analytics for ordering optimization

---

## 4. NON-FUNCTIONAL REQUIREMENTS

### 4.1 Performance Requirements
- **NFR-001**: OCR processing time ≤ 30 seconds per receipt
- **NFR-002**: Dashboard load time ≤ 3 seconds
- **NFR-003**: Mobile app response time ≤ 2 seconds
- **NFR-004**: Support 10-20 concurrent users
- **NFR-005**: 99.5% system uptime during business hours

### 4.2 Accuracy Requirements
- **NFR-006**: OCR accuracy ≥ 95% for machine-printed receipts
- **NFR-007**: OCR accuracy ≥ 85% for handwritten receipts
- **NFR-008**: Inventory accuracy ≥ 98% compared to physical counts
- **NFR-009**: Discrepancy detection rate ≥ 95% within 1 hour

### 4.3 Usability Requirements
- **NFR-010**: Mobile-first responsive design
- **NFR-011**: Maximum 3 clicks to complete common tasks
- **NFR-012**: Vietnamese language interface with English fallback
- **NFR-013**: Intuitive icons and visual indicators
- **NFR-014**: Accessibility compliance (color contrast, font sizes)

### 4.4 Security Requirements
- **NFR-015**: Role-based access control with 4 user levels
- **NFR-016**: Data encryption at rest and in transit
- **NFR-017**: Session timeout after 4 hours of inactivity
- **NFR-018**: Audit trail for all transactions and changes
- **NFR-019**: Regular automated backups with 30-day retention

### 4.5 Integration Requirements
- **NFR-020**: RESTful API for third-party integrations
- **NFR-021**: Webhook support for real-time notifications
- **NFR-022**: CSV/Excel export for all reports
- **NFR-023**: Cloud storage integration for receipt images

---

## 5. BUSINESS RULES

### 5.1 Inventory Rules
- **BR-001**: Minimum stock alerts trigger when inventory drops below defined threshold
- **BR-002**: Maximum stock warnings when inventory exceeds storage capacity
- **BR-003**: Expired items automatically flagged and blocked from use
- **BR-004**: Zero inventory blocks all withdrawal requests
- **BR-005**: FIFO methodology recommended for perishable items

### 5.2 Discrepancy Rules
- **BR-006**: Acceptable loss percentages vary by category (drinks: 2%, fresh: 5%, dry goods: 0.5%)
- **BR-007**: Pattern recognition triggers investigations after 3 consecutive periods with losses
- **BR-008**: Critical discrepancies (>10%) require immediate operations halt
- **BR-009**: Photo evidence mandatory for waste/damage claims >100,000 VND
- **BR-010**: Department supervisors accountable for their area's performance

### 5.3 Approval Rules
- **BR-011**: Staff consumption requires supervisor pre-approval
- **BR-012**: Sampling limited to 2 units per item per shift
- **BR-013**: Manager approval required for inventory adjustments >500,000 VND
- **BR-014**: Owner approval required for write-offs >1,000,000 VND
- **BR-015**: Emergency withdrawals possible with post-approval within 2 hours

---

## 6. USER STORIES

### 6.1 Owner Stories
- **US-001**: As an owner, I want to see real-time inventory value and daily losses so I can make informed business decisions
- **US-002**: As an owner, I want to identify which departments have the highest loss rates so I can improve operations
- **US-003**: As an owner, I want to compare supplier performance so I can negotiate better deals

### 6.2 Manager Stories
- **US-004**: As a manager, I want to approve discrepancy reports quickly so operations aren't delayed
- **US-005**: As a manager, I want to receive alerts for critical inventory issues so I can respond immediately
- **US-006**: As a manager, I want to see staff performance metrics so I can provide targeted training

### 6.3 Supervisor Stories
- **US-007**: As a supervisor, I want to easily submit withdrawal requests so my team can get ingredients quickly
- **US-008**: As a supervisor, I want to explain discrepancies with photo evidence so the process is transparent
- **US-009**: As a supervisor, I want to see my department's consumption patterns so I can plan better

### 6.4 Staff Stories
- **US-010**: As staff, I want to use my phone to report damaged items so the process is quick and easy
- **US-011**: As staff, I want clear instructions on withdrawal procedures so I don't make mistakes
- **US-012**: As staff, I want to know what's available before requesting so I don't waste time

---

## 7. SUCCESS CRITERIA

### 7.1 Quantitative Metrics
- **Reduce inventory management time by 80%** (from 15-20 hours/week to 3-4 hours/week)
- **Decrease inventory shrinkage by 60%** (from 5-10% to 2-3%)
- **Achieve 95% user adoption** within 3 months of deployment
- **Maintain 99%+ inventory accuracy** compared to physical counts
- **Process 95% of receipts without manual intervention**

### 7.2 Qualitative Benefits
- **Improved staff accountability** through transparent tracking
- **Better decision making** with real-time data and analytics
- **Enhanced operational efficiency** through automation
- **Reduced disputes** with clear audit trails
- **Increased profitability** through better cost control

### 7.3 Return on Investment
- **Break-even point**: 6-12 months
- **Annual savings**: 15-25% of current inventory costs
- **Productivity gains**: 80% reduction in manual inventory work
- **Loss prevention**: 3-5% improvement in profit margins

---

## 8. CONSTRAINTS & ASSUMPTIONS

### 8.1 Technical Constraints
- Must work on standard smartphones (Android/iOS)
- Internet connectivity required for OCR processing
- Maximum image size 10MB per receipt
- Vietnamese language OCR priority over English

### 8.2 Business Constraints
- Implementation budget: Flexible but cost-effective
- Timeline: 3-4 months for full deployment
- Staff training: Maximum 2 hours per person
- Minimal disruption to daily operations during rollout

### 8.3 Assumptions
- Staff have basic smartphone proficiency
- Suppliers will continue current receipt formats
- POS system has API access for integration
- Cloud storage acceptable for receipt images
- Current inventory processes can be documented

---

## 9. RISKS & MITIGATION

### 9.1 Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OCR accuracy below expectations | High | Medium | Manual review interface, multiple OCR engines |
| Mobile compatibility issues | Medium | Low | Extensive device testing, progressive web app |
| API integration failures | High | Medium | Fallback manual entry, robust error handling |

### 9.2 Business Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Staff resistance to change | High | Medium | Comprehensive training, gradual rollout |
| Receipt format changes | Medium | Medium | Flexible OCR engine, quick adaptation |
| Cost overruns | Medium | Low | Phased development, regular budget reviews |

---

## 10. NEXT STEPS

### 10.1 Immediate Actions (Week 1-2)
1. Finalize technical requirements and architecture design
2. Collect sample receipts and create training dataset
3. Define detailed database schema and API specifications
4. Create UI/UX mockups and user flow diagrams

### 10.2 Development Phase (Week 3-12)
1. Phase 1: Core system with basic OCR (Week 3-6)
2. Phase 2: Advanced features and reconciliation (Week 7-10)
3. Phase 3: Testing, optimization, and deployment (Week 11-12)

### 10.3 Post-Launch (Month 4+)
1. User training and change management
2. Performance monitoring and optimization
3. Feature enhancements based on user feedback
4. Integration with additional systems as needed

---

**Document Approval:**
- Business Owner: _________________ Date: _______
- Technical Lead: _________________ Date: _______
- Project Manager: ________________ Date: _______