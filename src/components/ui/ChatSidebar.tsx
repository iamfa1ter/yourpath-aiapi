import { MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, Sparkles, Trash2 } from "lucide-react";

type ChatItem = {
  id: string;
  title: string;
  subtitle: string;
};

type ChatSidebarProps = {
  chats: ChatItem[];
  activeChatId: string;
  collapsed: boolean;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onToggle: () => void;
};

export function ChatSidebar({ chats, activeChatId, collapsed, onNewChat, onSelectChat, onDeleteChat, onToggle }: ChatSidebarProps) {
  return (
    <aside className={`chat-sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="chat-sidebar-top">
        <div className="chat-sidebar-brand">
          <span className="chat-sidebar-mark">
            <Sparkles size={16} />
          </span>
          <span className="chat-sidebar-copy">
            <strong>YourPath AI</strong>
            <small>Admission workspace</small>
          </span>
        </div>
        <button className="chat-icon-button" type="button" onClick={onToggle} aria-label="Toggle chat sidebar">
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      <button className="chat-new-button" type="button" onClick={onNewChat}>
        <Plus size={16} />
        <span>New Chat</span>
      </button>

      <div className="chat-history-label">Recent planning</div>
      <div className="chat-history-list">
        {chats.length === 0 ? (
          <div style={{ padding: "16px 12px", textAlign: "center", color: "rgba(240, 240, 255, 0.45)", fontSize: "13px", lineHeight: 1.5 }}>
            No planning sessions yet.<br />Start a new chat to save your admission plan.
          </div>
        ) : (
          chats.map((chat) => (
            <div className={`chat-history-row ${chat.id === activeChatId ? "active" : ""}`} key={chat.id}>
              <button className="chat-history-item" type="button" onClick={() => onSelectChat(chat.id)}>
                <MessageSquare size={15} />
                <span>
                  <strong>{chat.title}</strong>
                  <small>{chat.subtitle}</small>
                </span>
              </button>
              <button className="chat-delete-button" type="button" onClick={() => onDeleteChat(chat.id)} aria-label={`Delete ${chat.title}`}>
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
