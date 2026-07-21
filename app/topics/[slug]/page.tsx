import { notFound } from "next/navigation";
import Link from "next/link";
import { topics, getTopicBySlug } from "@/lib/topics";
import { ArrowLeft, ArrowRight, Lightbulb, Zap, BookOpen, Atom } from "lucide-react";
import TopicSimulation from "@/components/TopicSimulation";
import SuperpositionShowcase from "@/components/SuperpositionShowcase";
import EntanglementShowcase from "@/components/EntanglementShowcase";
import WaveParticleShowcase from "@/components/WaveParticleShowcase";
import QuantumComputingShowcase from "@/components/QuantumComputingShowcase";
import QuantumTunnelingShowcase from "@/components/QuantumTunnelingShowcase";
import ObserverEffectShowcase from "@/components/ObserverEffectShowcase";
import WaveFunctionShowcase from "@/components/WaveFunctionShowcase";
import SchrodingerCatShowcase from "@/components/SchrodingerCatShowcase";
import QuantumToolsShowcase from "@/components/QuantumToolsShowcase";
import TopicHero from "@/components/TopicHero";
import TopicSection from "@/components/TopicSection";

// Generate static params for all topics
export function generateStaticParams() {
  return topics.map((topic) => ({
    slug: topic.slug,
  }));
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
      {/* Dynamic gradient background */}
      <div
        className="fixed inset-0 z-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, rgba(${topic.colorRgb},0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(${topic.colorRgb},0.2) 0%, transparent 50%)`,
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b" style={{ borderColor: `rgba(${topic.colorRgb},0.3)` }}>
        <div className="w-full px-8 py-4 flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm" style={{ fontFamily: "var(--font-dm-sans)" }}>
              Back
            </span>
          </Link>
          <div className="h-6 w-px bg-white/20" />
          <div className="flex items-center gap-3">
            <span className="text-2xl">{topic.icon}</span>
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-playfair)", color: topic.accentColor }}
            >
              {topic.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-32 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-24">
            <TopicHero
              slug={slug}
              icon={topic.icon}
              title={topic.title}
              shortDesc={topic.shortDesc}
              accentColor={topic.accentColor}
              colorRgb={topic.colorRgb}
            />

            {/* Key Concept Card */}
            <div
              className="inline-block px-8 py-4 rounded-2xl border backdrop-blur-sm"
              style={{
                backgroundColor: `rgba(${topic.colorRgb},0.1)`,
                borderColor: `rgba(${topic.colorRgb},0.3)`,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5" style={{ color: topic.accentColor }} />
                <span
                  className="text-sm font-medium uppercase tracking-wider"
                  style={{ color: topic.accentColor, fontFamily: "var(--font-dm-sans)" }}
                >
                  Key Concept
                </span>
              </div>
              <h3
                className="text-xl font-bold text-white mb-1"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {topic.keyConcept}
              </h3>
              <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {topic.keyConceptDesc}
              </p>
            </div>
          </section>

          {/* Section 1: What is X? — 2D Simulation + Text */}
          <TopicSection
            index={0}
            heading={topic.sections[0].heading}
            content={topic.sections[0].content}
            icon={<Lightbulb className="w-5 h-5" style={{ color: topic.accentColor }} />}
            accentColor={topic.accentColor}
            colorRgb={topic.colorRgb}
            interactive={
              <TopicSimulation slug={slug} color={topic.color} colorRgb={topic.colorRgb} />
            }
          />

          {/* Section 2: How does it work? — 3D Showcase + Text */}
          <TopicSection
            index={1}
            heading={topic.sections[1].heading}
            content={topic.sections[1].content}
            icon={<Atom className="w-5 h-5" style={{ color: topic.accentColor }} />}
            accentColor={topic.accentColor}
            colorRgb={topic.colorRgb}
            reversed
            interactive={
              <div className="rounded-2xl overflow-hidden border border-white/10 h-96 bg-black/30">
                {slug === "superposition" && <SuperpositionShowcase />}
                {slug === "quantum-entanglement" && <EntanglementShowcase />}
                {slug === "wave-particle-duality" && <WaveParticleShowcase />}
                {slug === "quantum-computing" && <QuantumComputingShowcase />}
                {slug === "quantum-tunneling" && <QuantumTunnelingShowcase />}
                {slug === "observer-effect" && <ObserverEffectShowcase />}
                {slug === "wave-function" && <WaveFunctionShowcase />}
                {slug === "schrodingers-cat" && <SchrodingerCatShowcase />}
                {slug === "quantum-tools" && <QuantumToolsShowcase />}
              </div>
            }
          />

          {/* Section 3: Real-world examples — 3D Showcase + Text */}
          <TopicSection
            index={2}
            heading={topic.sections[2].heading}
            content={topic.sections[2].content}
            icon={<BookOpen className="w-5 h-5" style={{ color: topic.accentColor }} />}
            accentColor={topic.accentColor}
            colorRgb={topic.colorRgb}
            interactive={
              <div className="rounded-2xl overflow-hidden border border-white/10 h-96 bg-black/30">
                {slug === "superposition" && <SuperpositionShowcase />}
                {slug === "quantum-entanglement" && <EntanglementShowcase />}
                {slug === "wave-particle-duality" && <WaveParticleShowcase />}
                {slug === "quantum-computing" && <QuantumComputingShowcase />}
                {slug === "quantum-tunneling" && <QuantumTunnelingShowcase />}
                {slug === "observer-effect" && <ObserverEffectShowcase />}
                {slug === "wave-function" && <WaveFunctionShowcase />}
                {slug === "schrodingers-cat" && <SchrodingerCatShowcase />}
                {slug === "quantum-tools" && <QuantumToolsShowcase />}
              </div>
            }
          />

          {/* Section 4: Why it matters — 2D Simulation + Text */}
          <TopicSection
            index={3}
            heading={topic.sections[3].heading}
            content={topic.sections[3].content}
            icon={<Zap className="w-5 h-5" style={{ color: topic.accentColor }} />}
            accentColor={topic.accentColor}
            colorRgb={topic.colorRgb}
            reversed
            interactive={
              <TopicSimulation slug={slug} color={topic.color} colorRgb={topic.colorRgb} />
            }
          />

          {/* Navigation to next/prev topic */}
          <nav className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-8 border-t" style={{ borderColor: `rgba(${topic.colorRgb},0.2)` }}>
            {(() => {
              const currentIndex = topics.findIndex((t) => t.slug === slug);
              const prevTopic = currentIndex > 0 ? topics[currentIndex - 1] : null;
              const nextTopic = currentIndex < topics.length - 1 ? topics[currentIndex + 1] : null;

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
                        <span className="text-xs text-gray-500 block" style={{ fontFamily: "var(--font-dm-sans)" }}>Previous</span>
                        <span className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
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
                        <span className="text-xs text-gray-500 block" style={{ fontFamily: "var(--font-dm-sans)" }}>Next</span>
                        <span className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
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
      </main>
    </div>
  );
}
