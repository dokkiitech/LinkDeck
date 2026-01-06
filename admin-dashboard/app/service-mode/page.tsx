'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ServiceModeConfig, ServiceModeHistory } from '@/lib/types';

export default function ServiceModePage() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [disabledFeatures, setDisabledFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ServiceModeHistory[]>([]);

  // 仮のユーザー情報（本来は認証から取得）
  const currentUser = {
    uid: 'admin-uid',
    email: 'admin@example.com',
  };

  // 初回ロード時に現在の設定を取得
  useEffect(() => {
    loadCurrentConfig();
    loadHistory();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const docRef = doc(db, 'config', 'serviceMode');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setEnabled(data.enabled || false);
        setMessage(data.message || '');
        setDisabledFeatures(data.disabledFeatures || []);
      }
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
      alert('設定の読み込みに失敗しました');
    }
  };

  const loadHistory = async () => {
    try {
      const historyRef = collection(db, 'config', 'serviceMode', 'history');
      const q = query(historyRef, orderBy('changedAt', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);

      const historyData: ServiceModeHistory[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          enabled: data.enabled,
          message: data.message || '',
          disabledFeatures: data.disabledFeatures || [],
          changedAt: data.changedAt.toDate(),
          changedBy: data.changedBy,
          changedByEmail: data.changedByEmail,
          reason: data.reason || '',
        };
      });

      setHistory(historyData);
    } catch (error) {
      console.error('履歴の読み込みに失敗しました:', error);
    }
  };

  const handleSave = async () => {
    if (!reason.trim()) {
      alert('変更理由を入力してください');
      return;
    }

    setLoading(true);
    try {
      // 設定を保存
      const configRef = doc(db, 'config', 'serviceMode');
      await setDoc(configRef, {
        enabled,
        message,
        disabledFeatures,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser.uid,
        updatedByEmail: currentUser.email,
        reason,
      });

      // 履歴を保存
      const historyRef = collection(db, 'config', 'serviceMode', 'history');
      await setDoc(doc(historyRef), {
        enabled,
        message,
        disabledFeatures,
        changedAt: Timestamp.now(),
        changedBy: currentUser.uid,
        changedByEmail: currentUser.email,
        reason,
      });

      alert('設定を保存しました');
      setReason(''); // 理由をリセット
      loadHistory(); // 履歴を再読み込み
    } catch (error) {
      console.error('保存に失敗しました:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (feature: string) => {
    if (disabledFeatures.includes(feature)) {
      setDisabledFeatures(disabledFeatures.filter((f) => f !== feature));
    } else {
      setDisabledFeatures([...disabledFeatures, feature]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          サービスモード管理
        </h1>

        {/* 現在のステータス */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">現在のステータス</h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                enabled
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {enabled ? '🔴 サービスモード中' : '🟢 通常運用中'}
            </span>
          </div>

          {/* サービスモードトグル */}
          <div className="mb-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
              <span className="text-gray-700 font-medium">
                サービスモードを有効化
              </span>
            </label>
          </div>

          {/* メッセージ入力 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              表示メッセージ
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ユーザーに表示するメッセージを入力してください"
            />
          </div>

          {/* 無効化する機能 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              無効化する機能
            </label>
            <div className="space-y-2">
              {['link-add', 'ai-search', 'link-view'].map((feature) => (
                <label key={feature} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={disabledFeatures.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">
                    {feature === 'link-add' && 'リンク追加'}
                    {feature === 'ai-search' && 'AI検索'}
                    {feature === 'link-view' && 'リンク閲覧'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 変更理由 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              変更理由 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="この変更を行う理由を記入してください"
              required
            />
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? '保存中...' : '変更を保存'}
          </button>
        </div>

        {/* 変更履歴 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">変更履歴</h2>
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                変更履歴がありません
              </p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {item.changedByEmail}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.changedAt.toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                        item.enabled
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.enabled ? 'ON' : 'OFF'}
                    </span>
                    {item.reason}
                  </div>
                  {item.message && (
                    <div className="text-xs text-gray-500 mt-1">
                      メッセージ: {item.message}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
