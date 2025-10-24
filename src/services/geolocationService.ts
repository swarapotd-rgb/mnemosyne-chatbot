export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export class GeolocationService {
  private static instance: GeolocationService;
  private currentLocation: UserLocation | null = null;
  private permissionStatus: 'unknown' | 'granted' | 'denied' | 'prompt' = 'unknown';

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  async requestLocationPermission(): Promise<{ granted: boolean; error?: string }> {
    if (!navigator.geolocation) {
      return { granted: false, error: 'Geolocation is not supported by this browser' };
    }

    try {
      // Check if we already have permission
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        this.permissionStatus = permission.state as any;
        
        if (permission.state === 'granted') {
          return { granted: true };
        } else if (permission.state === 'denied') {
          return { granted: false, error: 'Location permission denied. Please enable location access in your browser settings.' };
        }
      }

      // Request current position to trigger permission prompt
      const position = await this.getCurrentPosition();
      if (position) {
        this.currentLocation = position;
        this.permissionStatus = 'granted';
        return { granted: true };
      }

      return { granted: false, error: 'Unable to get location' };
    } catch (error: any) {
      this.permissionStatus = 'denied';
      return { granted: false, error: this.getErrorMessage(error.code) };
    }
  }

  async getCurrentLocation(): Promise<UserLocation | null> {
    if (this.currentLocation) {
      // Return cached location if it's less than 5 minutes old
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      if (this.currentLocation.timestamp > fiveMinutesAgo) {
        return this.currentLocation;
      }
    }

    try {
      const position = await this.getCurrentPosition();
      if (position) {
        this.currentLocation = position;
        return position;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  private getCurrentPosition(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  private getErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Location access denied. Please enable location access in your browser settings.';
      case 2:
        return 'Location information is unavailable. Please check your internet connection.';
      case 3:
        return 'Location request timed out. Please try again.';
      default:
        return 'An error occurred while getting your location.';
    }
  }

  getPermissionStatus(): 'unknown' | 'granted' | 'denied' | 'prompt' {
    return this.permissionStatus;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async getNearbyDoctors(location: UserLocation, specialty?: string): Promise<any[]> {
    try {
      // In a real application, this would call a healthcare provider API
      // For now, we'll return mock data with calculated distances
      const mockDoctors = [
      {
        id: '1',
        name: 'Dr. Sarah Johnson',
        specialty: specialty || 'General Practice',
        photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
        qualifications: ['MD', 'Family Medicine'],
        address: '123 Medical Center Dr, Suite 100',
        location: {
          latitude: location.latitude + 0.01,
          longitude: location.longitude + 0.01
        },
        phone: '(555) 123-4567',
        email: 'dr.johnson@example.com',
        rating: 4.8,
        reviews: 156,
        availability: {
          nextAvailable: new Date(Date.now() + 86400000),
          slots: ['9:00 AM', '2:30 PM', '4:00 PM']
        }
      },
      {
        id: '2',
        name: 'Dr. Michael Chen',
        specialty: specialty || 'Internal Medicine',
        photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
        qualifications: ['MD', 'Internal Medicine'],
        address: '456 Health Plaza, Floor 2',
        location: {
          latitude: location.latitude - 0.015,
          longitude: location.longitude + 0.02
        },
        phone: '(555) 234-5678',
        email: 'dr.chen@example.com',
        rating: 4.6,
        reviews: 89,
        availability: {
          nextAvailable: new Date(Date.now() + 172800000),
          slots: ['10:30 AM', '3:00 PM']
        }
      },
      {
        id: '3',
        name: 'Dr. Lisa Park',
        specialty: 'Emergency Medicine',
        photo: 'https://images.unsplash.com/photo-1594824388852-8a0a4b0b0b0b?w=150&h=150&fit=crop&crop=face',
        qualifications: ['MD', 'Emergency Medicine'],
        address: '789 Emergency Center',
        location: {
          latitude: location.latitude + 0.02,
          longitude: location.longitude - 0.01
        },
        phone: '(555) 345-6789',
        email: 'dr.park@example.com',
        rating: 4.9,
        reviews: 203,
        availability: {
          nextAvailable: new Date(Date.now() + 3600000),
          slots: ['Immediate', '24/7 Emergency']
        }
      }
    ];

      // Calculate distances and sort by proximity
      return mockDoctors.map(doctor => ({
        ...doctor,
        distance: this.calculateDistance(
          location.latitude,
          location.longitude,
          doctor.location.latitude,
          doctor.location.longitude
        )
      })).sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error in getNearbyDoctors:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }
}
