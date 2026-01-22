import { StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";

export function InfoCard({
  title,
  value,
  subtitle,
  children,
}: {
  title: string;
  value: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <ThemedText style={styles.cardTitle}>{title}</ThemedText>
      <ThemedText style={styles.cardValue}>{value}</ThemedText>
      <ThemedText style={styles.cardSubtitle}>{subtitle}</ThemedText>
      {children && <View>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 14,
    color: "#777",
  },

  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 6,
  },

  cardSubtitle: {
    fontSize: 12,
    color: "#999",
  },
});
