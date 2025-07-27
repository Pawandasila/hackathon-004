import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get platform prices for a specific master item
export const getByMasterItem = query({
  args: { masterItemId: v.id("masterItems") },
  handler: async (ctx, args) => {
    const prices = await ctx.db
      .query("platformPrices")
      .withIndex("by_masterItemId", (q) => q.eq("masterItemId", args.masterItemId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();

    return prices.sort((a, b) => a.price - b.price); // Sort by price ascending
  },
});

// Get all platform prices (for admin/debugging)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const prices = await ctx.db
      .query("platformPrices")
      .withIndex("by_lastUpdated")
      .order("desc")
      .take(100); // Limit for performance

    return prices;
  },
});

// Get prices by platform
export const getByPlatform = query({
  args: { 
    platformName: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const prices = await ctx.db
      .query("platformPrices")
      .withIndex("by_platform", (q) => q.eq("platformName", args.platformName))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(args.limit || 50);

    return prices;
  },
});

// Update or create a platform price
export const upsertPrice = mutation({
  args: {
    masterItemId: v.id("masterItems"),
    platformName: v.string(),
    platformLogo: v.optional(v.string()),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    discountPercentage: v.optional(v.number()),
    unit: v.string(),
    isAvailable: v.boolean(),
    stockStatus: v.optional(v.union(
      v.literal("in_stock"),
      v.literal("low_stock"),
      v.literal("out_of_stock"),
      v.literal("coming_soon")
    )),
    deliveryTime: v.optional(v.string()),
    deliveryFee: v.optional(v.number()),
    minimumOrder: v.optional(v.number()),
    productUrl: v.optional(v.string()),
    productId: v.optional(v.string()),
    category: v.optional(v.string()),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if price already exists for this master item and platform
    const existing = await ctx.db
      .query("platformPrices")
      .withIndex("by_masterItem_platform", (q) => 
        q.eq("masterItemId", args.masterItemId).eq("platformName", args.platformName)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing price and add to price history
      const priceHistory = existing.priceHistory || [];
      if (existing.price !== args.price) {
        priceHistory.push({
          price: existing.price,
          timestamp: existing.lastUpdatedAt,
        });
        // Keep only last 30 price points
        if (priceHistory.length > 30) {
          priceHistory.splice(0, priceHistory.length - 30);
        }
      }

      await ctx.db.patch(existing._id, {
        ...args,
        lastUpdatedAt: now,
        priceHistory,
        isActive: true,
      });

      return existing._id;
    } else {
      // Create new price entry
      const priceId = await ctx.db.insert("platformPrices", {
        ...args,
        lastUpdatedAt: now,
        priceHistory: [],
        isActive: true,
      });

      return priceId;
    }
  },
});

// Get price comparison for a master item (formatted for UI)
export const getPriceComparison = query({
  args: { 
    masterItemId: v.id("masterItems"),
    userPrice: v.optional(v.number()) // Price from local seller
  },
  handler: async (ctx, args) => {
    const platformPrices = await ctx.db
      .query("platformPrices")
      .withIndex("by_masterItemId", (q) => q.eq("masterItemId", args.masterItemId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get master item details
    const masterItem = await ctx.db.get(args.masterItemId);
    
    const comparison = platformPrices.map(price => ({
      platform: price.platformName,
      logo: price.platformLogo || "🛒",
      price: price.price,
      originalPrice: price.originalPrice,
      discountPercentage: price.discountPercentage,
      unit: price.unit,
      isAvailable: price.isAvailable,
      deliveryTime: price.deliveryTime || "Unknown",
      deliveryFee: price.deliveryFee,
      minimumOrder: price.minimumOrder,
      rating: price.rating,
      reviewCount: price.reviewCount,
      stockStatus: price.stockStatus,
      pricePerUnit: price.price, // Can be calculated differently based on unit conversions
      savingsFromUser: args.userPrice ? ((price.price - args.userPrice) / args.userPrice * 100) : null,
    }));

    // Sort by price (available items first, then by price)
    comparison.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return a.price - b.price;
    });

    return {
      masterItem,
      platforms: comparison,
      cheapestPrice: comparison.find(p => p.isAvailable)?.price,
      mostExpensivePrice: comparison.filter(p => p.isAvailable).length > 0 
        ? Math.max(...comparison.filter(p => p.isAvailable).map(p => p.price))
        : undefined,
      averagePrice: comparison.filter(p => p.isAvailable).length > 0
        ? comparison.filter(p => p.isAvailable).reduce((sum, p) => sum + p.price, 0) / comparison.filter(p => p.isAvailable).length
        : undefined,
      totalPlatforms: comparison.length,
      availablePlatforms: comparison.filter(p => p.isAvailable).length,
    };
  },
});

// Bulk update prices (for admin/scraping)
export const bulkUpdatePrices = mutation({
  args: {
    updates: v.array(v.object({
      masterItemId: v.id("masterItems"),
      platformName: v.string(),
      platformLogo: v.optional(v.string()),
      price: v.number(),
      originalPrice: v.optional(v.number()),
      discountPercentage: v.optional(v.number()),
      unit: v.string(),
      isAvailable: v.boolean(),
      stockStatus: v.optional(v.union(
        v.literal("in_stock"),
        v.literal("low_stock"),
        v.literal("out_of_stock"),
        v.literal("coming_soon")
      )),
      deliveryTime: v.optional(v.string()),
      deliveryFee: v.optional(v.number()),
      minimumOrder: v.optional(v.number()),
      rating: v.optional(v.number()),
      reviewCount: v.optional(v.number()),
      region: v.optional(v.string()),
    }))
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const update of args.updates) {
      try {
        // Call the upsert logic directly instead of using runMutation
        const existing = await ctx.db
          .query("platformPrices")
          .withIndex("by_masterItem_platform", (q) => 
            q.eq("masterItemId", update.masterItemId).eq("platformName", update.platformName)
          )
          .first();

        const now = Date.now();

        if (existing) {
          // Update existing price
          await ctx.db.patch(existing._id, {
            ...update,
            lastUpdatedAt: now,
            isActive: true,
          });
          results.push({ success: true, priceId: existing._id, platform: update.platformName });
        } else {
          // Create new price entry
          const priceId = await ctx.db.insert("platformPrices", {
            ...update,
            lastUpdatedAt: now,
            priceHistory: [],
            isActive: true,
          });
          results.push({ success: true, priceId, platform: update.platformName });
        }
      } catch (error: any) {
        results.push({ success: false, error: error.message, platform: update.platformName });
      }
    }

    return results;
  },
});
