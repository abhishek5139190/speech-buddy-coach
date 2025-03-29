
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import RecordingScreen from '@/components/RecordingScreen';
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

const Record: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // First check localStorage for immediate UI response
    const isAuthFromStorage = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!isAuthFromStorage) {
      // Then verify with Supabase for security
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          toast({
            variant: "destructive",
            title: "Authentication required",
            description: "Please sign in to access this page",
          });
          navigate('/');
        }
      });
    }
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
