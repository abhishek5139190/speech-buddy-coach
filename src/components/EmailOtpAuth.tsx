
import React, { useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import EmailForm from '@/components/auth/EmailForm';
import OtpVerificationForm from '@/components/auth/OtpVerificationForm';
import { sendOtpEmail, verifyOtpCode } from '@/components/auth/otp-auth-utils';

interface EmailOtpAuthProps {
  onAuthenticated: () => void;
}

const EmailOtpAuth: React.FC<EmailOtpAuthProps> = ({ onAuthenticated }) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (emailAddress: string) => {
    setIsLoading(true);
    setError(null);
    
    const result = await sendOtpEmail(emailAddress);
    
    if (result.success) {
      setEmail(emailAddress);
      setStep('otp');
    } else {
      setError(result.error || "Failed to send verification code");
    }
    
    setIsLoading(false);
  };

  const handleVerifyOtp = async (otp: string) => {
    setIsLoading(true);
    setError(null);
    
    const result = await verifyOtpCode(email, otp);
    
    if (result.success) {
      // Ensure session persistence by storing in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userName', email.split('@')[0] || 'User');
      onAuthenticated();
    } else {
      setError(result.error || "Failed to verify code");
    }
    
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);
    
    const result = await sendOtpEmail(email);
    
    if (!result.success) {
      setError(result.error || "Failed to resend verification code");
    }
    
    setIsLoading(false);
  };

  const handleBackToEmail = () => {
    setStep('email');
    setError(null);
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
        <EmailForm 
          onSubmit={handleSendOtp} 
          isLoading={isLoading} 
        />
      ) : (
        <OtpVerificationForm 
          onSubmit={handleVerifyOtp}
          onResendCode={handleResendOtp}
          onBackToEmail={handleBackToEmail}
          isLoading={isLoading}
          email={email}
        />
      )}
    </div>
  );
};

export default EmailOtpAuth;
