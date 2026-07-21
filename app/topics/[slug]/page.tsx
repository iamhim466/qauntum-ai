import { notFound } from "next/navigation";
import Link from "next/link";
import { topics, getTopicBySlug } from "@/lib/topics";
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb, Zap } from "lucide-react";
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
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-20">
            <div className="mb-8">
              <span className="text-8xl block mb-6">{topic.icon}</span>
              <h2
                className="text-5xl md:text-6xl font-bold mb-4"
                style={{ fontFamily: "var(--font-playfair)", color: topic.accentColor }}
              >
                {topic.title}
              </h2>
              <p
                className="text-xl text-gray-400 max-w-2xl mx-auto"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {topic.shortDesc}
              </p>
            </div>

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

          {/* Interactive Simulation */}
          <section className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="w-6 h-6" style={{ color: topic.accentColor }} />
              <h3
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-playfair)", color: topic.accentColor }}
              >
                Interactive Simulation
              </h3>
            </div>
            <TopicSimulation slug={slug} color={topic.color} colorRgb={topic.colorRgb} />
            <p
              className="text-sm text-gray-500 mt-3 text-center"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Watch the simulation to visualize the quantum concept in action
            </p>
          </section>

          {/* 3D Showcase - topic-specific */}
          {slug === "superposition" && (
            <section className="mb-20">
              <SuperpositionShowcase />
            </section>
          )}
          {slug === "quantum-entanglement" && (
            <section className="mb-20">
              <EntanglementShowcase />
            </section>
          )}
          {slug === "wave-particle-duality" && (
            <section className="mb-20">
              <WaveParticleShowcase />
            </section>
          )}
          {slug === "quantum-computing" && (
            <section className="mb-20">
              <QuantumComputingShowcase />
            </section>
          )}
          {slug === "quantum-tunneling" && (
            <section className="mb-20">
              <QuantumTunnelingShowcase />
            </section>
          )}
          {slug === "observer-effect" && (
            <section className="mb-20">
              <ObserverEffectShowcase />
            </section>
          )}
          {slug === "wave-function" && (
            <section className="mb-20">
              <WaveFunctionShowcase />
            </section>
          )}
          {slug === "schrodingers-cat" && (
            <section className="mb-20">
              <SchrodingerCatShowcase />
            </section>
          )}
          {slug === "quantum-tools" && (
            <section className="mb-20">
              <QuantumToolsShowcase />
            </section>
          )}

          {/* Colored divider */}
          <div className="flex items-center gap-4 mb-16">
            <div className="flex-1 h-px" style={{ backgroundColor: `rgba(${topic.colorRgb},0.3)` }} />
            <BookOpen className="w-5 h-5" style={{ color: topic.accentColor }} />
            <div className="flex-1 h-px" style={{ backgroundColor: `rgba(${topic.colorRgb},0.3)` }} />
          </div>

          {/* Content Sections */}
          <section className="space-y-8 mb-20">
            {topic.sections.map((section, index) => (
              <div
                key={index}
                className="relative p-8 rounded-2xl border backdrop-blur-sm scroll-mt-24"
                style={{
                  backgroundColor: `rgba(${topic.colorRgb},${0.05 + index * 0.02})`,
                  borderColor: `rgba(${topic.colorRgb},0.2)`,
                }}
              >
                {/* Section number */}
                <div
                  className="absolute -top-4 left-8 px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: topic.color,
                    color: "white",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>

                <h3
                  className="text-2xl font-bold mb-4 mt-2"
                  style={{ fontFamily: "var(--font-playfair)", color: topic.accentColor }}
                >
                  {section.heading}
                </h3>
                <p
                  className="text-gray-300 leading-relaxed text-lg"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {section.content}
                </p>
              </div>
            ))}
          </section>

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
