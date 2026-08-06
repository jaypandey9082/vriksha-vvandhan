import Image from "next/image";
import Link from "next/link";

import { SectionHeading } from "@/components/shared/section-heading";
import { seedMovementStories } from "@/content/campaign";
import type { PublicMovementEntry } from "@/lib/public-campaign/data";

export function MovementPreview({ entries = [] }: { entries?: PublicMovementEntry[] }) {
  const hasApprovedEntries = entries.length >= 6;
  return (
    <section className="movement-preview section" id="stories" aria-labelledby="stories-title">
      <div className="shell">
        <SectionHeading
          eyebrow="Movement wall preview"
          title="Every promise carries a story."
          titleId="stories-title"
          description={hasApprovedEntries ? "The latest approved Vriksha Guardian promises, published with participant consent." : "Campaign inspiration from Mirchi’s visual story. Approved participant promises live separately on the public Movement Wall."}
        />
        <div className="movement-preview__grid">
          {hasApprovedEntries ? entries.map((entry, index) => (
            <article className={`movement-story movement-story--${index === 0 || index === 5 ? "large" : "small"}`} key={entry.guardian_number}>
              <div className="movement-story__image"><Image src={entry.card_url} alt={entry.alt_text} width={entry.card_width} height={entry.card_height} sizes="(max-width: 639px) 92vw, (max-width: 1023px) 44vw, 31vw" unoptimized /></div>
              <div className="movement-story__copy"><div><span>Guardian #{entry.guardian_number}</span><p>{entry.display_name}</p></div><p>{new Date(entry.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p></div>
            </article>
          )) : seedMovementStories.map((story) => (
            <article className={`movement-story movement-story--${story.size}`} key={story.id}>
              <div className="movement-story__image">
                <Image
                  src={story.image.src}
                  alt={story.image.alt}
                  width={story.image.width}
                  height={story.image.height}
                  sizes="(max-width: 639px) 92vw, (max-width: 1023px) 44vw, 31vw"
                />
              </div>
              <div className="movement-story__copy">
                <div>
                  <span>{story.category}</span>
                  <p>{story.label}</p>
                </div>
                <p>{story.line}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="movement-preview__note">{hasApprovedEntries ? <>These are approved participant submissions. <Link href="/movement">Explore the full Movement Wall</Link>.</> : <>These are curated campaign images, not participant submissions. <Link href="/movement">Visit the live Movement Wall</Link>.</>}</p>
      </div>
    </section>
  );
}
