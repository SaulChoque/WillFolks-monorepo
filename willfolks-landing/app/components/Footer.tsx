"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="footer" id="footer">
      <div className="footer__content">
        <div>
          <h3 className="footer__social-title">{t("socialTitle")}</h3>
          <div className="footer__social-links">
            <a href="#" className="footer__social-link">
              {t("facebook")}
            </a>
            <a href="#" className="footer__social-link">
              {t("instagram")}
            </a>
            <a href="#" className="footer__social-link">
              {t("linkedin")}
            </a>
          </div>
        </div>

        <div>
          <h3 className="footer__social-title">{t("socialTitle")}</h3>
          <div className="footer__social-links">
            <a href="#" className="footer__social-link">
              {t("facebook")}
            </a>
            <a href="#" className="footer__social-link">
              {t("instagram")}
            </a>
            <a href="#" className="footer__social-link">
              {t("linkedin")}
            </a>
          </div>
        </div>

        <div className="footer__logo">
          <span className="footer__logo-text">WillFolks</span>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="footer__legal">
          <a href="#" className="footer__legal-link">
            {t("privacy")}
          </a>
          <a href="#" className="footer__legal-link">
            {t("terms")}
          </a>
        </div>
        <span className="footer__copyright">{t("copyright")}</span>
      </div>
    </footer>
  );
}
