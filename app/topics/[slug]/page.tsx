import { notFound } from "next/navigation";
import Link from "next/link";
import { topics, getTopicBySlug } from "@/lib/topics";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ScrollytellingViewport from "@/components/ScrollytellingViewport";
import FullScreenTopicSimulation from "@/components/FullScreenTopicSimulation";
import SuperpositionShowcase from "@/components/SuperpositionShowcase";
import EntanglementShowcase from "@/components/EntanglementShowcase";
import WaveParticleShowcase from "@/components/WaveParticleShowcase";
import QuantumComputingShowcase from "@/components/QuantumComputingShowcase";
import QuantumTunnelingShowcase from "@/components/QuantumTunnelingShowcase";
import ObserverEffectShowcase from "@/components/ObserverEffectShowcase";
import WaveFunctionShowcase from "@/components/WaveFunctionShowcase";
import SchrodingerCatShowcase from "@/components/SchrodingerCatShowcase";
import QuantumToolsShowcase from "@/components/QuantumToolsShowcase";

// Generate static params for all topics
export function generateStaticParams() {
  return topics.map((topic) => ({ slug: topic.slug }));
}

// Generate metadata for each topic
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return { title: "Topic Not Found" };

  return {
    title: `${topic.title} | Quantum: The Easy Way`,
    description: topic.shortDesc,
  };
}

// ── Map each slug to its 3D showcase component ────────────────
function ShowcaseForSlug({ slug }: { slug: string }) {
  // [&>div] targets the showcase's own outer <div> via Tailwind descendant
  // selector with !important to override h-[70vh], rounded-3xl, border, bg
  const wrap = (child: React.ReactNode) => (
    <div className="w-full h-full [&>div]:!h-full [&>div]:!min-h-full [&>div]:!rounded-none [&>div]:!border-0 [&>div]:!bg-transparent [&>div]:!overflow-hidden">
      {child}
    </div>
  );

  switch (slug) {
    case "superposition":
      return wrap(<SuperpositionShowcase />);
    case "quantum-entanglement":
      return wrap(<EntanglementShowcase />);
    case "wave-particle-duality":
      return wrap(<WaveParticleShowcase />);
    case "quantum-computing":
      return wrap(<QuantumComputingShowcase />);
    case "quantum-tunneling":
      return wrap(<QuantumTunnelingShowcase />);
    case "observer-effect":
      return wrap(<ObserverEffectShowcase />);
    case "wave-function":
      return wrap(<WaveFunctionShowcase />);
    case "schrodingers-cat":
      return wrap(<SchrodingerCatShowcase />);
    case "quantum-tools":
      return wrap(<QuantumToolsShowcase />);
    default:
      return null;
  }
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);

  if (!topic) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Header ──────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b"
        style={{ borderColor: `rgba(${topic.colorRgb},0.3)` }}
      >
        <div className="w-full px-8 py-4 flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span
              className="text-sm"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Back
            </span>
          </Link>
          <div className="h-6 w-px bg-white/20" />
          <div className="flex items-center gap-3">
            <span className="text-2xl">{topic.icon}</span>
            <h1
              className="text-xl font-bold"
              style={{
                fontFamily: "var(--font-playfair)",
                color: topic.accentColor,
              }}
            >
              {topic.title}
            </h1>
          </div>
        </div>
      </header>

      {/* ── Scrollytelling Viewport ─────────────────────────── */}
      <ScrollytellingViewport
        model1={
          <FullScreenTopicSimulation
            slug={slug}
            color={topic.color}
            colorRgb={topic.colorRgb}
          />
        }
        model2={<ShowcaseForSlug slug={slug} />}
        card1Title={topic.sections[0].heading}
        card1Content={topic.sections[0].content}
        card2Title={topic.sections[1].heading}
        card2Content={topic.sections[1].content}
        accentColor={topic.accentColor}
        colorRgb={topic.colorRgb}
      />

      {/* ── Remaining Sections (after scrollytelling) ───────── */}
      <div
        className="relative z-10 py-20 px-8"
        style={{
          background: `linear-gradient(to bottom, #000, rgba(${topic.colorRgb},0.05))`,
        }}
      >
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Section 3: Real-world examples */}
          <section className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `rgba(${topic.colorRgb},0.15)`,
                  border: `1px solid rgba(${topic.colorRgb},0.3)`,
                }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: topic.accentColor, fontFamily: "var(--font-dm-sans)" }}
                >
                  03
                </span>
              </div>
              <h2
                className="text-3xl font-bold"
                style={{
                  fontFamily: "var(--font-playfair)",
                  color: topic.accentColor,
                }}
              >
                {topic.sections[2].heading}
              </h2>
            </div>
            <p
              className="text-gray-300 text-lg leading-relaxed"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              {topic.sections[2].content}
            </p>
          </section>

          {/* Section 4: Why it matters */}
          <section className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `rgba(${topic.colorRgb},0.15)`,
                  border: `1px solid rgba(${topic.colorRgb},0.3)`,
                }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: topic.accentColor, fontFamily: "var(--font-dm-sans)" }}
                >
                  04
                </span>
              </div>
              <h2
                className="text-3xl font-bold"
                style={{
                  fontFamily: "var(--font-playfair)",
                  color: topic.accentColor,
                }}
              >
                {topic.sections[3].heading}
              </h2>
            </div>
            <p
              className="text-gray-300 text-lg leading-relaxed"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              {topic.sections[3].content}
            </p>
          </section>

          {/* ── Key Concept Card ──────────────────────────── */}
          <div
            className="inline-block px-8 py-5 rounded-2xl border backdrop-blur-sm"
            style={{
              backgroundColor: `rgba(${topic.colorRgb},0.08)`,
              borderColor: `rgba(${topic.colorRgb},0.3)`,
            }}
          >
            <span
              className="text-sm font-medium uppercase tracking-wider block mb-1"
              style={{
                color: topic.accentColor,
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              Key Concept
            </span>
            <h3
              className="text-xl font-bold text-white mb-1"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {topic.keyConcept}
            </h3>
            <p
              className="text-sm text-gray-400"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              {topic.keyConceptDesc}
            </p>
          </div>

          {/* ── Navigation to next/prev topic ─────────────── */}
          <nav
            className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-8 border-t"
            style={{ borderColor: `rgba(${topic.colorRgb},0.2)` }}
          >
            {(() => {
              const currentIndex = topics.findIndex((t) => t.slug === slug);
              const prevTopic =
                currentIndex > 0 ? topics[currentIndex - 1] : null;
              const nextTopic =
                currentIndex < topics.length - 1
                  ? topics[currentIndex + 1]
                  : null;

              return (
                <>
                  {prevTopic ? (
                    <Link
                      href={`/topics/${prevTopic.slug}`}
                      className="flex items-center gap-3 px-6 py-4 rounded-xl border transition-all hover:scale-105 group"
                      style={{
                        borderColor: `rgba(${prevTopic.colorRgb},0.3)`,
                        backgroundColor: `rgba(${prevTopic.colorRgb},0.05)`,
                      }}
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                      <div>
                        <span
                          className="text-xs text-gray-500 block"
                          style={{ fontFamily: "var(--font-dm-sans)" }}
                        >
                          Previous
                        </span>
                        <span
                          className="text-sm font-semibold text-white"
                          style={{ fontFamily: "var(--font-playfair)" }}
                        >
                          {prevTopic.title}
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <div />
                  )}
                  {nextTopic ? (
                    <Link
                      href={`/topics/${nextTopic.slug}`}
                      className="flex items-center gap-3 px-6 py-4 rounded-xl border transition-all hover:scale-105 group text-right"
                      style={{
                        borderColor: `rgba(${nextTopic.colorRgb},0.3)`,
                        backgroundColor: `rgba(${nextTopic.colorRgb},0.05)`,
                      }}
                    >
                      <div>
                        <span
                          className="text-xs text-gray-500 block"
                          style={{ fontFamily: "var(--font-dm-sans)" }}
                        >
                          Next
                        </span>
                        <span
                          className="text-sm font-semibold text-white"
                          style={{ fontFamily: "var(--font-playfair)" }}
                        >
                          {nextTopic.title}
                        </span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </Link>
                  ) : (
                    <div />
                  )}
                </>
              );
            })()}
          </nav>
        </div>
      </div>
    </div>
  );
}
