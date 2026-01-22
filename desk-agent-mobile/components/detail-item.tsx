import { StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";

export function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailItem}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
  );
}


const styles = StyleSheet.create({
 
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  detailLabel: {
    color: "#666",
  },

  detailValue: {
    fontWeight: "500",
  },

  placeholder: {
    marginTop: 24,
    alignItems: "center",
    opacity: 0.6,
  },

  placeholderText: {
    fontSize: 13,
    textAlign: "center",
  },
});
