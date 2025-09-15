'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, Check, Clock, RefreshCw, User, X } from 'lucide-react';
import { format } from 'date-fns';

interface PendingImport {
  id: string;
  apartment_id: string;
  platform?: 'airbnb' | 'vrbo' | 'direct';
  guest_name?: string;
  check_in: string;
  check_out: string;
  status_text: string;
  phone_last_four?: string;
  stage_status: string;
  created_at: string;
  last_seen_at: string;
  apartments?: {
    id: string;
    name: string;
  };
}

interface SyncStatus {
  lastSync: any;
  pendingCount: number;
  alerts: any[];
}

export function PendingAirbnbImports() {
  const [pendingImports, setPendingImports] = useState<PendingImport[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Form states for each import
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Fetch pending imports and sync status
  const fetchData = async () => {
    try {
      // Get sync status
      const statusRes = await fetch('/api/sync/airbnb');
      if (statusRes.ok) {
        const status = await statusRes.json();
        setSyncStatus(status);
      }

      // Get pending staging reservations
      const importsRes = await fetch('/api/staging/reservations');
      if (importsRes.ok) {
        const { pendingImports: imports } = await importsRes.json();
        setPendingImports(imports || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle confirm action
  const handleConfirm = async (importId: string) => {
    setProcessingId(importId);
    const data = formData[importId] || {};
    const import_ = pendingImports.find(p => p.id === importId);
    
    // Debug log to see what we're sending
    const guestName = data.guestName || import_?.guest_name || 'Guest';
    console.log('Sending guest name:', guestName, 'from form data:', data.guestName, 'or import:', import_?.guest_name);
    
    try {
      const response = await fetch('/api/staging/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: importId,
          action: 'confirm',
          guestName: guestName,
          guestCount: parseInt(data.guestCount) || 2,
          totalPrice: parseFloat(data.totalPrice) || 0,
          cleaningFee: parseFloat(data.cleaningFee) || 0,
          notes: data.notes || ''
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Remove from pending list
        setPendingImports(prev => prev.filter(p => p.id !== importId));
        // Clear form data
        setFormData(prev => {
          const newData = { ...prev };
          delete newData[importId];
          return newData;
        });
        setExpandedCard(null);
        // Show success (you can add toast here)
        alert('Reservation confirmed successfully!');
      } else {
        alert(`Failed to confirm: ${result.error}`);
      }
    } catch (error) {
      console.error('Error confirming import:', error);
      alert('Failed to confirm reservation');
    } finally {
      setProcessingId(null);
    }
  };
  
  // Handle reject action
  const handleReject = async (importId: string) => {
    if (!confirm('Are you sure you want to reject this import?')) return;
    
    setProcessingId(importId);
    
    try {
      const response = await fetch('/api/staging/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: importId,
          action: 'reject'
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Remove from pending list
        setPendingImports(prev => prev.filter(p => p.id !== importId));
        alert('Import rejected');
      } else {
        alert(`Failed to reject: ${result.error}`);
      }
    } catch (error) {
      console.error('Error rejecting import:', error);
      alert('Failed to reject import');
    } finally {
      setProcessingId(null);
    }
  };
  
  // Update form field
  const updateFormField = (importId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [importId]: {
        ...prev[importId],
        [field]: value
      }
    }));
  };

  // Manual sync trigger
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync/airbnb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('Sync result:', result);
        // Refresh data
        await fetchData();
        
        // Show success message (you can add a toast here)
        if (result.newReservations > 0) {
          alert(`Sync completed! ${result.newReservations} new reservations found.`);
        } else if (!result.hasChanges) {
          alert('Sync completed! No changes detected.');
        } else {
          alert(`Sync completed! ${result.message}`);
        }
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // If no pending imports and not loading, don't show anything
  if (!loading && pendingImports.length === 0 && syncStatus?.pendingCount === 0) {
    return (
      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">
              All platform reservations are up to date
            </span>
            {syncStatus?.lastSync && (
              <span className="text-xs text-muted-foreground">
                • Last sync: {format(new Date(syncStatus.lastSync.sync_timestamp), 'MMM d, h:mm a')}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Show pending imports section
  return (
    <div className="mb-8">
      {/* Header */}
      <Card className="mb-4 border-yellow-500/50 bg-yellow-50/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">
                  Pending Platform Imports ({pendingImports.length} new)
                </h3>
              </div>
              {syncStatus?.lastSync && (
                <span className="text-sm text-muted-foreground">
                  Last sync: {format(new Date(syncStatus.lastSync.sync_timestamp), 'MMM d, h:mm a')} 
                  • Next: {format(new Date(new Date().setHours(21, 0, 0, 0)), 'h:mm a')}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Pending Import Cards */}
      {pendingImports.map((import_) => (
        <Card 
          key={import_.id} 
          className="mb-3 border-yellow-500/30"
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">PENDING IMPORT</span>
                    {/* Platform Badge */}
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      import_.platform === 'vrbo' 
                        ? 'bg-blue-100 text-blue-700' 
                        : import_.platform === 'airbnb'
                        ? 'bg-pink-100 text-pink-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {(import_.platform || 'airbnb').toUpperCase()}
                    </span>
                    {/* Conflict Badge */}
                    {(import_ as any).has_conflict && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        ⚠️ CONFLICT
                      </span>
                    )}
                    {import_.apartments && (
                      <span className="text-xs text-muted-foreground">• {import_.apartments.name}</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(import_.check_in + 'T12:00:00'), 'MMM d')} - {format(new Date(import_.check_out + 'T12:00:00'), 'MMM d')}
                    </span>
                  </div>
                  
                  {(import_.guest_name || import_.phone_last_four) && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {import_.guest_name && `${import_.guest_name}`}
                        {import_.guest_name && import_.phone_last_four && ' • '}
                        {import_.phone_last_four && `Phone: ****${import_.phone_last_four}`}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-orange-600">
                    ⚠️ Missing: {[
                      !import_.guest_name && "Guest name",
                      "Price"
                    ].filter(Boolean).join(", ")}
                  </div>
                </div>

                {expandedCard === import_.id && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {/* Show conflict details if any */}
                    {(import_ as any).has_conflict && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm font-medium text-red-800 mb-1">
                          ⚠️ Conflict detected with existing reservation(s):
                        </p>
                        {(import_ as any).conflicting_reservations?.map((conflict: any) => (
                          <p key={conflict.id} className="text-xs text-red-700">
                            • {format(new Date(conflict.check_in + 'T12:00:00'), 'MMM d')} - 
                            {format(new Date(conflict.check_out + 'T12:00:00'), 'MMM d')}
                            {conflict.guests?.name && ` (${conflict.guests.name})`}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Guest Name</label>
                        <input
                          type="text"
                          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                          placeholder={import_.guest_name || "Enter guest name"}
                          value={formData[import_.id]?.guestName || import_.guest_name || ''}
                          onChange={(e) => updateFormField(import_.id, 'guestName', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Guest Count</label>
                        <input
                          type="number"
                          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                          placeholder="2"
                          min="1"
                          value={formData[import_.id]?.guestCount || ''}
                          onChange={(e) => updateFormField(import_.id, 'guestCount', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Total Price (€)</label>
                        <input
                          type="number"
                          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                          placeholder="0.00"
                          step="0.01"
                          value={formData[import_.id]?.totalPrice || ''}
                          onChange={(e) => updateFormField(import_.id, 'totalPrice', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Cleaning Fee (€)</label>
                        <input
                          type="number"
                          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                          placeholder="0.00"
                          step="0.01"
                          value={formData[import_.id]?.cleaningFee || ''}
                          onChange={(e) => updateFormField(import_.id, 'cleaningFee', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <textarea
                        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="Optional notes..."
                        rows={2}
                        value={formData[import_.id]?.notes || ''}
                        onChange={(e) => updateFormField(import_.id, 'notes', e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handleConfirm(import_.id)}
                        disabled={processingId === import_.id}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {processingId === import_.id ? 'Processing...' : 'Save & Confirm'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setExpandedCard(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(
                          import_.platform === 'vrbo' 
                            ? `https://www.vrbo.com/rm/reservations`
                            : `https://www.airbnb.com/hosting/reservations`, 
                          '_blank'
                        )}
                      >
                        View on {import_.platform === 'vrbo' ? 'VRBO' : 'Airbnb'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {expandedCard !== import_.id && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setExpandedCard(import_.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Accept & Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(import_.id)}
                      disabled={processingId === import_.id}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Loading state */}
      {loading && (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Checking for pending imports...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}