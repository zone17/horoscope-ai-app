# Glassmorphic UI Design System

## Overview

The Horoscope AI application features a modern, light, and elegant glassmorphic UI design. This document outlines the key components, styles, and implementation details of the design system to ensure consistency across the application.

## Core Design Principles

1. **Glassmorphic Elements**: Translucent, borderless components with subtle backdrop blur
2. **Light Typography**: Use of extralight font weights for a modern, cutting-edge feel
3. **Subtle Animations**: Smooth transitions and subtle hover effects
4. **Cosmic Theme**: Space-inspired color palette with gradients and glows
5. **Responsive Design**: Fully adaptable to different screen sizes

## Color System

### Base Colors
- Background: Deep cosmic gradient `linear-gradient(150deg, #0f0c29 0%, #302b63 50%, #24243e 100%)`
- Text: White/off-white for maximum readability
- Accents: Purple, indigo, and amber tones

### Opacity Guidelines
- Card backgrounds: `bg-white/5` (5% opacity)
- Borders (when used): `border-white/5` or `border-indigo-100/10`
- Text primary: `text-white` or `text-indigo-100` (90-100% opacity)
- Text secondary: `text-indigo-100/80` (80% opacity)

## Typography

### Font Family
```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
```

### Font Weights
- Headings: `font-extralight` (200 weight)
- Body text: `font-extralight` or `font-light` (200-300 weight)
- UI elements: `font-light` or `font-normal` (300-400 weight)

### Font Features
```css
font-feature-settings: "ss01", "ss02", "cv01", "cv02", "calt", "kern";
text-rendering: optimizeLegibility;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### Letter Spacing
- Headings: `-0.025em` (tight)
- Body text: `-0.01em` to `normal`
- Labels and small text: `0.02em` (slightly looser)

## Glassmorphic Components

### Card Component
```css
.card-glassmorphic {
  @apply bg-white/5 backdrop-blur-md border-0 shadow-lg 
         hover:bg-white/8 transition-all duration-300 rounded-xl;
}
```

Implementation in ZodiacCard:
```jsx
<Card className="h-auto pb-4 relative overflow-hidden card-glassmorphic border-0 shadow-xl">
  {/* Card content */}
</Card>
```

### Button Component
```css
/* Cosmic variant */
.cosmic-button {
  @apply bg-white/5 text-white hover:bg-white/10 shadow-lg 
         transition-all duration-300 border-0 backdrop-blur-sm 
         font-extralight tracking-wide;
}
```

Implementation:
```jsx
<Button variant="cosmic" size="sm" onClick={handleClick}>
  View Details
</Button>
```

### Input Fields
```css
.glassmorphic-input {
  @apply bg-white/5 border-0 backdrop-blur-sm 
         focus:ring-1 focus:ring-indigo-300/30 text-white placeholder-white/50
         font-light rounded-lg px-4 py-2;
}
```

## Animation System

### Hover Transitions
- Duration: 300-500ms
- Timing function: `cubic-bezier(0.4, 0, 0.2, 1)` or spring physics
- Properties to animate: opacity, background, transform, shadow

### Page Transitions
- Initial load: Fade in + slight rise (y-axis)
- Between views: Cross-fade

### Motion Effects

Using Framer Motion for card hover effects:
```jsx
const cardVariants = {
  initial: { 
    y: 20, 
    opacity: 0,
  },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: 'spring',
      stiffness: 260,
      damping: 20 
    }
  },
  hover: { 
    y: -5, 
    transition: { 
      type: 'spring', 
      stiffness: 400, 
      damping: 17 
    }
  }
};

<motion.div
  variants={cardVariants}
  initial="initial"
  animate="animate"
  whileHover="hover"
>
  {/* Component content */}
</motion.div>
```

## Layout System

### Grid Layout
- Mobile: Single column
- Tablet: Two columns
- Desktop: Three columns
- Gap: `gap-6 md:gap-8`

### Spacing Scale
- Extra small: 0.25rem (4px)
- Small: 0.5rem (8px)
- Medium: 1rem (16px)
- Large: 1.5rem (24px)
- Extra large: 2rem (32px)
- 2xl: 3rem (48px)

### Container Width
- Max width: `max-w-7xl`
- Padding: `px-4 md:px-8`

## Special Effects

### Backdrop Blur
```css
.backdrop-blur-md {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.backdrop-blur-lg {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
```

### Gradient Overlays
```css
/* Card background gradient */
<div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 mix-blend-overlay"></div>

/* Radial gradient */
<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent to-black/30"></div>
```

### Glow Effects
```css
/* Glow on hover */
<motion.div 
  className="absolute -inset-1 rounded-xl opacity-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 blur-xl z-0"
  variants={glowVariants}
  initial="initial"
  animate="animate"
/>
```

## Responsive Behavior

### Breakpoints
- Small (sm): 640px
- Medium (md): 768px
- Large (lg): 1024px
- Extra large (xl): 1280px
- 2xl: 1536px

### Mobile-First Approach
All components are designed for mobile first, with responsive classes to adapt for larger screens.

### Media Query Examples
```css
/* Mobile first base styles */
.grid-layout {
  @apply grid grid-cols-1 gap-6;
}

/* Tablet */
@media (min-width: 640px) {
  .grid-layout {
    @apply grid-cols-2;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid-layout {
    @apply grid-cols-3 gap-8;
  }
}
```

## Dark/Light Mode Support

The application supports both dark and light modes:

### Dark Mode (Default)
- Background: Deep cosmic gradient
- Cards: Light white opacity (5%)
- Text: White and light indigo

### Light Mode
- Background: Light gradient with blue and purple hints
- Cards: Dark opacity with blur
- Text: Dark indigo and purple

### Toggle Implementation
```jsx
<Button
  variant="cosmic"
  size="sm"
  onClick={toggleMode}
  className={`rounded-full px-4 py-1.5 transition-all duration-300 ${
    mode === 'night' 
      ? 'bg-indigo-900/20 text-indigo-100 border-0' 
      : 'bg-white/5 text-indigo-200/90 hover:text-amber-200/90 border-0'
  }`}
>
  {/* Toggle content */}
</Button>
```

## Accessibility Considerations

1. Sufficient color contrast despite transparent elements
2. Focus states for interactive elements
3. Keyboard navigation support
4. Screen reader-friendly labeling
5. Motion reduction settings for animations

## Implementation Guidance

### 1. Using the Card Component
```jsx
<div className="card-glassmorphic p-6">
  <h2 className="text-xl font-extralight text-white mb-4">Card Title</h2>
  <p className="text-indigo-100/80 text-sm font-extralight">Card content goes here...</p>
</div>
```

### 2. Adding Glassmorphic Effect to New Components
```jsx
<div className="glassmorphic p-4 rounded-xl">
  {/* Component content */}
</div>
```

### 3. Creating Gradient Text
```jsx
<h1 className="text-4xl font-extralight mb-4">
  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-indigo-100">
    Gradient Text
  </span>
</h1>
```

## Examples from Codebase

### ZodiacCard Implementation
```jsx
<Card className="h-auto pb-4 relative overflow-hidden card-glassmorphic border-0 shadow-xl">
  <motion.div 
    className="absolute -inset-1 rounded-xl opacity-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 blur-xl z-0"
    variants={glowVariants}
    initial="initial"
    animate="animate"
  />
  
  {/* Card content */}
  <CardHeader className="pt-3 pb-1">
    <div className="flex items-center gap-3">
      <div className="text-2xl text-indigo-100">{symbol}</div>
      <div>
        <h2 className="text-xl font-extralight text-white capitalize">{capitalize(sign)}</h2>
        <p className="text-indigo-200/80 text-xs font-extralight tracking-wider">{dateRange} • {element}</p>
      </div>
    </div>
  </CardHeader>
  
  {/* More card content */}
</Card>
```

### Hero Section Implementation
```jsx
<section className="relative py-12 mb-16 overflow-hidden">
  <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/3 rounded-full blur-3xl"></div>
  <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/3 rounded-full blur-3xl"></div>
  <div className="absolute inset-0 bg-gradient-to-b from-white/3 to-indigo-950/3 backdrop-blur-[1px] mix-blend-overlay pointer-events-none"></div>
  
  <motion.div 
    className="max-w-3xl mx-auto text-center relative z-10"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.5 }}
  >
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extralight mb-4 leading-tight tracking-tight">
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-indigo-200 to-indigo-300">
        Cosmic Insights
      </span>
    </h1>
    <p className="text-lg md:text-xl text-indigo-100/80 mb-4 font-extralight tracking-wide max-w-2xl mx-auto">
      Explore your celestial guidance and discover what the cosmos has aligned for you today.
    </p>
  </motion.div>
</section>
``` 