import { nameClassStyles } from "@/utils/class_names";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./themed-text";

interface IBtnActionProps {
  cooldown: boolean;
  status: "online" | "offline";
  sendWithCooldown: (
    action: string,
    seconds?: number,
    payload?: object,
  ) => void;
  nameClass: keyof typeof nameClassStyles;
  iconName:
    | keyof typeof MaterialCommunityIcons.glyphMap
    | keyof typeof MaterialIcons.glyphMap
    | keyof typeof FontAwesome6.glyphMap;
  text: string;
  command?: string;
  customAction?: () => void;
  disabledWhenOffline?: boolean;
}

export function BtnAction(props: IBtnActionProps) {
  const isDisabled =
    props.cooldown || (props.disabledWhenOffline && props.status === "offline");

  const handlePress = () => {
    if (props.customAction) {
      props.customAction();
    } else if (props.command) {
      props.sendWithCooldown(props.command);
    }
  };
  return (
    <TouchableOpacity
      style={[styles.actionButton, isDisabled && styles.actionButtonDisabled]}
      onPress={handlePress}
      disabled={isDisabled}
    >
      <View style={[styles.iconContainer, nameClassStyles[props.nameClass]]}>
        {props.iconName in MaterialCommunityIcons.glyphMap ? (
          <MaterialCommunityIcons
            name={
              props.iconName as keyof typeof MaterialCommunityIcons.glyphMap
            }
            size={32}
            color="#fff"
          />
        ) : (
          <MaterialIcons
            name={props.iconName as keyof typeof MaterialIcons.glyphMap}
            size={32}
            color="#fff"
          />
        )}
      </View>
      <ThemedText type="defaultSemiBold" style={styles.buttonText}>
        {props.text}
      </ThemedText>
    </TouchableOpacity>
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
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  powerOff: {
    backgroundColor: "#ff4444",
  },
  restart: {
    backgroundColor: "#ff9800",
  },
  sleep: {
    backgroundColor: "#2196F3",
  },
  timer: {
    backgroundColor: "#9c27b0",
  },
  ping: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    textAlign: "center",
    color: "#333",
  },
});
