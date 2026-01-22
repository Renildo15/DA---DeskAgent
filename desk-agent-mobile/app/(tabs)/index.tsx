// app/index.tsx
import { ActionSection } from "@/components/actions_section";
import { LogsList } from "@/components/logs-list";
import { PowerOffModal } from "@/components/power-off-modal";
import { StatusCard } from "@/components/status-card";
import { ThemedText } from "@/components/themed-text";
import { Toast } from "@/components/toast";
import { allActionsType, LogType } from "@/types";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL || "ws://localhost:8000/ws/control/";

type ToastType = "success" | "error" | "info";

export default function HomeScreen() {
  const [status, setStatus] = useState<"online" | "offline">("offline");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("info");
  const [lastPing, setLastPing] = useState<number>(Date.now());
  const [cooldown, setCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [logs, setLogs] = useState<LogType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [minutes, setMinutes] = useState(10);

  const wsRef = useRef<WebSocket | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const lastPingRef = useRef<number>(Date.now());

  const allActions: allActionsType[] = [
    {
      id: "1",
      iconName: "power" as const,
      nameClass: "powerOff" as const,
      command: "shutdown",
      text: "Desligar",
      disabledWhenOffline: true,
    },
    {
      id: "2",
      iconName: "cancel" as const,
      nameClass: "powerOff" as const,
      command: "cancel",
      text: "Cancelar",
      disabledWhenOffline: false,
    },
    {
      id: "3",
      iconName: "restart" as const,
      nameClass: "restart" as const,
      command: "reboot",
      text: "Reiniciar",
      disabledWhenOffline: true,
    },
    {
      id: "4",
      iconName: "sleep-off" as const,
      nameClass: "sleep" as const,
      command: "suspend",
      text: "Suspender",
      disabledWhenOffline: true,
    },
    {
      id: "5",
      iconName: "timer-off" as const,
      nameClass: "timer" as const,
      command: "timer",
      text: "Desligar em\nX minutos",
      customAction: () => setShowModal(true),
      disabledWhenOffline: true,
    },
    {
      id: "6",
      iconName: "signal" as const,
      nameClass: "ping" as const,
      command: "ping",
      text: "Ping",
      disabledWhenOffline: true,
    },
  ];

  const allProcessActions: allActionsType[] = [
    //here i want add others commandas like pkill -9 Discord, etc
    {
      id: "7",
      iconName: "discord" as const,
      nameClass: "discord" as const,
      command: "pkill_discord",
      text: "Discord",
      disabledWhenOffline: true,
    },
    {
      id: "8",
      iconName: "google-chrome" as const,
      nameClass: "chrome" as const,
      command: "kill_chrome",
      text: "Chrome",
      disabledWhenOffline: true,
    },
    {
      id: "9",
      iconName: "microsoft-visual-studio-code" as const,
      nameClass: "code" as const,
      command: "kill_vscode",
      text: "VS code",
      disabledWhenOffline: true,
    },
  ];

  // Função para iniciar cooldown
  const startCooldown = (seconds: number) => {
    setCooldown(true);
    setCooldownTime(seconds);

    // Limpar intervalo anterior
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }

    const interval = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          setCooldown(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    cooldownIntervalRef.current = interval;
  };

  // Função para enviar comando com cooldown
  const sendWithCooldown = (action: string, seconds = 3, payload = {}) => {
    if (cooldown) {
      Alert.alert(
        "Aguarde",
        `Ação em cooldown. Aguarde ${cooldownTime} segundos.`,
      );
      return;
    }

    sendCommand(action, payload);
    startCooldown(seconds);
  };

  // Função para enviar comando
  const sendCommand = (action: string, payload = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "command",
          role: "app",
          action,
          ...payload,
        }),
      );
    } else {
      Alert.alert("Erro", "Conexão não está ativa");
    }
  };

  // Função para confirmar desligamento com tempo
  const confirmShutdownWithTime = () => {
    sendCommand("shutdown_with_time", { minutes });
    setShowModal(false);
  };

  // Configurar WebSocket
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "hello",
          role: "app",
        }),
      );
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === "status") {
          lastPingRef.current = Date.now(); // ← Atualiza a ref
          setLastPing(Date.now()); // ← Mantém para UI
          setStatus("online");
        }

        if (data.type === "feedback") {
          setToastMessage(data.message);
          setToastType(data.status);

          // Limpar timeout anterior
          if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
          }

          // Esconder toast após 3 segundos
          toastTimeoutRef.current = setTimeout(() => {
            setToastMessage("");
          }, 3000);
        }

        if (data.type === "log") {
          setLogs((prevLogs) => {
            const newLogs = [data, ...prevLogs];
            return newLogs.slice(0, 50); // Manter apenas 50 logs mais recentes
          });
        }
      } catch (error) {
        console.error("Erro ao processar mensagem:", error);
      }
    };

    pingIntervalRef.current = setInterval(() => {
      if (Date.now() - lastPingRef.current > 10000) {
        setStatus("offline");
      }
    }, 1000);

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setToastMessage("Erro de conexão");
      setToastType("error");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setStatus("offline");
    };

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {toastMessage ? (
        <Toast toastMessage={toastMessage} toastType={toastType} />
      ) : null}

      <StatusCard
        cooldown={cooldown}
        cooldownTime={cooldownTime}
        lastPing={lastPing}
        status={status}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ActionSection
          allActions={allActions}
          cooldown={cooldown}
          sendWithCooldown={sendWithCooldown}
          status={status}
          title="Ações Rápidas"
        />

        <ActionSection
          allActions={allProcessActions}
          cooldown={cooldown}
          sendWithCooldown={sendWithCooldown}
          status={status}
          title="Encerrar Processos"
        />

        {/* Logs Section */}
        <View style={styles.logsSection}>
          <View style={styles.logsHeader}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Logs de Atividade ({logs.length})
            </ThemedText>
            <TouchableOpacity onPress={() => setLogs([])}>
              <ThemedText type="link" style={styles.clearText}>
                Limpar
              </ThemedText>
            </TouchableOpacity>
          </View>

          <LogsList logs={logs} />
        </View>
      </ScrollView>

      <PowerOffModal
        confirmShutdownWithTime={confirmShutdownWithTime}
        minutes={minutes}
        setMinutes={setMinutes}
        setShowModal={setShowModal}
        showModal={showModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },

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

  // Logs Section
  logsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  clearText: {
    color: "#f44336",
    fontSize: 14,
  },
});
