import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActionSheetIOS,
  Image,
  Linking,
} from 'react-native';

import { launchImageLibrary } from 'react-native-image-picker';
import { pick } from '@react-native-documents/picker';

import {
  getConversation,
  sendMessage,
  sendFile,
  deleteMessage,
} from '../../services/chatService';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function msgToState(m) {
  const media = m.attachedMedia?.[0];
  let mediaUrl = null;

  try {
    if (media?.getContentTemporaryUrl) {
      mediaUrl = await media.getContentTemporaryUrl();
    }
  } catch (err) {
    console.warn('[ChatScreen] media URL error:', err);
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
// COMPONENT
// ─────────────────────────────────────────────
const ChatScreen = ({ route, navigation }) => {
  const { currentUser, targetUser } = route?.params || {};

  // ── Refs ──
  const conversationRef  = useRef(null);
  const paginatorRef     = useRef(null);
  const flatListRef      = useRef(null);

  // FIX 1: Track whether initial scroll-to-bottom has happened
  // We use TWO flags:
  // - messagesReadyRef: messages have been set in state
  // - hasScrolledOnceRef: we have already done the first scrollToEnd
  const messagesReadyRef   = useRef(false);
  const hasScrolledOnceRef = useRef(false);

  const scrollOffsetRef  = useRef(0);
  const contentHeightRef = useRef(0);

  // Stale-closure-safe refs — onScroll captures state once and never sees updates
  const loadingMoreRef = useRef(false);
  const hasMoreRef     = useRef(false);

  // ── State ──
  const [messages,       setMessages]       = useState([]);
  const [text,           setText]           = useState('');
  const [loading,        setLoading]        = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [hasMore,        setHasMore]        = useState(false);
  const [error,          setError]          = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  // ── Sync helpers: always update ref AND state together ──
  const setLoadingMoreSync = (val) => {
    loadingMoreRef.current = val;
    setLoadingMore(val);
  };

  const setHasMoreSync = (val) => {
    hasMoreRef.current = val;
    setHasMore(val);
  };

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
  }, []);

 
  const onContentSizeChange = (_, newHeight) => {
    contentHeightRef.current = newHeight;

    if (!hasScrolledOnceRef.current && messagesReadyRef.current) {
      // First time content is sized after messages are ready — jump to bottom
      flatListRef.current?.scrollToEnd({ animated: false });
      hasScrolledOnceRef.current = true;
      return;
    }

    if (hasScrolledOnceRef.current && !loadingMoreRef.current) {
      // A new message was added at bottom — scroll down to show it
      flatListRef.current?.scrollToEnd({ animated: true });
    }

    // If loadingMore — do nothing here. Scroll position is restored in loadMoreMessages.
  };

  // ─────────────────────────────────────────
  // CONNECT
  // ─────────────────────────────────────────
  const connect = async () => {
    setLoading(true);
    setError(null);
    messagesReadyRef.current   = false;
    hasScrolledOnceRef.current = false;

    try {
      const convo = await getConversation(currentUser, targetUser);
      conversationRef.current = convo;

      const page = await convo.getMessages(20);
      paginatorRef.current = page;
      setHasMoreSync(page.hasPrevPage);

      const initial = await Promise.all(page.items.map(msgToState));

      // Mark messages ready BEFORE setMessages so onContentSizeChange
      // sees the flag as true on the very first render
      messagesReadyRef.current = true;
      setMessages(initial);

      // ── Real-time listeners ──
      convo.removeAllListeners('messageAdded');
      convo.removeAllListeners('messageRemoved');

      convo.on('messageAdded', async m => {
        const formatted = await msgToState(m);
        setMessages(prev => {
          if (prev.some(x => x.id === formatted.id)) return prev;
          return [...prev, formatted];
        });
      });

      convo.on('messageRemoved', m => {
        setMessages(prev => prev.filter(x => x.id !== m.sid));
      });

    } catch (err) {
      console.error('[ChatScreen] connect error:', err);
      setError(err.message || 'Could not load conversation');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // FIX 2 + 3: LOAD OLDER MESSAGES
  // Triggered when scrolling UP (near top), not down.
  // After loading, restore scroll so view does not jump.
  // ─────────────────────────────────────────
  const loadMoreMessages = async () => {
    if (loadingMoreRef.current || !hasMoreRef.current || !paginatorRef.current) return;

    setLoadingMoreSync(true);

    // Snapshot height BEFORE React re-renders with prepended messages
    const heightBefore = contentHeightRef.current;

    try {
      const prevPage = await paginatorRef.current.prevPage();
      paginatorRef.current = prevPage;
      setHasMoreSync(prevPage.hasPrevPage);

      const older = await Promise.all(prevPage.items.map(msgToState));

      // Prepend older messages to the top
      setMessages(prev => [...older, ...prev]);

      // After layout updates, shift scroll offset by the height that was added
      // so the currently visible messages stay in view (no jump to top)
      requestAnimationFrame(() => {
        const diff = contentHeightRef.current - heightBefore;
        if (diff > 0) {
          flatListRef.current?.scrollToOffset({
            offset: scrollOffsetRef.current + diff,
            animated: false,
          });
        }
      });

    } catch (err) {
      console.error('[ChatScreen] loadMore error:', err);
    } finally {
      setLoadingMoreSync(false);
    }
  };

  // ─────────────────────────────────────────
  // SCROLL HANDLER
  // FIX 2: Load older messages when near TOP (offset < 80)
  // NOT when scrolling down (do not use onEndReached for this)
  // ─────────────────────────────────────────
  const onScroll = ({ nativeEvent }) => {
    const { contentOffset, contentSize } = nativeEvent;

    scrollOffsetRef.current  = contentOffset.y;
    contentHeightRef.current = contentSize.height;

    // Near TOP = load older messages
    //  Read refs not state — no stale closure
    if (contentOffset.y < 80 && hasMoreRef.current && !loadingMoreRef.current) {
      loadMoreMessages();
    }
  };

  // ─────────────────────────────────────────
  // SEND TEXT
  // ─────────────────────────────────────────
  const onSend = async () => {
    const convo = conversationRef.current;
    if (!text.trim() || !convo) return;

    const temp = text;
    setText('');

    try {
      await sendMessage(convo, temp);
    } catch (err) {
      console.error('[ChatScreen] send error:', err);
      setText(temp);
    }
  };

  // ─────────────────────────────────────────
  // ATTACH FILE
  // ─────────────────────────────────────────
  const onAttach = () => {
    const options = ['Image', 'Document', 'Cancel'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2 },
        index => {
          if (index === 0) pickImage();
          if (index === 1) pickDocument();
        },
      );
    } else {
      Alert.alert('Attach', 'What do you want to send?', [
        { text: 'Image',    onPress: pickImage },
        { text: 'Document', onPress: pickDocument },
        { text: 'Cancel',   style: 'cancel' },
      ]);
    }
  };

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'mixed', quality: 0.8 });
      if (result.didCancel || !result.assets?.[0]) return;
      const asset = result.assets[0];
      await uploadFile({
        uri:  asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.type    || 'image/jpeg',
        size: asset.fileSize,
      });
    } catch {
      Alert.alert('Error', 'Could not pick image');
    }
  };

  const pickDocument = async () => {
    try {
      const [result] = await pick({ mode: 'open' });
      if (!result) return;
      await uploadFile({
        uri:  result.uri,
        name: result.name,
        type: result.type || 'application/octet-stream',
        size: result.size,
      });
    } catch {
      Alert.alert('Error', 'Could not pick file');
    }
  };

  const uploadFile = async file => {
    const convo = conversationRef.current;
    if (!convo) return;

    setUploadProgress(0);
    try {
      await sendFile(convo, file, percent => setUploadProgress(percent));
    } catch (err) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploadProgress(null);
    }
  };

  // ─────────────────────────────────────────
  // DELETE MESSAGE
  // ─────────────────────────────────────────
  const onLongPressMessage = item => {
    const convo = conversationRef.current;
    if (!convo || item.author !== currentUser) return;

    Alert.alert(
      'Delete Message?',
      'This will remove the message for everyone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage(convo, item._raw);
            } catch {
              Alert.alert('Error', 'Could not delete message');
            }
          },
        },
      ],
    );
  };

  // ─────────────────────────────────────────
  // RENDER MESSAGE
  // ─────────────────────────────────────────
  const renderItem = ({ item }) => {
    const isMine   = item.author === currentUser;
    const hasMedia = item.hasMedia;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => onLongPressMessage(item)}
        style={[styles.messageBox, isMine && styles.myMessage]}
      >
        <Text style={styles.author}>{item.author}</Text>

        {hasMedia ? (
          <TouchableOpacity
            onPress={async () => {
              try {
                const url = await item.mediaUrl;
                if (url) Linking.openURL(url);
              } catch {
                console.warn('[ChatScreen] open file error');
              }
            }}
          >
            {item.mediaType.startsWith('image/') ? (
              <Image
                source={{ uri: item.mediaUrl }}
                style={styles.chatImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.fileRow}>
                <Text style={styles.fileIcon}>📎</Text>
                <Text style={styles.fileName}>{item.fileName || 'File'}</Text>
              </View>
            )}
            <Text style={styles.downloadText}>Tap to open</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.message}>{item.body}</Text>
        )}

        {isMine && (
          <Text style={styles.deleteHint}>꞉꞉ Hold to delete</Text>
        )}

        <Text style={styles.time}>{formatTime(item.ts)}</Text>
      </TouchableOpacity>
    );
  };

  // ─────────────────────────────────────────
  // LOADING / ERROR STATES
  // ─────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Opening chat…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={connect}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────
  // CHAT UI
  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{targetUser}</Text>
          <Text style={styles.headerSub}>@{currentUser}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: 'flex-end' }}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onContentSizeChange={onContentSizeChange}
          // NO onEndReached — we load older messages on scroll UP, not down
          ListHeaderComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color="#007AFF"
                style={{ marginBottom: 12 }}
              />
            ) : hasMore ? (
              <Text style={styles.loadMoreHint}>Scroll up for older messages</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>No messages yet. Say hello! 👋</Text>
            </View>
          }
        />

        {/* UPLOAD PROGRESS */}
        {uploadProgress !== null && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            <Text style={styles.progressText}>Uploading… {uploadProgress}%</Text>
          </View>
        )}

        {/* INPUT ROW */}
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachBtn} onPress={onAttach}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            multiline
          />

          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={onSend}
            disabled={!text.trim()}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  errorText: {
    color: '#E53935',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },

  retryBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },

  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },

  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },

  backIcon: {
    fontSize: 22,
    color: '#007AFF',
  },

  headerCenter: {
    flex: 1,
  },

  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  headerSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },

  // ── Messages ──
  messageBox: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 10,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },

  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#cfe9ff',
  },

  author: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },

  message: {
    fontSize: 15,
    color: '#111',
  },

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  fileIcon: {
    fontSize: 18,
    marginRight: 6,
  },

  fileName: {
    fontSize: 14,
    color: '#007AFF',
  },

  deleteHint: {
    fontSize: 9,
    color: '#aaa',
    marginTop: 4,
  },

  time: {
    marginTop: 4,
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
  },

  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyChatText: {
    color: '#aaa',
    fontSize: 15,
  },

  // ── Input ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },

  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  attachIcon: {
    fontSize: 20,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    minHeight: 42,
    maxHeight: 100,
    marginRight: 8,
  },

  sendBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  sendBtnDisabled: {
    backgroundColor: '#b0cfff',
  },

  sendBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Upload Progress ──
  progressBar: {
    height: 28,
    backgroundColor: '#e8f4ff',
    marginHorizontal: 10,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
    justifyContent: 'center',
  },

  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
    opacity: 0.25,
  },

  progressText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Media ──
  chatImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginTop: 6,
  },

  downloadText: {
    marginTop: 6,
    fontSize: 11,
    color: '#007AFF',
  },

  loadMoreHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#aaa',
    marginBottom: 10,
  },
});