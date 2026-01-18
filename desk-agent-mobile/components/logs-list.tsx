import { StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";
import { LogItem } from "./log-item";
import { LogType } from "@/types";

interface ILogsListProps {
    logs: LogType[];
}

export function LogsList({logs}:ILogsListProps) {
    return (
        <View style={styles.logsContent}>
            {logs.length === 0 ? (
                <ThemedText type="default" style={styles.noLogsText}>
                    Nenhum log disponível
                </ThemedText>
            ) : (
                logs.map((log, index) => (
                <LogItem
                    index={index}
                    log={log}
                    key={index}
                />
                ))
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    logsContent: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
    },
    noLogsText: {
        textAlign: 'center',
        color: '#888',
        padding: 20,
    },
})