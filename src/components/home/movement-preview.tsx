import Image from "next/image";

import { SectionHeading } from "@/components/shared/section-heading";
import { seedMovementStories } from "@/content/campaign";

export function MovementPreview() {
  return (
    <section className="movement-preview section" id="stories" aria-labelledby="stories-title">
      <div className="shell">
        <SectionHeading
          eyebrow="Movement wall preview"
          title="Every promise carries a story."
          titleId="stories-title"
          description="A glimpse of how future campaign moments can live together—without inventing participant identities before genuine submissions exist."
        />
        <div className="movement-preview__grid">
          {seedMovementStories.map((story) => (
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
        <p className="movement-preview__note">The complete movement wall arrives in a later campaign phase.</p>
      </div>
    </section>
  );
}
