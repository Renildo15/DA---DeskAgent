// app/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Toast } from '@/components/toast';
import { PowerOffModal } from '@/components/power-off-modal';
import { StatusCard } from '@/components/status-card';
import { BtnAction } from '@/components/btn-action';
import { LogType } from '@/types';
import { LogsList } from '@/components/logs-list';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || "ws://localhost:8000/ws/control/"

type ToastType = 'success' | 'error' | 'info';

export default function HomeScreen() {
  const [status, setStatus] = useState<'online' | 'offline'>('offline');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
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
      Alert.alert('Aguarde', `Ação em cooldown. Aguarde ${cooldownTime} segundos.`);
      return;
    }

    sendCommand(action, payload);
    startCooldown(seconds);
  };

  // Função para enviar comando
  const sendCommand = (action: string, payload = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'command',
        role: 'app',
        action,
        ...payload,
      }));
    } else {
      Alert.alert('Erro', 'Conexão não está ativa');
    }
  };

  // Função para confirmar desligamento com tempo
  const confirmShutdownWithTime = () => {
    sendCommand('shutdown_with_time', { minutes });
    setShowModal(false);
  };

  // Configurar WebSocket
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'hello',
        role: 'app',
      }));
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === 'status') {
          lastPingRef.current = Date.now(); // ← Atualiza a ref
          setLastPing(Date.now()); // ← Mantém para UI
          setStatus('online');
        }

        if (data.type === 'feedback') {
          setToastMessage(data.message);
          setToastType(data.status);
          
          // Limpar timeout anterior
          if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
          }
          
          // Esconder toast após 3 segundos
          toastTimeoutRef.current = setTimeout(() => {
            setToastMessage('');
          }, 3000);
        }

        if (data.type === 'log') {
          setLogs((prevLogs) => {
            const newLogs = [data, ...prevLogs];
            return newLogs.slice(0, 50); // Manter apenas 50 logs mais recentes
          });
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    };

    pingIntervalRef.current = setInterval(() => {
      if (Date.now() - lastPingRef.current > 10000) {
        setStatus('offline');
      }
    }, 1000);

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setToastMessage('Erro de conexão');
      setToastType('error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setStatus('offline');
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
        <Toast toastMessage={toastMessage} toastType={toastType}/>
      ) : null}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <StatusCard 
          cooldown={cooldown} 
          cooldownTime={cooldownTime} 
          lastPing={lastPing} 
          status={status}
        />
        <View style={styles.actionsSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Ações Rápidas
          </ThemedText>

          <View style={styles.actionsGrid}>

            <BtnAction
              cooldown={cooldown}
              iconName='power'
              nameClass='powerOff'
              sendWithCooldown={sendWithCooldown}
              command={"shutdown"}
              status={status}
              text='Desligar'
            />

            <BtnAction
              cooldown={cooldown}
              iconName='cancel'
              nameClass='powerOff'
              sendWithCooldown={sendWithCooldown}
              command={"cancel"}
              status={status}
              text='Cancelar'
            />

            <BtnAction
              cooldown={cooldown}
              iconName='restart'
              nameClass='restart'
              sendWithCooldown={sendWithCooldown}
              command={"reboot"}
              status={status}
              text='Reiniciar'
            />

            <BtnAction
              cooldown={cooldown}
              iconName='sleep-off'
              nameClass='sleep'
              sendWithCooldown={sendWithCooldown}
              command={"suspend"}
              status={status}
              text='Suspender'
            />
           

            <TouchableOpacity 
              style={[styles.actionButton, (cooldown || status === "offline") && styles.actionButtonDisabled]}
              onPress={() => setShowModal(true)}
              disabled={cooldown || status === "offline"}
            >
              <View style={[styles.iconContainer, styles.timer]}>
                <MaterialCommunityIcons name="timer-off" size={28} color="#fff" />
              </View>
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                Desligar em
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                X minutos
              </ThemedText>
            </TouchableOpacity>

             <BtnAction
              cooldown={cooldown}
              iconName='signal'
              nameClass='ping'
              sendWithCooldown={sendWithCooldown}
              command={"ping"}
              status={status}
              text='Ping'
            />
          </View>
        </View>

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

          <LogsList
            logs={logs}
          />
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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },

  
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
  
  // Logs Section
  logsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearText: {
    color: '#f44336',
    fontSize: 14,
  },
  

});