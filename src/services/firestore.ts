import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Link, LinkDocument, Tag, TagDocument, TimelineEntry, TimelineEntryDocument } from '../types';
import { isValidURL } from '../utils/urlValidation';

/**
 * リンクコレクションの参照
 */
const linksCollection = collection(db, 'links');

/**
 * タグコレクションの参照
 */
const tagsCollection = collection(db, 'tags');

/**
 * リンクを作成
 */
export const createLink = async (
  userId: string,
  url: string,
  title: string,
  tags: string[] = []
): Promise<string> => {
  // URLの厳格なバリデーション
  if (!isValidURL(url)) {
    throw new Error('Invalid URL: 有効なURLを入力してください');
  }

  const linkData = {
    userId,
    url,
    title,
    tags,
    isArchived: false,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(linksCollection, linkData);
  return docRef.id;
};

/**
 * タイムラインエントリを変換
 */
const convertTimelineEntries = (
  timelineDoc?: TimelineEntryDocument[]
): TimelineEntry[] | undefined => {
  if (!timelineDoc || !Array.isArray(timelineDoc)) return undefined;

  return timelineDoc.map((entry, index) => ({
    id: `${index}`,
    content: entry.content,
    createdAt: entry.createdAt.toDate(),
    type: entry.type,
  }));
};

/**
 * リンクを取得
 */
export const getLink = async (linkId: string): Promise<Link | null> => {
  const docRef = doc(db, 'links', linkId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data() as LinkDocument;
    return {
      id: docSnap.id,
      ...data,
      isArchived: Boolean(data.isArchived), // Ensure boolean type
      createdAt: data.createdAt.toDate(),
      timeline: convertTimelineEntries(data.timeline),
    };
  }

  return null;
};

/**
 * ユーザーのリンク一覧を取得
 *
 * インデックスが必要:
 * - userId (ASC), isArchived (ASC), createdAt (DESC)
 * - userId (ASC), createdAt (DESC)
 */
export const getUserLinks = async (
  userId: string,
  includeArchived: boolean = false
): Promise<Link[]> => {
  let q;

  if (!includeArchived) {
    // アーカイブ済みを除外する場合: 複合インデックスが必要
    q = query(
      linksCollection,
      where('userId', '==', userId),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc')
    );
  } else {
    // 全てのリンクを取得する場合
    q = query(
      linksCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data() as LinkDocument;
    return {
      id: doc.id,
      ...data,
      isArchived: Boolean(data.isArchived), // Ensure boolean type
      createdAt: data.createdAt.toDate(),
      timeline: convertTimelineEntries(data.timeline),
    };
  });
};

/**
 * タグでリンクをフィルタリング
 */
export const getLinksByTag = async (
  userId: string,
  tagName: string
): Promise<Link[]> => {
  const q = query(
    linksCollection,
    where('userId', '==', userId),
    where('tags', 'array-contains', tagName),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data() as LinkDocument;
    return {
      id: doc.id,
      ...data,
      isArchived: Boolean(data.isArchived), // Ensure boolean type
      createdAt: data.createdAt.toDate(),
      timeline: convertTimelineEntries(data.timeline),
    };
  });
};

/**
 * リンクを更新
 */
export const updateLink = async (
  linkId: string,
  updates: Partial<Omit<LinkDocument, 'userId' | 'createdAt'>>
): Promise<void> => {
  const docRef = doc(db, 'links', linkId);

  // Ensure isArchived is always a boolean if it's being updated
  const sanitizedUpdates = { ...updates };
  if ('isArchived' in sanitizedUpdates && sanitizedUpdates.isArchived !== undefined) {
    sanitizedUpdates.isArchived = Boolean(sanitizedUpdates.isArchived);
  }

  await updateDoc(docRef, sanitizedUpdates);
};

/**
 * リンクを削除
 */
export const deleteLink = async (linkId: string): Promise<void> => {
  const docRef = doc(db, 'links', linkId);
  await deleteDoc(docRef);
};

/**
 * リンクにタグを追加
 */
export const addTagToLink = async (linkId: string, tagName: string): Promise<void> => {
  const link = await getLink(linkId);
  if (link && !link.tags.includes(tagName)) {
    const updatedTags = [...link.tags, tagName];
    await updateLink(linkId, { tags: updatedTags });
  }
};

/**
 * リンクからタグを削除
 */
export const removeTagFromLink = async (linkId: string, tagName: string): Promise<void> => {
  const link = await getLink(linkId);
  if (link) {
    const updatedTags = link.tags.filter((tag) => tag !== tagName);
    await updateLink(linkId, { tags: updatedTags });
  }
};

/**
 * タグを作成
 */
export const createTag = async (userId: string, name: string): Promise<string> => {
  const tagData: TagDocument = {
    userId,
    name,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(tagsCollection, tagData);
  return docRef.id;
};

/**
 * ユーザーのタグ一覧を取得
 */
export const getUserTags = async (userId: string): Promise<Tag[]> => {
  const q = query(
    tagsCollection,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data() as TagDocument;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    };
  });
};

/**
 * タグを削除
 */
export const deleteTag = async (userId: string, tagId: string): Promise<void> => {
  // タグを削除
  const docRef = doc(db, 'tags', tagId);
  const tagDoc = await getDoc(docRef);

  if (tagDoc.exists()) {
    const tagData = tagDoc.data() as TagDocument;
    const tagName = tagData.name;

    // このタグを使用している全てのリンクからタグを削除
    const links = await getLinksByTag(userId, tagName);
    await Promise.all(
      links.map((link) => removeTagFromLink(link.id, tagName))
    );

    // タグを削除
    await deleteDoc(docRef);
  }
};

/**
 * ユーザーが特定のURLを既に保存しているかチェック
 */
export const checkLinkExists = async (
  userId: string,
  url: string
): Promise<boolean> => {
  const q = query(
    linksCollection,
    where('userId', '==', userId),
    where('url', '==', url),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

/**
 * リンクにメモを追加
 */
export const addNoteToLink = async (
  linkId: string,
  content: string
): Promise<void> => {
  const link = await getLink(linkId);
  if (!link) {
    throw new Error('Link not found');
  }

  const existingTimeline = link.timeline || [];
  const newEntry: TimelineEntryDocument = {
    content,
    createdAt: Timestamp.now(),
    type: 'note',
  };

  const updatedTimeline = [...(link.timeline?.map((entry) => ({
    content: entry.content,
    createdAt: Timestamp.fromDate(entry.createdAt),
    type: entry.type,
  })) || []), newEntry];

  await updateLink(linkId, { timeline: updatedTimeline });
};

/**
 * リンクに要約をタイムラインに追加
 */
export const addSummaryToTimeline = async (
  linkId: string,
  summary: string
): Promise<void> => {
  const link = await getLink(linkId);
  if (!link) {
    throw new Error('Link not found');
  }

  const newEntry: TimelineEntryDocument = {
    content: summary,
    createdAt: Timestamp.now(),
    type: 'summary',
  };

  const updatedTimeline = [...(link.timeline?.map((entry) => ({
    content: entry.content,
    createdAt: Timestamp.fromDate(entry.createdAt),
    type: entry.type,
  })) || []), newEntry];

  await updateLink(linkId, { summary, timeline: updatedTimeline });
};
