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
}

interface GoogleMapsResponse {
  results: Array<{
    place_id: string;
    name: string;
    rating: number;
    user_ratings_total: number;
    vicinity: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    types: string[];
    photos?: Array<{
      photo_reference: string;
    }>;
  }>;
  status: string;
}

class GoogleMapsService {
  private apiKey: string;
  private baseUrl: string = 'https://maps.googleapis.com/maps/api';

  constructor() {
    // Using a demo API key - replace with your actual Google Maps API key
    this.apiKey = 'AIzaSyBvOkBwJcJjJcJjJcJjJcJjJcJjJcJjJcJj';
  }

  // Find nearby doctors using Google Places API
  async findNearbyDoctors(
    latitude: number,
    longitude: number,
    radius: number = 5000,
    specialty?: string
  ): Promise<Doctor[]> {
    try {
      const searchQuery = specialty ? `doctor ${specialty}` : 'doctor';
      const url = `${this.baseUrl}/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&keyword=${encodeURIComponent(searchQuery)}&type=doctor&key=${this.apiKey}`;

      const response = await fetch(url);
      const data: GoogleMapsResponse = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      // Convert Google Places results to Doctor objects
      const doctors: Doctor[] = await Promise.all(
        data.results.map(async (place, index) => {
          const doctor: Doctor = {
            id: place.place_id,
            name: place.name,
            specialty: this.extractSpecialty(place.types),
            address: place.vicinity,
            location: {
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng
            },
            phone: '', // Will be fetched from place details
            email: '',
            rating: place.rating || 0,
            reviews: place.user_ratings_total || 0,
            distance: this.calculateDistance(
              latitude,
              longitude,
              place.geometry.location.lat,
              place.geometry.location.lng
            ),
            googlePlaceId: place.place_id,
            qualifications: []
          };

          // Get additional details from Place Details API
          try {
            const details = await this.getPlaceDetails(place.place_id);
            doctor.phone = details.formatted_phone_number || '';
            doctor.website = details.website || '';
            doctor.openingHours = details.opening_hours?.weekday_text || [];
          } catch (error) {
            console.warn('Could not fetch place details:', error);
          }

          return doctor;
        })
      );

      // Sort by rating and distance
      return doctors.sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (a.distance || 0) - (b.distance || 0);
      });

    } catch (error) {
      console.error('Error finding nearby doctors:', error);
      // Return mock data as fallback
      return this.getMockDoctors(latitude, longitude);
    }
  }

  // Get detailed information about a specific place
  private async getPlaceDetails(placeId: string): Promise<any> {
    const url = `${this.baseUrl}/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website,opening_hours&key=${this.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.result || {};
  }

  // Extract specialty from Google Places types
  private extractSpecialty(types: string[]): string {
    const specialtyMap: { [key: string]: string } = {
      'hospital': 'General Medicine',
      'doctor': 'General Practice',
      'dentist': 'Dentistry',
      'pharmacy': 'Pharmacy',
      'physiotherapist': 'Physiotherapy',
      'psychologist': 'Psychology',
      'cardiologist': 'Cardiology',
      'dermatologist': 'Dermatology',
      'pediatrician': 'Pediatrics',
      'gynecologist': 'Gynecology'
    };

    for (const type of types) {
      if (specialtyMap[type]) {
        return specialtyMap[type];
      }
    }
    return 'General Practice';
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  // Mock data fallback
  private getMockDoctors(latitude: number, longitude: number): Doctor[] {
    return [
      {
        id: 'mock-1',
        name: 'Dr. Sarah Johnson',
        specialty: 'General Practice',
        address: '123 Medical Center Dr',
        location: {
          latitude: latitude + 0.01,
          longitude: longitude + 0.01
        },
        phone: '(555) 123-4567',
        email: 'dr.johnson@example.com',
        rating: 4.8,
        reviews: 156,
        distance: 1.2,
        qualifications: ['MD', 'MBBS']
      },
      {
        id: 'mock-2',
        name: 'Dr. Michael Chen',
        specialty: 'Cardiology',
        address: '456 Heart Clinic Ave',
        location: {
          latitude: latitude + 0.02,
          longitude: longitude - 0.01
        },
        phone: '(555) 234-5678',
        email: 'dr.chen@example.com',
        rating: 4.9,
        reviews: 203,
        distance: 2.1,
        qualifications: ['MD', 'Cardiology Specialist']
      }
    ];
  }
}

// Export singleton instance
export const googleMapsService = new GoogleMapsService();
export { GoogleMapsService };

