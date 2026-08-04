import { Radio } from "lucide-react";

import { CampaignImage } from "@/components/shared/campaign-image";
import { pedKaPaigaam, pedKaPaigaamImage } from "@/content/campaign";

export function PedKaPaigaam() {
  return (
    <section className="ped-paigaam section" id="ped-ka-paigaam" aria-labelledby="paigaam-title">
      <div className="shell ped-paigaam__inner">
        <CampaignImage
          image={pedKaPaigaamImage}
          sizes="(max-width: 767px) 92vw, 42vw"
          className="ped-paigaam__image"
        />
        <div className="ped-paigaam__copy">
          <p className="ped-paigaam__eyebrow">
            <Radio aria-hidden="true" size={18} />
            On air, coming soon
          </p>
          <h2 id="paigaam-title">{pedKaPaigaam.title}</h2>
          <blockquote lang="hi-Latn">“{pedKaPaigaam.quote}”</blockquote>
          <p>{pedKaPaigaam.status}</p>
          <span className="ped-paigaam__availability">The first Ped Ka Paigaam stories will be heard as the movement goes on air.</span>
        </div>
      </div>
    </section>
  );
}
