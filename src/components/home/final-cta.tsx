import { ArrowUpRight } from "lucide-react";

import { finalCta } from "@/content/campaign";

export function FinalCta() {
  return (
    <section className="final-cta section" aria-labelledby="final-cta-title">
      <div className="shell final-cta__inner">
        <p>Vriksha Vvandhan</p>
        <h2 id="final-cta-title">
          <span>{finalCta.lineOne}</span>
          <span>{finalCta.lineTwo}</span>
          <em>{finalCta.lineThree}</em>
        </h2>
        <a className="button button--primary" href={finalCta.cta.href}>
          {finalCta.cta.label}
          <ArrowUpRight aria-hidden="true" size={18} />
        </a>
      </div>
    </section>
  );
}
