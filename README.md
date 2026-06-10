# Interactive Globus

Next.js hero prototype with an interactive 3D world globe. Users can drag the globe, select a country, and see the selected country reflected in a tooltip and static card.

## Preview

https://interactive-globe-map.vercel.app

## Requirements

- Node.js 20+
- pnpm 10+

This project is configured with:

- Next.js App Router
- React
- Three.js
- d3-geo
- topojson-client
- world-atlas

## Setup

Install dependencies:

```bash
pnpm install
```

Start local dev server:

```bash
pnpm dev
```

Open:

```txt
http://localhost:3000
```

## Scripts

```bash
pnpm dev          # start Next dev server
pnpm build        # production build
pnpm start        # start production server after build
pnpm check-types  # TypeScript check
pnpm lint         # lint, if Next lint command is available
```

## Project Structure

```txt
app/
  layout.tsx
  page.tsx
  globals.css

components/
  hero/
    index.ts
    hero-map.tsx
    use-interactive-globe.ts
    country-card.tsx
    connector-overlay.tsx
    globe-texture.ts
    globe-utils.ts
    countries.ts
    constants.ts
    map-style.ts
    types.ts
    world-atlas.d.ts
```

## Main Files

`components/hero/hero-map.tsx`

Top-level hero coordinator. Owns selected country state, refs, and layout composition.

`components/hero/use-interactive-globe.ts`

Creates and manages the Three.js scene, drag behavior, country picking, ctrl-scroll zoom, tooltip/card connector positioning, and cleanup.

`components/hero/globe-texture.ts`

Draws country shapes into high-resolution canvas textures:

- base globe texture
- active country overlay texture

`components/hero/map-style.ts`

Controls globe colors:

```ts
export const mapStyle = {
  ocean: '#1325c2',
  country: 'rgba(117, 158, 246, 0.20)',
  activeCountry: 'rgba(214, 218, 255, 0.50)',
  activeCountryInnerShadow: 'rgba(214, 218, 255, 0.20)',
  countryBorder: '#fff',
  activeCountryBorder: '#dbdbff',
};
```

`components/hero/constants.ts`

Controls globe/camera/texture constants. Important knobs:

```ts
TEXTURE_WIDTH
TEXTURE_HEIGHT
CAMERA_DISTANCE
MIN_CAMERA_DISTANCE
MAX_CAMERA_DISTANCE
GLOBE_RADIUS
```

`components/hero/country-card.tsx`

Static placeholder card. It currently uses selected country name, but the rest of the card content is static placeholder text.

## Interaction Behavior

- Drag/swipe globe: rotates freely.
- Click country: selects country and updates active fill, tooltip, and card title.
- Ctrl + scroll: zooms in/out.
- Normal scroll: page scroll remains normal.
- Auto-centering is intentionally disabled.
- Auto-spin is intentionally disabled.

## Responsive Behavior

Desktop:

- Globe is large and shifted left.
- Tooltip and connector line are visible.
- Card sits on the right.
- Bottom fade blends the globe into the page background.

Small screens:

- Globe is centered and fully visible.
- Tooltip and connector are hidden.
- Card moves below globe.

Responsive behavior lives in `app/globals.css`.

## Replacing Static Card Data

Right now, only country selection is dynamic. To connect real data:

1. Add a data source keyed by country id or country name.
2. Replace placeholder text in `components/hero/country-card.tsx`.
3. Pass real data from `components/hero/hero-map.tsx`.

The selected country id is stored in:

```ts
const [selectedId, setSelectedId] = useState("643");
```

Country ids come from `world-atlas/countries-10m.json`.

## Styling Notes

Global hero layout and responsive CSS are in:

```txt
app/globals.css
```

Important CSS variables:

```css
--navbar-height: 112px;
--hero-gap: 2rem;
--hero-content-height: calc(100svh - var(--navbar-height) - var(--hero-gap));
--globe-size: 92vw;
```

The navbar is not implemented yet. `--navbar-height` reserves space for it.

## Performance Notes

The globe uses an `8192x4096` texture for visual quality. This improves zoom/detail but costs memory and initial render time.

If performance becomes more important than close-up quality, reduce:

```ts
TEXTURE_WIDTH = 4096;
TEXTURE_HEIGHT = 2048;
```

in `components/hero/constants.ts`.

## Verification

Before pushing:

```bash
pnpm check-types
pnpm build
```
