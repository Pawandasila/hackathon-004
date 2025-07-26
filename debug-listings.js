// Simple debug script to check listings
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function debugListings() {
  try {
    console.log("Fetching listings...");
    const listings = await client.query("listings:getActiveListingsWithSeller");
    console.log("Listings found:", listings);
    console.log("Count:", listings?.length || 0);
  } catch (error) {
    console.error("Error fetching listings:", error);
  }
}

debugListings();