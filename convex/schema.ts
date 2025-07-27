import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // =================================================================
  //                     MASTER ITEMS TABLE
  // Stores official item names and categories for consistent listings
  // =================================================================
  masterItems: defineTable({
    name: v.string(), // The official name, e.g., "Onion"
    category: v.string(), // e.g., "Vegetable", "Spice", "Dairy"
    aliases: v.optional(v.array(v.string())), // e.g., ["Pyaz", "Kanda"]
    description: v.optional(v.string()), // Brief description of the item
    imageUrl: v.optional(v.string()), // Image URL for the item
    isActive: v.optional(v.boolean()), // To deactivate items if needed
  })
    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_aliases", { searchField: "aliases" })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  // =================================================================
  //                         USERS TABLE
  // Stores user information including shop details and location
  // =================================================================
  users: defineTable({
    // --- Authentication ---
    tokenIdentifier: v.string(),
    email: v.string(),
    
    // --- Basic Profile ---
    name: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    
    // --- Shop Information ---
    shopName: v.optional(v.string()),
    shopAddress: v.string(),
    shopImage: v.optional(v.string()),
    shopDescription: v.optional(v.string()),
    
    // --- Location ---
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    
    // --- Status & Verification ---
    isVerified: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    accountType: v.optional(v.union(v.literal("vendor"), v.literal("customer"), v.literal("both"))),
    
    // --- Timestamps ---
    lastActiveAt: v.optional(v.number()),
    verifiedAt: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_location", ["latitude", "longitude"])
    .index("by_verified", ["isVerified"])
    .index("by_active", ["isActive"])
    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_shop_name", { searchField: "shopName" })
    .searchIndex("search_shop_address", { searchField: "shopAddress" }),


  // =================================================================
  //                       LISTINGS TABLE
  // Stores item listings with pricing, location, and availability
  // =================================================================
  listings: defineTable({
    // --- Core Information ---
    sellerId: v.id("users"),
    masterItemId: v.id("masterItems"),
    imageUrl: v.string(),
    description: v.string(),
    
    // --- Pricing & Quantity ---
    price: v.number(), // Price in smallest currency unit (cents, paise, etc.)
    currency: v.optional(v.string()), // e.g., "USD", "INR" - defaults to app currency
    quantity: v.number(),
    unit: v.string(), // e.g., "kg", "pieces", "liters", "boxes"
    minQuantity: v.optional(v.number()), // Minimum order quantity
    
    // --- Location ---
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    deliveryRadius: v.optional(v.number()), // Delivery radius in km
    isDeliveryAvailable: v.optional(v.boolean()),
    isPickupAvailable: v.optional(v.boolean()),
    
    // --- Status & Timing ---
    isActive: v.boolean(),
    expiresAt: v.number(),
    availableFrom: v.optional(v.number()), // When item becomes available
    availableUntil: v.optional(v.number()), // Daily availability window end
    
    // --- Additional Details ---
    condition: v.optional(v.union(v.literal("fresh"), v.literal("good"), v.literal("fair"))),
    tags: v.optional(v.array(v.string())), // e.g., ["organic", "local", "premium"]
    notes: v.optional(v.string()), // Additional notes from seller
    
    // --- Metrics ---
    viewCount: v.optional(v.number()),
    inquiryCount: v.optional(v.number()),
    
    // --- Timestamps ---
    lastUpdatedAt: v.optional(v.number()),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_masterItemId", ["masterItemId"])
    .index("by_active", ["isActive"])
    .index("by_location", ["latitude", "longitude"])
    .index("by_price", ["price"])
    .index("by_expiry", ["expiresAt"])
    .index("by_active_expiry", ["isActive", "expiresAt"])
    .searchIndex("search_description", { searchField: "description" })
    .searchIndex("search_tags", { searchField: "tags" }),

  // =================================================================
  //                   PLATFORM PRICES TABLE
  // Tracks prices of items across different e-commerce platforms
  // =================================================================
  platformPrices: defineTable({
    masterItemId: v.id("masterItems"),
    platformName: v.string(), // e.g., "Blinkit", "Zomato", "Amazon Fresh"
    platformLogo: v.optional(v.string()), // Platform logo/emoji
    
    // --- Pricing ---
    price: v.number(), // Price in smallest currency unit (paise)
    originalPrice: v.optional(v.number()), // Original price if discounted
    discountPercentage: v.optional(v.number()),
    unit: v.string(), // e.g., "kg", "pieces", "liters"
    
    // --- Availability ---
    isAvailable: v.boolean(),
    stockStatus: v.optional(v.union(
      v.literal("in_stock"),
      v.literal("low_stock"),
      v.literal("out_of_stock"),
      v.literal("coming_soon")
    )),
    
    // --- Delivery Info ---
    deliveryTime: v.optional(v.string()), // e.g., "10-15 min", "1-2 days"
    deliveryFee: v.optional(v.number()), // Delivery fee in paise
    minimumOrder: v.optional(v.number()), // Minimum order amount
    
    // --- Platform Details ---
    productUrl: v.optional(v.string()), // Direct link to product
    productId: v.optional(v.string()), // Platform's product ID
    category: v.optional(v.string()), // Platform's category
    
    // --- Tracking ---
    lastUpdatedAt: v.number(),
    priceHistory: v.optional(v.array(v.object({
      price: v.number(),
      timestamp: v.number(),
    }))),
    
    // --- Quality Metrics ---
    rating: v.optional(v.number()), // Platform's rating for this item
    reviewCount: v.optional(v.number()),
    
    // --- Regional ---
    region: v.optional(v.string()), // e.g., "Delhi", "Mumbai"
    isActive: v.optional(v.boolean()),
  })
    .index("by_masterItemId", ["masterItemId"])
    .index("by_platform", ["platformName"])
    .index("by_available", ["isAvailable"])
    .index("by_price", ["price"])
    .index("by_lastUpdated", ["lastUpdatedAt"])
    .index("by_masterItem_platform", ["masterItemId", "platformName"])
    .index("by_region", ["region"]),

  // =================================================================
  //                       REVIEWS TABLE
  // Stores ratings and comments to build trust in the community
  // =================================================================
  reviews: defineTable({
    listingId: v.id("listings"),
    reviewerId: v.id("users"), // User writing the review
    revieweeId: v.id("users"), // User being reviewed (seller)
    
    // --- Review Content ---
    rating: v.number(), // 1-5 star rating
    comment: v.optional(v.string()),
    reviewType: v.optional(v.union(v.literal("seller"), v.literal("buyer"))),
    
    // --- Review Categories ---
    qualityRating: v.optional(v.number()), // Product quality
    serviceRating: v.optional(v.number()), // Service quality
    timelinessRating: v.optional(v.number()), // Delivery/pickup timeliness
    
    // --- Status ---
    isVerified: v.optional(v.boolean()), // Verified purchase
    isHidden: v.optional(v.boolean()), // Admin can hide inappropriate reviews
    
    // --- Response ---
    sellerResponse: v.optional(v.string()), // Seller can respond to reviews
    sellerResponseAt: v.optional(v.number()),
  })
    .index("by_revieweeId", ["revieweeId"])
    .index("by_listingId", ["listingId"])
    .index("by_reviewerId", ["reviewerId"])
    .index("by_rating", ["rating"])
    .index("by_verified", ["isVerified"]),

  // =================================================================
  //                         CHATS TABLE
  // Represents conversations between users about listings
  // =================================================================
  chats: defineTable({
    listingId: v.id("listings"),
    participantIds: v.array(v.id("users")), // Always 2 participants
    
    // --- Status ---
    isActive: v.optional(v.boolean()),
    isBlocked: v.optional(v.boolean()),
    blockedBy: v.optional(v.id("users")),
    
    // --- Metadata ---
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()),
    unreadCounts: v.optional(v.record(v.string(), v.number())),
  })
    .index("by_participantIds", ["participantIds"])
    .index("by_listingId", ["listingId"])
    .index("by_lastMessage", ["lastMessageAt"]),

  // =================================================================
  //                       MESSAGES TABLE
  // Stores individual messages within chats
  // =================================================================
  messages: defineTable({
    chatId: v.id("chats"),
    senderId: v.id("users"),
    
    // --- Content ---
    body: v.string(),
    messageType: v.optional(v.union(
      v.literal("text"), 
      v.literal("image"), 
      v.literal("location"),
      v.literal("system")
    )),
    imageUrl: v.optional(v.string()),
    
    // --- Status ---
    isRead: v.optional(v.boolean()),
    readAt: v.optional(v.number()),
    isEdited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
    
    // --- System Messages ---
    systemMessageType: v.optional(v.union(
      v.literal("listing_sold"),
      v.literal("listing_expired"),
      v.literal("chat_started")
    )),
  })
    .index("by_chatId", ["chatId"])
    .index("by_senderId", ["senderId"]),

  // =================================================================
  //                     NOTIFICATIONS TABLE
  // Stores all types of notifications for users
  // =================================================================
  notifications: defineTable({
    // --- Core Info ---
    userId: v.id("users"), // Who receives the notification
    title: v.string(),
    message: v.string(),
    
    // --- Type & Category ---
    type: v.union(
      v.literal("listing_created"),
      v.literal("listing_sold"),
      v.literal("listing_expired"),
      v.literal("order_placed"),
      v.literal("order_accepted"),
      v.literal("order_rejected"),
      v.literal("order_completed"),
      v.literal("contact_request"),
      v.literal("message_received"),
      v.literal("review_received"),
      v.literal("profile_updated"),
      v.literal("system")
    ),
    category: v.optional(v.union(
      v.literal("orders"),
      v.literal("listings"),
      v.literal("messages"),
      v.literal("reviews"),
      v.literal("system")
    )),
    
    // --- Related Data ---
    relatedId: v.optional(v.string()), // ID of related entity (listing, order, etc.)
    relatedType: v.optional(v.union(
      v.literal("listing"),
      v.literal("order"),
      v.literal("chat"),
      v.literal("review"),
      v.literal("user")
    )),
    
    // --- Additional Data ---
    metadata: v.optional(v.record(v.string(), v.any())), // Flexible data storage
    actionUrl: v.optional(v.string()), // URL to navigate when clicked
    
    // --- Status ---
    isRead: v.optional(v.boolean()),
    readAt: v.optional(v.number()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    
    // --- Sender (for notifications from other users) ---
    senderId: v.optional(v.id("users")),
  })
    .index("by_userId", ["userId"])
    .index("by_type", ["type"])
    .index("by_category", ["category"])
    .index("by_read", ["isRead"])
    .index("by_priority", ["priority"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_user_type", ["userId", "type"]),

  // =================================================================
  //                        ORDERS TABLE
  // Manages orders/inquiries between buyers and sellers
  // =================================================================
  orders: defineTable({
    // --- Core Info ---
    listingId: v.id("listings"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    masterItemId: v.id("masterItems"),
    
    // --- Order Details ---
    quantity: v.number(),
    unit: v.string(),
    pricePerUnit: v.number(), // Price agreed upon
    totalAmount: v.number(),
    
    // --- Contact & Delivery ---
    contactMethod: v.union(
      v.literal("pickup"),
      v.literal("delivery"),
      v.literal("both")
    ),
    deliveryAddress: v.optional(v.string()),
    pickupLocation: v.optional(v.string()),
    preferredTime: v.optional(v.string()),
    
    // --- Messages ---
    buyerMessage: v.optional(v.string()), // Initial message from buyer
    sellerResponse: v.optional(v.string()), // Seller's response
    
    // --- Status ---
    status: v.union(
      v.literal("pending"), // Waiting for seller response
      v.literal("accepted"), // Seller accepted
      v.literal("rejected"), // Seller rejected
      v.literal("completed"), // Transaction completed
      v.literal("cancelled") // Cancelled by either party
    ),
    
    // --- Timestamps ---
    respondedAt: v.optional(v.number()), // When seller responded
    completedAt: v.optional(v.number()), // When order was completed
    
    // --- Contact Info ---
    buyerPhone: v.optional(v.string()),
    buyerName: v.optional(v.string()),
    
    // --- Additional Notes ---
    rejectionReason: v.optional(v.string()),
    completionNotes: v.optional(v.string()),
  })
    .index("by_listingId", ["listingId"])
    .index("by_buyerId", ["buyerId"])
    .index("by_sellerId", ["sellerId"])
    .index("by_status", ["status"])
    .index("by_seller_status", ["sellerId", "status"])
    .index("by_buyer_status", ["buyerId", "status"]),
});
