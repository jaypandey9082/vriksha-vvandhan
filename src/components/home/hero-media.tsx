import { CampaignImage } from "@/components/shared/campaign-image";
import { heroImage } from "@/content/campaign";

export function HeroMedia() {
  return (
    <div className="hero-media">
      <CampaignImage
        image={heroImage}
        sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 959px) min(560px, calc(100vw - 48px)), (max-width: 1279px) 37vw, 475px"
        className="hero-media__frame"
        preload
      />
    </div>
  );
}
