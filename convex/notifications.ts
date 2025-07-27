import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create a new notification
 */
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
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
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.union(
      v.literal("listing"),
      v.literal("order"),
      v.literal("chat"),
      v.literal("review"),
      v.literal("user")
    )),
    metadata: v.optional(v.record(v.string(), v.any())),
    actionUrl: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    senderId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      title: args.title,
      message: args.message,
      type: args.type,
      category: args.category,
      relatedId: args.relatedId,
      relatedType: args.relatedType,
      metadata: args.metadata,
      actionUrl: args.actionUrl,
      isRead: false,
      priority: args.priority || "medium",
      senderId: args.senderId,
    });

    return notificationId;
  },
});

/**
 * Get notifications for a user
 */
export const getUserNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    onlyUnread: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.onlyUnread) {
      query = ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) => 
          q.eq("userId", args.userId).eq("isRead", false)
        )
        .order("desc");
    }

    const notifications = await query.take(args.limit || 50);

    // Get sender details for notifications from other users
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        let sender = null;
        if (notification.senderId) {
          sender = await ctx.db.get(notification.senderId);
        }

        return {
          ...notification,
          sender: sender ? {
            _id: sender._id,
            name: sender.name,
            imageUrl: sender.imageUrl,
            shopName: sender.shopName,
          } : null,
        };
      })
    );

    return enrichedNotifications;
  },
});

/**
 * Mark notification as read
 */
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Verify this notification belongs to the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || notification.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => 
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    const now = Date.now();
    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, {
          isRead: true,
          readAt: now,
        })
      )
    );

    return { success: true, markedCount: unreadNotifications.length };
  },
});

/**
 * Get unread notification count
 */
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

/**
 * Delete notification
 */
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Verify this notification belongs to the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || notification.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.notificationId);

    return { success: true };
  },
});

/**
 * Helper function to create listing created notification
 */
export const notifyListingCreated = internalMutation({
  args: {
    sellerId: v.id("users"),
    listingId: v.id("listings"),
    itemName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.sellerId,
      title: "✅ Listing Created Successfully!",
      message: `Your surplus ${args.itemName} listing has been created and is now live.`,
      type: "listing_created",
      category: "listings",
      relatedId: args.listingId,
      relatedType: "listing",
      actionUrl: `/listing/${args.listingId}`,
      isRead: false,
      priority: "medium",
    });
  },
});

/**
 * Helper function to create order placed notification
 */
export const notifyOrderPlaced = internalMutation({
  args: {
    sellerId: v.id("users"),
    buyerId: v.id("users"),
    orderId: v.id("orders"),
    itemName: v.string(),
    quantity: v.number(),
    unit: v.string(),
  },
  handler: async (ctx, args) => {
    // Notify seller about new order
    await ctx.db.insert("notifications", {
      userId: args.sellerId,
      title: "🛒 New Order Received!",
      message: `Someone wants to buy ${args.quantity} ${args.unit} of ${args.itemName}. Please review and respond.`,
      type: "order_placed",
      category: "orders",
      relatedId: args.orderId,
      relatedType: "order",
      actionUrl: `/profile/orders`,
      isRead: false,
      priority: "high",
      senderId: args.buyerId,
    });

    // Notify buyer about order placement
    await ctx.db.insert("notifications", {
      userId: args.buyerId,
      title: "📦 Order Placed Successfully!",
      message: `Your order for ${args.quantity} ${args.unit} of ${args.itemName} has been sent to the seller. You'll be notified when they respond.`,
      type: "order_placed",
      category: "orders",
      relatedId: args.orderId,
      relatedType: "order",
      actionUrl: `/profile/orders`,
      isRead: false,
      priority: "medium",
    });
  },
});

/**
 * Helper function to create order response notifications
 */
export const notifyOrderResponse = internalMutation({
  args: {
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    orderId: v.id("orders"),
    itemName: v.string(),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
    sellerMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isAccepted = args.status === "accepted";
    
    await ctx.db.insert("notifications", {
      userId: args.buyerId,
      title: isAccepted ? "✅ Order Accepted!" : "❌ Order Declined",
      message: isAccepted 
        ? `Great news! The seller has accepted your order for ${args.itemName}. ${args.sellerMessage ? `Message: "${args.sellerMessage}"` : 'Check your orders for next steps.'}`
        : `Unfortunately, your order for ${args.itemName} has been declined. ${args.sellerMessage ? `Reason: "${args.sellerMessage}"` : 'You can try contacting other sellers.'}`,
      type: isAccepted ? "order_accepted" : "order_rejected",
      category: "orders",
      relatedId: args.orderId,
      relatedType: "order",
      actionUrl: `/profile/orders`,
      isRead: false,
      priority: "high",
      senderId: args.sellerId,
    });
  },
});
