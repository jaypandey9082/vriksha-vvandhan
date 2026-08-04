import { Check } from "lucide-react";

import { CampaignImage } from "@/components/shared/campaign-image";
import { campaignChannels, channelImage } from "@/content/campaign";

export function CampaignChannels() {
  return (
    <section className="campaign-channels section" aria-labelledby="channels-title">
      <div className="shell">
        <div className="campaign-channels__intro">
          <p>Across every frequency</p>
          <h2 id="channels-title">From a personal gesture to a visible movement.</h2>
        </div>
        <CampaignImage
          image={channelImage}
          sizes="(max-width: 767px) 92vw, 1200px"
          className="campaign-channels__image"
        />
        <div className="campaign-channels__grid">
          {campaignChannels.map((channel) => (
            <article key={channel.key} className={`campaign-channel campaign-channel--${channel.key}`}>
              <p className="campaign-channel__eyebrow">{channel.eyebrow}</p>
              <h3>{channel.title}</h3>
              <p>{channel.intro}</p>
              <ul>
                {channel.items.map((item) => (
                  <li key={item}>
                    <Check aria-hidden="true" size={17} />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
