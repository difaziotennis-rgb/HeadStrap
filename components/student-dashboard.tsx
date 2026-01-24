"use client";

import { useState, useEffect } from 'react';
import { Student, StudentSummaryData } from '@/lib/types/lesson-intelligence';
import { User, Target, AlertCircle, Calendar, Loader2, Edit2, Trash2, X, Save } from 'lucide-react';

interface StudentDashboardProps {
  onStudentSelect: (student: Student | null) => void;
  selectedStudentId: string | null;
  refreshTrigger?: number;
}

export function StudentDashboard({ onStudentSelect, selectedStudentId, refreshTrigger }: StudentDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [refreshTrigger]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lesson/students');
      
      // Try to parse JSON, but handle non-JSON responses
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 200)}`);
      }
      
      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.error || 'Failed to fetch students'}: ${data.details}`
          : data.error || `Failed to fetch students (Status: ${response.status})`;
        throw new Error(errorMessage);
      }
      
      setStudents(data.students || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching students:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to load students. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (student: Student, e?: React.MouseEvent) => {
    // Don't trigger selection if clicking edit/delete buttons
    if (e && (e.target as HTMLElement).closest('button[data-action]')) {
      return;
    }
    if (selectedStudentId === student.id) {
      onStudentSelect(null);
    } else {
      onStudentSelect(student);
    }
  };

  const handleEditClick = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(student.id);
    const summary = student.summary_data as StudentSummaryData;
    setEditingName(summary.student_name || student.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (studentId: string) => {
    if (!editingName.trim()) {
      alert('Student name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/lesson/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: studentId,
          name: editingName.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update student');
      }

      const { student: updatedStudent } = await response.json();
      
      // Update local state
      setStudents(students.map(s => s.id === studentId ? updatedStudent : s));
      setEditingId(null);
      setEditingName('');
      
      // If this student is currently selected, update the selection
      if (selectedStudentId === studentId) {
        onStudentSelect(updatedStudent);
      }
    } catch (err) {
      console.error('Error updating student:', err);
      alert(err instanceof Error ? err.message : 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(student.id);
  };

  const handleConfirmDelete = async (studentId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/lesson/students?id=${studentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete student');
      }

      // Remove from local state
      setStudents(students.filter(s => s.id !== studentId));
      setDeletingId(null);
      
      // If this student was selected, clear selection
      if (selectedStudentId === studentId) {
        onStudentSelect(null);
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete student');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-8 text-center shadow-xl shadow-black/20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading students…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/80 border border-rose-400/40 rounded-xl p-8 shadow-xl shadow-black/20">
        <p className="text-rose-300 font-medium text-sm mb-2">Error: {error}</p>
        <p className="text-slate-400 text-xs mb-4">
          This might be due to missing environment variables or Supabase configuration. 
          Check your browser console (F12) for more details.
        </p>
        <div className="mb-4 p-3 bg-slate-950/50 rounded-lg border border-rose-500/30">
          <p className="text-xs text-slate-400 mb-2">To debug:</p>
          <ol className="text-xs text-slate-400 list-decimal list-inside space-y-1 ml-2">
            <li>Open browser console (F12 or right-click → Inspect)</li>
            <li>Go to Network tab</li>
            <li>Refresh the page</li>
            <li>Click on the failed request (api/lesson/students)</li>
            <li>Check the Response tab for the error details</li>
          </ol>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchStudents}
            className="bg-[#C9A227] hover:bg-[#A68B2C] text-slate-950 font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const response = await fetch('/api/lesson/test-db');
                const data = await response.json();
                const message = JSON.stringify(data, null, 2);
                console.log('Test DB Result:', data);
                alert(message);
              } catch (err) {
                console.error('Test failed:', err);
                alert('Test failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
              }
            }}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
          >
            Test Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6 shadow-xl shadow-black/20">
      <h2 className="font-display text-slate-100 font-semibold text-lg mb-6 tracking-tight">
        Students
      </h2>

      {students.length === 0 ? (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No students yet. Record a lesson to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const summary = student.summary_data as StudentSummaryData;
            const isSelected = selectedStudentId === student.id;

            const isEditing = editingId === student.id;
            const isDeleting = deletingId === student.id;

            return (
              <div
                key={student.id}
                className={`w-full p-4 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#C9A227]/15 border-[#C9A227]/50'
                    : 'bg-slate-800/40 border-slate-600/40 hover:border-slate-500/60 hover:bg-slate-800/60'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(student.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        className="flex-1 bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50 focus:border-[#C9A227]/50"
                        placeholder="Student name"
                        autoFocus
                        disabled={saving}
                      />
                      <button
                        type="button"
                        data-action="save"
                        onClick={() => handleSaveEdit(student.id)}
                        disabled={saving}
                        className="bg-[#C9A227] hover:bg-[#A68B2C] text-slate-950 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        data-action="cancel"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : isDeleting ? (
                  <div className="space-y-3">
                    <p className="text-slate-200 text-sm font-medium">
                      Delete {summary.student_name || student.name}? This will also delete all their lessons.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-action="confirm-delete"
                        onClick={() => handleConfirmDelete(student.id)}
                        disabled={saving}
                        className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                      >
                        {saving ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        type="button"
                        data-action="cancel-delete"
                        onClick={handleCancelDelete}
                        disabled={saving}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleStudentClick(student, e)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-100 mb-2">
                          {summary.student_name || student.name}
                        </h3>

                    {summary.key_areas_focused && summary.key_areas_focused.length > 0 && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-slate-400">
                        <Target className="w-4 h-4 text-[#C9A227]/80" />
                        <span>
                          {summary.key_areas_focused.slice(0, 2).join(', ')}
                          {summary.key_areas_focused.length > 2 && '…'}
                        </span>
                      </div>
                    )}

                    {summary.physical_limitations && summary.physical_limitations.length > 0 && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-slate-400">
                        <AlertCircle className="w-4 h-4 text-slate-500" />
                        <span>{summary.physical_limitations.slice(0, 1).join(', ')}</span>
                      </div>
                    )}

                        {summary.next_lesson_date && summary.next_lesson_date !== 'not specified' && (
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Calendar className="w-4 h-4 text-[#C9A227]/80" />
                            <span>Next: {summary.next_lesson_date}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          type="button"
                          data-action="edit"
                          onClick={(e) => handleEditClick(student, e)}
                          className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-[#C9A227]"
                          title="Edit student name"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          data-action="delete"
                          onClick={(e) => handleDeleteClick(student, e)}
                          className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-rose-400"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
