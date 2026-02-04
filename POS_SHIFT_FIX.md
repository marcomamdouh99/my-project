# Fix: "No Active Shift" Error After Opening Shift

## Issue
After opening a shift with a cashier account:
1. ✅ Shift opens successfully in Shift Management tab
2. ❌ Going to POS tab still shows: "No Active Shift"
3. ❌ Error message: "Please open a shift in the Shifts tab before you can access the POS"

## Root Causes

### 1. Missing `branchId` Parameter
The POS component was calling the shifts API with only `cashierId` and `status` parameters:
```
/api/shifts?cashierId=xxx&status=open
```

But the API **requires** `branchId` to be present (see `/src/app/api/shifts/route.ts` lines 23-28):
```typescript
if (!branchId) {
  return NextResponse.json(
    { error: 'Branch ID is required' },
    { status: 400 }
  );
}
```

Without `branchId`, the API returned **400 Bad Request**, so the POS couldn't find any shifts.

### 2. No Shift Refresh Mechanism
When a cashier:
1. Logs in → POS tab loads and checks for active shift
2. Goes to Shift Management tab → Opens shift
3. Returns to POS tab → Component already mounted, doesn't re-check

The POS component didn't refresh its shift state when the tab became visible again.

## Files Modified

### `/src/components/pos-interface.tsx`

#### Fix 1: Added branchId to shift API calls (Lines 123-159)
**Changes:**
- For cashiers, use `user.branchId` instead of checking `selectedBranch`
- Include `branchId` parameter in API requests
- Added `user?.branchId` to useEffect dependencies

**Before:**
```typescript
const params = new URLSearchParams({
  cashierId: user.id,
  status: 'open',
});
```

**After:**
```typescript
const branchId = user.role === 'CASHIER' ? user.branchId : selectedBranch;

const params = new URLSearchParams({
  branchId, // ← Added required parameter
  cashierId: user.id,
  status: 'open',
});
```

#### Fix 2: Added Tab Visibility Listener (Lines 74-114)
**Changes:**
- Added `visibilitychange` event listener
- When POS tab becomes visible and user is a cashier, re-fetch shift
- This ensures shift status updates after opening shift in another tab

**New Code:**
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && user?.role === 'CASHIER') {
      // Re-fetch shift when tab becomes visible
      const fetchCurrentShift = async () => {
        const branchId = user.branchId;
        if (!branchId) return;

        const params = new URLSearchParams({
          branchId,
          cashierId: user.id,
          status: 'open',
        });
        const response = await fetch(`/api/shifts?${params.toString()}`);
        const data = await response.json();

        if (response.ok && data.shifts && data.shifts.length > 0) {
          setCurrentShift(data.shifts[0]);
        } else {
          setCurrentShift(null);
        }
      };

      fetchCurrentShift();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [user, user?.branchId]);
```

## How It Works Now

### Scenario 1: Fresh Login
1. Cashier logs in
2. POS component mounts
3. Fetches shifts with: `?branchId={user.branchId}&cashierId={user.id}&status=open`
4. **Result:** ✅ API returns 200 with shift data
5. **Result:** ✅ POS shows "Shift Open" message

### Scenario 2: Opening Shift After Login
1. Cashier logs in (no shift exists yet)
2. POS shows "No Active Shift" message
3. Cashier goes to Shift Management tab
4. Cashier opens shift
5. Cashier returns to POS tab
6. **Visibility change event fires** (tab becomes visible)
7. POS re-fetches shift with correct parameters
8. **Result:** ✅ API returns 200 with shift data
9. **Result:** ✅ POS updates to show "Shift Open" message

## API Call Comparison

### Before (Broken):
```
GET /api/shifts?cashierId=cml4xe26a0008lon8qi98v3c1&status=open
Response: 400 Bad Request
Error: "Branch ID is required"
```

### After (Fixed):
```
GET /api/shifts?branchId=cml46do4q0000ob5g27krklqe&cashierId=cml4xe26a0008lon8qi98v3c1&status=open
Response: 200 OK
Data: { success: true, shifts: [...] }
```

## Testing Instructions

1. **Login as Cashier**
   - Log in with a cashier account

2. **Open Shift**
   - Go to Shift Management tab
   - Click "Open Shift"
   - Enter opening cash (optional)
   - Click submit

3. **Go to POS Tab**
   - Click on POS tab in the navigation
   - **Expected Result:** ✅ Shows "Shift Open" with green badge
   - Shows: "Started at HH:MM | You can process sales"

4. **Process Order**
   - Add items to cart
   - Click "Pay Cash" or "Pay Card"
   - **Expected Result:** ✅ Order processes successfully

## Key Changes Summary

1. ✅ Fixed branchId parameter missing from shift API calls for cashiers
2. ✅ Added tab visibility change listener to refresh shift when returning to POS
3. ✅ Updated useEffect dependencies to include `user?.branchId`
4. ✅ Now cashiers use their assigned branch ID instead of selectedBranch

## Code Quality

- ✅ ESLint: No errors
- ✅ TypeScript: Compiled successfully
- ✅ Dev Server: No errors
- ✅ API Calls: Returning 200 status (was 400 before)

## Summary

The issue is now fully resolved. Cashiers can:
1. Open a shift in Shift Management tab ✅
2. Return to POS tab and see "Shift Open" status ✅
3. Process orders immediately without needing to refresh ✅

The tab visibility listener ensures the shift status is always current when the user switches between tabs.
