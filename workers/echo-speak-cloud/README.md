# Echo Speak Cloud

Smart TTS cloud router with ElevenLabs, Edge TTS, and local GPU (Qwen3-TTS) — 49 endpoints for voice synthesis, transcription, emotion, and audio studio.

## Purpose

Echo Speak Cloud is the unified voice synthesis and speech processing hub for Echo Omega Prime. It intelligently routes TTS requests across three providers (ElevenLabs for premium, Edge TTS for free, local GPU for Qwen3-TTS with emotion tags), with automatic fallback chains. Includes a full audio studio for multi-chapter audiobook production, voice cloning, speech-to-text, emotion detection, dialogue orchestration, and a Durable Object for conversational voice sessions.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check with provider status |
| GET | / | Yes | Service info |
| GET | /capabilities | Yes | List all capabilities by category |
| GET | /models | Yes | Available TTS models by provider |
| GET | /emotion-tags | Yes | Supported emotion tags for Qwen3-TTS |
| GET | /api-info | Yes | Full API documentation |
| POST | /tts | Yes | Smart-routed TTS synthesis |
| POST | /tts/json | Yes | TTS with JSON response (base64 audio) |
| POST | /tts/fast | Yes | Fast TTS (cache-first, Edge TTS) |
| POST | /tts/stream | Yes | Streaming TTS synthesis |
| POST | /tts/chunked | Yes | Chunked TTS for long text |
| POST | /tts/batch | Yes | Batch TTS (multiple texts) |
| POST | /tts/ssml | Yes | TTS with SSML input |
| GET | /voices | Yes | List all available voices |
| POST | /voices/preview | Yes | Preview a voice with sample text |
| POST | /voices/compare | Yes | Compare multiple voices side by side |
| POST | /voices/clone | Yes | Clone a voice (ElevenLabs) |
| POST | /transcribe | Yes | Speech-to-text transcription |
| POST | /stt | Yes | Speech-to-text (alias) |
| POST | /speech-to-speech | Yes | Voice transformation |
| POST | /audio-isolation | Yes | Isolate vocals from audio |
| POST | /voice-design/:action | Yes | Voice design operations |
| POST | /analyze | Yes | Analyze audio properties |
| POST | /gpu/cleanup | Yes | Cleanup GPU resources |
| GET | /gpu/status | Yes | GPU tunnel health status |
| POST | /dialogue/parse | Yes | Parse dialogue script |
| POST | /dialogue | Yes | Multi-voice dialogue synthesis |
| GET | /presets | Yes | List voice presets |
| POST | /presets | Yes | Create a voice preset |
| GET | /pronunciations | Yes | List custom pronunciations |
| POST | /pronunciations | Yes | Add custom pronunciation |
| GET | /studio | Yes | List audio studio projects |
| POST | /studio | Yes | Create a studio project |
| GET | /studio/:id | Yes | Get studio project |
| POST | /studio/:id/chapter | Yes | Add chapter to project |
| POST | /studio/:id/render | Yes | Render full audiobook |
| GET | /cache/stats | Yes | TTS cache statistics |
| DELETE | /cache/:key | Yes | Delete cached audio |
| POST | /cache/cleanup | Yes | Cleanup expired cache entries |
| GET | /stats | Yes | Generation statistics |
| GET | /history | Yes | Generation history |
| GET | /metrics | Yes | Performance metrics |
| POST | /emotion/analyze | Yes | Analyze emotion in text |
| POST | /emotion/detect | Yes | Detect emotion from audio |
| POST | /emotion/apply-tags | Yes | Apply emotion tags to text |
| POST | /tts/orchestrate | Yes | Orchestrate multi-voice TTS |
| GET | /ws/conversation | Yes | WebSocket conversational voice |
| GET | /ws/conversation/config | Yes | Conversation config |
| POST | /tts/conversational | Yes | Conversational TTS |
| GET | /ws/conversation/status | Yes | Conversation session status |
| POST | /text/prepare | Yes | Prepare text for speech |
| POST | /init-schema | Yes | Initialize D1 schema |

## Bindings

- **DB** (D1): `echo-speak-cloud` — Generation history, presets, pronunciations, studio projects
- **CACHE** (KV): TTS audio caching and rate limiting
- **MEDIA** (R2): `echo-prime-media` — Rendered audio files
- **VOICE_CONVERSATION** (Durable Object): Conversational voice sessions

## Security

- Global auth middleware via `X-Echo-API-Key` header (v2.2.0 fix — was per-route before)
- Worker-to-worker service binding exemption
- Rate limiting: 60 requests/min per IP
- CORS allowlist: echo-ept.com, echo-op.com, localhost:3000/3001/8420
- Security headers: HSTS, X-Frame-Options DENY, nosniff, CSP
