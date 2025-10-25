import React, { useState, useEffect } from 'react';
import { OnboardingScreen } from './components/OnboardingScreen';
import { LoginScreen } from './components/LoginScreen';
import { MnemosyneChatbot } from './components/MnemosyneChatbot';
import { DomainSelectionScreen } from './components/DomainSelectionScreen';
import MedicalHistory from './components/MedicalHistory';
import PostDiagnosisChat from './components/PostDiagnosisChat';

type Screen = 'onboarding' | 'login' | 'domain-selection' | 'chat';
type ChatMode = 'pre-diagnosis' | 'post-diagnosis';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [loginMode, setLoginMode] = useState<'signup' | 'signin'>('signup');
  const [chatMode, setChatMode] = useState<ChatMode>('pre-diagnosis');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('onboarding');
  };

  // Scroll to top whenever the screen changes
  useEffect(() => {
    // Scroll to top with smooth behavior, fallback for older browsers
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    } catch (error) {
      // Fallback for browsers that don't support smooth scrolling
      window.scrollTo(0, 0);
    }
  }, [currentScreen]);

  return (
    <>
      {currentScreen === 'onboarding' && (
        <OnboardingScreen 
          onGetStarted={() => {
            setLoginMode('signup');
            setCurrentScreen('login');
          }}
          onLogin={() => {
            setLoginMode('signin');
            setCurrentScreen('login');
          }}
        />
      )}
      {currentScreen === 'login' && (
        <LoginScreen 
          onBack={() => setCurrentScreen('onboarding')}
          initialMode={loginMode}
          onSelectMode={(mode) => {
            setChatMode(mode);
            if (mode === 'pre-diagnosis') {
              setCurrentScreen('domain-selection');
            } else {
              setCurrentScreen('chat');
            }
          }}
          onLogin={(username) => setCurrentUser(username)}
          currentUser={currentUser}
        />
      )}
      {currentScreen === 'domain-selection' && (
        <DomainSelectionScreen
          onAnalyze={(symptoms) => {
            setSelectedSymptoms(symptoms);
            setCurrentScreen('chat');
          }}
          onBack={() => setCurrentScreen('login')}
        />
      )}
      {currentScreen === 'chat' && (
        <div className="flex h-screen">
          <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
            <MedicalHistory username={currentUser} />
          </div>
          <div className="w-3/4">
            {chatMode === 'pre-diagnosis' ? (
              <MnemosyneChatbot 
                mode={chatMode}
                initialSymptoms={selectedSymptoms}
                onBack={() => setCurrentScreen('domain-selection')}
                username={currentUser}
                onLogout={handleLogout}
              />
            ) : (
              <PostDiagnosisChat
                username={currentUser}
                onUpdateHistory={() => {
                  // Force medical history to refresh
                  const historyComponent = document.querySelector('.medical-history');
                  if (historyComponent) {
                    historyComponent.dispatchEvent(new Event('refresh'));
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
