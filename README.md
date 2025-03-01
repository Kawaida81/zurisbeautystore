# Zuri's Beauty Salon Management Application

A modern, full-stack web application for managing beauty salon operations, built with Next.js 13, Supabase, and Tailwind CSS.

## Features

### For Clients
- 📅 Online Appointment Booking
- 👤 Personal Profile Management
- 📱 Service Browsing and Selection
- 💄 Product Catalog Access
- 📖 Booking History
- 🔔 Appointment Notifications

### For Staff/Workers
- 📊 Dashboard with Daily Schedule
- 💰 Sales Management and Tracking
- 📦 Inventory Management
- 👥 Client Management
- 📈 Performance Analytics
- 📝 Profile Management

### For Management
- 📊 Business Analytics
- 💼 Staff Management
- 🏷️ Service Management
- 📦 Product Management
- 📱 Marketing Tools
- 💰 Financial Reporting

## Tech Stack

- **Frontend**: Next.js 13 (App Router)
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Query
- **Forms**: React Hook Form
- **UI Components**: Radix UI
- **Deployment**: Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js 20.11.1 or later
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Kawaida81/zurisbeautystore.git
   cd zurisbeautystore
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
zurisbeautystore/
├── app/                    # Next.js 13 app directory
│   ├── (auth-pages)/      # Authentication related pages
│   ├── (client)/          # Client-facing pages
│   └── (worker)/          # Staff/worker pages
├── components/            # Reusable React components
├── lib/                   # Utility functions and types
├── public/               # Static assets
└── supabase/             # Supabase configurations and migrations
```

## Database Schema

The application uses Supabase with the following main tables:
- `profiles` - User profiles
- `appointments` - Appointment bookings
- `services` - Available salon services
- `products` - Salon products
- `sales` - Sales records
- `inventory` - Product inventory

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Kawaida81 - [@kawaida81](https://github.com/Kawaida81)

Project Link: [https://github.com/Kawaida81/zurisbeautystore](https://github.com/Kawaida81/zurisbeautystore)
