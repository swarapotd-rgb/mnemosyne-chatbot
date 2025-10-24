import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface GeolocationPermissionProps {
  onLocationGranted?: (location: { latitude: number; longitude: number }) => void;
  onLocationDenied?: () => void;
  className?: string;
}

export function GeolocationPermission({ 
  onLocationGranted, 
  onLocationDenied, 
  className = '' 
}: GeolocationPermissionProps) {
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isRequesting, setIsRequesting] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setPermissionStatus('denied');
      return;
    }

    // Check current permission status
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        setPermissionStatus(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt');
      });
    } else {
      setPermissionStatus('prompt');
    }
  }, []);

  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsRequesting(true);
    setShowPrompt(false);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      setLocation(userLocation);
      setPermissionStatus('granted');
      onLocationGranted?.(userLocation);
    } catch (error: any) {
      console.error('Geolocation error:', error);
      setPermissionStatus('denied');
      onLocationDenied?.();
      
      // Show user-friendly error message
      if (error.code === 1) {
        alert('Location access denied. Please enable location permissions in your browser settings to find nearby doctors.');
      } else if (error.code === 2) {
        alert('Location unavailable. Please check your internet connection and try again.');
      } else if (error.code === 3) {
        alert('Location request timed out. Please try again.');
      } else {
        alert('Unable to get your location. Please check your browser settings and try again.');
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const showPermissionPrompt = () => {
    setShowPrompt(true);
  };

  const hidePermissionPrompt = () => {
    setShowPrompt(false);
  };

  // Don't show anything if permission is already granted
  if (permissionStatus === 'granted') {
    return (
      <div className={`flex items-center gap-2 text-green-600 text-sm ${className}`}>
        <CheckCircle className="w-4 h-4" />
        <span>Location enabled</span>
      </div>
    );
  }

  return (
    <>
      {/* Permission Request Button */}
      {permissionStatus !== 'granted' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-center gap-2 ${className}`}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={showPermissionPrompt}
            disabled={isRequesting}
            className="h-8 px-3 text-xs text-teal-600 hover:text-teal-800 hover:bg-teal-50 border-teal-200"
          >
            <MapPin className="w-3 h-3 mr-1" />
            {isRequesting ? 'Getting location...' : 'Enable Location'}
          </Button>
        </motion.div>
      )}

      {/* Permission Prompt Modal */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={hidePermissionPrompt}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-teal-900">Enable Location Access</h3>
                    <p className="text-sm text-teal-600">Find nearby healthcare providers</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={hidePermissionPrompt}
                  className="h-8 w-8 p-0 text-teal-600 hover:text-teal-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-teal-600 mt-0.5" />
                    <div className="text-sm text-teal-800">
                      <p className="font-medium mb-1">Why we need your location:</p>
                      <ul className="space-y-1 text-teal-700">
                        <li>• Find nearby doctors and healthcare providers</li>
                        <li>• Show distance and ratings from Google Maps</li>
                        <li>• Provide location-specific medical resources</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-teal-700">
                  <p className="mb-2">Your location data is:</p>
                  <ul className="space-y-1 text-teal-600">
                    <li>• Used only to find nearby healthcare providers</li>
                    <li>• Not stored or shared with third parties</li>
                    <li>• Encrypted and handled securely</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={requestLocationPermission}
                    disabled={isRequesting}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                  >
                    {isRequesting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-2" />
                        Allow Location Access
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={hidePermissionPrompt}
                    disabled={isRequesting}
                    className="px-4"
                  >
                    Not Now
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

