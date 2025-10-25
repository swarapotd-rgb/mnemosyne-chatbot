import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Alert } from '../components/ui/alert';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  processedData?: {
    symptoms: string[];
    summary: string;
    insights: {
      symptomTrends: string[];
      progressNotes: string;
      lifestyleTips: string[];
      redFlags: string[];
    };
  };
}

interface PostDiagnosisChatProps {
  username: string | null;
  onUpdateHistory: () => void;
}

const PostDiagnosisChat: React.FC<PostDiagnosisChatProps> = ({ username, onUpdateHistory }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `Hello! I'm here to help track your medical journey. Please share how you've been feeling since your last visit, including any symptoms or changes you've noticed.`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  useEffect(() => {
    addBotWelcomeMessage();
  }, []);

  const processJourney = async (content: string) => {
    try {
      if (!username) {
        throw new Error('User not logged in');
      }

      console.log('Sending request with:', { username, content }); // Debug log

      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          userId: username,
          journeyDescription: content,
        }),
      });

      console.log('Response status:', response.status); // Debug log

      let data;
      try {
        const textResponse = await response.text();
        console.log('Raw response:', textResponse); // Debug log
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        console.error('Server error response:', data); // Debug log
        throw new Error(data.error?.message || 'Failed to process medical journey');
      }

      if (!data || !data.data) {
        console.error('Invalid response structure:', data); // Debug log
        throw new Error('Invalid response from server');
      }

      console.log('Successfully processed data:', data.data); // Debug log
      return data.data;
    } catch (error) {
      console.error('Error processing journey:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      const processedData = await processJourney(userMessage.content);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'I\'ve analyzed your update. Here\'s what I\'ve noted:',
        timestamp: new Date(),
        processedData: processedData
      };

      setMessages(prev => [...prev, botResponse]);
      onUpdateHistory(); // Trigger medical history refresh
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'I apologize, but I encountered an error processing your update. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <h2 className="text-xl font-semibold text-primary">Medical Journey Chat</h2>
        <p className="text-sm text-muted-foreground">Share your medical updates and receive instant analysis</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            } space-y-2`}
          >
            <Card className={`max-w-[80%] shadow-sm ${
              message.type === 'user' 
                ? 'bg-primary text-primary-foreground ml-auto' 
                : 'bg-card border border-border'
            } p-4 rounded-2xl ${
              message.type === 'user' 
                ? 'rounded-br-sm' 
                : 'rounded-bl-sm'
            }`}>
              <div className={`font-medium ${
                message.type === 'user' ? 'text-primary-foreground' : 'text-foreground'
              }`}>
                {message.content}
              </div>
              
              {message.processedData && (
                <div className="mt-4 space-y-3">
                  {message.processedData.summary && (
                    <div className="p-3 bg-secondary/10 rounded-lg">
                      <h4 className="font-medium mb-1">Summary</h4>
                      <p className="text-sm">{message.processedData.summary}</p>
                    </div>
                  )}
                  
                  {message.processedData.insights.redFlags.length > 0 && (
                    <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                      <h4 className="font-medium mb-1">Important Notices</h4>
                      <ul className="text-sm space-y-1">
                        {message.processedData.insights.redFlags.map((flag, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </Alert>
                  )}
                  
                  {message.processedData.insights.lifestyleTips.length > 0 && (
                    <div className="p-3 bg-secondary/10 rounded-lg">
                      <h4 className="font-medium mb-1">Recommendations</h4>
                      <ul className="text-sm space-y-1">
                        {message.processedData.insights.lifestyleTips.map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <Textarea
            value={inputText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
            placeholder="Share how you've been feeling..."
            className="flex-1 min-h-[60px] max-h-[200px] resize-y bg-secondary/10 border-secondary/20 focus:border-primary"
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isProcessing || !inputText.trim()}
            className="px-6 h-[40px] bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isProcessing ? 'Sending...' : 'Send'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};

export default PostDiagnosisChat;