# Project Instructions — Stitch Website Workflow

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- Stitch MCP (connected)

---

## Workflow automatique

When the user asks to create, design, or build any website, page, or screen,
**always follow this workflow in order**:

---

### Step 1: Enhance the Prompt (`/enhance-prompt`)

Before doing anything, run the `/enhance-prompt` skill on the user's request.
This transforms vague ideas into polished, Stitch-optimized prompts with:
- Specific UI/UX keywords and atmosphere descriptors
- Design system context from the project
- Structured output for better generation results

> Skip this step only if the user provides a very detailed prompt already.

---

### Step 2: Generate the Design System (`/taste-design`)

Run the `/taste-design` skill to generate a `DESIGN.md` file that defines:
- Typography (font families, sizes, weights)
- Color palette (primary, secondary, accent, neutrals)
- Spacing and layout rules
- Component style guidelines (buttons, cards, inputs)
- Anti-generic UI standards (no boring defaults)

> Skip this step if a DESIGN.md already exists in the project.

---

### Step 3: Generate a Quick Prototype (`/stitch-design`)

Before building the full website, run the `/stitch-design` skill to generate
a preview of the homepage and 2-3 key UI elements only:
- Hero section
- Navigation bar
- One representative section (features, pricing, or CTA)

Then **stop and show the result to the user**. Ask:
> "Here is a preview of the homepage and key elements.
> Do you want to adjust the style, layout, or content
> before I build the full website?"

Wait for the user's approval or feedback before continuing to Step 4.

> Skip this step if the user explicitly says "build the full site" or "skip preview".

---

### Step 4: Build the Full Website (`/stitch-loop`)

Once the user approves the prototype, take the enhanced prompt from Step 1
and run the `/stitch-loop` skill to build the complete multi-page website:
- Automated screen generation for each page
- File organization and validation
- Baton-passing loop for iterative refinement

---

### Step 5: Document the Design (`/design-md`)

Run the `/design-md` skill to analyze the generated Stitch project and
produce a comprehensive `DESIGN.md` file documenting:
- Colors, typography, spacing extracted from the screens
- Component patterns and design tokens
- Natural language optimized for future Stitch generation

> Merge with the file from Step 2 if it already exists.

---

### Step 6: Convert to React Components (`/react-components`)

Run the `/react-components` skill to convert all Stitch screens into
modular React components:
- AST-based validation for clean component structure
- Design token consistency across all components
- Vite-compatible file structure
- TypeScript types generated automatically

---

### Step 7: Intelligent shadcn/ui Integration (`/shadcn-ui`)

After React conversion, run the `/shadcn-ui` skill to intelligently replace
UI elements with shadcn/ui components **only where it makes sense**:

**Always replace with shadcn/ui:**
- Buttons → `Button`
- Text inputs, textareas → `Input`, `Textarea`
- Dropdowns, selects → `Select`, `Combobox`
- Checkboxes, radio buttons, toggles → `Checkbox`, `RadioGroup`, `Switch`
- Modals, dialogs → `Dialog`, `AlertDialog`
- Tooltips, popovers → `Tooltip`, `Popover`
- Notifications → `Toast`
- Data tables → `DataTable`
- Tabs → `Tabs`
- Accordions → `Accordion`
- Date pickers → `Calendar`, `DatePicker`
- Navigation menus → `NavigationMenu`
- Loading states → `Skeleton`
- Badges, tags → `Badge`

**Keep as custom Tailwind (do NOT replace):**
- Hero sections and full-width banners
- Page layouts and grid structures
- Sidebars with complex custom logic
- Marketing sections (features, pricing, testimonials)
- Animated or illustrative elements
- Any element that would lose its visual identity if replaced

After replacing, ensure all shadcn/ui components:
- Inherit the color tokens from DESIGN.md
- Use the project's Tailwind config (no default shadcn colors)
- Stay consistent with the overall design system

---

### Step 8: Generate Walkthrough Video (`/remotion`)

Run the `/remotion` skill to generate a professional walkthrough video
of the website with:
- Smooth transitions between pages
- Zooming effects on key UI elements
- Text overlays explaining each section
- Exportable MP4 for demos and presentations

> Run this step only when the user explicitly asks for a video or demo.

---

## Quick commands

| What you say | What Claude does |
|---|---|
| "build a [website]" | Steps 1 → 2 → 3 → (wait) → 4 → 5 → 6 → 7 |
| "looks good, continue" | Continues from Step 4 |
| "skip preview, build full site" | Steps 1 → 2 → 4 → 5 → 6 → 7 |
| "improve my prompt: [idea]" | Step 1 only |
| "generate design system" | Step 2 only |
| "show me a preview" | Step 3 only |
| "build the full site" | Step 4 only |
| "document the design" | Step 5 only |
| "convert to React" | Step 6 only |
| "integrate shadcn/ui" | Step 7 only |
| "make a demo video" | Step 8 only |

---

## Design preferences

- **Mode**: Dark mode first, light mode optional
- **Style**: Clean, minimal, modern (inspired by Linear, Vercel, Raycast)
- **Colors**: To be defined in DESIGN.md (Step 2)
- **Audience**: To be specified per project

---

## When NOT to use Stitch

**Never call Stitch MCP automatically for:**
- Small edits (colors, spacing, fonts, text content)
- Bug fixes or TypeScript errors
- Adding or modifying existing components
- Refactoring or restructuring code
- Any change that can be done directly in the existing files

**Only use Stitch when the user explicitly asks to:**
- Generate a new page from scratch
- Redesign an existing page completely
- Create new UI screens or flows
- Uses keywords like "generate", "redesign", "create from scratch"

When in doubt — edit locally, do NOT call Stitch.

---

## Notes

- Always pause after Step 3 and wait for user approval before continuing
- Always check if DESIGN.md exists before running Steps 2 or 5
- Always validate React components after Step 6
- In Step 7, never replace marketing/layout elements with shadcn/ui — keep them custom
- The Stitch MCP is connected globally — no extra setup needed
- Skills are located in ~/.agents/skills/
