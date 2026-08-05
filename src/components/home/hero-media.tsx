import { CampaignImage } from "@/components/shared/campaign-image";
import { heroImage } from "@/content/campaign";

export function HeroMedia() {
  return (
    <div className="hero-media">
      <CampaignImage
        image={heroImage}
        sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 959px) calc(100vw - 48px), (max-width: 1279px) 46vw, 570px"
        className="hero-media__frame"
        preload
      />
      <span className="hero-media__caption">A promise of protection, returned.</span>
    </div>
  );
}
