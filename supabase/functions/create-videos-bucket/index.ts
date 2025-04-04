
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
    console.log("Create videos bucket function called");
    
    // Create Supabase client with service role key (has admin privileges)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing");
    }
    
    // Create Supabase client with admin privileges
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if the videos bucket exists
    console.log("Checking if videos bucket exists...");
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      throw new Error(`Failed to list storage buckets: ${bucketsError.message}`);
    }
    
    const videoBucket = buckets?.find(bucket => bucket.name === 'videos');
    if (videoBucket) {
      console.log("Videos bucket already exists, no need to create");
      
      // Even if bucket exists, make sure it's public
      try {
        const { error: updateError } = await supabase.storage.updateBucket('videos', {
          public: true,
          fileSizeLimit: 52428800 // 50MB limit
        });
        
        if (updateError) {
          console.error("Error updating existing bucket:", updateError);
        } else {
          console.log("Updated existing bucket to ensure it's public");
        }
      } catch (updateErr) {
        console.error("Failed to update existing bucket:", updateErr);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: "Videos bucket already exists", isBucketPublic: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create the videos bucket
    console.log("Creating videos bucket...");
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('videos', {
      public: true,
      fileSizeLimit: 52428800 // 50MB limit
    });
    
    if (createError) {
      console.error("Error creating videos bucket:", createError);
      throw new Error(`Failed to create videos bucket: ${createError.message}`);
    }
    
    console.log("Videos bucket created successfully");
    
    // Create public access policy for the videos bucket
    console.log("Setting up policies for the videos bucket...");
    
    // Attempt to make the bucket publicly accessible
    try {
      // Allow public access for read
      const { error: policyError } = await supabase.rpc('create_storage_policy', {
        bucket_name: 'videos',
        policy_name: 'Public Access',
        definition: 'true',
        operation: 'SELECT'
      });
      
      if (policyError) {
        console.error("Error setting public policy:", policyError);
      }
    } catch (policyErr) {
      console.error("Failed to create public policy:", policyErr);
      // Continue anyway, as this is not critical
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "Videos bucket created successfully", isBucketPublic: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-videos-bucket function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
