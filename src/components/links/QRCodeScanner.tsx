import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,

  Dimensions,
} from 'react-native';
import { useDialog } from '../../contexts/DialogContext';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { isValidURL } from '../../utils/urlValidation';

interface QRCodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (url: string) => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  visible,
  onClose,
  onScan,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { showError, showSuccess, showConfirm } = useDialog();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      // モーダルが開かれたときにカメラ権限をリクエスト
      requestCameraPermission();
      setScanned(false);
    }
  }, [visible]);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          'カメラ権限が必要です',
          'QRコードを読み取るにはカメラへのアクセスを許可してください。',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('カメラ権限リクエストエラー:', error);
      Alert.alert(
        'エラー',
        'カメラ権限の取得に失敗しました。',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  };

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    if (scanned) return;

    setScanned(true);

    // 読み取ったデータがURLかどうかをチェック
    if (isValidURL(data)) {
      onScan(data);
      onClose();
    } else {
      Alert.alert(
        '無効なQRコード',
        '読み取ったQRコードは有効なURLではありません。',
        [
          {
            text: 'もう一度スキャン',
            onPress: () => setScanned(false),
          },
          {
            text: 'キャンセル',
            onPress: onClose,
            style: 'cancel',
          },
        ]
      );
    }
  };

  const renderContent = () => {
    if (hasPermission === null) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>カメラ権限を確認中...</Text>
        </View>
      );
    }

    if (hasPermission === false) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>
            カメラへのアクセスが拒否されました
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.headerText}>QRコードをスキャン</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIconButton}>
              <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.instructionText}>
              QRコードを枠内に収めてください
            </Text>
            {scanned && (
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.rescanButtonText}>もう一度スキャン</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {renderContent()}
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');
const scanAreaSize = width * 0.7;

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  closeIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: scanAreaSize,
    height: scanAreaSize,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  footer: {
    paddingBottom: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  rescanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRCodeScanner;
