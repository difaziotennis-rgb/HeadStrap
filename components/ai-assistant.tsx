"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User } from 'lucide-react';
import { Student } from '@/lib/types/lesson-intelligence';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: {
    type: string;
    data: any;
    needsConfirmation?: boolean;
  };
}

interface AIAssistantProps {
  students: Student[];
  onRefreshStudents: () => void;
  onSelectStudent: (student: Student | null) => void;
}

export function AIAssistant({ students, onRefreshStudents, onSelectStudent }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI assistant. I can help you manage students, answer questions, and perform actions. What would you like to do?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<Message['action'] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/lesson/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
          students: students.map(s => ({
            id: s.id,
            name: s.name,
            summary_data: s.summary_data,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        action: data.action,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If there's an action that needs confirmation, set it as pending
      if (data.action && data.action.needsConfirmation) {
        setPendingAction(data.action);
      } else if (data.action && !data.action.needsConfirmation) {
        // Execute action immediately if no confirmation needed
        await executeAction(data.action);
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = async (action: Message['action']) => {
    if (!action) return;

    try {
      setIsLoading(true);

      switch (action.type) {
        case 'edit_student_name': {
          const response = await fetch('/api/lesson/students', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: action.data.studentId,
              name: action.data.newName,
            }),
          });

          if (!response.ok) throw new Error('Failed to update student name');
          
          onRefreshStudents();
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `✅ Successfully renamed student to "${action.data.newName}"`,
            },
          ]);
          break;
        }

        case 'add_student': {
          const response = await fetch('/api/lesson/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: action.data.name,
              summary_data: {},
            }),
          });

          if (!response.ok) throw new Error('Failed to create student');
          
          const { student } = await response.json();
          onRefreshStudents();
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `✅ Successfully created new student "${action.data.name}"`,
            },
          ]);
          break;
        }

        case 'delete_student': {
          const response = await fetch(`/api/lesson/students?id=${action.data.studentId}`, {
            method: 'DELETE',
          });

          if (!response.ok) throw new Error('Failed to delete student');
          
          onRefreshStudents();
          onSelectStudent(null); // Clear selection if deleted student was selected
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `✅ Successfully deleted student "${action.data.studentName}" and all their lessons`,
            },
          ]);
          break;
        }

        case 'update_student_data': {
          const response = await fetch('/api/lesson/students', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: action.data.studentId,
              summary_data: action.data.summaryData,
            }),
          });

          if (!response.ok) throw new Error('Failed to update student data');
          
          onRefreshStudents();
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `✅ Successfully updated student data`,
            },
          ]);
          break;
        }

        default:
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `I understood the action but couldn't execute it. Action type: ${action.type}`,
            },
          ]);
      }
    } catch (error) {
      console.error('Action execution error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Failed to execute action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setPendingAction(null);
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      executeAction(pendingAction);
    }
  };

  const handleCancelAction = () => {
    setPendingAction(null);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: 'Action cancelled.',
      },
    ]);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#C9A227] hover:bg-[#A68B2C] text-slate-950 rounded-full shadow-lg shadow-[#C9A227]/30 flex items-center justify-center transition-all duration-200 hover:scale-110 z-50"
          title="Open AI Assistant"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#C9A227]" />
              <h3 className="font-semibold text-slate-100">AI Assistant</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setPendingAction(null);
              }}
              className="p-1 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#C9A227]/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-[#C9A227]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-[#C9A227] text-slate-950'
                      : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-[#C9A227]/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-[#C9A227]" />
                </div>
                <div className="bg-slate-800 rounded-lg px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Confirmation Dialog */}
          {pendingAction && (
            <div className="p-4 border-t border-slate-700 bg-slate-800/50">
              <p className="text-sm text-slate-300 mb-3">
                {pendingAction.type === 'delete_student' && (
                  <>Are you sure you want to delete "{pendingAction.data.studentName}"? This will also delete all their lessons.</>
                )}
                {pendingAction.type === 'edit_student_name' && (
                  <>Rename "{pendingAction.data.currentName}" to "{pendingAction.data.newName}"?</>
                )}
                {!['delete_student', 'edit_student_name'].includes(pendingAction.type) && (
                  <>Confirm this action?</>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isLoading}
                  className="flex-1 bg-[#C9A227] hover:bg-[#A68B2C] text-slate-950 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={handleCancelAction}
                  disabled={isLoading}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]/50"
                disabled={isLoading || !!pendingAction}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || !input.trim() || !!pendingAction}
                className="bg-[#C9A227] hover:bg-[#A68B2C] text-slate-950 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
