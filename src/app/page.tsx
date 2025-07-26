'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Doc } from '../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { api } from '../../convex/_generated/api';
import { ListingCard } from '@/components/listing-card';
import { toast } from 'sonner';


interface Location {
  lat: number;
  lng: number;
}

interface ListingWithDistance extends Doc<'listings'> {
  seller?: Doc<'users'> | null;
  distance: number;
}

// Helper function to calculate distance between two lat/lng points (Haversine formula)
const getDistance = (lat1: number, lon1: number, lat2: number | undefined, lon2: number | undefined): number => {
  if (typeof lat2 === 'undefined' || typeof lon2 === 'undefined') {
    return Infinity; // Return infinity for listings without location
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
  return R * c; // Distance in km
};

// --- Main Home Page Component ---
export default function Home() {
  const listings = useQuery(api.listings.getActiveListingsWithSeller);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [sortedListings, setSortedListings] = useState<ListingWithDistance[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Get user's current location
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setUserLocation({ lat: 20.5937, lng: 78.9629 }); // Default to center of India
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError("Could not get your location. Showing listings from across India.");
        setUserLocation({ lat: 20.5937, lng: 78.9629 }); // Default to center of India
        toast.error("Could not get your location. Showing listings from across India.");
      },
      { timeout: 10000, maximumAge: 600000 } // 10s timeout, 10min cache
    );
  }, []);

  useEffect(() => {
    if (listings && userLocation) {
      const listingsWithDistance = listings.map((listing: Doc<'listings'> & { seller?: Doc<'users'> | null }) => ({
        ...listing,
        distance: getDistance(
          userLocation.lat,
          userLocation.lng,
          listing.latitude,
          listing.longitude
        ),
      }));
      // Sort by distance, nearest first
      listingsWithDistance.sort((a: ListingWithDistance, b: ListingWithDistance) => a.distance - b.distance);
      setSortedListings(listingsWithDistance);
    }
  }, [listings, userLocation]);

  const renderContent = () => {
    if (listings === undefined || !userLocation) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
          <p className="ml-4 text-lg text-gray-600">
            {locationError || "Finding surplus near you..."}
          </p>
        </div>
      );
    }

    if (listings.length === 0) {
      return (
        <div className="text-center h-screen flex flex-col justify-center items-center">
          <h2 className="text-2xl font-bold text-gray-800">No Surplus Available Right Now</h2>
          <p className="text-gray-500 mt-2">Check back later, or be the first to post something!</p>
          <Link href="/post" className='mt-6'>
            <Button className='bg-orange-500 hover:bg-orange-600'>Post Surplus</Button>
          </Link>
        </div>
      );
    }

    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fresh Surplus Nearby</h1>
          <p className="text-gray-600">
            Here's what other vendors are sharing in your area.
          </p>
          {locationError && (
            <p className="mt-2 text-amber-600 text-sm">{locationError}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedListings.map((listing) => (
            <ListingCard 
              key={listing._id} 
              listing={listing} 
              distance={listing.distance} 
            />
          ))}
        </div>
      </main>
    );
  };

  return renderContent();
}
