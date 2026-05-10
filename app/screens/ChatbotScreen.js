import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native';
import Constants from 'expo-constants';

const CLAUDE_KEY = Constants.expoConfig?.extra?.claudeKey;

const SYSTEM_PROMPT = `You are DentBot, an expert AI assistant specializing in dental education at university level. You have comprehensive knowledge of all dental subjects including oral pathology, oral medicine, periodontology, endodontics, oral surgery, radiology, dental anatomy, histology, and microbiology.

When answering:
- Give clear, accurate answers suitable for dental students
- Use proper dental terminology but explain complex terms
- Keep answers concise but complete — avoid very long tables or complex formatting
- Include clinical relevance where helpful
- Do not use markdown tables, use plain text lists instead
- If asked something unrelated to dentistry, politely redirect

You are not limited to any specific list of topics — answer any dental or oral health question fully and accurately.`;

export default function ChatbotScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am DentBot, your AI dental education assistant. Ask me anything about oral pathology, dental anatomy, or dental diseases!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  function cleanText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s+(.*)/g, '$1')
      .replace(/---+/g, '')
      .replace(/\|.*\|/g, '')
      .replace(/>\s?(.*)/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function renderText(text, isUser) {
    const cleaned = cleanText(text);
    const lines = cleaned.split('\n');
    return lines.map((line, lineIndex) => {
      const isBullet = line.trim().startsWith('•') ||
        line.trim().startsWith('-') ||
        line.trim().startsWith('*');
      return (
        <Text
          key={lineIndex}
          style={{
            color: isUser ? '#fff' : '#1a1a1a',
            fontSize: 15,
            lineHeight: 22,
            marginBottom: isBullet ? 2 : 0,
          }}>
          {line}
          {lineIndex < lines.length - 1 ? '\n' : ''}
        </Text>
      );
    });
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://rapid-limit-025e.laibamaqsood42.workers.dev/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const text = await response.text();
      console.log('RAW RESPONSE:', text);
      const data = JSON.parse(text);

      if (data.content && data.content[0]) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.content[0].text
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, no response received.'
        }]);
      }
    } catch (error) {
      console.log('FULL ERROR:', error.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error: ' + error.message
      }]);
    }

    setLoading(false);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  const quickQuestions = [
    'What is ameloblastoma?',
    'Explain dental caries stages',
    'What causes periodontitis?',
    'Describe pulpitis types',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.botDot} />
          <Text style={styles.headerTitle}>DentBot AI</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>

        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.bubbleWrapper,
              msg.role === 'user' ? styles.userWrapper : styles.botWrapper
            ]}>
            {msg.role === 'assistant' && (
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>D</Text>
              </View>
            )}
            <View style={[
              styles.bubble,
              msg.role === 'user' ? styles.userBubble : styles.botBubble
            ]}>
              <Text style={[
                styles.bubbleText,
                msg.role === 'user' ? styles.userText : styles.botText
              ]}>
                {renderText(msg.content, msg.role === 'user')}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubbleWrapper, styles.botWrapper]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>D</Text>
            </View>
            <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color="#0f6e56" />
              <Text style={[styles.botText, { marginLeft: 8, fontSize: 13 }]}>
                Thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.quickRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickQuestions.map((q, i) => (
            <TouchableOpacity
              key={i}
              style={styles.quickBtn}
              onPress={() => setInput(q)}>
              <Text style={styles.quickTxt}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask about dental pathology..."
          value={input}
          onChangeText={setInput}
          multiline={true}
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}>
          <Text style={styles.sendTxt}>Send</Text>
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb'
  },
  backTxt: {
    color: '#0f6e56',
    fontSize: 16,
    width: 60
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  botDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0f6e56'
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a'
  },
  chatArea: {
    flex: 1
  },
  chatContent: {
    padding: 16,
    paddingBottom: 8
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end'
  },
  userWrapper: {
    justifyContent: 'flex-end'
  },
  botWrapper: {
    justifyContent: 'flex-start'
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0f6e56',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  avatarTxt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    padding: 12
  },
  userBubble: {
    backgroundColor: '#0f6e56',
    borderBottomRightRadius: 4
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: '#e5e7eb'
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22
  },
  userText: {
    color: '#fff'
  },
  botText: {
    color: '#1a1a1a'
  },
  quickRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb'
  },
  quickBtn: {
    backgroundColor: '#e8f5f1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: '#0f6e56'
  },
  quickTxt: {
    color: '#0f6e56',
    fontSize: 13
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    gap: 10
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100
  },
  sendBtn: {
    backgroundColor: '#0f6e56',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10
  },
  sendBtnDisabled: {
    backgroundColor: '#9ca3af'
  },
  sendTxt: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15
  }
});