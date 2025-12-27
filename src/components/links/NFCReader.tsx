import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { isValidURL } from '../../utils/urlValidation';

interface NFCReaderProps {
  visible: boolean;
  onClose: () => void;
  onScan: (url: string) => void;
}

const NFCReader: React.FC<NFCReaderProps> = ({
  visible,
  onClose,
  onScan,
}) => {
  const [isReading, setIsReading] = useState(false);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // NFCマネージャーの初期化
    const initNfc = async () => {
      try {
        const supported = await NfcManager.isSupported();
        setNfcSupported(supported);

        if (supported) {
          await NfcManager.start();
        }
      } catch (error) {
        console.error('NFC初期化エラー:', error);
        setNfcSupported(false);
      }
    };

    initNfc();

    // クリーンアップ
    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (visible && nfcSupported) {
      startNfcReading();
    } else if (!visible) {
      stopNfcReading();
    }

    return () => {
      stopNfcReading();
    };
  }, [visible, nfcSupported]);

  const startNfcReading = async () => {
    if (isReading) return;

    try {
      setIsReading(true);

      // NFCが有効かチェック
      const isEnabled = await NfcManager.isEnabled();
      if (!isEnabled) {
        Alert.alert(
          'NFCが無効です',
          'デバイスの設定でNFCを有効にしてください。',
          [{ text: 'OK', onPress: onClose }]
        );
        setIsReading(false);
        return;
      }

      // NFCタグの読み取りを開始
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const tag = await NfcManager.getTag();

      if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
        const ndefRecords = tag.ndefMessage;

        // NDEFレコードからURLを抽出
        for (const record of ndefRecords) {
          try {
            // レコードタイプをチェック
            const payload = record.payload;

            if (!payload || payload.length === 0) continue;

            let url = '';

            // URIレコードの場合
            if (record.tnf === Ndef.TNF_WELL_KNOWN) {
              const payloadStr = Ndef.uri.decodePayload(payload);
              url = payloadStr;
            }
            // テキストレコードの場合
            else if (record.type && record.type.length > 0) {
              const payloadStr = Ndef.text.decodePayload(payload);
              url = payloadStr;
            }

            // URLが有効かチェック
            if (url && isValidURL(url)) {
              onScan(url);
              onClose();
              return;
            }
          } catch (recordError) {
            console.warn('NFCレコード解析エラー:', recordError);
          }
        }

        // 有効なURLが見つからなかった場合
        Alert.alert(
          '無効なNFCタグ',
          '読み取ったNFCタグには有効なURLが含まれていません。',
          [
            {
              text: 'もう一度読み取る',
              onPress: () => {
                setIsReading(false);
                setTimeout(() => startNfcReading(), 500);
              },
            },
            {
              text: 'キャンセル',
              onPress: onClose,
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert(
          'データなし',
          'NFCタグにデータが含まれていません。',
          [
            {
              text: 'もう一度読み取る',
              onPress: () => {
                setIsReading(false);
                setTimeout(() => startNfcReading(), 500);
              },
            },
            {
              text: 'キャンセル',
              onPress: onClose,
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('NFC読み取りエラー:', error);

      if (error.toString().includes('cancelled')) {
        // ユーザーがキャンセルした場合は何もしない
      } else {
        Alert.alert(
          'エラー',
          'NFCタグの読み取りに失敗しました。',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } finally {
      setIsReading(false);
      await NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  const stopNfcReading = async () => {
    try {
      await NfcManager.cancelTechnologyRequest();
      setIsReading(false);
    } catch (error) {
      console.warn('NFC読み取り停止エラー:', error);
    }
  };

  const handleRetry = () => {
    setIsReading(false);
    setTimeout(() => startNfcReading(), 500);
  };

  const renderContent = () => {
    if (nfcSupported === null) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>NFC機能を確認中...</Text>
        </View>
      );
    }

    if (nfcSupported === false) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>
            このデバイスはNFCに対応していません
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>NFCタグを読み取る</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeIconButton}>
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.nfcIcon}>
            <Text style={styles.nfcIconText}>📱</Text>
          </View>

          <Text style={styles.instructionText}>
            {isReading
              ? 'NFCタグに近づけてください...'
              : 'NFCタグを読み取る準備ができました'}
          </Text>

          <View style={styles.nfcIndicator}>
            <View
              style={[
                styles.nfcIndicatorRing,
                isReading && styles.nfcIndicatorRingActive,
              ]}
            />
            <View
              style={[
                styles.nfcIndicatorDot,
                isReading && styles.nfcIndicatorDotActive,
              ]}
            />
          </View>

          <Text style={styles.hintText}>
            NFCタグをデバイスの背面に近づけてください
          </Text>

          {!isReading && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>もう一度読み取る</Text>
            </TouchableOpacity>
          )}
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
      <View style={styles.modalContainer}>{renderContent()}</View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  nfcIcon: {
    marginBottom: 30,
  },
  nfcIconText: {
    fontSize: 80,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 40,
  },
  nfcIndicator: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  nfcIndicatorRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#C7C7CC',
  },
  nfcIndicatorRingActive: {
    borderColor: '#007AFF',
  },
  nfcIndicatorDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C7C7CC',
  },
  nfcIndicatorDotActive: {
    backgroundColor: '#007AFF',
  },
  hintText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 30,
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
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
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NFCReader;
