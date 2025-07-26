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
import { SearchBar } from '@/components/search-bar';
import { SimpleSearchBar } from '@/components/simple-search-bar';
import { SearchResults } from '@/components/search-results';
import ProfileCompletionModal from '@/components/profile-completion-modal';
import { useProfileCompletion } from '@/hooks/use-profile-completion';
import { SearchTest } from '@/components/search-test';

import { toast } from 'sonner';
import { useSearchListings } from '@/hooks/use-search-listings';



type LocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';
interface Location {
  latitude: number;
  longitude: number;
}
interface ListingWithDistance extends Doc<'listings'> {
  seller?: Doc<'users'> | null;
  distance: number | null; 
}


const getDistance = (lat1: number, lon1: number, lat2: number | undefined, lon2: number | undefined): number | null => {
  if (typeof lat2 === 'undefined' || typeof lon2 === 'undefined') {
    return null; 
  }
  const R = 6371; 
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

export default function Home() {
  const { user, isLoaded } = useUser();
  const { isComplete: isProfileComplete } = useProfileCompletion();
  
  // Search functionality
  const {
    searchQuery,
    currentPage,
    searchResults,
    isLoading: isSearchLoading,
    handleSearch,
    handlePageChange,
    resetSearch,
  } = useSearchListings({ itemsPerPage: 12 });

  // Fallback to old listings for non-search scenarios
  const activeListings = useQuery(api.listings.getActiveListingsWithSeller);
  const allListingsFromDb = useQuery(api.listings.getAllListings);
  
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('loading');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
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

  useEffect(() => {
    // Always close modal if profile is complete
    if (isProfileComplete) {
      setShowProfileModal(false);
      return;
    }
    
    // Only show modal if user is loaded, authenticated, and profile is NOT complete
    if (isLoaded && user && !isProfileComplete) {
      setShowProfileModal(true);
    }
  }, [isLoaded, user, isProfileComplete]);
  
  // Handle search query changes to reset location-based sorting
  useEffect(() => {
    if (searchQuery) {
      // When searching, we don't need location-based sorting as search results are handled by the backend
      console.log('Search query changed:', searchQuery);
      console.log('Search results:', searchResults);
      return;
    }
  }, [searchQuery, searchResults]);

  // Show loading only if search is active and loading, or if no search and fallback data is loading
  if (isSearchLoading || (!searchQuery && activeListings === undefined && allListingsFromDb === undefined)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="ml-4 text-lg text-gray-600">
          {searchQuery ? 'Searching...' : 'Loading available surplus...'}
        </p>
      </div>
    );
  }

  // Prepare fallback data for when no search is active
  const allListings = activeListings && activeListings.length > 0 ? activeListings : allListingsFromDb;
  
  // Create fallback search results format for non-search display
  const fallbackSearchResults = !searchQuery && allListings ? {
    listings: allListings,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalCount: allListings.length,
      hasNextPage: false,
      hasPrevPage: false,
      limit: allListings.length,
    }
  } : null;

  // Determine which results to show
  const resultsToShow = searchQuery ? searchResults : fallbackSearchResults;

  return (
    <>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Search Test Component */}
        {process.env.NODE_ENV === 'development' && <SearchTest />}
        
        {/* Search Bar */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Find Fresh Surplus Near You
          </h1>
          <SimpleSearchBar 
            onSearch={handleSearch}
            placeholder="Search for items like 'Chicken Biryani', 'Samosa', 'Pizza'..."
          />
          
          {/* Original SearchBar for comparison */}
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Original SearchBar:</h4>
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search for items like 'Chicken Biryani', 'Samosa', 'Pizza'..."
              className="mb-4"
            />
          </div>
        </div>

        {/* Location Permission Banner for non-search results */}
        {(locationStatus === 'denied' || locationStatus === 'loading') && !searchQuery && (
          <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-8 mb-8">
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
        )}

        {/* Search Results or Fallback Listings */}
        <SearchResults
          searchResults={resultsToShow}
          searchQuery={searchQuery}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onResetSearch={resetSearch}
          userLocation={userLocation}
          locationStatus={locationStatus}
        />
        
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
            <div>Search Query: "{searchQuery}"</div>
            <div>Search Loading: {isSearchLoading ? 'Yes' : 'No'}</div>
            <div>Search Results: {searchResults ? `${searchResults?.listings?.length || 0} items` : 'Loading/None'}</div>
            <div>Fallback Results: {fallbackSearchResults ? `${fallbackSearchResults.listings.length} items` : 'None'}</div>
            <div>Results To Show: {resultsToShow ? `${resultsToShow?.listings?.length || 0} items` : 'None'}</div>
            <div>Active Listings: {activeListings?.length || 0}</div>
            <div>All Listings: {allListingsFromDb?.length || 0}</div>
          </div>
        )}

        {/* Fallback notice for all listings */}
        {!searchQuery && activeListings && activeListings.length === 0 && allListingsFromDb && allListingsFromDb.length > 0 && (
          <div className="text-center mt-4">
            <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              Showing all listings (no active listings available)
            </span>
          </div>
        )}
      </main>
      
      {/* Profile Completion Modal */}
      {showProfileModal && !isProfileComplete && (
        <ProfileCompletionModal
          isOpen={showProfileModal && !isProfileComplete}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
}
