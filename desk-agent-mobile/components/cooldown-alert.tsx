import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";

interface ICooldownAlertProps {
    cooldownTime: number
}

export function CooldownAlert({ cooldownTime}:ICooldownAlertProps) {
    return (
        <View style={styles.cooldownContainer}>
            <MaterialCommunityIcons name="timer-sand" size={16} color="#ff9800" />
            <ThemedText type="default" style={styles.cooldownText}>
                Cooldown: {cooldownTime}s
            </ThemedText>
        </View>
    )
}

const styles = StyleSheet.create({

  cooldownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  cooldownText: {
    color: '#856404',
    marginLeft: 8,
  },
  
  
});