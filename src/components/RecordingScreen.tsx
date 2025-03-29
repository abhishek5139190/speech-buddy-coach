
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Pause, Play, RefreshCw, Timer, Square } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { Progress } from "@/components/ui/progress";

const MAX_RECORDING_TIME = 150; // 150 seconds recording limit

const RecordingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [permission, setPermission] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'inactive' | 'recording' | 'paused'>('inactive');
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(MAX_RECORDING_TIME);
  const [progress, setProgress] = useState<number>(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    getMicrophoneAndCameraPermission();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  useEffect(() => {
    let timerId: number;
    
    if (recordingStatus === 'recording' && timeLeft > 0) {
      timerId = window.setInterval(() => {
        setTimeLeft(prev => {
          const newTimeLeft = prev - 1;
          // Update progress as percentage of time elapsed
          setProgress(((MAX_RECORDING_TIME - newTimeLeft) / MAX_RECORDING_TIME) * 100);
          return newTimeLeft;
        });
      }, 1000);
    }
    
    if (timeLeft === 0 && recordingStatus === 'recording') {
      stopRecording();
      toast({
        title: "Time's up!",
        description: `Your ${MAX_RECORDING_TIME}-second recording is complete.`,
      });
    }
    
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [recordingStatus, timeLeft]);
  
  const getMicrophoneAndCameraPermission = async () => {
    try {
      const streamData = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      
      setPermission(true);
      setStream(streamData);
      
      if (videoRef.current) {
        videoRef.current.srcObject = streamData;
      }
    } catch (err) {
      console.error("Error accessing media devices:", err);
      toast({
        variant: "destructive",
        title: "Permission Error",
        description: "Please allow access to camera and microphone to continue",
      });
    }
  };
  
  const startRecording = () => {
    if (!stream) return;
    
    setRecordingStatus('recording');
    setTimeLeft(MAX_RECORDING_TIME);
    setProgress(0);
    setAudioChunks([]);
    
    const media = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorder.current = media;
    
    mediaRecorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setAudioChunks(prev => [...prev, event.data]);
      }
    };
    
    mediaRecorder.current.start(200);
  };
  
  const pauseRecording = () => {
    if (mediaRecorder.current && recordingStatus === 'recording') {
      mediaRecorder.current.pause();
      setRecordingStatus('paused');
    } else if (mediaRecorder.current && recordingStatus === 'paused') {
      mediaRecorder.current.resume();
      setRecordingStatus('recording');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecordingStatus('inactive');
    }
  };
  
  const resetRecording = () => {
    setAudioChunks([]);
    setTimeLeft(MAX_RECORDING_TIME);
    setProgress(0);
    setRecordingStatus('inactive');
  };
  
  const processRecording = () => {
    if (audioChunks.length === 0) {
      toast({
        variant: "destructive",
        title: "No recording found",
        description: "Please record something first",
      });
      return;
    }
    
    const audioBlob = new Blob(audioChunks, { type: 'video/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // In a real app, you'd upload or process the blob here
    localStorage.setItem('recordingUrl', audioUrl);
    
    toast({
      title: "Processing recording",
      description: "Your recording is being processed...",
    });
    
    navigate('/analysis');
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto p-4 animate-slide-up">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <video 
              ref={videoRef}
              autoPlay 
              muted 
              playsInline
              className="w-full h-auto aspect-video bg-black"
            />
            
            <div className="absolute top-4 right-4 bg-black/70 rounded-full px-3 py-1 text-white flex items-center space-x-1">
              <Timer size={16} />
              <span>{formatTime(timeLeft)}</span>
            </div>
            
            {recordingStatus === 'recording' && (
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-sm text-white bg-black/70 px-2 py-1 rounded-full">Recording</span>
              </div>
            )}
          </div>
          
          {/* Progress bar for recording */}
          {(recordingStatus === 'recording' || recordingStatus === 'paused') && (
            <div className="px-6 pt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground mt-1">
                {formatTime(timeLeft)} remaining
              </p>
            </div>
          )}
          
          <div className="p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-center space-x-4">
              {recordingStatus === 'inactive' && !audioChunks.length && (
                <Button
                  onClick={startRecording}
                  disabled={!permission}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white"
                >
                  <Mic className="mr-2 h-5 w-5" />
                  Start Recording
                </Button>
              )}
              
              {(recordingStatus === 'recording' || recordingStatus === 'paused') && (
                <>
                  <Button
                    onClick={pauseRecording}
                    variant="outline"
                    className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
                  >
                    {recordingStatus === 'paused' ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {recordingStatus === 'inactive' && audioChunks.length > 0 && (
              <div className="flex justify-center space-x-4 mt-4">
                <Button
                  onClick={resetRecording}
                  variant="outline"
                  className="space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Redo</span>
                </Button>
                
                <Button
                  onClick={processRecording}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white space-x-2"
                >
                  <span>Process</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Record up to {MAX_RECORDING_TIME / 60} minutes of video for analysis</p>
        <p className="mt-1">Ensure you are in a well-lit environment with clear audio</p>
      </div>
    </div>
  );
};

export default RecordingScreen;
