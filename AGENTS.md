# Project Instructions
## Design System
Before creating or modifying any user interface, always read:
1. DESIGN.md
2. src/app.css
These files are the visual source of truth for this project.
### Responsibilities
DESIGN.md defines:
- visual direction
- design philosophy
- typography usage
- visual hierarchy
- spacing principles
- layout
- component appearance
- interaction patterns
- do/don't rules
src/app.css defines:
- Tailwind v4 theme
- exact colors
- typography tokens
- spacing tokens
- radii
- shadows
- other implementation tokens
## UI implementation rules
Always follow DESIGN.md.
Always prefer Tailwind tokens defined in app.css.
Do not invent arbitrary visual values when a design token already exists.
Avoid arbitrary Tailwind classes such as:
- bg-[#xxxxxx]
- text-[#xxxxxx]
- rounded-[xxpx]
- shadow-[...]
- p-[xxpx]
- m-[xxpx]
unless DESIGN.md explicitly requires a value that has no corresponding token.
## Components
Prefer reusable components.
Keep buttons, cards, inputs, navigation, tables, modals and other
UI elements visually consistent across the entire application.
Do not create multiple visual variants without a functional reason.
## Fidelity
The goal is a high-fidelity prototype, not a wireframe.
Screens should look polished and production-ready.
Pay special attention to:
- typography
- whitespace
- alignment
- hierarchy
- component density
- border treatment
- radius
- shadows
- responsive behavior
- hover states
- focus states
- loading states
- empty states
## Final review
After implementing each screen:
1. Read DESIGN.md again.
2. Compare the implementation with its rules.
3. Review the Tailwind tokens.
4. Remove unnecessary arbitrary values.
5. Fix visual inconsistencies.
6. Verify desktop and mobile layouts.