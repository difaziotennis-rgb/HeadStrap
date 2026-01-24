"use client";

import { useState } from 'react';
import { Copy, X, Check } from 'lucide-react';
import { Student } from '@/lib/types/lesson-intelligence';

interface LessonUpdateFormProps {
  student: Student | null;
  onClose: () => void;
}

export function LessonUpdateForm({ student, onClose }: LessonUpdateFormProps) {
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);

  if (!student) return null;

  const summaryData = student.summary_data as any;
  const studentName = summaryData?.student_name || student.name;

  // Build the formatted message
  const buildMessage = () => {
    let message = `Hi ${studentName}! 👋\n\n`;
    message += `Here's a quick update from today's lesson:\n\n`;
    
    // Add summary section (user's custom text)
    if (summary.trim()) {
      message += `${summary.trim()}\n\n`;
    }
    
    // Add key areas focused
    if (summaryData?.key_areas_focused && summaryData.key_areas_focused.length > 0) {
      message += `🎯 Key Areas We Worked On:\n`;
      summaryData.key_areas_focused.forEach((area: string) => {
        message += `• ${area}\n`;
      });
      message += `\n`;
    }
    
    // Add future goals
    if (summaryData?.future_goals && summaryData.future_goals.length > 0) {
      message += `🎯 Goals We're Working Towards:\n`;
      summaryData.future_goals.forEach((goal: string) => {
        message += `• ${goal}\n`;
      });
      message += `\n`;
    }
    
    // Add next lesson date
    if (summaryData?.next_lesson_date && summaryData.next_lesson_date !== 'not specified') {
      message += `📅 Next Lesson: ${summaryData.next_lesson_date}\n\n`;
    }
    
    message += `Keep up the great work! 💪\n\n`;
    message += `- DiFazio Tennis`;
    
    return message;
  };

  const handleCopy = () => {
    const message = buildMessage();
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const message = buildMessage();

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-slate-100 font-semibold text-lg tracking-tight mb-1">
            Lesson Update Message
          </h3>
          <p className="text-slate-400 text-sm">
            Add your summary, then copy the message to send
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1 -m-1 rounded-lg hover:bg-slate-800/60"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Your Summary (Optional)
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Write a few sentences about today's lesson..."
            className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]/50 resize-none"
            rows={3}
          />
          <p className="text-slate-500 text-xs mt-1">
            This will be added to the message above the student's progress details
          </p>
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Message Preview
          </label>
          <div className="bg-slate-800/60 border border-slate-600/60 rounded-lg p-4">
            <pre className="text-slate-100 text-sm whitespace-pre-wrap font-sans">
              {message}
            </pre>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="w-full bg-[#C9A227] hover:bg-[#A68B2C] text-slate-950 font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-[#C9A227]/20"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copy Message
            </>
          )}
        </button>

        <p className="text-slate-500 text-xs text-center">
          Paste the message into your text messaging app to send
        </p>
      </div>
    </div>
  );
}
