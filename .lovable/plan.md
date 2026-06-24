## Home menu restructure

Turn the home page into a two-button menu. Clicking either button reveals that section's content with a back button to return to the menu.

### Menu (default view)

Replace the current band/level list with two large buttons stacked under the existing header:

1. **Level by level** — opens the A1–B2 bands + extras (Top 300 verbs, etc.) exactly as they appear today.
2. **Sentence sets** — opens an empty placeholder ("Coming soon") for now.

### Section views

When a button is clicked:
- Hide the menu buttons.
- Show a small "← Back" button above the section content that returns to the menu.
- **Level by level**: render the existing `BANDS.map(...)` block (LevelAccordion + ExtraCard) unchanged.
- **Sentence sets**: render an empty-state card with a short "Nothing here yet" message.

### Technical notes

- Single-file change in `src/routes/index.tsx`.
- Add local state `const [view, setView] = useState<"menu" | "levels" | "sets">("menu")`. No routing changes, no new files.
- Reuse existing `LevelAccordion`, `ExtraCard`, `BANDS`, and i18n keys. No data or store changes.
- The header (gradient banner with title/tagline/intro) stays visible across all three views. The decorative back-arrow inside the header stays as-is; the new in-page Back button is separate and only appears in the two sub-views.
- Button styling: match the existing rounded card look (`rounded-2xl border bg-card shadow-sm`) with an icon + label, consistent with `ExtraCard`.
