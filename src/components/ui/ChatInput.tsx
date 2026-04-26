import { ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ChatInputProps = {
  disabled?: boolean;
  onSend: (message: string) => void;
};

const suggestions = [
  ["Analyze my profile", "University: KBTU\nDegree: Bachelor of Science in Biology\nGPA: 3.7\nThesis topic: Transformer models for medical imaging\nIELTS/TOEFL: 7\nGRE/GMAT: Not taken\nTarget program: Master or PhD"],
  ["Find program fit", "Find program fit for Biology, AI, and medical imaging. Compare Master and PhD options."],
  ["Build admission roadmap", "Build a 6-12 month admission roadmap for a graduate applicant with limited publications."],
  ["Improve SOP", "Help improve my SOP positioning around transformer models for medical imaging."],
  ["Find scholarships", "Suggest realistic scholarship directions for Master or PhD admission in Europe, Canada, and the United States."]
];

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "56px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [value]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div className="chat-input-shell">
      <div className="chat-suggestion-row" aria-label="Admission suggestions">
        {suggestions.map(([label, prompt]) => (
          <button key={label} type="button" onClick={() => setValue(prompt)} disabled={disabled}>
            {label}
          </button>
        ))}
      </div>

      <div className="chat-composer">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Describe your academic profile or ask about admissions..."
          disabled={disabled}
        />
        <button className="chat-send-button" type="button" onClick={submit} disabled={disabled || !value.trim()}>
          {disabled ? <Sparkles size={18} /> : <ArrowUp size={18} />}
        </button>
      </div>
    </div>
  );
}
