import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./themed-text";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface IPowerOffModalProps {
    showModal: boolean;
    minutes: number;
    confirmShutdownWithTime: () => void;
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
    setMinutes: React.Dispatch<React.SetStateAction<number>>

}

export function PowerOffModal(props: IPowerOffModalProps) {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={props.showModal}
        onRequestClose={() => props.setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="title" style={styles.modalTitle}>
              Desligar em X minutos
            </ThemedText>
            
            <View style={styles.minutesContainer}>
              <TouchableOpacity 
                style={styles.minuteButton}
                onPress={() => props.setMinutes(Math.max(1, props.minutes - 1))}
              >
                <MaterialCommunityIcons name="minus" size={24} color="#333" />
              </TouchableOpacity>
              
              <View style={styles.minutesDisplay}>
                <ThemedText type="title">{props.minutes}</ThemedText>
                <ThemedText type="default">minutos</ThemedText>
              </View>
              
              <TouchableOpacity 
                style={styles.minuteButton}
                onPress={() => props.setMinutes(props.minutes + 1)}
              >
                <MaterialCommunityIcons name="plus" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => props.setShowModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={props.confirmShutdownWithTime}
              >
                <ThemedText style={styles.confirmButtonText}>Confirmar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
}

const styles = StyleSheet.create({
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