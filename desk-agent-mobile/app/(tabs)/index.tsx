// app/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || "ws://localhost:8000/ws/control/"

type LogType = {
  level: string;
  message: string;
  timestamp: number;
};

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
  }, []); // Executa apenas uma vez no mount

  return (
    <SafeAreaView style={styles.container}>
      {/* Toast Notification */}
      {toastMessage ? (
        <View style={[styles.toast, styles[`toast${toastType}`]]}>
          <ThemedText style={styles.toastText}>{toastMessage}</ThemedText>
        </View>
      ) : null}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.dot, status === 'online' ? styles.onlineDot : styles.offlineDot]} />
            <ThemedText type="subtitle" style={styles.statusText}>
              PC {status === 'online' ? 'Online' : 'Offline'}
            </ThemedText>
          </View>
          
          <ThemedText type="defaultSemiBold" style={styles.timeText}>
            Último ping: {new Date(lastPing).toLocaleTimeString()}
          </ThemedText>
          
          {cooldown && (
            <View style={styles.cooldownContainer}>
              <MaterialCommunityIcons name="timer-sand" size={16} color="#ff9800" />
              <ThemedText type="default" style={styles.cooldownText}>
                Cooldown: {cooldownTime}s
              </ThemedText>
            </View>
          )}
        </View>

        {/* Ações */}
        <View style={styles.actionsSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Ações Rápidas
          </ThemedText>

          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, (cooldown || status === "offline") && styles.actionButtonDisabled]}
              onPress={() => sendWithCooldown('shutdown')}
              disabled={cooldown || status === "offline"}
            >
              <View style={[styles.iconContainer, styles.powerOff]}>
                <MaterialCommunityIcons name="power" size={28} color="#fff" />
              </View>
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                Desligar
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, (cooldown || status === "offline") && styles.actionButtonDisabled]}
              onPress={() => sendWithCooldown('cancel')}
              disabled={cooldown || status === "offline"}
            >
              <View style={[styles.iconContainer, styles.powerOff]}>
                <MaterialCommunityIcons name="cancel" size={28} color="#fff" />
              </View>
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, (cooldown || status === "offline") && styles.actionButtonDisabled]}
              onPress={() => sendWithCooldown('reboot')}
              disabled={cooldown || status === "offline"}
            >
              <View style={[styles.iconContainer, styles.restart]}>
                <MaterialCommunityIcons name="restart" size={28} color="#fff" />
              </View>
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                Reiniciar
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, (cooldown || status === "offline") && styles.actionButtonDisabled]}
              onPress={() => sendWithCooldown('suspend')}
              disabled={cooldown || status === "offline"}
            >
              <View style={[styles.iconContainer, styles.sleep]}>
                <MaterialCommunityIcons name="sleep-off" size={28} color="#fff" />
              </View>
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                Suspender
              </ThemedText>
            </TouchableOpacity>

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

            <TouchableOpacity 
              style={[styles.actionButton, (cooldown || status === "offline") && styles.actionButtonDisabled]}
              onPress={() => sendCommand('ping')}
              disabled={cooldown || status === "offline"}
            >
              <View style={[styles.iconContainer, styles.ping]}>
                <MaterialCommunityIcons name="signal" size={28} color="#fff" />
              </View>
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                Ping
              </ThemedText>
            </TouchableOpacity>
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

          <View style={styles.logsContent}>
            {logs.length === 0 ? (
              <ThemedText type="default" style={styles.noLogsText}>
                Nenhum log disponível
              </ThemedText>
            ) : (
              logs.map((log, index) => (
                <View key={index} style={styles.logItem}>
                  <View style={[
                    styles.logDot,
                    log.level === 'error' ? styles.errorDot :
                    log.level === 'warning' ? styles.warningDot :
                    styles.infoDot
                  ]} />
                  <View style={styles.logTextContainer}>
                    <ThemedText type="defaultSemiBold">{log.message}</ThemedText>
                    <ThemedText type="default" style={styles.logTime}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </ThemedText>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal para desligamento com tempo */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="title" style={styles.modalTitle}>
              Desligar em X minutos
            </ThemedText>
            
            <View style={styles.minutesContainer}>
              <TouchableOpacity 
                style={styles.minuteButton}
                onPress={() => setMinutes(Math.max(1, minutes - 1))}
              >
                <MaterialCommunityIcons name="minus" size={24} color="#333" />
              </TouchableOpacity>
              
              <View style={styles.minutesDisplay}>
                <ThemedText type="title">{minutes}</ThemedText>
                <ThemedText type="default">minutos</ThemedText>
              </View>
              
              <TouchableOpacity 
                style={styles.minuteButton}
                onPress={() => setMinutes(minutes + 1)}
              >
                <MaterialCommunityIcons name="plus" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmShutdownWithTime}
              >
                <ThemedText style={styles.confirmButtonText}>Confirmar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  
  // Toast
  toast: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 1000,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastsuccess: {
    backgroundColor: '#4CAF50',
  },
  toasterror: {
    backgroundColor: '#f44336',
  },
  toastinfo: {
    backgroundColor: '#2196F3',
  },
  toastText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
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
  
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  minutesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  minuteButton: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  minutesDisplay: {
    alignItems: 'center',
    marginHorizontal: 20,
    minWidth: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#333',
  },
  confirmButtonText: {
    color: '#fff',
  },
});