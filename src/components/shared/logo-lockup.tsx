import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoLockupProps = {
  compact?: boolean;
  inverse?: boolean;
};

export function LogoLockup({ compact = false, inverse = false }: LogoLockupProps) {
  return (
    <div
      className={cn("logo-lockup", compact && "logo-lockup--compact", inverse && "logo-lockup--inverse")}
      aria-label="Mirchi presents Vriksha Vvandhan"
    >
      <Image
        src="/brand/mirchi-logo.png"
        alt="Mirchi"
        width={324}
        height={137}
        sizes={compact ? "86px" : "104px"}
        className="logo-lockup__mirchi"
      />
      <span className="logo-lockup__divider" aria-hidden="true" />
      <span className="logo-lockup__campaign" data-temporary-campaign-wordmark="true">
        <span>Vriksha</span>
        <span>Vvandhan</span>
      </span>
    </div>
  );
}
