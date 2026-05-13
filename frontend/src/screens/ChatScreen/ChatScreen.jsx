import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

import {
  initChat,
  getConversation,
  sendMessage,
  shutdownChat,
} from '../../services/chatService';

const ChatScreen = () => {
  // ── Login state ──
  const [currentUser, setCurrentUser] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ── Chat state ──
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => { shutdownChat(); };
  }, []);

  // ─────────────────────────────────────────
  // STEP 1 — Login screen submit
  // ─────────────────────────────────────────
  const handleLogin = async () => {
    const me = currentUser.trim();
    const other = targetUser.trim();

    if (!me || !other) {
      setError('Dono fields fill karo');
      return;
    }
    if (me === other) {
      setError('Alag usernames daalo');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // GET /voice/token?identity=me
      await initChat(me);

      // POST /conversation { user1: me, user2: other }
      const convo = await getConversation(me, other);
      setConversation(convo);

      // Load history
      const page = await convo.getMessages(50);
      setMessages(
        page.items.map(m => ({
          id: m.sid,
          body: m.body,
          author: m.author,
          ts: m.dateCreated,
        })),
      );

      // Real-time listener

      const onMessageAdded = m => {

        setMessages(prev => {

          const exists =
            prev.some(
              msg => msg.id === m.sid
            );

          if (exists) {
            return prev;
          }

          return [
            ...prev,
            {
              id: m.sid,
              body: m.body,
              author: m.author,
              ts: m.dateCreated,
            },
          ];
        });
      };

      convo.removeAllListeners('messageAdded');

      convo.on(
        'messageAdded',
        onMessageAdded
      );


      setIsLoggedIn(true);
      console.log('✅ CHAT READY');
    } catch (err) {
      console.log('CHAT ERROR', err);
      setError(err.message || 'Connection fail ho gayi');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // STEP 2 — Send message
  // ─────────────────────────────────────────
  const onSend = async () => {
    if (!text.trim() || !conversation) return;
    const temp = text;
    setText('');
    try {
      await sendMessage(conversation, temp);
    } catch (err) {
      console.log('SEND ERROR', err);
      setText(temp);
    }
  };

  // ─────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────
  const handleLogout = () => {
    shutdownChat();
    setIsLoggedIn(false);
    setConversation(null);
    setMessages([]);
    setCurrentUser('');
    setTargetUser('');
    setError(null);
  };

  // ─────────────────────────────────────────
  // Render message bubble
  // ─────────────────────────────────────────
  const renderItem = ({ item }) => {
    const isMine = item.author === currentUser;
    const time = item.ts
      ? new Date(item.ts).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
      : '';
    return (
      <View style={[styles.messageBox, isMine && styles.myMessage]}>
        <Text style={styles.author}>{item.author}</Text>
        <Text style={styles.message}>{item.body}</Text>
        {!!time && <Text style={styles.time}>{time}</Text>}
      </View>
    );
  };

  // ─────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <Text style={styles.title}>💬 Twilio Chat</Text>

        <Text style={styles.label}>Tumhara Username</Text>
        <TextInput
          style={styles.loginInput}
          placeholder="e.g. banti_patel"
          value={currentUser}
          onChangeText={setCurrentUser}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Kisse baat karni hai?</Text>
        <TextInput
          style={styles.loginInput}
          placeholder="e.g. user1"
          value={targetUser}
          onChangeText={setTargetUser}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {!!error && <Text style={styles.errorText}>❌ {error}</Text>}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginTop: 20 }}
          />
        ) : (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>Connect →</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────
  // CHAT SCREEN
  // ─────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {currentUser} → {targetUser}
        </Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message likho..."
            multiline
          />
          <Button
            title="Send"
            onPress={onSend}
            disabled={!text.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  // ── Login ──
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 32,
    textAlign: 'center',
    color: '#111',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loginInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
  },
  loginButton: {
    marginTop: 28,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: 'red',
    marginTop: 12,
    textAlign: 'center',
    fontSize: 13,
  },

  // ── Chat Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  logoutText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '600',
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
  },
  message: {
    marginTop: 4,
    fontSize: 15,
  },
  time: {
    marginTop: 4,
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
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
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    minHeight: 45,
    maxHeight: 100,
    fontSize: 15,
  },
});