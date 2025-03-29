
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import RecordingScreen from '@/components/RecordingScreen';
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

const Record: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            variant: "destructive",
            title: "Authentication required",
            description: "Please sign in to access this page",
          });
          navigate('/');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Authentication error:", error);
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "There was a problem verifying your login status",
        });
        navigate('/');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userName');
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout error",
        description: "There was a problem signing you out",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-t-brand-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar 
        isAuthenticated={true} 
        onLogout={handleLogout}
        userName={localStorage.getItem('userName') || ''}
      />
      
      <main className="flex-1 flex flex-col items-center p-6">
        <div className="w-full max-w-4xl mb-8">
          <h1 className="text-2xl font-bold text-brand-blue text-center">Record Your Speech</h1>
          <p className="text-center text-muted-foreground mt-2">
            Create a short video to receive AI communication feedback
          </p>
        </div>
        
        <RecordingScreen />
      </main>
    </div>
  );
};

export default Record;
