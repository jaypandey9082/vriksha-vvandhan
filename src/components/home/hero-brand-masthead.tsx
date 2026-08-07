import Image from "next/image";

export function HeroBrandMasthead() {
  return (
    <div className="hero-brand-masthead">
      <Image
        className="hero-brand-masthead__logo"
        src="/brand/mirchi-logo.png"
        alt="Mirchi"
        width={324}
        height={137}
        sizes="(max-width: 639px) 190px, (max-width: 959px) 240px, 300px"
        loading="eager"
      />
      <div className="hero-brand-masthead__presents">
        <span aria-hidden="true" />
        <p>Presents</p>
        <span aria-hidden="true" />
      </div>
    </div>
  );
}
