import { ArrowDown } from "lucide-react";

import { CampaignImage } from "@/components/shared/campaign-image";
import { SectionHeading } from "@/components/shared/section-heading";
import { participationSteps } from "@/content/campaign";

const guardianPreviewImage = {
  src: "/campaign/guardian-preview.webp",
  width: 621,
  height: 700,
  alt: "A phone showing the Guardian of Tree No. 417 certificate concept beside a Rakhi-wrapped tree",
  objectPosition: "50% 48%",
};

export function ParticipationSteps() {
  return (
    <section className="participation section" id="how-it-works" aria-labelledby="participation-title">
      <div className="shell">
        <SectionHeading
          eyebrow="Make the promise"
          title="Four steps. One bond that continues."
          titleId="participation-title"
          description="The campaign journey begins at a tree and returns online, where each promise will eventually receive its own identity."
          align="center"
        />
        <div className="participation__layout">
          <ol className="participation__steps">
            {participationSteps.map((step, index) => (
              <li key={step.number}>
                <span className="participation__number">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  {step.availability ? <small>{step.availability}</small> : null}
                </div>
                {index < participationSteps.length - 1 ? (
                  <ArrowDown className="participation__arrow" aria-hidden="true" size={18} />
                ) : null}
              </li>
            ))}
          </ol>
          <aside className="certificate-preview" aria-label="Guardian certificate campaign concept">
            <CampaignImage
              image={guardianPreviewImage}
              sizes="(max-width: 767px) 88vw, 42vw"
              className="certificate-preview__image"
            />
            <div className="certificate-preview__label">
              <p>Certificate concept</p>
              <strong>Guardian of Tree No. 417</strong>
              <span>A campaign acknowledgement of care—not proof of legal ownership.</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
