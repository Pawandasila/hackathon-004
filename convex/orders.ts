import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Create a new order/contact request
 */
export const createOrder = mutation({
  args: {
    listingId: v.id("listings"),
    quantity: v.number(),
    contactMethod: v.union(
      v.literal("pickup"),
      v.literal("delivery"),
      v.literal("both")
    ),
    deliveryAddress: v.optional(v.string()),
    preferredTime: v.optional(v.string()),
    buyerMessage: v.optional(v.string()),
    buyerPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the buyer
    const buyer = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!buyer) {
      throw new Error("Buyer not found");
    }

    // Get the listing
    const listing = await ctx.db.get(args.listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    if (!listing.isActive) {
      throw new Error("Listing is no longer active");
    }

    // Get seller details
    const seller = await ctx.db.get(listing.sellerId);
    if (!seller) {
      throw new Error("Seller not found");
    }

    // Check if buyer is trying to order from themselves
    if (buyer._id === seller._id) {
      throw new Error("You cannot order from your own listing");
    }

    // Check if there's already a pending order for this listing from this buyer
    const existingOrder = await ctx.db
      .query("orders")
      .withIndex("by_buyer_status", (q) => 
        q.eq("buyerId", buyer._id).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("listingId"), args.listingId))
      .first();

    if (existingOrder) {
      throw new Error("You already have a pending order for this listing");
    }

    // Validate quantity
    if (args.quantity <= 0 || args.quantity > listing.quantity) {
      throw new Error("Invalid quantity requested");
    }

    // Create the order
    const orderId = await ctx.db.insert("orders", {
      listingId: args.listingId,
      buyerId: buyer._id,
      sellerId: listing.sellerId,
      masterItemId: listing.masterItemId,
      quantity: args.quantity,
      unit: listing.unit,
      pricePerUnit: listing.price,
      totalAmount: listing.price * args.quantity,
      contactMethod: args.contactMethod,
      deliveryAddress: args.deliveryAddress,
      preferredTime: args.preferredTime,
      buyerMessage: args.buyerMessage,
      buyerPhone: args.buyerPhone || buyer.phone,
      buyerName: buyer.name,
      status: "pending",
    });

    // Get master item for notifications
    const masterItem = await ctx.db.get(listing.masterItemId);
    const itemName = masterItem?.name || "item";

    // Send notifications
    await ctx.runMutation(internal.notifications.notifyOrderPlaced, {
      sellerId: listing.sellerId,
      buyerId: buyer._id,
      orderId: orderId,
      itemName: itemName,
      quantity: args.quantity,
      unit: listing.unit,
    });

    return { orderId, success: true };
  },
});

/**
 * Get orders for a user (both as buyer and seller)
 */
export const getUserOrders = query({
  args: {
    type: v.optional(v.union(v.literal("buyer"), v.literal("seller"), v.literal("all"))),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
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

    console.log("getUserOrders called with:", { type: args.type, status: args.status, userId: user._id });

    let orders = [];

    // Get orders as buyer
    if (!args.type || args.type === "buyer" || args.type === "all") {
      let buyerQuery;
      
      if (args.status) {
        buyerQuery = ctx.db
          .query("orders")
          .withIndex("by_buyer_status", (q) => 
            q.eq("buyerId", user._id).eq("status", args.status!)
          );
      } else {
        buyerQuery = ctx.db
          .query("orders")
          .withIndex("by_buyerId", (q) => q.eq("buyerId", user._id));
      }

      const buyerOrders = await buyerQuery.order("desc").collect();
      console.log("Buyer orders found:", buyerOrders.length);
      orders.push(...buyerOrders.map(order => ({ ...order, userRole: "buyer" as const })));
    }

    // Get orders as seller
    if (!args.type || args.type === "seller" || args.type === "all") {
      let sellerQuery;
      
      if (args.status) {
        sellerQuery = ctx.db
          .query("orders")
          .withIndex("by_seller_status", (q) => 
            q.eq("sellerId", user._id).eq("status", args.status!)
          );
        console.log("Querying seller orders with status:", args.status);
      } else {
        sellerQuery = ctx.db
          .query("orders")
          .withIndex("by_sellerId", (q) => q.eq("sellerId", user._id));
        console.log("Querying all seller orders");
      }

      const sellerOrders = await sellerQuery.order("desc").collect();
      console.log("Seller orders found:", sellerOrders.length, "with statuses:", sellerOrders.map(o => o.status));
      orders.push(...sellerOrders.map(order => ({ ...order, userRole: "seller" as const })));
    }

    console.log("Total orders before enrichment:", orders.length);

    // Sort by creation time
    orders.sort((a, b) => b._creationTime - a._creationTime);

    // Enrich with additional data
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const [listing, masterItem, buyer, seller] = await Promise.all([
          ctx.db.get(order.listingId),
          ctx.db.get(order.masterItemId),
          ctx.db.get(order.buyerId),
          ctx.db.get(order.sellerId),
        ]);

        return {
          ...order,
          listing: listing ? {
            _id: listing._id,
            imageUrl: listing.imageUrl,
            description: listing.description,
            isActive: listing.isActive,
          } : null,
          masterItem: masterItem ? {
            _id: masterItem._id,
            name: masterItem.name,
            category: masterItem.category,
            imageUrl: masterItem.imageUrl,
          } : null,
          buyer: buyer ? {
            _id: buyer._id,
            name: buyer.name,
            phone: buyer.phone,
            shopName: buyer.shopName,
            imageUrl: buyer.imageUrl,
          } : null,
          seller: seller ? {
            _id: seller._id,
            name: seller.name,
            phone: seller.phone,
            shopName: seller.shopName,
            shopAddress: seller.shopAddress,
            imageUrl: seller.imageUrl,
          } : null,
        };
      })
    );

    return enrichedOrders;
  },
});

/**
 * Respond to an order (accept/reject)
 */
export const respondToOrder = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
    sellerResponse: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Verify this is the seller of the order
    if (order.sellerId !== user._id) {
      throw new Error("Unauthorized: You can only respond to your own orders");
    }

    // Check if order is still pending
    if (order.status !== "pending") {
      throw new Error("Order has already been responded to");
    }

    // Update the order
    await ctx.db.patch(args.orderId, {
      status: args.status,
      sellerResponse: args.sellerResponse,
      rejectionReason: args.status === "rejected" ? args.rejectionReason : undefined,
      respondedAt: Date.now(),
    });

    // Get master item for notification
    const masterItem = await ctx.db.get(order.masterItemId);
    const itemName = masterItem?.name || "item";

    // Send notification to buyer
    await ctx.runMutation(internal.notifications.notifyOrderResponse, {
      buyerId: order.buyerId,
      sellerId: user._id,
      orderId: args.orderId,
      itemName: itemName,
      status: args.status,
      sellerMessage: args.sellerResponse,
    });

    return { success: true };
  },
});

/**
 * Mark order as completed
 */
export const completeOrder = mutation({
  args: {
    orderId: v.id("orders"),
    completionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Only seller or buyer can mark as completed
    if (order.sellerId !== user._id && order.buyerId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Order must be accepted first
    if (order.status !== "accepted") {
      throw new Error("Order must be accepted before it can be completed");
    }

    // Update the order
    await ctx.db.patch(args.orderId, {
      status: "completed",
      completedAt: Date.now(),
      completionNotes: args.completionNotes,
    });

    // Get master item for notification
    const masterItem = await ctx.db.get(order.masterItemId);
    const itemName = masterItem?.name || "item";

    // Notify both parties
    const otherUserId = user._id === order.sellerId ? order.buyerId : order.sellerId;
    await ctx.db.insert("notifications", {
      userId: otherUserId,
      title: "✅ Order Completed!",
      message: `The order for ${itemName} has been marked as completed. ${args.completionNotes ? `Notes: "${args.completionNotes}"` : ''}`,
      type: "order_completed",
      category: "orders",
      relatedId: args.orderId,
      relatedType: "order",
      actionUrl: `/profile/orders`,
      isRead: false,
      priority: "medium",
      senderId: user._id,
    });

    return { success: true };
  },
});

/**
 * Cancel an order
 */
export const cancelOrder = mutation({
  args: {
    orderId: v.id("orders"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Only buyer or seller can cancel
    if (order.sellerId !== user._id && order.buyerId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Can't cancel completed orders
    if (order.status === "completed") {
      throw new Error("Cannot cancel completed orders");
    }

    // Update the order
    await ctx.db.patch(args.orderId, {
      status: "cancelled",
      rejectionReason: args.reason,
      respondedAt: Date.now(),
    });

    // Get master item for notification
    const masterItem = await ctx.db.get(order.masterItemId);
    const itemName = masterItem?.name || "item";

    // Notify the other party
    const otherUserId = user._id === order.sellerId ? order.buyerId : order.sellerId;
    const isSeller = user._id === order.sellerId;

    await ctx.db.insert("notifications", {
      userId: otherUserId,
      title: "❌ Order Cancelled",
      message: `The ${isSeller ? 'seller' : 'buyer'} has cancelled the order for ${itemName}. ${args.reason ? `Reason: "${args.reason}"` : ''}`,
      type: "order_rejected",
      category: "orders",
      relatedId: args.orderId,
      relatedType: "order",
      actionUrl: `/profile/orders`,
      isRead: false,
      priority: "medium",
      senderId: user._id,
    });

    return { success: true };
  },
});

/**
 * Get pending orders count for seller
 */
export const getPendingOrdersCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return 0;
    }

    const pendingOrders = await ctx.db
      .query("orders")
      .withIndex("by_seller_status", (q) => 
        q.eq("sellerId", user._id).eq("status", "pending")
      )
      .collect();

    return pendingOrders.length;
  },
});

/**
 * Debug: Get all orders (for troubleshooting)
 */
export const getAllOrdersDebug = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { error: "Not authenticated" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return { error: "User not found" };
    }

    const allOrders = await ctx.db.query("orders").collect();
    const mySellerOrders = allOrders.filter(order => order.sellerId === user._id);
    const myBuyerOrders = allOrders.filter(order => order.buyerId === user._id);

    return {
      userId: user._id,
      userName: user.name,
      allOrdersCount: allOrders.length,
      mySellerOrdersCount: mySellerOrders.length,
      myBuyerOrdersCount: myBuyerOrders.length,
      sellerOrders: mySellerOrders.map(o => ({ 
        _id: o._id, 
        status: o.status, 
        _creationTime: o._creationTime,
        buyerId: o.buyerId,
        sellerId: o.sellerId
      })),
      buyerOrders: myBuyerOrders.map(o => ({ 
        _id: o._id, 
        status: o.status, 
        _creationTime: o._creationTime,
        buyerId: o.buyerId,
        sellerId: o.sellerId
      })),
    };
  },
});
