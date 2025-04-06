# Inventory and Invoice Management Application

A web-based inventory and invoice management system built with Next.js, Supabase, and Tailwind CSS.

## Features

- Product inventory management
- Client management
- Order processing
- Invoice generation and sharing
- Dashboard with business metrics
- Mobile-responsive design

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 16.8 or later
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/YOUR_USERNAME/inv-app-web.git
   cd inv-app-web
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

This application is configured for easy deployment on Vercel.

## License

[MIT](LICENSE)
