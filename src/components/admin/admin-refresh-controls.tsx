"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminRefreshControls({ refreshedAt }: { refreshedAt: string }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 25_000);
    return () => window.clearInterval(interval);
  }, [router]);
  return <div className="admin-refresh">
    <small>Last refreshed {new Date(refreshedAt).toLocaleTimeString("en-IN")}</small>
    <button className="button button--light" type="button" disabled={refreshing} onClick={() => { setRefreshing(true); router.refresh(); window.setTimeout(() => setRefreshing(false), 750); }}>{refreshing ? "Refreshing…" : "Refresh"}</button>
  </div>;
}
