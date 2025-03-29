
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, userId } = await req.json();
    
    if (!videoUrl) {
      throw new Error("Video URL is required");
    }
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log(`Processing transcription for video: ${videoUrl}`);
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch the video content
    console.log("Fetching video content...");
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
    }
    
    // Get video as blob
    const videoBlob = await videoResponse.blob();
    
    // Use Eleven Labs API to transcribe
    console.log("Sending to Eleven Labs for transcription...");
    const formData = new FormData();
    formData.append("audio", videoBlob, "video.webm");
    
    const elevenLabsResponse = await fetch("https://api.elevenlabs.io/v1/audio/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": Deno.env.get("ELEVEN_LABS_API_KEY") as string,
      },
      body: formData,
    });
    
    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error("Eleven Labs API error:", errorText);
      throw new Error(`Eleven Labs API error: ${elevenLabsResponse.statusText}`);
    }
    
    const transcriptionResult = await elevenLabsResponse.json();
    const transcript = transcriptionResult.text || "No transcript available";
    
    console.log("Transcript received:", transcript);
    
    // Update the video_analysis record with the transcript
    const { error } = await supabase
      .from('video_analysis')
      .update({ transcript })
      .eq('video_path', videoUrl)
      .eq('user_id', userId);
    
    if (error) {
      console.error("Error updating transcript:", error);
      throw new Error(`Failed to update transcript: ${error.message}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, transcript }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in transcribe-video function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
