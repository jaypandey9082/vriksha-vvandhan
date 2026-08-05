export type CampaignMetric = {
  current: number;
  target: number;
  label: string;
};

export type NavigationItem = {
  label: string;
  href: `#${string}`;
};

export type ParticipationStep = {
  number: number;
  title: string;
  description: string;
  availability?: string;
};

export type MovementPillar = {
  lead: string;
  descriptor: string;
};

export type CampaignChannel = {
  key: "digital" | "on-ground";
  eyebrow: string;
  title: string;
  intro: string;
  items: readonly string[];
};

export type CampaignImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  objectPosition?: string;
};

export type CampaignLink = {
  label: string;
  href: `#${string}`;
};

export type HeroContent = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: CampaignLink;
  secondaryCta: CampaignLink;
  ribbonLabel: string;
};

export type MovementStory = {
  id: string;
  label: string;
  category: "Digital" | "On Ground";
  line: string;
  image: CampaignImage;
  size: "portrait" | "landscape" | "square";
};

export type AudioMessagePreview = {
  title: string;
  quote: string;
  status: string;
};
