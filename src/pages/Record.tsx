
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
        
        // Check if videos bucket exists in storage
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          console.error("Error fetching storage buckets:", bucketsError);
          throw new Error(`Storage error: ${bucketsError.message}`);
        }
        
        const videoBucket = buckets?.find(bucket => bucket.name === 'videos');
        
        if (!videoBucket) {
          console.log("Videos storage bucket does not exist, creating it now...");
          
          // Create the videos bucket
          const { error: createBucketError } = await supabase.storage.createBucket('videos', {
            public: true
          });
          
          if (createBucketError) {
            console.error("Error creating videos bucket:", createBucketError);
            throw new Error(`Failed to create storage bucket: ${createBucketError.message}`);
          }
          
          console.log("Videos bucket created successfully");
          setBucketCreated(true);
        } else {
          console.log("Videos bucket exists:", videoBucket.name);
          setBucketCreated(true);
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
      
      {authError && (
        <div className="w-full max-w-3xl mx-auto mt-6 px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">Setup Error:</p>
            <p>{authError}</p>
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
