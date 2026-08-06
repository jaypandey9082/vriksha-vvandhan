"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="admin-panel admin-error" role="alert"><p>Campaign Desk could not load this view.</p><h1>Please try again.</h1><p>No moderation action was performed.</p><button className="button button--light" type="button" onClick={reset}>Retry</button></section>;
}
