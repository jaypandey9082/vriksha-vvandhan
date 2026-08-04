import Image from "next/image";

import type { CampaignImage as CampaignImageData } from "@/types/campaign";
import { cn } from "@/lib/utils";

type CampaignImageProps = {
  image: CampaignImageData;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function CampaignImage({
  image,
  sizes,
  className,
  imageClassName,
  priority = false,
}: CampaignImageProps) {
  return (
    <div className={cn("campaign-image", className)}>
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        priority={priority}
        className={cn("campaign-image__media", imageClassName)}
        style={{ objectPosition: image.objectPosition }}
      />
    </div>
  );
}
