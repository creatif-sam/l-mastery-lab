"use client";

import { useEffect } from "react";

/**
 * Component to track when user visits the community page
 * Stores timestamp in localStorage to hide the badge after viewing
 */
export function CommunityVisitTracker() {
  useEffect(() => {
    // Mark the current time as the last visit to community page
    localStorage.setItem("community_last_visit", new Date().toISOString());
  }, []);

  return null;
}
