'use client';

import { useState } from 'react';

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-accordion">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className={`faq-accordion__item${isOpen ? ' faq-accordion__item--open' : ''}`}>
            <button
              className="faq-accordion__trigger"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
            >
              <span className="faq-accordion__question">{item.question}</span>
              <span className={`faq-accordion__icon${isOpen ? ' faq-accordion__icon--open' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <div
              id={`faq-panel-${i}`}
              className="faq-accordion__panel"
              role="region"
              aria-hidden={!isOpen}
            >
              <div className="faq-accordion__answer">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
