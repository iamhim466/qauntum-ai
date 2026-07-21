export interface TopicSection {
  heading: string;
  content: string;
}

export interface Topic {
  slug: string;
  title: string;
  shortDesc: string;
  icon: string;
  color: string;
  colorRgb: string;
  gradient: string;
  accentColor: string;
  accentRgb: string;
  sections: TopicSection[];
  keyConcept: string;
  keyConceptDesc: string;
}

export const topics: Topic[] = [
  {
    slug: "superposition",
    title: "Superposition",
    shortDesc: "Particles exist in multiple states simultaneously until measured.",
    icon: "⚛️",
    color: "#8b5cf6",
    colorRgb: "139,92,246",
    gradient: "from-violet-600 to-purple-800",
    accentColor: "#c4b5fd",
    accentRgb: "196,181,253",
    keyConcept: "Quantum State",
    keyConceptDesc: "A qubit can be |0⟩, |1⟩, or any superposition α|0⟩ + β|1⟩",
    sections: [
      {
        heading: "What is Superposition?",
        content:
          "Superposition is a fundamental principle of quantum mechanics that states a quantum system can exist in multiple states at the same time. Unlike classical physics, where an object must be in one definite state, quantum particles can be in a combination of all possible states simultaneously.",
      },
      {
        heading: "How Does It Work?",
        content:
          "When a quantum particle is not being observed, it exists in a superposition of all possible states. Each state has a probability amplitude associated with it. When a measurement is made, the superposition 'collapses' into one definite state.",
      },
      {
        heading: "Real-World Examples",
        content:
          "Electron spin is a classic example — an electron can be in a superposition of spin-up and spin-down states. Quantum computers leverage superposition to process multiple calculations simultaneously, giving them exponential computational power for certain tasks.",
      },
      {
        heading: "Why It Matters",
        content:
          "Understanding superposition is key to grasping quantum computing, quantum cryptography, and the fundamental nature of reality at the smallest scales. It challenges our everyday intuition about how the world works.",
      },
    ],
  },
  {
    slug: "quantum-entanglement",
    title: "Quantum Entanglement",
    shortDesc: "Two particles instantly connected regardless of distance apart.",
    icon: "🔗",
    color: "#ec4899",
    colorRgb: "236,72,153",
    gradient: "from-pink-500 to-rose-700",
    accentColor: "#f9a8d4",
    accentRgb: "249,168,212",
    keyConcept: "Bell State",
    keyConceptDesc: "Entangled particles share a quantum state: |Φ⁺⟩ = (|00⟩ + |11⟩)/√2",
    sections: [
      {
        heading: "What is Quantum Entanglement?",
        content:
          "Quantum entanglement is a phenomenon where two or more particles become linked in such a way that the quantum state of each particle cannot be described independently. Measuring one particle instantly affects the other, regardless of the distance between them.",
      },
      {
        heading: "The EPR Paradox",
        content:
          "Einstein famously called entanglement 'spooky action at a distance' and argued with Podolsky and Rosen that quantum mechanics must be incomplete. However, experiments have repeatedly confirmed that entanglement is real.",
      },
      {
        heading: "Applications",
        content:
          "Entanglement is the foundation of quantum teleportation, quantum key distribution for ultra-secure communications, and quantum computing. It enables instant correlation between particles separated by vast distances.",
      },
      {
        heading: "Key Experiments",
        content:
          "In 2022, the Nobel Prize in Physics was awarded to Aspect, Clauser, and Zeilinger for their experiments with entangled photons, establishing the violation of Bell inequalities and pioneering quantum information science.",
      },
    ],
  },
  {
    slug: "wave-particle-duality",
    title: "Wave Particle Duality",
    shortDesc: "Light and matter behave as both waves and particles.",
    icon: "🌊",
    color: "#06b6d4",
    colorRgb: "6,182,212",
    gradient: "from-cyan-500 to-blue-700",
    accentColor: "#67e8f9",
    accentRgb: "103,232,249",
    keyConcept: "De Broglie Wavelength",
    keyConceptDesc: "λ = h/p — every particle has a wavelength inversely proportional to momentum",
    sections: [
      {
        heading: "The Dual Nature of Light",
        content:
          "Wave-particle duality is the concept that every quantum entity exhibits both wave and particle properties. Light, once thought to be purely a wave, was shown by Einstein to also behave as discrete packets of energy called photons.",
      },
      {
        heading: "The Double-Slit Experiment",
        content:
          "This famous experiment demonstrates wave-particle duality. When particles like electrons pass through two slits, they create an interference pattern like waves. But when observed, they behave like particles, hitting the screen in discrete spots.",
      },
      {
        heading: "Matter Waves",
        content:
          "De Broglie proposed that all matter has wave-like properties. This was confirmed when electrons were shown to produce diffraction patterns, similar to light waves. The wavelength of a particle is inversely proportional to its momentum.",
      },
      {
        heading: "Implications",
        content:
          "Wave-particle duality challenges our classical understanding of reality and is central to quantum mechanics. It explains phenomena from atomic structure to the behavior of semiconductors in modern electronics.",
      },
    ],
  },
  {
    slug: "quantum-computing",
    title: "Quantum Computing",
    shortDesc: "Harnessing quantum bits to solve complex problems faster.",
    icon: "💻",
    color: "#10b981",
    colorRgb: "16,185,129",
    gradient: "from-emerald-500 to-teal-700",
    accentColor: "#6ee7b7",
    accentRgb: "110,231,183",
    keyConcept: "Qubit",
    keyConceptDesc: "Quantum bit that can be in superposition of |0⟩ and |1⟩ simultaneously",
    sections: [
      {
        heading: "What is Quantum Computing?",
        content:
          "Quantum computing uses quantum-mechanical phenomena like superposition and entanglement to perform computations. Unlike classical bits that are either 0 or 1, quantum bits (qubits) can exist in superpositions of both states simultaneously.",
      },
      {
        heading: "How Qubits Work",
        content:
          "A qubit can be in a superposition of |0⟩ and |1⟩ states, allowing quantum computers to explore many solutions at once. When multiple qubits are entangled, the computational power grows exponentially with each additional qubit.",
      },
      {
        heading: "Applications",
        content:
          "Quantum computers excel at cryptography, drug discovery, optimization problems, and simulating quantum systems. They can factor large numbers exponentially faster than classical computers, which has implications for data security.",
      },
      {
        heading: "Current State",
        content:
          "Companies like IBM, Google, and others are building quantum computers with increasing numbers of qubits. We're in the NISQ (Noisy Intermediate-Scale Quantum) era, working toward fault-tolerant quantum computing.",
      },
    ],
  },
  {
    slug: "quantum-tunneling",
    title: "Quantum Tunneling",
    shortDesc: "Particles pass through barriers classical physics forbids.",
    icon: "🔄",
    color: "#f59e0b",
    colorRgb: "245,158,11",
    gradient: "from-amber-500 to-orange-700",
    accentColor: "#fcd34d",
    accentRgb: "252,211,77",
    keyConcept: "Tunnel Probability",
    keyConceptDesc: "T ∝ e^(-2κL) — Probability decays exponentially with barrier width",
    sections: [
      {
        heading: "What is Quantum Tunneling?",
        content:
          "Quantum tunneling is a phenomenon where a particle passes through a potential energy barrier that it classically could not surmount. This occurs because the particle's wave function extends beyond the barrier, giving it a non-zero probability of appearing on the other side.",
      },
      {
        heading: "How It Works",
        content:
          "In quantum mechanics, particles are described by wave functions that represent probability amplitudes. When a wave encounters a barrier, part of it is reflected, but part can penetrate through, decaying exponentially inside the barrier.",
      },
      {
        heading: "Natural Phenomena",
        content:
          "Tunneling plays crucial roles in nuclear fusion in stars, radioactive alpha decay, and the operation of tunnel diodes. It's also responsible for the scanning tunneling microscope, which can image individual atoms.",
      },
      {
        heading: "Technological Impact",
        content:
          "Quantum tunneling is essential for flash memory, superconducting circuits, and scanning tunneling microscopes. Understanding tunneling helps engineers design smaller and faster electronic devices.",
      },
    ],
  },
  {
    slug: "observer-effect",
    title: "The Observer Effect",
    shortDesc: "Measurement changes the state of a quantum system.",
    icon: "👁️",
    color: "#6366f1",
    colorRgb: "99,102,241",
    gradient: "from-indigo-500 to-violet-700",
    accentColor: "#a5b4fc",
    accentRgb: "165,180,252",
    keyConcept: "Wave Function Collapse",
    keyConceptDesc: "Measurement forces a quantum system from superposition into a definite state",
    sections: [
      {
        heading: "What is the Observer Effect?",
        content:
          "The observer effect in quantum mechanics refers to the phenomenon where the act of measuring or observing a quantum system fundamentally changes its state. Before measurement, a quantum system exists in superposition; measurement causes it to collapse into a definite state.",
      },
      {
        heading: "The Measurement Problem",
        content:
          "One of the deepest puzzles in physics is why and how measurement causes wave function collapse. Different interpretations of quantum mechanics — Copenhagen, Many-Worlds, pilot wave — offer different explanations for what happens during observation.",
      },
      {
        heading: "Schrödinger's Cat",
        content:
          "Schrödinger devised his famous thought experiment to illustrate the measurement problem. A cat in a sealed box with a quantum trigger exists in a superposition of alive and dead until observed — highlighting the strangeness of quantum mechanics at macroscopic scales.",
      },
      {
        heading: "Practical Implications",
        content:
          "The observer effect has practical consequences in quantum computing (decoherence), quantum cryptography (eavesdropping detection), and fundamental physics. Understanding measurement is crucial for building reliable quantum technologies.",
      },
    ],
  },
  {
    slug: "quantum-tools",
    title: "Quantum Tools",
    shortDesc: "Essential instruments and frameworks for quantum research.",
    icon: "🛠️",
    color: "#14b8a6",
    colorRgb: "20,184,166",
    gradient: "from-teal-500 to-cyan-700",
    accentColor: "#5eead4",
    accentRgb: "94,234,212",
    keyConcept: "Quantum Gate",
    keyConceptDesc: "Unitary operations that transform qubit states (H, X, Z, CNOT...)",
    sections: [
      {
        heading: "Essential Quantum Instruments",
        content:
          "Quantum research relies on specialized tools: dilution refrigerators cool quantum processors to near absolute zero, lasers trap and manipulate individual atoms, and vacuum chambers isolate quantum systems from environmental noise.",
      },
      {
        heading: "Quantum Programming Languages",
        content:
          "Languages like Qiskit (IBM), Cirq (Google), and Q# (Microsoft) allow researchers to write quantum algorithms. These frameworks abstract the complexity of quantum gates and circuits into programmer-friendly interfaces.",
      },
      {
        heading: "Simulation Software",
        content:
          "Before running on real quantum hardware, algorithms are tested on classical simulators. Tools like Qiskit Aer, ProjectQ, and QuTiP help researchers validate quantum circuits and study quantum phenomena computationally.",
      },
      {
        heading: "The Quantum Ecosystem",
        content:
          "The quantum technology ecosystem includes hardware manufacturers, cloud quantum computing services, and research institutions. Major cloud providers now offer access to real quantum processors via their platforms.",
      },
    ],
  },
  {
    slug: "wave-function",
    title: "Wave Function",
    shortDesc: "Mathematical description of a quantum system's state.",
    icon: "📊",
    color: "#a855f7",
    colorRgb: "168,85,247",
    gradient: "from-purple-500 to-fuchsia-700",
    accentColor: "#d8b4fe",
    accentRgb: "216,180,254",
    keyConcept: "Schrödinger Equation",
    keyConceptDesc: "iℏ ∂ψ/∂t = Ĥψ — The fundamental equation governing quantum evolution",
    sections: [
      {
        heading: "What is a Wave Function?",
        content:
          "The wave function (ψ) is a mathematical function that describes the quantum state of a system. It contains all the information that can be known about a quantum system, and its square modulus gives the probability density of finding a particle at a given location.",
      },
      {
        heading: "The Schrödinger Equation",
        content:
          "The time-dependent Schrödinger equation governs how wave functions evolve over time. It's the quantum equivalent of Newton's second law — given a wave function at one time, the equation predicts the wave function at any future time.",
      },
      {
        heading: "Probability and Measurement",
        content:
          "According to the Born rule, the probability of finding a particle in a region is the integral of |ψ|² over that region. The wave function doesn't directly describe physical reality but our knowledge of the system.",
      },
      {
        heading: "Interpretations",
        content:
          "Different interpretations of quantum mechanics give different meanings to the wave function. In the Copenhagen interpretation, it represents our knowledge. In the Many-Worlds interpretation, it's the fundamental reality. The debate continues.",
      },
    ],
  },
  {
    slug: "schrodingers-cat",
    title: "Schrödinger's Cat",
    shortDesc: "Thought experiment illustrating quantum superposition.",
    icon: "🐱",
    color: "#ef4444",
    colorRgb: "239,68,68",
    gradient: "from-red-500 to-rose-700",
    accentColor: "#fca5a5",
    accentRgb: "252,165,165",
    keyConcept: "Macro Superposition",
    keyConceptDesc: "Can quantum superposition scale to everyday objects? The cat paradox explores this.",
    sections: [
      {
        heading: "The Thought Experiment",
        content:
          "In 1935, Erwin Schrödinger proposed a famous thought experiment: a cat is placed in a sealed box with a radioactive atom, a Geiger counter, and a vial of poison. If the atom decays, the Geiger counter triggers, breaking the vial and killing the cat.",
      },
      {
        heading: "Quantum Superposition at Macro Scale",
        content:
          "According to quantum mechanics, until the box is opened and observed, the radioactive atom is in a superposition of decayed and not decayed. This means the cat is simultaneously alive AND dead — a superposition that persists until measurement.",
      },
      {
        heading: "The Paradox",
        content:
          "Schrödinger designed this experiment to highlight what he saw as the absurdity of applying quantum superposition to everyday objects. How can a cat be both alive and dead? The paradox challenges us to understand where the quantum world ends and the classical world begins.",
      },
      {
        heading: "Modern Understanding",
        content:
          "Today, physicists understand that quantum superposition is fragile and collapses quickly for large objects due to decoherence. Schrödinger's cat remains a powerful illustration of quantum measurement and the boundary between quantum and classical worlds.",
      },
    ],
  },
];

export function getTopicBySlug(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug);
}
