import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, Mail, Star, Clock, Navigation, ExternalLink, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { GeolocationService } from '../services/geolocationService';
import { GoogleMapsService } from '../services/googleMapsService';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  photo?: string;
  qualifications: string[];
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  email: string;
  rating: number;
  reviews: number;
  distance?: number;
  googlePlaceId?: string;
  website?: string;
  openingHours?: string[];
  availability?: {
    nextAvailable: Date;
    slots: string[];
  };
}

interface NearbyDoctorsProps {
  symptoms?: string[];
  specialty?: string;
  onDoctorSelect?: (doctor: Doctor) => void;
  className?: string;
}

export function NearbyDoctors({ 
  symptoms = [], 
  specialty, 
  onDoctorSelect,
  className = '' 
}: NearbyDoctorsProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showDoctors, setShowDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const geolocationService = GeolocationService.getInstance();
  const googleMapsService = new GoogleMapsService();

  useEffect(() => {
    // Check if we already have location permission
    const permissionStatus = geolocationService.getPermissionStatus();
    if (permissionStatus === 'granted') {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      const userLocation = await geolocationService.getCurrentLocation();
      if (userLocation) {
        setLocation(userLocation);
        await findNearbyDoctors(userLocation);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Unable to get your location. Please check your browser settings.');
    }
  };

  const findNearbyDoctors = async (userLocation: { latitude: number; longitude: number }) => {
    setLoading(true);
    setError(null);

    try {
      // Try Google Maps API first, fallback to mock data
      let doctorsList: Doctor[] = [];
      
      try {
        doctorsList = await googleMapsService.findNearbyDoctors(
          userLocation.latitude,
          userLocation.longitude,
          10000, // 10km radius
          specialty
        );
      } catch (googleError) {
        console.warn('Google Maps API failed, using mock data:', googleError);
        doctorsList = await geolocationService.getNearbyDoctors(userLocation, specialty);
      }

      // Filter doctors based on symptoms if provided
      if (symptoms.length > 0) {
        doctorsList = doctorsList.filter(doctor => 
          symptoms.some(symptom => 
            doctor.specialty.toLowerCase().includes(symptom.toLowerCase()) ||
            doctor.name.toLowerCase().includes(symptom.toLowerCase())
          )
        );
      }

      setDoctors(doctorsList);
      setShowDoctors(true);
    } catch (error) {
      console.error('Error finding nearby doctors:', error);
      setError('Unable to find nearby doctors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationPermission = async (granted: boolean) => {
    if (granted) {
      await getCurrentLocation();
    } else {
      setError('Location permission is required to find nearby doctors.');
    }
  };

  const openGoogleMaps = (doctor: Doctor) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctor.address)}`;
    window.open(url, '_blank');
  };

  const callDoctor = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const emailDoctor = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return 'Distance unknown';
    return distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance.toFixed(1)}km away`;
  };

  const formatAvailability = (availability?: { nextAvailable: Date; slots: string[] }) => {
    if (!availability) return 'Contact for availability';
    
    const now = new Date();
    const nextAvailable = new Date(availability.nextAvailable);
    const timeDiff = nextAvailable.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff <= 1) {
      return `Available today: ${availability.slots.join(', ')}`;
    } else if (daysDiff <= 7) {
      return `Available in ${daysDiff} days`;
    } else {
      return `Next available: ${nextAvailable.toLocaleDateString()}`;
    }
  };

  if (!location && !loading) {
    return (
      <div className={`${className}`}>
        <Button
          onClick={() => setShowDoctors(true)}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Find Nearby Doctors
        </Button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Show Doctors Button */}
      {location && (
        <Button
          onClick={() => setShowDoctors(true)}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
        >
          <MapPin className="w-4 h-4 mr-2" />
          {doctors.length > 0 ? `View ${doctors.length} Nearby Doctors` : 'Find Nearby Doctors'}
        </Button>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <span className="ml-3 text-teal-600">Finding nearby doctors...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Unable to find doctors</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Doctors Modal */}
      <AnimatePresence>
        {showDoctors && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDoctors(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-semibold text-teal-900">Nearby Healthcare Providers</h2>
                  <p className="text-sm text-teal-600 mt-1">
                    {doctors.length} doctors found within 10km
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDoctors(false)}
                  className="h-8 w-8 p-0 text-teal-600 hover:text-teal-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Doctors List */}
              <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                {doctors.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-teal-300 mx-auto mb-4" />
                    <p className="text-teal-600">No doctors found in your area</p>
                    <p className="text-sm text-teal-500 mt-1">Try expanding your search radius</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {doctors.map((doctor) => (
                      <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {doctor.photo && (
                                <img
                                  src={doctor.photo}
                                  alt={doctor.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <CardTitle className="text-lg text-teal-900">{doctor.name}</CardTitle>
                                <p className="text-sm text-teal-600">{doctor.specialty}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm font-medium">{doctor.rating}</span>
                                    <span className="text-xs text-gray-500">({doctor.reviews} reviews)</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {formatDistance(doctor.distance)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDoctor(doctor)}
                              className="text-teal-600 hover:text-teal-800"
                            >
                              View Details
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{doctor.address}</span>
                            </div>
                            {doctor.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4" />
                                <span>{doctor.phone}</span>
                              </div>
                            )}
                            {doctor.availability && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>{formatAvailability(doctor.availability)}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openGoogleMaps(doctor)}
                              className="flex-1 text-teal-600 hover:text-teal-800"
                            >
                              <Navigation className="w-4 h-4 mr-1" />
                              Directions
                            </Button>
                            {doctor.phone && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => callDoctor(doctor.phone)}
                                className="flex-1 text-teal-600 hover:text-teal-800"
                              >
                                <Phone className="w-4 h-4 mr-1" />
                                Call
                              </Button>
                            )}
                            {doctor.website && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(doctor.website, '_blank')}
                                className="flex-1 text-teal-600 hover:text-teal-800"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Website
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}




