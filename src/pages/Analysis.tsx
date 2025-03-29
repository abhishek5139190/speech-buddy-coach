
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import AnalysisScreen from '@/components/AnalysisScreen';
import { toast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Analysis: React.FC = () => {
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

  const handleBack = () => {
    navigate(-1); // This navigates back to the previous page in history
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar 
        isAuthenticated={true} 
        onLogout={handleLogout}
        userName={localStorage.getItem('userName') || ''}
      />
      
      <main className="flex-1 flex flex-col items-center p-4 md:p-6">
        <div className="w-full max-w-4xl mb-6 md:mb-8">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack} 
              className="mr-2"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-brand-blue">Analysis Results</h1>
          </div>
          <p className="text-center text-muted-foreground mt-2 text-sm md:text-base">
            Review your communication analysis and feedback
          </p>
        </div>
        
        <AnalysisScreen />
      </main>
    </div>
  );
};

export default Analysis;
