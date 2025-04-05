# Zuri's Beauty Store Admin Context

## Overview
This document outlines the core functionality and data structures for the Zuri's Beauty Store admin system. The admin interface is designed to manage various aspects of the beauty store operations efficiently.

## Core Functionalities

### 1. Catalog Management
- Product information management
  - Product details (name, description, price)
  - Category organization
  - Image management
  - Product creation, updates, and deletion
  - Version history tracking
  - Service packages and bundles
  - Product variants and options

### 2. Inventory Management
- Stock tracking
  - Current quantity monitoring
  - Reorder point alerts
  - Stock location tracking
- Inventory status categories:
  - In stock
  - Low stock
  - Out of stock
- Restocking history
- Location management
- Supplier management
- Stock adjustments and reconciliation

### 3. Profit Tracking
- Transaction recording
  - Sales
  - Refunds
  - Expenses
- Financial reporting
  - Daily reports
  - Weekly reports
  - Monthly reports
  - Yearly reports
- Metrics tracked:
  - Revenue
  - Expenses
  - Net profit
  - Transaction history
- Report exports (CSV/PDF)
- Tax calculations and reporting

### 4. Worker Management
- Staff profiles
  - Personal information
  - Role assignment (stylist, assistant, manager)
  - Employment status
- Schedule management
  - Work days
  - Shift tracking
  - Leave management
- Performance metrics
  - Customer ratings
  - Services completed
  - Revenue generated
  - Client retention rate
- Commission tracking
- Training and certification records

### 5. Client Management
- Customer profiles
  - Contact information
  - Service history
  - Preferred services
- Appointment tracking
  - Scheduling
  - Status updates
  - Service details
- Client analytics
  - Total spend
  - Loyalty points
  - Visit frequency
  - Retention metrics
- Feedback and reviews
- Client communications history

### 6. Business Settings
- Store information
  - Business name
  - Contact details
  - Address
- System configurations
  - Loyalty points rate
  - Tax rates
  - Working hours
  - Service duration defaults

### 7. Appointment System
- Appointment scheduling
- Service assignment
- Worker availability
- Client booking history
- Automated reminders
- Calendar management

### 8. Service Management
- Service categories
- Pricing tiers
- Duration settings
- Required resources
- Service combinations
- Special offers

### 9. Communication System
- Internal messaging
  - Worker to worker
  - Admin to worker
- Client notifications
  - Appointment reminders
  - Promotional messages
  - Follow-up communications
- Message templates
- Communication history

### 10. Security and Access Control
- Role-based access
- Activity logging
- Security audit trails
- User authentication
- Permission management

## Data Structure
Each section maintains its own data structure with appropriate relationships and tracking mechanisms. Refer to the types defined in `lib/types/admin.ts` for detailed type definitions and interfaces.

## Integration Points
- Supabase Database
- Authentication System
- Payment Processing
- Email/SMS Services
- Analytics Tools