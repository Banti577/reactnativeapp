import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Alert,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';

import {
  initChat,
  shutdownChat,
  getAllConversations,
  getConversation,
} from '../../features/chat/services/chatService';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function formatLastTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function getInitials(name = '') {
  return name.slice(0, 2).toUpperCase() || '??';
}

// Generate a consistent color from username
function avatarColor(name = '') {
  const colors = [
    '#E57373', '#F06292', '#BA68C8', '#7986CB',
    '#4FC3F7', '#4DB6AC', '#81C784', '#FFD54F',
    '#FF8A65', '#A1887F',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Extract the "other" participant name from a conversation
function getOtherParticipant(convo, myIdentity) {
  const uniqueName = convo.uniqueName || '';
  const parts = uniqueName.split('__');
  if (parts.length === 2) {
    return parts.find(p => p !== myIdentity) || uniqueName;
  }
  return convo.friendlyName || uniqueName || 'Unknown';
}

// ─────────────────────────────────────────────
// AVATAR COMPONENT
// ─────────────────────────────────────────────
const Avatar = ({ name, size = 50 }) => (
  <View style={[
    styles.avatar,
    { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name) }
  ]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>
      {getInitials(name)}
    </Text>
  </View>
);

// ─────────────────────────────────────────────
// CONVERSATION ITEM
// ─────────────────────────────────────────────
const ConversationItem = ({ item, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.convoItem}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <Avatar name={item.otherUser} size={52} />

        <View style={styles.convoInfo}>
          <View style={styles.convoTopRow}>
            <Text style={styles.convoName} numberOfLines={1}>
              {item.otherUser}
            </Text>
            <Text style={styles.convoTime}>
              {formatLastTime(item.lastMessageTime)}
            </Text>
          </View>

          <View style={styles.convoBottomRow}>
            <Text style={styles.convoPreview} numberOfLines={1}>
              {item.lastMessage || 'Tap to start chatting'}
            </Text>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unread > 99 ? '99+' : item.unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};


// MAIN SCREEN

const ConversationsListScreen = ({ navigation }) => {
  // ── Registration state ──
  const [username, setUsername] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentUser, setCurrentUser] = useState('');

  // ── Conversations state ──
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ── New conversation modal ──
  const [showNewConvoModal, setShowNewConvoModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Animations
  const fabScale = useRef(new Animated.Value(1)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;

  // ─────────────────────────────────────────
  // LOAD CONVERSATIONS
  // ─────────────────────────────────────────
  const loadConversations = useCallback(async (identityOverride) => {
    // Use the passed identity if provided (avoids stale state on first load)
    const myIdentity = identityOverride || currentUser;

    try {
      const all = await getAllConversations();

      const formatted = await Promise.all(
        all.map(async (convo) => {
          let lastMessage = '';
          let lastMessageTime = null;
          let unread = 0;

          try {
            const lastMsgIndex = convo.lastMessage?.index;

            if (lastMsgIndex != null) {
              const page = await convo.getMessages(1, lastMsgIndex, 'backwards');
              if (page.items.length > 0) {
                const last = page.items[0];
                lastMessage = last.attachedMedia?.length
                  ? '📎 Attachment'
                  : last.body || '';
                lastMessageTime = last.dateCreated;
              }
            } else {
              lastMessageTime = convo.dateUpdated || null;
            }


            // const last = convo.lastMessage;

            // if (last) {
            //   lastMessage =
            //     last.body || '📎 Attachment';

            //   lastMessageTime =
            //     last.dateCreated;
            // } else {
            //   lastMessageTime =
            //     convo.dateUpdated || null;
            // }

            unread = await convo.getUnreadMessagesCount() || 0;
          } catch (_) { }

          return {
            sid: convo.sid,
            otherUser: getOtherParticipant(convo, myIdentity),
            lastMessage,
            lastMessageTime,
            unread,
            _raw: convo,
          };
        })
      );

      // Sort by latest message
      formatted.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      });

      setConversations(formatted);

      // Fade in list
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

    } catch (err) {
      console.log('LOAD CONVOS ERROR:', err);
      setError('Could not load conversations');
    }
  }, [currentUser, listOpacity]);



//   const loadConversations = useCallback(
//   async (identityOverride) => {

//     const myIdentity =
//       identityOverride || currentUser;

//     try {

//       const all =
//         await getAllConversations();

//       // STEP 1
//       // FAST INITIAL RENDER

//       const initial = all.map((convo) => ({
//         sid: convo.sid,

//         otherUser:
//           getOtherParticipant(
//             convo,
//             myIdentity
//           ),

//         lastMessage:
//           'Loading...',

//         lastMessageTime:
//           convo.lastMessage?.dateCreated ||
//           convo.dateUpdated ||
//           null,

//         unread: 0,

//         _raw: convo,
//       }));

//       // sort immediately

//       initial.sort((a, b) => {
//         if (!a.lastMessageTime) return 1;
//         if (!b.lastMessageTime) return -1;

//         return (
//           new Date(b.lastMessageTime) -
//           new Date(a.lastMessageTime)
//         );
//       });

//       // render instantly

//       setConversations(initial);

//       Animated.timing(listOpacity, {
//         toValue: 1,
//         duration: 350,
//         useNativeDriver: true,
//       }).start();

//       // STEP 2
//       // BACKGROUND ENRICHMENT

//       initial.forEach(async (item) => {

//         const convo = item._raw;

//         let lastMessage = '';
//         let unread = 0;

//         try {

//           // ONLY fetch latest single message

//           const lastMsgIndex =
//             convo.lastMessage?.index;

//           if (lastMsgIndex != null) {

//             const page =
//               await convo.getMessages(
//                 1,
//                 lastMsgIndex,
//                 'backwards'
//               );

//             if (page.items.length > 0) {

//               const last =
//                 page.items[0];

//               if (
//                 last.attachedMedia?.length
//               ) {

//                 const media =
//                   last.attachedMedia[0];

//                 const type =
//                   media.contentType || '';

//                 if (
//                   type.startsWith(
//                     'image/'
//                   )
//                 ) {
//                   lastMessage =
//                     '📷 Photo';

//                 } else if (
//                   type.startsWith(
//                     'video/'
//                   )
//                 ) {
//                   lastMessage =
//                     '🎥 Video';

//                 } else if (
//                   type.includes(
//                     'pdf'
//                   )
//                 ) {
//                   lastMessage =
//                     '📄 PDF';

//                 } else {
//                   lastMessage =
//                     '📎 Attachment';
//                 }

//               } else {

//                 lastMessage =
//                   last.body || '';
//               }
//             }
//           }

//           unread =
//             await convo.getUnreadMessagesCount() || 0;

//         } catch (err) {

//           console.log(
//             'BACKGROUND FETCH ERROR',
//             err
//           );
//         }

//         // UPDATE ONLY THIS ITEM

//         setConversations(prev =>

//           prev.map(c => {

//             if (
//               c.sid !== item.sid
//             ) {
//               return c;
//             }

//             return {
//               ...c,
//               lastMessage:
//                 lastMessage ||
//                 'Tap to start chatting',

//               unread,
//             };
//           })
//         );
//       });

//     } catch (err) {

//       console.log(
//         'LOAD CONVOS ERROR:',
//         err
//       );

//       setError(
//         'Could not load conversations'
//       );
//     }

//   },
//   [currentUser, listOpacity]
// );



  const handleRegister = async () => {
    const me = username.trim();
    if (!me) return setError('Please enter a username');
    if (me.length < 3) return setError('Username must be at least 3 characters');

    setError(null);
    setLoading(true);

    try {
      const client = await initChat(me);
      setCurrentUser(me);
      setIsRegistered(true);
      await loadConversations(me);   // pass `me` directly — state hasn't committed yet

      // Real-time: new conversation or message → refresh list
      client.on('conversationJoined', () => loadConversations(me));
      client.on('messageAdded', () => loadConversations(me));
    } catch (err) {
      setError(err.message || 'Could not connect. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // REFRESH
  // ─────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  // ─────────────────────────────────────────
  // OPEN EXISTING CONVERSATION
  // ─────────────────────────────────────────
  const openConversation = (item) => {
    navigation.navigate('Chat', {
      currentUser,
      targetUser: item.otherUser,
    });
  };

  // ─────────────────────────────────────────
  // START NEW CONVERSATION
  // ─────────────────────────────────────────
  const handleStartNew = async () => {
    const target = newUsername.trim();

    if (!target) return setModalError('Enter a username');
    if (target === currentUser) return setModalError('Cannot chat with yourself');

    // Check if conversation already exists
    const exists = conversations.find(c => c.otherUser === target);
    if (exists) {
      setShowNewConvoModal(false);
      setNewUsername('');
      setModalError('');
      navigation.navigate('Chat', { currentUser, targetUser: target });
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      // This will create or fetch the conversation
      await getConversation(currentUser, target);
      setShowNewConvoModal(false);
      setNewUsername('');
      setModalError('');
      // Navigate to chat
      navigation.navigate('Chat', { currentUser, targetUser: target });
      // Refresh list in background
      loadConversations();
    } catch (err) {
      setModalError(err.message || 'Could not start conversation');
    } finally {
      setModalLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await shutdownChat();
          setIsRegistered(false);
          setCurrentUser('');
          setUsername('');
          setConversations([]);
          listOpacity.setValue(0);
        },
      },
    ]);
  };

  // FAB press animation
  const onFabPressIn = () =>
    Animated.spring(fabScale, { toValue: 0.92, useNativeDriver: true, speed: 40 }).start();
  const onFabPressOut = () =>
    Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();


  // REGISTER SCREEN

  if (!isRegistered) {
    return (
      <SafeAreaView style={styles.registerSafe}>
        <StatusBar barStyle="light-content" backgroundColor="#075E54" />

        <View style={styles.registerHeader}>
          <Text style={styles.registerHeaderTitle}>InterviewNow</Text>
        </View>

        <View style={styles.registerBody}>
          <View style={styles.registerAvatarWrap}>
            <View style={styles.registerAvatarBig}>
              <Text style={styles.registerAvatarIcon}>💬</Text>
            </View>
          </View>

          <Text style={styles.registerTitle}>Welcome</Text>
          <Text style={styles.registerSubtitle}>
            Enter your username to get started
          </Text>

          <TextInput
            style={styles.registerInput}
            placeholder="Your username"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={t => { setUsername(t); setError(null); }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          {!!error && (
            <Text style={styles.registerError}>{error}</Text>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#075E54" style={{ marginTop: 24 }} />
          ) : (
            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
              <Text style={styles.registerBtnText}>Continue →</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────
  // CONVERSATIONS LIST
  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#075E54" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Twilio</Text>
          <Text style={styles.headerSub}>@{currentUser}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#075E54" />
          <Text style={styles.loadingText}>Loading chats…</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: listOpacity }}>
          <FlatList
            data={conversations}
            keyExtractor={item => item.sid}
            renderItem={({ item }) => (
              <ConversationItem
                item={item}
                onPress={() => openConversation(item)}
              />
            )}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyIcon}>🗨️</Text>
                <Text style={styles.emptyTitle}>No conversations yet</Text>
                <Text style={styles.emptySub}>
                  Tap the + button to start chatting
                </Text>
              </View>
            }
            contentContainerStyle={
              conversations.length === 0 ? { flex: 1 } : { paddingBottom: 90 }
            }
          />
        </Animated.View>
      )}

      {/* FAB */}
      <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => { setShowNewConvoModal(true); setModalError(''); setNewUsername(''); }}
          onPressIn={onFabPressIn}
          onPressOut={onFabPressOut}
          activeOpacity={1}
        >
          <Text style={styles.fabIcon}>＋</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* NEW CONVERSATION MODAL */}
      <Modal
        visible={showNewConvoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewConvoModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNewConvoModal(false)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>New Conversation</Text>
          <Text style={styles.modalSub}>Enter the username you want to chat with</Text>

          <TextInput
            style={styles.modalInput}
            placeholder="Username"
            placeholderTextColor="#aaa"
            value={newUsername}
            onChangeText={t => { setNewUsername(t); setModalError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleStartNew}
          />

          {!!modalError && (
            <Text style={styles.modalError}>{modalError}</Text>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowNewConvoModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            {modalLoading ? (
              <View style={styles.modalStartBtn}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            ) : (
              <TouchableOpacity style={styles.modalStartBtn} onPress={handleStartNew}>
                <Text style={styles.modalStartText}>Start Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ConversationsListScreen;

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // ── Register ──
  registerSafe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  registerHeader: {
    backgroundColor: 'red',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  registerHeaderTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  registerBody: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerAvatarWrap: {
    marginBottom: 28,
  },
  registerAvatarBig: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DCF8C6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerAvatarIcon: {
    fontSize: 46,
  },
  registerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
    marginBottom: 8,
  },
  registerSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  registerInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fafafa',
    marginBottom: 6,
  },
  registerError: {
    color: '#E53935',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  registerBtn: {
    marginTop: 24,
    backgroundColor: '#075E54',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 48,
    alignItems: 'center',
    shadowColor: '#075E54',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Header ──
  header: {
    backgroundColor: '#075E54',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 1,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoutText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Conversation Item ──
  convoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  convoInfo: {
    flex: 1,
  },
  convoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    flex: 1,
    marginRight: 8,
  },
  convoTime: {
    fontSize: 12,
    color: '#999',
  },
  convoBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convoPreview: {
    fontSize: 13.5,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#eee',
    marginLeft: 82,
  },

  // ── Empty State ──
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // ── FAB ──
  fabWrap: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fafafa',
    marginBottom: 8,
  },
  modalError: {
    color: '#E53935',
    fontSize: 13,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  modalStartBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#075E54',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#075E54',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  modalStartText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
