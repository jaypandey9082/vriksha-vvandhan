import { ArrowRight, CirclePlay, Leaf } from "lucide-react";

import type { CampaignLink } from "@/types/campaign";

type HeroActionsProps = {
  primary: CampaignLink;
  secondary: CampaignLink;
};

export function HeroActions({ primary, secondary }: HeroActionsProps) {
  return (
    <div className="campaign-hero__actions">
      <a className="button button--primary campaign-hero__primary-action" href={primary.href}>
        <Leaf aria-hidden="true" size={17} strokeWidth={1.7} />
        <span>{primary.label}</span>
        <ArrowRight aria-hidden="true" className="campaign-hero__action-arrow" size={17} />
      </a>
      <a className="button button--secondary campaign-hero__secondary-action" href={secondary.href}>
        <CirclePlay aria-hidden="true" size={19} strokeWidth={1.6} />
        <span>{secondary.label}</span>
      </a>
    </div>
  );
}
