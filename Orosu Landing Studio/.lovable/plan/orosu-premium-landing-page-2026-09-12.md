# Orosu premium landing page

## What I’ll build
- A complete long-scroll Orosu landing page at `/`, following the supplied warm off-white, white, and near-black editorial direction with selective coral-to-magenta accents.
- A compact floating navigation with desktop anchors, an animated mobile menu, and the supplied Orosu logo.
- Eleven polished sections: hero, problem, career profile transformation, four-step workflow, context matching, feature bento grid, dimensional resume showcase, trust principles, application history, pricing, final call-to-action, plus a minimal footer.
- Lightweight CSS-based 3D document scenes, layered cards, connection lines, mouse parallax on larger screens, scroll reveals, and reduced-motion fallbacks.
- Responsive layouts tailored for narrow phones through wide desktops, with accessible controls, semantic sections, and no horizontal overflow.

## Visual system
- Geist-style geometric sans typography, oversized editorial headings, generous whitespace, compact uppercase labels, 16–28px radii, subtle borders and shadows.
- Warm off-white and crisp white light sections contrasted with full-width near-black story sections.
- Coral, pink, magenta, and orange used only for emphasis, actions, and selected data states.
- The uploaded logo will be served as a project asset and used in the navigation/footer; an unchanged, properly resized copy will become the favicon.

## Technical approach
- Keep the existing TanStack Start foundation while implementing the requested React, TypeScript, Tailwind, and reusable component architecture.
- Split the page into focused landing-page components and shared visual primitives.
- Use IntersectionObserver and CSS transforms rather than a heavy animation package; mouse effects will be disabled on touch-sized layouts.
- Add complete page metadata and verify the finished page at desktop and mobile sizes, including interactions and reduced-motion behavior.
