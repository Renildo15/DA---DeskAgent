import { StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";
import { LogType } from "@/types";

interface ILogItemProps {
    index: number;
    log: LogType;
}

export function LogItem(props: ILogItemProps) {
    return (
        <View key={props.index} style={styles.logItem}>
            <View style={[
                styles.logDot,
                props.log.level === 'error' ? styles.errorDot :
                props.log.level === 'warning' ? styles.warningDot :
                styles.infoDot
            ]} />
            <View style={styles.logTextContainer}>
            <ThemedText type="defaultSemiBold">{props.log.message}</ThemedText>
            <ThemedText type="default" style={styles.logTime}>
                {new Date(props.log.timestamp).toLocaleTimeString()}
            </ThemedText>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
 
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  infoDot: {
    backgroundColor: '#2196F3',
  },
  warningDot: {
    backgroundColor: '#ff9800',
  },
  errorDot: {
    backgroundColor: '#f44336',
  },
  logTextContainer: {
    flex: 1,
  },
  logTime: {
    color: '#888',
    marginTop: 2,
  },
  
});