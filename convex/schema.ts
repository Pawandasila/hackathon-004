import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),

    // --- Personal Information ---
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),

    // --- Profile & Verification ---
    imageUrl: v.optional(v.string()), // User's profile picture
    shopName: v.optional(v.string()), // Shop/Business name
    shopAddress: v.string(),
    shopImage: v.optional(v.string()),
    isVerified: v.optional(v.boolean()),

    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),

    lastActiveAt: v.optional(v.number()),
  })
    // --- Indexes ---
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])

    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_shopAddress", { searchField: "shopAddress" }),


    // =================================================================
  //                       LISTING TABLE
  // =================================================================

  listings: defineTable({
    sellerId: v.id("users"),
    itemName: v.string(),
    imageUrl: v.string(),
    description: v.string(),

    quantity: v.number(),
    unit: v.string(), // e.g., "Pieces", "kg", "Serving", "Container"
    price: v.number(),

    // --- Location of the item ---
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),

    // --- Status ---
    isActive: v.boolean(), // True if available, false if sold/removed
    expiresAt: v.number(), // Added this field
  }).index("by_sellerId", ["sellerId"]), // To quickly find all listings by a user

  // =================================================================
  //                       REVIEWS TABLE
  // Stores ratings and comments to build trust in the community.
  // =================================================================
  reviews: defineTable({
    listingId: v.id("listings"), // Links review to a specific transaction
    reviewerId: v.id("users"), // The user writing the review
    revieweeId: v.id("users"), // The user being reviewed

    rating: v.number(),
    comment: v.optional(v.string()),
  })
    .index("by_revieweeId", ["revieweeId"]) // To quickly fetch all reviews for a user
    .index("by_listingId", ["listingId"]),

  // =================================================================
  //                         CHATS TABLE
  // Represents a conversation between two users about a listing.
  // =================================================================
  chats: defineTable({
    listingId: v.id("listings"),
    participantIds: v.array(v.id("users")),
  }).index("by_participantIds", ["participantIds"]),

  // =================================================================
  //                       MESSAGES TABLE
  // Stores the individual messages within each chat.
  // =================================================================
  messages: defineTable({
    chatId: v.id("chats"), // Links message to a specific chat
    senderId: v.id("users"), // The user who sent the message
    body: v.string(), // The text content of the message
  }).index("by_chatId", ["chatId"]), // To quickly fetch all messages for a chat
});
