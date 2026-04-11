import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    question: 'Is EarnGift custodial?',
    answer: 'No. We never hold your funds. Your USDC stays in your wallet and in non-custodial smart contracts. You hold the keys, you control the assets.',
  },
  {
    question: 'What\'s the minimum deposit?',
    answer: 'There is no minimum. Start with any amount that makes sense for you—whether it\'s $10 or $10,000.',
  },
  {
    question: 'How fast can I withdraw?',
    answer: 'Anytime. Withdrawals are typically processed within minutes, depending on network congestion. No lock-ups, no waiting periods.',
  },
  {
    question: 'Which networks are supported?',
    answer: 'We support Ethereum, Arbitrum, Base, and Polygon. More chains coming soon based on community demand.',
  },
  {
    question: 'How is the yield generated?',
    answer: 'We aggregate yields from 20+ battle-tested DeFi protocols. Our system automatically routes your funds to the best opportunities while maintaining strict risk parameters.',
  },
  {
    question: 'Are there any fees?',
    answer: 'We charge a small performance fee only on the yield generated—never on your principal. No hidden fees, no withdrawal charges.',
  },
];

export default function FAQSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const faqListRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
      gsap.fromTo(
        headingRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'top 55%',
            scrub: true,
          },
        }
      );

      // FAQ items stagger animation
      const items = faqListRef.current?.querySelectorAll('.faq-item');
      if (items) {
        items.forEach((item, index) => {
          gsap.fromTo(
            item,
            { y: 16, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              scrollTrigger: {
                trigger: sectionRef.current,
                start: `top ${65 - index * 3}%`,
                end: `top ${40 - index * 3}%`,
                scrub: true,
              },
            }
          );
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="section-flowing bg-[#F6EEE3] py-24 lg:py-32 z-[80]"
    >
      <div className="px-8 lg:px-[8vw]">
        <div className="flex flex-col lg:flex-row lg:gap-16">
          {/* Left Heading */}
          <div className="lg:w-[36vw] lg:sticky lg:top-32 lg:self-start">
            <h2
              ref={headingRef}
              className="headline-lg text-[#141414] text-[clamp(2.5rem,5vw,4.5rem)] mb-8 lg:mb-0"
            >
              FAQ
            </h2>
          </div>

          {/* Right FAQ List */}
          <div ref={faqListRef} className="lg:w-[48vw] lg:ml-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between py-4 text-left group"
                >
                  <span className="font-display text-lg lg:text-xl font-semibold text-[#141414] pr-8 group-hover:text-[#1E4B47] transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#1E4B47] flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? 'max-h-48 pb-4' : 'max-h-0'
                  }`}
                >
                  <p className="font-body text-[#141414]/70 leading-relaxed pr-12">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
