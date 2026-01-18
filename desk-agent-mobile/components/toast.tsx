import { StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";


type ToastType = 'success' | 'error' | 'info';
interface IToastProps {
    toastType: ToastType;
    toastMessage: string;
}

export function Toast({ toastType, toastMessage }:IToastProps) {
    return (
        <View style={[styles.toast, styles[`toast${toastType}`]]}>
            <ThemedText style={styles.toastText}>{toastMessage}</ThemedText>
        </View>
    )
}

const styles = StyleSheet.create({
 
  
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
  
});