# Design

## Visual Direction

Product dashboard inspired by the provided soft glass finance reference: pale cool page background, large frosted work surfaces, subtle blue-lavender gradients, compact rounded controls, dark ink text and calm status colors. The interface is a real task tool, not a landing page.

## Color Tokens

- Background: cool pale blue-gray.
- Surface: translucent white glass with subtle border.
- Ink: near-black blue.
- Muted text: blue-gray.
- Primary: blue-violet gradient for active navigation and primary controls.
- Accent: black for strongest action buttons.
- Success: green.
- Warning: amber.
- Danger: red-orange.

## Typography

Use a single modern sans stack for product clarity: Inter-like system UI, Manrope-like fallback, `Segoe UI`, Arial, sans-serif. Headings are compact and confident. Labels, table cells, and buttons use deliberate fixed sizes.

## Components

- App shell with right sidebar.
- Frosted panels for task list, analytics, admin forms, and calendar.
- Project sections with stable rows and expandable chronology.
- Project-level tabs for task rows and link-purchase reports.
- Source-backed report blocks with compact stats plus a scannable row table.
- Segmented controls for plan/fact and admin tabs.
- Inline creation forms instead of modal-first flows.
- Small colored dots and badges for status.

## Layout

Desktop is a three-zone app: main content, analytics column, right navigation. Mobile collapses to a top navigation strip and single-column content. Calendar stays useful at 390px through horizontal day cards instead of full spreadsheet overflow.

## Motion

Short state transitions, hover lifts, and expandable chronology animations only. No decorative page-load choreography.
