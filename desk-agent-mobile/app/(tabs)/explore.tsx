import { ThemedText } from "@/components/themed-text";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, ScrollView } from "react-native";
import { DetailItem } from "@/components/detail-item";
import { InfoCard } from "@/components/info-card";
import { useEffect, useRef, useState } from "react";
import { StatusCard } from "@/components/status-card";
import { UsageChart } from "@/components/usage-chart";

export default function PCInfo() {

  const MAX_POINTS = 60;

  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [ramHistory, setRamHistory] = useState<number[]>([]);

  const [status, setStatus] = useState<"online" | "offline">("offline");
  const [lastPing, setLastPing] = useState<number>(Date.now());
  const [cpu, setCpu] = useState("--");
  const [ramUsed, setRamUsed] = useState("--");
  const [ramTotal, setRamTotal] = useState("--");
  const [diskUsed, setDiskUsed] = useState("--");
  const [diskTotal, setDiskTotal] = useState("--");
  const [os, setOs] = useState("---");
  const [pcName, setPcName] = useState("---");
  const [user, setUser] = useState("---");
  const [ipLocal, setIpLocal] = useState("---");
  const [uptime, setUptime] = useState("--h --m");

  const wsRef = useRef<WebSocket | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const lastPingRef = useRef<number>(Date.now());

  useEffect(() => {
    const ws = new WebSocket("ws://10.220.0.19:8000/ws/pc_info/");
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

        if (data.type === "pc_info") {
          lastPingRef.current = Date.now(); // ← Atualiza a ref
          setLastPing(Date.now()); // ← Mantém para UI
          setStatus("online");

          setCpu(data.cpu_percent);
          setRamUsed(data.memory);
          setRamTotal(data.memory_total);
          setDiskUsed(data.disk_usage);
          setDiskTotal(data.disk_total);
          setOs(data.system);
          setPcName(data.node_name);
          setUser(data.user);
          setIpLocal(data.ip_local);
          setUptime(data.uptime);

          setCpuHistory(prev => {
            const next = [...prev, data.cpu_percent];
            return next.slice(-MAX_POINTS);
          });

          const ramPercent =
            (data.memory / data.memory_total) * 100;

          setRamHistory(prev => {
            const next = [...prev, ramPercent];
            return next.slice(-MAX_POINTS);
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

  useEffect(() => {
    if (status === "offline") {
      setCpuHistory([]);
      setRamHistory([]);
    }
  }, [status]);



  const handleUptimeFormat = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  }

  const handleGygaByteFormat = (bytes: number) => {
    return (bytes / (1024 ** 3)).toFixed(2);
  }
  
  return (
    <SafeAreaView style={styles.container}>
        <StatusCard
          cooldown={false}
          cooldownTime={0}
          lastPing={lastPing}
          status={status}
        />
      <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 16 }}>
        {/* Header */}

        {/* Summary Cards */}
        <View style={styles.cardsRow}>
          <InfoCard title="CPU" value={`${cpu}%`} subtitle="Uso" />
          <InfoCard title="RAM" value={`${handleGygaByteFormat(Number(ramUsed))} / ${handleGygaByteFormat(Number(ramTotal))} GB`} subtitle="Memória" />
        </View>

        <View style={styles.cardsRow}>
          <InfoCard title="Disco" value={`${handleGygaByteFormat(Number(diskUsed))} / ${handleGygaByteFormat(Number(diskTotal))} GB`} subtitle="Armazenamento" />
          <InfoCard title="Sistema" value={os} subtitle="OS" />
        </View>

        {/* Usage Charts */}
       
        <View style={styles.cardHistory}>
          <ThemedText type="subtitle" style={{ marginBottom: 4, padding:16 }}>
            Histórico de Uso da CPU
          </ThemedText>
         <UsageChart data={cpuHistory} />
        </View>
        <View style={styles.cardHistory}>
          <ThemedText type="subtitle" style={{ marginBottom: 4, padding:16 }}>
            Histórico de Uso da RAM
          </ThemedText>
          <UsageChart data={ramHistory} />
        </View>


        {/* Details Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={[styles.sectionTitle]}>
            Detalhes
          </ThemedText>

          <DetailItem label="Nome do PC" value={pcName} />
          <DetailItem label="Usuário" value={user} />
          <DetailItem label="IP Local" value={ipLocal} />
          <DetailItem label="Tempo ligado" value={handleUptimeFormat(Number(uptime))} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    // paddingHorizontal: 16,
  },

  header: {
    marginTop: 16,
    marginBottom: 20,
  },

  statusOffline: {
    marginTop: 4,
    color: "#f44336",
    fontSize: 14,
  },

  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },

  sectionTitle: {
    marginBottom: 12,
  },

  placeholder: {
    marginTop: 24,
    alignItems: "center",
    opacity: 0.6,
  },

  placeholderText: {
    fontSize: 13,
    textAlign: "center",
  },

  cardHistory: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 12,
  },
});
