import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Seed master items with comprehensive Indian grocery items.
 * This function is safe to run multiple times; it won't create duplicates.
 */
export const seedMasterItems = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if we already have master items
    const existingItems = await ctx.db.query("masterItems").collect();
    if (existingItems.length > 0) {
      console.log("Master items already exist, skipping seed");
      return { message: "Master items already exist", count: existingItems.length };
    }

    const masterItems = [
      // Vegetables
      { 
        name: "Onion", 
        category: "Vegetable", 
        aliases: ["Pyaz", "Kanda"], 
        description: "Fresh red onions, essential for Indian cooking",
        imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?w=300",
        isActive: true 
      },
      { 
        name: "Potato", 
        category: "Vegetable", 
        aliases: ["Aloo", "Batata"], 
        description: "Versatile potatoes, perfect for curries and snacks",
        imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300",
        isActive: true 
      },
      { 
        name: "Tomato", 
        category: "Vegetable", 
        aliases: ["Tamatar"], 
        description: "Juicy red tomatoes, rich in vitamins",
        imageUrl: "https://images.unsplash.com/photo-1546470427-227f88b8f999?w=300",
        isActive: true 
      },
      { 
        name: "Carrot", 
        category: "Vegetable", 
        aliases: ["Gajar"], 
        description: "Crunchy orange carrots, high in beta-carotene",
        imageUrl: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300",
        isActive: true 
      },
      { 
        name: "Cabbage", 
        category: "Vegetable", 
        aliases: ["Patta Gobi"], 
        description: "Fresh green cabbage, great for salads and cooking",
        imageUrl: "https://images.unsplash.com/photo-1594282486868-4cd846573524?w=300",
        isActive: true 
      },
      { 
        name: "Cauliflower", 
        category: "Vegetable", 
        aliases: ["Phool Gobi"], 
        description: "White cauliflower heads, versatile vegetable",
        imageUrl: "https://images.unsplash.com/photo-1568584711271-35691d8b67d1?w=300",
        isActive: true 
      },
      { 
        name: "Green Beans", 
        category: "Vegetable", 
        aliases: ["French Beans", "Sem"], 
        description: "Tender green beans, rich in fiber",
        imageUrl: "https://images.unsplash.com/photo-1586185092905-5ada9f3b8c52?w=300",
        isActive: true 
      },
      { 
        name: "Bell Pepper", 
        category: "Vegetable", 
        aliases: ["Capsicum", "Shimla Mirch"], 
        description: "Colorful bell peppers, sweet and crunchy",
        imageUrl: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=300",
        isActive: true 
      },
      { 
        name: "Spinach", 
        category: "Vegetable", 
        aliases: ["Palak"], 
        description: "Fresh green spinach leaves, iron-rich",
        imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300",
        isActive: true 
      },
      { 
        name: "Cucumber", 
        category: "Vegetable", 
        aliases: ["Kheera"], 
        description: "Cool and refreshing cucumbers",
        imageUrl: "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=300",
        isActive: true 
      },

      // Fruits
      { 
        name: "Apple", 
        category: "Fruit", 
        aliases: ["Seb"], 
        description: "Crisp red apples, a healthy snack",
        imageUrl: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=300",
        isActive: true 
      },
      { 
        name: "Banana", 
        category: "Fruit", 
        aliases: ["Kela"], 
        description: "Sweet yellow bananas, potassium-rich",
        imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300",
        isActive: true 
      },
      { 
        name: "Orange", 
        category: "Fruit", 
        aliases: ["Santra"], 
        description: "Juicy oranges, packed with Vitamin C",
        imageUrl: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=300",
        isActive: true 
      },
      { 
        name: "Mango", 
        category: "Fruit", 
        aliases: ["Aam"], 
        description: "Sweet tropical mangoes, king of fruits",
        imageUrl: "https://images.unsplash.com/photo-1553279585-b9da08f775dc?w=300",
        isActive: true 
      },
      { 
        name: "Grapes", 
        category: "Fruit", 
        aliases: ["Angoor"], 
        description: "Sweet purple grapes, perfect for snacking",
        imageUrl: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=300",
        isActive: true 
      },
      { 
        name: "Pineapple", 
        category: "Fruit", 
        aliases: ["Ananas"], 
        description: "Tropical pineapple, sweet and tangy",
        imageUrl: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=300",
        isActive: true 
      },
      { 
        name: "Watermelon", 
        category: "Fruit", 
        aliases: ["Tarbooz"], 
        description: "Refreshing watermelon, perfect for summer",
        imageUrl: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=300",
        isActive: true 
      },
      { 
        name: "Papaya", 
        category: "Fruit", 
        aliases: ["Papita"], 
        description: "Sweet orange papaya, aids digestion",
        imageUrl: "https://images.unsplash.com/photo-1617112848923-cc2234396a7d?w=300",
        isActive: true 
      },
      { 
        name: "Pomegranate", 
        category: "Fruit", 
        aliases: ["Anar"], 
        description: "Ruby red pomegranate, antioxidant-rich",
        imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300",
        isActive: true 
      },
      { 
        name: "Guava", 
        category: "Fruit", 
        aliases: ["Amrud"], 
        description: "Fresh guava, vitamin C powerhouse",
        imageUrl: "https://images.unsplash.com/photo-1536511132770-e5058c4e8c66?w=300",
        isActive: true 
      },

      // Dairy
      { 
        name: "Milk", 
        category: "Dairy", 
        aliases: ["Doodh"], 
        description: "Fresh cow milk, calcium-rich",
        imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300",
        isActive: true 
      },
      { 
        name: "Yogurt", 
        category: "Dairy", 
        aliases: ["Dahi", "Curd"], 
        description: "Creamy yogurt, probiotic-rich",
        imageUrl: "https://images.unsplash.com/photo-1488477304112-4944851de03d?w=300",
        isActive: true 
      },
      { 
        name: "Paneer", 
        category: "Dairy", 
        aliases: ["Cottage Cheese"], 
        description: "Fresh paneer, protein-rich cheese",
        imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300",
        isActive: true 
      },
      { 
        name: "Butter", 
        category: "Dairy", 
        aliases: ["Makhan"], 
        description: "Creamy butter, perfect for cooking",
        imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300",
        isActive: true 
      },
      { 
        name: "Cheese", 
        category: "Dairy", 
        aliases: ["Processed Cheese"], 
        description: "Processed cheese slices",
        imageUrl: "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=300",
        isActive: true 
      },

      // Grains & Pulses
      { 
        name: "Rice", 
        category: "Grains", 
        aliases: ["Chawal"], 
        description: "Premium basmati rice, long grain",
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300",
        isActive: true 
      },
      { 
        name: "Wheat Flour", 
        category: "Grains", 
        aliases: ["Atta", "Gehun ka Atta"], 
        description: "Whole wheat flour for rotis",
        imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300",
        isActive: true 
      },
      { 
        name: "Lentils", 
        category: "Pulses", 
        aliases: ["Dal", "Masoor"], 
        description: "Red lentils, protein-rich legume",
        imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300",
        isActive: true 
      },
      { 
        name: "Chickpeas", 
        category: "Pulses", 
        aliases: ["Chana", "Kabuli Chana"], 
        description: "White chickpeas, versatile legume",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300",
        isActive: true 
      },
      { 
        name: "Kidney Beans", 
        category: "Pulses", 
        aliases: ["Rajma"], 
        description: "Red kidney beans, perfect for curry",
        imageUrl: "https://images.unsplash.com/photo-1627662055568-3631d4d8f7b9?w=300",
        isActive: true 
      },

      // Spices
      { 
        name: "Turmeric", 
        category: "Spices", 
        aliases: ["Haldi"], 
        description: "Golden turmeric powder, anti-inflammatory",
        imageUrl: "https://images.unsplash.com/photo-1615485925450-b2dedc6a1c8f?w=300",
        isActive: true 
      },
      { 
        name: "Cumin", 
        category: "Spices", 
        aliases: ["Jeera"], 
        description: "Aromatic cumin seeds",
        imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300",
        isActive: true 
      },
      { 
        name: "Coriander", 
        category: "Spices", 
        aliases: ["Dhania"], 
        description: "Fresh coriander seeds",
        imageUrl: "https://images.unsplash.com/photo-1599909513729-74a3b3a55da0?w=300",
        isActive: true 
      },
      { 
        name: "Red Chili Powder", 
        category: "Spices", 
        aliases: ["Lal Mirch"], 
        description: "Spicy red chili powder",
        imageUrl: "https://images.unsplash.com/photo-1583032117886-d6ab12de0b9b?w=300",
        isActive: true 
      },
      { 
        name: "Garam Masala", 
        category: "Spices", 
        aliases: ["Mixed Spices"], 
        description: "Aromatic garam masala blend",
        imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300",
        isActive: true 
      },

      // Additional items to reach 50+
      { 
        name: "Ginger", 
        category: "Spices", 
        aliases: ["Adrak"], 
        description: "Fresh ginger root, digestive aid",
        imageUrl: "https://images.unsplash.com/photo-1599909513729-74a3b3a55da0?w=300",
        isActive: true 
      },
      { 
        name: "Garlic", 
        category: "Spices", 
        aliases: ["Lahsun"], 
        description: "Fresh garlic bulbs, flavor enhancer",
        imageUrl: "https://images.unsplash.com/photo-1615485925450-b2dedc6a1c8f?w=300",
        isActive: true 
      },
      { 
        name: "Green Chili", 
        category: "Spices", 
        aliases: ["Hari Mirch"], 
        description: "Fresh green chilies, adds heat",
        imageUrl: "https://images.unsplash.com/photo-1583032117886-d6ab12de0b9b?w=300",
        isActive: true 
      },
      { 
        name: "Lemon", 
        category: "Fruit", 
        aliases: ["Nimbu"], 
        description: "Fresh lemons, citrusy and tangy",
        imageUrl: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=300",
        isActive: true 
      },
      { 
        name: "Coconut", 
        category: "Fruit", 
        aliases: ["Nariyal"], 
        description: "Fresh coconut, tropical delight",
        imageUrl: "https://images.unsplash.com/photo-1520084678315-7c44e3d2c5b1?w=300",
        isActive: true 
      },
      { 
        name: "Sweet Potato", 
        category: "Vegetable", 
        aliases: ["Shakarkandi"], 
        description: "Nutritious sweet potatoes",
        imageUrl: "https://images.unsplash.com/photo-1594282486868-4cd846573524?w=300",
        isActive: true 
      },
      { 
        name: "Brinjal", 
        category: "Vegetable", 
        aliases: ["Baingan", "Eggplant"], 
        description: "Purple brinjal, versatile vegetable",
        imageUrl: "https://images.unsplash.com/photo-1594282486868-4cd846573524?w=300",
        isActive: true 
      },
      { 
        name: "Bottle Gourd", 
        category: "Vegetable", 
        aliases: ["Lauki", "Ghiya"], 
        description: "Light green bottle gourd",
        imageUrl: "https://images.unsplash.com/photo-1594282486868-4cd846573524?w=300",
        isActive: true 
      },
      { 
        name: "Bitter Gourd", 
        category: "Vegetable", 
        aliases: ["Karela"], 
        description: "Bitter gourd, medicinal vegetable",
        imageUrl: "https://images.unsplash.com/photo-1594282486868-4cd846573524?w=300",
        isActive: true 
      },
      { 
        name: "Okra", 
        category: "Vegetable", 
        aliases: ["Bhindi", "Lady Finger"], 
        description: "Fresh okra, fiber-rich vegetable",
        imageUrl: "https://images.unsplash.com/photo-1594282486868-4cd846573524?w=300",
        isActive: true 
      },
      { 
        name: "Drumstick", 
        category: "Vegetable", 
        aliases: ["Moringa", "Sahjan"], 
        description: "Nutritious drumstick pods",
        imageUrl: "https://images.unsplash.com/photo-1594282486868-4cd846573524?w=300",
        isActive: true 
      },
      { 
        name: "Ridge Gourd", 
        category: "Vegetable", 
        aliases: ["Turai", "Dodka"], 
        description: "Light green ridge gourd",
        imageUrl: "https://images.unsplash.com/photo-1594282486868-4cd846573524?w=300",
        isActive: true 
      },
      { 
        name: "Pumpkin", 
        category: "Vegetable", 
        aliases: ["Kaddu"], 
        description: "Orange pumpkin, sweet vegetable",
        imageUrl: "https://images.unsplash.com/photo-1594282486868-4cd846573524?w=300",
        isActive: true 
      },
      { 
        name: "Radish", 
        category: "Vegetable", 
        aliases: ["Mooli"], 
        description: "White radish, crunchy vegetable",
        imageUrl: "https://images.unsplash.com/photo-1594282486868-4cd846573524?w=300",
        isActive: true 
      },
      { 
        name: "Turnip", 
        category: "Vegetable", 
        aliases: ["Shalgam"], 
        description: "Purple turnips, root vegetable",
        imageUrl: "https://images.unsplash.com/photo-1594282486868-4cd846573524?w=300",
        isActive: true 
      },
      { 
        name: "Beetroot", 
        category: "Vegetable", 
        aliases: ["Chukandar"], 
        description: "Red beetroot, nutritious vegetable",
        imageUrl: "https://images.unsplash.com/photo-1594282486868-4cd846573524?w=300",
        isActive: true 
      },
      { 
        name: "Green Peas", 
        category: "Vegetable", 
        aliases: ["Matar"], 
        description: "Fresh green peas",
        imageUrl: "https://images.unsplash.com/photo-1594282486868-4cd846573524?w=300",
        isActive: true 
      },
      { 
        name: "Mint", 
        category: "Herbs", 
        aliases: ["Pudina"], 
        description: "Fresh mint leaves, aromatic herb",
        imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300",
        isActive: true 
      },
      { 
        name: "Coriander Leaves", 
        category: "Herbs", 
        aliases: ["Dhania Patta", "Cilantro"], 
        description: "Fresh coriander leaves",
        imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300",
        isActive: true 
      },
      { 
        name: "Fenugreek Leaves", 
        category: "Herbs", 
        aliases: ["Methi"], 
        description: "Fresh fenugreek leaves",
        imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300",
        isActive: true 
      },
      { 
        name: "Eggs", 
        category: "Protein", 
        aliases: ["Ande"], 
        description: "Fresh chicken eggs, protein-rich",
        imageUrl: "https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=300",
        isActive: true 
      },
      { 
        name: "Chicken", 
        category: "Protein", 
        aliases: ["Murgi"], 
        description: "Fresh chicken meat",
        imageUrl: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300",
        isActive: true 
      },
    ];

    for (const item of masterItems) {
      await ctx.db.insert("masterItems", item);
    }

    console.log(`Seeded ${masterItems.length} master items`);
    return { created: masterItems.length };
  },
});

export const seedPlatformPrices = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if we already have platform prices
    const existingPrices = await ctx.db.query("platformPrices").collect();
    if (existingPrices.length > 0) {
      console.log("Platform prices already exist, skipping seed");
      return { message: "Platform prices already exist", count: existingPrices.length };
    }

    // Get all master items
    const masterItems = await ctx.db.query("masterItems").collect();
    if (masterItems.length === 0) {
      console.log("No master items found, please seed master items first");
      return { error: "No master items found" };
    }

    const platforms = [
      { 
        name: "Blinkit", 
        logo: "🛒", 
        deliveryTime: "10-15 min", 
        deliveryFee: 2500, // ₹25 in paise
        minimumOrder: 10000, // ₹100 in paise
        priceMultiplier: 1.4,
        availabilityRate: 0.85 
      },
      { 
        name: "Swiggy Instamart", 
        logo: "🛵", 
        deliveryTime: "15-25 min", 
        deliveryFee: 3000, // ₹30 in paise
        minimumOrder: 9900, // ₹99 in paise
        priceMultiplier: 1.35,
        availabilityRate: 0.80 
      },
      { 
        name: "Zomato", 
        logo: "🍽️", 
        deliveryTime: "20-30 min", 
        deliveryFee: 2900, // ₹29 in paise
        minimumOrder: 15000, // ₹150 in paise
        priceMultiplier: 1.3,
        availabilityRate: 0.75 
      },
      { 
        name: "Amazon Fresh", 
        logo: "📦", 
        deliveryTime: "2-4 hours", 
        deliveryFee: 0, // Free delivery
        minimumOrder: 40000, // ₹400 in paise
        priceMultiplier: 1.2,
        availabilityRate: 0.70 
      },
      { 
        name: "BigBasket", 
        logo: "🛍️", 
        deliveryTime: "1-3 hours", 
        deliveryFee: 4000, // ₹40 in paise
        minimumOrder: 20000, // ₹200 in paise
        priceMultiplier: 1.25,
        availabilityRate: 0.85 
      },
      { 
        name: "Flipkart Grocery", 
        logo: "🏪", 
        deliveryTime: "1-2 days", 
        deliveryFee: 4900, // ₹49 in paise
        minimumOrder: 50000, // ₹500 in paise
        priceMultiplier: 1.15,
        availabilityRate: 0.65 
      },
      { 
        name: "Zepto", 
        logo: "⚡", 
        deliveryTime: "8-12 min", 
        deliveryFee: 2000, // ₹20 in paise
        minimumOrder: 12000, // ₹120 in paise
        priceMultiplier: 1.45,
        availabilityRate: 0.75 
      },
      { 
        name: "Dunzo", 
        logo: "🚚", 
        deliveryTime: "25-45 min", 
        deliveryFee: 3500, // ₹35 in paise
        minimumOrder: 15000, // ₹150 in paise
        priceMultiplier: 1.38,
        availabilityRate: 0.60 
      },
    ];

    const basePrice = 5000; // ₹50 base price in paise
    const now = Date.now();
    let seedCount = 0;

    for (const masterItem of masterItems) {
      // Calculate base price for this item based on category
      let itemBasePrice = basePrice;
      switch (masterItem.category) {
        case "Vegetable": itemBasePrice = Math.floor(Math.random() * 8000) + 2000; break; // ₹20-100
        case "Fruit": itemBasePrice = Math.floor(Math.random() * 15000) + 5000; break; // ₹50-200
        case "Dairy": itemBasePrice = Math.floor(Math.random() * 20000) + 8000; break; // ₹80-280
        case "Grains": itemBasePrice = Math.floor(Math.random() * 25000) + 15000; break; // ₹150-400
        case "Pulses": itemBasePrice = Math.floor(Math.random() * 20000) + 10000; break; // ₹100-300
        case "Spices": itemBasePrice = Math.floor(Math.random() * 8000) + 3000; break; // ₹30-110
        case "Herbs": itemBasePrice = Math.floor(Math.random() * 5000) + 1500; break; // ₹15-65
        case "Protein": itemBasePrice = Math.floor(Math.random() * 40000) + 20000; break; // ₹200-600
        default: itemBasePrice = Math.floor(Math.random() * 10000) + 5000; break; // ₹50-150
      }

      for (const platform of platforms) {
        const isAvailable = Math.random() < platform.availabilityRate;
        const price = Math.floor(itemBasePrice * platform.priceMultiplier);
        const hasDiscount = Math.random() < 0.3; // 30% chance of discount
        
        let originalPrice = undefined;
        let discountPercentage = undefined;
        if (hasDiscount) {
          discountPercentage = Math.floor(Math.random() * 25) + 5; // 5-30% discount
          originalPrice = Math.floor(price / (1 - discountPercentage / 100));
        }

        const stockStatuses = ["in_stock", "low_stock", "out_of_stock"];
        let stockStatus = "in_stock";
        if (!isAvailable) {
          stockStatus = "out_of_stock";
        } else if (Math.random() < 0.1) {
          stockStatus = "low_stock";
        }

        const unit = masterItem.category === "Dairy" || masterItem.category === "Protein" ? 
          (Math.random() < 0.5 ? "pieces" : "pack") : "kg";

        await ctx.db.insert("platformPrices", {
          masterItemId: masterItem._id,
          platformName: platform.name,
          platformLogo: platform.logo,
          price: hasDiscount ? Math.floor(originalPrice! * (1 - discountPercentage! / 100)) : price,
          originalPrice,
          discountPercentage,
          unit,
          isAvailable,
          stockStatus: stockStatus as any,
          deliveryTime: platform.deliveryTime,
          deliveryFee: platform.deliveryFee,
          minimumOrder: platform.minimumOrder,
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0 rating
          reviewCount: Math.floor(Math.random() * 1000) + 50,
          region: "Delhi",
          lastUpdatedAt: now,
          priceHistory: [],
          isActive: true,
        });
        
        seedCount++;
      }
    }

    console.log(`Seeded ${seedCount} platform prices for ${masterItems.length} items across ${platforms.length} platforms`);
    return { created: seedCount, items: masterItems.length, platforms: platforms.length };
  },
});

// Combined seed function that users can call
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if we already have master items
    const existingMasterItems = await ctx.db.query("masterItems").collect();
    let masterItemsResult;
    
    if (existingMasterItems.length === 0) {
      // Inline the master items seeding logic
      const masterItems = [
        // Vegetables
        { 
          name: "Onion", 
          category: "Vegetable", 
          aliases: ["Pyaz", "Kanda"], 
          description: "Fresh red onions, essential for Indian cooking",
          imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?w=300",
          isActive: true 
        },
        { 
          name: "Potato", 
          category: "Vegetable", 
          aliases: ["Aloo", "Batata"], 
          description: "Versatile potatoes, perfect for curries and snacks",
          imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300",
          isActive: true 
        },
        { 
          name: "Tomato", 
          category: "Vegetable", 
          aliases: ["Tamatar"], 
          description: "Juicy red tomatoes, rich in vitamins",
          imageUrl: "https://images.unsplash.com/photo-1546470427-227f88b8f999?w=300",
          isActive: true 
        },
        // Add more items as needed for quick seeding
        { 
          name: "Apple", 
          category: "Fruit", 
          aliases: ["Seb"], 
          description: "Crisp red apples, a healthy snack",
          imageUrl: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=300",
          isActive: true 
        },
        { 
          name: "Milk", 
          category: "Dairy", 
          aliases: ["Doodh"], 
          description: "Fresh cow milk, calcium-rich",
          imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300",
          isActive: true 
        },
      ];

      for (const item of masterItems) {
        await ctx.db.insert("masterItems", item);
      }
      masterItemsResult = { created: masterItems.length };
    } else {
      masterItemsResult = { message: "Master items already exist", count: existingMasterItems.length };
    }

    // Check if we already have platform prices
    const existingPrices = await ctx.db.query("platformPrices").collect();
    let platformPricesResult;
    
    if (existingPrices.length === 0) {
      // Get master items for platform prices
      const allMasterItems = await ctx.db.query("masterItems").collect();
      
      if (allMasterItems.length > 0) {
        const platforms = [
          { name: "Blinkit", logo: "🛒", deliveryTime: "10-15 min", priceMultiplier: 1.4 },
          { name: "Swiggy Instamart", logo: "🛵", deliveryTime: "15-25 min", priceMultiplier: 1.35 },
          { name: "Zomato", logo: "🍽️", deliveryTime: "20-30 min", priceMultiplier: 1.3 },
          { name: "Amazon Fresh", logo: "📦", deliveryTime: "2-4 hours", priceMultiplier: 1.2 },
          { name: "BigBasket", logo: "🛍️", deliveryTime: "1-3 hours", priceMultiplier: 1.25 },
        ];

        const now = Date.now();
        let seedCount = 0;

        for (const masterItem of allMasterItems) {
          const basePrice = 5000; // ₹50 in paise
          
          for (const platform of platforms) {
            const price = Math.floor(basePrice * platform.priceMultiplier);
            const isAvailable = Math.random() < 0.8; // 80% availability

            await ctx.db.insert("platformPrices", {
              masterItemId: masterItem._id,
              platformName: platform.name,
              platformLogo: platform.logo,
              price,
              unit: "kg",
              isAvailable,
              stockStatus: isAvailable ? "in_stock" : "out_of_stock",
              deliveryTime: platform.deliveryTime,
              deliveryFee: 2500,
              minimumOrder: 10000,
              rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
              reviewCount: Math.floor(Math.random() * 500) + 50,
              region: "Delhi",
              lastUpdatedAt: now,
              priceHistory: [],
              isActive: true,
            });
            seedCount++;
          }
        }
        
        platformPricesResult = { created: seedCount };
      } else {
        platformPricesResult = { error: "No master items found" };
      }
    } else {
      platformPricesResult = { message: "Platform prices already exist", count: existingPrices.length };
    }
    
    return {
      masterItems: masterItemsResult,
      platformPrices: platformPricesResult,
    };
  },
});

/**
 * Create sample listings using the master items.
 * This function requires at least one user to exist in the database.
 */
export const createSampleListings = mutation({
  handler: async (ctx) => {
    const user = await ctx.db.query("users").first();
    if (!user) {
      throw new Error("No users found. Please create a user first.");
    }

    const masterItems = await ctx.db.query("masterItems").collect();
    if (masterItems.length < 5) {
      throw new Error("Not enough master items. Please run seedMasterItems first.");
    }

    // Helper to find a master item by name
    const findItem = (name: string) => {
        const item = masterItems.find(i => i.name === name);
        if (!item) throw new Error(`Master item "${name}" not found.`);
        return item;
    };

    const sampleListings = [
      {
        masterItemId: findItem("Onion")._id,
        description: "Fresh red onions from Nashik, perfect for gravies and salads. Surplus from today's stock.",
        price: 2500, // ₹25 in paise
        quantity: 50,
        unit: "kg",
        imageUrl: "https://plus.unsplash.com/premium_photo-1700400119867-41aeda606042?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      {
        masterItemId: findItem("Potato")._id,
        description: "Agra-variety potatoes, ideal for fries, sabzi, and vada pav. Bulk quantity available.",
        price: 2000, // ₹20 in paise
        quantity: 100,
        unit: "kg",
        imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=500",
      },
      {
        masterItemId: findItem("Tomato")._id,
        description: "Hybrid ripe tomatoes. Good for purees, sauces, and chaat preparations. Slightly soft but perfect for cooking.",
        price: 3000, // ₹30 in paise
        quantity: 25,
        unit: "kg",
        imageUrl: "https://images.unsplash.com/photo-1740312987215-ba01f31988fa?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      {
        masterItemId: findItem("Paneer")._id,
        description: "Freshly made malai paneer, soft and creamy. Left over from today's batch. Best for paneer tikka or bhurji.",
        price: 28000, // ₹280 in paise
        quantity: 5,
        unit: "kg",
        imageUrl: "https://plus.unsplash.com/premium_photo-1669831178095-005ed789250a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      {
        masterItemId: findItem("Coriander Leaves")._id,
        description: "Aromatic coriander bunches. Perfect for garnishing. Will not last till tomorrow, available at a good price.",
        price: 1000, // ₹10 in paise
        quantity: 30,
        unit: "bunch",
        imageUrl: "https://images.unsplash.com/photo-1535189487909-a262ad10c165?q=80&w=1099&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
    ];

    const now = Date.now();
    for (const listing of sampleListings) {
      await ctx.db.insert("listings", {
        sellerId: user._id,
        masterItemId: listing.masterItemId,
        imageUrl: listing.imageUrl,
        description: listing.description,
        price: listing.price,
        quantity: listing.quantity,
        unit: listing.unit,
        isActive: true,
        expiresAt: now + (24 * 60 * 60 * 1000), // Expires in 24 hours
        latitude: user.latitude,
        longitude: user.longitude,
      });
    }

    return { created: sampleListings.length };
  },
});
