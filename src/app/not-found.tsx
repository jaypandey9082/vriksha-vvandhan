import Link from "next/link";

import { LogoLockup } from "@/components/shared/logo-lockup";

export default function NotFound() {
  return (
    <main className="not-found">
      <LogoLockup />
      <p>404</p>
      <h1>This path has not grown yet.</h1>
      <p>The Section 1 campaign experience lives on the homepage.</p>
      <Link className="button button--primary" href="/">
        Return home
      </Link>
    </main>
  );
}
