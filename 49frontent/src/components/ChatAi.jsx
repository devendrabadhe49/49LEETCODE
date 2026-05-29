import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Send } from "lucide-react";
import axiosClient from "../utill/axiosClient";

function ChatAi({ problem, currentCode, language }) {
  const [messages, setMessages] = useState([
    {
      role: "model",
      content:
        "Ask for a hint, an approach, edge cases, or help debugging your current code.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      message: "",
    },
  });

  const draftMessage = watch("message");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!problem?._id || !problem?.title) {
      return;
    }

    setMessages([
      {
        role: "model",
        content: `Need help with "${problem.title}"? Ask for hints, logic breakdown, or a bug-finding walkthrough.`,
      },
    ]);
  }, [problem?._id, problem?.title]);

  const onSubmit = async (data) => {
    const userMessage = data.message.trim();

    if (!userMessage || !problem?._id) {
      return;
    }

    const nextHistory = [
      ...messages,
      { role: "user", content: userMessage },
    ].slice(-8);

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", content: userMessage },
    ]);
    reset();

    try {
      setLoading(true);

      const response = await axiosClient.post(`/chat/ai/${problem._id}`, {
        message: userMessage,
        currentCode,
        language,
        history: nextHistory,
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "model",
          content:
            response.data?.message ||
            response.data?.content ||
            "I could not generate a response just now.",
        },
      ]);
    } catch (error) {
      console.error("API Error:", error);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "model",
          content: "I hit an error while replying. Try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-base-300/60 bg-base-200/70">
      <div className="border-b border-base-300/60 px-5 py-4">
        <h3 className="font-semibold">AI Help Desk</h3>
        <p className="text-sm text-base-content/70">
          Use it for hints, debugging, complexity checks, or explaining a failing testcase.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-content"
                  : "border border-base-300 bg-base-100 text-base-content"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-3xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-base-content/70">
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="border-t border-base-300/60 p-4">
        <div className="flex items-center gap-3">
          <input
            placeholder="Ask for a hint or help with your code"
            className={`input input-bordered w-full ${errors.message ? "input-error" : ""}`}
            {...register("message", { required: true, minLength: 2 })}
          />

          <button
            type="submit"
            className={`btn btn-primary btn-square ${loading ? "loading" : ""}`}
            disabled={loading || !draftMessage?.trim() || !problem?._id}
            aria-label="Send message"
          >
            {!loading && <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatAi;
