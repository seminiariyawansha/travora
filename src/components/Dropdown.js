// src/components/Dropdown.js
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../theme/colors";

export default function Dropdown({
  label,
  value,
  options, // [{ label: "Galle Fort · Main Dutch Gate", value: "id123" }]
  onChange,
  placeholder = "Select...",
  searchable = true,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text
          style={[styles.fieldText, !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {searchable ? (
              <TextInput
                style={styles.search}
                placeholder="Search..."
                placeholderTextColor={colors.gray}
                value={query}
                onChangeText={setQuery}
              />
            ) : null}
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.value)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onChange(item.value);
                      close();
                    }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Text style={styles.empty}>No results</Text>}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink, marginBottom: 6 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 14,
  },
  fieldText: { flex: 1, fontSize: 14, color: colors.ink },
  placeholder: { color: colors.gray },
  arrow: { marginLeft: 8, color: colors.gray, fontSize: 14 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: 14,
    maxHeight: "70%",
    padding: 12,
  },
  search: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 14,
    color: colors.ink,
  },
  option: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8 },
  optionActive: { backgroundColor: colors.sand },
  optionText: { fontSize: 14, color: colors.ink },
  optionTextActive: { color: colors.teal, fontWeight: "700" },
  empty: { textAlign: "center", padding: 16, color: colors.gray },
});