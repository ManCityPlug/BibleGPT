// BibleGPT — Warm parchment palette
// Distinct from Threely's Stripe-purple theme

export const colors = {
  // Backgrounds
  background: "#FAF7F2",      // off-white parchment
  surface: "#F3EDE3",         // warm card background
  surfaceAlt: "#EDE5D8",      // slightly darker card
  border: "#DDD0BC",          // warm divider

  // Primary — deep purple (faith / royalty)
  primary: "#7B5EA7",
  primaryLight: "#9B7FC7",
  primaryDark: "#5A3F85",
  primaryBg: "#F0EBFA",

  // Accent — scripture gold
  gold: "#C9A84C",
  goldLight: "#E8C96A",
  goldBg: "#FDF6E3",

  // Text
  text: "#2C1A0E",            // warm dark brown
  textSecondary: "#7A6552",   // medium brown
  textTertiary: "#A89480",    // light brown
  textInverse: "#FAF7F2",

  // Semantic
  success: "#4A7C59",
  successBg: "#EBF5EE",
  error: "#B53E3E",
  errorBg: "#FDECEC",
  warning: "#C9A84C",
  warningBg: "#FDF6E3",

  // Overlay
  overlay: "rgba(44, 26, 14, 0.5)",
  white: "#FFFFFF",
  transparent: "transparent",
};

export const typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  "2xl": 28,
  "3xl": 34,
  "4xl": 40,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,

  // Bible text gets extra leading
  scripture: 1.9,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 56,
  "5xl": 72,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#2C1A0E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

const theme = { colors, typography, spacing, radius, shadows };
export default theme;
