import Image from "next/image";

import type { CampaignImage } from "@/types/campaign";

type PromiseRibbonProps = {
  heading: string;
  images: readonly CampaignImage[];
};

export function PromiseRibbon({ heading, images }: PromiseRibbonProps) {
  return (
    <section className="promise-ribbon" aria-labelledby="promise-ribbon-title">
      <div className="promise-ribbon__heading">
        <span aria-hidden="true" />
        <h2 id="promise-ribbon-title">{heading}</h2>
      </div>
      <div
        className="promise-ribbon__viewport"
        aria-label="Scrollable campaign promise photographs"
        role="group"
        tabIndex={0}
      >
        <div className="promise-ribbon__track">
          {images.map((image) => (
            <figure className="promise-ribbon__card" key={image.src}>
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes="(max-width: 959px) 145px, 210px"
                loading="lazy"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
