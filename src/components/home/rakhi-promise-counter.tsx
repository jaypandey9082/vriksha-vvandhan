import type { CampaignMetric } from "@/types/campaign";

type RakhiPromiseCounterProps = {
  metric: CampaignMetric;
};

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const beadKeys = ["outer", "red", "gold", "green", "inner"] as const;

function RakhiThread({ side }: { side: "left" | "right" }) {
  return (
    <span className={`rakhi-counter__thread rakhi-counter__thread--${side}`} aria-hidden="true">
      <span className="rakhi-counter__cord" />
      <span className="rakhi-counter__beads">
        {beadKeys.map((key) => <i key={key} />)}
      </span>
      <span className="rakhi-counter__tassel" />
    </span>
  );
}

export function RakhiPromiseCounter({ metric }: RakhiPromiseCounterProps) {
  const available = metric.current !== null;
  const progress = available && metric.target > 0
    ? Math.min(Math.max(metric.current! / metric.target, 0), 1)
    : 0;
  const percentage = Math.round(progress * 100);
  const progressOffset = CIRCUMFERENCE * (1 - progress);
  const accessibleLabel = available
    ? `${metric.current} of ${metric.target} ${metric.label} completed.`
    : `Campaign promise count is currently unavailable. Target: ${metric.target} ${metric.label}.`;

  return (
    <div className="rakhi-counter" aria-label={accessibleLabel} role="img" data-available={available}>
      <RakhiThread side="left" />
      <span className="rakhi-counter__medallion">
        <svg className="rakhi-counter__ring" viewBox="0 0 200 200" aria-hidden="true">
          <circle className="rakhi-counter__petal-ring" cx="100" cy="100" r="91" />
          <circle className="rakhi-counter__gold-ring" cx="100" cy="100" r="84" />
          <circle className="rakhi-counter__track" cx="100" cy="100" r={RADIUS} />
          <circle
            className="rakhi-counter__progress"
            cx="100"
            cy="100"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={progressOffset}
          />
          <circle className="rakhi-counter__inner-ring" cx="100" cy="100" r="68" />
        </svg>
        <span className="rakhi-counter__copy">
          <strong>{available ? metric.current : "—"}</strong>
          <span>of <b>{metric.target}</b></span>
          <small>{metric.label}</small>
          <svg className="rakhi-counter__leaf" viewBox="0 0 34 24" aria-hidden="true">
            <path d="M17 21C17 13 17 7 17 2" />
            <path d="M16 13C9 13 5 9 4 4c7 0 11 3 12 9Z" />
            <path d="M18 10c7 0 10-3 12-8-7 0-11 3-12 8Z" />
          </svg>
        </span>
      </span>
      <RakhiThread side="right" />
      <span className="visually-hidden">
        {available ? `${percentage}% complete.` : "Live tracker updating."}
      </span>
    </div>
  );
}
