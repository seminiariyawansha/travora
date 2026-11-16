// src/theme/colors.js
export const lightColors = {
  teal:        "#10534a",
  tealDark:    "#055a54",
  terracotta:  "#fff06c",
  sand:        "#ffffff",
  gray:        "#beb6ad",
  ink:         "#1B1B1B",
  white:       "#FFFFFF",
  cardBorder:  "#bebebe",
  divider:     "#F1E9DC",
  // semantic
  bg:          "#FFFFFF",
  bgSecondary: "#F5F5F5",
  surface:     "#FFFFFF",
  textPrimary: "#1B1B1B",
  textSecondary:"#7A7A7A",
  inputBg:     "#F2F2F2",
  tabBar:      "#1B1B1B",
  headerBg:    "#10534a",
};

export const darkColors = {
  teal:        "#1DB89F",
  tealDark:    "#15907A",
  terracotta:  "#FFE047",
  sand:        "#1A1A1A",
  gray:        "#6B6B6B",
  ink:         "#F0F0F0",
  white:       "#FFFFFF",
  cardBorder:  "#2E2E2E",
  divider:     "#2A2A2A",
  // semantic
  bg:          "#121212",
  bgSecondary: "#1E1E1E",
  surface:     "#1E1E1E",
  textPrimary: "#F0F0F0",
  textSecondary:"#9A9A9A",
  inputBg:     "#2A2A2A",
  tabBar:      "#0D0D0D",
  headerBg:    "#0D2E28",
};

// default export kept for backward compat — screens that don't use ThemeContext
// still get the light palette
export const colors = lightColors;
