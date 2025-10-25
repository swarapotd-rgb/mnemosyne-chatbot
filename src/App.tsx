import { useState } from 'react';
import { OnboardingScreen } from './components/OnboardingScreen';
import { LoginScreen } from './components/LoginScreen';
import { MnemosyneChatbot } from './components/MnemosyneChatbot';
import { DomainSelectionScreen } from './components/DomainSelectionScreen';

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
          currentUser={currentUser}
        />
      )}
      {currentScreen === 'domain-selection' && (
        <DomainSelectionScreen
          onAnalyze={(symptoms) => {
            setSelectedSymptoms(symptoms);
            setCurrentScreen('chat');
          }}
        />
      )}
      {currentScreen === 'chat' && (
        <MnemosyneChatbot 
          mode={chatMode}
          initialSymptoms={selectedSymptoms}
          onBack={() => setCurrentScreen(chatMode === 'pre-diagnosis' ? 'domain-selection' : 'login')}
          username={currentUser}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
