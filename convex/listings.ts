import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export type Listing = {
  _id: Id<"listings">;
  _creationTime: number;
  sellerId: Id<"users">;
  masterItemId: Id<"masterItems">;
  description: string;
  price: number;
  currency?: string;
  quantity: number;
  unit: string;
  minQuantity?: number;
  imageUrl: string;
  latitude?: number;
  longitude?: number;
  deliveryRadius?: number;
  isDeliveryAvailable?: boolean;
  isPickupAvailable?: boolean;
  isActive: boolean;
  expiresAt: number;
  availableFrom?: number;
  availableUntil?: number;
  condition?: "fresh" | "good" | "fair";
  tags?: string[];
  notes?: string;
  viewCount?: number;
  inquiryCount?: number;
  lastUpdatedAt?: number;
};

/**
 * Create a new listing
 */
export const create = mutation({
  args: {
    masterItemId: v.id("masterItems"),
    description: v.string(),
    price: v.number(),
    quantity: v.number(),
    unit: v.string(),
    imageUrl: v.string(),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    // Expiry time in hours from now (default 24 hours)
    expiryHours: v.optional(v.number()),
    // Additional optional fields
    condition: v.optional(v.union(v.literal("fresh"), v.literal("good"), v.literal("fair"))),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    isDeliveryAvailable: v.optional(v.boolean()),
    isPickupAvailable: v.optional(v.boolean()),
    deliveryRadius: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called create listing without authentication present");
    }

    // Get the user's ID from their token
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Calculate expiry time (default 24 hours from now)
    const expiryHours = args.expiryHours ?? 24;
    const expiresAt = Date.now() + expiryHours * 60 * 60 * 1000;

    const listingId = await ctx.db.insert("listings", {
      sellerId: user._id,
      description: args.description,
      masterItemId: args.masterItemId,
      price: args.price,
      quantity: args.quantity,
      unit: args.unit,
      imageUrl: args.imageUrl,
      latitude: args.latitude,
      longitude: args.longitude,
      condition: args.condition,
      tags: args.tags,
      notes: args.notes,
      isDeliveryAvailable: args.isDeliveryAvailable,
      isPickupAvailable: args.isPickupAvailable,
      deliveryRadius: args.deliveryRadius,
      isActive: true,
      expiresAt,
      viewCount: 0,
      inquiryCount: 0,
      lastUpdatedAt: Date.now(),
    });

    // Get master item name for notification
    const masterItem = await ctx.db.get(args.masterItemId);
    const itemName = masterItem?.name || "item";

    // Send notification to seller about successful listing creation
    await ctx.runMutation(internal.notifications.notifyListingCreated, {
      sellerId: user._id,
      listingId: listingId,
      itemName: itemName,
    });

    return listingId;
  },
});

/**
 * Get all listings with seller information (for debugging/fallback)
 */
export const getAllListings = query({
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("listings")
      .order("desc") // Sort by creation time, newest first
      .collect();
    
    
    // Fetch seller information for each listing
    const listingsWithSellers = await Promise.all(
      listings.map(async (listing) => {
        const seller = await ctx.db.get(listing.sellerId);
        return { ...listing, seller };
      })
    );
    return listingsWithSellers;
  },
});

/**
 * Get all active listings with their seller information
 */
export const getActiveListingsWithSeller = query({
  handler: async (ctx) => {
    const now = Date.now();
    
    const listings = await ctx.db
      .query("listings")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.gt(q.field("expiresAt"), now)
        )
      )
      .order("desc") // Sort by creation time, newest first
      .collect();


    // Fetch seller information for each listing
    const listingsWithSellers = await Promise.all(
      listings.map(async (listing) => {
        const seller = await ctx.db.get(listing.sellerId);
        return { ...listing, seller };
      })
    );

    return listingsWithSellers;
  },
});

/**
 * Get a single listing by ID with seller information
 */
export const getListingById = query({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) {
      return null;
    }

    const seller = await ctx.db.get(listing.sellerId);
    return { ...listing, seller };
  },
});

/**
 * Get similar listings (same master item, different sellers)
 */
export const getSimilarListings = query({
  args: { 
    masterItemId: v.id("masterItems"),
    excludeId: v.optional(v.id("listings"))
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("listings")
      .withIndex("by_masterItemId", (q) => q.eq("masterItemId", args.masterItemId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc"); // Sort by creation time, newest first
    
    if (args.excludeId) {
      query = query.filter((q) => q.neq(q.field("_id"), args.excludeId));
    }
    
    const listings = await query.take(5);
    
    // Get seller details for each listing
    const listingsWithSellers = await Promise.all(
      listings.map(async (listing) => {
        const seller = await ctx.db.get(listing.sellerId);
        return { ...listing, seller };
      })
    );
    
    return listingsWithSellers;
  },
});

/**
 * Update a listing
 */
export const update = mutation({
  args: {
    id: v.id("listings"),
    itemName: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called update listing without authentication present");
    }

    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Verify the user owns this listing
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || listing.sellerId !== user._id) {
      throw new Error("Not authorized to update this listing");
    }

    // Remove id from args and update the listing
    const { id, ...updates } = args;
    await ctx.db.patch(args.id, updates);

    return args.id;
  },
});

/**
 * Get listings by seller ID
 */
export const getListingsBySeller = query({
  args: { sellerId: v.id("users") },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_sellerId", (q) => q.eq("sellerId", args.sellerId))
      .order("desc") // Sort by creation time, newest first
      .collect();

    return listings;
  },
});

/**
 * Delete a listing (soft delete by setting isActive to false)
 */
export const deleteListing = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called delete listing without authentication present");
    }

    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    // Verify the user owns this listing
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || listing.sellerId !== user._id) {
      throw new Error("Not authorized to delete this listing");
    }

    // Soft delete by setting isActive to false
    await ctx.db.patch(args.id, { isActive: false });

    return args.id;
  },
});
