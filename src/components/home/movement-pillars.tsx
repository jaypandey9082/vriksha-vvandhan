import { movementPillars } from "@/content/campaign";

export function MovementPillars() {
  return (
    <section className="movement-pillars section" aria-labelledby="movement-pillars-title">
      <div className="shell">
        <p className="movement-pillars__kicker">The Mirchi movement</p>
        <h2 id="movement-pillars-title">983 Trees. One Frequency. Infinite Promises.</h2>
        <div className="movement-pillars__grid">
          {movementPillars.map((pillar, index) => (
            <article key={pillar.lead}>
              <span aria-hidden="true">0{index + 1}</span>
              <h3>{pillar.lead}</h3>
              <p>{pillar.descriptor}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
