// app/components/analysis/ChatInterface.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendIcon, Info, Bot, User } from 'lucide-react'; // Added Bot and User icons

// This is the structure ChatInterface uses internally for its state and props.
// It might need to be adapted from the detailed API response.
export interface ChatDisplayResume { // Renamed for clarity within ChatInterface
  id: string; // resume_id for API
  candidateName: string;
  aiGeneratedScore: number;
  matchScore: number;
  spamScore: number;
  keywords: string[];
  status: 'Recommended' | 'Maybe' | 'Not Recommended'; // Or your RankingCategory type
  education: string;
  experience: number;
  lastPosition: string;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'human' | 'ai';
  timestamp: Date;
}

interface ChatInterfaceProps {
  resumeId: string; // The actual ID of the resume for API calls
  selectedResumeForChat: ChatDisplayResume | null; // Mapped data for display/initial context
}

export const ChatInterface = ({
  resumeId,
  selectedResumeForChat
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedResumeForChat) {
      setMessages([
        {
          id: 'initial-ai-message',
          content: `Hello! I'm ready to discuss ${selectedResumeForChat.candidateName}'s resume (ID: ${resumeId}). Ask me anything.`,
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
      setInput('');
    } else {
      setMessages([]);
    }
  }, [selectedResumeForChat, resumeId]);

  const handleSend = async () => {
    if (!input.trim() || !resumeId || isAiResponding) return;

    const humanMessage: ChatMessage = {
      id: `human-${Date.now()}`,
      content: input,
      sender: 'human',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, humanMessage]);

    const currentInput = input;
    setInput('');
    setIsAiResponding(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', { // Your backend API endpoint for chat
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: currentInput,
          resume_id: resumeId, // Pass the resume_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ generated_response: "Sorry, I encountered an error."}));
        throw new Error(errorData.detail || errorData.generated_response || `API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponseMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        content: data.generated_response || "I'm not sure how to respond to that.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponseMessage]);

    } catch (error) {
      console.error("Chat API error:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: error instanceof Error ? error.message : "Sorry, something went wrong with the chat.",
        sender: 'ai', // Display error as an AI message
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiResponding(false);
    }
  };

  if (!selectedResumeForChat) {
    return (
      // This card is within the parent card on UserAnalysisPage, so no fixed height needed here usually
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground p-6 text-center">
        <Info className="h-10 w-10 mb-3 text-muted-foreground" />
        <p className="text-md font-medium">Chat Unavailable</p>
        <p className="text-xs">Resume data not loaded for chat.</p>
      </div>
    );
  }

  return (
    // Removed fixed height h-[600px] as parent card on UserAnalysisPage controls size
    <div className="flex flex-col h-full max-h-[70vh]"> {/* Added max-h for better screen fit */}
      {/* CardHeader and Title are now handled by the parent Card on UserAnalysisPage */}
      <div className="flex-1 flex flex-col overflow-hidden p-1"> {/* Added p-1 to CardContent equivalent */}
        <div className="flex-1 overflow-y-auto space-y-3 p-3 custom-scrollbar rounded-md bg-background">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${message.sender === 'human' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'ai' && <Bot className="h-6 w-6 text-primary self-start shrink-0"/>}
              <div
                className={`max-w-[85%] p-3 rounded-xl shadow-sm ${
                  message.sender === 'human'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-muted-foreground rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              </div>
              {message.sender === 'human' && <User className="h-6 w-6 text-muted-foreground self-start shrink-0"/>}
            </div>
          ))}
          <div ref={messagesEndRef} />
          {isAiResponding && (
            <div className="flex items-end gap-2 justify-start">
               <Bot className="h-6 w-6 text-primary self-start shrink-0"/>
              <div className="max-w-[85%] p-3 rounded-xl bg-muted text-muted-foreground rounded-bl-none">
                <p className="text-sm italic">AI is typing
                    <span className="animate-pulse">...</span>
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center border-t pt-3 mt-2">
          <Input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about this candidate..."
            className="flex-1"
            onKeyPress={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isAiResponding}
          />
          <Button onClick={handleSend} size="icon" disabled={!input.trim() || isAiResponding || !resumeId}>
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};