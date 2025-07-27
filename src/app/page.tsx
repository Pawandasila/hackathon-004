"use client"

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { Loader2, MapPinOff, Package } from "lucide-react";
import Link from "next/link";

import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";
import { ListingCard } from "@/components/listing-card";

import ProfileCompletionModal from "@/components/profile-completion-modal";
import { useProfileCompletion } from "@/hooks/use-profile-completion";

import { toast } from "sonner";

type LocationStatus = "loading" | "granted" | "denied" | "unavailable";
interface Location {
  latitude: number;
  longitude: number;
}

export default function Home() {
  const { user, isLoaded } = useUser();
  const { isComplete: isProfileComplete } = useProfileCompletion();

  // Fallback to old listings for non-search scenarios
  const activeListings = useQuery(api.listings.getActiveListingsWithSeller);
  const allListingsFromDb = useQuery(api.listings.getAllListings);

  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>("loading");
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const requestLocationPermission = useCallback(() => {
    setLocationStatus("loading");
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      toast.info("Geolocation is not supported by your browser. You can still browse all listings.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("granted");
        toast.success("Location found! Now you can see distances to listings.");
      },
      (error) => {
        console.log("Location access declined:", error.message);
        setLocationStatus("denied");
        toast.info("Location access was declined. You can still browse all listings without distance information.");
      },
      { 
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 300000 // 5 minutes cache
      }
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

  if (!activeListings && !allListingsFromDb) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="ml-4 text-lg text-gray-600">
          Loading available surplus...
        </p>
      </div>
    );
  }

  return (
    <>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Location Permission Banner for non-search results */}
        {(locationStatus === "denied" || locationStatus === "loading") && (
          <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-8 mb-8">
            <MapPinOff className="mx-auto h-12 w-12 text-amber-500" />
            <h2 className="mt-4 text-xl font-bold text-gray-800">
              Find What's Nearest to You
            </h2>
            <p className="mt-2 text-gray-600">
              Please allow location access to see how far away each item is.
            </p>
            <Button
              onClick={requestLocationPermission}
              className="mt-4 bg-orange-500 hover:bg-orange-600"
              disabled={locationStatus === "loading"}
            >
              {locationStatus === "loading"
                ? "Checking..."
                : "Allow Location Access"}
            </Button>
          </div>
        )}

        {/* Fallback notice for all listings */}
        {activeListings &&
          activeListings.length === 0 &&
          allListingsFromDb &&
          allListingsFromDb.length > 0 && (
            <div className="text-center mt-4 mb-4">
              <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                Showing all listings (no active listings available)
              </span>
            </div>
          )}

        {/* Listings Grid */}
        {(activeListings && activeListings.length > 0) || (allListingsFromDb && allListingsFromDb.length > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {(activeListings && activeListings.length > 0
              ? activeListings
              : allListingsFromDb || []
            ).map((listing) => (
              <ListingCard key={listing._id} listing={listing} distance={null} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              {/* Empty State Icon */}
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9l3-3 3 3"
                    />
                  </svg>
                </div>
              </div>

              {/* Empty State Content */}
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                No surplus items available
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                There are currently no listings in your area. Be the first to share your surplus items with the community!
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                {user ? (
                  <Link href="/post">
                    <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 px-8 py-3">
                      <Package className="w-4 h-4 mr-2" />
                      Post Your First Item
                    </Button>
                  </Link>
                ) : (
                  <Link href="/sign-up">
                    <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 px-8 py-3">
                      Join Rasoio Community
                    </Button>
                  </Link>
                )}
                
                <div>
                  <Button
                    variant="outline"
                    onClick={requestLocationPermission}
                    className="w-full sm:w-auto mt-3 text-black"
                    disabled={locationStatus === "loading"}
                  >
                    {locationStatus === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking Location...
                      </>
                    ) : (
                      <>
                        <MapPinOff className="w-4 h-4 mr-2" />
                        Refresh for Nearby Items
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Why Rasoio?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Reduce food waste in your community</li>
                  <li>• Find fresh, affordable surplus items</li>
                  <li>• Connect with local vendors and neighbors</li>
                </ul>
              </div>
            </div>
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
