'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { Loader2, MapPinOff } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Doc } from '../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { api } from '../../convex/_generated/api';
import { ListingCard } from '@/components/listing-card';
import ProfileCompletionModal from '@/components/profile-completion-modal';
import { useProfileCompletion } from '@/hooks/use-profile-completion';
import { toast } from 'sonner';


// Define types for better state management
type LocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';
interface Location {
  latitude: number;
  longitude: number;
}
interface ListingWithDistance extends Doc<'listings'> {
  seller?: Doc<'users'> | null;
  distance: number | null; // Allow distance to be null
}

// Helper function to calculate distance between two lat/lng points (Haversine formula)
const getDistance = (lat1: number, lon1: number, lat2: number | undefined, lon2: number | undefined): number | null => {
  if (typeof lat2 === 'undefined' || typeof lon2 === 'undefined') {
    return null; // Return null if listing has no location
  }
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// --- Main Home Page Component ---
export default function Home() {
  const { user, isLoaded } = useUser();
  const { isComplete: isProfileComplete } = useProfileCompletion();
  const activeListings = useQuery(api.listings.getActiveListingsWithSeller);
  const allListingsFromDb = useQuery(api.listings.getAllListings);
  
  // Use active listings if available, otherwise fallback to all listings
  const allListings = activeListings && activeListings.length > 0 ? activeListings : allListingsFromDb;
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('loading');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [processedListings, setProcessedListings] = useState<ListingWithDistance[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const requestLocationPermission = useCallback(() => {
    setLocationStatus('loading');
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus('granted');
        toast.success("Location found!");
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationStatus('denied');
        toast.error("Location access was denied.");
      },
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  // Check profile completion when user lands on home page
  useEffect(() => {
    if (isLoaded && user && !isProfileComplete) {
      setShowProfileModal(true);
    }
  }, [isLoaded, user, isProfileComplete]);
  
  useEffect(() => {
    console.log('=== DEBUG INFO ===');
    console.log('All listings in DB:', allListingsFromDb?.length || 0);
    console.log('Active listings:', activeListings?.length || 0);
    console.log('Using listings (active or fallback):', allListings?.length || 0);
    console.log('Fallback active?', activeListings && activeListings.length > 0 ? 'No, using active' : 'Yes, using ALL listings');
    console.log('Type of allListings:', typeof allListings);
    console.log('Is array?', Array.isArray(allListings));
    console.log('==================');
    
    if (!allListings) {
      console.log('allListings is undefined/null, returning...');
      return;
    }

    let listingsToShow: ListingWithDistance[];

    if (locationStatus === 'granted' && userLocation) {
      // If we have location, calculate distance and sort
      listingsToShow = allListings.map(listing => ({
        ...listing,
        distance: getDistance(userLocation.latitude, userLocation.longitude, listing.latitude, listing.longitude),
      }));
      listingsToShow.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else {
      // If no location, show all listings sorted by creation time (newest first)
      listingsToShow = allListings.map(listing => ({
        ...listing,
        distance: null,
      }));
      listingsToShow.sort((a, b) => b._creationTime - a._creationTime);
    }
    setProcessedListings(listingsToShow);
  }, [allListings, userLocation, locationStatus, activeListings, allListingsFromDb]);

  // --- Render Functions for different states ---

  if (allListings === undefined) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="ml-4 text-lg text-gray-600">Loading available surplus...</p>
      </div>
    );
  }

  const renderListingsGrid = (listings: ListingWithDistance[]) => {
    if (listings.length === 0) {
      return (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-800">No Surplus Available Right Now</h2>
          <p className="text-gray-500 mt-2">Check back later, or be the first to post something!</p>
          <Link href="/post" className='mt-6 inline-block'>
            <Button className='bg-orange-500 hover:bg-orange-600'>Post Surplus</Button>
          </Link>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <ListingCard key={listing._id} listing={listing} distance={listing.distance} />
        ))}
      </div>
    );
  };

  const renderPermissionDenied = () => (
    <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-8 my-8">
      <MapPinOff className="mx-auto h-12 w-12 text-amber-500" />
      <h2 className="mt-4 text-xl font-bold text-gray-800">Find What's Nearest to You</h2>
      <p className="mt-2 text-gray-600">
        Please allow location access to see how far away each item is.
      </p>
      <Button
        onClick={requestLocationPermission}
        className="mt-4 bg-orange-500 hover:bg-orange-600"
        disabled={locationStatus === 'loading'}
      >
        {locationStatus === 'loading' ? 'Checking...' : 'Allow Location Access'}
      </Button>
    </div>
  );

  return (
    <>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {locationStatus === 'granted' ? 'Fresh Surplus Nearby' : 'All Available Surplus'}
          </h1>
          <p className="text-gray-600">
            {locationStatus === 'granted'
              ? "Here's what other vendors are sharing in your area, sorted by what's closest."
              : "Here's all available surplus, sorted by the newest listings."}
            {activeListings && activeListings.length === 0 && allListingsFromDb && allListingsFromDb.length > 0 && (
              <span className="block mt-1 text-sm text-amber-600">
                Showing all listings (no active listings available)
              </span>
            )}
          </p>
        </div>

        {locationStatus === 'denied' && renderPermissionDenied()}
        
        {renderListingsGrid(processedListings)}
      </main>
      
      {/* Profile Completion Modal */}
      {showProfileModal && (
        <ProfileCompletionModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
}
