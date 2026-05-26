---
name: gsap-timeline
description: Official GSAP skill for timelines â€” gsap.timeline(), position parameter, nesting, playback. Use when sequencing animations, choreographing keyframes, or when the user asks about animation sequencing, timelines, or animation order (in GSAP or when recommending a library that supports timelines).
license: MIT
---

# GSAP Timeline

## When to Use This Skill

Apply when building multi-step animations, coordinating several tweens in sequence or parallel, or when the user asks about timelines, sequencing, or keyframe-style animation in GSAP.

**Related skills:** For single tweens and eases use **gsap-core**; for scroll-driven timelines use **gsap-scrolltrigger**; for React use **gsap-react**.

## Creating a Timeline

```javascript
const tl = gsap.timeline();
tl.to(".a", { x: 100, duration: 1 })
  .to(".b", { y: 50, duration: 0.5 })
  .to(".c", { opacity: 0, duration: 0.3 });
```

By default, tweens are **appended** one after another. Use the **position parameter** to place tweens at specific times or relative to other tweens.

## Position Parameter

Third argument (or position property in vars) controls placement:

- **Absolute**: `1` â€” start at 1 second.
- **Relative (default)**: `"+=0.5"` â€” 0.5s after end; `"-=0.2"` â€” 0.2s before end.
- **Label**: `"labelName"` â€” at that label; `"labelName+=0.3"` â€” 0.3s after label.
- **Placement**: `"<"` â€” start when recently-added animation starts; `">"` â€” start when recently-added animation ends (default); `"<0.2"` â€” 0.2s after recently-added animation start.

Examples:

```javascript
tl.to(".a", { x: 100 }, 0);           // at 0
tl.to(".b", { y: 50 }, "+=0.5");      // 0.5s after last end
tl.to(".c", { opacity: 0 }, "<");     // same start as previous
tl.to(".d", { scale: 2 }, "<0.2");    // 0.2s after previous start
```

## Timeline Defaults

Pass defaults into the timeline so all child tweens inherit:

```javascript
const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "power2.out" } });
tl.to(".a", { x: 100 }).to(".b", { y: 50 }); // both use 0.5s and power2.out
```

## Timeline Options (constructor)

- **paused: true** â€” create paused; call `.play()` to start.
- **repeat**, **yoyo** â€” same as tweens; apply to whole timeline.
- **onComplete**, **onStart**, **onUpdate** â€” timeline-level callbacks.
- **defaults** â€” vars merged into every child tween.

## Labels

Add and use labels for readable, maintainable sequencing:

```javascript
tl.addLabel("intro", 0);
tl.to(".a", { x: 100 }, "intro");
tl.addLabel("outro", "+=0.5");
tl.to(".b", { opacity: 0 }, "outro");
tl.play("outro");  // start from "outro"
tl.tweenFromTo("intro", "outro"); // pauses the timeline and returns a new Tween that animates the timeline's playhead from intro to outro with no ease.
```

## Nesting Timelines

Timelines can contain other timelines.

```javascript
const master = gsap.timeline();
const child = gsap.timeline();
child.to(".a", { x: 100 }).to(".b", { y: 50 });
master.add(child, 0);
master.to(".c", { opacity: 0 }, "+=0.2");
```

## Controlling Playback

- **tl.play()** / **tl.pause()**
- **tl.reverse()** / **tl.progress(1)** then **tl.reverse()**
- **tl.restart()** â€” from start.
- **tl.time(2)** â€” seek to 2 seconds.
- **tl.progress(0.5)** â€” seek to 50%.
- **tl.kill()** â€” kill timeline and (by default) its children.

## Official GSAP Best practices

- âœ… Prefer timelines for sequencing
- âœ… Use the **position parameter** (third argument) to place tweens at specific times or relative to labels.
- âœ… Add **labels** with `addLabel()` for readable, maintainable sequencing.
- âœ… Pass **defaults** into the timeline constructor so child tweens inherit duration, ease, etc.
- âœ… Put ScrollTrigger on the timeline (or top-level tween), not on tweens inside a timeline.

## Do Not

- âŒ Chain animations with **delay** when a **timeline** can sequence them; prefer `gsap.timeline()` and the position parameter for multi-step animation.
- âŒ Forget to pass **defaults** (e.g. `defaults: { duration: 0.5, ease: "power2.out" }`) when many child tweens share the same duration or ease.
- âŒ Forget that **duration** on the timeline constructor is not the same as tween duration; timeline â€œdurationâ€ is determined by its children.
- âŒ Nest animations that contain a ScrollTrigger; ScrollTriggers should only be on top-level Tweens/Timelines.

