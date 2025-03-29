
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Play, Pause, Volume2, VolumeX, MessageSquare, CheckCircle, XCircle, Info } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // Get the recording URL from localStorage
    const recordingUrl = localStorage.getItem('recordingUrl');
    
    if (recordingUrl && videoRef.current) {
      videoRef.current.src = recordingUrl;
    }
    
    return () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, []);
  
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
    
    // Simulate API call to transcript and analysis services
    setTimeout(() => {
      // Mock transcript
      setTranscript(
        "Hello, my name is... um... John and I'm here to talk about our new product. It's really, you know, amazing and has tons of features that I think... uh... you'll really like. So, basically what it does is... it helps you communicate better by analyzing your speech patterns and giving feedback."
      );
      
      // Mock feedback
      setFeedback([
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
      ]);
      
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: "Your speech analysis is ready to view",
      });
    }, 3000);
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audio" className="mt-0">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Volume2 className="h-8 w-8 text-primary" />
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
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
                <p>No transcript generated yet</p>
                <p className="text-xs mt-2">Click 'Analyze' to generate a transcript</p>
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
                <p>No analysis available yet</p>
                <p className="text-xs mt-2">Click 'Analyze' to get feedback</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 flex justify-center">
        <Button
          onClick={analyzeRecording}
          disabled={isAnalyzing}
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
