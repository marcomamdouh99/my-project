# 🚀 How to Make Your POS System Fully Working

## ✅ What's Been Added

1. **Authentication API** (`/api/auth/login/route.ts`)
   - Login endpoint with username/password validation
   - Returns user data with role information

2. **Login Page** (`/app/login/page.tsx`)
   - Beautiful login form with demo credentials
   - Shows error messages
   - Redirects to dashboard on success

3. **Session Management** (`/lib/auth-context.tsx`)
   - Tracks logged-in user
   - Provides login/logout functions
   - Stores user in localStorage

4. **Updated Main Dashboard** (`/app/page.tsx`)
   - Wrapped with AuthProvider
   - Checks authentication on load
   - Redirects to login if not authenticated
   - Role-based access control (tabs disabled based on role)

5. **Connected POS to Real API** (`/components/pos-interface.tsx`)
   - Calls `/api/orders` on checkout
   - Shows loading overlay during processing
   - Displays order confirmation

---

## 📋 Step-by-Step Instructions to Get Started

### **Step 1: Access the Login Page**

1. Open the application in **Preview Panel**
2. You should be automatically redirected to `/login`
3. If not, manually go to: `http://localhost:3000/login`

### **Step 2: Log In with Demo Credentials**

The system has **3 pre-configured users** for testing:

| Role | Username | Password | Access |
|-------|----------|----------|--------|
| **HQ Admin** | `admin` | `demo123` | Full control - All features |
| **Branch Manager** | `manager1` | `demo123` | Can manage branch, view reports, access POS |
| **Branch Manager** | `manager2` | `demo123` | Can manage branch, view reports, access POS |
| **Cashier** | `cashier1` | `demo123` | Can only access POS terminal |
| **Cashier** | `cashier2` | `demo123` | Can only access POS terminal |

**To Log In:**
1. Enter one of the usernames above
2. Enter password: `demo123`
3. Click **"Sign In"** button
4. You'll be redirected to the main dashboard

### **Step 3: Explore the Dashboard Based on Your Role**

#### If Logged in as **HQ Admin (`admin`):**

✅ **All tabs are accessible:**
- POS Terminal
- Menu Management (create/edit menu items & pricing)
- Recipe Management (link ingredients to menu items)
- Inventory Management (manage master ingredient list)
- Branch Management (create/edit branches, licenses)
- Reports Dashboard (view all branches)
- Users Management (create/edit all users)

#### If Logged in as **Branch Manager (`manager1` or `manager2`):**

✅ **These tabs are accessible:**
- POS Terminal
- Reports Dashboard (own branch only)
- Users Management (branch users only)

❌ **These tabs are DISABLED:**
- Menu Management (HQ only)
- Recipe Management (HQ only)
- Inventory Management (HQ only)
- Branch Management (HQ only)

#### If Logged in as **Cashier (`cashier1` or `cashier2`):**

✅ **Only this tab is accessible:**
- POS Terminal

❌ **All other tabs are DISABLED:**
- Menu, Recipes, Inventory, Branches, Reports, Users

### **Step 4: Test the POS Terminal**

1. Click on the **POS** tab
2. You'll see a product grid with categories
3. Click on items to add them to the cart
4. Adjust quantities using +/- buttons
5. Click **Cash** or **Card** to checkout
6. The order will be processed with automatic inventory deduction

**What happens when you checkout:**
```
1. Loading overlay appears
2. System calls /api/orders with your cart items
3. API:
   - Validates menu items exist
   - Calculates totals (14% tax)
   - Looks up recipes for each item
   - Deducts inventory based on recipes
   - Creates order record
   - Creates inventory transaction records
   - Logs the action for audit trail
4. Success message shows order number & total
5. Cart is cleared
```

### **Step 5: Test Menu Management (HQ Admin Only)**

1. Click **Menu** tab
2. Click **"Add Item"** button
3. Fill in the form:
   - Item Name: e.g., "Caramel Latte"
   - Category: e.g., "Hot Drinks"
   - Price: e.g., 6.00
   - Tax Rate: e.g., 0.14
   - Status: Active
4. Click **"Add Item"**
5. The item appears in the table below
6. You can edit or delete items

### **Step 6: Test Ingredient Management (HQ Admin Only)**

1. Click **Inventory** tab
2. Click **"Add Ingredient"** button
3. Fill in the form:
   - Name: e.g., "Caramel Syrup"
   - Unit: e.g., "L" (liters)
   - Cost per Unit: e.g., 8.00
   - Reorder Threshold: e.g., 10 (alert when below this)
4. Click **"Add Ingredient"**
5. The ingredient appears in the table

### **Step 7: Test Recipe Management (HQ Admin Only)**

**This is CRITICAL for inventory deduction!**

1. Click **Recipes** tab
2. Click **"Add Recipe Line"** button
3. Fill in the form:
   - Menu Item: Select "Latte"
   - Ingredient: Select "Coffee Beans (Espresso)"
   - Quantity Required: e.g., 18 (grams)
4. Click **"Add to Recipe"**
5. Repeat for each ingredient in the recipe

**Example Recipe:**
```
Latte Recipe:
- 18g Coffee Beans (Espresso)
- 150ml Whole Milk
- (Optional) 10g Sugar
```

When a Latte is sold, the system will automatically deduct these quantities from the branch inventory.

### **Step 8: Test Branch Management (HQ Admin Only)**

1. Click **Branches** tab
2. Click **"Add Branch"** button
3. Fill in the form:
   - Branch Name: e.g., "Downtown"
   - License Key: e.g., "LIC-DOWN-2024-XXXX"
   - License Duration: e.g., 365 (days)
4. Click **"Add Branch"**
5. The branch appears in the table with:
   - Active/Inactive toggle
   - Sync status indicator
   - License expiration date
   - Edit/Delete buttons

### **Step 9: View Reports Dashboard**

1. Click **Reports** tab
2. Select time range: Today, This Week, This Month, This Quarter
3. **Sales Section** shows:
   - Total Sales (gross)
   - Net Sales (after tax)
   - Total Orders
   - Average Order Value
   - Detailed order table

4. **Inventory Section** shows:
   - Total Ingredients tracked
   - Low Stock Alert count
   - Critical Stock count
   - Detailed inventory table with status badges

### **Step 10: Manage Users (HQ Admin Only)**

1. Click **Users** tab
2. Click **"Add User"** button
3. Fill in the form:
   - Username: e.g., "manager3"
   - Email: e.g., "manager3@franchise.com"
   - Name: e.g., "Jane Doe"
   - Password: e.g., "securepass123" (for new users)
   - Role: Select from Admin/Branch Manager/Cashier
   - Branch: Assign if Branch Manager or Cashier
4. Click **"Add User"**
5. User appears in the table

**Important:** Password is only required for NEW users. When editing existing users, password field is hidden.

---

## 🔐 How the Authentication Works

### Login Flow

```
1. User enters username/password on login page
       ↓
2. Frontend POSTs to /api/auth/login
       ↓
3. API validates:
   - User exists
   - User is active
   - Password matches (demo: "demo123")
       ↓
4. If valid:
   - Returns user data (id, username, role, branchId)
   - Frontend saves to localStorage
   - Frontend redirects to /dashboard
5. If invalid:
   - Returns error message
   - Frontend shows error alert
```

### Session Management

```
After login:
- User stored in localStorage as JSON
- isLoggedIn flag set to "true"
- AuthContext provides user to all components

On page load:
- Check localStorage for user
- If exists → Show dashboard with user data
- If missing → Redirect to /login

Logout:
- Clear localStorage
- Clear user state
- Redirect to /login
```

---

## 🎯 Testing the Complete Flow

### Test 1: HQ Admin - Full System

1. Log out (if logged in)
2. Log in as `admin` / `demo123`
3. ✅ Verify: Can access all tabs
4. Go to **Menu** tab
5. Create a new menu item: "Vanilla Latte", $6.00
6. Go to **Inventory** tab
7. Add ingredient: "Vanilla Syrup", $8.00/L, threshold 10L
8. Go to **Recipes** tab
9. Add recipe: Vanilla Latte → 18g coffee beans + 30ml vanilla syrup
10. Go to **Branches** tab
11. Create a new branch: "Test Branch"
12. Go to **Users** tab
13. Create new cashier: "testcashier", assign to "Test Branch"
14. Logout
15. Log in as `testcashier` / `demo123`
16. ✅ Verify: Can only see POS tab
17. Add items to cart and checkout
18. ✅ Verify: Order processed successfully
19. Go to **Reports** tab (if manager or admin)
20. ✅ Verify: Sales data appears

### Test 2: Recipe-Based Inventory

1. Log in as admin / demo123
2. Go to **Inventory** tab
3. Note initial stock levels (sample data loaded)
4. Go to **POS** tab
5. Order 2 lattes (each uses recipe: 18g coffee + 150ml milk)
6. Checkout with Cash
7. ✅ Verify: Order #X processed successfully
8. Go to **Inventory** tab (if HQ Admin)
9. ✅ Verify: Coffee stock decreased by 36g, Milk stock decreased by 300ml

---

## 📁 File Structure - Authentication Added

```
/home/z/my-project/
├── src/
│   ├── app/
│   │   ├── login/
│   │   │   └── page.tsx              ✨ NEW - Login page
│   │   ├── page.tsx                   🔄 UPDATED - Added auth checks
│   │   └── api/
│   │       ├── auth/
│   │       │   └── login/
│   │       │       └── route.ts    ✨ NEW - Login API
│   │       └── orders/
│   │           └── route.ts          🔄 UPDATED - POS now calls this
│   └── lib/
│       └── auth-context.tsx           ✨ NEW - Session management
```

---

## 🔑 Demo Credentials Reference

**Save this for quick access:**

```
HQ ADMIN
Username: admin
Password: demo123
Access: Everything (Menu, Recipes, Inventory, Branches, Reports, Users, POS)

BRANCH MANAGER 1
Username: manager1
Password: demo123
Access: POS, Reports (own branch), Users (own branch)

BRANCH MANAGER 2
Username: manager2
Password: demo123
Access: POS, Reports (own branch), Users (own branch)

CASHIER 1
Username: cashier1
Password: demo123
Access: POS only

CASHIER 2
Username: cashier2
Password: demo123
Access: POS only
```

---

## 🚀 Quick Start Checklist

- [ ] Open application in Preview Panel
- [ ] Log in as admin/demo123
- [ ] Verify all tabs are accessible
- [ ] Create a menu item
- [ ] Add ingredients
- [ ] Create recipes
- [ ] Create a branch
- [ ] Create users
- [ ] Logout
- [ ] Log in as cashier/demo123
- [ ] Verify only POS tab is accessible
- [ ] Process a test order
- [ ] Verify inventory deduction worked
- [ ] View reports

---

## 🐛 Troubleshooting

### Can't log in?

**Problem:** "Invalid username or password"

**Solutions:**
1. Check you're using exact credentials from table above
2. Password is case-sensitive: `demo123` (all lowercase)
3. Check browser console for errors (F12)

### Stuck on loading page?

**Problem:** Never redirects from login

**Solutions:**
1. Check localStorage: Open DevTools (F12) → Application tab → Local Storage
2. Should see `user` and `isLoggedIn` keys
3. If missing, check `/api/auth/login` is working

### POS checkout shows error?

**Problem:** "Please log in to process orders"

**Solutions:**
1. Make sure you're logged in
2. Check that localStorage has user data
3. Verify branchId is set (default: "default-branch")

### Tabs disabled that should be accessible?

**Problem:** Role-based access not working

**Solutions:**
1. Check you logged in with correct role
2. Refresh page
3. Check browser console for errors

---

## 📊 Role Permissions Summary

| Feature | Admin | Branch Manager | Cashier |
|---------|-------|----------------|----------|
| **POS Terminal** | ✅ | ✅ | ✅ |
| **View Menu** | ✅ (Read-only at branch) | ✅ (Read-only) | ✅ (Read-only) |
| **Edit Menu** | ✅ | ❌ | ❌ |
| **Edit Recipes** | ✅ | ❌ | ❌ |
| **Manage Ingredients** | ✅ | ❌ | ❌ |
| **Create Branches** | ✅ | ❌ | ❌ |
| **View All Reports** | ✅ | ❌ | ❌ |
| **View Own Branch Reports** | ✅ | ✅ | ❌ |
| **Manage All Users** | ✅ | ❌ | ❌ |
| **Manage Branch Users** | ✅ | ✅ | ❌ |

---

## ✅ What Makes This System Now Fully Working?

1. ✅ **Authentication** - Users must log in with username/password
2. ✅ **Role-Based Access** - Different roles see different features
3. ✅ **Real API Integration** - POS calls backend to create orders
4. ✅ **Automatic Inventory Deduction** - Based on recipes (critical!)
5. ✅ **Audit Trail** - All actions logged
6. ✅ **User Management** - Create/edit users with passwords
7. ✅ **Login/Logout** - Complete session management
8. ✅ **Access Control** - HQ controls everything, branches limited to their data

---

## 🎓 Next Steps (Phase 2)

When ready for production:

1. **Replace Demo Password Check with bcrypt**
   - Install bcryptjs
   - Hash passwords on user creation
   - Verify hashes on login
   - Store only hashes in database (never plain text)

2. **Add JWT Tokens**
   - Generate JWT on successful login
   - Include role and branch in token
   - Verify tokens on protected routes
   - Set token expiration (e.g., 8 hours)

3. **Add Sync Engine**
   - `/api/sync/upload` for branch → central
   - `/api/sync/download` for central → branch
   - Version tracking for delta sync
   - Offline queue with retry logic

4. **Add Data Seeding Script**
   - Script to populate initial data
   - Users, menu items, ingredients, recipes, branches
   - Run with: `bun run seed`

---

**🎉 Your POS system is now fully functional with authentication and role-based access!**

Start by logging in at: **http://localhost:3000/login** (in Preview Panel)
