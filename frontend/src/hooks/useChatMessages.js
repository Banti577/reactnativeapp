import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert } from 'react-native';

import {
  getConversation,
  sendMessage,
  sendFile,
  deleteMessage,
} from '../services/chatService';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function msgToState(m) {
  const media = m.attachedMedia?.[0];
  let mediaUrl = null;

  try {
    if (media?.getContentTemporaryUrl) {
      mediaUrl = await media.getContentTemporaryUrl();
    }
  } catch (err) {
    console.warn('[useChatMessages] media URL error:', err);
  }

  return {
    id: m.sid,
    body: m.body,
    author: m.author,
    ts: m.dateCreated,
    hasMedia: !!media,
    fileName: media?.filename ?? null,
    mediaType: media?.contentType ?? '',
    mediaUrl,
    _raw: m,
  };
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────
export function useChatMessages(currentUser, targetUser) {
  const conversationRef = useRef(null);
  const paginatorRef    = useRef(null);
  const hasLoadedOnce   = useRef(false);

  const [messages,       setMessages]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [hasMore,        setHasMore]        = useState(false);
  const [error,          setError]          = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null); // 0-100 | null

  // ─────────────────────────────────────────
  // INTERNAL: add message (dedup guard)
  // ─────────────────────────────────────────
  const addMessage = useCallback((formatted) => {
    setMessages(prev => {
      if (prev.some(x => x.id === formatted.id)) return prev;
      return [...prev, formatted];
    });
  }, []);

  // ─────────────────────────────────────────
  // CONNECT
  // ─────────────────────────────────────────
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const convo = await getConversation(currentUser, targetUser);
      conversationRef.current = convo;

      const page = await convo.getMessages(20);
      paginatorRef.current = page;
      setHasMore(page.hasPrevPage);

      const initial = await Promise.all(page.items.map(msgToState));
      setMessages(initial);

      // ── Real-time listeners ──
      convo.removeAllListeners('messageAdded');
      convo.removeAllListeners('messageRemoved');

      convo.on('messageAdded', async (m) => {
        const formatted = await msgToState(m);
        addMessage(formatted);
      });

      convo.on('messageRemoved', (m) => {
        setMessages(prev => prev.filter(x => x.id !== m.sid));
      });

    } catch (err) {
      console.error('[useChatMessages] connect error:', err);
      setError(err.message || 'Could not load conversation');
    } finally {
      setLoading(false);
    }
  }, [currentUser, targetUser, addMessage]);

  // ─────────────────────────────────────────
  // MOUNT / UNMOUNT
  // ─────────────────────────────────────────
  useEffect(() => {
    if (currentUser && targetUser) {
      connect();
    } else {
      setError('Missing user info. Please go back and try again.');
      setLoading(false);
    }

    return () => {
      const convo = conversationRef.current;
      if (convo) {
        convo.removeAllListeners('messageAdded');
        convo.removeAllListeners('messageRemoved');
      }
    };
  }, []); // intentional — only run on mount/unmount

  // ─────────────────────────────────────────
  // LOAD OLDER MESSAGES
  // ─────────────────────────────────────────
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || !paginatorRef.current) return;

    setLoadingMore(true);
    try {
      const prevPage = await paginatorRef.current.prevPage();
      paginatorRef.current = prevPage;
      setHasMore(prevPage.hasPrevPage);

      const older = await Promise.all(prevPage.items.map(msgToState));
      setMessages(prev => [...older, ...prev]);
    } catch (err) {
      console.error('[useChatMessages] loadMore error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  // ─────────────────────────────────────────
  // SEND TEXT
  // ─────────────────────────────────────────
  const onSend = useCallback(async (text) => {
    const convo = conversationRef.current;
    if (!text?.trim() || !convo) return;

    try {
      await sendMessage(convo, text);
    } catch (err) {
      console.error('[useChatMessages] send error:', err);
      throw err; // let the screen handle restoring the input
    }
  }, []);

  // ─────────────────────────────────────────
  // UPLOAD FILE
  // ─────────────────────────────────────────
  const onUploadFile = useCallback(async (file) => {
    const convo = conversationRef.current;
    if (!convo) return;

    setUploadProgress(0);
    try {
      await sendFile(convo, file, (percent) => setUploadProgress(percent));
    } catch (err) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploadProgress(null);
    }
  }, []);

  // ─────────────────────────────────────────
  // DELETE MESSAGE
  // ─────────────────────────────────────────
  const onDeleteMessage = useCallback(async (item) => {
    const convo = conversationRef.current;
    if (!convo || item.author !== currentUser) return;

    try {
      await deleteMessage(convo, item._raw);
    } catch (err) {
      Alert.alert('Error', 'Could not delete message');
    }
  }, [currentUser]);

  // ─────────────────────────────────────────
  // SCROLL STATE (owned here, consumed by screen)
  // ─────────────────────────────────────────
  const markLoadedOnce = useCallback(() => {
    hasLoadedOnce.current = true;
  }, []);

  const isFirstLoad = useCallback(() => {
    return !hasLoadedOnce.current;
  }, []);

  // ─────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────
  return {
    // state
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    uploadProgress,

    // actions
    connect,          // for retry button
    loadMoreMessages,
    onSend,
    onUploadFile,
    onDeleteMessage,

    // scroll helpers
    markLoadedOnce,
    isFirstLoad,
  };
}