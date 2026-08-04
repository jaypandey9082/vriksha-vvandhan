import { CampaignImage } from "@/components/shared/campaign-image";
import { SectionHeading } from "@/components/shared/section-heading";
import { storyContent } from "@/content/campaign";

export function CampaignStory() {
  return (
    <section className="campaign-story section" id="story" aria-labelledby="story-title">
      <div className="shell campaign-story__inner">
        <CampaignImage
          image={storyContent.image}
          sizes="(max-width: 767px) 92vw, 48vw"
          className="campaign-story__image"
        />
        <div className="campaign-story__copy">
          <SectionHeading eyebrow={storyContent.eyebrow} title={storyContent.title} titleId="story-title" />
          <div className="campaign-story__body">
            {storyContent.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <p className="campaign-story__signature">This Raksha Bandhan, protect the protector.</p>
        </div>
      </div>
    </section>
  );
}
