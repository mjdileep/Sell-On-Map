"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook to track user activity and periodically update lastActive timestamp
 * Updates every 5 minutes when user is active and authenticated
 */
export function useUserActivity() {
  const { data: session } = useSession();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const updateActivity = useCallback(async () => {
    if (!(session?.user as any)?.id) return;

    // Prevent too frequent updates (minimum 1 minute between updates)
    const now = Date.now();
    if (now - lastUpdateRef.current < 60000) return;

    try {
      await fetch('/api/me/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      lastUpdateRef.current = now;
    } catch (error) {
      console.error('Failed to update user activity:', error);
    }
  }, [(session?.user as any)?.id]);

  useEffect(() => {
    if (!(session?.user as any)?.id) {
      // Clear interval if user logs out
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Update activity immediately when user becomes authenticated
    updateActivity();

    // Set up periodic updates every 5 minutes
    intervalRef.current = setInterval(updateActivity, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [(session?.user as any)?.id, updateActivity]);

  // Also update activity on user interactions (throttled)
  useEffect(() => {
    if (!(session?.user as any)?.id) return;

    let throttleTimer: NodeJS.Timeout | null = null;

    const handleUserActivity = () => {
      if (throttleTimer) return;

      throttleTimer = setTimeout(() => {
        updateActivity();
        throttleTimer = null;
      }, 10000); // Throttle to once every 10 seconds max
    };

    // Listen for user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [(session?.user as any)?.id, updateActivity]);
}
