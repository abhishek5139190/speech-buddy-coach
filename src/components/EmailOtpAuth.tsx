import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface EmailOtpAuthProps {
  onAuthenticated: () => void;
}

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const otpSchema = z.object({
  otp: z.string().min(6, { message: "Please enter all digits" }),
});

const EmailOtpAuth: React.FC<EmailOtpAuthProps> = ({ onAuthenticated }) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const handleSendOtp = async (values: z.infer<typeof emailSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          shouldCreateUser: true,
        },
      });
      
      if (error) {
        throw error;
      }
      
      setEmail(values.email);
      setStep('otp');
      toast({
        title: "Code sent",
        description: `Check your email (${values.email}) for your login code`,
      });
    } catch (error) {
      console.error("Authentication error:", error);
      setError("Failed to send verification code. Please try again.");
      toast({
        variant: "destructive",
        title: "Failed to send code",
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (values: z.infer<typeof otpSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: values.otp,
        type: 'email',
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Authentication successful",
        description: "You have successfully logged in",
      });
      
      onAuthenticated();
    } catch (error) {
      console.error("Verification error:", error);
      setError("Invalid or expired code. Please try again.");
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "Invalid or expired code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {step === 'email' ? (
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-4">
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email" 
                      placeholder="Enter your email" 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit"
              className="w-full h-11 md:h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Send Login Code"
              )}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <InputOTP 
                      maxLength={6} 
                      {...field} 
                      render={({ slots }) => (
                        <InputOTPGroup className="gap-2 justify-center">
                          {slots && Array.isArray(slots) ? slots.map((slot, index) => (
                            <InputOTPSlot key={index} {...slot} index={index} className="h-12 w-12 text-center text-lg" />
                          )) : null}
                        </InputOTPGroup>
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="w-full h-11 md:h-12"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Verify Code"
                )}
              </Button>
              <Button 
                variant="ghost" 
                type="button" 
                onClick={() => {
                  setStep('email');
                  otpForm.reset();
                }}
                disabled={isLoading}
              >
                Back to Email
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Didn't receive a code? Check your spam folder or try again.
              </p>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default EmailOtpAuth;
