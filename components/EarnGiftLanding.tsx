"use client";

import React from "react";
import { motion } from "framer-motion";
import Silk from "./Silk.jsx";


const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

// --- 3. MAIN PAGE LAYOUT ---
export default function EarnGiftLanding() {
  return (
    <div className="relative min-h-screen bg-[#FDF8F3] text-[#3D2514] font-sans selection:bg-[#E88D4B] selection:text-white">
        <div style={{ width: '1080px', height: '1080px', position: 'relative' }}>
            <Silk
                speed={6.3}
                scale={1.3}
                color="#ffa57d"
                noiseIntensity={3}
                rotation={0.2}
            />
        </div>
        <main className="relative z-10">
        <section id="how-it-works" className="py-32 px-6 lg:px-16 max-w-7xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-serif mb-20 text-center">
              DeFi Yield, <span className="italic text-[#E88D4B]">Redefined.</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-20">
            <FadeIn delay={0.1}>
              <div className="border-t border-[#3D2514]/20 pt-6">
                <div className="text-xs tracking-widest text-[#E88D4B] mb-4 uppercase">01 / The Language Barrier</div>
                <h3 className="text-2xl font-serif mb-4">No More DeFi Jargon</h3>
                <p className="text-[#3D2514]/70 leading-relaxed font-light">
                  Forget APY, TVL, vaults, and liquidity pools. Traditional platforms speak to experts. We speak human. We translate complex metrics into simple, expected earnings.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="border-t border-[#3D2514]/20 pt-6">
                <div className="text-xs tracking-widest text-[#E88D4B] mb-4 uppercase">02 / Analysis Paralysis</div>
                <h3 className="text-2xl font-serif mb-4">End Choice Paralysis</h3>
                <p className="text-[#3D2514]/70 leading-relaxed font-light">
                  Faced with 20+ protocols and 60+ chains, most users just give up. You just tell us how long you want to save (30, 90, or 180 days). Our system automatically routes you to the optimal strategy: Stable, Balanced, or Aggressive.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="border-t border-[#3D2514]/20 pt-6">
                <div className="text-xs tracking-widest text-[#E88D4B] mb-4 uppercase">03 / Complex Operations</div>
                <h3 className="text-2xl font-serif mb-4">One-Click Simplicity</h3>
                <p className="text-[#3D2514]/70 leading-relaxed font-light">
                  No manual bridging, no switching networks, no confusing gas fees. What usually takes 15 steps is reduced to a simple &#34;Approve&#34; and &#34;Deposit&#34;. Complete the process in under 30 seconds.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="border-t border-[#3D2514]/20 pt-6">
                <div className="text-xs tracking-widest text-[#E88D4B] mb-4 uppercase">04 / The Experience</div>
                <h3 className="text-2xl font-serif mb-4">Feel the Growth</h3>
                <p className="text-[#3D2514]/70 leading-relaxed font-light">
                  Depositing money shouldn&#39;t feel like sending it into a black hole. Watch your wealth grow in real-time with our live yield counter. Every second counts, and you&#39;ll see it happen. Share your growth link to invite friends.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      {/* FOOTER */}
    </div>
  );
}