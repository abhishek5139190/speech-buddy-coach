
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
    console.log("Transcribe video function called");
    
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      throw new Error("Invalid request body format");
    }
    
    const { videoData, userId } = requestBody;
    
    if (!videoData) {
      throw new Error("Video data is required");
    }
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log(`Processing transcription for user: ${userId}`);
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Convert base64 to binary
    const binary = Uint8Array.from(atob(videoData), c => c.charCodeAt(0));
    const videoBlob = new Blob([binary], { type: 'audio/webm' });
    
    console.log(`Video blob size: ${videoBlob.size} bytes`);
    
    if (videoBlob.size === 0) {
      throw new Error("Video content is empty");
    }
    
    // Use Eleven Labs API to transcribe
    console.log("Sending to Eleven Labs for transcription...");
    const formData = new FormData();
    
    // Add required model_id parameter - using the correct model ID
    formData.append("model_id", "scribe_v1");
    formData.append("file", videoBlob, "recording.webm");
    
    const elevenLabsApiKey = Deno.env.get("ELEVEN_LABS_API_KEY") as string;
    if (!elevenLabsApiKey) {
      throw new Error("ELEVEN_LABS_API_KEY is not set");
    }
    
    console.log("Making request to Eleven Labs API with correct parameters...");
    const elevenLabsResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsApiKey,
      },
      body: formData,
    });
    
    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error("Eleven Labs API error:", errorText);
      throw new Error(`Eleven Labs API error: ${elevenLabsResponse.statusText}`);
    }
    
    const transcriptionResult = await elevenLabsResponse.json();
    console.log("Transcription result received:", transcriptionResult);
    
    const transcript = transcriptionResult.text || "No transcript available";
    
    console.log("Transcript received:", transcript);
    
    // Update the video_analysis record with the transcript
    const { error } = await supabase
      .from('video_analysis')
      .update({ transcript })
      .eq('user_id', userId)
      .is('video_path', 'local')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error("Error updating transcript:", error);
      throw new Error(`Failed to update transcript: ${error.message}`);
    }
    
    console.log("Transcription successfully saved to database");
    
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
