import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export type MasterItem = {
  _id: Id<"masterItems">;
  _creationTime: number;
  name: string;
  category: string;
  aliases?: string[];
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
};

/**
 * Create a new master item
 */
export const create = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    aliases: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if item already exists
    const existing = await ctx.db
      .query("masterItems")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      throw new Error(`Item "${args.name}" already exists`);
    }

    const itemId = await ctx.db.insert("masterItems", {
      name: args.name,
      category: args.category,
      aliases: args.aliases,
      description: args.description,
      imageUrl: args.imageUrl,
      isActive: true,
    });

    return itemId;
  },
});

/**
 * Get all master items
 */
export const getAll = query({
  handler: async (ctx) => {
    // First, check if there are any items at all
    const allItems = await ctx.db.query("masterItems").collect();
    
    // If no items exist, let's return a helpful message
    if (allItems.length === 0) {
      return [];
    }
    
    // Check for active items
    const activeItems = await ctx.db
      .query("masterItems")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // If we have items but none are active, return all items
    if (activeItems.length === 0) {
      return allItems;
    }
    
    return activeItems;
  },
});

/**
 * Get master item by ID
 */
export const getById = query({
  args: { id: v.id("masterItems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Debug function to check master items count
 */
export const getCount = query({
  handler: async (ctx) => {
    const allItems = await ctx.db.query("masterItems").collect();
    const activeItems = await ctx.db
      .query("masterItems")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return {
      total: allItems.length,
      active: activeItems.length,
      items: allItems.map(item => ({ 
        name: item.name, 
        category: item.category, 
        isActive: item.isActive 
      }))
    };
  },
});

/**
 * Quick seed function to add basic items
 */
export const quickSeed = mutation({
  handler: async (ctx) => {
    const basicItems = [
      { name: "Onion", category: "Vegetable", isActive: true },
      { name: "Tomato", category: "Vegetable", isActive: true },
      { name: "Potato", category: "Vegetable", isActive: true },
      { name: "Apple", category: "Fruit", isActive: true },
      { name: "Banana", category: "Fruit", isActive: true },
    ];

    const created = [];
    for (const item of basicItems) {
      const existing = await ctx.db
        .query("masterItems")
        .filter((q) => q.eq(q.field("name"), item.name))
        .first();

      if (!existing) {
        const itemId = await ctx.db.insert("masterItems", item);
        created.push(itemId);
      }
    }

    return { created: created.length, items: basicItems.map(i => i.name) };
  },
});

/**
 * Get master items by category
 */
export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("masterItems")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

/**
 * Search master items by name or aliases
 */
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    // Search by name
    const nameResults = await ctx.db
      .query("masterItems")
      .withSearchIndex("search_name", (q) => q.search("name", args.searchTerm))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(10);

    // Search by aliases
    const aliasResults = await ctx.db
      .query("masterItems")
      .withSearchIndex("search_aliases", (q) => q.search("aliases", args.searchTerm))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(10);

    // Combine and deduplicate results
    const allResults = [...nameResults, ...aliasResults];
    const uniqueResults = allResults.filter(
      (item, index, self) => index === self.findIndex((t) => t._id === item._id)
    );

    return uniqueResults;
  },
});

/**
 * Seed initial master items (for development/setup)
 */
export const seedInitialItems = mutation({
  handler: async (ctx) => {
    const initialItems = [
      // Vegetables
      { name: "Onion", category: "Vegetable", aliases: ["Pyaz", "Kanda"] },
      { name: "Tomato", category: "Vegetable", aliases: ["Tamatar"] },
      { name: "Potato", category: "Vegetable", aliases: ["Aloo", "Batata"] },
      { name: "Carrot", category: "Vegetable", aliases: ["Gajar"] },
      { name: "Capsicum", category: "Vegetable", aliases: ["Bell Pepper", "Shimla Mirch"] },
      
      // Fruits
      { name: "Apple", category: "Fruit", aliases: ["Seb"] },
      { name: "Banana", category: "Fruit", aliases: ["Kela"] },
      { name: "Orange", category: "Fruit", aliases: ["Santra"] },
      { name: "Mango", category: "Fruit", aliases: ["Aam"] },
      
      // Spices
      { name: "Turmeric", category: "Spice", aliases: ["Haldi"] },
      { name: "Cumin", category: "Spice", aliases: ["Jeera"] },
      { name: "Coriander", category: "Spice", aliases: ["Dhania"] },
      
      // Dairy
      { name: "Milk", category: "Dairy", aliases: ["Doodh"] },
      { name: "Yogurt", category: "Dairy", aliases: ["Dahi", "Curd"] },
      { name: "Cheese", category: "Dairy", aliases: ["Paneer"] },
      
      // Grains
      { name: "Rice", category: "Grain", aliases: ["Chawal"] },
      { name: "Wheat", category: "Grain", aliases: ["Gehun"] },
      { name: "Lentils", category: "Grain", aliases: ["Dal", "Masoor"] },
    ];

    const createdItems = [];
    for (const item of initialItems) {
      // Check if item already exists
      const existing = await ctx.db
        .query("masterItems")
        .filter((q) => q.eq(q.field("name"), item.name))
        .first();

      if (!existing) {
        const itemId = await ctx.db.insert("masterItems", {
          ...item,
          isActive: true,
        });
        createdItems.push(itemId);
      }
    }

    return { created: createdItems.length, total: initialItems.length };
  },
});

/**
 * Update a master item
 */
export const update = mutation({
  args: {
    id: v.id("masterItems"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    aliases: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});
