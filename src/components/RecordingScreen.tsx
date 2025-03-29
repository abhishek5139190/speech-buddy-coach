import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Pause, Play, RefreshCw, Timer, Square, AlertTriangle } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/integrations/supabase/client';

const MAX_RECORDING_TIME = 150; // 150 seconds recording limit
const MAX_ALLOWED_TIME = 150; // 2 minutes and 30 seconds = 150 seconds

interface RecordingScreenProps {
  isBucketReady?: boolean;
}

const RecordingScreen: React.FC<RecordingScreenProps> = ({ isBucketReady = false }) => {
  const navigate = useNavigate();
  const [permission, setPermission] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'inactive' | 'recording' | 'paused'>('inactive');
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(MAX_RECORDING_TIME);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
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

  useEffect(() => {
    if (isBucketReady && errorDetails && errorDetails.includes('bucket')) {
      setErrorDetails(null);
    }
  }, [isBucketReady, errorDetails]);
  
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
    
    setErrorDetails(null);
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
    setErrorDetails(null);
  };
  
  const checkVideoBucket = async (): Promise<boolean> => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error("Error listing buckets:", error);
        throw new Error(`Failed to list buckets: ${error.message}`);
      }
      
      const videoBucket = buckets?.find(bucket => bucket.name === 'videos');
      return !!videoBucket;
    } catch (error) {
      console.error("Error checking video bucket:", error);
      return false;
    }
  };
  
  const processRecording = async () => {
    if (audioChunks.length === 0) {
      toast({
        variant: "destructive",
        title: "No recording found",
        description: "Please record something first",
      });
      return;
    }
    
    setIsProcessing(true);
    setErrorDetails(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }
      
      const userId = session.user.id;
      
      const bucketExists = await checkVideoBucket();
      if (!bucketExists) {
        throw new Error("Video storage bucket ('videos') is not available. Please refresh the page and try again.");
      }
      
      const audioBlob = new Blob(audioChunks, { type: 'video/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      localStorage.setItem('recordingUrl', audioUrl);
      
      const filename = `${userId}/${Date.now()}.webm`;
      
      toast({
        title: "Uploading video",
        description: "Saving your recording to the cloud...",
      });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filename, audioBlob, {
          contentType: 'video/webm',
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      const { data: publicURLData } = supabase.storage
        .from('videos')
        .getPublicUrl(filename);
      
      const videoUrl = publicURLData.publicUrl;
      
      console.log("Video uploaded successfully, URL:", videoUrl);
      
      const { data: videoAnalysis, error: dbError } = await supabase
        .from('video_analysis')
        .insert({
          user_id: userId,
          video_path: videoUrl
        })
        .select()
        .single();
      
      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }
      
      console.log("Video analysis record created:", videoAnalysis);
      
      toast({
        title: "Processing transcription",
        description: "Your video is being processed for transcription...",
      });
      
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('transcribe-video', {
        body: { 
          videoUrl,
          userId
        }
      });
      
      if (transcriptionError) {
        console.error("Transcription error:", transcriptionError);
      } else {
        console.log("Transcription initiated:", transcriptionData);
      }
      
      toast({
        title: "Processing complete",
        description: "Your recording has been saved and transcription is in progress.",
      });
      
      navigate('/analysis');
    } catch (error) {
      console.error("Error processing recording:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setErrorDetails(errorMessage);
      toast({
        variant: "destructive",
        title: "Processing failed",
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto p-4 animate-slide-up">
      {!isBucketReady && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 flex items-start">
          <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Storage Setup in Progress</p>
            <p className="text-sm">The video storage system is being configured. You may need to refresh the page in a moment.</p>
          </div>
        </div>
      )}
      
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
          
          {(recordingStatus === 'recording' || recordingStatus === 'paused') && (
            <div className="px-6 pt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground mt-1">
                {formatTime(timeLeft)} remaining
              </p>
            </div>
          )}
          
          <div className="p-6 flex flex-col space-y-4">
            {errorDetails && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                <p className="font-medium">Error:</p>
                <p>{errorDetails}</p>
              </div>
            )}
            
            <div className="flex items-center justify-center space-x-4">
              {recordingStatus === 'inactive' && audioChunks.length === 0 && (
                <Button
                  onClick={startRecording}
                  disabled={!permission || !isBucketReady}
                  variant="default"
                  className="bg-brand-darkTeal hover:bg-brand-darkTeal/90 text-white"
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
                  disabled={isProcessing}
                >
                  <RefreshCw size={16} />
                  <span>Redo</span>
                </Button>
                
                <Button
                  onClick={processRecording}
                  className="bg-brand-darkTeal hover:bg-brand-darkTeal/90 text-white space-x-2"
                  disabled={isProcessing || !isBucketReady}
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Process</span>
                  )}
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
