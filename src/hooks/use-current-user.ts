import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const { user: clerkUser } = useUser();
  
  const user = useQuery(
    api.users.getCurrentUser,
    clerkUser?.id ? {} : "skip"
  );

  return {
    user,
    isLoading: user === undefined,
    isAuthenticated: !!user,
  };
}
