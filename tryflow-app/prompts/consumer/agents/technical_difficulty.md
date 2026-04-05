# Consumer App — Technical Difficulty Analysis

You are evaluating the **technical complexity** of building a consumer app product.

## How to Analyze

1. **Core technical challenge**: what is the hardest engineering problem to solve?
2. **Platform and device scope**: native vs cross-platform, iOS vs Android, device fragmentation
3. **Scale readiness**: what infrastructure is needed when the app goes viral?

## Domain Knowledge

### Platform Strategy
- **Native (Swift/Kotlin)**: best performance, full API access, Apple/Google design guidelines — but 2x development cost
- **Cross-platform (React Native, Flutter)**: 70-90% code sharing, faster iteration — but platform-specific bugs, performance ceiling for GPU-heavy features
- **Flutter**: strong for custom UI, growing ecosystem, Dart language — used by Google Pay, BMW, Alibaba
- **React Native**: largest ecosystem, JavaScript talent pool — used by Instagram, Discord, Shopify
- **Web-wrapped (Capacitor, PWA)**: cheapest but worst UX, limited native API access — fine for MVPs, not for retention-critical apps
- Rule of thumb: start cross-platform unless camera/AR/audio/GPU performance is core to the experience

### Real-Time Features
- **Chat/messaging**: WebSockets or MQTT, message ordering, delivery receipts, offline queue — technically well-solved but operationally complex at scale
- **Live video/audio**: WebRTC for P2P, media servers (Agora, Twilio, LiveKit) for group calls — latency-sensitive, expensive infrastructure
- **Real-time collaboration**: CRDTs or OT for conflict resolution — complex to implement correctly
- **Live feeds/notifications**: push notification infrastructure (APNs, FCM), real-time event streaming
- **Multiplayer/gaming**: deterministic game state, lag compensation, server reconciliation

### Media Processing and CDN
- **Image pipeline**: upload → resize → compress → CDN — use managed services (Cloudinary, imgix) or S3+CloudFront
- **Video processing**: transcoding (H.264/H.265/VP9/AV1), adaptive bitrate streaming (HLS/DASH), thumbnail generation — expensive compute
- **Audio processing**: noise cancellation, spatial audio, real-time effects — specialized DSP knowledge
- **CDN costs**: at scale, media-heavy apps spend $0.01-0.10 per GB transferred — video apps can burn $100K+/month on CDN alone
- **Content delivery**: global edge caching critical for <100ms load times — Cloudflare, Fastly, CloudFront

### Offline Capability
- **Local-first architecture**: sync engines (Realm, WatermelonDB, PowerSync), conflict resolution strategies
- **Offline-first UX**: optimistic updates, queue actions, graceful degradation
- **Data sync**: bidirectional sync between device and server is one of the hardest problems in mobile — clock skew, merge conflicts, bandwidth constraints
- Critical for: travel apps, productivity tools, health trackers, any app used in low-connectivity areas

### Push Notifications
- **APNs (Apple)** and **FCM (Google)**: different APIs, delivery guarantees, and payload limits
- **Notification timing and personalization**: smart send-time optimization improves open rates 2-3x
- **Notification fatigue**: users who disable notifications rarely re-enable — budget carefully
- **Rich notifications**: images, action buttons, inline replies — platform-specific implementations

### Device Fragmentation
- **iOS**: relatively uniform — ~6 screen sizes, 2-3 OS versions to support
- **Android**: 24,000+ distinct devices, screen sizes from 4" to foldables, OS versions 10-15 in active use
- **Performance budgets**: budget Android devices (2GB RAM, weak GPU) are the majority globally — must test on low-end hardware
- **Sensor access**: camera, GPS, accelerometer, gyroscope, NFC, Bluetooth — availability varies by device and OS version

### AI/ML on Device
- **On-device inference**: Core ML (Apple), TensorFlow Lite, ONNX Runtime — enables offline AI, privacy-preserving features
- **Use cases**: photo enhancement, voice recognition, real-time filters, text prediction, health anomaly detection
- **Model size constraints**: mobile models typically <50MB for acceptable download/memory impact
- **Server-side AI**: LLM features, complex recommendation engines, content moderation — requires API calls and latency management

## Scoring Guide (Higher = Easier to Build)

- **80-100**: Standard CRUD app, API-driven content display, well-known patterns, cross-platform viable (e.g., simple utility, list-based app)
- **60-79**: Moderate complexity — camera/media features, basic real-time, standard push notifications, some native API usage
- **40-59**: Significant engineering — real-time chat/video, complex media pipeline, offline sync, cross-platform performance challenges
- **20-39**: Deep technical challenges — on-device ML, live multiplayer, novel sensor integration, custom rendering engine
- **0-19**: Research-level problems — novel AR/VR rendering, breakthrough speech/vision AI, hardware-dependent features not yet standardized
