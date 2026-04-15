"use client";

import { useState, useRef, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { LessonRecorder } from '@/components/lesson-recorder';
import { StudentDashboard } from '@/components/student-dashboard';
import { StudentProfile } from '@/components/student-profile';
import { LessonUpdateForm } from '@/components/lesson-update-form';
import { AIAssistant } from '@/components/ai-assistant';
import { Student, ParsedLessonData, StudentSummaryData } from '@/lib/types/lesson-intelligence';

export default function LessonPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [lastProcessedStudent, setLastProcessedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const recordingTriggerRef = useRef<(() => void) | null>(null);
  const stopRecordingRef = useRef<(() => void) | null>(null);

  // Fetch students for AI assistant
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/lesson/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Refresh students (called when dashboard refreshes)
  const handleRefreshStudents = () => {
    fetchStudents();
    setDashboardRefreshTrigger((prev) => prev + 1);
  };

  // Fetch students on mount and when dashboard refreshes
  useEffect(() => {
    fetchStudents();
  }, [dashboardRefreshTrigger]);

  const handleTranscriptComplete = async (newTranscript: string) => {
    setTranscript(newTranscript);
    setIsProcessing(true);
    setStatusMessage('Analyzing lesson with AI...');
    setStatusType(null);

    try {
      // Step 1: Parse the transcript with Gemini
      const parseResponse = await fetch('/api/lesson/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: newTranscript,
          existingSummary: selectedStudent?.summary_data || null,
        }),
      });

      if (!parseResponse.ok) {
        const error = await parseResponse.json();
        const errorMessage = error.details 
          ? `${error.error || 'Failed to parse transcript'}: ${error.details}`
          : error.error || 'Failed to parse transcript';
        throw new Error(errorMessage);
      }

      const { parsedData } = await parseResponse.json() as { parsedData: ParsedLessonData };
      setStatusMessage('Saving lesson data...');

      // Step 2: Find or create student
      let studentId: string;
      let student: Student;

      if (selectedStudent) {
        // Update existing student
        studentId = selectedStudent.id;
        
        // The AI has already merged the data (including deletions/edits), so use it directly
        // The parsedData from AI contains the complete, updated arrays
        const existingSummary = selectedStudent.summary_data as StudentSummaryData;
        const mergedSummary: StudentSummaryData = {
          student_name: parsedData.student_name || existingSummary.student_name || selectedStudent.name,
          // Use AI's output directly - it has already handled additions, deletions, and edits
          key_areas_focused: parsedData.key_areas_focused || [],
          physical_limitations: parsedData.physical_limitations || [],
          future_goals: parsedData.future_goals || [],
          next_lesson_date: parsedData.next_lesson_date !== 'not specified' 
            ? parsedData.next_lesson_date 
            : existingSummary.next_lesson_date,
          last_updated: new Date().toISOString(),
        };

        // Update student
        const updateResponse = await fetch('/api/lesson/students', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: studentId,
            summary_data: mergedSummary,
          }),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update student');
        }

        const { student: updatedStudent } = await updateResponse.json();
        student = updatedStudent;
        setSelectedStudent(updatedStudent);
      } else {
        // Create new student or find existing by name
        const studentName = parsedData.student_name || 'Unknown Student';
        
        // Try to find existing student first
        const studentsResponse = await fetch('/api/lesson/students');
        const studentsData = await studentsResponse.json();
        const existingStudent = studentsData.students?.find(
          (s: Student) => s.name.toLowerCase() === studentName.toLowerCase()
        );

        if (existingStudent) {
          studentId = existingStudent.id;
          // Merge with existing
          const existingSummary = existingStudent.summary_data as StudentSummaryData;
          // The AI has already merged the data (including deletions/edits), so use it directly
          const mergedSummary: StudentSummaryData = {
            student_name: parsedData.student_name || existingSummary.student_name || existingStudent.name,
            // Use AI's output directly - it has already handled additions, deletions, and edits
            key_areas_focused: parsedData.key_areas_focused || [],
            physical_limitations: parsedData.physical_limitations || [],
            future_goals: parsedData.future_goals || [],
            next_lesson_date: parsedData.next_lesson_date !== 'not specified' 
              ? parsedData.next_lesson_date 
              : existingSummary.next_lesson_date,
            last_updated: new Date().toISOString(),
          };

          const updateResponse = await fetch('/api/lesson/students', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: studentId,
              summary_data: mergedSummary,
            }),
          });

          if (!updateResponse.ok) {
            const error = await updateResponse.json();
            const errorMessage = error.details 
              ? `Failed to update student: ${error.details}`
              : error.error || 'Failed to update student';
            throw new Error(errorMessage);
          }

          const { student: updatedStudent } = await updateResponse.json();
          student = updatedStudent;
          setSelectedStudent(updatedStudent);
        } else {
          // Create new student
          const createResponse = await fetch('/api/lesson/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: studentName,
              summary_data: {
                ...parsedData,
                last_updated: new Date().toISOString(),
              } as StudentSummaryData,
            }),
          });

          if (!createResponse.ok) {
            let errorMessage = 'Failed to create student';
            try {
              const error = await createResponse.json();
              // Build comprehensive error message
              errorMessage = error.error || 'Failed to create student';
              if (error.details) {
                errorMessage += `: ${error.details}`;
              }
              if (error.fullError) {
                errorMessage += `\n\nFull error: ${error.fullError}`;
              }
              if (error.code) {
                errorMessage += `\nError code: ${error.code}`;
              }
            } catch (parseError) {
              // If JSON parsing fails, get the raw text
              const text = await createResponse.text();
              errorMessage += `: ${text || 'Unknown error'}`;
            }
            console.error('Student creation error:', errorMessage);
            throw new Error(errorMessage);
          }

          const { student: newStudent } = await createResponse.json();
          student = newStudent;
          studentId = newStudent.id;
          setSelectedStudent(newStudent);
        }
      }

      // Step 3: Save the lesson
      await fetch('/api/lesson/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          transcript: newTranscript,
          parsed_data: parsedData,
        }),
      });

      setStatusMessage('Lesson processed successfully!');
      setStatusType('success');
      setTranscript(null);
      
      // Refresh the selected student's data if they're currently selected
      if (selectedStudent && studentId === selectedStudent.id) {
        // Fetch updated student data
        const updatedStudentResponse = await fetch(`/api/lesson/students`);
        if (updatedStudentResponse.ok) {
          const { students } = await updatedStudentResponse.json();
          const updatedStudent = students.find((s: Student) => s.id === studentId);
          if (updatedStudent) {
            setSelectedStudent(updatedStudent);
          }
        }
      }
      
      // Trigger a refresh of the student dashboard (without page reload)
      setDashboardRefreshTrigger(prev => prev + 1);
      
      // Store the processed student (update form can be opened manually via button)
      setLastProcessedStudent(student);
    } catch (error) {
      console.error('Processing error:', error);
      let errorMessage = 'Failed to process lesson';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error message:', errorMessage);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Unknown error type:', error);
        errorMessage = String(error);
      }
      setStatusMessage(errorMessage);
      setStatusType('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = (error: string) => {
    setStatusMessage(error);
    setStatusType('error');
  };

  // No longer needed - the form handles everything client-side

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-950/95 backdrop-blur-sm border-b border-slate-700/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="font-display text-xl font-semibold tracking-tight text-[#C9A227]">
            Lesson Intelligence
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12" role="main">
        {/* Status Message */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-xl border ${
            statusType === 'success' 
              ? 'bg-slate-900/80 border-emerald-500/40 text-slate-100' 
              : statusType === 'error'
              ? 'bg-slate-900/80 border-rose-400/40 text-rose-300'
              : 'bg-slate-900/80 border-slate-600 text-slate-300'
          }`}>
            <div className="flex items-start gap-3">
              {isProcessing && <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-0.5 shrink-0" />}
              {statusType === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />}
              {statusType === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm tracking-wide break-words">{statusMessage}</p>
                {statusType === 'error' && (
                  <div className="mt-3 space-y-3">
                    <div className="p-3 bg-slate-950/50 rounded-lg border border-rose-500/30">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-semibold text-rose-400 uppercase tracking-wide">Full Error Details:</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            navigator.clipboard.writeText(statusMessage || '');
                            const btn = e.currentTarget;
                            const originalText = btn.textContent;
                            btn.textContent = 'Copied!';
                            setTimeout(() => { btn.textContent = originalText; }, 2000);
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300 underline whitespace-nowrap"
                        >
                          Copy Error
                        </button>
                      </div>
                      <pre className="text-xs text-rose-300/90 font-mono whitespace-pre-wrap break-all overflow-x-auto select-all">
                        {statusMessage}
                      </pre>
                    </div>
                    
                    {/* Microphone Permission Help */}
                    {statusMessage?.toLowerCase().includes('microphone permission') && (
                      <div className="p-4 bg-slate-800/60 rounded-lg border border-[#C9A227]/40">
                        <p className="text-sm font-semibold text-[#C9A227] mb-3">How to Enable Microphone Access:</p>
                        <div className="space-y-2 text-xs text-slate-300">
                          <div>
                            <p className="font-semibold text-slate-200 mb-1">Cursor Browser:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li><strong>First, check macOS System Settings:</strong>
                                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                                  <li>Open System Settings (or System Preferences on older macOS)</li>
                                  <li>Go to Privacy & Security → Microphone</li>
                                  <li>Make sure Cursor is checked/enabled</li>
                                  <li>If Cursor isn't in the list, try recording once to trigger the system prompt</li>
                                </ul>
                              </li>
                              <li><strong>Then in Cursor:</strong>
                                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                                  <li>Try clicking the "Request Microphone Permission" button below</li>
                                  <li>Or go to Cursor menu → Settings (or Preferences)</li>
                                  <li>Look for Privacy, Security, or Site Settings</li>
                                  <li>Find Microphone permissions and allow for localhost:3000</li>
                                </ul>
                              </li>
                              <li>Refresh this page (Cmd+R) and try recording again</li>
                            </ol>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200 mb-1">Chrome / Edge / Brave:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Click the lock icon (🔒) or site icon in the address bar</li>
                              <li>Find "Microphone" and change it to "Allow"</li>
                              <li>Refresh this page and try again</li>
                            </ol>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200 mb-1">Safari:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Go to Safari → Settings → Websites → Microphone</li>
                              <li>Find this site and set it to "Allow"</li>
                              <li>Refresh this page and try again</li>
                            </ol>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200 mb-1">Firefox:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Click the shield icon in the address bar</li>
                              <li>Click "Permissions" → "Use the Microphone" → "Allow"</li>
                              <li>Refresh this page and try again</li>
                            </ol>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <p className="text-slate-400 italic">💡 Tip: Make sure no other apps are using your microphone, and that your microphone is not muted in system settings. In Cursor, you may also need to check macOS System Settings → Privacy & Security → Microphone to ensure Cursor has permission.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Lesson Recorder */}
          <div>
            <LessonRecorder
              onTranscriptComplete={handleTranscriptComplete}
              onError={handleError}
              selectedStudent={selectedStudent}
              onRecordingStateChange={(recording) => setIsRecording(recording)}
              onAudioLevelChange={(level) => setAudioLevel(level)}
              recordingTriggerRef={recordingTriggerRef}
              stopRecordingRef={stopRecordingRef}
            />
          </div>

          {/* Student Profile */}
          <div>
            <StudentProfile
              student={selectedStudent}
              onClose={() => {
                setSelectedStudent(null);
                setShowUpdateForm(false);
              }}
              onStartRecording={() => {
                if (recordingTriggerRef.current) {
                  recordingTriggerRef.current();
                }
              }}
              onStopRecording={() => {
                if (stopRecordingRef.current) {
                  stopRecordingRef.current();
                }
              }}
              isRecording={isRecording}
              isProcessing={isProcessing}
              audioLevel={audioLevel}
              onSendUpdate={() => {
                if (selectedStudent) {
                  setLastProcessedStudent(selectedStudent);
                  setShowUpdateForm(true);
                }
              }}
              onUpdateStudent={(updatedStudent) => {
                setSelectedStudent(updatedStudent);
                setDashboardRefreshTrigger(prev => prev + 1);
              }}
            />
          </div>
        </div>

        {/* Student Dashboard */}
        <div>
          <StudentDashboard
            onStudentSelect={setSelectedStudent}
            selectedStudentId={selectedStudent?.id || null}
            refreshTrigger={dashboardRefreshTrigger}
          />
        </div>

        {/* Lesson Update Form */}
        {showUpdateForm && lastProcessedStudent && (
          <div className="mt-6">
            <LessonUpdateForm
              student={lastProcessedStudent}
              onClose={() => setShowUpdateForm(false)}
            />
          </div>
        )}

        {/* Transcript Display (for debugging) */}
        {transcript && (
          <div className="mt-6 bg-slate-900/80 border border-slate-700/60 rounded-xl p-4">
            <h3 className="text-slate-200 font-semibold mb-2 text-sm tracking-wide">Transcript</h3>
            <p className="text-slate-400 text-sm whitespace-pre-wrap">{transcript}</p>
          </div>
        )}
      </main>

      {/* AI Assistant */}
      <AIAssistant
        students={students}
        onRefreshStudents={handleRefreshStudents}
        onSelectStudent={setSelectedStudent}
      />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-700/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500 text-sm">
            <p>Rhinebeck Tennis Club • Rhinebeck, NY</p>
            <p className="mt-2">
              <a href="mailto:difaziotennis@gmail.com" className="text-slate-400 hover:text-[#C9A227] hover:underline transition-colors">
                difaziotennis@gmail.com
              </a>
              {" • "}
              <a href="tel:6319015220" className="text-slate-400 hover:text-[#C9A227] hover:underline transition-colors">
                631-901-5220
              </a>
            </p>
            <p className="mt-2">© {new Date().getFullYear()} DiFazio Tennis</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
