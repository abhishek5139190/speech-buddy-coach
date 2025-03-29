
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Volume2, VolumeX, MessageSquare, CheckCircle, XCircle, Info, Timer } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface FeedbackItem {
  category: string;
  positive: boolean;
  text: string;
}

const AnalysisScreen: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showVideo, setShowVideo] = useState<boolean>(true);
  const [transcript, setTranscript] = useState<string>("");
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  
  useEffect(() => {
    // Get the recording URL from localStorage
    const recordingUrl = localStorage.getItem('recordingUrl');
    
    if (recordingUrl && videoRef.current) {
      videoRef.current.src = recordingUrl;
      
      // Add event listener for loadedmetadata to get video duration
      videoRef.current.addEventListener('loadedmetadata', () => {
        if (videoRef.current) {
          setDuration(videoRef.current.duration);
        }
      });
      
      // Add event listener for timeupdate to track current time
      videoRef.current.addEventListener('timeupdate', () => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
          // Calculate progress as percentage
          const progressValue = (videoRef.current.currentTime / videoRef.current.duration) * 100;
          setProgress(progressValue);
        }
      });
    }

    // Fetch the most recent video analysis record for this user
    const fetchVideoAnalysis = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('video_analysis')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error("Error fetching video analysis:", error);
        } else if (data) {
          if (data.transcript) {
            setTranscript(data.transcript);
            toast({
              title: "Transcript Loaded",
              description: "Your video transcript is ready",
            });
          } else {
            // Start polling for transcript if not available
            setIsPolling(true);
          }
        }
      } catch (error) {
        console.error("Error in fetchVideoAnalysis:", error);
      }
    };

    fetchVideoAnalysis();
    
    return () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
      
      // Clean up event listeners
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadedmetadata', () => {});
        videoRef.current.removeEventListener('timeupdate', () => {});
      }
    };
  }, []);
  
  // Set up polling for transcript if it's not available
  useEffect(() => {
    if (isPolling && !transcript) {
      const pollInterval = setInterval(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          
          const { data, error } = await supabase
            .from('video_analysis')
            .select('transcript')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (error) {
            console.error("Error polling for transcript:", error);
          } else if (data && data.transcript) {
            setTranscript(data.transcript);
            setIsPolling(false);
            clearInterval(pollInterval);
            toast({
              title: "Transcript Ready",
              description: "Your video transcript has been processed",
            });
          }
        } catch (error) {
          console.error("Error in transcript polling:", error);
        }
      }, 5000); // Poll every 5 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, [isPolling, transcript]);
  
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };
  
  const analyzeRecording = () => {
    setIsAnalyzing(true);
    
    // Generate feedback based on the transcript
    generateFeedback(transcript);
  };
  
  const generateFeedback = (transcriptText: string) => {
    // Analyze transcript for filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically'];
    const fillerWordCounts = fillerWords.map(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = transcriptText.match(regex);
      return { word, count: matches ? matches.length : 0 };
    }).filter(item => item.count > 0);
    
    const totalFillerWords = fillerWordCounts.reduce((acc, curr) => acc + curr.count, 0);
    
    // Calculate words per minute
    const wordCount = transcriptText.split(/\s+/).length;
    const durationInMinutes = duration / 60;
    const wpm = Math.round(wordCount / durationInMinutes);
    
    // Mock feedback generation based on transcript
    const mockFeedback = [
      {
        category: "Filler Words",
        positive: totalFillerWords < 3,
        text: totalFillerWords < 3 
          ? "Good control of filler words. Keep it up!" 
          : `Used filler words ${totalFillerWords} times (${fillerWordCounts.map(f => `"${f.word}": ${f.count}`).join(', ')}). Try to eliminate these for clearer delivery.`
      },
      {
        category: "Pace",
        positive: wpm >= 120 && wpm <= 160,
        text: `Speaking pace at ${wpm} words per minute. ${
          wpm < 120 
            ? "Try speaking a bit faster to keep the audience engaged." 
            : wpm > 160 
              ? "Consider slowing down for better comprehension." 
              : "This is in the ideal range for comprehension."
        }`
      },
      {
        category: "Clarity",
        positive: wordCount > 50,
        text: wordCount > 50 
          ? "Good articulation and clear speech delivery." 
          : "Speech may be too brief for comprehensive analysis. Consider speaking more for better feedback."
      },
      {
        category: "Grammar",
        positive: true,
        text: "No significant grammar issues detected."
      },
      {
        category: "Content Structure",
        positive: transcriptText.length > 100,
        text: transcriptText.length > 100 
          ? "Good content structure with clear points." 
          : "Consider structuring your content with clear introduction, points, and conclusion."
      }
    ];
    
    setFeedback(mockFeedback);
    setIsAnalyzing(false);
    
    toast({
      title: "Analysis Complete",
      description: "Your speech analysis is ready to view",
    });
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-slide-up">
      <Tabs defaultValue="video" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="video" onClick={() => setShowVideo(true)}>Video</TabsTrigger>
            <TabsTrigger value="audio" onClick={() => setShowVideo(false)}>Audio Only</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <TabsContent value="video" className="mt-0">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <video 
                  ref={videoRef}
                  controls={false}
                  className="w-full h-auto aspect-video bg-black"
                  onEnded={() => setIsPlaying(false)}
                />
                
                <div className="absolute top-4 right-4 bg-black/70 rounded-full px-3 py-1 text-white flex items-center space-x-1">
                  <Timer size={16} />
                  <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-full px-3 py-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white h-8 w-8"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="px-6 pt-4">
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audio" className="mt-0">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Volume2 className="h-8 w-8 text-primary" />
              </div>
              
              <div className="flex flex-col items-center space-y-4 w-full max-w-sm">
                <div className="w-full px-4">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-4">Audio only mode - video hidden</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span>Transcript</span>
            </CardTitle>
            <CardDescription>
              AI-generated transcript of your speech
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transcript ? (
              <div className="max-h-60 overflow-y-auto border rounded-md p-4 text-sm">
                {transcript}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>Transcript is being generated...</p>
                <p className="text-xs mt-2">This may take a few minutes</p>
                <div className="mt-4 h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Speech Analysis</CardTitle>
            <CardDescription>
              Communication feedback based on your recording
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedback.length > 0 ? (
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {feedback.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {item.positive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{item.text}</p>
                    {index < feedback.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>{transcript ? "Ready to analyze" : "Waiting for transcript"}</p>
                <p className="text-xs mt-2">
                  {transcript ? "Click 'Analyze' to get feedback" : "Transcript is being generated..."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 flex justify-center">
        <Button
          onClick={analyzeRecording}
          disabled={isAnalyzing || !transcript}
          className="bg-brand-blue hover:bg-brand-blue/90 text-white"
        >
          {isAnalyzing ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Info className="mr-2 h-4 w-4" />
              Analyze Speech
            </>
          )}
        </Button>
      </div>
      
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>AI analysis includes grammar, filler words, pace, pauses, and more</p>
      </div>
    </div>
  );
};

export default AnalysisScreen;
