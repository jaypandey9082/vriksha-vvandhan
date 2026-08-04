import { CampaignChannels } from "@/components/home/campaign-channels";
import { CampaignHero } from "@/components/home/campaign-hero";
import { CampaignStory } from "@/components/home/campaign-story";
import { FinalCta } from "@/components/home/final-cta";
import { FirstRakhiMoment } from "@/components/home/first-rakhi-moment";
import { MovementPillars } from "@/components/home/movement-pillars";
import { MovementPreview } from "@/components/home/movement-preview";
import { ParticipationSteps } from "@/components/home/participation-steps";
import { PedKaPaigaam } from "@/components/home/ped-ka-paigaam";
import { MobileJoinBar } from "@/components/layout/mobile-join-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content">
        <CampaignHero />
        <CampaignStory />
        <MovementPillars />
        <ParticipationSteps />
        <FirstRakhiMoment />
        <CampaignChannels />
        <MovementPreview />
        <PedKaPaigaam />
        <FinalCta />
      </main>
      <SiteFooter />
      <MobileJoinBar />
    </>
  );
}
