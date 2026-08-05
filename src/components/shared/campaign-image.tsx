import Image from "next/image";

import type { CampaignImage as CampaignImageData } from "@/types/campaign";
import { cn } from "@/lib/utils";

type CampaignImageProps = {
  image: CampaignImageData;
  sizes: string;
  className?: string;
  imageClassName?: string;
  preload?: boolean;
};

export function CampaignImage({
  image,
  sizes,
  className,
  imageClassName,
  preload = false,
}: CampaignImageProps) {
  return (
    <div className={cn("campaign-image", className)}>
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        preload={preload}
        className={cn("campaign-image__media", imageClassName)}
        style={{ objectPosition: image.objectPosition }}
      />
    </div>
  );
}
