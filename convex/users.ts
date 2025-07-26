import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export type User = {
  _id: Id<"users">;
  _creationTime: number;
  tokenIdentifier: string;
  name: string;
  email: string;
  imageUrl?: string;
  shopAddress: string;
  latitude?: number;
  longitude?: number;
  isVerified: boolean;
  lastActiveAt: number;
};

/**
 * Stores a new user or updates an existing one.
 * This is an "internal" mutation, meaning it can only be called from other
 * Convex functions, not directly from the client. This is best practice
 * for security.
 */
export const store = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    shopAddress: v.string(),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    // Check if a user with this tokenIdentifier already exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();

    if (user !== null) {
      // If user exists, check if their details have changed and patch them.
      if (
        user.name !== args.name ||
        user.imageUrl !== args.imageUrl
      ) {
        await ctx.db.patch(user._id, {
          name: args.name,
          imageUrl: args.imageUrl,
        });
      }
      return user._id; // Return the existing user's ID
    }

    // If it's a new user, create a new record with all required fields.
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: args.tokenIdentifier,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      shopAddress: args.shopAddress,
      latitude: args.latitude,
      longitude: args.longitude,
      isVerified: false, // Default to not verified
      lastActiveAt: Date.now(),
    });

    return userId;
  },
});

/**
 * A query to get the current authenticated user's data from the database.
 * Throws an error if the user is not authenticated or not found.
 */
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Return null if the user is not authenticated.
      return null;
    }

    // Find the user document corresponding to the authenticated user.
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
        // This case is important for new users who have authenticated but not yet
        // completed the onboarding to create their user document.
        return null;
    }

    return user;
  },
});


/**
 * A public-facing mutation that the client can call during onboarding.
 * It gets user details from the authentication context and calls the
 * internal `store` mutation.
 */
export const sendUserOnboarding = mutation({
    args: {
        shopAddress: v.string(), // The client must provide this during onboarding
        latitude: v.optional(v.float64()),
        longitude: v.optional(v.float64()),
    },
    handler: async (ctx, args): Promise<Id<"users">> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called sendUserOnboarding without authentication present");
        }

        if (!identity.email) {
            throw new Error("Email is required for onboarding");
        }

        // Call the internal mutation with all the required data
        // This is the corrected call using the 'internal' object.
        return await ctx.runMutation(internal.users.store, {
            tokenIdentifier: identity.tokenIdentifier,
            name: identity.name ?? "Street Vendor", // Use the name from auth
            email: identity.email, // We've verified email exists above
            imageUrl: identity.pictureUrl, // Profile picture from auth
            shopAddress: args.shopAddress,
            latitude: args.latitude,
            longitude: args.longitude,
        });
    }
});

/**
 * Update user profile information
 */
export const updateProfile = mutation({
    args: {
        name: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        shopAddress: v.optional(v.string()),
        shopImage: v.optional(v.string()),
        latitude: v.optional(v.float64()),
        longitude: v.optional(v.float64()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called updateProfile without authentication present");
        }

        // Find the user
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        // Update user with provided fields
        const updates: any = {};
        if (args.name !== undefined) updates.name = args.name;
        if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;
        if (args.shopAddress !== undefined) updates.shopAddress = args.shopAddress;
        if (args.shopImage !== undefined) updates.shopImage = args.shopImage;
        if (args.latitude !== undefined) updates.latitude = args.latitude;
        if (args.longitude !== undefined) updates.longitude = args.longitude;
        updates.lastActiveAt = Date.now();

        await ctx.db.patch(user._id, updates);
        return user._id;
    },
});

/**
 * Get user by ID (for other users to see basic info)
 */
export const getUserById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

/**
 * Get user listings (for profile page)
 */
export const getCurrentUserListings = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) {
            return [];
        }

        const listings = await ctx.db
            .query("listings")
            .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id))
            .collect();

        return listings;
    },
});
