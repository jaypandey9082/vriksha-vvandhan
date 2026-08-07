import { CampaignChannels } from "@/components/home/campaign-channels";
import { CampaignHero } from "@/components/home/campaign-hero";
import { CampaignStory } from "@/components/home/campaign-story";
import { FinalCta } from "@/components/home/final-cta";
import { FirstRakhiMoment } from "@/components/home/first-rakhi-moment";
import { MovementPillars } from "@/components/home/movement-pillars";
import { MovementPreview } from "@/components/home/movement-preview";
import { ParticipationSteps } from "@/components/home/participation-steps";
import { PedKaPaigaam } from "@/components/home/ped-ka-paigaam";
import { SiteFooter } from "@/components/layout/site-footer";
import { promiseMetric } from "@/content/campaign";
import { getPublicCampaignSummary, getPublicMovementEntries } from "@/lib/public-campaign/data";

export default async function Home() {
  const [summary, approvedEntries] = await Promise.all([
    getPublicCampaignSummary(),
    getPublicMovementEntries({ limit: 8 }).catch(() => []),
  ]);
  const metric = summary
    ? { current: summary.current_count, target: summary.target_count, label: summary.metric_label }
    : promiseMetric;
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <main id="main-content">
        <CampaignHero metric={metric} />
        <CampaignStory />
        <MovementPillars />
        <ParticipationSteps />
        <FirstRakhiMoment />
        <CampaignChannels />
        <MovementPreview entries={approvedEntries.length >= 6 ? approvedEntries : []} />
        <PedKaPaigaam />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
