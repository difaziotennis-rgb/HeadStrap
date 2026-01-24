"use client";

import { Student, StudentSummaryData } from '@/lib/types/lesson-intelligence';
import { Target, AlertCircle, Calendar, TrendingUp, X, Mic, Square, Loader2, MessageSquare, Copy, Camera, Check, Edit2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

interface StudentProfileProps {
  student: Student | null;
  onClose: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isRecording?: boolean;
  isProcessing?: boolean;
  audioLevel?: number;
  onSendUpdate?: () => void;
  onUpdateStudent?: (student: Student) => void;
}

export function StudentProfile({ student, onClose, onStartRecording, onStopRecording, isRecording, isProcessing, audioLevel = 0, onSendUpdate, onUpdateStudent }: StudentProfileProps) {
  const [copied, setCopied] = useState(false);
  const [showUpdateOptions, setShowUpdateOptions] = useState(false);
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editingLimitation, setEditingLimitation] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editingNextLesson, setEditingNextLesson] = useState(false);
  const [areaNotes, setAreaNotes] = useState<Record<string, string>>({});
  const [limitationNotes, setLimitationNotes] = useState<Record<string, string>>({});
  const [goalNotes, setGoalNotes] = useState<Record<string, string>>({});
  const [nextLessonNotes, setNextLessonNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [localLimitationNotes, setLocalLimitationNotes] = useState<Record<string, string>>({});
  const [localGoalNotes, setLocalGoalNotes] = useState<Record<string, string>>({});
  const [localNextLessonNotes, setLocalNextLessonNotes] = useState<string>('');

  // Sync local notes when student changes (must run before early return)
  useEffect(() => {
    if (!student?.summary_data) {
      setLocalNotes({});
      setLocalLimitationNotes({});
      setLocalGoalNotes({});
      setLocalNextLessonNotes('');
      setEditingArea(null);
      setEditingLimitation(null);
      setEditingGoal(null);
      setEditingNextLesson(false);
      return;
    }
    const data = student.summary_data as StudentSummaryData;
    setLocalNotes(data.key_areas_notes || {});
    setLocalLimitationNotes(data.physical_limitations_notes || {});
    setLocalGoalNotes(data.future_goals_notes || {});
    setLocalNextLessonNotes(data.next_lesson_notes || '');
    setEditingArea(null);
    setEditingLimitation(null);
    setEditingGoal(null);
    setEditingNextLesson(false);
  }, [student]);

  if (!student) return null;

  const summary = student.summary_data as StudentSummaryData;
  const studentName = summary.student_name || student.name;

  const copyProfileInfo = () => {
    let info = `Student: ${studentName}\n\n`;
    
    if (summary.key_areas_focused && summary.key_areas_focused.length > 0) {
      info += `Key Areas Focused:\n${summary.key_areas_focused.map(area => `• ${area}`).join('\n')}\n\n`;
    }
    
    if (summary.physical_limitations && summary.physical_limitations.length > 0) {
      info += `Physical Limitations:\n${summary.physical_limitations.map(lim => `• ${lim}`).join('\n')}\n\n`;
    }
    
    if (summary.future_goals && summary.future_goals.length > 0) {
      info += `Future Goals:\n${summary.future_goals.map(goal => `• ${goal}`).join('\n')}\n\n`;
    }
    
    if (summary.next_lesson_date && summary.next_lesson_date !== 'not specified') {
      info += `Next Lesson: ${summary.next_lesson_date}\n\n`;
    }
    
    if (summary.last_updated) {
      info += `Last Updated: ${new Date(summary.last_updated).toLocaleDateString()}`;
    }

    navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const takeScreenshot = async () => {
    try {
      // Copy the profile info first
      copyProfileInfo();
      
      // For screenshots, we'll guide the user to use their device's built-in screenshot
      // Browser-based screenshot APIs require additional libraries (like html2canvas)
      // For now, we'll copy the info and show helpful instructions
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const screenshotHint = isMac 
        ? 'Use Cmd+Shift+4 to take a screenshot, or Cmd+Shift+3 for full screen'
        : 'Use Windows+Shift+S for Snipping Tool, or Print Screen for full screen';
      
      alert(`Profile info copied to clipboard!\n\n${screenshotHint}\n\nYou can now paste the profile info anywhere or take a screenshot manually.`);
      setShowUpdateOptions(false);
    } catch (error) {
      console.error('Error:', error);
      copyProfileInfo();
    }
  };

  const handleAreaClick = (area: string) => {
    if (editingArea === area) {
      setEditingArea(null);
    } else {
      setEditingArea(area);
      setAreaNotes({ ...localNotes });
    }
  };

  const handleSaveNotes = async (area: string) => {
    setSaving(true);
    try {
      const updatedNotes = {
        ...localNotes,
        [area]: areaNotes[area] || '',
      };
      
      // Remove empty notes
      Object.keys(updatedNotes).forEach(key => {
        if (!updatedNotes[key] || updatedNotes[key].trim() === '') {
          delete updatedNotes[key];
        }
      });

      const updatedSummary: StudentSummaryData = {
        ...summary,
        key_areas_notes: updatedNotes,
        last_updated: new Date().toISOString(),
      };

      const response = await fetch('/api/lesson/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: student.id,
          summary_data: updatedSummary,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      const { student: updatedStudent } = await response.json();
      setLocalNotes(updatedNotes);
      setEditingArea(null);
      onUpdateStudent?.(updatedStudent);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLimitationNotes = async (limitation: string) => {
    setSaving(true);
    try {
      const updatedNotes = {
        ...localLimitationNotes,
        [limitation]: limitationNotes[limitation] || '',
      };
      
      Object.keys(updatedNotes).forEach(key => {
        if (!updatedNotes[key] || updatedNotes[key].trim() === '') {
          delete updatedNotes[key];
        }
      });

      const updatedSummary: StudentSummaryData = {
        ...summary,
        physical_limitations_notes: updatedNotes,
        last_updated: new Date().toISOString(),
      };

      const response = await fetch('/api/lesson/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: student.id,
          summary_data: updatedSummary,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      const { student: updatedStudent } = await response.json();
      setLocalLimitationNotes(updatedNotes);
      setEditingLimitation(null);
      onUpdateStudent?.(updatedStudent);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGoalNotes = async (goal: string) => {
    setSaving(true);
    try {
      const updatedNotes = {
        ...localGoalNotes,
        [goal]: goalNotes[goal] || '',
      };
      
      Object.keys(updatedNotes).forEach(key => {
        if (!updatedNotes[key] || updatedNotes[key].trim() === '') {
          delete updatedNotes[key];
        }
      });

      const updatedSummary: StudentSummaryData = {
        ...summary,
        future_goals_notes: updatedNotes,
        last_updated: new Date().toISOString(),
      };

      const response = await fetch('/api/lesson/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: student.id,
          summary_data: updatedSummary,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      const { student: updatedStudent } = await response.json();
      setLocalGoalNotes(updatedNotes);
      setEditingGoal(null);
      onUpdateStudent?.(updatedStudent);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNextLessonNotes = async () => {
    setSaving(true);
    try {
      const updatedSummary: StudentSummaryData = {
        ...summary,
        next_lesson_notes: nextLessonNotes.trim() || undefined,
        last_updated: new Date().toISOString(),
      };

      const response = await fetch('/api/lesson/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: student.id,
          summary_data: updatedSummary,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      const { student: updatedStudent } = await response.json();
      setLocalNextLessonNotes(nextLessonNotes.trim());
      setEditingNextLesson(false);
      onUpdateStudent?.(updatedStudent);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between mb-6">
        <h2 className="font-display text-slate-100 font-semibold text-lg tracking-tight">
          {studentName}
        </h2>
        <div className="flex items-center gap-2 relative">
          {onSendUpdate && (
            <>
              <button
                type="button"
                onClick={() => setShowUpdateOptions(!showUpdateOptions)}
                className="bg-[#C9A227] hover:bg-[#A68B2C] text-slate-950 font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] flex items-center gap-2 shadow-lg shadow-[#C9A227]/20"
                title="Send update/review"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">Send Update</span>
                  </>
                )}
              </button>
              
              {showUpdateOptions && (
                <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[200px]">
                  <button
                    type="button"
                    onClick={() => {
                      copyProfileInfo();
                      setShowUpdateOptions(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-center gap-3 text-slate-200 transition-colors rounded-t-lg"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy Profile Info</span>
                  </button>
                  <button
                    type="button"
                    onClick={takeScreenshot}
                    className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-center gap-3 text-slate-200 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-sm">Take Screenshot</span>
                  </button>
                  {onSendUpdate && (
                    <button
                      type="button"
                      onClick={() => {
                        onSendUpdate();
                        setShowUpdateOptions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-center gap-3 text-slate-200 transition-colors rounded-b-lg border-t border-slate-700"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">Send Text Update</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 -m-1 rounded-lg hover:bg-slate-800/60"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Recording Controls */}
      {onStartRecording && (
        <div className="mb-6 pb-6 border-b border-slate-700/60">
          {!isRecording && !isProcessing && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-400 font-medium text-sm mb-1">
                    Continue lesson for {studentName}
                  </p>
                  <p className="text-slate-400 text-xs">
                    Record a new lesson to add to this profile
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onStartRecording}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 hover:scale-[1.02] flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Mic className="w-4 h-4" />
                  Continue Recording
                </button>
              </div>
            </div>
          )}

          {isRecording && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="mb-4">
                <p className="text-emerald-400 font-medium text-sm mb-3">
                  Recording lesson for {studentName}…
                </p>
                <div className="h-16 flex items-end justify-center gap-1">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-emerald-500/80 rounded-t-sm transition-all duration-75"
                      style={{
                        width: '5px',
                        height: `${Math.max(4, (audioLevel * 100) * (0.5 + Math.random() * 0.5))}%`,
                        opacity: 1,
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={onStopRecording}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 px-5 rounded-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 animate-pulse"
              >
                <Square className="w-4 h-4 fill-white" />
                Stop Recording
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="bg-slate-800/60 border border-slate-600/60 rounded-lg p-4">
              <div className="flex items-center justify-center gap-3 text-slate-300">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="font-medium text-sm">Processing lesson…</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {summary.key_areas_focused && summary.key_areas_focused.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-[#C9A227]" />
              <h3 className="text-slate-300 font-medium text-sm tracking-wide">Key Areas Focused</h3>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {summary.key_areas_focused.map((area, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleAreaClick(area)}
                    className={`px-3 py-1.5 rounded-lg border font-medium text-sm transition-all hover:scale-105 flex items-center gap-2 ${
                      editingArea === area 
                        ? 'bg-[#C9A227]/25 border-[#C9A227] text-[#C9A227] shadow-md' 
                        : localNotes[area] 
                        ? 'bg-[#C9A227]/15 border-[#C9A227]/50 text-[#C9A227]' 
                        : 'bg-[#C9A227]/15 text-[#C9A227] border border-[#C9A227]/30'
                    }`}
                    title={localNotes[area] ? 'Click to edit notes' : 'Click to add notes'}
                  >
                    {area}
                    {localNotes[area] && <Edit2 className="w-3 h-3" />}
                  </button>
                ))}
              </div>
              
              {summary.key_areas_focused.map((area, idx) => {
                const hasNotes = localNotes[area] && localNotes[area].trim() !== '';
                const isEditing = editingArea === area;
                
                if (!hasNotes && !isEditing) {
                  return null;
                }
                
                return (
                  <div key={`notes-${idx}`} className="bg-slate-800/40 border border-slate-600/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-200 font-semibold text-sm">{area}</span>
                      {isEditing && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveNotes(area)}
                            disabled={saving}
                            className="bg-[#C9A227] hover:bg-[#A68B2C] text-slate-950 px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingArea(null);
                              // Reset areaNotes for this area to the saved value
                              setAreaNotes({ ...areaNotes, [area]: localNotes[area] || '' });
                            }}
                            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                            title="Close notes"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <textarea
                        value={areaNotes[area] || ''}
                        onChange={(e) => setAreaNotes({ ...areaNotes, [area]: e.target.value })}
                        placeholder="Add detailed notes about this area..."
                        className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]/50 resize-none text-sm"
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <p className="text-slate-400 text-sm whitespace-pre-wrap">{localNotes[area]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {summary.physical_limitations && summary.physical_limitations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-slate-500" />
              <h3 className="text-slate-300 font-medium text-sm tracking-wide">Physical Limitations</h3>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {summary.physical_limitations.map((limitation, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      if (editingLimitation === limitation) {
                        setEditingLimitation(null);
                      } else {
                        setEditingLimitation(limitation);
                        setLimitationNotes({ ...localLimitationNotes });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg border font-medium text-sm transition-all hover:scale-105 flex items-center gap-2 ${
                      editingLimitation === limitation 
                        ? 'bg-rose-500/25 border-rose-500 text-rose-400 shadow-md' 
                        : localLimitationNotes[limitation] 
                        ? 'bg-rose-500/15 border-rose-500/50 text-rose-400' 
                        : 'bg-slate-800/60 text-slate-400 border border-slate-600/50'
                    }`}
                    title={localLimitationNotes[limitation] ? 'Click to edit notes' : 'Click to add notes'}
                  >
                    {limitation}
                    {localLimitationNotes[limitation] && <Edit2 className="w-3 h-3" />}
                  </button>
                ))}
              </div>
              
              {summary.physical_limitations.map((limitation, idx) => {
                const hasNotes = localLimitationNotes[limitation] && localLimitationNotes[limitation].trim() !== '';
                const isEditing = editingLimitation === limitation;
                
                if (!hasNotes && !isEditing) {
                  return null;
                }
                
                return (
                  <div key={`notes-${idx}`} className="bg-slate-800/40 border border-slate-600/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-200 font-semibold text-sm">{limitation}</span>
                      {isEditing && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveLimitationNotes(limitation)}
                            disabled={saving}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLimitation(null);
                              setLimitationNotes({ ...limitationNotes, [limitation]: localLimitationNotes[limitation] || '' });
                            }}
                            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                            title="Close notes"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <textarea
                        value={limitationNotes[limitation] || ''}
                        onChange={(e) => setLimitationNotes({ ...limitationNotes, [limitation]: e.target.value })}
                        placeholder="Add detailed notes about this limitation..."
                        className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 resize-none text-sm"
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <p className="text-slate-400 text-sm whitespace-pre-wrap">{localLimitationNotes[limitation]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {summary.future_goals && summary.future_goals.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#C9A227]" />
              <h3 className="text-slate-300 font-medium text-sm tracking-wide">Future Goals</h3>
            </div>
            <div className="space-y-3">
              <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-sm">
                {summary.future_goals.map((goal, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingGoal === goal) {
                          setEditingGoal(null);
                        } else {
                          setEditingGoal(goal);
                          setGoalNotes({ ...localGoalNotes });
                        }
                      }}
                      className={`text-left px-2 py-1 rounded transition-all hover:scale-[1.02] flex items-center gap-2 ${
                        editingGoal === goal 
                          ? 'bg-[#C9A227]/25 border border-[#C9A227] text-[#C9A227]' 
                          : localGoalNotes[goal] 
                          ? 'bg-[#C9A227]/15 text-[#C9A227]' 
                          : 'hover:bg-slate-800/40'
                      }`}
                      title={localGoalNotes[goal] ? 'Click to edit notes' : 'Click to add notes'}
                    >
                      {goal}
                      {localGoalNotes[goal] && <Edit2 className="w-3 h-3" />}
                    </button>
                  </li>
                ))}
              </ul>
              
              {summary.future_goals.map((goal, idx) => {
                const hasNotes = localGoalNotes[goal] && localGoalNotes[goal].trim() !== '';
                const isEditing = editingGoal === goal;
                
                if (!hasNotes && !isEditing) {
                  return null;
                }
                
                return (
                  <div key={`notes-${idx}`} className="bg-slate-800/40 border border-slate-600/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-200 font-semibold text-sm">{goal}</span>
                      {isEditing && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveGoalNotes(goal)}
                            disabled={saving}
                            className="bg-[#C9A227] hover:bg-[#A68B2C] text-slate-950 px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGoal(null);
                              setGoalNotes({ ...goalNotes, [goal]: localGoalNotes[goal] || '' });
                            }}
                            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                            title="Close notes"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <textarea
                        value={goalNotes[goal] || ''}
                        onChange={(e) => setGoalNotes({ ...goalNotes, [goal]: e.target.value })}
                        placeholder="Add detailed notes about this goal..."
                        className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]/50 resize-none text-sm"
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <p className="text-slate-400 text-sm whitespace-pre-wrap">{localGoalNotes[goal]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {summary.next_lesson_date && summary.next_lesson_date !== 'not specified' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#C9A227]" />
              <h3 className="text-slate-300 font-medium text-sm tracking-wide">Next Lesson</h3>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  if (editingNextLesson) {
                    setEditingNextLesson(false);
                  } else {
                    setEditingNextLesson(true);
                    setNextLessonNotes(localNextLessonNotes);
                  }
                }}
                className={`text-left px-3 py-2 rounded-lg border transition-all hover:scale-[1.02] flex items-center gap-2 w-full ${
                  editingNextLesson 
                    ? 'bg-[#C9A227]/25 border-[#C9A227] text-[#C9A227]' 
                    : localNextLessonNotes 
                    ? 'bg-[#C9A227]/15 border-[#C9A227]/50 text-[#C9A227]' 
                    : 'bg-slate-800/60 border-slate-600/50 text-slate-200'
                }`}
                title={localNextLessonNotes ? 'Click to edit notes' : 'Click to add notes'}
              >
                <span className="font-semibold whitespace-pre-wrap">{summary.next_lesson_date}</span>
                {localNextLessonNotes && <Edit2 className="w-3 h-3 ml-auto" />}
              </button>
              
              {(localNextLessonNotes || editingNextLesson) && (
                <div className="bg-slate-800/40 border border-slate-600/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-200 font-semibold text-sm">Notes</span>
                    {editingNextLesson && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveNextLessonNotes}
                          disabled={saving}
                          className="bg-[#C9A227] hover:bg-[#A68B2C] text-slate-950 px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" />
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNextLesson(false);
                            setNextLessonNotes(localNextLessonNotes);
                          }}
                          className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
                          title="Close notes"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {editingNextLesson ? (
                    <textarea
                      value={nextLessonNotes}
                      onChange={(e) => setNextLessonNotes(e.target.value)}
                      placeholder="Add detailed notes about the next lesson..."
                      className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]/50 resize-none text-sm"
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <p className="text-slate-400 text-sm whitespace-pre-wrap">{localNextLessonNotes}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {summary.last_updated && (
          <div className="pt-4 border-t border-slate-700/60">
            <p className="text-slate-500 text-xs">
              Last updated: {new Date(summary.last_updated).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
