import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ChatRouteParams = {
  bookingId: number;
  driverName?: string;
};

type ChatMessage = {
  id: number;
  booking: number;
  sender_type: 'customer' | 'driver';
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const API_BASE = 'http://192.168.1.31:8000/api';

export default function ChatScreen() {
  const route = useRoute<RouteProp<{ params: ChatRouteParams }, 'params'>>();
  const navigation = useNavigation();
  const { bookingId, driverName = 'Driver' } = route.params;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Get customer ID
    AsyncStorage.getItem('customer_id').then((id) => {
      if (id) {
        setCustomerId(parseInt(id));
      }
    });

    // Fetch initial messages
    fetchMessages();

    // Poll for new messages every 3 seconds
    pollingInterval.current = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [bookingId]);

  const fetchMessages = async (silent = false) => {
    try {
      const response = await fetch(`${API_BASE}/chat/messages/${bookingId}/`);
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Non-JSON response received:', text);
        throw e;
      }
      if (response.ok) {
        setMessages(data);
        // Mark driver messages as read
        const unreadDriverMessages = data
          .filter((msg: ChatMessage) => msg.sender_type === 'driver' && !msg.is_read)
          .map((msg: ChatMessage) => msg.id);
        if (unreadDriverMessages.length > 0) {
          markMessagesAsRead(unreadDriverMessages);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const markMessagesAsRead = async (messageIds: number[]) => {
    try {
      await fetch(`${API_BASE}/chat/mark-read/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message_ids: messageIds }),
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !customerId) return;

    setSending(true);
    try {
      const response = await fetch(`${API_BASE}/chat/send/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          sender_type: 'customer',
          sender_customer_id: customerId,
          message: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages(true);
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isCustomer = item.sender_type === 'customer';

    return (
      <View
        style={[
          styles.messageContainer,
          isCustomer ? styles.customerMessage : styles.driverMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isCustomer ? styles.customerBubble : styles.driverBubble,
          ]}
        >
          <Text style={styles.messageText}>{item.message}</Text>
          <Text
            style={[
              styles.messageTime,
              isCustomer ? styles.customerTime : styles.driverTime,
            ]}
          >
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f66ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{driverName}</Text>
          <Text style={styles.headerSubtitle}>Chat with your driver</Text>
        </View>
        <View style={styles.driverIcon}>
          <Ionicons name="person-circle" size={40} color="#5EC6C6" />
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color="#555" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation with your driver
            </Text>
          </View>
        }
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b1220',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2332',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3442',
  },
  backButton: {
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  driverIcon: {
    marginLeft: 10,
  },
  messagesList: {
    padding: 15,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
  messageContainer: {
    marginBottom: 15,
  },
  customerMessage: {
    alignItems: 'flex-end',
  },
  driverMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 15,
    padding: 12,
  },
  customerBubble: {
    backgroundColor: '#2f66ff',
    borderBottomRightRadius: 4,
  },
  driverBubble: {
    backgroundColor: '#1a2332',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  customerTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  driverTime: {
    color: '#888',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    backgroundColor: '#1a2332',
    borderTopWidth: 1,
    borderTopColor: '#2a3442',
  },
  input: {
    flex: 1,
    backgroundColor: '#0b1220',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2f66ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#555',
  },
});
