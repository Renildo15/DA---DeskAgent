import { StyleSheet, View } from "react-native";
import { StatusHeader } from "./status-header";
import { CooldownAlert } from "./cooldown-alert";


interface IStatusCard {
    lastPing: number;
    cooldown: boolean;
    status: "offline" | "online";
    cooldownTime: number
}
export function StatusCard({ cooldown, lastPing, status, cooldownTime}: IStatusCard) {
    return (
        <View style={styles.statusCard}>
            <StatusHeader lastPing={lastPing} status={status}/>
            {cooldown && (
                <CooldownAlert cooldownTime={cooldownTime}/>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
});