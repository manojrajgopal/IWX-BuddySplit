'use client';
import { useEffect, useState } from 'react';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

const ITEMS: Testimonial[] = [
  {
    quote: 'We used to argue about money every single trip. With BuddySplit our last Goa weekend ended with one tap and 3 transfers. Lifesaver.',
    name: 'Priya Menon',
    role: 'Travel group of 6 friends',
    avatar: 'P',
  },
  {
    quote: 'Three roommates, one flat, dozens of bills a month. We finally stopped tracking groceries on paper. The percentage split saves us hours.',
    name: 'Manoj Sharma',
    role: 'Roommate in Bengaluru',
    avatar: 'R',
  },
  {
    quote: 'Our office lunch group of 14 people was a nightmare. The minimum-transfer settlement is genuinely magical — we settle every Friday now.',
    name: 'Bindu Iyer',
    role: 'Team lead at a startup',
    avatar: 'S',
  },
  {
    quote: 'My wife and I split household expenses 60/40 based on income. The percentage mode does the math automatically. Zero more spreadsheets.',
    name: 'Amit Kapoor',
    role: 'Couple, shared finances',
    avatar: 'A',
  },
  {
    quote: 'Down to the last paisa. I love that. No more “close enough” — every rupee is accounted for and the totals always match.',
    name: 'Divya Pillai',
    role: 'CA, splits with family',
    avatar: 'D',
  },
  {
    quote: 'Real-time updates mean nobody has to ask twice. Whoever pays adds it, everyone sees it instantly. It just works.',
    name: 'Kabir Khan',
    role: 'Cricket league organizer',
    avatar: 'K',
  },
];

export function TestimonialCarousel(): JSX.Element {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % ITEMS.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className="testimonials"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="testimonials__track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {ITEMS.map((t, i) => (
          <article key={i} className="testimonial-card" aria-hidden={i !== index}>
            <div className="testimonial-card__quote">“{t.quote}”</div>
            <div className="testimonial-card__person">
              <span className="testimonial-card__avatar">{t.avatar}</span>
              <div>
                <div className="testimonial-card__name">{t.name}</div>
                <div className="testimonial-card__role">{t.role}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="testimonials__dots" role="tablist" aria-label="Choose testimonial">
        {ITEMS.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show testimonial ${i + 1}`}
            className={'testimonials__dot' + (i === index ? ' testimonials__dot--active' : '')}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
