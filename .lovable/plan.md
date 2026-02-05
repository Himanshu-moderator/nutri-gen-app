

# Splash Screen Animation Enhancement

## Current State
The splash screen currently has quick 0.3s animations with a 300ms delay before completing. While functional, the animations feel a bit rushed.

## Changes

### 1. Increase Animation Durations
Update all animation timings from **0.3s → 0.6s** for a more luxurious, premium feel:

- **Container fade**: Keep at 0.6s for exit transition
- **Content scale-in**: 0.3s → 0.6s with smoother easing
- **Logo rotation**: 0.3s → 0.6s 
- **Glow pulse effect**: 0.6s → 1s (slower, more subtle)
- **Brand name slide-in**: 0.3s → 0.5s with staggered delay
- **Tagline slide-in**: 0.3s → 0.5s with increased staggered delay

### 2. Smoother Easing Curves
Replace the current easing with more natural, fluid curves:

- Use `[0.22, 1, 0.36, 1]` (custom ease-out) for main animations
- This creates a gentle deceleration that feels more polished

### 3. Adjust Completion Timing
Increase the `setTimeout` delay from **300ms → 800ms** so users can appreciate the full animation before transitioning to the trial popup.

### 4. Stagger Delays
Slightly increase the stagger between brand name and tagline appearing:
- Brand name delay: 0.1s → 0.2s
- Tagline delay: 0.15s → 0.35s

This creates a more elegant reveal sequence: Logo → Brand Name → Tagline

---

## Result
A smooth, 1.5-2 second total splash experience that feels premium and polished while still respecting users' time.

