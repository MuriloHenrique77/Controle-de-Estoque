import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type GenericModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
  text?: string;
  children?: React.ReactNode;
};

export default function GenericModal({
  visible,
  onClose,
  onSave,
  text,
  children,
}: GenericModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {text ? <Text style={styles.text}>{text}</Text> : null}

          {children}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Fechar</Text>
            </TouchableOpacity>

            {onSave ? (
              <TouchableOpacity style={styles.button} onPress={onSave}>
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: '#222',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 10,
  },
  button: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});