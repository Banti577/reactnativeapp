# Frontend Architecture

This app keeps feature code close to the domain it belongs to and keeps shared infrastructure in `src`.

## Folder Roles

- `config`: Runtime configuration such as API base URLs and default identities.
- `constants`: Shared enum-like values and app-wide static messages.
- `redux`: App-wide state using Redux Toolkit slices.
- `features`: Product features grouped by domain. Each feature can own its UI, hooks, domain rules, and feature-specific services.
- `hooks`: Cross-feature reusable hooks only. Feature-specific hooks should live inside `features/<feature>/hooks`.
- `services`: Shared API infrastructure only. Feature-specific services should live inside `features/<feature>/services`.
- `utils`: Pure helpers with no React state and no screen-specific behavior.
- `screens`: Navigation screens. Screens should mostly compose hooks/components and avoid owning SDK or API details directly.

## Voice Feature

The Twilio voice feature lives in `features/voice`:

- `domain`: Voice state shape and validation rules.
- `services`: Voice-specific services such as `phoneService` and permission helpers.
- `hooks`: React orchestration for registration, inbound calls, outbound calls, mute, and hangup.
- `store`: Voice state is stored in `redux/slices/voiceSlice.ts`.
- `components`: Voice-specific presentational components.

Twilio SDK objects such as `Call` and `CallInvite` stay inside hooks/refs because they are non-serializable. Redux stores serializable call state such as `status`, `callerName`, `isMuted`, and loading/error flags.

Voice calling code should import from `src/features/voice/services/phoneService` and read voice UI state from Redux.

Chat code should import from `src/features/chat/services/chatService`.
