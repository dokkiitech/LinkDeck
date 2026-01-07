import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import {
  getMaintenanceStatus,
  setMaintenanceMode,
  subscribeToMaintenanceStatus,
  MaintenanceStatus,
} from './services/maintenance';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus>({
    isMaintenanceMode: false,
  });
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const loadStatus = async () => {
      const status = await getMaintenanceStatus();
      setMaintenanceStatus(status);
    };

    loadStatus();

    const unsubscribe = subscribeToMaintenanceStatus((status) => {
      setMaintenanceStatus(status);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message || 'ログアウトに失敗しました');
    }
  };

  const handleToggleMaintenance = async () => {
    const newMode = !maintenanceStatus.isMaintenanceMode;

    if (newMode && !reason.trim()) {
      setError('メンテナンスモードを有効にする理由を入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await setMaintenanceMode(newMode, newMode ? reason : undefined, user?.email || undefined);
      setReason('');
    } catch (err: any) {
      setError(err.message || 'メンテナンスモードの切り替えに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <h1>LinksDeck 管理画面</h1>
          <h2>ログイン</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">メールアドレス</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">パスワード</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                required
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h1>LinksDeck メンテナンスモード管理</h1>
          <div className="user-info">
            <span>{user.email}</span>
            <button onClick={handleLogout} className="btn-secondary">
              ログアウト
            </button>
          </div>
        </div>

        <div className="status-section">
          <h2>現在の状態</h2>
          <div className={`status ${maintenanceStatus.isMaintenanceMode ? 'maintenance' : 'normal'}`}>
            <div className="status-indicator">
              {maintenanceStatus.isMaintenanceMode ? '🔧 メンテナンス中' : '✅ 通常運用中'}
            </div>
            {maintenanceStatus.isMaintenanceMode && maintenanceStatus.reason && (
              <div className="status-details">
                <p>
                  <strong>理由:</strong> {maintenanceStatus.reason}
                </p>
                {maintenanceStatus.startedAt && (
                  <p>
                    <strong>開始時刻:</strong>{' '}
                    {new Date(maintenanceStatus.startedAt).toLocaleString('ja-JP')}
                  </p>
                )}
                {maintenanceStatus.startedBy && (
                  <p>
                    <strong>実行者:</strong> {maintenanceStatus.startedBy}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="control-section">
          <h2>メンテナンスモード切り替え</h2>
          {!maintenanceStatus.isMaintenanceMode && (
            <div className="form-group">
              <label htmlFor="reason">切り替え理由 *</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="例: データベースメンテナンス、機能アップデート等"
                rows={3}
                required
              />
            </div>
          )}
          {error && <div className="error">{error}</div>}
          <button
            onClick={handleToggleMaintenance}
            disabled={loading}
            className={maintenanceStatus.isMaintenanceMode ? 'btn-success' : 'btn-danger'}
          >
            {loading
              ? '処理中...'
              : maintenanceStatus.isMaintenanceMode
              ? '通常運用に戻す'
              : 'メンテナンスモードに切り替え'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
