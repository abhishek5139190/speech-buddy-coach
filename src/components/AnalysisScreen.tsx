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
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoId, setVideoId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // Get the recording URL from localStorage
    const recordingUrl = localStorage.getItem('recordingUrl');
    
    if (recordingUrl && videoRef.current) {
      videoRef.current.src = recordingUrl;
      setVideoUrl(recordingUrl);
      
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
          setVideoId(data.id);
          if (data.transcript) {
            setTranscript(data.transcript);
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
    if (!transcript && videoId) {
      const pollInterval = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('video_analysis')
            .select('transcript')
            .eq('id', videoId)
            .single();
            
          if (error) {
            console.error("Error polling for transcript:", error);
          } else if (data && data.transcript) {
            setTranscript(data.transcript);
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
  }, [transcript, videoId]);
  
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
    
    // If we already have a transcript, use it
    if (transcript) {
      generateFeedback(transcript);
      return;
    }
    
    // Otherwise, generate a mock transcript
    setTimeout(() => {
      // Mock transcript
      const mockTranscript = 
        "Hello, my name is... um... John and I'm here to talk about our new product. It's really, you know, amazing and has tons of features that I think... uh... you'll really like. So, basically what it does is... it helps you communicate better by analyzing your speech patterns and giving feedback.";
      
      setTranscript(mockTranscript);
      generateFeedback(mockTranscript);
    }, 3000);
  };
  
  const generateFeedback = (transcriptText: string) => {
    // Mock feedback generation based on transcript
    const mockFeedback = [
      {
        category: "Filler Words",
        positive: false,
        text: "Used 'um' and 'uh' 3 times. Try to eliminate these filler words for clearer delivery."
      },
      {
        category: "Pace",
        positive: true,
        text: "Good speaking pace at 145 words per minute, which is in the ideal range for comprehension."
      },
      {
        category: "Pauses",
        positive: false,
        text: "Several unintentional pauses detected. Practice using deliberate pauses to emphasize key points."
      },
      {
        category: "Grammar",
        positive: true,
        text: "No significant grammar issues detected."
      },
      {
        category: "Body Language",
        positive: false,
        text: "Limited eye contact with camera. Try to look directly at the camera more consistently."
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
        <p>AI analysis includes grammar, filler words, pace, pauses, body language, and more</p>
      </div>
    </div>
  );
};

export default AnalysisScreen;
