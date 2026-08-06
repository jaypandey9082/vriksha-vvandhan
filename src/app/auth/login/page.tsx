import type { Metadata } from "next";
import Link from "next/link";

import { loginAction } from "@/app/auth/actions";
import { LogoLockup } from "@/components/shared/logo-lockup";
import { getOptionalStaffSession } from "@/lib/auth/dal";
import { safeInternalDestination } from "@/lib/auth/redirects";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Staff sign in | Vriksha Vvandhan", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const query = await searchParams;
  const session = await getOptionalStaffSession();
  if (session) redirect(safeInternalDestination(query.next));
  const next = safeInternalDestination(query.next);
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="staff-sign-in-title">
        <Link href="/" aria-label="Vriksha Vvandhan home"><LogoLockup variant="compact" /></Link>
        <p className="auth-card__eyebrow">Invite-only campaign operations</p>
        <h1 id="staff-sign-in-title">Staff sign in</h1>
        <p>Use the company-managed account assigned to the Campaign Desk.</p>
        {query.error && <div className="auth-error" role="alert">Unable to sign in with those credentials.</div>}
        <form action={loginAction}>
          <input type="hidden" name="next" value={next} />
          <label>Email address<input name="email" type="email" autoComplete="username" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
          <button className="button button--primary" type="submit">Sign in securely</button>
        </form>
        <small>There is no public staff registration. Access is managed by Mirchi.</small>
      </section>
    </main>
  );
}
