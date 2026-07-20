"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MdKeyboardArrowDown } from "react-icons/md";

export function FaqSection() {
  const t = useTranslations("faq");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq" id="faq">
      <div className="faq__container">
        <h2 className="faq__title">{t("title")}</h2>
        <div className="faq__list">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`faq__item ${isOpen ? "faq__item--open" : ""}`}
              >
                <button
                  className="faq__question"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <MdKeyboardArrowDown className="faq__icon" />
                </button>
                <div className="faq__answer-wrapper">
                  <div className="faq__answer">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
