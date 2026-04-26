import * as Avatar from "@radix-ui/react-avatar";
import { Check, Copy, RefreshCcw, Sparkles, ThumbsDown, ThumbsUp, UserRound } from "lucide-react";
import { useState } from "react";

export type ChatSection = {
  title: string;
  content?: string;
  items?: string[];
};

export type ChatMessageData = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sections?: ChatSection[];
};

type ChatMessageProps = {
  message: ChatMessageData;
  onRegenerate?: () => void;
};

export function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<"like" | "dislike" | null>(null);
  const isAssistant = message.role === "assistant";

  async function copyMessage() {
    const text = [
      message.content,
      ...(message.sections || []).map((section) => {
        const items = section.items?.map((item) => `- ${item}`).join("\n") || "";
        return `${section.title}\n${section.content || items}`;
      })
    ]
      .filter(Boolean)
      .join("\n\n");

    await navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article className={`chat-message ${isAssistant ? "assistant" : "user"}`}>
      {isAssistant && (
        <Avatar.Root className="chat-avatar assistant-avatar">
          <Avatar.Fallback>
            <Sparkles size={17} />
          </Avatar.Fallback>
        </Avatar.Root>
      )}

      <div className="chat-message-stack">
        <div className="chat-bubble">
          <p>{message.content}</p>
          {!!message.sections?.length && (
            <div className="chat-section-list">
              {message.sections.map((section) => (
                <section className="chat-section" key={section.title}>
                  <h3>{section.title}</h3>
                  {section.content && <p>{section.content}</p>}
                  {section.items && (
                    <ul>
                      {section.items.map((item, index) => (
                        <li key={`${section.title}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>

        {isAssistant && (
          <div className="chat-message-actions" aria-label="Assistant message actions">
            <button type="button" onClick={copyMessage}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            <button type="button" onClick={onRegenerate}>
              <RefreshCcw size={14} />
              <span>Regenerate</span>
            </button>
            <button className={rating === "like" ? "active" : ""} type="button" onClick={() => setRating("like")}>
              <ThumbsUp size={14} />
            </button>
            <button className={rating === "dislike" ? "active" : ""} type="button" onClick={() => setRating("dislike")}>
              <ThumbsDown size={14} />
            </button>
          </div>
        )}
      </div>

      {!isAssistant && (
        <Avatar.Root className="chat-avatar user-avatar">
          <Avatar.Fallback>
            <UserRound size={17} />
          </Avatar.Fallback>
        </Avatar.Root>
      )}
    </article>
  );
}
