
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import EmailOtpAuth from './EmailOtpAuth';

interface AuthProps {
  onAuthenticated: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthenticated }) => {
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="w-full max-w-md mx-auto animate-fade-in shadow-md">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl md:text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>
          Sign in to access AI communication coaching
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <EmailOtpAuth onAuthenticated={onAuthenticated} />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center text-xs text-muted-foreground pt-0">
        <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
      </CardFooter>
    </Card>
  );
};

export default Auth;
