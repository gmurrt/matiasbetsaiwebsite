'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AiPicksGenerator from '@/components/AiPicksGenerator';
import DashboardLayout from '@/components/DashboardLayout';

export default function Picks() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">AI Picks Generator</h1>
        <p className="page-description">
          Get AI-powered betting recommendations with confidence scores
        </p>
      </div>

      <AiPicksGenerator />
    </DashboardLayout>
  );
}