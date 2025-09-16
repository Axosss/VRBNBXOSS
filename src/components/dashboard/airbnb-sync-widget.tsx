'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface SyncStatus {
  lastSync: any;
  pendingCount: number;
  alerts: any[];
}

export function AirbnbSyncWidget() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync/airbnb');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSyncStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync/airbnb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (response.ok) {
        await fetchSyncStatus();
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPending = syncStatus && syncStatus.pendingCount > 0;
  const lastSyncTime = syncStatus?.lastSync 
    ? format(new Date(syncStatus.lastSync.sync_timestamp), 'MMM d, h:mm a')
    : 'Never';

  return (
    <Card className={hasPending ? 'border-yellow-500/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">To be synced</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Status */}
        <div className="flex items-center gap-2">
          {hasPending ? (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-600">
                {syncStatus.pendingCount} pending import{syncStatus.pendingCount !== 1 ? 's' : ''}
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">All synced</span>
            </>
          )}
        </div>

        {/* Last Sync Time */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Last sync: {lastSyncTime}
          </span>
        </div>

        {/* Action Button */}
        {hasPending && (
          <Link href="/dashboard/reservations" className="block">
            <Button variant="outline" size="sm" className="w-full">
              Review Pending Imports
            </Button>
          </Link>
        )}

        {/* Recent Alerts */}
        {syncStatus?.alerts && syncStatus.alerts.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">Recent Alerts:</p>
            {syncStatus.alerts.slice(0, 2).map((alert, index) => (
              <div key={index} className="text-xs space-y-1">
                <div className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <span className="font-medium">{alert.title}</span>
                </div>
                <p className="text-muted-foreground ml-3">{alert.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}