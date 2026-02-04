# Emperor Coffee POS - Production Deployment Guide

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Prerequisites & Software](#prerequisites--software)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Building for Production](#building-for-production)
6. [Deployment Options](#deployment-options)
7. [Post-Deployment Checklist](#post-deployment-checklist)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4 GB (8 GB recommended)
- **Storage**: 20 GB SSD
- **OS**: Linux (Ubuntu 22.04 LTS recommended)

### Recommended for Production
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Database**: Managed PostgreSQL/MySQL (for scalability)

---

## 📦 Prerequisites & Software

### Required Software Versions

| Software | Minimum Version | Recommended Version | Installation |
|----------|----------------|---------------------|--------------|
| Node.js | 18.x | 20.x LTS | `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -`<br>`sudo apt-get install -y nodejs` |
| Bun | 1.0.x | 1.1.x+ | `curl -fsSL https://bun.sh/install | bash` |
| Git | 2.x | 2.40.x | `sudo apt-get install -y git` |
| SQLite3 | 3.x | 3.40.x | `sudo apt-get install -y sqlite3` |
| Nginx | 1.20+ | 1.24+ | `sudo apt-get install -y nginx` |
| PM2 | 5.x | 5.3.x | `npm install -g pm2` |

### Installation Commands (Ubuntu/Debian)

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install system dependencies
sudo apt install -y git curl sqlite3 nginx build-essential

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install PM2 (process manager)
npm install -g pm2

# Verify installations
node --version  # Should be v20.x.x
bun --version   # Should be 1.x.x
pm2 --version   # Should be 5.x.x
```

---

## 🔐 Environment Configuration

### 1. Create Environment File

Create `.env.production` in your project root:

```env
# Application
NODE_ENV=production
PORT=3000

# Database (SQLite for small deployments, PostgreSQL/MySQL for scale)
DATABASE_URL="file:./db/emperor-coffee.db"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Emperor Coffee Branding
APP_NAME="Emperor Coffee"
APP_URL="https://your-domain.com"

# Optional: External Database (PostgreSQL example)
# DATABASE_URL="postgresql://user:password@host:5432/emperorcoffee"
```

### 2. Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy the output to your `NEXTAUTH_SECRET` variable.

### 3. Environment Variables Explanation

| Variable | Purpose | Required |
|----------|---------|----------|
| `NODE_ENV` | Sets environment mode | Yes |
| `PORT` | Application port (default: 3000) | Yes |
| `DATABASE_URL` | Database connection string | Yes |
| `NEXTAUTH_URL` | Your production domain | Yes |
| `NEXTAUTH_SECRET` | Encryption key for sessions | Yes |
| `APP_NAME` | Application name for branding | Optional |

---

## 🗄️ Database Setup

### Option 1: SQLite (Simple, Best for Single Branch)

```bash
# Navigate to project
cd /home/z/my-project

# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Seed database with initial data
bun run prisma/seed.ts
```

### Option 2: PostgreSQL/MySQL (Multi-Branch, Scalable)

#### Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // or "mysql"
  url      = env("DATABASE_URL")
}
```

#### Set up PostgreSQL on Ubuntu:

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
CREATE DATABASE emperorcoffee;
CREATE USER emperoradmin WITH ENCRYPTED PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE emperorcoffee TO emperoradmin;
\q
```

#### Update environment:

```env
DATABASE_URL="postgresql://emperoradmin:your-strong-password@localhost:5432/emperorcoffee"
```

#### Run migrations:

```bash
bun run db:generate
bun run db:push
```

---

## 🏗️ Building for Production

### Step 1: Install Dependencies

```bash
cd /home/z/my-project
bun install
```

### Step 2: Generate Prisma Client

```bash
bun run db:generate
```

### Step 3: Build Application

```bash
bun run build
```

This creates:
- `.next/` - Compiled Next.js application
- `.next/standalone/` - Self-contained production build

### Step 4: Seed Database (First Time Only)

```bash
bun prisma/seed.ts
```

---

## 🚀 Deployment Options

### Option 1: Traditional VPS (Ubuntu/Debian)

#### 1. Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/emperor-coffee`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support (for real-time features)
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

#### 2. Enable Site and Restart Nginx

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/emperor-coffee /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 3. Set Up SSL with Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and configure SSL
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

#### 4. Start with PM2

```bash
# Start application
cd /home/z/my-project
pm2 start npm --name "emperor-coffee" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
```

#### 5. Monitor Logs

```bash
# View logs
pm2 logs emperor-coffee

# Monitor
pm2 monit

# Restart
pm2 restart emperor-coffee

# Stop
pm2 stop emperor-coffee
```

---

### Option 2: Vercel (Easiest for Next.js)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Deploy

```bash
cd /home/z/my-project
vercel
```

Follow the prompts:
- Link to existing Vercel account (or create one)
- Set project name: `emperor-coffee-pos`
- Configure environment variables in Vercel dashboard

#### 3. Set Environment Variables in Vercel Dashboard

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your database connection string
   - `NEXTAUTH_URL`: Your Vercel domain
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

#### 4. Deploy Custom Domain (Optional)

1. Go to Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

**Note**: For SQLite on Vercel, use a managed database like:
- Neon (PostgreSQL)
- PlanetScale (MySQL)
- Supabase (PostgreSQL)

---

### Option 3: Railway (Simple Database Hosting)

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. Login and Initialize

```bash
railway login
railway init
```

#### 3. Add PostgreSQL Database

```bash
railway add postgresql
```

#### 4. Deploy

```bash
railway up
```

#### 5. Configure Environment Variables

In Railway dashboard, set:
- `DATABASE_URL`: Automatically set by Railway
- `NEXTAUTH_URL`: Your Railway domain
- `NEXTAUTH_SECRET`: Generate your own

---

### Option 4: Docker (Portable Deployment)

#### 1. Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json bun.lockb* ./
RUN corepack enable pnpm && corepack prepare pnpm@latest --activate
RUN npm install -g bun
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./db/emperor-coffee.db
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-here
    volumes:
      - ./db:/app/db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app
    restart: unless-stopped
```

#### 3. Build and Run

```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## ✅ Post-Deployment Checklist

### 1. Security
- [ ] SSL certificate installed and valid
- [ ] Firewall configured (allow 80, 443, 22)
- [ ] `NEXTAUTH_SECRET` is set to a strong random value
- [ ] Database credentials are strong
- [ ] Debug mode is disabled (`NODE_ENV=production`)

### 2. Functionality
- [ ] Login works with test credentials
- [ ] POS terminal processes orders
- [ ] Recipe-based inventory deduction works
- [ ] Reports generate correctly
- [ ] All roles (Admin, Manager, Cashier) have correct permissions

### 3. Performance
- [ ] Page load time under 3 seconds
- [ ] Images optimized
- [ ] Database indexes configured
- [ ] Caching enabled where appropriate

### 4. Backups
- [ ] Automated database backups configured
- [ ] Backup retention policy set (e.g., 30 days)
- [ ] Backup restoration tested

### 5. Monitoring
- [ ] Application logs are accessible
- [ ] Error tracking set up (e.g., Sentry)
- [ ] Uptime monitoring configured
- [ ] Performance monitoring active

---

## 🐛 Troubleshooting

### Issue: "Module not found" error

**Solution**:
```bash
rm -rf .next node_modules
bun install
bun run build
```

### Issue: Database connection fails

**Solution**:
```bash
# Check DATABASE_URL in .env
# Regenerate Prisma client
bun run db:generate
# Push schema again
bun run db:push
```

### Issue: Port 3000 already in use

**Solution**:
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or use a different port in .env
PORT=3001
```

### Issue: Out of memory errors

**Solution**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
bun start
```

### Issue: PM2 app crashes on restart

**Solution**:
```bash
# View error logs
pm2 logs emperor-coffee --err

# Check configuration
pm2 show emperor-coffee

# Reset and restart
pm2 delete emperor-coffee
pm2 start npm --name "emperor-coffee" -- start
pm2 save
```

### Issue: Nginx 502 Bad Gateway

**Solution**:
```bash
# Check if Next.js is running
pm2 status

# Check Next.js logs
pm2 logs emperor-coffee

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📊 Scaling Considerations

### When to Upgrade from SQLite

Upgrade to PostgreSQL/MySQL when:
- More than 5 branches
- Concurrent users > 50
- Database size > 1 GB
- Need for advanced analytics

### Recommended Hosting Providers

| Scale | Provider | Database | Cost/Month |
|-------|----------|----------|------------|
| Small (1-3 branches) | VPS + SQLite | SQLite | $5-10 |
| Medium (3-10 branches) | Railway/Vercel | PostgreSQL | $20-50 |
| Large (10+ branches) | AWS/DigitalOcean | Managed PostgreSQL | $100+ |

---

## 🔄 Backup Strategy

### Database Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/backups"
DB_FILE="/home/z/my-project/db/emperor-coffee.db"

mkdir -p $BACKUP_DIR
cp $DB_FILE $BACKUP_DIR/emperor-coffee_$DATE.db

# Keep last 30 backups
cd $BACKUP_DIR
ls -t emperor-coffee_*.db | tail -n +31 | xargs rm -f

echo "Backup completed: emperor-coffee_$DATE.db"
```

### Add to Cron (Daily at 2 AM)

```bash
crontab -e
```

Add line:
```
0 2 * * * /home/z/my-project/backup.sh
```

---

## 📞 Support

For issues or questions:
- Check Next.js documentation: https://nextjs.org/docs
- Check Prisma documentation: https://www.prisma.io/docs
- Review this deployment guide's troubleshooting section

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Application**: Emperor Coffee POS v0.2.0
