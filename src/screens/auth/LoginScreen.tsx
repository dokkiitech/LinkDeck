import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ERROR_MESSAGES } from '../../constants/messages';
import { colors, spacing, semanticSpacing, textStyles } from '../../theme/tokens';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signInAsGuest } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (error: any) {
      setError(error.message || ERROR_MESSAGES.AUTH.LOGIN_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await signInAsGuest();
    } catch (error: any) {
      Alert.alert('エラー', error.message || ERROR_MESSAGES.AUTH.GUEST_LOGIN_FAILED);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>LinksDeck</Text>
        <Text style={styles.catchphrase}>URLを見返さない生活もうやめましょう</Text>
        <Text style={styles.subtitle}>ログイン</Text>

        <TextInput
          style={styles.input}
          placeholder="メールアドレス"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="パスワード"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={styles.buttonText}>ログイン</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.guestButton, loading && styles.buttonDisabled]}
          onPress={handleGuestLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'ログイン中...' : 'ゲストとして利用'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('SignUp')}
          disabled={loading}
        >
          <Text style={styles.linkText}>アカウントをお持ちでない方はこちら</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.default,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: semanticSpacing.screenPadding,
  },
  title: {
    fontSize: textStyles.h1.fontSize,
    fontWeight: textStyles.h1.fontWeight,
    color: colors.primary,
    marginBottom: spacing.space150,
  },
  catchphrase: {
    fontSize: textStyles.label.fontSize,
    color: colors.text.subtle,
    marginBottom: spacing.space400,
  },
  subtitle: {
    fontSize: textStyles.h2.fontSize,
    fontWeight: textStyles.h2.fontWeight,
    color: colors.text.default,
    marginBottom: spacing.space500,
  },
  input: {
    width: '100%',
    height: semanticSpacing.inputHeight,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: semanticSpacing.radiusMedium,
    paddingHorizontal: spacing.space200,
    marginBottom: spacing.space200,
    fontSize: textStyles.body.fontSize,
    backgroundColor: colors.background.neutral,
  },
  errorText: {
    color: colors.semantic.danger,
    fontSize: textStyles.label.fontSize,
    marginBottom: spacing.space150,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: semanticSpacing.buttonHeight,
    backgroundColor: colors.primary,
    borderRadius: semanticSpacing.radiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.space150,
  },
  guestButton: {
    backgroundColor: colors.secondary.default,
  },
  buttonDisabled: {
    backgroundColor: colors.interactive.disabled,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: textStyles.body.fontSize,
    fontWeight: textStyles.labelBold.fontWeight,
  },
  linkButton: {
    marginTop: semanticSpacing.sectionGap,
  },
  linkText: {
    color: colors.primary,
    fontSize: textStyles.label.fontSize,
  },
});

export default LoginScreen;
