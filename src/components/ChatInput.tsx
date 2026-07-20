import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = 'Digite sua mensagem...',
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        120
      ).toString() + 'px';
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isSending || isLoading) return;

    setIsSending(true);
    try {
      await onSendMessage(message);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enviar com Ctrl/Cmd + Enter
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === 'Enter' &&
      message.trim() &&
      !isSending
    ) {
      e.preventDefault();
      handleSubmit(e as any);
    }

    // Quebra de linha com Shift + Enter
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      setMessage(message + '\n');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-t border-linen-300 bg-white flex-shrink-0"
    >
      <div className="flex gap-3 items-end">
        {/* Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSending || isLoading}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-sm text-embroidery-black placeholder-embroidery-gray focus:outline-none focus:border-terracotta-400 resize-none max-h-32"
            rows={1}
          />
          <p className="text-xs text-embroidery-gray mt-1">
            {message.length}/1000 • Ctrl+Enter para enviar
          </p>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || isSending || isLoading}
          className={`
            flex-shrink-0 w-10 h-10 rounded-lg font-bold text-lg transition-all
            flex items-center justify-center
            ${
              !message.trim() || isSending || isLoading
                ? 'bg-linen-200 text-embroidery-gray cursor-not-allowed'
                : 'bg-terracotta-500 text-white hover:bg-terracotta-600 active:shadow-embroidery-pressed'
            }
          `}
          title="Enviar (Ctrl+Enter)"
        >
          {isSending ? '⏳' : '➤'}
        </button>
      </div>
    </form>
  );
};
