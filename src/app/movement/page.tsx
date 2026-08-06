import type { Metadata } from "next";

import { MovementWall } from "@/components/movement/movement-wall";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getPublicCampaignSummary, getPublicMovementEntries } from "@/lib/public-campaign/data";

export const metadata: Metadata = {
  title: "Movement Wall | Vriksha Vvandhan",
  description: "Meet the approved Vriksha Guardians whose promises are taking root.",
  alternates: { canonical: "/movement" },
};

export default async function MovementPage() {
  const [summary, entries] = await Promise.all([
    getPublicCampaignSummary(),
    getPublicMovementEntries({ limit: 24 }).catch(() => []),
  ]);
  return (
    <>
      <a className="skip-link" href="#movement-wall">Skip to movement wall</a>
      <SiteHeader />
      <main className="movement-page" id="movement-wall">
        <header className="shell movement-page__header">
          <p>Promises taking root</p>
          <h1>The Vriksha Vvandhan Movement Wall</h1>
          <div className="movement-page__count" aria-label={summary ? `${summary.current_count} of ${summary.target_count} ${summary.metric_label}` : "Campaign tracker updating"}>
            <strong>{summary?.current_count ?? "—"}</strong><span>/ {summary?.target_count ?? 983}</span>
            <small>{summary?.metric_label ?? "Tracker updating"}</small>
          </div>
        </header>
        <section className="shell" aria-label="Approved Vriksha Guardian promises">
          <MovementWall initialEntries={entries} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
