'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import BetTracker from '@/components/BetTracker';
import { BetTrackerProvider } from '@/stores/betTrackerStore';
import DashboardLayout from '@/components/DashboardLayout';

export default function BetTrackerPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Bet Tracker</h1>
        <p className="page-description">
          Track your betting performance and get AI feedback
        </p>
      </div>

      <BetTrackerProvider>
        <BetTracker />
      </BetTrackerProvider>
    </DashboardLayout>
  );
}