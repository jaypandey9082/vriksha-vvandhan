import type { CampaignMetric } from "@/types/campaign";

type PromiseTrackerProps = {
  metric: CampaignMetric;
};

const RADIUS = 68;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PromiseTracker({ metric }: PromiseTrackerProps) {
  const progress = metric.target > 0 ? Math.min(Math.max(metric.current / metric.target, 0), 1) : 0;
  const percentage = Math.round(progress * 100);
  const progressOffset = CIRCUMFERENCE * (1 - progress);
  const accessibleLabel = `${metric.current} of ${metric.target} ${metric.label}, ${percentage}% of the first circle complete`;

  return (
    <div className="promise-tracker" aria-label={accessibleLabel} role="img">
      <svg className="promise-tracker__ring" viewBox="0 0 176 176" aria-hidden="true">
        <circle className="promise-tracker__track" cx="88" cy="88" r={RADIUS} />
        <circle
          className="promise-tracker__progress"
          cx="88"
          cy="88"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={progressOffset}
        />
        <circle className="promise-tracker__inner" cx="88" cy="88" r="55" />
        <circle className="promise-tracker__inner promise-tracker__inner--fine" cx="88" cy="88" r="48" />
        {[0, 90, 180, 270].map((rotation) => (
          <line
            className="promise-tracker__mark"
            key={rotation}
            x1="88"
            x2="88"
            y1="15"
            y2="21"
            transform={`rotate(${rotation} 88 88)`}
          />
        ))}
        <circle className="promise-tracker__knot" cx="88" cy="15" r="3.5" />
      </svg>
      <span className="promise-tracker__copy">
        <strong>{metric.current}</strong>
        <span>of {metric.target}</span>
        <small>{metric.label}</small>
        <b>{percentage}%</b>
      </span>
      <span className="promise-tracker__support">{percentage}% of the first circle complete</span>
    </div>
  );
}
