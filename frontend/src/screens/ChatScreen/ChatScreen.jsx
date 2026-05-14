
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
  initChat,
  getConversation,
  sendMessage,
  sendFile,
  deleteMessage,
  shutdownChat,
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

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
const ChatScreen = () => {
  // ── Login state ──
  const [currentUser, setCurrentUser] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ── Chat state ──
  const conversationRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [uploadProgress, setUploadProgress] = useState(null);

  const flatListRef = useRef(null);

  useEffect(() => {
    return () => {
      shutdownChat();
    };
  }, []);

  // ─────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────
  const handleLogin = async () => {
    const me = currentUser.trim();
    const other = targetUser.trim();

    if (!me || !other) {
      return setError('Dono fields fill karo');
    }

    if (me === other) {
      return setError('set diffrent username');
    }

    setError(null);
    setLoading(true);

    try {
      await initChat(me);

      const convo = await getConversation(me, other);

      conversationRef.current = convo;

      // Load history
      const page = await convo.getMessages(50);

      const formattedMessages = await Promise.all(
        page.items.map(msgToState)
      );

      setMessages(formattedMessages);

      // Realtime listener
      convo.removeAllListeners('messageAdded');

      convo.on('messageAdded', async m => {
        const formatted = await msgToState(m);

        setMessages(prev => {
          if (prev.some(x => x.id === formatted.id)) {
            return prev;
          }

          return [...prev, formatted];
        });
      });

      convo.on('messageRemoved', m => {
        setMessages(prev =>
          prev.filter(x => x.id !== m.sid),
        );
      });

      setIsLoggedIn(true);

    } catch (err) {
      console.log('CHAT ERROR', err);

      setError(err.message || 'Connection fail ho gayi');

    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // SEND TEXT
  // ─────────────────────────────────────────
  const onSend = async () => {
    const convo = conversationRef.current;

    if (!text.trim() || !convo) {
      return;
    }

    const temp = text;

    setText('');

    try {
      await sendMessage(convo, temp);

    } catch (err) {
      console.log('SEND ERROR', err);

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
        {
          options,
          cancelButtonIndex: 2,
        },
        index => {
          if (index === 0) {
            pickImage();
          }

          if (index === 1) {
            pickDocument();
          }
        },
      );

    } else {

      Alert.alert(
        'File bhejo',
        'Kya bhejoge?',
        [
          {
            text: 'Image',
            onPress: pickImage,
          },
          {
            text: 'Document',
            onPress: pickDocument,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
      );
    }
  };

  // ─────────────────────────────────────────
  // PICK IMAGE
  // ─────────────────────────────────────────
  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.8,
      });

      if (result.didCancel || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];

      await uploadFile({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
        size: asset.fileSize,
      });

    } catch (err) {
      console.log('IMAGE PICK ERROR', err);

      Alert.alert('Error', 'Image pick nahi ho payi');
    }
  };

  // ─────────────────────────────────────────
  // PICK DOCUMENT
  // ─────────────────────────────────────────
  const pickDocument = async () => {
    try {
      const [result] = await pick({
        mode: 'open',
      });

      if (!result) {
        return;
      }

      await uploadFile({
        uri: result.uri,
        name: result.name,
        type: result.type || 'application/octet-stream',
        size: result.size,
      });

    } catch (err) {
      console.log('DOC PICK ERROR', err);

      Alert.alert('Error', 'File pick nahi ho payi');
    }
  };

  // ─────────────────────────────────────────
  // UPLOAD FILE
  // ─────────────────────────────────────────
  const uploadFile = async file => {
    const convo = conversationRef.current;

    if (!convo) {
      return;
    }

    setUploadProgress(0);

    try {
      await sendFile(convo, file, percent => {
        setUploadProgress(percent);
      });

    } catch (err) {
      console.log('UPLOAD ERROR', err);

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

    if (!convo) {
      return;
    }

    if (item.author !== currentUser) {
      return;
    }

    Alert.alert(
      'Delete This Message?',
      'Do you Delele this message',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage(convo, item._raw);

            } catch (err) {
              console.log('DELETE ERROR', err);

              Alert.alert('Error', 'Delete nahi ho paya');
            }
          },
        },
      ],
    );
  };

  // ─────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────
  const handleLogout = () => {
    shutdownChat();

    conversationRef.current = null;

    setIsLoggedIn(false);
    setMessages([]);
    setCurrentUser('');
    setTargetUser('');
    setError(null);
  };

  // ─────────────────────────────────────────
  // RENDER MESSAGE
  // ─────────────────────────────────────────
  const renderItem = ({ item }) => {
    const isMine = item.author === currentUser;
    const hasMedia = item.hasMedia;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => onLongPressMessage(item)}
        style={[
          styles.messageBox,
          isMine && styles.myMessage,
        ]}
      >
        <Text style={styles.author}>
          {item.author}
        </Text>

        {hasMedia ? (
          <TouchableOpacity
            onPress={async () => {
              try {
                const url = await item.mediaUrl;

                if (url) {
                  Linking.openURL(url);
                }
              } catch (e) {
                console.log('OPEN FILE ERROR', e);
              }
            }}
          >
            {item.mediaType.startsWith('image/') ? (
              <Image
                source={{
                  uri: item.mediaUrl,
                }}
                style={styles.chatImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.fileRow}>
                <Text style={styles.fileIcon}>📎</Text>

                <Text style={styles.fileName}>
                  {item.fileName || 'File'}
                </Text>
              </View>
            )}

            <Text style={styles.downloadText}>
              Tap to download/open
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.message}>
            {item.body}
          </Text>
        )}

        {isMine && (
          <Text style={styles.deleteHint}>
            ꞉꞉ Hold to delete
          </Text>
        )}

        <Text style={styles.time}>
          {formatTime(item.ts)}
        </Text>
      </TouchableOpacity>
    );
  };

  // ─────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <Text style={styles.title}>
          💬 Twilio Chat
        </Text>

        <Text style={styles.label}>
          Your Username
        </Text>

        <TextInput
          style={styles.loginInput}
          placeholder="e.g. user1"
          value={currentUser}
          onChangeText={setCurrentUser}
        />

        <Text style={styles.label}>
          Whom do you want to talk to?
        </Text>

        <TextInput
          style={styles.loginInput}
          placeholder="e.g. user2"
          value={targetUser}
          onChangeText={setTargetUser}
        />

        {!!error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}

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
            <Text style={styles.loginButtonText}>
              Connect
            </Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {currentUser} → {targetUser}
        </Text>

        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: 16,
          }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({
              animated: true,
            })
          }
        />

        {uploadProgress !== null && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${uploadProgress}%`,
                },
              ]}
            />

            <Text style={styles.progressText}>
              Uploading... {uploadProgress}%
            </Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={onAttach}
          >
            <Text style={styles.attachIcon}>
              📎
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            multiline
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              !text.trim() &&
              styles.sendBtnDisabled,
            ]}
            onPress={onSend}
            disabled={!text.trim()}
          >
            <Text style={styles.sendBtnText}>
              Send
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// MAP MESSAGE
// ─────────────────────────────────────────────
async function msgToState(m) {
  const media = m.attachedMedia?.[0];

  let mediaUrl = null;

  try {
    if (media?.getContentTemporaryUrl) {
      mediaUrl = await media.getContentTemporaryUrl();
    }
  } catch (err) {
    console.log('MEDIA URL ERROR', err);
  }

  return {
    id: m.sid,
    body: m.body,
    author: m.author,
    ts: m.dateCreated,

    hasMedia: !!media,

    fileName: media?.filename || null,

    mediaType: media?.contentType || '',

    mediaUrl,

    _raw: m,
  };
}

export default ChatScreen;

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

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
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  headerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },

  logoutText: {
    color: '#FF3B30',
    fontWeight: '600',
  },

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
});
