'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Package, DollarSign, Search, AlertTriangle, Store } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import { formatCurrency } from '@/lib/utils';

interface Branch {
  id: string;
  branchName: string;
  isActive: boolean;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
  reorderThreshold: number;
  version: number;
  currentStock?: number;
  isLowStock?: boolean;
}

interface BranchInventory {
  branchId: string;
  branchName: string;
  ingredientId: string;
  currentStock: number;
  lastUpdated: Date;
}

interface IngredientFormData {
  name: string;
  unit: string;
  costPerUnit: string;
  reorderThreshold: string;
  initialStock?: string;
}

const units = ['kg', 'g', 'L', 'ml', 'units'];

export default function IngredientManagement() {
  const { currency } = useI18n();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState<IngredientFormData>({
    name: '',
    unit: 'kg',
    costPerUnit: '',
    reorderThreshold: '10',
    initialStock: '',
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // Load user on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    }
  }, []);

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch('/api/branches');
        if (response.ok) {
          const data = await response.json();
          setBranches(data.branches || []);
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error);
      }
    };

    fetchBranches();
  }, []);

  // Set default branch based on user role
  useEffect(() => {
    if (user && branches.length > 0) {
      if (user.role === 'ADMIN') {
        setSelectedBranch(branches[0].id);
      } else if (user.branchId) {
        setSelectedBranch(user.branchId);
      }
    }
  }, [user, branches]);

  useEffect(() => {
    fetchIngredients();
    fetchBranchInventory();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchBranchInventory();
    }
  }, [selectedBranch]);

  const fetchBranchInventory = async () => {
    if (!selectedBranch) return;

    try {
      const response = await fetch(`/api/ingredients?branchId=${selectedBranch}`);
      if (response.ok) {
        const data = await response.json();
        setIngredients(data.ingredients || []);
      }
    } catch (error) {
      console.error('Failed to fetch branch inventory:', error);
    }
  };

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ingredients');
      if (response.ok) {
        const data = await response.json();
        setIngredients(data.ingredients || []);
      }
    } catch (error) {
      console.error('Failed to fetch ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update existing ingredient - Use POST with _method=PATCH to bypass gateway restriction
        const payload: any = {
          _method: 'PATCH', // Method override for gateway compatibility
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

        const response = await fetch(`/api/ingredients/${editingItem.id}`, {
          method: 'POST', // Use POST instead of PATCH to bypass gateway restriction
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        console.log('[Ingredient Edit] Response status:', response.status);
        console.log('[Ingredient Edit] Response data:', data);

        if (response.ok) {
          alert('Ingredient updated successfully!');
          setDialogOpen(false);
          resetForm();
          await fetchIngredients();
          if (selectedBranch) {
            await fetchBranchInventory();
          }
        } else {
          alert(`${data.error || data.details || 'Failed to update ingredient'}\nStatus: ${response.status}`);
        }
      } else {
        // Create new ingredient with optional initial stock
        const payload: any = {
          name: formData.name,
          unit: formData.unit,
          costPerUnit: formData.costPerUnit,
          reorderThreshold: formData.reorderThreshold,
        };

        // Only add branchId and initialStock if initialStock is provided
        if (formData.initialStock && formData.initialStock.trim() !== '') {
          payload.branchId = selectedBranch;
          payload.initialStock = formData.initialStock;
        }

        const response = await fetch('/api/ingredients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          setDialogOpen(false);
          resetForm();
          await fetchIngredients();
          if (selectedBranch) {
            await fetchBranchInventory();
          }
        } else {
          alert(data.error || 'Failed to save ingredient');
        }
      }
    } catch (error) {
      console.error('[handleSubmit] Failed to save ingredient:', error);
      alert(`Failed to save ingredient: ${String(error)}`);
    }
  };

  const handleEdit = (item: Ingredient) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      unit: item.unit,
      costPerUnit: item.costPerUnit.toString(),
      reorderThreshold: item.reorderThreshold.toString(),
      initialStock: item.currentStock?.toString() || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this ingredient? This will affect all recipes and inventory records.')) return;
    try {
      const response = await fetch(`/api/ingredients/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Ingredient deleted successfully!');
        await fetchIngredients();
        if (selectedBranch) {
          await fetchBranchInventory();
        }
      } else {
        alert(data.error || 'Failed to delete ingredient');
      }
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      alert('Failed to delete ingredient');
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      unit: 'kg',
      costPerUnit: '',
      reorderThreshold: '10',
      initialStock: '',
    });
  };

  const filteredIngredients = ingredients.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              Ingredient Management
            </CardTitle>
            <CardDescription>
              Manage ingredients and set reorder thresholds. Changes sync to all branches.
              {user?.role === 'ADMIN' ? ' View inventory across all branches.' : ' Ingredients are read-only at branch level.'}
            </CardDescription>
          </div>

          {/* Branch Selector */}
          <div className="flex items-center gap-4 p-4 bg-[#F4F0EA] dark:bg-[#0B2B22] rounded-lg border border-[#C7A35A]/20">
            <Store className="h-5 w-5 text-[#C7A35A]" />
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                {user?.role === 'ADMIN' ? 'View Inventory for Branch:' : 'Your Branch Inventory:'}
              </label>
              {user?.role === 'ADMIN' ? (
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="border-[#C7A35A]/30 focus:border-[#C7A35A]">
                    <SelectValue placeholder="Select branch..." />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="font-medium">
                  {branches.find(b => b.id === selectedBranch)?.branchName || 'Loading...'}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {user?.role === 'ADMIN' && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ingredient
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? 'Edit Ingredient' : 'Add Ingredient'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Ingredient Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Coffee Beans (Espresso)"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="unit">Unit</Label>
                          <Select
                            value={formData.unit}
                            onValueChange={(value) => setFormData({ ...formData, unit: value })}
                          >
                            <SelectTrigger id="unit">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="costPerUnit">Cost per Unit ({currency})</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              id="costPerUnit"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.costPerUnit}
                              onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                              placeholder="0.00"
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="reorderThreshold">Reorder Threshold (units)</Label>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <Input
                              id="reorderThreshold"
                              type="number"
                              min="0"
                              value={formData.reorderThreshold}
                              onChange={(e) => setFormData({ ...formData, reorderThreshold: e.target.value })}
                              placeholder="10"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="initialStock">
                            Initial Stock ({formData.unit}) <span className="text-slate-500">(Optional)</span>
                          </Label>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-green-500" />
                            <Input
                              id="initialStock"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.initialStock}
                              onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                              placeholder="0.00"
                            />
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Set initial stock for {branches.find(b => b.id === selectedBranch)?.branchName || 'selected branch'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">{editingItem ? 'Update' : 'Add'} Ingredient</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Ingredients ({filteredIngredients.length})
            {selectedBranch && (
              <Badge variant="outline" className="ml-2">
                {branches.find(b => b.id === selectedBranch)?.branchName}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-600">Loading...</div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Cost/Unit</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    {user?.role === 'ADMIN' && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIngredients.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{formatCurrency(item.costPerUnit, currency)}</TableCell>
                      <TableCell>
                        {item.currentStock !== undefined ? (
                          <span className={item.isLowStock ? 'text-red-600 font-semibold' : ''}>
                            {item.currentStock} {item.unit}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.isLowStock !== undefined ? (
                          item.isLowStock ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-emerald-600">In Stock</Badge>
                          )
                        ) : (
                          <Badge variant="outline">Unknown</Badge>
                        )}
                      </TableCell>
                      <TableCell>{item.reorderThreshold} {item.unit}</TableCell>
                      {user?.role === 'ADMIN' && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filteredIngredients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-600">
                        No ingredients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
