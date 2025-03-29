
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import AnalysisScreen from '@/components/AnalysisScreen';
import { toast } from "@/components/ui/use-toast";

const Analysis: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to access this page",
      });
      navigate('/');
      return;
    }
    
    // Check if there's a recording to analyze
    const recordingUrl = localStorage.getItem('recordingUrl');
    
    if (!recordingUrl) {
      toast({
        variant: "destructive",
        title: "No recording found",
        description: "Please record or upload media first",
      });
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar 
        isAuthenticated={true} 
        onLogout={handleLogout}
        userName={localStorage.getItem('userName') || ''}
      />
      
      <main className="flex-1 flex flex-col items-center p-6">
        <div className="w-full max-w-4xl mb-8">
          <h1 className="text-2xl font-bold text-brand-blue text-center">Speech Analysis</h1>
          <p className="text-center text-muted-foreground mt-2">
            Review your recording and receive AI-powered communication feedback
          </p>
        </div>
        
        <AnalysisScreen />
      </main>
    </div>
  );
};

export default Analysis;
