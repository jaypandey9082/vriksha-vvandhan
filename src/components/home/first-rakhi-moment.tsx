import { CampaignImage } from "@/components/shared/campaign-image";
import { firstRakhiMoment } from "@/content/campaign";

export function FirstRakhiMoment() {
  return (
    <section className="first-moment section" aria-labelledby="first-moment-title">
      <div className="shell first-moment__inner">
        <div className="first-moment__copy">
          <p>{firstRakhiMoment.eyebrow}</p>
          <h2 id="first-moment-title">{firstRakhiMoment.title}</h2>
          <span className="first-moment__rule" aria-hidden="true" />
          <p>{firstRakhiMoment.description}</p>
        </div>
        <CampaignImage
          image={firstRakhiMoment.image}
          sizes="(max-width: 767px) 92vw, 58vw"
          className="first-moment__image"
        />
      </div>
    </section>
  );
}
