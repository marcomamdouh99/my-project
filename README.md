# ☕ Emperor Coffee POS

A modern, offline-first Point of Sale system for multi-branch coffee shop franchises, built with Next.js 16, TypeScript, Prisma, and shadcn/ui.

![Emperor Coffee](https://img.shields.io/badge/Emperor-Coffee-%230F3A2E?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)

## 🌟 Features

### Core Functionality
- **Multi-Branch Management**: Centralized control of all locations
- **Role-Based Access Control (RBAC)**: HQ Admin, Branch Manager, Cashier
- **Recipe-Based Inventory**: Automatic stock deduction based on menu recipes
- **Offline-First Operation**: Works without internet for up to 48 hours
- **Real-Time Synchronization**: Sync engine for data consistency across branches

### POS Features
- 🛒 Intuitive point-of-sale interface
- ☕ Categorized menu items (Hot Drinks, Cold Drinks, Pastries, Snacks)
- 💳 Multiple payment methods (Cash, Card)
- 📄 Receipt printing support
- 🧾 Automatic tax calculation (14% default)
- 📊 Real-time order processing with inventory updates

### Management Features
- 📋 Menu Management (HQ only)
- 🧃 Ingredient Management (HQ only)
- 📝 Recipe Management (HQ only)
- 🏪 Branch Management (HQ only)
- 👥 User Management (HQ only)
- 📈 Sales Reports (HQ & Managers)

### Security & Compliance
- 🔐 Secure authentication
- 📝 Comprehensive audit logging
- 🔍 Transaction hash for tamper detection
- 👤 User activity tracking

## 🎨 Brand Colors

```
Emperor Green:   #0F3A2E
Emperor Green2:  #0B2B22
Emperor Cream:    #F4F0EA
Emperor Cream2:   #FFFDF8
Emperor Gold:     #C7A35A
Emperor Gold2:    #b88e3b
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun 1.0+
- SQLite3 (default) or PostgreSQL/MySQL
- Git

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd emperor-coffee-pos

# Install dependencies
bun install

# Set up database
bun run db:generate
bun run db:push

# Seed database with demo data
bun prisma/seed.ts

# Start development server
bun run dev
```

### Access the Application

- **URL**: http://localhost:3000
- **Login Page**: http://localhost:3000/login

### Demo Credentials

| Role       | Username | Password | Access Level          |
|------------|----------|----------|----------------------|
| HQ Admin   | admin    | demo123  | Full access          |
| Manager 1  | manager1 | demo123  | Branch 1 (Downtown)  |
| Manager 2  | manager2 | demo123  | Branch 2 (Airport)   |
| Cashier 1  | cashier1 | demo123  | Branch 1 (Downtown)  |
| Cashier 2  | cashier2 | demo123  | Branch 1 (Downtown)  |

## 📁 Project Structure

```
emperor-coffee-pos/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts               # Database seeding script
│   └── db/
│       └── emperor-coffee.db  # SQLite database
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   └── orders/       # Order processing endpoints
│   │   ├── login/            # Login page
│   │   ├── layout.tsx        # Root layout with AuthProvider
│   │   ├── page.tsx          # Main dashboard
│   │   └── globals.css        # Global styles with color scheme
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── pos-interface.tsx
│   │   ├── menu-management.tsx
│   │   ├── ingredient-management.tsx
│   │   ├── recipe-management.tsx
│   │   ├── branch-management.tsx
│   │   ├── reports-dashboard.tsx
│   │   └── user-management.tsx
│   └── lib/
│       ├── auth-context.tsx   # Authentication context
│       └── db.ts             # Prisma client
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── PRODUCTION-DEPLOYMENT-GUIDE.md
└── README.md
```

## 🗄️ Database Schema

### Core Models
- **User**: System users with roles (ADMIN, BRANCH_MANAGER, CASHIER)
- **Branch**: Coffee shop locations
- **MenuItem**: Products available for sale
- **Ingredient**: Raw materials and supplies
- **Recipe**: Links menu items to ingredients with quantities
- **BranchInventory**: Stock levels per branch
- **Order**: Sales transactions
- **OrderItem**: Items within orders
- **InventoryTransaction**: Stock movement records
- **SyncHistory**: Synchronization tracking
- **SyncConflict**: Data conflict resolution
- **AuditLog**: System activity logs
- **BranchLicense**: Branch authorization

See `prisma/schema.prisma` for complete schema details.

## 🛠️ Development

### Available Scripts

```bash
# Development
bun run dev              # Start dev server on port 3000

# Database
bun run db:generate      # Generate Prisma client
bun run db:push          # Push schema to database
bun run db:migrate       # Create and run migrations
bun run db:reset         # Reset database (⚠️ destructive)

# Production
bun run build            # Build for production
bun run start            # Start production server
bun run lint             # Run ESLint
```

### Component Development

All components are built with shadcn/ui and Tailwind CSS. Follow these guidelines:

```tsx
'use client';  // For client components

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MyComponent() {
  return (
    <Card className="border-[#C7A35A]/20">
      {/* Content */}
    </Card>
  );
}
```

### Color Usage

```tsx
// Emperor Green
<div className="bg-[#0F3A2E] text-[#FFFDF8]">

// Emperor Gold
<div className="bg-[#C7A35A] text-white">

// Emperor Cream
<div className="bg-[#F4F0EA] text-[#0F3A2E]">
```

## 🚢 Production Deployment

See [PRODUCTION-DEPLOYMENT-GUIDE.md](./PRODUCTION-DEPLOYMENT-GUIDE.md) for comprehensive deployment instructions including:

- System requirements
- Prerequisites & software versions
- Database setup (SQLite, PostgreSQL, MySQL)
- Build process
- Multiple deployment options:
  - Traditional VPS with Nginx
  - Vercel (easiest for Next.js)
  - Railway
  - Docker containers
- SSL setup with Let's Encrypt
- PM2 process management
- Backup strategies
- Troubleshooting guide

### Quick Deployment Summary

```bash
# Build
bun run build

# Start with PM2
pm2 start npm --name "emperor-coffee" -- start

# Save PM2 configuration
pm2 save
pm2 startup systemd
```

## 📊 Recipe-Based Inventory System

When an order is processed:

1. **Order Created**: Order and OrderItem records created
2. **Recipe Lookup**: For each menu item, fetch all recipes
3. **Stock Calculation**: Calculate required ingredient quantities
   ```
   required_ingredient = recipe_quantity × item_quantity
   ```
4. **Stock Deduction**: Update `BranchInventory.currentStock`
5. **Transaction Log**: Create `InventoryTransaction` record
6. **Transaction Hash**: Generate hash for tamper detection

**Example**:
- Order: 2 Lattes
- Recipe: 1 Latte = 2 shots espresso + 300ml milk
- Deduction:
  - Espresso: -4 shots
  - Milk: -600ml

## 🔄 Offline-First Architecture

### How It Works

1. **Normal Operation**: All data synced to central database
2. **Offline Mode**:
   - App detects connection loss
   - Stores all data locally (IndexedDB + SQLite)
   - Continues full functionality
3. **Reconnection**:
   - Sync engine activates
   - Conflicts detected and resolved
   - Central database updated
   - `SyncHistory` records all changes

### Offline Duration Support

- **Default**: 48 hours
- **Configurable**: Via `BranchLicense.offlineDays`
- **Warning**: System locks if offline longer than licensed

## 🔐 Role Permissions

| Feature              | HQ Admin | Branch Manager | Cashier |
|---------------------|----------|----------------|----------|
| POS Terminal        | ✅       | ✅             | ✅       |
| Menu Management      | ✅       | ❌             | ❌       |
| Ingredient Mgmt      | ✅       | ❌             | ❌       |
| Recipe Management    | ✅       | ❌             | ❌       |
| Branch Management    | ✅       | ❌             | ❌       |
| User Management      | ✅       | ❌             | ❌       |
| Reports             | ✅       | ✅             | ❌       |

## 🐛 Troubleshooting

### Common Issues

**Issue**: `useAuth must be used within an AuthProvider`
- **Solution**: Ensure `AuthProvider` wraps your app in `src/app/layout.tsx`

**Issue**: `Module not found: Can't resolve '@/components/...'`
- **Solution**: Clear cache: `rm -rf .next && bun run dev`

**Issue**: Database connection failed
- **Solution**: Run `bun run db:push` to sync schema

**Issue**: Login returns "invalid username or password"
- **Solution**: Run `bun prisma/seed.ts` to seed database

See [PRODUCTION-DEPLOYMENT-GUIDE.md](./PRODUCTION-DEPLOYMENT-GUIDE.md) for more troubleshooting.

## 📈 Scaling Recommendations

### When to Upgrade from SQLite

- **More than 5 branches**
- **Concurrent users > 50**
- **Database size > 1 GB**
- **Need for advanced analytics**

### Recommended Database Upgrades

- **PostgreSQL**: Neon, Supabase, AWS RDS
- **MySQL**: PlanetScale, AWS RDS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Proprietary - Emperor Coffee © 2024. All rights reserved.

## 👥 Team & Support

For support, questions, or feature requests, please contact the Emperor Coffee development team.

---

**Version**: 0.2.0
**Last Updated**: January 2025
**Framework**: Next.js 16.1.3, TypeScript 5, Prisma 6.11.1
