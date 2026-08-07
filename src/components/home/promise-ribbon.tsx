import { PromiseReel } from "@/components/home/promise-reel";

import type { PromiseReelImage } from "@/types/campaign";

type PromiseRibbonProps = {
  heading: string;
  images: readonly PromiseReelImage[];
};

export function PromiseRibbon({ heading, images }: PromiseRibbonProps) {
  return (
    <section className="promise-ribbon" aria-labelledby="promise-ribbon-title">
      <div className="promise-ribbon__heading">
        <span aria-hidden="true" />
        <h2 id="promise-ribbon-title">{heading}</h2>
        <i aria-hidden="true" />
      </div>
      <PromiseReel images={images} />
    </section>
  );
}
