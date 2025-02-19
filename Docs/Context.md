# Zuri Beauty Application Documentation

## Overview
Zuri Beauty is a comprehensive beauty salon management system designed to streamline operations through multiple user interfaces including client-facing, worker dashboard, and admin dashboard components. The system efficiently manages appointments, inventory, sales, and customer relationships.

## User Roles

### Client
- Book and manage appointments
- Browse service catalog
- Receive notifications
- Submit feedback
- Access personal dashboard

### Worker
- Manage daily appointments
- Process sales transactions
- Update inventory levels
- Track performance metrics
- Handle client interactions

### Administrator
- System-wide oversight
- Staff management
- Financial monitoring
- Inventory control
- Customer relationship management

## Technical Stack

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS
- Shadcn/ui
- React Query (TanStack Query)

### Backend & Database
- Supabase with SSR integration
- Real-time capabilities
- Secure authentication

## Core Features

### Client Portal

#### Appointment System
- Interactive service selection
- Real-time availability checking
- Automated confirmation system
- Calendar integration

#### Client Dashboard
- Appointment history viewer
- Upcoming booking manager
- Feedback submission portal
- Profile management tools

### Worker Interface

#### Sales Management
```javascript
{
  productSales: {
    tracking: true,
    realTimeUpdates: true,
    paymentMethods: [ "mpesa"]
  },
  serviceSales: {
    appointmentLinked: true
  }
}
```
#### Appointment Management 
```javascript
{
  appointmentScheduling: true,
  realTimeAvailability: true,
  automatedConfirmation: true
}
```

#### Inventory Control
```javascript
{
  stockTracking: true,
  lowStockAlerts: true,
  automaticReorderPoints: true,
  categoryManagement: ["hair", "skin", "nails", "makeup"]
}
```

### Administrative Features

#### Analytics Dashboard
- Real-time sales monitoring
- Performance metrics tracking
- Revenue analysis tools
- Customer reviews

#### Staff Management
```javascript
{
  performanceMetrics: {
    salesTarget: true,
    customerSatisfaction: true,
    appointmentCompletion: true
  },
  scheduleManagement: true
}
```

#### Inventory System
- Stock level monitoring
- Automated reordering
- Supplier relationship management
- Product performance analytics

#### Client Relations
- Automated communication system
- Appointment reminder service
- Marketing campaign management
- Customer feedback analysis

## Security Implementation

### Authentication
- JWT-based authentication
- Role-based access control (RBAC)
- Secure session management

### Data Protection
- End-to-end encryption
- Secure payment processing
- Regular security audits
- GDPR compliance measures

## Integration Points

### External Services
1. Payment Processing
   - Secure payment gateway integration
   - Multiple payment method support
   - Transaction logging

2. Communication
   - Email service integration
   - Push notification system

3. Analytics
   - Business intelligence tools
   - Custom reporting solutions
   - Performance tracking

## Technical Requirements

### Browser Support
- Google Chrome
- Mozilla Firefox
- Safari
- Microsoft Edge

### Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop compatibility

### Performance Metrics
- Page load time < 3s
- Real-time updates < 1s
- 99.9% uptime target

## Database Schema

### Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL UNIQUE,
  phone VARCHAR,
  full_name VARCHAR NOT NULL,
  password_hash VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('client', 'worker', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);
```

#### services
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR NOT NULL,
  image_url VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### appointments
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES users(id),
  worker_id UUID REFERENCES users(id),
  service_id UUID REFERENCES services(id),
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL,
  category VARCHAR NOT NULL,
  image_url VARCHAR,
  reorder_point INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### sales
```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES users(id),
  worker_id UUID REFERENCES users(id),
  appointment_id UUID REFERENCES appointments(id),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR NOT NULL,
  payment_status VARCHAR NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### sale_items
```sql
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### reviews
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES users(id),
  appointment_id UUID REFERENCES appointments(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Application Folder Structure

```
zuri-beauty/
├── .github/
│   └── workflows/               # CI/CD workflows
├── app/
│   ├── (auth)/                 # Authentication routes
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (client)/               # Client routes
│   │   ├── appointments/
│   │   ├── services/
│   │   └── profile/
│   ├── (worker)/               # Worker routes
│   │   ├── dashboard/
│   │   ├── appointments/
│   │   ├── sales/
│   │   └── inventory/
│   ├── (admin)/                # Admin routes
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── services/
│   │   ├── inventory/
│   │   └── reports/
│   ├── api/                    # API routes
│   └── layout.js
├── components/
│   ├── ui/                     # Shadcn components
│   ├── shared/                 # Shared components
│   ├── forms/                  # Form components
│   └── layouts/                # Layout components
├── config/
│   └── site.js                # Site configuration
├── hooks/
│   └── use-*.js               # Custom hooks
├── lib/
│   ├── supabase/              # Supabase client
│   ├── utils/                 # Utility functions
│   └── validations/           # Form validations
├── providers/
│   ├── supabase-provider.js
│   └── query-provider.js
├── public/
│   ├── images/
│   └── icons/
├── styles/
│   └── globals.css
├── .env.example
├── .gitignore
├── jsconfig.json
├── next.config.js
├── package.json
├── postcss.config.js
├── README.md
└── tailwind.config.js
```

## Database Relationships

### One-to-Many Relationships
- User -> Appointments (as client)
- User -> Appointments (as worker)
- User -> Sales (as client)
- User -> Sales (as worker)
- User -> Reviews
- User -> Notifications
- Sale -> Sale Items
- Appointment -> Reviews

### Many-to-One Relationships
- Appointments -> Service
- Sale Items -> Product
- Reviews -> Appointment

### Indexes and Constraints
- Email uniqueness on users table
- Role validation on users table
- Status validation on appointments table
- Rating range validation on reviews table
- Foreign key constraints on all relationships
- Timestamps on all tables for auditing

## Homepage Structure

### Layout Components

#### Top Banner
- Promotional banner with sign-up CTA
- Dismissible notification component
- Styled with Tailwind and Shadcn/ui Alert component

#### Navigation
- Responsive navbar with logo
- Main navigation links
  - New Stock
  - Our Products
  - Our Services
  - Book an Appointment
- Search functionality
- Cart and account icons
- Mobile-responsive menu

#### Hero Section
- Main headline: "WHERE BEAUTY MEETS CONFIDENCE"
- Dual CTA buttons
  - Discover Our Services
  - Shop Now
- Statistics display
  - 200+ High-Quality Products
  - 1000+ Happy Customers
- Featured hero image with decorative elements
- Brand partnership bar

#### Product Sections
1. Top Selling Products Grid
   - Product cards with:
     - Product image
     - Title
     - Star rating system
     - Price display (current/original)
     - Discount badges
   - View All button

2. Our Products Showcase
   - Similar product grid layout
   - Category-specific items
   - Rating and pricing components
   - Interactive product cards

#### Services Showcase
- Grid layout featuring:
  - Makeup
  - Hair Braiding
  - Nails
  - Skin Care
- Image-based category cards
- Hover effects and transitions

#### Testimonials
- Slider component
- Customer reviews with:
  - Star ratings
  - Verified customer badges
  - Testimonial text
  - Navigation controls

#### Footer
- Multi-column layout:
  - Brand section with social links
  - Business links
  - Help section
  - FAQ
- Payment methods display
- Copyright information

### Technical Implementation

```javascript
{
  components: {
    layout: [
      'TopBanner',
      'Navigation',
      'Footer'
    ],
    home: [
      'HeroSection',
      'ProductGrid',
      'ServicesShowcase',
      'TestimonialSlider'
    ],
    ui: {
      shared: [
        'ProductCard',
        'StarRating',
        'PriceDisplay',
        'CategoryCard'
      ]
    }
  },
  features: {
    search: true,
    cart: true,
    authentication: true,
    responsiveDesign: true
  }
}
```
