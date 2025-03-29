
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
  defaultApiKey?: string;
}

const API_KEY_STORAGE_KEY = "eleven_labs_api_key";

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet, defaultApiKey }) => {
  const [apiKey, setApiKey] = useState<string>(defaultApiKey || localStorage.getItem(API_KEY_STORAGE_KEY) || "");
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please enter your Eleven Labs API key",
      });
      return;
    }

    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    onApiKeySet(apiKey);
    
    toast({
      title: "API Key Saved",
      description: "Your Eleven Labs API key has been saved",
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Input
            type={isVisible ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Eleven Labs API key"
            className="pr-24"
          />
          <Button 
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-2"
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? "Hide" : "Show"}
          </Button>
        </div>
        <Button
          type="button"
          onClick={handleSaveApiKey}
          className="whitespace-nowrap"
        >
          <Key className="mr-2 h-4 w-4" />
          Save Key
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Your API key is stored locally and never sent to our servers.
        <a 
          href="https://elevenlabs.io/speech-synthesis" 
          target="_blank" 
          rel="noopener noreferrer"
          className="ml-1 underline"
        >
          Get an API key
        </a>
      </p>
    </div>
  );
};

export default ApiKeyInput;
