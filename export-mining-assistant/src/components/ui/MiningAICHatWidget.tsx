"use client";

import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import MiningChart from "@/components/MiningChart";

type ChartDataPoint = {
  label: string;
  value: number;
};

type MiningChartData = {
  type: "bar" | "line" | "pie" | "doughnut";
  title: string;
  unit?: string;
  data: ChartDataPoint[];
};

type Message = {
  id: string;
  text: string;
  type: "bot" | "user";
  html?: string;
  loading?: boolean;
  statusText?: string;
  sources?: {
    name: string;
    url: string;
  }[];
  chart?: MiningChartData | null;
};

export default function MiningAICHatWidget() {
  const [chatOpen, setChatOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [sending, setSending] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem("miningDiscoveryConversationId");
    if (!id) {
      if (window.crypto && typeof window.crypto.randomUUID === "function") {
        id = window.crypto.randomUUID();
      } else {
        id = "conversation-" + Date.now() + "-" + Math.random().toString(36).substring(2, 10);
      }
      localStorage.setItem("miningDiscoveryConversationId", id);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConversationId(id);
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, sending]);

  async function handleCopy(id: string, text: string) {
    let success = false;

    // Try modern async Clipboard API if available and in secure context
    if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (err) {
        console.warn("navigator.clipboard failed, attempting fallback:", err);
      }
    }

    // Fallback using textarea + execCommand for HTTP/non-secure contexts or permission-blocked environments
    if (!success && typeof document !== "undefined") {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        // Position off-screen and invisible
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        textArea.setAttribute("readonly", "");
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch (err) {
        console.error("execCommand copy fallback failed:", err);
      }
    }

    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function handleResetChat() {
    setMessages([]);
    let id = "";
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      id = window.crypto.randomUUID();
    } else {
      id = "conversation-" + Date.now() + "-" + Math.random().toString(36).substring(2, 10);
    }
    localStorage.setItem("miningDiscoveryConversationId", id);
    setConversationId(id);
  }

  function openChat() {
    setChatOpen(true);
    // Pre-warm the chat API connection in background
    fetch("/api/chat").catch(() => {});
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }

  function closeChat() {
    setChatOpen(false);
  }

  async function sendMessage(overrideText?: string) {
    const text = (overrideText || input).trim();
    if (!text || sending) return;

    if (!conversationId) {
      console.error("Conversation ID not ready");
      return;
    }

    const userMsgId = "user-" + Date.now();
    const botMsgId = "bot-" + Date.now();

    // Fast-path: Instant 0ms greeting response
    const normalized = text.toLowerCase().replace(/[!?.,]/g, "").trim();
    if (["hi", "hello", "hey", "hola", "good morning", "good evening", "good afternoon"].includes(normalized)) {
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, text, type: "user" },
        {
          id: botMsgId,
          text: "Hello! I am Mining Discovery AI Assistant. How can I assist you with mining intelligence, commodities, projects, or our investor reach services today?",
          type: "bot",
          loading: false,
        },
      ]);
      setInput("");
      return;
    }

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, text, type: "user" },
      { id: botMsgId, text: "", type: "bot", loading: true, statusText: "Searching mining sources..." },
    ]);

    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
          history: messages.slice(-10).map((m) => ({
            role: m.type === "bot" ? "assistant" : "user",
            content: m.text,
          })),
        }),
      });

      if (!response.ok) {
        let errorMessage = "AI request failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch { }
        throw new Error(errorMessage);
      }

      if (!response.body) throw new Error("Response body is empty");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedText = "";
      let rafId: number | null = null;

      const scheduleTextUpdate = () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId
                ? { ...msg, text: accumulatedText, loading: false }
                : msg
            )
          );
          rafId = null;
        });
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === "status" && event.data) {
              const statusMsg = String(event.data);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId ? { ...msg, statusText: statusMsg } : msg
                )
              );
            } else if (event.type === "answer") {
              const chunk = String(event.data || "");
              if (chunk) {
                accumulatedText += chunk;
                scheduleTextUpdate();
              }
            } else if (event.type === "chart" && event.data) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId ? { ...msg, chart: event.data } : msg
                )
              );
            } else if (event.type === "sources" && Array.isArray(event.data)) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId ? { ...msg, sources: event.data } : msg
                )
              );
            }
          } catch (e) { }
        }
      }

      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer);
          if (event.type === "answer") {
            const chunk = String(event.data || "");
            if (chunk) {
              accumulatedText += chunk;
            }
          }
        } catch (e) { }
      }

      // Final synchronous commit to guarantee full text is displayed
      if (rafId) cancelAnimationFrame(rafId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? { ...msg, text: accumulatedText, loading: false }
            : msg
        )
      );
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => {
        const filtered = prev.filter((m) => !(m.id === botMsgId && m.text === ""));
        return [
          ...filtered,
          {
            id: "error-" + Date.now(),
            text: "Sorry, I couldn't connect to the AI right now. Please try again.",
            type: "bot",
          },
        ];
      });
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function renderBotMessage(message: Message) {
    if (message.loading) {
      return (
        <div className="searching-animation" role="status" aria-live="polite">
          <span className="searching-mark" aria-hidden="true">✦</span>
          <span className="searching-label">{message.statusText || "Searching mining sources..."}</span>
          <span className="searching-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      );
    }

    const cleanText = message.text
      .replace(/\\\*/g, "*")
      .replace(/\\_/g, "_")
      .trim();

    const rawHtml = marked.parse(cleanText) as string;
    const html = rawHtml
      .replace(/<table>/g, '<div class="mining-table-wrapper"><table>')
      .replace(/<\/table>/g, "</table></div>")
      .replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');

    return (
      <div className="bot-answer">
        <div className="bot-answer-content" dangerouslySetInnerHTML={{ __html: html }} />
        {message.chart && <MiningChart chart={message.chart} />}
        {cleanText && (
          <div className="bot-answer-actions">
            <button
              type="button"
              className="bot-action-copy"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(message.id, cleanText);
              }}
              title="Copy briefing to clipboard"
              aria-label="Copy briefing to clipboard"
            >
              {copiedId === message.id ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Floating Chat Launcher (Matching picture exactly) */}
      {!chatOpen && (
        <div className="chat-launcher-wrapper">
          {showBubble && (
            <div
              className="chat-speech-bubble"
              onClick={openChat}
              role="button"
              tabIndex={0}
              aria-label="Ask Mining AI"
            >
              <span className="chat-bubble-wave">👋</span>
              <span className="chat-bubble-text-white">Hi!</span>
              <span className="chat-bubble-text-gold">Ask Mining AI</span>
            </div>
          )}

          <button
            className="chat-button-new"
            onClick={openChat}
            aria-label="Open Mining Discovery AI"
          >
            {/* Pickaxe with Diamond Icon */}
            <svg
              width="38"
              height="38"
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="chat-pickaxe-icon"
              aria-hidden="true"
            >
              <g transform="rotate(40 22 22)">
                {/* Solid Diamond Gem perched on head */}
                <polygon
                  points="16,2 28,2 33,8 22,17 11,8"
                  fill="#FFC837"
                  stroke="#FFC837"
                  strokeWidth="0.5"
                  strokeLinejoin="round"
                />
                <polygon
                  points="16,2 28,2 22,8"
                  fill="#FFE57F"
                  opacity="0.9"
                />

                {/* Outline Pickaxe Head */}
                <path
                  d="M 7 18 C 6.5 16 9 14.5 13 15 L 19.5 16 L 19.5 21.5 L 13 21 C 9 20.5 7.5 20 7 18 Z"
                  fill="#0B1220"
                  stroke="#FFC837"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M 24.5 16 L 29.5 16.5 C 33 17.5 34 20.5 33 24.5 L 31 29.5 C 30 30.5 28.5 29.5 29 27.5 L 30.5 23.5 C 31 21 29.5 20 24.5 21 Z"
                  fill="#0B1220"
                  stroke="#FFC837"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />

                {/* Shaft / Handle (Outline Capsule) */}
                <rect
                  x="19.5"
                  y="16.5"
                  width="5"
                  height="22"
                  rx="2.5"
                  fill="#0B1220"
                  stroke="#FFC837"
                  strokeWidth="2"
                />

                {/* Collar band */}
                <rect
                  x="18"
                  y="17.5"
                  width="8"
                  height="5"
                  rx="1.5"
                  fill="#0B1220"
                  stroke="#FFC837"
                  strokeWidth="1.8"
                />
              </g>
            </svg>

            {/* Green Online Status Dot */}
            <span className="chat-status-dot" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Floating Chat Window */}
      {chatOpen && (
        <div 
          className={`chat-window-new ${isExpanded ? "is-expanded" : ""}`}
          data-lenis-prevent="true"
          data-lenis-prevent-touch="true"
          data-lenis-prevent-wheel="true"
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="chat-header-new">
            <div className="chat-brand">
              <div className="chat-logo">
                <img src="/logo.png" alt="Mining Discovery" />
              </div>
              <div className="chat-brand-text">
                <strong>Mining Discovery</strong>
                <div className="chat-status">
                  <span className="chat-status-mark" aria-hidden="true">✦</span>
                  <span className="chat-status-role">Executive AI Terminal</span>
                  <span className="status-separator">•</span>
                  <span className="online-dot" />
                  <span>Online</span>
                </div>
              </div>
            </div>
            <div className="chat-header-actions">
              <button
                className="chat-action-button"
                onClick={handleResetChat}
                title="Start fresh conversation"
                aria-label="Start fresh conversation"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </button>
              <button
                className="chat-action-button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Standard width" : "Expand briefing view"}
                aria-label={isExpanded ? "Collapse chat window" : "Expand chat window"}
              >
                {isExpanded ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                )}
              </button>
              <button className="chat-close-button" onClick={closeChat} aria-label="Close">
                ×
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div 
            className="chat-messages-new" 
            ref={messagesRef}
            data-lenis-prevent="true"
            data-lenis-prevent-touch="true"
            data-lenis-prevent-wheel="true"
            onWheel={(e) => e.stopPropagation()}
          >
            {/* Show Welcome Card and Exploration Cards when no messages sent yet */}
            {messages.length === 0 && (
              <div className="welcome-screen">
                <div className="welcome-card">
                  <p className="welcome-title">Executive Mining Intelligence Terminal</p>
                  <p className="welcome-lede">
                    Institutional intelligence on global mining leadership (CEOs, Boards), recent industry mega-deals, commodity catalysts, and what happens next.
                  </p>
                </div>

                <div className="suggestions-container">
                  <div className="suggestions-title">
                    <span className="sparkle-icon">✦</span> Executive Intelligence Briefings
                  </div>

                  <div className="suggestion-list">
                    <button
                      className="suggestion-card"
                      onClick={() => {
                        setInput("Who are the current CEOs and Chairs of BHP, Rio Tinto, Vale, and Freeport-McMoRan?");
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                    >
                      <div className="suggestion-icon company">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <div className="suggestion-text">
                        <strong>Mining CEOs &amp; Leadership Directory</strong>
                        <span>Current leaders of BHP, Rio Tinto, Vale, Freeport &amp; peers</span>
                      </div>
                      <span className="suggestion-arrow">→</span>
                    </button>

                    <button
                      className="suggestion-card"
                      onClick={() => {
                        setInput("What are the latest mega deals and recent events in the mining industry?");
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                    >
                      <div className="suggestion-icon news">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      </div>
                      <div className="suggestion-text">
                        <strong>Recent Mega-Deals &amp; Industry M&amp;A</strong>
                        <span>Anglo demerger, Arcadium Lithium, Teck coal sale &amp; Vicuña JV</span>
                      </div>
                      <span className="suggestion-arrow">→</span>
                    </button>

                    <button
                      className="suggestion-card"
                      onClick={() => {
                        setInput("What is going to happen next with copper supply and AI datacenter demand?");
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                    >
                      <div className="suggestion-icon gold">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                      </div>
                      <div className="suggestion-text">
                        <strong>Future Impact: Copper &amp; AI Power Deficit</strong>
                        <span>Upcoming catalysts, supply deficits &amp; datacenter electrification</span>
                      </div>
                      <span className="suggestion-arrow">→</span>
                    </button>

                    <button
                      className="suggestion-card"
                      onClick={() => {
                        setInput("What is the latest gold price and central bank reserve outlook?");
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                    >
                      <div className="suggestion-icon gold">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12,2 22,12 12,22 2,12" />
                        </svg>
                      </div>
                      <div className="suggestion-text">
                        <strong>Gold All-Time Highs &amp; Central Banks</strong>
                        <span>Spot benchmark, sovereign purchases &amp; price catalysts</span>
                      </div>
                      <span className="suggestion-arrow">→</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((message) => (
              <div key={message.id} className={`message-new ${message.type}`}>
                {message.type === "bot" ? (
                  <div className="bot-message-wrapper">
                    {renderBotMessage(message)}
                  </div>
                ) : (
                  <div className="user-message-bubble">{message.text}</div>
                )}
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <div className="chat-input-new">
            <div className="chat-input-inner">
              <textarea
                ref={inputRef}
                value={input}
                placeholder="Ask about mining..."
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="send-button"
                onClick={() => sendMessage()}
                disabled={sending || !input.trim()}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

