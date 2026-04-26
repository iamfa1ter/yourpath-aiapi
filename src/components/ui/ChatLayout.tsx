import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeAdmissionChat } from "../../api.js";
import { ChatInput } from "./ChatInput";
import { ChatMessage, type ChatMessageData, type ChatSection } from "./ChatMessage";
import { ChatSidebar } from "./ChatSidebar";

const CHAT_STORAGE_KEY = "yourpath-ai-chat-sessions-v1";

const starterMessage: ChatMessageData = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I am YourPath AI Advisor. I can help with Bachelor, Master, and PhD admission strategy, research fit, scholarships, SOP positioning, and application roadmaps.",
  sections: [
    {
      title: "What I can analyze",
      items: ["Academic profile strength", "Program and country fit", "Dream / Match / Safe strategy", "6-12 month improvement plan"]
    }
  ]
};

type ChatSession = {
  id: string;
  title: string;
  subtitle: string;
  messages: ChatMessageData[];
  updatedAt: number;
};

function sectionsFromChatReply(reply: any): ChatSection[] {
  if (!Array.isArray(reply?.sections)) return [];
  return reply.sections
    .filter((section: any) => section?.title)
    .map((section: any) => ({
      title: String(section.title),
      content: section.content ? String(section.content) : undefined,
      items: Array.isArray(section.items) ? section.items.map((item: unknown) => String(item)) : []
    }));
}

function fallbackSections(prompt: string): ChatSection[] {
  return [];
}

function loadSavedSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function createChatTitle(prompt: string) {
  const compact = prompt.replace(/\s+/g, " ").trim();
  return compact.length > 34 ? `${compact.slice(0, 34)}...` : compact || "New admission plan";
}

export function ChatLayout() {
  const [sessions, setSessions] = useState<ChatSession[]>(loadSavedSessions);
  const [activeChatId, setActiveChatId] = useState<string | null>(() => loadSavedSessions()[0]?.id || null);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSession = activeChatId ? sessions.find((session) => session.id === activeChatId) : null;
  const messages = activeSession?.messages || [starterMessage];
  const chats = useMemo(() => [...sessions].sort((a, b) => b.updatedAt - a.updatedAt), [sessions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  function updateActiveSession(updater: (session: ChatSession) => ChatSession) {
    setSessions((current) => current.map((session) => (session.id === activeChatId ? updater(session) : session)));
  }

  async function sendMessage(prompt: string) {
    const userMessage: ChatMessageData = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt
    };

    setLastPrompt(prompt);
    updateActiveSession((session) => ({
      ...session,
      title: session.messages.length <= 1 ? createChatTitle(prompt) : session.title,
      subtitle: "Autosaved just now",
      messages: [...session.messages, userMessage],
      updatedAt: Date.now()
    }));
    setLoading(true);

    try {
      const response = await analyzeAdmissionChat({ message: prompt });
      const sections = sectionsFromChatReply(response.reply);
      const assistantMessage: ChatMessageData = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.reply?.content || "Got it. Tell me a bit more about your admission goal.",
        sections
      };
      updateActiveSession((session) => ({
        ...session,
        messages: [...session.messages, assistantMessage],
        updatedAt: Date.now()
      }));
    } catch (error) {
      const assistantMessage: ChatMessageData = {
        id: `assistant-fallback-${Date.now()}`,
        role: "assistant",
        content: "The live advisor could not complete the request, so here is a structured planning draft you can use now.",
        sections: fallbackSections(prompt)
      };
      updateActiveSession((session) => ({
        ...session,
        messages: [...session.messages, assistantMessage],
        updatedAt: Date.now()
      }));
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    const id = `chat-${Date.now()}`;
    setSessions((current) => [
      {
        id,
        title: "New admission plan",
        subtitle: "Autosaved",
        messages: [starterMessage],
        updatedAt: Date.now()
      },
      ...current
    ]);
    setActiveChatId(id);
    setLastPrompt("");
  }

  function selectChat(id: string) {
    setActiveChatId(id);
  }

  function deleteChat(id: string) {
    setSessions((current) => {
      const remaining = current.filter((session) => session.id !== id);
      if (remaining.length === 0) {
        const fresh = {
          id: `chat-${Date.now()}`,
          title: "New admission plan",
          subtitle: "Autosaved",
          messages: [starterMessage],
          updatedAt: Date.now()
        };
        setActiveChatId(fresh.id);
        return [fresh];
      }
      if (id === activeChatId) setActiveChatId(remaining[0].id);
      return remaining;
    });
  }

  return (
    <section className={`chat-layout ${sidebarCollapsed ? "is-sidebar-collapsed" : ""}`} aria-label="YourPath AI Advisor">
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        collapsed={sidebarCollapsed}
        onNewChat={startNewChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />

      <div className="chat-main">
        <header className="chat-topbar">
          <button className="chat-icon-button mobile-only" type="button" onClick={() => setSidebarCollapsed((value) => !value)}>
            <Menu size={18} />
          </button>
          <div>
            <h1>YourPath AI Advisor</h1>
            <p>
              <ShieldCheck size={14} />
              AI-powered admission guidance
            </p>
          </div>
          <span className="chat-topbar-badge">
            <Sparkles size={14} />
            Bachelor / Master / PhD
          </span>
        </header>

        <div className="chat-message-scroll" ref={scrollRef}>
          <div className="chat-message-inner">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <ChatMessage message={message} onRegenerate={() => lastPrompt && sendMessage(lastPrompt)} />
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="chat-typing">
                <span />
                <span />
                <span />
                <p>Analyzing admission strategy...</p>
              </div>
            )}
          </div>
        </div>

        <ChatInput disabled={loading} onSend={sendMessage} />
      </div>
    </section>
  );
}
