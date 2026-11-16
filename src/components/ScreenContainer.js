// src/components/ScreenContainer.js
import { StyleSheet, View } from "react-native";
import { useResponsive } from "../theme/responsive";

// Wrap any screen's content in this — it automatically centers and caps
// width on tablets, and stretches full-width on phones, with zero per-screen math.
export default function ScreenContainer({ children, style }) {
  const { contentMaxWidth, isTablet } = useResponsive();

  return (
    <View style={styles.outer}>
      <View
        style={[
          { width: "100%", maxWidth: contentMaxWidth, flex: isTablet ? 0 : 1 },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: "center" },
});
