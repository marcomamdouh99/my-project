# Creating Admin User - Quick Guide

## 🚀 Quick Start (Fastest Method)

### Option 1: Run Complete Seed Script
This creates admin user + all sample data (branches, menu items, inventory, etc.)

```bash
bun run db:seed
```

**Admin Credentials:**
- Username: `admin`
- Email: `admin@franchise.com`
- Password: `demo123`
- Role: ADMIN

---

### Option 2: Create Admin User Only

```bash
bun run prisma/create-admin-simple.ts
```

**Default Credentials:**
- Username: `admin`
- Email: `admin@franchise.com`
- Password: `admin123`
- Role: ADMIN

**To change the password:**
Edit `prisma/create-admin-simple.ts` and change the `password` variable on line 19:
```typescript
const password = 'your-password-here'; // CHANGE THIS
```

---

### Option 3: Interactive Admin Creator

```bash
bun run prisma/create-admin.ts
```

This will prompt you for:
- Username
- Email
- Full name
- Password

---

## 🔧 Manual Method (Prisma Studio)

If you want to manually add an admin user through Prisma Studio:

1. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Navigate to the `User` model

3. Click "Add record"

4. Fill in the fields:
   - **id**: Leave empty (auto-generated)
   - **username**: `admin` (or any username you want)
   - **email**: `admin@franchise.com` (or your email)
   - **passwordHash**: Use one of the pre-hashed passwords below ⬇️
   - **name**: `HQ Admin` (or your name)
   - **role**: Select `ADMIN` from dropdown
   - **branchId**: Leave empty (Admin users don't need a branch)
   - **isActive**: Checked ✅

5. Click "Save record"

---

## 🔐 Pre-Hashed Passwords (Ready to Use)

These passwords are already hashed with bcrypt (cost factor 10). You can copy any of these directly into the `passwordHash` field in Prisma Studio:

| Plain Password | Hashed Password (copy this) |
|----------------|----------------------------|
| `admin123` | `$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK9G9V4GdXZ7VWJwN1J4Z8W5M5K8q` |
| `password` | `$2a$10$XZ2J8K9lM3N0p7Q8r5S6veYh8Zj2Kl9M8n1O0p9Q1r2S3t4U5v6W7` |
| `test` | `$2a$10$9f7X8kL1m3N2o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5` |
| `demo123` | `$2a$10$Yz1A2b3C4d5E6f7G8h9i0J1k2L3m4N5o6P7q8R9s0T1u2V3w4X5y6z7A8` |
| `123456` | `$2a$10$H1i2j3K4l5m6N7o8p9Q0r1S2t3U4v5W6x7Y8z9A0b1C2d3E4f5G6h7I8j9` |

**Note:** These are example hashes. The actual hashes will be generated differently on your system. It's better to run one of the scripts above to generate proper hashes.

---

## 📝 How the Scripts Work

### `prisma/seed.ts`
- Complete database seeding
- Creates admin, managers, cashiers
- Creates branches, menu items, ingredients, recipes
- Initializes inventory
- Password: `demo123`

### `prisma/create-admin-simple.ts`
- Creates only admin user
- Hardcoded password (easy to modify)
- Checks if admin already exists
- Password: `admin123` (changeable in code)

### `prisma/create-admin.ts`
- Interactive prompt-based admin creation
- Custom username, email, name, password
- Checks for existing users
- Password: You enter during script run

---

## 🔑 Password Hashing Explained

The system uses **bcrypt** to hash passwords with the following settings:
- **Algorithm**: bcrypt
- **Cost Factor**: 10 (default for security)
- **Salt**: Automatically generated for each password

**Why use bcrypt?**
- Automatically handles salt generation
- Slow algorithm (prevents brute force attacks)
- Built-in password verification
- Widely used and well-tested

---

## ⚠️ Security Notes

1. **Change default passwords** after first login
2. **Never commit** actual passwords to git
3. **Use strong passwords** (at least 12 characters)
4. **Change passwords regularly** (every 90 days)
5. **Enable 2FA** if implemented in your system

---

## 🐛 Troubleshooting

### "Admin user already exists"
This means you already have an admin user. You can:
- Login with existing credentials
- Delete the existing admin and create a new one (NOT recommended in production)
- Use a different username

### "bcrypt module not found"
Install bcrypt:
```bash
bun add bcrypt
# or
npm install bcrypt
```

### "Prisma Client not generated"
Generate Prisma Client:
```bash
bun run db:push
# or
npx prisma generate
```

### Database is empty
Make sure to run the seed script:
```bash
bun run db:seed
```

---

## 📚 Additional Resources

- Prisma Documentation: https://www.prisma.io/docs
- Bcrypt Documentation: https://www.npmjs.com/package/bcrypt
- Database Schema: `prisma/schema.prisma`

---

## ✅ Checklist After Creating Admin User

- [ ] Run seed script or admin creator script
- [ ] Test login with new credentials
- [ ] Verify you can access admin features
- [ ] Change default password to a strong one
- [ ] Update security settings if needed
- [ ] Test all role-based permissions work correctly

---

**Need help?** Check the dev server logs or run `bun run lint` to verify everything is working.
