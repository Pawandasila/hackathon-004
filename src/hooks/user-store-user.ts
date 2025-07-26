import { useUser } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";


// Helper function to get user's location
const getUserLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
  if (!navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(null),
      { timeout: 5000 }
    );
  });
};

export function useStoreUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  // When this state is set we know the server
  // has stored the user.
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const onboardUser = useMutation(api.users.sendUserOnboarding);
  
  useEffect(() => {
    // If the user is not logged in don't do anything
    if (!isAuthenticated || !user) {
      return;
    }

    let isMounted = true;

    // Store the user in the database.
    async function createUser() {
      try {
        // Get the user's location from browser if available
        const coords = await getUserLocation();
        
        const shopName = user?.username || user?.firstName || "My Shop";
        
        const id = await onboardUser({
          shopAddress: shopName,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        });
        
        if (isMounted) {
          setUserId(id);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to create user profile:", error);
        }
      }
    }

    createUser();

    return () => {
      isMounted = false;
      setUserId(null);
    };
  }, [isAuthenticated, onboardUser, user]);
  // Combine the local state with the state from context
  return {
    isLoading: isLoading || (isAuthenticated && userId === null),
    isAuthenticated: isAuthenticated && userId !== null,
  };
}
