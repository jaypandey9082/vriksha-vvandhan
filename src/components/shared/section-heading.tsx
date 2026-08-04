import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  titleId?: string;
  description?: string;
  align?: "left" | "center";
  inverse?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  titleId,
  description,
  align = "left",
  inverse = false,
}: SectionHeadingProps) {
  return (
    <header
      className={cn(
        "section-heading",
        align === "center" && "section-heading--center",
        inverse && "section-heading--inverse",
      )}
    >
      <p className="section-heading__eyebrow">{eyebrow}</p>
      <h2 className="section-heading__title" id={titleId}>{title}</h2>
      {description ? <p className="section-heading__description">{description}</p> : null}
    </header>
  );
}
