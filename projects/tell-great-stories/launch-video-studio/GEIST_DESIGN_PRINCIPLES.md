# Geist Design Principles

## Source: Vercel Geist Design System
Reference: https://vercel.com/geist/introduction

---

## Core Philosophy

Geist is Vercel's design system for building **consistent, high-contrast, accessible** web experiences. It emphasizes:

1. **Clarity** - Clean, minimal interfaces with clear hierarchy
2. **Consistency** - Unified patterns across all components
3. **Accessibility** - High contrast color system for readability
4. **Developer Focus** - Designed for technical audiences

---

## Color System

### Gray Scale (Light Mode)
```
--ds-gray-100:  #fafafa   /* Subtle backgrounds */
--ds-gray-200:  #eaeaea   /* Borders, dividers */
--ds-gray-300:  #999999   /* Muted borders */
--ds-gray-400:  #888888   /* Placeholder text */
--ds-gray-500:  #666666   /* Secondary text */
--ds-gray-600:  #444444   /* Body text */
--ds-gray-700:  #333333   /* Strong text */
--ds-gray-800:  #222222   /* Headings */
--ds-gray-900:  #111111   /* Primary text */
--ds-gray-1000: #000000   /* Maximum contrast */
```

### Gray Scale (Dark Mode)
```
--ds-gray-100:  #111111
--ds-gray-200:  #1a1a1a
--ds-gray-300:  #333333
--ds-gray-400:  #555555
--ds-gray-500:  #888888
--ds-gray-600:  #aaaaaa
--ds-gray-700:  #cccccc
--ds-gray-800:  #dddddd
--ds-gray-900:  #eeeeee
--ds-gray-1000: #ffffff
```

### Alpha Grays (for overlays & borders)
```
--ds-gray-alpha-100: rgba(0,0,0,0.05)
--ds-gray-alpha-200: rgba(0,0,0,0.08)
--ds-gray-alpha-300: rgba(0,0,0,0.12)
--ds-gray-alpha-400: rgba(0,0,0,0.16)
--ds-gray-alpha-500: rgba(0,0,0,0.24)
```

### Backgrounds
```
--ds-background-100: #ffffff   /* Primary background */
--ds-background-200: #fafafa   /* Secondary/subtle background */
```

### Accent Colors
```
/* Blue - Primary accent */
--ds-blue-600: #0070f3
--ds-blue-700: #0070f3
--ds-blue-800: #005fcc

/* Red - Error/Destructive */
--ds-red-700: #e5484d
--ds-red-800: #cd2b31

/* Green - Success */
--ds-green-700: #46a758
--ds-green-800: #388e4a

/* Amber - Warning */
--ds-amber-700: #f5a623
--ds-amber-800: #d4900d
```

### Color Usage Guidelines
- **Colors 1-3**: Component backgrounds (default, hover, active states)
- **Colors 4-6**: Borders (default, hover, active states)
- **Colors 7-8**: High contrast backgrounds (buttons, badges)
- **Colors 9-10**: Text and icons (must meet accessibility standards)

---

## Typography

### Font Families
```
--font-geist-sans: 'Geist', system-ui, -apple-system, sans-serif
--font-geist-mono: 'Geist Mono', 'Menlo', 'Monaco', monospace
```

### Heading Sizes
```
text-heading-72: 72px   /* Marketing heroes */
text-heading-64: 64px
text-heading-56: 56px
text-heading-48: 48px
text-heading-40: 40px
text-heading-32: 32px   /* Dashboard titles */
text-heading-24: 24px   /* Page titles */
text-heading-20: 20px   /* Section titles */
text-heading-16: 16px   /* Card titles */
text-heading-14: 14px   /* Small headings */
```

### Body/Copy Sizes
```
text-copy-24: 24px      /* Marketing hero text */
text-copy-20: 20px      /* Marketing subtext */
text-copy-18: 18px      /* Quotes, featured text */
text-copy-16: 16px      /* Modal body text */
text-copy-14: 14px      /* Default body text - MOST COMMON */
text-copy-13: 13px      /* Secondary/compact text */
```

### Label Sizes (single-line, icon-friendly)
```
text-label-20: 20px
text-label-18: 18px
text-label-16: 16px
text-label-14: 14px     /* MOST COMMON - nav items, form labels */
text-label-13: 13px     /* Secondary labels */
text-label-12: 12px     /* Tiny labels, captions */
```

### Button Text Sizes
```
text-button-16: 16px    /* Large buttons */
text-button-14: 14px    /* Default buttons */
text-button-12: 12px    /* Small/inline buttons */
```

### Font Weights
```
400: Regular    /* Body text */
500: Medium     /* Labels, nav items */
600: Semibold   /* Headings, buttons */
700: Bold       /* Strong emphasis (rare) */
```

### Letter Spacing
```
-0.02em: Headings (tighter)
-0.01em: Large text
 0.00em: Body text (default)
+0.01em: Small caps, labels
```

### Line Heights
```
1.0:   Display headings
1.25:  Headings
1.5:   Body text (default)
1.625: Relaxed body text
```

---

## Spacing Scale

Based on 4px base unit:
```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

### Common Patterns
- **Button padding**: `px-4 py-2` (16px horizontal, 8px vertical)
- **Card padding**: `p-5` or `p-6` (20-24px)
- **Section spacing**: `py-8` to `py-12` (32-48px)
- **Grid gaps**: `gap-4` to `gap-6` (16-24px)
- **Inline spacing**: `gap-2` (8px)

---

## Border Radius

```
--radius-sm:   4px    /* Badges, small elements */
--radius-md:   6px    /* Buttons, inputs */
--radius-lg:   8px    /* Cards, modals */
--radius-xl:   12px   /* Large containers */
--radius-2xl:  16px   /* Hero sections */
--radius-full: 9999px /* Pills, avatars */
```

---

## Shadows

```
/* Subtle elevation */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04),
             0 1px 4px rgba(0,0,0,0.04);

/* Cards, dropdowns */
--shadow-md: 0 2px 4px rgba(0,0,0,0.04),
             0 4px 12px rgba(0,0,0,0.08);

/* Modals, popovers */
--shadow-lg: 0 8px 16px rgba(0,0,0,0.08),
             0 16px 32px rgba(0,0,0,0.08);

/* Hero elements */
--shadow-xl: 0 16px 48px rgba(0,0,0,0.12),
             0 24px 64px rgba(0,0,0,0.08);
```

---

## Component Guidelines

### Buttons

**Primary Button**
- Background: `#000000` (gray-1000)
- Text: `#ffffff`
- Hover: `#333333` (gray-700)
- Active: `#222222` (gray-800)
- Border radius: 6px
- Height: 40px (md), 36px (sm), 48px (lg)
- Padding: 16px horizontal
- Font: 14px, weight 500

**Secondary Button**
- Background: `#ffffff`
- Border: 1px solid `#eaeaea` (gray-200)
- Text: `#000000`
- Hover: Background `#fafafa`, border `#999999`
- Active: Background `#eaeaea`

**Tertiary/Ghost Button**
- Background: transparent
- Text: `#666666` (gray-500)
- Hover: Background `rgba(0,0,0,0.05)`, text `#000000`

### Cards

- Background: `#ffffff`
- Border: 1px solid `#eaeaea`
- Border radius: 8-12px
- Padding: 20-24px
- Hover: Border `#999999` or subtle shadow
- Shadow: None or subtle `shadow-sm`

### Inputs

- Height: 40px
- Background: `#ffffff`
- Border: 1px solid `#eaeaea`
- Border radius: 6px
- Padding: 12px horizontal
- Focus: 2px ring in accent color
- Placeholder: `#888888`

### Navigation

**Sidebar**
- Width: 240px
- Background: `#ffffff`
- Border-right: 1px solid `#eaeaea`

**Nav Items**
- Padding: 8px 12px
- Border radius: 6px
- Active: Background `#fafafa`, text `#000000`
- Hover: Background `rgba(0,0,0,0.04)`
- Text: 14px, weight 500

### Headers

- Background: `#ffffff`
- Border-bottom: 1px solid `#eaeaea`
- Padding: 16-24px
- Title: 20-24px, weight 600, tracking -0.02em
- Subtitle: 14px, color `#666666`

### Modals

- Background: `#ffffff`
- Border radius: 12px
- Shadow: `shadow-lg` or `shadow-xl`
- Backdrop: `rgba(0,0,0,0.5)` with blur
- Padding: 24px
- Max width: 400px (sm), 560px (md), 720px (lg)

### Empty States

- Center aligned
- Icon: 48-64px, color `#888888`
- Heading: 18px, weight 600
- Description: 15px, color `#666666`
- CTA button: Primary style

---

## Transitions

```
/* Default timing */
transition: all 150ms ease;

/* Color changes */
transition: color 100ms ease,
            background-color 100ms ease,
            border-color 100ms ease;

/* Transforms */
transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);

/* Opacity */
transition: opacity 150ms ease;
```

### Animation Keyframes
- `fadeIn`: 200ms
- `slideUp`: 300ms with slight Y translation
- `scaleIn`: 200ms from scale(0.96)

---

## Focus States

- Outline: 2px solid `#0070f3` (accent)
- Outline offset: 2px
- Only show on keyboard navigation (`:focus-visible`)

---

## Accessibility Requirements

1. **Contrast ratios**: Minimum 4.5:1 for text
2. **Focus indicators**: Always visible on keyboard nav
3. **Touch targets**: Minimum 44x44px
4. **Color not sole indicator**: Use icons/text with color

---

## Anti-Patterns (What NOT to Do)

1. **Don't use pure black text on pure white** - Use `#111111` instead
2. **Don't use colored backgrounds for primary actions** - Use black/white
3. **Don't use heavy shadows** - Keep them subtle
4. **Don't use thick borders** - 1px is standard
5. **Don't use rounded corners > 12px** - Except for avatars/pills
6. **Don't use colorful icons** - Use grayscale, accent only on hover/active
7. **Don't center-align body text** - Left-align for readability
8. **Don't use font sizes < 12px** - Accessibility concern

---

## Implementation Checklist

- [ ] Use Geist font family (loaded via Next.js)
- [ ] Apply gray scale correctly (not blue-grays or warm-grays)
- [ ] Buttons are black/white, not colored
- [ ] Borders are subtle `#eaeaea`
- [ ] Shadows are minimal
- [ ] Typography uses correct sizes and weights
- [ ] Spacing follows 4px grid
- [ ] Focus states are visible
- [ ] Transitions are smooth (150ms)
- [ ] Dark mode colors invert properly
