
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const sendOtpEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    
    if (error) {
      throw error;
    }
    
    toast({
      title: "Code sent",
      description: `Check your email (${email}) for your login code`,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Authentication error:", error);
    
    toast({
      variant: "destructive",
      title: "Failed to send code",
      description: "Please try again later",
    });
    
    return { 
      success: false, 
      error: "Failed to send verification code. Please try again."
    };
  }
};

export const verifyOtpCode = async (email: string, otp: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });
    
    if (error) {
      throw error;
    }
    
    toast({
      title: "Authentication successful",
      description: "You have successfully logged in",
    });
    
    return { success: true };
  } catch (error) {
    console.error("Verification error:", error);
    
    toast({
      variant: "destructive",
      title: "Verification failed",
      description: "Invalid or expired code",
    });
    
    return { 
      success: false, 
      error: "Invalid or expired code. Please try again."
    };
  }
};
