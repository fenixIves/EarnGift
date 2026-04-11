import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: '01',
    title: 'Connect wallet',
    description: 'No forms. No KYC. Just a secure signature.',
    image: '/step1_wallet.jpg',
  },
  {
    number: '02',
    title: 'Deposit USDC',
    description: 'Choose an amount. Funds stay in your control.',
    image: '/step2_deposit.jpg',
  },
  {
    number: '03',
    title: 'Earn daily',
    description: 'Yield accrues every day. Withdraw anytime.',
    image: '/step3_growth.jpg',
  },
];

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

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

      // Subtitle animation
      gsap.fromTo(
        subtitleRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            end: 'top 50%',
            scrub: true,
          },
        }
      );

      // Cards animation with stagger
      cardsRef.current.forEach((card, index) => {
        if (card) {
          gsap.fromTo(
            card,
            { y: '10vh', opacity: 0, scale: 0.98 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.6,
              scrollTrigger: {
                trigger: sectionRef.current,
                start: `top ${60 - index * 5}%`,
                end: `top ${35 - index * 5}%`,
                scrub: true,
              },
            }
          );

          // Parallax for card images
          const img = card.querySelector('img');
          if (img) {
            gsap.fromTo(
              img,
              { y: 16 },
              {
                y: -16,
                scrollTrigger: {
                  trigger: card,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              }
            );
          }
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="section-flowing bg-[#F6EEE3] py-24 lg:py-32 z-40"
    >
      <div className="px-8 lg:px-[8vw]">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-16 lg:mb-24">
          <div ref={headingRef}>
            <h2 className="headline-lg text-[#141414] text-[clamp(2.5rem,5vw,4.5rem)]">
              How it works
            </h2>
          </div>
          <p
            ref={subtitleRef}
            className="mt-6 lg:mt-0 lg:w-[36vw] font-body text-lg text-[#141414]/70 leading-relaxed"
          >
            We've stripped away the noise—so you can start earning in under 2 minutes.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 ">
          {steps.map((step, index) => (
            <div
              key={step.number}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="step-card p-6 lg:p-8 flex flex-col h-[52vh] bg-white rounded-2xl"
            >
              {/* Step Number */}
              <span className="label-mono text-[#1E4B47] mb-4">
                {step.number}
              </span>

              {/* Title */}
              <h3 className="font-display text-2xl lg:text-3xl font-semibold text-[#141414] mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="font-body text-[#141414]/70 leading-relaxed mb-6">
                {step.description}
              </p>

              {/* Image */}
              <div className="flex-1 rounded-2xl overflow-hidden mt-auto">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
