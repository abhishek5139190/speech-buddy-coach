
import React from 'react';
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const otpSchema = z.object({
  otp: z.string().min(6, { message: "Please enter all digits" }),
});

interface OtpVerificationFormProps {
  onSubmit: (otp: string) => Promise<void>;
  onResendCode: () => Promise<void>;
  onBackToEmail: () => void;
  isLoading: boolean;
  email: string;
}

const OtpVerificationForm: React.FC<OtpVerificationFormProps> = ({
  onSubmit,
  onResendCode,
  onBackToEmail,
  isLoading,
  email
}) => {
  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof otpSchema>) => {
    await onSubmit(values.otp);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <InputOTP 
                  maxLength={6}
                  value={field.value} 
                  onChange={field.onChange}
                  render={({ slots }) => (
                    <InputOTPGroup className="gap-2 justify-center">
                      {slots.map((slot, index) => (
                        <InputOTPSlot 
                          key={index} 
                          {...slot} 
                          index={index} 
                          className="h-12 w-12 text-center text-lg" 
                        />
                      ))}
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
          <div className="flex justify-between gap-2 mt-2">
            <Button 
              variant="ghost" 
              type="button" 
              onClick={onBackToEmail}
              disabled={isLoading}
              className="flex-1"
            >
              Back to Email
            </Button>
            <Button 
              variant="outline" 
              type="button" 
              onClick={onResendCode}
              disabled={isLoading}
              className="flex-1"
            >
              Resend Code
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Didn't receive a code? Check your spam folder or try again.
          </p>
        </div>
      </form>
    </Form>
  );
};

export default OtpVerificationForm;
