"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface LessonRecorderProps {
  onTranscriptComplete: (transcript: string) => void;
  onError: (error: string) => void;
  selectedStudent?: { name: string; summary_data?: any } | null;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onAudioLevelChange?: (level: number) => void;
  recordingTriggerRef?: React.MutableRefObject<(() => void) | null>;
  stopRecordingRef?: React.MutableRefObject<(() => void) | null>;
}

export function LessonRecorder({ onTranscriptComplete, onError, selectedStudent, onRecordingStateChange, onAudioLevelChange, recordingTriggerRef, stopRecordingRef }: LessonRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionError, setPermissionError] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const level = average / 255;
      setAudioLevel(level);
      onAudioLevelChange?.(level);
      
      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      // Set up audio visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      onRecordingStateChange?.(true);
      visualizeAudio();
    } catch (error) {
      console.error('Error starting recording:', error);
      let errorMessage = 'Failed to access microphone. ';
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage += 'Microphone permission was denied. Please allow microphone access in your browser settings and try again.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage += 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage += 'Microphone is already in use by another application. Please close other apps using the microphone and try again.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage += 'Microphone does not support the required settings. Please try a different microphone.';
        } else {
          errorMessage += `Error: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your browser settings and microphone permissions.';
      }
      
      setPermissionError(errorMessage.toLowerCase().includes('permission'));
      onError(errorMessage);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      setPermissionError(false);
      // Try to get permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // If successful, stop the stream immediately (we just wanted permission)
      stream.getTracks().forEach(track => track.stop());
      // Clear any error state
      setPermissionError(false);
      onError(''); // Clear error message
      // Show success message briefly
      onError('Microphone permission granted! You can now start recording.');
      setTimeout(() => onError(''), 3000);
    } catch (error) {
      console.error('Permission request error:', error);
      let errorMessage = 'Failed to access microphone. ';
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage += 'Microphone permission was denied. Please allow microphone access in your browser settings and try again.';
        } else {
          errorMessage += `Error: ${error.message}`;
        }
      } else {
        errorMessage += 'Please check your browser settings and microphone permissions.';
      }
      
      setPermissionError(true);
      onError(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecordingStateChange?.(false);
      setAudioLevel(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  // Expose startRecording and stopRecording functions via refs
  useEffect(() => {
    if (recordingTriggerRef) {
      recordingTriggerRef.current = () => {
        startRecording();
      };
    }
    if (stopRecordingRef) {
      stopRecordingRef.current = () => {
        stopRecording();
      };
    }
  });

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'lesson-recording.webm');

      const response = await fetch('/api/lesson/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Transcription failed');
      }

      const data = await response.json();
      onTranscriptComplete(data.transcript);
    } catch (error) {
      console.error('Transcription error:', error);
      onError(error instanceof Error ? error.message : 'Transcription failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Hide recorder if student is selected (recording button will be in profile)
  if (selectedStudent) {
    return null;
  }

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6 shadow-xl shadow-black/20">
      <div className="mb-4">
        <h3 className="font-display text-slate-100 font-semibold text-lg mb-2 tracking-tight">
          Lesson Recorder
        </h3>
        <div className="text-slate-400 text-sm">
          New lesson — student will be identified from recording
        </div>
      </div>

      {/* Audio Visualizer */}
      <div className="mb-6 h-20 flex items-end justify-center gap-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#C9A227]/80 rounded-t-sm transition-all duration-75"
            style={{
              width: '6px',
              height: `${Math.max(4, (audioLevel * 100) * (0.5 + Math.random() * 0.5))}%`,
              opacity: isRecording ? 1 : 0.25,
            }}
          />
        ))}
      </div>

      {/* Record Button */}
      <div className="flex flex-col items-center gap-3">
        {!isRecording && !isProcessing && (
          <>
            <button
              type="button"
              onClick={startRecording}
              className="bg-[#C9A227] hover:bg-[#A68B2C] text-slate-950 font-semibold py-3.5 px-7 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center gap-2.5 shadow-lg shadow-[#C9A227]/20"
            >
              <Mic className="w-5 h-5" />
              Start New Recording
            </button>
            {permissionError && (
              <div className="w-full max-w-md space-y-3">
                <button
                  type="button"
                  onClick={requestMicrophonePermission}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-lg border border-slate-600 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Request Microphone Permission
                </button>
                <div className="text-xs text-slate-400 text-center space-y-1">
                  <p>If the prompt doesn't appear, try:</p>
                  <p className="text-[#C9A227]">1. Check Cursor menu → Settings → Privacy</p>
                  <p className="text-[#C9A227]">2. Or check macOS System Settings → Privacy & Security → Microphone</p>
                </div>
              </div>
            )}
          </>
        )}

        {isRecording && (
          <button
            type="button"
            onClick={stopRecording}
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3.5 px-7 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center gap-2.5 shadow-lg shadow-rose-500/20 animate-pulse"
          >
            <Square className="w-5 h-5 fill-white" />
            Stop Recording
          </button>
        )}

        {isProcessing && (
          <div className="bg-slate-800/80 border border-slate-600/60 text-slate-300 font-medium py-3.5 px-7 rounded-xl flex items-center gap-2.5">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing…
          </div>
        )}
      </div>

      {isRecording && (
        <p className="text-slate-400 text-sm text-center mt-4">
          Recording new lesson…
        </p>
      )}
    </div>
  );
}
