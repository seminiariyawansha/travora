// src/theme/responsive.js
import { useWindowDimensions } from "react-native";

const BASE_WIDTH = 375; // standard small-phone width, our design baseline
const BASE_HEIGHT = 812;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  // Scales linearly with screen width — use sparingly (mainly for layout widths)
  function scale(size) {
    return (width / BASE_WIDTH) * size;
  }

  function verticalScale(size) {
    return (height / BASE_HEIGHT) * size;
  }

  // Grows slower than the screen — use this for font sizes and icons,
  // so text doesn't become huge on a tablet. factor 0 = no growth, 1 = full growth.
  function moderateScale(size, factor = 0.3) {
    return size + (scale(size) - size) * factor;
  }

  const isTablet = width >= 768;

  // On a tablet, cap content width and let it center instead of
  // stretching edge-to-edge — this is the single biggest tablet fix.
  const contentMaxWidth = isTablet ? 640 : width;

  return {
    width,
    height,
    scale,
    verticalScale,
    moderateScale,
    isTablet,
    contentMaxWidth,
  };
}
