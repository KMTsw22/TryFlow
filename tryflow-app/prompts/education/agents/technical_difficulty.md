# Education / EdTech — Technical Difficulty Analysis

You are evaluating the **technical difficulty** of an education/edtech idea.

## How to Analyze

1. **Assess the core learning experience requirements**. Educational products range from simple content delivery (video + quiz) to complex adaptive systems (real-time personalization, AI tutoring, interactive simulations). Determine which technical components are required for the core learning experience and whether they can be built with standard tools or require custom engineering.

2. **Evaluate content creation and management complexity**. The volume and type of content needed varies enormously. A platform with 10 curated courses is different from one with 200K+ user-generated courses (Udemy). Video production, interactive content authoring, multi-language support, and content versioning all add complexity. Assess whether content can be AI-generated, crowdsourced, or requires expert creation.

3. **Determine infrastructure and integration requirements**. Video streaming at scale, real-time collaboration, LMS integration (LTI standards), proctoring, and mobile/offline access each add significant technical complexity. Map the idea's requirements against these components.

## Domain Knowledge

### Technical Components by Complexity

#### Tier 1 — Standard (Shopify-level: use existing platforms)
- Pre-recorded video courses + quizzes → Teachable, Thinkific, Kajabi ($50-400/mo)
- Flashcard/study tool → standard web/mobile app
- Content library with search → CMS + search (Algolia)
- Basic analytics (completion rates, scores)
- Timeline: 1-3 months with existing platforms, 2-4 months custom

#### Tier 2 — Moderate (custom development needed)
- **Live video classroom**: WebRTC, Zoom SDK, or Agora. Latency, quality, and scaling challenges.
- **Interactive content authoring**: drag-and-drop course builder for instructors. H5P, custom WYSIWYG editors.
- **LMS integration**: LTI 1.3 standard for embedding in Canvas, Blackboard, Moodle. OAuth, grade passback.
- **Subscription + payments**: Stripe, multi-tier pricing, institutional billing.
- **Mobile app**: React Native or native. Offline content caching for developing markets.
- Timeline: 4-9 months with a small team

#### Tier 3 — Complex (significant engineering investment)
- **Adaptive learning engine**: item response theory (IRT), knowledge tracing, spaced repetition algorithms. Requires 100K+ user interactions to calibrate effectively.
- **AI tutoring**: LLM integration with pedagogical guardrails, Socratic method prompting, answer validation, hallucination prevention in educational context.
- **Real-time collaboration**: collaborative documents, whiteboards (CRDT-based), pair programming environments.
- **Proctoring/integrity**: browser lockdown, webcam monitoring, AI-based cheating detection. Privacy and ethical concerns.
- **Simulation/lab environments**: virtual labs (science, coding sandboxes). Cloud-based compute, security sandboxing.
- Timeline: 6-18 months with dedicated engineering team

### Video Infrastructure

| Requirement | Solution | Cost at Scale |
|---|---|---|
| Pre-recorded video hosting | Mux, Cloudflare Stream, Vimeo OTT | $0.01-0.05/min viewed |
| Live 1-to-many (lecture) | Mux Live, Agora, Amazon IVS | $0.50-2.00/hour/viewer |
| Live many-to-many (classroom) | Zoom SDK, Agora, Daily.co | $0.03-0.10/min/participant |
| Video recording + editing | Built-in recorder, Loom-style | Moderate dev effort |

### AI/LLM Integration Considerations

- **AI tutor**: OpenAI/Anthropic API ($0.01-0.10 per interaction). Must prevent harmful/incorrect answers. Educational context requires Socratic approach (guide, don't just answer).
- **Content generation**: auto-generate quizzes, summaries, flashcards from source material. Good for scaffolding but quality review required.
- **Assessment**: AI-powered essay grading, code review. Requires calibration against human graders.
- **Personalization**: learning path recommendation based on performance data. Cold-start problem with new users.
- **Cost warning**: AI API costs can scale rapidly. At 1M+ users with heavy AI interaction, API costs can reach $50K-200K+/month.

### Integration Standards

- **LTI (Learning Tools Interoperability)**: standard for embedding tools in LMS. LTI 1.3 is current. Required for institutional adoption.
- **SCORM/xAPI**: standards for tracking learning activities. SCORM is legacy but still required by many enterprise LMS. xAPI (Tin Can) is modern.
- **SIS Integration**: Student Information System integration for institutional products (PowerSchool, Infinite Campus).

## Scoring Guide (Higher = Easier to Build)

- **80-100**: Standard content delivery — launchable on Teachable/Thinkific or a simple custom app. Video + quiz, basic analytics, standard auth. Example: a curated course platform for a specific professional skill with pre-recorded content.

- **60-79**: Moderate complexity — live video, LMS integration, or subscription billing. Achievable with a small engineering team in 4-6 months. Example: a live tutoring marketplace with scheduling, video calls, and payment processing.

- **40-59**: Significant engineering — adaptive learning engine, AI tutoring with guardrails, or real-time collaboration. Needs dedicated technical team and 6-12 months. Example: an AI-powered adaptive math learning platform with spaced repetition and progress tracking.

- **20-39**: Deep technical challenges — virtual lab environments, advanced proctoring, multi-language real-time translation, or complex simulation. 12-18+ months with senior engineers. Example: a cloud-based science lab simulation platform with real-time physics engines.

- **0-19**: Research-level problems — unproven adaptive algorithms, real-time AR/VR learning environments, or brain-computer interface learning tools. Requires fundamental research. Example: an immersive VR medical training simulator with haptic feedback.
