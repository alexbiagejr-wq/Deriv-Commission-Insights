---
name: Expo SecureStore on browser preview
description: An Expo SecureStore web shim failed in Replit's browser preview; preserve secure native storage and keep web credentials in memory only.
---

Expo SDK 57's browser preview threw `default.getValueWithKeyAsync is not a function` when `SecureStore.getItemAsync` was called. Keep browser-preview credentials in memory only and use SecureStore on iOS and Android.

**Why:** Persisting a credential in AsyncStorage on web would silently weaken the app's storage guarantee, while the browser shim can fail at startup.

**How to apply:** Guard SecureStore reads, writes, and deletes with `Platform.OS !== 'web'`. AsyncStorage remains suitable for nonsecret settings, but never use it as a web fallback for tokens.
