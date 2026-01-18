import { StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";

interface IStatusHeaderProps {
    status: "offline" | "online";
    lastPing: number;
}

export function StatusHeader({ status, lastPing}:IStatusHeaderProps) {
    return (
        <>
            <View style={styles.statusHeader}>
                <View style={[styles.dot, status === 'online' ? styles.onlineDot : styles.offlineDot]} />
                <ThemedText type="subtitle" style={styles.statusText}>
                    PC {status === 'online' ? 'Online' : 'Offline'}
                </ThemedText>
            </View>
                
            <ThemedText type="defaultSemiBold" style={styles.timeText}>
                Último ping: {new Date(lastPing).toLocaleTimeString()}
            </ThemedText>
        
        </>
    )
}

const styles = StyleSheet.create({
 
  // Status Card
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  onlineDot: {
    backgroundColor: '#4CAF50',
  },
  offlineDot: {
    backgroundColor: '#f44336',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 20,
  },
  timeText: {
    color: '#666',
    marginBottom: 4,
  },

});