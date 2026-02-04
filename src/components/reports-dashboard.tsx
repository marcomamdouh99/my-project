'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BarChart3, TrendingUp, Package, ShoppingCart, Calendar, DollarSign, Store, FileText, X, Settings, RotateCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { formatCurrency } from '@/lib/utils';
import AdvancedAnalytics from '@/components/advanced-analytics';

interface SalesReport {
  id: string;
  orderNumber: number;
  items: number;
  total: number;
  subtotal: number;
  cashier: string;
  branchId: string;
  timestamp: Date;
  isRefunded?: boolean;
  refundReason?: string;
}

interface InventoryReport {
  ingredient: string;
  currentStock: number;
  threshold: number;
  unit: string;
  status: 'ok' | 'low' | 'critical';
}

interface Branch {
  id: string;
  branchName: string;
  isActive: boolean;
}

const timeRanges = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
];

export default function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState('sales');
  const [timeRange, setTimeRange] = useState('today');
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<SalesReport | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundPassword, setRefundPassword] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [salesData, setSalesData] = useState<SalesReport[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryReport[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { language, currency, t } = useI18n();

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
    if (user) {
      if (user.role === 'ADMIN') {
        setSelectedBranch('all');
      } else if (user.branchId) {
        setSelectedBranch(user.branchId);
      }
    }
  }, [user]);

  // Fetch sales data when branch selection changes
  useEffect(() => {
    fetchSalesData();
  }, [selectedBranch, timeRange]);

  // Fetch inventory data when inventory tab is active and branch is selected
  useEffect(() => {
    if (activeTab === 'inventory' && selectedBranch && selectedBranch !== 'all') {
      getInventoryReports();
    }
  }, [activeTab, selectedBranch]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const branchId = selectedBranch === 'all' ? undefined : selectedBranch;
      let query = '/api/orders';

      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (timeRange) {
        const now = new Date();
        let startDate = new Date();

        switch (timeRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setDate(now.getDate() - 30);
            break;
          case 'quarter':
            startDate.setDate(now.getDate() - 90);
            break;
        }
        params.append('startDate', startDate.toISOString());
      }

      if (params.toString()) {
        query += `?${params.toString()}`;
      }

      const response = await fetch(query);
      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];

        // Transform orders to SalesReport format
        const transformedOrders: SalesReport[] = orders.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          items: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
          total: order.totalAmount || order.subtotal || 0,
          subtotal: order.subtotal || 0,
          cashier: order.cashier?.name || 'Unknown',
          branchId: order.branchId,
          timestamp: order.orderTimestamp,
          isRefunded: order.isRefunded,
          refundReason: order.refundReason,
        }));

        setSalesData(transformedOrders);
      } else {
        setSalesData([]);
      }
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const sampleInventoryData: InventoryReport[] = [
    { ingredient: 'Coffee Beans (Espresso)', currentStock: 25.5, threshold: 20, unit: 'kg', status: 'ok' },
    { ingredient: 'Whole Milk', currentStock: 48, threshold: 50, unit: 'L', status: 'low' },
    { ingredient: 'Oat Milk', currentStock: 15, threshold: 30, unit: 'L', status: 'critical' },
    { ingredient: 'Sugar', currentStock: 22, threshold: 15, unit: 'kg', status: 'ok' },
    { ingredient: 'Chocolate Syrup', currentStock: 12, threshold: 10, unit: 'L', status: 'ok' },
    { ingredient: 'Vanilla Syrup', currentStock: 5, threshold: 10, unit: 'L', status: 'critical' },
    { ingredient: 'Croissants', currentStock: 35, threshold: 30, unit: 'units', status: 'ok' },
    { ingredient: 'Muffins', currentStock: 20, threshold: 25, unit: 'units', status: 'low' },
  ];

  const getSalesStats = () => {
    let filteredData = salesData;
    if (selectedBranch && selectedBranch !== 'all') {
      filteredData = filteredData.filter(order => order.branchId === selectedBranch);
    }

    // Exclude refunded orders from revenue calculation
    const activeOrders = filteredData.filter(order => !order.isRefunded);

    const totalSales = activeOrders.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = filteredData.reduce((sum, sale) => sum + sale.items, 0);
    const totalOrders = activeOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales,
      totalOrders,
      totalItems,
      avgOrderValue,
    };
  };

  const getInventoryReports = async () => {
    if (!selectedBranch || selectedBranch === 'all') {
      return;
    }

    setInventoryLoading(true);
    try {
      const response = await fetch(`/api/inventory?branchId=${selectedBranch}`);
      const data = await response.json();
      setInventoryData(data.inventory || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const getInventoryStats = () => {
    const totalIngredients = inventoryData.length;
    const lowStock = inventoryData.filter((i) => i.status === 'low' || i.status === 'critical').length;
    const criticalStock = inventoryData.filter((i) => i.status === 'critical').length;

    return {
      totalIngredients,
      lowStock,
      criticalStock,
      healthyStock: totalIngredients - lowStock,
    };
  };

  const salesStats = getSalesStats();
  const inventoryStats = getInventoryStats();

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-emerald-600">In Stock</Badge>;
      case 'low':
        return <Badge className="bg-amber-500">Low</Badge>;
      case 'critical':
        return <Badge className="bg-red-500">Critical</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const handleOrderClick = (order: SalesReport) => {
    setSelectedOrder(order);
    setOrderDialogOpen(true);
  };

  const handleRefundClick = () => {
    setOrderDialogOpen(false);
    setRefundDialogOpen(true);
  };

  const handleRefund = async () => {
    // Simple admin password check (demo: demo123)
    if (refundPassword !== 'demo123') {
      alert('Invalid admin password');
      return;
    }

    if (!refundReason.trim()) {
      alert('Please provide a reason for the refund');
      return;
    }

    if (!selectedOrder) return;

    setIsRefunding(true);
    try {
      const response = await fetch(`/api/orders/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          reason: refundReason,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSalesData(prevData =>
          prevData.map(order =>
            order.id === selectedOrder?.id
              ? { ...order, isRefunded: true, refundReason }
              : order
          )
        );

        setRefundDialogOpen(false);
        setRefundPassword('');
        setRefundReason('');
        alert(`Order #${selectedOrder?.orderNumber} has been refunded successfully!`);
        await fetchSalesData();
      } else {
        alert(data.error || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Refund error:', error);
      alert('Failed to process refund');
    } finally {
      setIsRefunding(false);
    }
  };

  const getFilteredSalesData = () => {
    if (selectedBranch && selectedBranch !== 'all') {
      return salesData.filter(order => order.branchId === selectedBranch);
    }
    return salesData;
  };

  return (
    <div className="space-y-6">
      {/* Branch Selector Card for Admin */}
      {user?.role === 'ADMIN' && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Store className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <label className="text-sm font-semibold mb-2 block">{t('branch.select')}</label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="border-primary/30 focus:border-primary">
                    <SelectValue placeholder="Select branch..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.role === 'BRANCH_MANAGER' && selectedBranch && selectedBranch !== 'all' && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Store className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">Your Branch</p>
                <p className="font-medium">
                  {branches.find(b => b.id === selectedBranch)?.branchName || 'Loading...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <TabsList className="bg-white dark:bg-slate-800">
              <TabsTrigger value="sales" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <DollarSign className="h-4 w-4 mr-2" />
                {t('reports.sales')}
              </TabsTrigger>
              <TabsTrigger value="inventory" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Package className="h-4 w-4 mr-2" />
                {t('reports.inventory')}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
            {selectedBranch && selectedBranch !== 'all' && (
              <Badge variant="outline" className="border-primary/50">
                {branches.find(b => b.id === selectedBranch)?.branchName}
              </Badge>
            )}
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="sales" className="space-y-6">
          {/* Sales Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">{t('reports.total.sales')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatCurrency(salesStats.totalSales, currency)}</span>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {t('reports.gross.sales')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">{t('reports.net.sales')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatCurrency(salesStats.totalSales, currency)}</span>
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Total Sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">{t('reports.total.orders')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{salesStats.totalOrders}</span>
                  <ShoppingCart className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {salesStats.totalItems} {t('reports.items.sold')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">{t('reports.avg.order')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatCurrency(salesStats.avgOrderValue, currency)}</span>
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {t('reports.per.transaction')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sales Detail Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.sales.details')}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-600">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('order.number')}</TableHead>
                      <TableHead>{t('order.items')}</TableHead>
                      <TableHead>{t('order.total')}</TableHead>
                      <TableHead>{t('order.cashier')}</TableHead>
                      <TableHead>{t('order.time')}</TableHead>
                      <TableHead>Branch</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredSalesData().map((sale) => (
                      <TableRow
                        key={sale.id}
                        className={`cursor-pointer hover:bg-primary/10 transition-colors ${sale.isRefunded ? 'opacity-50' : ''}`}
                        onClick={() => !sale.isRefunded && handleOrderClick(sale)}
                      >
                        <TableCell className="font-medium">
                          #{sale.orderNumber}
                          {sale.isRefunded && <Badge className="ml-2" variant="destructive">Refunded</Badge>}
                        </TableCell>
                        <TableCell>{sale.items}</TableCell>
                        <TableCell>{formatCurrency(sale.total, currency)}</TableCell>
                        <TableCell>{sale.cashier}</TableCell>
                        <TableCell>
                          {new Date(sale.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          {branches.find(b => b.id === sale.branchId)?.branchName || 'Unknown'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {getFilteredSalesData().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-600">
                          {loading ? 'Loading...' : 'No sales data found for the selected period'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Total Ingredients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{inventoryStats.totalIngredients}</span>
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Healthy Stock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{inventoryStats.healthyStock}</span>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Low Stock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{inventoryStats.lowStock}</span>
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Critical Stock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{inventoryStats.criticalStock}</span>
                  <TrendingUp className="h-5 w-5 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Detail Table */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading inventory data...
                      </TableCell>
                    </TableRow>
                  ) : inventoryData.length > 0 ? (
                    inventoryData.map((item) => (
                      <TableRow key={item.ingredient}>
                        <TableCell className="font-medium">{item.ingredient}</TableCell>
                        <TableCell>{item.currentStock} {item.unit}</TableCell>
                        <TableCell>{item.threshold} {item.unit}</TableCell>
                        <TableCell>{getStockBadge(item.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        {selectedBranch && selectedBranch !== 'all'
                          ? 'No inventory data available for this branch'
                          : 'Please select a branch to view inventory'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <AdvancedAnalytics />
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order Number</Label>
                  <p className="text-lg font-semibold">#{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <Label>Total</Label>
                  <p className="text-lg font-semibold">{formatCurrency(selectedOrder.total, currency)}</p>
                </div>
                <div>
                  <Label>Items</Label>
                  <p>{selectedOrder.items}</p>
                </div>
                <div>
                  <Label>Cashier</Label>
                  <p>{selectedOrder.cashier}</p>
                </div>
                <div>
                  <Label>Time</Label>
                  <p>{new Date(selectedOrder.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Branch</Label>
                  <p>{branches.find(b => b.id === selectedOrder.branchId)?.branchName || 'Unknown'}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subtotal</Label>
                  <p>{formatCurrency(selectedOrder.subtotal, currency)}</p>
                </div>
                <div>
                  <Label>Total</Label>
                  <p>{formatCurrency(selectedOrder.total, currency)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>
              Close
            </Button>
            {!selectedOrder?.isRefunded && user?.role === 'ADMIN' && (
              <Button variant="destructive" onClick={handleRefundClick}>
                Process Refund
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                Refund for Order #{selectedOrder?.orderNumber} - {formatCurrency((selectedOrder?.total || 0), currency)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refundPassword">Admin Password</Label>
              <Input
                id="refundPassword"
                type="password"
                value={refundPassword}
                onChange={(e) => setRefundPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refundReason">Refund Reason</Label>
              <Input
                id="refundReason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g., Customer complaint, Wrong order"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={isRefunding}
            >
              {isRefunding ? 'Processing...' : 'Confirm Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
