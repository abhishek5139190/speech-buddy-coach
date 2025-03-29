
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import RecordingScreen from '@/components/RecordingScreen';
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

const Record: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bucketCreated, setBucketCreated] = useState(false);
  const [detailedError, setDetailedError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication status and setup storage on mount
    const initialize = async () => {
      try {
        // Check authentication
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (!session) {
          setAuthError("Please sign in to access this page");
          toast({
            variant: "destructive",
            title: "Authentication required",
            description: "Please sign in to access this page",
          });
          navigate('/');
          return;
        }

        // Call the Edge Function to create the videos bucket if it doesn't exist
        console.log("Calling create-videos-bucket function...");
        const response = await supabase.functions.invoke('create-videos-bucket');
        
        if (response.error) {
          console.error("Error calling create-videos-bucket function:", response.error);
          
          // Show detailed error for debugging
          setDetailedError(`Error calling edge function: ${response.error.message || 'Unknown error'}`);
          
          // Check if we can still proceed (maybe the bucket exists already)
          const { data: buckets } = await supabase.storage.listBuckets();
          const videoBucket = buckets?.find(bucket => bucket.name === 'videos');
          
          if (videoBucket) {
            console.log("Found videos bucket despite edge function error");
            setBucketCreated(true);
            setIsLoading(false);
            return;
          }
          
          throw new Error(`Failed to configure video storage: ${response.error.message}`);
        }
        
        console.log("Edge function response:", response);
        
        if (response.data && response.data.success) {
          console.log("Videos bucket setup response:", response.data.message);
          setBucketCreated(true);
        } else {
          const errorMsg = response.data && response.data.error 
            ? response.data.error 
            : 'Unknown error configuring video storage';
          throw new Error(`Failed to configure video storage: ${errorMsg}`);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Initialization error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        setAuthError(errorMessage);
        toast({
          variant: "destructive",
          title: "Setup error",
          description: errorMessage,
        });
        
        // Don't navigate away on bucket errors, just show the error
        if (errorMessage.includes("Please sign in")) {
          navigate('/');
        } else {
          setIsLoading(false);
        }
      }
    };
    
    initialize();
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
      
      {(authError || detailedError) && (
        <div className="w-full max-w-3xl mx-auto mt-6 px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">Setup Error:</p>
            <p>{authError}</p>
            {detailedError && (
              <div className="mt-2 text-sm border-t border-red-200 pt-2">
                <p className="font-medium">Technical Details:</p>
                <p className="font-mono text-xs overflow-auto">{detailedError}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <main className="flex-1 flex flex-col items-center p-6">
        <div className="w-full max-w-4xl mb-8">
          <h1 className="text-2xl font-bold text-brand-blue text-center">Record Your Speech</h1>
          <p className="text-center text-muted-foreground mt-2">
            Create a short video to receive AI communication feedback
          </p>
        </div>
        
        <RecordingScreen isBucketReady={bucketCreated} />
      </main>
    </div>
  );
};

export default Record;
