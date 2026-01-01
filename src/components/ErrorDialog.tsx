import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface ErrorDialogProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'success' | 'info';
  buttons?: DialogButton[];
  onClose?: () => void;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({
  visible,
  title,
  message,
  type = 'error',
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // ダイアログを表示するアニメーション
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // ダイアログを非表示にするアニメーション
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconConfig = () => {
    switch (type) {
      case 'error':
        return { name: 'alert-circle' as const, color: '#FF3B30' };
      case 'warning':
        return { name: 'warning' as const, color: '#FF9500' };
      case 'success':
        return { name: 'checkmark-circle' as const, color: '#34C759' };
      case 'info':
        return { name: 'information-circle' as const, color: '#007AFF' };
      default:
        return { name: 'alert-circle' as const, color: '#FF3B30' };
    }
  };

  const iconConfig = getIconConfig();

  const handleButtonPress = (button: DialogButton) => {
    button.onPress?.();
    onClose?.();
  };

  const handleBackdropPress = () => {
    // キャンセルボタンがある場合のみ背景タップで閉じる
    const cancelButton = buttons.find((btn) => btn.style === 'cancel');
    if (cancelButton) {
      handleButtonPress(cancelButton);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleBackdropPress}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.dialogContainer,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* アイコン */}
              <View style={styles.iconContainer}>
                <Ionicons name={iconConfig.name} size={64} color={iconConfig.color} />
              </View>

              {/* タイトル */}
              <Text style={styles.title}>{title}</Text>

              {/* メッセージ */}
              <Text style={styles.message}>{message}</Text>

              {/* ボタン */}
              <View
                style={[
                  styles.buttonContainer,
                  buttons.length > 2 && styles.buttonContainerVertical,
                ]}
              >
                {buttons.map((button, index) => {
                  const isCancel = button.style === 'cancel';
                  const isDestructive = button.style === 'destructive';

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        buttons.length === 1 && styles.buttonSingle,
                        buttons.length === 2 && styles.buttonDouble,
                        buttons.length > 2 && styles.buttonMultiple,
                        isCancel && styles.buttonCancel,
                        isDestructive && styles.buttonDestructive,
                      ]}
                      onPress={() => handleButtonPress(button)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          isCancel && styles.buttonTextCancel,
                          isDestructive && styles.buttonTextDestructive,
                        ]}
                      >
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width } = Dimensions.get('window');
const dialogWidth = Math.min(width * 0.85, 340);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: dialogWidth,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSingle: {
    flex: 1,
  },
  buttonDouble: {
    flex: 1,
  },
  buttonMultiple: {
    width: '100%',
  },
  buttonCancel: {
    backgroundColor: '#E5E5EA',
  },
  buttonDestructive: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextCancel: {
    color: '#333',
  },
  buttonTextDestructive: {
    color: '#fff',
  },
});

export default ErrorDialog;
