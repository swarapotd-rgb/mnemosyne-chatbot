import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Key, Eye, EyeOff, Save, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { gpt4Service } from '../services/gpt4Service';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load API key from localStorage on mount
  React.useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('openai_api_key') || '';
      setApiKey(savedKey);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      // Validate API key format (basic validation)
      if (!apiKey.startsWith('sk-')) {
        setMessage('Invalid API key format. OpenAI API keys start with "sk-"');
        return;
      }

      // Save to localStorage
      localStorage.setItem('openai_api_key', apiKey);
      
      // Set in GPT-4 service
      gpt4Service.setApiKey(apiKey);
      
      setMessage('API key saved successfully! GPT-4 integration is now active.');
    } catch (error) {
      setMessage('Error saving API key. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('openai_api_key');
    gpt4Service.setApiKey('');
    setMessage('API key cleared.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-teal-900">GPT-4 Settings</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-teal-600 hover:text-teal-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h3 className="font-medium text-teal-900 mb-2">Enable GPT-4 Integration</h3>
            <p className="text-sm text-teal-700 mb-3">
              Add your OpenAI API key to enable intelligent, context-aware responses powered by GPT-4.
            </p>
            <div className="text-xs text-teal-600">
              <p>• Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-teal-800">OpenAI Platform</a></p>
              <p>• Your key is stored locally and never shared</p>
              <p>• GPT-4 provides more intelligent symptom analysis and recommendations</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-teal-900 font-medium">
              OpenAI API Key
            </Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600/50" />
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pl-10 pr-10 bg-white border-teal-200 focus:border-teal-400 focus:ring-teal-400"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-600/50 hover:text-teal-700 transition-colors"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('successfully') || message.includes('cleared')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={!apiKey.trim() || isSaving}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save API Key'}
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              disabled={!apiKey.trim()}
              className="px-4"
            >
              Clear
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
