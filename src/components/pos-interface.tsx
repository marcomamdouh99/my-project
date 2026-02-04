'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coffee, Cake, Cookie, IceCream, Trash2, Plus, Minus, CreditCard, DollarSign, Printer, ShoppingCart, Store, X, CheckCircle, Receipt, AlertTriangle, Package, TrendingUp, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import { formatCurrency } from '@/lib/utils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isActive: boolean;
}

export default function POSInterface() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const { language, currency, t } = useI18n();

  // Fetch branches from database
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch('/api/branches');
        const data = await response.json();

        if (response.ok && data.branches) {
          const branchesList = data.branches.map((branch: any) => ({
            id: branch.id,
            name: branch.branchName,
          }));
          setBranches(branchesList);
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error);
      }
    };

    fetchBranches();
  }, []);

  // Load user on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
    }
  }, []);

  // Refresh shift when window/tab becomes visible (after opening shift in another tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.role === 'CASHIER') {
        // Re-fetch shift when tab becomes visible
        const fetchCurrentShift = async () => {
          try {
            const branchId = user.branchId;
            if (!branchId) {
              setCurrentShift(null);
              return;
            }

            const params = new URLSearchParams({
              branchId, // Include branchId for API requirement
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
          } catch (error) {
            console.error('Failed to refresh shift on tab visibility:', error);
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

  // Set default branch for admin after branches are loaded
  useEffect(() => {
    if (user?.role === 'ADMIN' && branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [user, branches, selectedBranch]);

  // Fetch current shift for cashiers
  useEffect(() => {
    const fetchCurrentShift = async () => {
      if (!user || user.role !== 'CASHIER') {
        setCurrentShift(null);
        return;
      }

      // For cashiers, use user.branchId instead of selectedBranch
      const branchId = user.role === 'CASHIER' ? user.branchId : selectedBranch;

      if (!branchId) {
        setCurrentShift(null);
        return;
      }

      try {
        const params = new URLSearchParams({
          branchId, // Include branchId for API requirement
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
      } catch (error) {
        console.error('Failed to fetch current shift:', error);
      }
    };

    fetchCurrentShift();
  }, [user, user?.branchId, selectedBranch]);

  const categories = [
    { id: 'all', name: t('pos.categories.all'), icon: <Coffee className="h-4 w-4" /> },
    { id: 'hot-drinks', name: t('pos.categories.hot'), icon: <Coffee className="h-4 w-4" /> },
    { id: 'cold-drinks', name: t('pos.categories.cold'), icon: <IceCream className="h-4 w-4" /> },
    { id: 'pastries', name: t('pos.categories.pastries'), icon: <Cake className="h-4 w-4" /> },
    { id: 'snacks', name: t('pos.categories.snacks'), icon: <Cookie className="h-4 w-4" /> },
  ];

  // Fetch menu items from API
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch('/api/menu-items?active=true');
        const data = await response.json();

        if (response.ok && data.menuItems) {
          setMenuItems(data.menuItems);
        }
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Fetch low stock alerts when branch is selected
  useEffect(() => {
    const fetchLowStockAlerts = async () => {
      const branchId = user?.role === 'ADMIN' ? selectedBranch : user?.branchId;

      if (!branchId) {
        setLowStockAlerts([]);
        return;
      }

      try {
        const response = await fetch(`/api/inventory/low-stock?branchId=${branchId}`);
        const data = await response.json();

        if (response.ok && data.alerts) {
          setLowStockAlerts(data.alerts);
        }
      } catch (error) {
        console.error('Failed to fetch low stock alerts:', error);
      }
    };

    fetchLowStockAlerts();
  }, [selectedBranch, user?.branchId, user?.role]);

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;

  const handleCheckout = async (paymentMethod: 'cash' | 'card') => {
    if (cart.length === 0) return;

    // For cashiers, check if they have an active shift
    if (user?.role === 'CASHIER' && !currentShift) {
      alert('Please open a shift in the Shifts tab before processing sales.');
      return;
    }

    // Validate branch selection for admin
    if (user?.role === 'ADMIN' && !selectedBranch) {
      alert('Please select a branch to process this sale');
      return;
    }

    // Show loading state with better styling
    const loadingState = document.createElement('div');
    loadingState.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm';
    loadingState.innerHTML = `
      <div class="bg-gradient-to-br from-amber-50 via-amber-100 to-slate-800/80 p-8 rounded-2xl shadow-2xl border-2 border-white/20 backdrop-blur-md">
        <div class="text-white text-center">
          <svg class="animate-spin h-12 w-12 mx-auto mb-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a2 2 0 0-2-2 0l-2.12 2 10-12 10-16 6 0-01 0zm11 13.91h10l-1 1 0-10.16l-14a2 2 20.14.20.4a2 6.51a2 20.2 20.8a2 6.49z13.91l-1 1 0-10.16l-14a2 2 20.14.20.4a2 6.6.49z13.91l-1 1 0-10.16l-14a 2 20.14.20.4a2 6.6.55a2 20.2 20.8a2 6.6.55a2 20.2 20.8a2 6.6.55a2 20.7a2 6.56a2 20.2 20.8a2 6.6.55a2 20.2 20.7a2 6.6.55a2 20.2 20.8a2 6.6.55a2 20.7a6.6.55a2 20.2 20.7a2 6.6.56a2 55a2 20.2 20.8a4a2 6.6.55a2 20.2 20.7a 6.6.55a2 20.2 20.8a2 6.6.55a2 20.2 20.7a6.6.56a2 55a2 20.2 20.7a6.6.55a2 20.2 20.8a4a2 6.6.56a2 55a2 20.7a6.6.55a2 20.2 20.7a6.6.55a2 20.2 20.8a2 6.6.55a2 20.7a6 6.6.55a2 0m11 13.91h10l-1 1 0-10.16l-14a2 2 20.14.20.4a2 6.6.55a2 20.2 20.8a4a2 6.6.55a2 20.7a66.56a2 55a2 20.2 20.8a2 6.6.55a2 20.2 20.7a2 6.6.55a2 20.2 20.8a2 6.6.56a/80 text-white">Processing order...</div>
      </div>
    `;
    document.body.appendChild(loadingState);

    try {
      // Determine branch ID
      const branchId = user?.role === 'ADMIN' ? selectedBranch : user?.branchId;

      if (!branchId) {
        alert('Branch not found. Please contact administrator.');
        document.body.removeChild(loadingState);
        return;
      }

      // Prepare order items
      const orderItems = cart.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
      }));

      // Call API to create order with inventory deduction
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branchId: branchId,
          cashierId: user.id,
          items: orderItems,
          paymentMethod: paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.error || 'Failed to process order');
        document.body.removeChild(loadingState);
        return;
      }

      // Success!
      alert(`${t('order.success')} #${data.order.orderNumber}\n\n${t('order.total')}: ${formatCurrency(data.order.total, currency)}\n${t('order.payment')}: ${paymentMethod}\n\n${t('order.details')}`);

      clearCart();
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      if (document.body.contains(loadingState)) {
        document.body.removeChild(loadingState);
      }
    }
  };

  // Check if cashier has active shift - block POS access if not
  if (user?.role === 'CASHIER' && !currentShift) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <Clock className="h-16 w-16 mx-auto text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Active Shift</h2>
            <p className="text-slate-600 mb-6">
              Please open a shift in the <strong>Shifts</strong> tab before you can access the POS.
            </p>
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-semibold mb-1">Shift is required</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    As a cashier, you must have an active shift to process sales. All transactions will be tracked to your shift.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Go to Shifts tab → Click "Open Shift" → Return to POS
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-slate-600">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu Items Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              {t('pos.menu.items')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Category Filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'border-primary/30 hover:border-primary hover:bg-primary/10'
                  }`}
                >
                  {category.icon}
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Low Stock Alerts */}
            {lowStockAlerts.length > 0 && (
              <div className="mb-6 space-y-2">
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 dark:text-red-100 text-sm mb-2">
                      {t('alerts.low.stock')} ({lowStockAlerts.length})
                    </h4>
                    <ScrollArea className="h-24">
                      <div className="space-y-1 text-xs">
                        {lowStockAlerts.slice(0, 3).map((alert) => (
                          <div key={alert.ingredientId} className="flex items-center justify-between">
                            <span className="text-red-800 dark:text-red-200">
                              {alert.ingredientName}: {alert.currentStock} {alert.unit}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {alert.urgency}
                            </Badge>
                          </div>
                        ))}
                        {lowStockAlerts.length > 3 && (
                          <div className="text-red-700 dark:text-red-300 italic">
                            +{lowStockAlerts.length - 3} more...
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}

            {/* Shift Status for Cashiers */}
            {user?.role === 'CASHIER' && (
              <div className="mb-6 space-y-2">
                {currentShift ? (
                  <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm mb-2">
                        Shift Open
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        Started at {new Date(currentShift.startTime).toLocaleTimeString()} | You can process sales
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">
                        No Active Shift
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Please go to the <strong className="text-amber-800">Shifts</strong> tab to open a shift before processing sales.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Menu Grid */}
            <ScrollArea className="h-[600px] pr-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {menuItems
                  .filter((item) => item.isActive && (selectedCategory === 'all' || item.category === selectedCategory))
                  .map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 border-2 border-primary/20 hover:border-primary bg-white dark:bg-slate-800"
                      onClick={() => addToCart(item)}
                    >
                      <CardContent className="p-4 flex flex-col items-center justify-center h-40">
                        <div className="bg-primary/10 p-3 rounded-full mb-2">
                          <Coffee className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-center text-sm mb-1">{item.name}</h3>
                        <Badge className="bg-primary text-primary-foreground text-sm border-0">
                          {formatCurrency(item.price, currency)}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Shopping Cart Section */}
      <div className="space-y-4">
        <Card className="sticky top-4">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {t('pos.cart.title')}
              </CardTitle>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {/* Branch Selector for Admin */}
            {user?.role === 'ADMIN' && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  {t('pos.process.sale')}
                </label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="border-primary/30 focus:border-primary">
                    <SelectValue placeholder={t('pos.select.branch')} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {user?.role !== 'ADMIN' && user?.branchId && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">{t('pos.branch')}: </span>
                {branches.find(b => b.id === user.branchId)?.name || user.branchId}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4 mb-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <ShoppingCart className="h-12 w-12 mb-2" />
                  <p>{t('pos.cart.empty')}</p>
                  <p className="text-sm">{t('pos.cart.add.items')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {formatCurrency(item.price, currency)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Separator className="my-4" />

            {/* Order Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">{t('pos.subtotal')}</span>
                <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>{t('pos.total')}</span>
                <span>{formatCurrency(total, currency)}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => handleCheckout('cash')}
                disabled={cart.length === 0 || (user?.role === 'CASHIER' && !currentShift)}
              >
                <DollarSign className="h-5 w-5 mr-2" />
                {t('pos.cash')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full border-primary/50 hover:bg-primary/10 hover:border-primary text-foreground font-semibold transition-all"
                onClick={() => handleCheckout('card')}
                disabled={cart.length === 0 || (user?.role === 'CASHIER' && !currentShift)}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {t('pos.card')}
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full mt-3 border-primary/30 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
              disabled={cart.length === 0}
            >
              <Printer className="h-4 w-4 mr-2" />
              {t('pos.print')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
