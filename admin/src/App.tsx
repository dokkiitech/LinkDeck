import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import {
  getMaintenanceStatus,
  setMaintenanceMode,
  subscribeToMaintenanceStatus,
  MaintenanceStatus,
  getDevelopers,
  addDeveloper,
  removeDeveloper,
  Developer,
  isDeveloper,
  getMaintenanceLogs,
  MaintenanceLog,
} from './services/maintenance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, LogOut, Wrench, CheckCircle } from 'lucide-react';

type Tab = 'maintenance' | 'developers' | 'logs';

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
  const [activeTab, setActiveTab] = useState<Tab>('maintenance');
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [newDevEmail, setNewDevEmail] = useState('');
  const [newDevUid, setNewDevUid] = useState('');
  const [checkingDeveloper, setCheckingDeveloper] = useState(false);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [developerToDelete, setDeveloperToDelete] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCheckingDeveloper(true);
        const isDev = await isDeveloper(user.uid);
        setCheckingDeveloper(false);

        if (!isDev) {
          setError('アクセス権限がありません。開発者のみがこの管理画面にアクセスできます。');
          await signOut(auth);
          setUser(null);
        } else {
          setUser(user);
          setError('');
        }
      } else {
        setUser(null);
      }
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

  useEffect(() => {
    if (user && activeTab === 'developers') {
      loadDevelopers();
    }
    if (user && activeTab === 'logs') {
      loadLogs();
    }
  }, [user, activeTab]);

  const loadDevelopers = async () => {
    const devs = await getDevelopers();
    setDevelopers(devs);
  };

  const loadLogs = async () => {
    const maintenanceLogs = await getMaintenanceLogs();
    setLogs(maintenanceLogs);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const isDev = await isDeveloper(userCredential.user.uid);

      if (!isDev) {
        await signOut(auth);
        setError('アクセス権限がありません。開発者のみがこの管理画面にアクセスできます。');
      }
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
      await setMaintenanceMode(
        newMode,
        newMode ? reason : undefined,
        user?.email || undefined,
        user?.uid || undefined
      );
      setReason('');
    } catch (err: any) {
      setError(err.message || 'メンテナンスモードの切り替えに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeveloper = async () => {
    if (!newDevUid.trim() || !newDevEmail.trim()) {
      setError('UIDとメールアドレスの両方を入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addDeveloper(newDevUid.trim(), newDevEmail.trim());
      setNewDevUid('');
      setNewDevEmail('');
      await loadDevelopers();
    } catch (err: any) {
      setError(err.message || '開発者の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const confirmRemoveDeveloper = (uid: string) => {
    setDeveloperToDelete(uid);
    setDeleteDialogOpen(true);
  };

  const handleRemoveDeveloper = async () => {
    if (!developerToDelete) return;

    setLoading(true);
    setError('');

    try {
      await removeDeveloper(developerToDelete);
      await loadDevelopers();
      setDeleteDialogOpen(false);
      setDeveloperToDelete(null);
    } catch (err: any) {
      setError(err.message || '開発者の削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (checkingDeveloper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">LinksDeck 管理画面</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">認証情報を確認中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">LinksDeck 管理画面</CardTitle>
            <CardDescription className="text-center">
              この管理画面は開発者のみアクセス可能です。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワード"
                  required
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'ログイン中...' : 'ログイン'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-2xl font-bold">LinksDeck 管理画面</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  ログアウト
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as Tab)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="maintenance">メンテナンスモード</TabsTrigger>
                <TabsTrigger value="developers">開発者管理</TabsTrigger>
                <TabsTrigger value="logs">操作ログ</TabsTrigger>
              </TabsList>

              <TabsContent value="maintenance" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">現在の状態</h3>
                  <Card
                    className={
                      maintenanceStatus.isMaintenanceMode
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-green-50 border-green-200'
                    }
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        {maintenanceStatus.isMaintenanceMode ? (
                          <Wrench className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        <span className="text-lg font-semibold">
                          {maintenanceStatus.isMaintenanceMode
                            ? 'メンテナンス中'
                            : '通常運用中'}
                        </span>
                      </div>
                      {maintenanceStatus.isMaintenanceMode && maintenanceStatus.reason && (
                        <div className="space-y-2 text-sm">
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
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">メンテナンスモード切り替え</h3>
                  {!maintenanceStatus.isMaintenanceMode && (
                    <div className="space-y-2">
                      <Label htmlFor="reason">切り替え理由 *</Label>
                      <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="例: データベースメンテナンス、機能アップデート等"
                        rows={3}
                        required
                      />
                    </div>
                  )}
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}
                  <Button
                    onClick={handleToggleMaintenance}
                    disabled={loading}
                    variant={maintenanceStatus.isMaintenanceMode ? 'default' : 'destructive'}
                    className="w-full"
                  >
                    {loading
                      ? '処理中...'
                      : maintenanceStatus.isMaintenanceMode
                      ? '通常運用に戻す'
                      : 'メンテナンスモードに切り替え'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="developers" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">開発者管理</h3>
                  <p className="text-sm text-muted-foreground">
                    開発者リストに登録されたユーザーは、メンテナンス中でもアプリにアクセスできます。
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>開発者を追加</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newDevUid">UID</Label>
                      <Input
                        id="newDevUid"
                        type="text"
                        value={newDevUid}
                        onChange={(e) => setNewDevUid(e.target.value)}
                        placeholder="Firebase Authentication UID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newDevEmail">メールアドレス</Label>
                      <Input
                        id="newDevEmail"
                        type="email"
                        value={newDevEmail}
                        onChange={(e) => setNewDevEmail(e.target.value)}
                        placeholder="developer@example.com"
                      />
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                      </div>
                    )}
                    <Button onClick={handleAddDeveloper} disabled={loading} className="w-full">
                      {loading ? '追加中...' : '開発者を追加'}
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">登録済み開発者</h3>
                  {developers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      登録された開発者はいません
                    </p>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>メールアドレス</TableHead>
                            <TableHead>UID</TableHead>
                            <TableHead>追加日時</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {developers.map((dev) => (
                            <TableRow key={dev.uid}>
                              <TableCell>{dev.email}</TableCell>
                              <TableCell className="font-mono text-xs">{dev.uid}</TableCell>
                              <TableCell>
                                {new Date(dev.addedAt).toLocaleString('ja-JP')}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => confirmRemoveDeveloper(dev.uid)}
                                  disabled={loading}
                                >
                                  削除
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="logs" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">メンテナンスモード操作ログ</h3>
                  <p className="text-sm text-muted-foreground">
                    メンテナンスモードの切り替え履歴を表示します。
                  </p>
                </div>

                {logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    操作ログはまだありません
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日時</TableHead>
                          <TableHead>操作</TableHead>
                          <TableHead>理由</TableHead>
                          <TableHead>実行者</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {new Date(log.timestamp).toLocaleString('ja-JP')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={log.action === 'enabled' ? 'warning' : 'success'}>
                                {log.action === 'enabled' ? '🔧 有効化' : '✅ 無効化'}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.reason || '—'}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div>{log.performedBy}</div>
                                <div className="font-mono text-xs text-muted-foreground">
                                  {log.performedByUid}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>開発者の削除</DialogTitle>
            <DialogDescription>
              この開発者を削除してもよろしいですか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleRemoveDeveloper} disabled={loading}>
              {loading ? '削除中...' : '削除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
