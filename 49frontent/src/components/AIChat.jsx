import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";

const OPENAI_API_URL =
  import.meta.env.VITE_OPENAI_API_URL || "https://api.openai.com/v1/responses";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-5";

const getMockReply = (message) => `This is a sample AI response for: ${message}`;

const formatProblemContext = (problem, language, currentCode) => {
  const details = [
    problem?.title ? `Problem: ${problem.title}` : null,
    problem?.difficulty ? `Difficulty: ${problem.difficulty}` : null,
    problem?.description ? `Description: ${problem.description}` : null,
    language ? `Current language: ${language}` : null,
    currentCode?.trim() ? `Current code:\n${currentCode}` : null,
  ].filter(Boolean);

  return details.join("\n\n");
};

const buildInstructions = ({ problem, language, currentCode }) => {
  const context = formatProblemContext(problem, language, currentCode);

  return [
    "You are a helpful AI coding assistant inside a coding platform.",
    "Keep replies practical, concise, and focused on helping the user solve or understand the current problem.",
    context ? `Use this context when relevant:\n\n${context}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
};

const extractResponseText = (responseData) => {
  if (typeof responseData?.output_text === "string" && responseData.output_text.trim()) {
    return responseData.output_text.trim();
  }

  const outputItems = Array.isArray(responseData?.output) ? responseData.output : [];
  const textParts = outputItems.flatMap((item) => {
    const contentItems = Array.isArray(item?.content) ? item.content : [];

    return contentItems
      .map((contentItem) => {
        if (typeof contentItem?.text === "string" && contentItem.text.trim()) {
          return contentItem.text.trim();
        }

        if (typeof contentItem?.output_text === "string" && contentItem.output_text.trim()) {
          return contentItem.output_text.trim();
        }

        return "";
      })
      .filter(Boolean);
  });

  return textParts.join("\n\n").trim();
};

const createOpenAIInput = (messages, latestUserMessage) =>
  [...messages, { role: "user", content: latestUserMessage }].map((message) => ({
    role: message.role === "ai" ? "assistant" : "user",
    content: message.content,
  }));

async function fetchAIReply({ messages, latestUserMessage, problem, language, currentCode }) {
  if (!OPENAI_API_KEY) {
    return getMockReply(latestUserMessage);
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: buildInstructions({ problem, language, currentCode }),
      input: createOpenAIInput(messages, latestUserMessage),
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const data = await response.json();
  return extractResponseText(data) || getMockReply(latestUserMessage);
}

function AIChat({ problem, currentCode, language }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "Hi! Ask anything about this problem and I will help.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const placeholder = useMemo(() => {
    if (problem?.title) {
      return `Ask AI about "${problem.title}"`;
    }

    return "Ask the AI assistant anything";
  }, [problem?.title]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!problem?.title) {
      return;
    }

    setMessages([
      {
        role: "ai",
        content: `Hi! I am ready to help with "${problem.title}". Ask for hints, debugging, or explanations.`,
      },
    ]);
    setInput("");
  }, [problem?._id, problem?.title]);

  const handleSend = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput || loading) {
      return;
    }

    const userMessage = { role: "user", content: trimmedInput };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const aiReply = await fetchAIReply({
        messages,
        latestUserMessage: trimmedInput,
        problem,
        language,
        currentCode,
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        { role: "ai", content: aiReply },
      ]);
    } catch (error) {
      console.error("AI chat request failed:", error);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "ai",
          content: getMockReply(trimmedInput),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = async (event) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    await handleSend();
  };

  return (
    <div className="flex min-h-[440px] flex-col overflow-hidden rounded-[1.75rem] border border-base-300/60 bg-base-200/70">
      <div className="border-b border-base-300/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-300 text-slate-950 shadow-lg shadow-sky-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI Chat</h3>
            <p className="text-sm text-base-content/70">
              Ask for hints, debugging help, or concept explanations.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {messages.map((message, index) => {
            const isUser = message.role === "user";

            return (
              <div
                key={`${message.role}-${index}-${message.content.slice(0, 20)}`}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex max-w-[88%] items-start gap-3 rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    isUser
                      ? "bg-primary text-primary-content"
                      : "border border-base-300 bg-base-100 text-base-content"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isUser
                        ? "bg-white/15 text-primary-content"
                        : "bg-slate-900/5 text-base-content"
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </span>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[88%] rounded-3xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-base-content/70 shadow-sm">
                AI is thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-base-300/60 p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="input input-bordered w-full"
            disabled={loading}
          />

          <button
            type="button"
            onClick={handleSend}
            className={`btn btn-primary btn-square ${loading ? "loading" : ""}`}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            {!loading && <Send className="h-4 w-4" />}
          </button>
        </div>

        {!OPENAI_API_KEY && (
          <p className="mt-3 text-xs text-base-content/60">
            `VITE_OPENAI_API_KEY` not found, so mock AI responses are enabled.
          </p>
        )}
      </div>
    </div>
  );
}

export default AIChat;
