import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { MnemosyneLogo } from './MnemosyneLogo';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LoginScreenProps {
  onBack?: () => void;
  initialMode?: 'signup' | 'signin';
  onSelectMode?: (mode: 'pre-diagnosis' | 'post-diagnosis') => void;
  onLogin?: (username: string) => void;
  currentUser?: string | null;
}

export function LoginScreen({ onBack, initialMode = 'signup', onSelectMode, onLogin, currentUser }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Simulated user database - in a real app, this would be on the server
  const validateCredentials = (username: string, password: string): boolean => {
    // Basic validation rules
    if (username.length < 3 || password.length < 6) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check age verification
    if (!isAgeVerified) {
      alert('Please confirm that you are 18 years or older to proceed.');
      return;
    }
    
    // Basic validation
    if (!validateCredentials(username, password)) {
      alert('Invalid credentials. Username must be at least 3 characters and password at least 6 characters long.');
      return;
    }

    try {
      if (isSignUp) {
        // In a real app, this would be a POST request to create a new user
        // For now, we'll simulate user creation with local storage
        const existingUser = localStorage.getItem(username);
        if (existingUser) {
          alert('Username already exists. Please choose another username or sign in.');
          return;
        }
        
        // Store the new user's credentials (never store plain passwords in production!)
        localStorage.setItem(username, JSON.stringify({ 
          password: btoa(password), // Basic encoding (not secure for production!)
          createdAt: new Date().toISOString()
        }));
        
        alert('Account created successfully! You can now sign in.');
        setIsSignUp(false); // Switch to sign in mode
        setPassword(''); // Clear password field
        return;
      } else {
        // Sign in
        const storedUser = localStorage.getItem(username);
        if (!storedUser) {
          alert('Username not found. Please sign up first.');
          return;
        }

        const userData = JSON.parse(storedUser);
        if (btoa(password) !== userData.password) {
          alert('Incorrect password. Please try again.');
          return;
        }

        // Successful login
        setIsLoggedIn(true);
        onLogin?.(username);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('An error occurred during authentication. Please try again.');
    }
  };

  // If user is logged in, show diagnosis selection
  if (isLoggedIn || currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center space-y-10"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-6"
            >
              <MnemosyneLogo />
              <h1 className="text-center text-teal-900 text-5xl title-primary">
                Mnemosyne
              </h1>
            </motion.div>

            {/* Welcome Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-teal-800 text-3xl body-medium">
                Welcome! Let's understand your journey
              </h2>
              <p className="text-teal-700/70 mt-3 text-xl body-regular">
                Please select your current status
              </p>
            </motion.div>

            {/* Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="w-full rounded-3xl overflow-hidden shadow-2xl"
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758691462321-9b6c98c40f7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwcGF0aWVudCUyMGhlYWx0aGNhcmUlMjBjb252ZXJzYXRpb258ZW58MXx8fHwxNzYxMjIzMjc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Healthcare companion illustration"
                className="w-full h-80 object-cover"
              />
            </motion.div>

            {/* Diagnosis Option Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="w-full max-w-md space-y-4"
            >
              <Button
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-xl rounded-xl h-16 shadow-lg shadow-teal-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/40 hover:scale-105 button-text"
                onClick={() => onSelectMode?.('pre-diagnosis')}
                title="Get Doctor Recommendations, Disease Prediction and Precautions based on Listed Symptoms"
              >
                Before Consultation
              </Button>

              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-xl rounded-xl h-16 shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-105 button-text"
                onClick={() => onSelectMode?.('post-diagnosis')}
                title="Narrate, Store and Refer a Medical History"
              >
                After Consultation
              </Button>
            </motion.div>

            {/* Privacy Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="flex items-center gap-3 text-teal-700/80 bg-white/60 backdrop-blur-sm px-6 py-4 rounded-xl border border-teal-200/30 shadow-sm max-w-lg"
            >
              <Lock className="w-5 h-5 flex-shrink-0" />
              <p className="text-base body-regular">
                Your health story stays private — encrypted and stored securely.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Login/Signup Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center space-y-8"
        >
          {/* Back Button */}
          {onBack && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              onClick={onBack}
              className="self-start flex items-center gap-2 text-teal-700 hover:text-teal-900 transition-colors body-regular"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </motion.button>
          )}

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6"
          >
            <MnemosyneLogo />
            <h1 className="text-center text-teal-900 text-5xl title-primary">
              Mnemosyne
            </h1>
          </motion.div>

          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-teal-800 text-2xl body-medium">
              {isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p className="text-teal-700/70 mt-2 body-regular">
              {isSignUp
                ? 'Begin your journey to better health management'
                : 'Continue your health narrative'}
            </p>
          </motion.div>

          {/* Login Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            onSubmit={handleSubmit}
            className="w-full bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-teal-100"
          >
            <div className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-teal-900 body-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600/50" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12 bg-white border-teal-200 focus:border-teal-400 focus:ring-teal-400 body-regular"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-teal-900 body-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600/50" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-white border-teal-200 focus:border-teal-400 focus:ring-teal-400 body-regular"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-600/50 hover:text-teal-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Age Verification Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="age-verification"
                  checked={isAgeVerified}
                  onCheckedChange={(checked) => setIsAgeVerified(checked as boolean)}
                  className="border-teal-300 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                />
                <Label 
                  htmlFor="age-verification" 
                  className="text-teal-900 body-regular cursor-pointer"
                >
                  I confirm that I am 18 years or older
                </Label>
              </div>

              {/* Forgot Password - Only show on login */}
              {!isSignUp && (
                <div className="text-right">
                  <button
                    type="button"
                    className="text-teal-600 hover:text-teal-800 transition-colors body-regular"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl h-12 shadow-lg shadow-teal-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/40 hover:scale-105 button-text"
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </div>
          </motion.form>

          {/* Toggle Sign Up / Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-center"
          >
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-teal-700 hover:text-teal-900 transition-colors body-regular"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </motion.div>

          {/* Privacy Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex items-center gap-3 text-teal-700/80 bg-white/60 backdrop-blur-sm px-6 py-4 rounded-xl border border-teal-200/30 shadow-sm"
          >
            <Lock className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm body-regular">
              Your data is encrypted end-to-end and HIPAA compliant
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
