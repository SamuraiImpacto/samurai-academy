import { useState, useRef, useEffect, type CSSProperties, type KeyboardEvent } from 'react'
import { Brain, Send, Loader2 } from 'lucide-react'

const SUPABASE_URL = "https://yzuviiyflaokfcabxupk.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dXZpaXlmbGFva2ZjYWJ4dXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDg5MzcsImV4cCI6MjA4ODU4NDkzN30.M5dIc_mRRoqeOUaNh78KQxasuSvEnrVpXNf4vqQlg5M"

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const history = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch(`${SUPABASE_URL}/functions/v1/academy-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ message: trimmed, history }),
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.reply || data.message || 'Desculpe, não consegui processar sua pergunta.',
        sources: data.sources || [],
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      const errorMsg: Message = {
        role: 'assistant',
        content: `Ops, ocorreu um erro ao consultar o Sensei. Tente novamente em alguns instantes.`,
      }
      setMessages(prev => [...prev, errorMsg])
      console.error('Erro ao chamar academy-chat:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Brain size={28} color="#7c3aed" />
          <h1 style={styles.title}>Academy AIOX</h1>
        </div>
        <p style={styles.subtitle}>Seu Jarvis do AIOX</p>
      </header>

      {/* Mensagens */}
      <main style={styles.messagesArea}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <Brain size={48} color="#3f3f46" />
            <p style={styles.emptyTitle}>Olá! Sou o Sensei da Academy AIOX.</p>
            <p style={styles.emptyText}>
              Pergunte sobre a metodologia AIOX, como criar squads,
              configurar agentes, executar workflows ou resolver problemas.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.messageRow,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                ...styles.bubble,
                ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble),
              }}
            >
              {msg.role === 'assistant' && (
                <span style={styles.senseiLabel}>Sensei</span>
              )}
              <p style={styles.messageText}>{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div style={styles.sourcesContainer}>
                  <span style={styles.sourcesLabel}>Fontes:</span>
                  {msg.sources.map((src, j) => (
                    <span key={j} style={styles.sourceTag}>{src}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
            <div style={{ ...styles.bubble, ...styles.assistantBubble }}>
              <span style={styles.senseiLabel}>Sensei</span>
              <div style={styles.loadingContainer}>
                <Loader2 size={16} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={styles.loadingText}>Pensando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer style={styles.inputArea}>
        <div style={styles.inputContainer}>
          <textarea
            ref={textareaRef}
            style={styles.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta..."
            rows={1}
            disabled={loading}
          />
          <button
            style={{
              ...styles.sendButton,
              opacity: input.trim() && !loading ? 1 : 0.4,
              cursor: input.trim() && !loading ? 'pointer' : 'default',
            }}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            aria-label="Enviar mensagem"
          >
            <Send size={20} color="#fff" />
          </button>
        </div>
        <p style={styles.disclaimer}>
          Respostas baseadas na base de conhecimento AIOX. Verifique informações importantes.
        </p>
      </footer>

      {/* Animação de spin */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxWidth: 800,
    margin: '0 auto',
    width: '100%',
  },

  // Header
  header: {
    padding: '16px 20px 12px',
    borderBottom: '1px solid #1e1e24',
    flexShrink: 0,
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#f4f4f5',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 13,
    color: '#71717a',
    textAlign: 'center' as const,
    marginTop: 4,
  },

  // Mensagens
  messagesArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  // Estado vazio
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 12,
    padding: '40px 20px',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#a1a1aa',
  },
  emptyText: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center' as const,
    maxWidth: 360,
    lineHeight: 1.5,
  },

  // Balões
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  bubble: {
    maxWidth: '85%',
    padding: '12px 16px',
    borderRadius: 16,
    lineHeight: 1.5,
  },
  userBubble: {
    background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
    borderBottomRightRadius: 4,
    color: '#fff',
  },
  assistantBubble: {
    background: '#1e1e24',
    borderBottomLeftRadius: 4,
    color: '#e4e4e7',
  },
  senseiLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#7c3aed',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  messageText: {
    fontSize: 15,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },

  // Fontes
  sourcesContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTop: '1px solid #2e2e36',
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    alignItems: 'center',
  },
  sourcesLabel: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: 600,
  },
  sourceTag: {
    fontSize: 11,
    background: '#27272a',
    color: '#a78bfa',
    padding: '2px 8px',
    borderRadius: 10,
    border: '1px solid #3f3f46',
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#71717a',
    fontStyle: 'italic',
  },

  // Input
  inputArea: {
    padding: '12px 16px 16px',
    borderTop: '1px solid #1e1e24',
    flexShrink: 0,
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 10,
    background: '#1a1a22',
    borderRadius: 16,
    border: '1px solid #2e2e36',
    padding: '8px 8px 8px 16px',
  },
  textarea: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#e4e4e7',
    fontSize: 15,
    fontFamily: 'inherit',
    resize: 'none' as const,
    lineHeight: 1.5,
    maxHeight: 120,
    padding: '4px 0',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: '#7c3aed',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'opacity 0.2s',
  },
  disclaimer: {
    fontSize: 11,
    color: '#52525b',
    textAlign: 'center' as const,
    marginTop: 8,
  },
}

export default App
