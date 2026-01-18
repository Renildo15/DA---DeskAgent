import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./themed-text";

interface IBtnActionProps {
    cooldown: boolean;
    status: "online" | "offline";
    sendWithCooldown: (action: string, seconds?: number, payload?: object) => void
    nameClass: string;
    iconName: "cancel" | "restart" | "power" | "sleep-off" | "timer-off" | "signal";
    text: string;
    command: string;
}

export function BtnAction(props: IBtnActionProps) {
    return (
        <TouchableOpacity 
            style={[styles.actionButton, (props.cooldown || props.status === "offline") && styles.actionButtonDisabled]}
            onPress={() => props.sendWithCooldown(props.command)}
            disabled={props.cooldown || props.status === "offline"}
        >
            <View style={[styles.iconContainer, styles[props.nameClass as keyof typeof styles] as any]}>
                <MaterialCommunityIcons name={props.iconName} size={28} color="#fff" />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                {props.text}
            </ThemedText>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
  
  // Actions Section
  actionsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#333',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  powerOff: {
    backgroundColor: '#ff4444',
  },
  restart: {
    backgroundColor: '#ff9800',
  },
  sleep: {
    backgroundColor: '#2196F3',
  },
  timer: {
    backgroundColor: '#9c27b0',
  },
  ping: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    textAlign: 'center',
    color: '#333',
  },
  
});