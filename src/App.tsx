import { useState, useCallback } from 'react';
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
