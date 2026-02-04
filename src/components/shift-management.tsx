'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, DollarSign, ShoppingCart, Play, Square, AlertCircle, Calendar, User, TrendingUp, Store } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { formatCurrency } from '@/lib/utils';

interface Shift {
  id: string;
  branchId: string;
  cashierId: string;
  cashier?: {
    id: string;
    username: string;
    name?: string;
  };
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCash?: number;
  openingOrders: number;
  closingOrders?: number;
  openingRevenue: number;
  closingRevenue?: number;
  isClosed: boolean;
  notes?: string;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
  // For open shifts - calculated at runtime
  currentRevenue?: number;
  currentOrders?: number;
}

interface Cashier {
  id: string;
  username: string;
  name?: string;
}

export default function ShiftManagement() {
  const { user } = useAuth();
  const { t, currency } = useI18n();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCashier, setSelectedCashier] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');

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

  // Load user on mount and set default branch
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN' && branches.length > 0) {
        setSelectedBranch(branches[0].id);
      } else if (user.branchId) {
        setSelectedBranch(user.branchId);
      }
    }
  }, [user, branches]);

  // Fetch shifts when branch or filters change
  useEffect(() => {
    fetchShifts();
    fetchCashiers();

    // For cashiers, also fetch their current shift
    if (user?.role === 'CASHIER' && user.branchId) {
      fetchCurrentShift();
    }
  }, [selectedBranch, selectedStatus, selectedCashier]);

  // Clear selectedShift if shifts array becomes empty
  useEffect(() => {
    if (shifts.length === 0 && selectedShift) {
      setSelectedShift(null);
      setClosingCash('');
      setShiftNotes('');
      setCloseDialogOpen(false);
    }
  }, [shifts]);

  // Fetch shifts on mount
  useEffect(() => {
    if (user && user.role === 'CASHIER') {
      const fetchCurrentShift = async () => {
        try {
          const params = new URLSearchParams({
            cashierId: user.id,
            branchId: user.branchId, // Add branchId for cashiers too
            status: 'open',
          });

          const response = await fetch(`/api/shifts?${params.toString()}`);
          const data = await response.json();

          if (response.ok && data.shifts && data.shifts.length > 0) {
            setSelectedShift(data.shifts[0]);
          } else {
            setSelectedShift(null);
          }
        } catch (error) {
          console.error('Failed to fetch current shift:', error);
        }
      };

      fetchCurrentShift();
    }
  }, [user]);

  // Fetch current shift for cashiers
  const fetchCurrentShift = async () => {
    if (user?.role !== 'CASHIER' || !user?.branchId) return;

    try {
      const params = new URLSearchParams({
        cashierId: user.id,
        branchId: user.branchId, // Add branchId for cashiers too
        status: 'open',
      });
      const response = await fetch(`/api/shifts?${params.toString()}`);
      const data = await response.json();

      if (response.ok && data.shifts && data.shifts.length > 0) {
        setSelectedShift(data.shifts[0]);
      } else {
        setSelectedShift(null);
      }
    } catch (error) {
      console.error('Failed to fetch current shift:', error);
      setSelectedShift(null);
    }
  };

  const fetchShifts = async () => {
    if (!selectedBranch) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ branchId: selectedBranch });
      if (selectedStatus && selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (selectedCashier && selectedCashier !== 'all') {
        params.append('cashierId', selectedCashier);
      }

      const response = await fetch(`/api/shifts?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setShifts(data.shifts || []);
      }
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashiers = async () => {
    if (!selectedBranch) return;

    try {
      const response = await fetch(`/api/users?branchId=${selectedBranch}&role=CASHIER`);
      const data = await response.json();

      if (response.ok && data.users) {
        setCashiers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch cashiers:', error);
    }
  };

  const handleOpenShift = async () => {
    if (user?.role === 'CASHIER') {
      // Cashier opens their own shift
      if (!user?.branchId) {
        alert('Your account is not assigned to a branch. Please contact your manager.');
        return;
      }
      
      const cashierId = user.id;
      const branchId = user.branchId;
      
      try {
        const response = await fetch('/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branchId,
            cashierId,
            openingCash: parseFloat(openingCash) || 0,
            notes: shiftNotes,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          alert('Shift opened successfully!');
          setOpenDialogOpen(false);
          setOpeningCash('');
          setShiftNotes('');
          fetchShifts();
          fetchCashiers(); // Refresh to get the current shift
        } else {
          alert(data.error || 'Failed to open shift');
        }
      } catch (error) {
        console.error('Failed to open shift:', error);
        alert('Failed to open shift');
      }
      return;
    }

    // Admin/Branch Manager opens shift for a selected cashier
    if (!selectedBranch) {
      alert('Please select a branch');
      return;
    }

    // For Branch Manager, use their own cashier ID (though this shouldn't happen)
    const cashierId = user?.role === 'BRANCH_MANAGER' ? user.id : selectedCashier;

    if (!cashierId) {
      alert('Please select a cashier');
      return;
    }

    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranch,
          cashierId,
          openingCash: parseFloat(openingCash) || 0,
          notes: shiftNotes,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Shift opened successfully!');
        setOpenDialogOpen(false);
        setOpeningCash('');
        setShiftNotes('');
        fetchShifts();
      } else {
        alert(data.error || 'Failed to open shift');
      }
    } catch (error) {
      console.error('Failed to open shift:', error);
      alert('Failed to open shift');
    }
  };

  const handleCloseShift = async () => {
    if (!selectedShift) {
      alert('Please select a shift to close');
      return;
    }

    if (!selectedBranch) {
      alert('Please select a branch to view shifts');
      return;
    }

    try {
      // Use POST with _method=PATCH to bypass gateway restriction
      const response = await fetch(`/api/shifts/${selectedShift.id}`, {
        method: 'POST', // Use POST instead of PATCH to bypass gateway restriction
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _method: 'PATCH', // Method override for gateway compatibility
          closingCash: parseFloat(closingCash) || 0,
          notes: shiftNotes,
        }),
      });

      const data = await response.json();

      console.log('[handleCloseShift] Response status:', response.status);
      console.log('[handleCloseShift] Response data:', data);

      if (response.ok && data.success) {
        alert('Shift closed successfully!');
        setCloseDialogOpen(false);
        setClosingCash('');
        setShiftNotes('');
        setSelectedShift(null);
        fetchShifts();
      } else {
        const errorMsg = data.error || data.details || 'Failed to close shift';
        alert(`${errorMsg}\nStatus: ${response.status}`);
      }
    } catch (error) {
      console.error('[handleCloseShift] Failed to close shift:', error);
      alert(`Failed to close shift: ${String(error)}`);
    }
  };

  const getShiftStats = (shift: Shift) => {
    // For closed shifts, calculate based on closing values
    if (shift.isClosed) {
      const ordersDuringShift = shift.closingOrders ? shift.closingOrders - shift.openingOrders : 0;
      const revenueDuringShift = shift.closingRevenue ? shift.closingRevenue - shift.openingRevenue : 0;
      const cashDifference = shift.closingCash ? shift.closingCash - shift.openingCash : 0;

      return {
        ordersDuringShift,
        revenueDuringShift,
        cashDifference,
        isDiscrepancy: Math.abs(cashDifference - revenueDuringShift) > 0.01,
      };
    }

    // For open shifts, use current revenue from orders
    const revenueDuringShift = shift.currentRevenue || 0;
    const ordersDuringShift = shift.currentOrders ? shift.currentOrders - shift.openingOrders : 0;
    const cashDifference = 0; // Can't calculate without closing cash

    return {
      ordersDuringShift,
      revenueDuringShift,
      cashDifference,
      isDiscrepancy: false,
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilteredShifts = () => {
    return shifts;
  };

  return (
    <div className="space-y-6">
      {/* Branch Selector */}
      {user?.role === 'ADMIN' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Store className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <Label className="text-sm font-semibold mb-2 block">{t('branch.select')}</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch..." />
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Shift Management
          </CardTitle>
          <CardDescription>
            Track and manage cashier shifts with sales tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  <SelectItem value="open">Open Shifts</SelectItem>
                  <SelectItem value="closed">Closed Shifts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cashier Filter (Admin only) */}
            {user?.role === 'ADMIN' && (
              <div className="flex-1">
                <Label className="text-sm font-medium mb-2 block">Cashier</Label>
                <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                  <SelectTrigger>
                    <SelectValue placeholder="All cashiers..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cashiers</SelectItem>
                    {cashiers.map((cashier) => (
                      <SelectItem key={cashier.id} value={cashier.id}>
                        {cashier.name || cashier.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-end gap-2">
              {(user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER') && (
                <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Play className="h-4 w-4 mr-2" />
                      Open Shift
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Open New Shift</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {user?.role === 'ADMIN' && (
                        <div className="space-y-2">
                          <Label htmlFor="cashier">Cashier</Label>
                          <Select value={selectedCashier} onValueChange={setSelectedCashier}>
                            <SelectTrigger id="cashier">
                              <SelectValue placeholder="Select cashier..." />
                            </SelectTrigger>
                            <SelectContent>
                              {cashiers.map((cashier) => (
                                <SelectItem key={cashier.id} value={cashier.id}>
                                  {cashier.name || cashier.username}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="openingCash">Opening Cash ({currency})</Label>
                        <Input
                          id="openingCash"
                          type="number"
                          step="0.01"
                          value={openingCash}
                          onChange={(e) => setOpeningCash(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={shiftNotes}
                          onChange={(e) => setShiftNotes(e.target.value)}
                          placeholder="Any special notes for this shift..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpenDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleOpenShift} disabled={!openingCash}>
                        Open Shift
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              <Button variant="outline" onClick={fetchShifts} disabled={loading}>
                <Clock className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cashier's Current Shift Card */}
      {user?.role === 'CASHIER' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              My Shift
            </CardTitle>
            <CardDescription>
              {selectedShift ? 'You have an open shift' : 'Start a new shift to process sales'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedShift ? (
              <>
                {/* Shift is open - Show details and close button */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Started At</p>
                    <p className="font-medium">
                      {formatDate(selectedShift.startTime)}
                    </p>
                    <p className="text-sm">
                      {formatTime(selectedShift.startTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Opening Cash</p>
                    <p className="font-medium">{formatCurrency(selectedShift.openingCash, currency)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Orders Processed</p>
                    <p className="font-medium">{selectedShift.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Revenue</p>
                    <p className="font-medium">{formatCurrency(selectedShift.openingRevenue, currency)}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-6">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="closingCash">Closing Cash ({currency})</Label>
                    <Input
                      id="closingCash"
                      type="number"
                      step="0.01"
                      value={closingCash}
                      onChange={(e) => setClosingCash(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={shiftNotes}
                      onChange={(e) => setShiftNotes(e.target.value)}
                      placeholder="Any notes for this shift..."
                      rows={3}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCloseShift}
                  disabled={!closingCash}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Close My Shift
                </Button>
              </>
            ) : (
              <>
                {/* No open shift - Show open button */}
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Clock className="h-16 w-16 text-slate-400" />
                  <p className="text-lg text-slate-600 dark:text-slate-400">
                    You don't have an active shift
                  </p>
                  <Button
                    onClick={handleOpenShift}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!user.branchId}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Open New Shift
                  </Button>
                  {!user.branchId && (
                    <p className="text-sm text-red-600">
                      Your account is not assigned to a branch. Please contact your manager.
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shifts List */}
      <Card>
        <CardHeader>
          <CardTitle>Shift History</CardTitle>
          <CardDescription>
            Track sales, cash, and performance per shift
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-3 text-slate-600">Loading shifts...</span>
            </div>
          ) : shifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Clock className="h-12 w-12 mb-2" />
              <p>No shifts found for selected criteria</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Opening Cash</TableHead>
                    <TableHead className="text-right">Closing Cash</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Cash Diff</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredShifts().map((shift) => {
                    const stats = getShiftStats(shift);
                    return (
                      <TableRow key={shift.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{shift.cashier?.name || shift.cashier?.username}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(shift.startTime)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatTime(shift.startTime)}</div>
                            {shift.endTime && <div className="text-slate-400">{formatTime(shift.endTime)}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={shift.isClosed ? 'outline' : 'default'}>
                            {shift.isClosed ? 'Closed' : 'Open'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(shift.openingCash, currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {shift.closingCash !== undefined ? (
                            formatCurrency(shift.closingCash, currency)
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <ShoppingCart className="h-3 w-3 text-slate-400" />
                            <span className="font-medium">{shift.orderCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            <span className="font-medium">
                              {formatCurrency(stats.revenueDuringShift, currency)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`flex items-center justify-end gap-1 ${stats.isDiscrepancy ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                            <TrendingUp className="h-3 w-3" />
                            <span className="font-medium">
                              {formatCurrency(stats.cashDifference, currency)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {!shift.isClosed && (
                            <Dialog open={closeDialogOpen && selectedShift?.id === shift.id} onOpenChange={(open) => {
                              setCloseDialogOpen(open);
                              if (open) setSelectedShift(shift);
                            }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedShift(shift)}>
                                  <Square className="h-3 w-3 mr-1" />
                                  Close
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Close Shift - {shift.cashier?.name || shift.cashier?.username}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                    <div>
                                      <div className="text-sm text-slate-600 dark:text-slate-400">Opening Cash</div>
                                      <div className="text-lg font-bold">{formatCurrency(shift.openingCash, currency)}</div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-slate-600 dark:text-slate-400">Revenue</div>
                                      <div className="text-lg font-bold text-green-600">
                                        {formatCurrency(stats.revenueDuringShift, currency)}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-slate-600 dark:text-slate-400">Orders</div>
                                      <div className="text-lg font-bold">{shift.orderCount}</div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-slate-600 dark:text-slate-400">Expected Cash</div>
                                      <div className="text-lg font-bold">
                                        {formatCurrency(shift.openingCash + stats.revenueDuringShift, currency)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="closingCash">Closing Cash ({currency})</Label>
                                    <Input
                                      id="closingCash"
                                      type="number"
                                      step="0.01"
                                      value={closingCash}
                                      onChange={(e) => setClosingCash(e.target.value)}
                                      placeholder="Enter closing cash amount..."
                                      autoFocus
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="closeNotes">Notes (Optional)</Label>
                                    <Textarea
                                      id="closeNotes"
                                      value={shiftNotes}
                                      onChange={(e) => setShiftNotes(e.target.value)}
                                      placeholder="Any notes about this shift..."
                                      rows={3}
                                    />
                                  </div>
                                  {shiftNotes && (
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                      <Label className="text-sm font-medium">Opening Notes:</Label>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">{shift.notes}</p>
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {
                                    setCloseDialogOpen(false);
                                    setSelectedShift(null);
                                    setClosingCash('');
                                    setShiftNotes('');
                                  }}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleCloseShift} disabled={!closingCash}>
                                    <Square className="h-4 w-4 mr-2" />
                                    Close Shift
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

