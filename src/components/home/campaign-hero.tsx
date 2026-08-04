import Image from "next/image";
import { ArrowDownRight } from "lucide-react";

import { CampaignImage } from "@/components/shared/campaign-image";
import { PromiseTracker } from "@/components/shared/promise-tracker";
import { heroContent, heroImage, promiseHaloImages, promiseMetric } from "@/content/campaign";

export function CampaignHero() {
  return (
    <section className="campaign-hero" id="movement" aria-labelledby="campaign-title">
      <div className="campaign-hero__grain" aria-hidden="true" />
      <div className="shell campaign-hero__inner">
        <div className="campaign-hero__copy">
          <p className="campaign-hero__eyebrow">{heroContent.eyebrow}</p>
          <h1 id="campaign-title">
            <span>{heroContent.title}</span>
            <em>{heroContent.secondLine}</em>
          </h1>
          <p className="campaign-hero__description">{heroContent.description}</p>
          <div className="campaign-hero__actions">
            <a className="button button--light" href={heroContent.primaryCta.href}>
              {heroContent.primaryCta.label}
              <ArrowDownRight aria-hidden="true" size={18} />
            </a>
            <a className="text-link text-link--light" href={heroContent.secondaryCta.href}>
              {heroContent.secondaryCta.label}
            </a>
          </div>
        </div>

        <div className="campaign-hero__visual">
          <CampaignImage
            image={heroImage}
            sizes="(max-width: 767px) 92vw, (max-width: 1100px) 48vw, 520px"
            className="campaign-hero__image"
            priority
          />
          <div className="promise-halo" aria-hidden="true">
            {promiseHaloImages.map((image, index) => (
              <span className={`promise-halo__photo promise-halo__photo--${index + 1}`} key={image.src}>
                <Image
                  src={image.src}
                  alt=""
                  width={image.width}
                  height={image.height}
                  sizes="88px"
                />
              </span>
            ))}
          </div>
          <div className="campaign-hero__tracker">
            <p>Promise tracker</p>
            <PromiseTracker metric={promiseMetric} />
          </div>
        </div>
      </div>
      <a className="campaign-hero__scroll" href="#story" aria-label="Continue to the campaign story">
        <span>Discover the promise</span>
        <ArrowDownRight aria-hidden="true" size={18} />
      </a>
    </section>
  );
}
