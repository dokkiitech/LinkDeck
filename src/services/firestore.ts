import { Link, LinkDocument, Tag, TimelineEntry, TimelineEntryDocument } from '../types';
import { isValidURL } from '../utils/urlValidation';
import { apiRequest } from './apiClient';

interface ApiTimelineEntry {
  id: string;
  content: string;
  createdAt: string;
  type: 'note' | 'summary';
}

interface ApiLink {
  id: string;
  userId: string;
  url: string;
  title: string;
  tags: string[];
  isArchived: boolean;
  createdAt: string;
  summary?: string | null;
  timeline?: ApiTimelineEntry[];
}

interface ApiTag {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

const mapTimeline = (timeline?: ApiTimelineEntry[]): TimelineEntry[] | undefined => {
  if (!timeline || timeline.length === 0) {
    return undefined;
  }

  return timeline.map((entry) => ({
    id: entry.id,
    content: entry.content,
    createdAt: new Date(entry.createdAt),
    type: entry.type,
  }));
};

const mapLink = (link: ApiLink): Link => ({
  id: link.id,
  userId: link.userId,
  url: link.url,
  title: link.title,
  tags: link.tags || [],
  isArchived: Boolean(link.isArchived),
  createdAt: new Date(link.createdAt),
  summary: link.summary || undefined,
  timeline: mapTimeline(link.timeline),
});

const mapTag = (tag: ApiTag): Tag => ({
  id: tag.id,
  userId: tag.userId,
  name: tag.name,
  createdAt: new Date(tag.createdAt),
});

/**
 * リンクを作成
 */
export const createLink = async (
  _userId: string,
  url: string,
  title: string,
  tags: string[] = []
): Promise<string> => {
  if (!isValidURL(url)) {
    throw new Error('Invalid URL: 有効なURLを入力してください');
  }

  const response = await apiRequest<{ id: string }>('/v1/links', {
    method: 'POST',
    body: {
      url,
      title,
      tags,
    },
  });

  return response.id;
};

/**
 * リンクを取得
 */
export const getLink = async (linkId: string): Promise<Link | null> => {
  try {
    const response = await apiRequest<ApiLink>(`/v1/links/${encodeURIComponent(linkId)}`);
    return mapLink(response);
  } catch (error: any) {
    if (error?.message?.includes('not found')) {
      return null;
    }
    throw error;
  }
};

/**
 * ユーザーのリンク一覧を取得
 */
export const getUserLinks = async (
  _userId: string,
  includeArchived: boolean = false
): Promise<Link[]> => {
  const query = new URLSearchParams();
  if (includeArchived) {
    query.set('includeArchived', 'true');
  }

  const response = await apiRequest<{ links: ApiLink[] }>(`/v1/links?${query.toString()}`);
  return (response.links || []).map(mapLink);
};

/**
 * タグでリンクをフィルタリング
 */
export const getLinksByTag = async (
  _userId: string,
  tagName: string
): Promise<Link[]> => {
  const query = new URLSearchParams();
  query.set('tag', tagName);

  const response = await apiRequest<{ links: ApiLink[] }>(`/v1/links?${query.toString()}`);
  return (response.links || []).map(mapLink);
};

/**
 * リンクを更新
 */
export const updateLink = async (
  linkId: string,
  updates: Partial<Omit<LinkDocument, 'userId' | 'createdAt'>>
): Promise<void> => {
  const body: Record<string, unknown> = {};

  if (updates.url !== undefined) {
    body.url = updates.url;
  }
  if (updates.title !== undefined) {
    body.title = updates.title;
  }
  if (updates.isArchived !== undefined) {
    body.isArchived = Boolean(updates.isArchived);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'summary')) {
    body.summary = updates.summary ?? null;
  }

  await apiRequest<ApiLink>(`/v1/links/${encodeURIComponent(linkId)}`, {
    method: 'PATCH',
    body,
  });
};

/**
 * リンクを削除
 */
export const deleteLink = async (linkId: string): Promise<void> => {
  await apiRequest<void>(`/v1/links/${encodeURIComponent(linkId)}`, {
    method: 'DELETE',
  });
};

/**
 * リンクにタグを追加
 */
export const addTagToLink = async (linkId: string, tagName: string): Promise<void> => {
  await apiRequest<ApiLink>(`/v1/links/${encodeURIComponent(linkId)}/tags`, {
    method: 'POST',
    body: { name: tagName },
  });
};

/**
 * リンクからタグを削除
 */
export const removeTagFromLink = async (linkId: string, tagName: string): Promise<void> => {
  await apiRequest<ApiLink>(`/v1/links/${encodeURIComponent(linkId)}/tags/${encodeURIComponent(tagName)}`, {
    method: 'DELETE',
  });
};

/**
 * タグを作成
 */
export const createTag = async (_userId: string, name: string): Promise<string> => {
  const response = await apiRequest<ApiTag>('/v1/tags', {
    method: 'POST',
    body: { name },
  });

  return response.id;
};

/**
 * ユーザーのタグ一覧を取得
 */
export const getUserTags = async (_userId: string): Promise<Tag[]> => {
  const response = await apiRequest<{ tags: ApiTag[] }>('/v1/tags');
  return (response.tags || []).map(mapTag);
};

/**
 * タグを削除
 */
export const deleteTag = async (_userId: string, tagId: string): Promise<void> => {
  await apiRequest<void>(`/v1/tags/${encodeURIComponent(tagId)}`, {
    method: 'DELETE',
  });
};

/**
 * ユーザーが特定のURLを既に保存しているかチェック
 */
export const checkLinkExists = async (
  _userId: string,
  url: string
): Promise<boolean> => {
  const query = new URLSearchParams();
  query.set('url', url);

  const response = await apiRequest<{ exists: boolean }>(`/v1/links/exists?${query.toString()}`);
  return Boolean(response.exists);
};

/**
 * リンクにメモを追加
 */
export const addNoteToLink = async (
  linkId: string,
  content: string
): Promise<void> => {
  await apiRequest<ApiLink>(`/v1/links/${encodeURIComponent(linkId)}/notes`, {
    method: 'POST',
    body: {
      content,
      type: 'note',
    },
  });
};

/**
 * リンクに要約をタイムラインに追加
 */
export const addSummaryToTimeline = async (
  linkId: string,
  summary: string
): Promise<void> => {
  await apiRequest<ApiLink>(`/v1/links/${encodeURIComponent(linkId)}/notes`, {
    method: 'POST',
    body: {
      content: summary,
      type: 'summary',
    },
  });
};

/**
 * タイムラインからメモを削除
 */
export const deleteNoteFromTimeline = async (
  linkId: string,
  noteId: string
): Promise<void> => {
  await apiRequest<ApiLink>(`/v1/links/${encodeURIComponent(linkId)}/notes/${encodeURIComponent(noteId)}`, {
    method: 'DELETE',
  });
};
