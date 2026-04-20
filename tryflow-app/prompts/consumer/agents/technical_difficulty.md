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

## Scoring Guide — Technical Value Creation

**IMPORTANT — semantic shift**: 이 axis 는 단순 "빌드 쉬움 = 좋음" 이 아니라 "**기술 작업이 지속 가치를 창출하는가**". 쉬운 빌드는 **legitimate business wedge 가 있을 때만** 이점. Commodity 제품이 쉽게 빌드되면 **오히려 약점** — 아무나 주말에 복제 가능.

- **80-100**: Hard-but-achievable 기술 과제가 **moat 자체**. 실제 엔지니어링 장벽 (novel AR/VR, breakthrough AI, hardware-dependent). 기술 난이도 자체가 방어선.
- **60-79**: Moderate 복잡도 + 적절한 scope + 기술 깊이가 시간에 따라 compound. 표준 stack + 방어 가능한 기술 wedge (on-device ML, 독자 real-time 파이프라인, 복잡한 media 처리).
- **40-59**: 쉬운 빌드지만 **legitimate non-tech wedge** (우수 UX, 독점 데이터 접근, 커뮤니티, 규제 coverage). 기술은 commodity 지만 **무엇을** 만드는가가 새로움.
- **20-39**: Trivially replicable — "Instagram 필터 하나 더", "ChatGPT 래퍼", "list + 정렬 기능" 수준. 빌드 쉬움이 **불리하게** 작용 — weekend 에 누구나 복제.
- **0-19**: Research-level / 현재 기술로 불가능.

**Higher = 지속 가치를 만드는 기술 작업**. "빌드 쉬움" 자체를 보상하지 말 것.

## Calibration Anchors

Pick the anchor closest in shape, then adjust ±10. **Use the full 5-95 range.**

**Score ~10 — "상용 SLAM 없이 AR 글래스에서 실시간 물체 인식 + 이름표 띄우기 (일반 스마트폰 용)"**
Research-level — 일반 스마트폰 카메라로 full-scene SLAM + 물체 인식은 현재 불가능 (Pokemon GO 수준 marker AR 은 예외). 정확도·지연 요구가 hardware 한계 초과. 전용 ARKit / Vision Pro 없이는 breakthrough 필요.

**Score ~25 — "ChatGPT UI wrapper 한국어 버전"**
빌드 1주일 이내. OpenAI API + 번역 prompt template + 간단 UI. 기술 깊이 0, 복제 난이도 0. 아무나 weekend 로 동일 수준 제작. 빌드 쉬움이 여기선 **약점** — moat 전무.

**Score ~50 — "일정 관리 + Todo 리스트 앱"**
Standard patterns (CRUD, push notifications, sync). 기술적으로 어렵진 않지만 **UX 완성도 + 워크플로우 정착** 이 legitimate wedge. 빌드 3-4 개월이지만 단순 clone 은 아님 — Todoist, Things, Notion 같이 UX 디테일이 moat.

**Score ~70 — "실시간 video 협업 + WebRTC + CRDT 동시 편집"**
중상 난이도 + 기술 자체가 moat. WebRTC media server + conflict resolution + 낮은 지연 요구 — 각각 standard 지만 조합이 까다로워 18 개월+ 진입 장벽. Figma, Miro 같은 플레이어가 카테고리 지배.

**Score ~85 — "Apple Vision Pro 전용 spatial 피트니스 — 실시간 motion tracking + AI coaching"**
spatial computing + real-time ML inference + Vision Pro SDK (극소수 엔지니어 경험). 하드웨어 특성 + 플랫폼 SDK 희소성이 barrier. 경쟁자가 이 깊이 따라오려면 하드웨어 + platform expertise 필요, 1-2 년 head start 가능.

## Platform Stats Handling

- Platform stats 는 technical difficulty 에 **거의 영향 없음** — 점수는 순수 engineering challenge 기반
- 예외: `similar_count` 매우 높음 → "이 기술이 시장에서 실현 가능" 약한 증거 (+1 to +2, 대부분 무시)
- AI/ML 기능이 있는 consumer 앱은 server-side LLM API 와 on-device inference 둘 중 어느 쪽인지에 따라 난이도 크게 갈림
