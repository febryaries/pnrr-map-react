import { useState, useRef, useEffect } from 'react'
import { useGeminiChat } from '../../hooks/useGeminiChat'
import './ChatWidget.css'

/**
 * Chat Widget pentru AI Assistant PNRR
 * Widget floating în colțul dreapta-jos
 */
const ChatWidget = ({ pnrrData, appState }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  const { sendMessage, isLoading, error, clearError, isConfigured } = useGeminiChat(pnrrData, appState)
  
  // Scroll la ultimul mesaj
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  // Focus pe input când se deschide chat-ul
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])
  
  // Mesaj de bun venit
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        type: 'bot',
        text: `Bună! Sunt asistentul AI pentru platforma PNRR Map România. 🤖

Cu ce te pot ajuta astăzi?

**Poți să mă întrebi despre:**
• 📊 Statistici pe județe
• 💰 Valori și fonduri
• 🔍 Comparații între regiuni
• 📈 Programe PNRR
• 🗺️ Navigare în hartă

Încearcă: "Câte proiecte sunt în Cluj?" sau "Compară Alba cu Brașov"`,
        timestamp: new Date()
      }])
    }
  }, [])
  
  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (error) clearError()
  }
  
  const handleSendMessage = async () => {
    const message = inputValue.trim()
    if (!message || isLoading) return
    
    // Adaugă mesajul utilizatorului
    const userMessage = {
      type: 'user',
      text: message,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    
    try {
      // Trimite către AI
      const aiResponse = await sendMessage(message)
      
      // Adaugă răspunsul AI
      const botMessage = {
        type: 'bot',
        text: aiResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      
    } catch (err) {
      // Adaugă mesaj de eroare
      const errorMessage = {
        type: 'bot',
        text: `Ne cerem scuze, am întâmpinat o problemă tehnică. 😔\n\nTe rog încearcă din nou sau reformulează întrebarea.`,
        error: true,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  // Verifică dacă API-ul este configurat
  if (!isConfigured) {
    return null // Nu afișa widget-ul dacă API-ul nu e configurat
  }
  
  return (
    <div className="chat-widget">
      {/* Buton toggle */}
      <button 
        className={`chat-toggle ${isOpen ? 'hidden' : ''}`}
        onClick={toggleChat}
        aria-label="Deschide asistentul AI"
      >
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <span>Întreabă AI despre PNRR</span>
      </button>
      
      {/* Container chat */}
      {isOpen && (
        <div className="chat-container">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-title">
              <span className="chat-icon">🤖</span>
              <h3>Asistent PNRR</h3>
            </div>
            <button 
              className="chat-close"
              onClick={toggleChat}
              aria-label="Închide chat"
            >
              ×
            </button>
          </div>
          
          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`message ${msg.type}-message ${msg.error ? 'error-message' : ''}`}
              >
                <div className="message-content">
                  {msg.text.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < msg.text.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
                <div className="message-timestamp">
                  {msg.timestamp.toLocaleTimeString('ro-RO', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="message bot-message">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="message-timestamp">Asistentul scrie...</div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="chat-input-container">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Scrie întrebarea ta..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="chat-send"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Trimite mesaj"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
          
          {/* Footer info */}
          <div className="chat-footer">
            <span className="chat-footer-text">
              💡 Powered by Google Gemini
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatWidget
