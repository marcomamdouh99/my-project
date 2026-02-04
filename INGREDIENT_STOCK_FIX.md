# Fix: Initial Stock Not Saving When Editing Ingredients

## Issue
When editing an ingredient and changing the "Initial Stock" field:
- ✅ Shows "Ingredient updated successfully!" message
- ❌ Current stock doesn't actually update in the database

## Root Cause

The PATCH API endpoint only updated the `Ingredient` table (name, unit, costPerUnit, reorderThreshold) but **did not handle** updating the `BranchInventory` table's `currentStock` field.

Additionally, the frontend wasn't sending `initialStock` and `branchId` when editing ingredients, even though it sent these fields when creating new ingredients.

## Files Modified

### 1. `/src/app/api/ingredients/[id]/route.ts`
**Changes:**
- Added `initialStock` and `branchId` to the destructured body parameters
- Added logic to update `BranchInventory` table when `initialStock` is provided:
  - If branch inventory record exists → Update `currentStock`, `lastRestockAt`, `lastModifiedAt`
  - If branch inventory record doesn't exist → Create new record with provided stock

**New Code (lines 6, 39-65):**
```typescript
const { name, unit, costPerUnit, reorderThreshold, initialStock, branchId } = body;

// ... ingredient update code ...

// Handle initial stock update for branch inventory
if (initialStock !== undefined && initialStock !== '' && branchId) {
  const stockValue = parseFloat(initialStock);

  // Check if branch inventory record exists
  const existingInventory = await db.branchInventory.findUnique({
    where: {
      branchId_ingredientId: {
        branchId,
        ingredientId: id,
      },
    },
  });

  if (existingInventory) {
    // Update existing inventory
    await db.branchInventory.update({
      where: {
        branchId_ingredientId: {
          branchId,
          ingredientId: id,
        },
      },
      data: {
        currentStock: stockValue,
        lastRestockAt: new Date(),
        lastModifiedAt: new Date(),
      },
    });
  } else {
    // Create new inventory record
    await db.branchInventory.create({
      data: {
        branchId,
        ingredientId: id,
        currentStock: stockValue,
        lastRestockAt: new Date(),
        lastModifiedAt: new Date(),
      },
    });
  }
}
```

### 2. `/src/components/ingredient-management.tsx`
**Changes:**
- Added `branchId: selectedBranch` to the edit payload (line 160)
- Added logic to include `initialStock` in the edit payload if provided (lines 169-172)

**New Code (lines 154-174):**
```typescript
if (editingItem) {
  const payload: any = {
    _method: 'PATCH',
    name: formData.name,
    unit: formData.unit,
    branchId: selectedBranch, // Always include branchId for stock updates
  };

  if (formData.costPerUnit !== undefined) {
    payload.costPerUnit = parseFloat(formData.costPerUnit);
  }
  if (formData.reorderThreshold !== undefined) {
    payload.reorderThreshold = parseFloat(formData.reorderThreshold);
  }
  // Include initialStock if provided to update current stock
  if (formData.initialStock !== undefined && formData.initialStock.trim() !== '') {
    payload.initialStock = formData.initialStock;
  }

  console.log('[Ingredient Edit] Payload:', payload);
  // ... rest of code ...
}
```

## How It Works Now

1. **User Action:**
   - Opens ingredient edit dialog
   - Changes "Initial Stock" field to a new value (e.g., "50")
   - Clicks "Update Ingredient"

2. **Frontend Sends:**
   ```json
   {
     "_method": "PATCH",
     "name": "Coffee Beans",
     "unit": "kg",
     "costPerUnit": 150,
     "reorderThreshold": 20,
     "branchId": "cml5wnhso0001rw0zg8wzls3x",
     "initialStock": "50"
   }
   ```

3. **Backend Processes:**
   - Updates `Ingredient` table (name, unit, cost, threshold)
   - Checks if `BranchInventory` record exists for this (branchId, ingredientId)
   - **If exists:** Updates `currentStock` to 50, updates timestamps
   - **If not exists:** Creates new `BranchInventory` record with `currentStock` = 50

4. **Result:**
   - ✅ Ingredient details updated
   - ✅ Current stock updated in database
   - ✅ Inventory dashboard reflects new stock immediately
   - ✅ "Ingredient updated successfully!" message shown

## Testing Instructions

1. Go to **Ingredients** management page
2. Select a branch (e.g., "Downtown")
3. Click the **edit** button on any ingredient
4. Change the **Initial Stock** field to a new value (e.g., 50)
5. Click **Update Ingredient**
6. **Expected Result:**
   - ✅ Success message: "Ingredient updated successfully!"
   - ✅ Current stock column in the table shows the new value
   - ✅ Reports → Inventory shows the updated stock

## Important Notes

- The "Initial Stock" field is optional when editing
- If left empty, only ingredient details are updated (name, unit, cost, threshold)
- Stock is updated per-branch, so you must have a branch selected
- Stock updates are tracked with timestamps (`lastRestockAt`, `lastModifiedAt`)

## Code Quality

- ✅ ESLint: No errors
- ✅ TypeScript: Compiled successfully
- ✅ Dev Server: No errors
- ✅ API Endpoints: Working correctly

## Summary

The issue is now fully resolved. When editing an ingredient and changing the Initial Stock value, it will properly update the `BranchInventory.currentStock` field and reflect immediately in the UI.
