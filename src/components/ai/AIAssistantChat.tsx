import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Lightbulb,
  Target,
  GitBranch,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import {
  chatWithAssistant,
  suggestKPIs,
  generateWBS,
  ideateInitiatives,
  isAIConfigured,
  KPISuggestionResult,
  WBSGenerationResult,
  InitiativeIdeationResult,
} from '../../services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'kpi-suggestion' | 'wbs-generation' | 'initiative-ideation';
  data?: KPISuggestionResult | WBSGenerationResult | InitiativeIdeationResult;
}

interface AIAssistantChatProps {
  selectedPillar?: string;
  selectedProject?: string;
}

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  selectedPillar,
  selectedProject,
}) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI Strategy Assistant. I can help you with:\n\n• Understanding BSC methodology\n• Suggesting KPIs for your objectives\n• Generating WBS for projects\n• Ideating strategic initiatives\n\nHow can I help you today?",
      timestamp: new Date(),
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const configured = isAIConfigured();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMessage, type: 'text' });
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      const conversationHistory = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const response = await chatWithAssistant(
        userMessage,
        {
          currentPage: location.pathname,
          selectedPillar,
          selectedProject,
        },
        conversationHistory
      );

      addMessage({ role: 'assistant', content: response, type: 'text' });
    } catch (error) {
      addMessage({
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        type: 'text',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: 'kpi' | 'wbs' | 'initiative') => {
    setShowQuickActions(false);

    if (action === 'kpi') {
      addMessage({
        role: 'assistant',
        content: "I can suggest KPIs for your strategic objectives. Please describe your objective and I'll recommend relevant KPIs.\n\nFor example: \"Improve customer satisfaction\" or \"Reduce operational costs by 20%\"",
        type: 'text',
      });
    } else if (action === 'wbs') {
      addMessage({
        role: 'assistant',
        content: "I can generate a Work Breakdown Structure for your project. Please describe the project and its scope.\n\nFor example: \"Implement a new CRM system for the sales team\" or \"Launch mobile app for customer self-service\"",
        type: 'text',
      });
    } else if (action === 'initiative') {
      addMessage({
        role: 'assistant',
        content: "I can suggest strategic initiatives to achieve your objectives. Please describe your goal.\n\nFor example: \"Increase market share in the enterprise segment\" or \"Build a culture of continuous improvement\"",
        type: 'text',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!configured) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-bg-card border border-border rounded-full shadow-lg flex items-center justify-center hover:bg-bg-hover transition-colors group"
          title="AI Assistant (Configure API key in Settings)"
        >
          <MessageCircle className="w-6 h-6 text-text-muted group-hover:text-text-secondary" />
        </button>
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-80 bg-bg-card border border-border rounded-lg shadow-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-text-primary font-medium">AI Assistant Not Configured</p>
                <p className="text-xs text-text-secondary mt-1">
                  Add your Claude API key in Settings to enable the AI Assistant.
                </p>
                <a
                  href="#/settings"
                  className="inline-block mt-2 text-xs text-accent-blue hover:underline"
                >
                  Go to Settings →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-accent-blue rounded-full shadow-lg flex items-center justify-center hover:bg-accent-blue/90 transition-colors group"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-bg-card border border-border rounded-lg shadow-xl transition-all ${
            isMinimized ? 'w-80 h-14' : 'w-96 h-[500px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary rounded-t-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-blue" />
              <span className="font-medium text-text-primary">AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-text-muted hover:text-text-primary transition-colors"
              >
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[360px]">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 ${
                        message.role === 'user'
                          ? 'bg-accent-blue text-white'
                          : message.role === 'system'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-bg-secondary text-text-primary'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-bg-secondary rounded-lg px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                {showQuickActions && messages.length === 1 && (
                  <div className="space-y-2">
                    <p className="text-xs text-text-muted">Quick actions:</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleQuickAction('kpi')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-secondary rounded-lg text-xs text-text-primary hover:bg-bg-hover transition-colors"
                      >
                        <Target className="w-3 h-3 text-green-400" />
                        Suggest KPIs
                      </button>
                      <button
                        onClick={() => handleQuickAction('wbs')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-secondary rounded-lg text-xs text-text-primary hover:bg-bg-hover transition-colors"
                      >
                        <GitBranch className="w-3 h-3 text-blue-400" />
                        Generate WBS
                      </button>
                      <button
                        onClick={() => handleQuickAction('initiative')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-secondary rounded-lg text-xs text-text-primary hover:bg-bg-hover transition-colors"
                      >
                        <Lightbulb className="w-3 h-3 text-amber-400" />
                        Ideate Initiatives
                      </button>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="flex-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-accent-blue rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-blue/90 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistantChat;
