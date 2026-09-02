"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Leaf, LogOut, Loader2, Info } from "lucide-react";
import axios from "axios";

interface Message {
  role: "user" | "bot";
  texto: string;
  time: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [nutriName, setNutriName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Client side only
    const id = localStorage.getItem("user_id");
    if (!id) {
      router.push("/");
      return;
    }
    setUserId(id);
    setUserName(localStorage.getItem("user_name") || "Cliente");
    setNutriName(localStorage.getItem("nutri_name") || "Nutricionista");

    // Load history
    fetchHistory(id);
  }, [router]);

  const fetchHistory = async (id: string) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/chat/${id}/historico`);
      setMessages(res.data || []);
      scrollToBottom();
    } catch (err) {
      console.error("Erro ao carregar histórico", err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId) return;

    const userText = input.trim();
    setInput("");
    
    // Optimistic UI update
    const newUserMsg: Message = { role: "user", texto: userText, time: new Date().toISOString() };
    setMessages(prev => [...prev, newUserMsg]);
    scrollToBottom();
    
    setLoading(true);

    try {
      const res = await axios.post(`http://localhost:8000/api/chat/${userId}`, { texto: userText });
      
      const newBotMsg: Message = { role: "bot", texto: res.data.resposta, time: new Date().toISOString() };
      setMessages(prev => [...prev, newBotMsg]);
    } catch (err) {
      console.error("Erro ao enviar mensagem", err);
      // Optional: show error message
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const logout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (!userId) return <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center"><Loader2 className="animate-spin text-[var(--color-primary)] w-10 h-10" /></div>;

  return (
    <div className="flex flex-col h-screen bg-[#f1f5f9] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
            <Leaf className="text-[var(--color-primary)] w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Assistente Otri</h1>
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
              Supervisionado por <span className="text-[var(--color-primary-dark)]">{nutriName}</span>
            </p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        
        <div className="flex justify-center">
          <div className="bg-blue-50 text-blue-700 text-xs px-4 py-2 rounded-full font-medium flex items-center gap-2 border border-blue-100 shadow-sm">
            <Info className="w-4 h-4" />
            Este chat usa IA para conversar sobre seu plano alimentar.
          </div>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] sm:max-w-[70%] p-4 shadow-sm text-sm sm:text-base leading-relaxed ${
                  msg.role === 'user' 
                    ? 'chat-bubble-user rounded-t-2xl rounded-bl-2xl' 
                    : 'chat-bubble-bot rounded-t-2xl rounded-br-2xl'
                }`}
              >
                {msg.role === 'user' ? (
                  <p>{msg.texto}</p>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: msg.texto.replace(/\n/g, '<br/>') }} />
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="chat-bubble-bot p-4 rounded-t-2xl rounded-br-2xl shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                <span className="text-gray-500 text-sm italic">Otri está analisando...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 p-4 sm:p-6">
        <form 
          onSubmit={sendMessage} 
          className="max-w-4xl mx-auto relative flex items-center gap-3 bg-gray-50 p-2 rounded-full border border-gray-300 focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:border-transparent transition-all shadow-inner"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: Comi 150g de frango no almoço..."
            className="flex-1 bg-transparent py-2 pl-4 outline-none text-gray-700 placeholder-gray-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 bg-[var(--color-primary)] text-white rounded-full hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:hover:bg-[var(--color-primary)] transition-colors shadow-md"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
