import { LogoLockup } from "@/components/shared/logo-lockup";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <LogoLockup />
        <div className="site-footer__campaign">
          <p>#VrikshaVvandhan</p>
          <p>This Raksha Bandhan, protect the protector.</p>
        </div>
        <p className="site-footer__copyright">
          © {new Date().getFullYear()} Mirchi. Campaign website concept.
        </p>
      </div>
    </footer>
  );
}
