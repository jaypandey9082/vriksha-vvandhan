import { ArrowDownRight } from "lucide-react";

import { HeroBrandMasthead } from "@/components/home/hero-brand-masthead";
import { HeroMedia } from "@/components/home/hero-media";
import { PromiseRibbon } from "@/components/home/promise-ribbon";
import { PromiseTracker } from "@/components/shared/promise-tracker";
import { heroContent, heroPromiseImages, promiseMetric } from "@/content/campaign";

export function CampaignHero() {
  return (
    <section className="campaign-hero" id="movement" aria-labelledby="campaign-title">
      <div className="campaign-hero__grain" aria-hidden="true" />
      <div className="shell campaign-hero__inner">
        <HeroBrandMasthead />
        <div className="campaign-hero__stage">
          <div className="campaign-hero__copy">
            <p className="campaign-hero__eyebrow">{heroContent.eyebrow}</p>
            <h1 id="campaign-title">{heroContent.title}</h1>
            <p className="campaign-hero__description">{heroContent.description}</p>
            <div className="campaign-hero__tracker">
              <p>Promise tracker</p>
              <PromiseTracker metric={promiseMetric} />
            </div>
            <div className="campaign-hero__actions">
              <a className="button button--primary" href={heroContent.primaryCta.href}>
                {heroContent.primaryCta.label}
                <ArrowDownRight aria-hidden="true" size={18} />
              </a>
              <a className="text-link text-link--light" href={heroContent.secondaryCta.href}>
                {heroContent.secondaryCta.label}
              </a>
            </div>
          </div>
          <HeroMedia />
          <svg
            className="campaign-hero__thread"
            viewBox="0 0 1000 520"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className="campaign-hero__thread-shadow" d="M355 430 C510 455 520 260 680 286" />
            <path className="campaign-hero__thread-gold" d="M355 430 C510 455 520 260 680 286" />
            <path className="campaign-hero__thread-red" d="M365 438 C520 462 530 268 690 294" />
            <circle cx="686" cy="290" r="8" />
          </svg>
        </div>
        <PromiseRibbon heading={heroContent.ribbonLabel} images={heroPromiseImages} />
      </div>
    </section>
  );
}
