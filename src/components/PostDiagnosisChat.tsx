import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';

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
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.type === 'user' ? 'flex justify-end' : 'flex justify-start'
            }`}
          >
            <Card className={`max-w-[70%] p-3 ${
              message.type === 'user' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <div className="font-medium">
                {message.content}
              </div>
              {message.processedData && (
                <div className="mt-3 text-sm">
                  {message.processedData.summary && (
                    <div className="mb-2">
                      <strong>Summary:</strong> {message.processedData.summary}
                    </div>
                  )}
                  {message.processedData.insights.redFlags.length > 0 && (
                    <Alert variant="destructive" className="mb-2">
                      <strong>Red Flags:</strong>
                      <ul className="list-disc ml-4">
                        {message.processedData.insights.redFlags.map((flag, index) => (
                          <li key={index}>{flag}</li>
                        ))}
                      </ul>
                    </Alert>
                  )}
                  {message.processedData.insights.lifestyleTips.length > 0 && (
                    <div className="mb-2">
                      <strong>Recommendations:</strong>
                      <ul className="list-disc ml-4">
                        {message.processedData.insights.lifestyleTips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Textarea
          value={inputText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
          placeholder="Share how you've been feeling..."
          className="flex-1"
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
          className="w-24"
        >
          {isProcessing ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
};

export default PostDiagnosisChat;