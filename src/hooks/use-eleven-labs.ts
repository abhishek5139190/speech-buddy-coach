
import { useState } from 'react';
import { toast } from "@/components/ui/use-toast";

interface TranscriptionResult {
  language_code: string;
  language_probability: number;
  text: string;
  words: Array<{
    text: string;
    start: number;
    end: number;
    type: string;
  }>;
}

interface UseElevenLabsOptions {
  onTranscriptionStart?: () => void;
  onTranscriptionComplete?: (text: string) => void;
  onTranscriptionError?: (error: Error) => void;
}

export const useElevenLabs = (apiKey: string, options?: UseElevenLabsOptions) => {
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    if (!apiKey) {
      const error = new Error("Eleven Labs API key is required");
      setError(error);
      if (options?.onTranscriptionError) {
        options.onTranscriptionError(error);
      }
      throw error;
    }

    setIsTranscribing(true);
    setError(null);
    
    if (options?.onTranscriptionStart) {
      options.onTranscriptionStart();
    }

    try {
      const formData = new FormData();
      formData.append("model_id", "scribe_v1");
      formData.append("file", audioBlob, "recording.webm");
      
      console.log("Sending request to Eleven Labs API...");
      
      const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Eleven Labs API error:", errorText);
        throw new Error(`Eleven Labs API error: ${response.statusText} - ${errorText}`);
      }
      
      const result: TranscriptionResult = await response.json();
      console.log("Transcription result:", result);
      
      const transcriptText = result.text || "No transcript available";
      setTranscript(transcriptText);
      
      if (options?.onTranscriptionComplete) {
        options.onTranscriptionComplete(transcriptText);
      }
      
      return transcriptText;
    } catch (error) {
      console.error("Transcription error:", error);
      const typedError = error instanceof Error ? error : new Error(String(error));
      setError(typedError);
      
      if (options?.onTranscriptionError) {
        options.onTranscriptionError(typedError);
      }
      
      throw typedError;
    } finally {
      setIsTranscribing(false);
    }
  };

  return {
    transcribeAudio,
    isTranscribing,
    transcript,
    error,
  };
};
