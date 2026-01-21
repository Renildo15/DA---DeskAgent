import { allActionsType } from "@/types";
import { StyleSheet, View } from "react-native";
import { BtnAction } from "./btn-action";
import { ThemedText } from "./themed-text";

interface IActionSectionProps {
  allActions: allActionsType[];
  cooldown: boolean;
  sendWithCooldown: (
    action: string,
    seconds?: number,
    payload?: object,
  ) => void;
  status: "online" | "offline";
  title: string;
}

export function ActionSection({
  allActions,
  cooldown,
  sendWithCooldown,
  status,
  title,
}: IActionSectionProps) {
  return (
    <View style={styles.actionsSection}>
      <ThemedText type="title" style={styles.sectionTitle}>
        {title}
      </ThemedText>

      <View style={styles.actionsGrid}>
        {allActions.map((action) => (
          <BtnAction
            key={action.id}
            cooldown={cooldown}
            iconName={action.iconName}
            nameClass={action.nameClass}
            sendWithCooldown={sendWithCooldown}
            command={action.command}
            status={status}
            text={action.text}
            customAction={action.customAction}
            disabledWhenOffline={action.disabledWhenOffline}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Actions Section
  actionsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: "#333",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "48%",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
});
