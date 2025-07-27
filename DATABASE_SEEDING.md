# Database Seeding Instructions

This guide explains how to seed your Convex database with master items and sample listings.

## Prerequisites

1. Make sure you have at least one user in your database (sign up through your app first)
2. Your Convex dev environment should be running (`npx convex dev`)

## Step-by-Step Seeding Process

### 1. Seed Master Items

First, populate the master items table with 49 common Indian grocery items:

```bash
npx convex run seed:seedMasterItems
```

This will create items like:
- **Vegetables:** Onion, Potato, Tomato, Green Chilli, Ginger, etc.
- **Spices:** Turmeric, Red Chilli Powder, Cumin Seeds, etc.
- **Lentils:** Chickpeas, Moong Dal, Chana Dal, etc.
- **Flour & Grains:** Atta, Maida, Rice, Poha, etc.
- **Dairy & Fats:** Paneer, Ghee, Cooking Oil, etc.
- **Other:** Sugar, Salt, Jaggery, Pav Buns, etc.

### 2. Create Sample Listings

After seeding master items, create 10 sample listings:

```bash
npx convex run seed:createSampleListings
```

This will create realistic listings with:
- Proper pricing in paise (Indian currency)
- Realistic descriptions and quantities
- Tags and conditions
- Delivery/pickup options
- Random view and inquiry counts

### 3. Clean Up (Optional)

If you want to remove all seeded data:

```bash
npx convex run seed:cleanupSampleData
```

## What Gets Created

### Master Items (49 items)
Each master item includes:
- Name (e.g., "Onion")
- Category (e.g., "Vegetable")
- Aliases (e.g., ["Pyaz", "Kanda", "Dungri"])
- High-quality Unsplash image URLs
- Active status

### Sample Listings (10 listings)
Each listing includes:
- Reference to master item
- Realistic description
- Price in paise (₹30-150 range)
- Quantity and unit
- Condition (fresh/good)
- Tags for better searchability
- Delivery options
- Sample metrics
- High-quality product images from Unsplash

## Example Usage in Frontend

After seeding, you can query the data:

```typescript
// Get all master items
const masterItems = await convex.query(api.masterItems.getAll);

// Get all active listings
const listings = await convex.query(api.listings.getActiveListingsWithSeller);

// Search for specific items
const onions = await convex.query(api.masterItems.search, { searchTerm: "onion" });
```

## Notes

- All prices are stored in paise (smallest currency unit)
- Master items are checked for duplicates before creation
- Sample listings use the first user found in the database as seller
- Listings expire after 24 hours by default
- All items are marked as active and available

This seeded data provides a realistic foundation for testing your marketplace application!
