import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ErrorDialog, { DialogButton } from '../components/ErrorDialog';

interface DialogOptions {
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'success' | 'info';
  buttons?: DialogButton[];
}

interface DialogContextType {
  showDialog: (options: DialogOptions) => void;
  showError: (title: string, message: string, onClose?: () => void) => void;
  showWarning: (title: string, message: string, onClose?: () => void) => void;
  showSuccess: (title: string, message: string, onClose?: () => void) => void;
  showInfo: (title: string, message: string, onClose?: () => void) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => void;
  hideDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogOptions, setDialogOptions] = useState<DialogOptions>({
    title: '',
    message: '',
    type: 'error',
    buttons: [],
  });

  const showDialog = useCallback((options: DialogOptions) => {
    setDialogOptions({
      ...options,
      buttons: options.buttons || [{ text: 'OK', style: 'default' }],
    });
    setDialogVisible(true);
  }, []);

  const hideDialog = useCallback(() => {
    setDialogVisible(false);
  }, []);

  const showError = useCallback(
    (title: string, message: string, onClose?: () => void) => {
      showDialog({
        title,
        message,
        type: 'error',
        buttons: [
          {
            text: 'OK',
            style: 'default',
            onPress: onClose,
          },
        ],
      });
    },
    [showDialog]
  );

  const showWarning = useCallback(
    (title: string, message: string, onClose?: () => void) => {
      showDialog({
        title,
        message,
        type: 'warning',
        buttons: [
          {
            text: 'OK',
            style: 'default',
            onPress: onClose,
          },
        ],
      });
    },
    [showDialog]
  );

  const showSuccess = useCallback(
    (title: string, message: string, onClose?: () => void) => {
      showDialog({
        title,
        message,
        type: 'success',
        buttons: [
          {
            text: 'OK',
            style: 'default',
            onPress: onClose,
          },
        ],
      });
    },
    [showDialog]
  );

  const showInfo = useCallback(
    (title: string, message: string, onClose?: () => void) => {
      showDialog({
        title,
        message,
        type: 'info',
        buttons: [
          {
            text: 'OK',
            style: 'default',
            onPress: onClose,
          },
        ],
      });
    },
    [showDialog]
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void
    ) => {
      showDialog({
        title,
        message,
        type: 'warning',
        buttons: [
          {
            text: 'キャンセル',
            style: 'cancel',
            onPress: onCancel,
          },
          {
            text: 'OK',
            style: 'default',
            onPress: onConfirm,
          },
        ],
      });
    },
    [showDialog]
  );

  return (
    <DialogContext.Provider
      value={{
        showDialog,
        showError,
        showWarning,
        showSuccess,
        showInfo,
        showConfirm,
        hideDialog,
      }}
    >
      {children}
      <ErrorDialog
        visible={dialogVisible}
        title={dialogOptions.title}
        message={dialogOptions.message}
        type={dialogOptions.type}
        buttons={dialogOptions.buttons}
        onClose={hideDialog}
      />
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
