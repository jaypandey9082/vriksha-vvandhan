import type {
  AudioMessagePreview,
  CampaignChannel,
  CampaignImage,
  HeroContent,
  CampaignMetric,
  MovementPillar,
  MovementStory,
  NavigationItem,
  ParticipationStep,
} from "@/types/campaign";

export const navigationItems = [
  { label: "The Movement", href: "#movement" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Stories", href: "#stories" },
  { label: "Ped Ka Paigaam", href: "#ped-ka-paigaam" },
] as const satisfies readonly NavigationItem[];

export const promiseMetric: CampaignMetric = {
  current: 417,
  target: 983,
  label: "Vriksha promises",
};

export const heroContent = {
  eyebrow: "This Raksha Bandhan",
  title: "Protect the protector.",
  description:
    "The protector has always protected us. Tie a Rakhi to a tree and make your promise visible.",
  primaryCta: { label: "Join the Movement", href: "#how-it-works" },
  secondaryCta: { label: "See the Promises", href: "#stories" },
  ribbonLabel: "Promises already taking root",
} as const satisfies HeroContent;

export const heroImage: CampaignImage = {
  src: "/campaign/hero-tree-rakhi.webp",
  width: 688,
  height: 720,
  alt: "A ceremonial Rakhi tied around the trunk of a sunlit tree",
  objectPosition: "50% 52%",
};

export const storyContent = {
  eyebrow: "A promise returned",
  title: "For the protector we rarely stop to thank.",
  paragraphs: [
    "Raksha Bandhan celebrates the people and bonds that protect us. Yet the tree outside our home has quietly offered shade, cleaner air, cooler streets and a place for our memories.",
    "This year, Vriksha Vvandhan turns gratitude into a promise: to see a tree not as ‘just another tree’, but as a protector worth nurturing.",
  ],
  image: {
    src: "/campaign/story-banyan.webp",
    width: 726,
    height: 720,
    alt: "A mature banyan tree casting long shadows across a quiet street",
    objectPosition: "62% 50%",
  } satisfies CampaignImage,
} as const;

export const movementPillars = [
  { lead: "A Rakhi.", descriptor: "A visible promise of care." },
  { lead: "An identity.", descriptor: "A tree remembered, not overlooked." },
  { lead: "A protector.", descriptor: "A bond carried beyond one day." },
] as const satisfies readonly MovementPillar[];

export const participationSteps: readonly ParticipationStep[] = [
  {
    number: 1,
    title: "Tie a Rakhi",
    description: "Choose a nearby tree and make a personal promise to protect and nurture it.",
  },
  {
    number: 2,
    title: "Visit Vriksha Vvandhan",
    description: "Return to the campaign website to add your promise to the movement.",
  },
  {
    number: 3,
    title: "Share the tree",
    description: "Upload a photograph of the tree you have chosen to care for.",
    availability: "Photo submissions will open in the next campaign phase.",
  },
  {
    number: 4,
    title: "Receive a digital certificate",
    description: "A personalised Guardian certificate will recognise the promise you made.",
    availability: "Personalised certificates are coming in a later campaign phase.",
  },
];

export const firstRakhiMoment = {
  eyebrow: "Where the movement begins",
  title: "The First Rakhi Moment",
  description:
    "A quiet, symbolic first promise opens the movement: a Rakhi tied to a tree with a personal story behind the bond. This editorial moment introduces the spirit of Vriksha Vvandhan—care made visible, then carried forward by the community.",
  image: {
    src: "/campaign/first-rakhi-moment.webp",
    width: 730,
    height: 675,
    alt: "A cinematic campaign still of a Rakhi being tied to a tree at dusk",
    objectPosition: "54% 50%",
  } satisfies CampaignImage,
} as const;

export const campaignChannels = [
  {
    key: "digital",
    eyebrow: "Digital campaign",
    title: "#VrikshaVvandhan",
    intro: "Stories that make a private promise visible—and invite someone else to begin.",
    items: [
      "Tying a Rakhi",
      "Hugging a tree",
      "Childhood neighbourhood-tree memories",
      "Before-and-after care stories",
    ],
  },
  {
    key: "on-ground",
    eyebrow: "On-ground campaign",
    title: "A promise made together",
    intro: "Mirchi RJs bring the movement into familiar community spaces.",
    items: [
      "Parks and neighbourhoods",
      "Schools and colleges",
      "Housing societies",
      "Eco-friendly Rakhi activity",
    ],
  },
] as const satisfies readonly CampaignChannel[];

export const channelImage: CampaignImage = {
  src: "/campaign/movement-rakhi-wide.webp",
  width: 1376,
  height: 390,
  alt: "A community gathering around a tree as a Rakhi is tied to its trunk",
  objectPosition: "50% 46%",
};

export const seedMovementStories = [
  {
    id: "community-promise-01",
    label: "Community Promise 01",
    category: "Digital",
    line: "A familiar bond, retold as gratitude.",
    image: {
      src: "/campaign/family-rakhi.webp",
      width: 670,
      height: 360,
      alt: "A family Rakhi moment in warm morning light",
    },
    size: "landscape",
  },
  {
    id: "community-promise-02",
    label: "Community Promise 02",
    category: "On Ground",
    line: "A promise that begins with the next generation.",
    image: {
      src: "/campaign/on-ground-school.webp",
      width: 445,
      height: 430,
      alt: "Schoolchildren tying colourful Rakhis around a neighbourhood tree",
    },
    size: "square",
  },
  {
    id: "community-promise-03",
    label: "Community Promise 03",
    category: "On Ground",
    line: "Old memories, renewed around one tree.",
    image: {
      src: "/campaign/on-ground-community.webp",
      width: 480,
      height: 430,
      alt: "Older community members gathered around a tree decorated with Rakhis",
    },
    size: "square",
  },
  {
    id: "community-promise-04",
    label: "Community Promise 04",
    category: "On Ground",
    line: "One Rakhi can begin a shared ritual of care.",
    image: {
      src: "/campaign/on-ground-youth.webp",
      width: 451,
      height: 720,
      alt: "Young adults tying a red Rakhi to a sapling beside a city street",
    },
    size: "portrait",
  },
  {
    id: "community-promise-05",
    label: "Community Promise 05",
    category: "Digital",
    line: "The protector becomes part of the family story.",
    image: {
      src: "/campaign/child-and-dog.webp",
      width: 325,
      height: 350,
      alt: "A child sharing a joyful Rakhi moment with a family dog",
    },
    size: "square",
  },
  {
    id: "community-promise-06",
    label: "Community Promise 06",
    category: "Digital",
    line: "Care finds a new symbol and a new story.",
    image: {
      src: "/campaign/service-rakhi.webp",
      width: 335,
      height: 370,
      alt: "A family sharing a Rakhi moment with a service member",
    },
    size: "portrait",
  },
  {
    id: "community-promise-07",
    label: "Community Promise 07",
    category: "On Ground",
    line: "A tree becomes a place for many promises.",
    image: {
      src: "/campaign/rakhi-tree-at-dusk.webp",
      width: 1376,
      height: 360,
      alt: "A large tree illuminated at dusk and decorated with many Rakhis",
    },
    size: "landscape",
  },
  {
    id: "community-promise-08",
    label: "Community Promise 08",
    category: "Digital",
    line: "The city counts every promise, one by one.",
    image: {
      src: "/campaign/city-at-dusk.webp",
      width: 966,
      height: 355,
      alt: "A city skyline at dusk seen across illuminated streets",
    },
    size: "landscape",
  },
] as const satisfies readonly MovementStory[];

export const heroPromiseImages = [
  { src: "/campaign/child-hand-bark.webp", width: 560, height: 720, alt: "" },
  { src: "/campaign/on-ground-school.webp", width: 445, height: 430, alt: "" },
  { src: "/campaign/on-ground-community.webp", width: 480, height: 430, alt: "" },
  { src: "/campaign/on-ground-youth.webp", width: 451, height: 720, alt: "" },
  { src: "/campaign/story-banyan.webp", width: 726, height: 720, alt: "" },
  { src: "/campaign/movement-rakhi-wide.webp", width: 1376, height: 390, alt: "" },
  { src: "/campaign/rakhi-tree-at-dusk.webp", width: 1376, height: 360, alt: "" },
  { src: "/campaign/first-rakhi-moment.webp", width: 730, height: 675, alt: "" },
] as const satisfies readonly CampaignImage[];

export const pedKaPaigaam: AudioMessagePreview = {
  title: "Ped Ka Paigaam",
  quote: "Tumhare bachpan ka har raaz mujhe yaad hai… school ka pehla din, pehla pyaar, pehli selfie… sab dekha hai maine.",
  status: "Soon, Mirchi RJs will give voice to messages from the trees that have quietly witnessed our lives.",
};

export const pedKaPaigaamImage: CampaignImage = {
  src: "/campaign/ped-ka-paigaam.webp",
  width: 460,
  height: 768,
  alt: "A studio microphone surrounded by sunlit green leaves",
  objectPosition: "50% 50%",
};

export const finalCta = {
  lineOne: "One Rakhi.",
  lineTwo: "One Story.",
  lineThree: "Millions inspired to protect a tree.",
  cta: { label: "Join the Movement", href: "#how-it-works" },
} as const;
