"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Clock, Truck, Home, Star, ExternalLink, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ContactSellerDialog } from "@/components/contact-seller-dialog";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as Id<"listings">;
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  // Fetch the listing with seller details
  const listing = useQuery(api.listings.getListingById, { id: listingId });
  
  // Fetch master item details - skip if listing not loaded yet
  const masterItem = useQuery(
    api.masterItems.getById, 
    listing ? { id: listing.masterItemId } : "skip"
  );
  
  // Fetch platform prices for comparison - skip if listing not loaded yet
  const platformComparison = useQuery(
    api.platformPrices.getPriceComparison, 
    listing ? { 
      masterItemId: listing.masterItemId,
      userPrice: listing.price 
    } : "skip"
  );

  // Fetch similar listings (same master item, different sellers) - skip if listing not loaded yet
  const similarListings = useQuery(
    api.listings.getSimilarListings, 
    listing ? { 
      masterItemId: listing.masterItemId,
      excludeId: listingId 
    } : "skip"
  );

  if (listing === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading listing details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (listing === null) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Listing Not Found</h1>
            <p className="text-gray-600 mb-6">The listing you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (priceInPaise: number) => {
    return `₹${(priceInPaise / 100).toFixed(2)}`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'fresh': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-yellow-100 text-yellow-800';
      case 'fair': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Platform prices from database
  const platformPrices = platformComparison?.platforms || [];

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-8xl">
        
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            onClick={() => router.back()} 
            variant="ghost" 
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content - Left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main Listing Card */}
            <Card className="shadow-lg">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  
                  {/* Image Section */}
                  <div className="relative h-64 md:h-80 bg-gray-100 rounded-l-lg overflow-hidden">
                    <Image
                      src={listing.imageUrl || '/logo.png'}
                      alt={masterItem?.name || 'Food item'}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/logo.png';
                      }}
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className={getConditionColor(listing.condition || 'good')}>
                        {listing.condition || 'Good'} Condition
                      </Badge>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {masterItem?.name || 'Food Item'}
                      </h1>
                      <p className="text-gray-600">{masterItem?.category}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-3xl font-bold text-orange-600">
                          {formatPrice(listing.price)}
                        </span>
                        <span className="text-gray-500">per {listing.unit}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>📦 {listing.quantity} {listing.unit} available</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Delivery Options */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900">Available Options:</h3>
                      <div className="flex gap-3">
                        {listing.isPickupAvailable && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                            <Home className="w-4 h-4" />
                            Pickup
                          </div>
                        )}
                        {listing.isDeliveryAvailable && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full">
                            <Truck className="w-4 h-4" />
                            Delivery ({listing.deliveryRadius}km)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button 
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                        onClick={() => setIsContactDialogOpen(true)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Contact Seller
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Star className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description & Details */}
            <Card>
              <CardHeader>
                <CardTitle>Description & Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{listing.description}</p>
                
                {listing.tags && listing.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {listing.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {listing.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Special Notes:</h4>
                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{listing.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <span className="text-sm text-gray-500">Posted on:</span>
                    <p className="font-medium">{formatTime(listing._creationTime)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Available until:</span>
                    <p className="font-medium">{formatTime(listing.expiresAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Information */}
            {listing.seller && (
              <Card>
                <CardHeader>
                  <CardTitle>Seller Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{listing.seller.name}</h3>
                      {listing.seller.shopName && (
                        <p className="text-gray-600">{listing.seller.shopName}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        {listing.seller.shopAddress}
                      </div>
                      {listing.seller.isVerified && (
                        <Badge className="mt-2 bg-green-100 text-green-800">
                          ✓ Verified Seller
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Right column */}
          <div className="space-y-6">
            
            {/* Compare Prices */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💰 Price Comparison</CardTitle>
                <p className="text-sm text-gray-600">See how this compares to other platforms</p>
              </CardHeader>
              <CardContent className="space-y-3">
                
                {/* Current Listing (Highlighted) */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌱</span>
                      <span className="font-semibold text-orange-700">Rasoii (You're here)</span>
                    </div>
                    <span className="font-bold text-orange-600">{formatPrice(listing.price)}</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">Fresh from local seller</p>
                </div>

                {/* Other Platforms */}
                {platformPrices.length > 0 ? (
                  platformPrices.map((platformData) => (
                    <div key={platformData.platform} className={`flex justify-between items-center p-3 rounded-lg border ${platformData.isAvailable ? 'bg-white' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{platformData.logo}</span>
                        <div>
                          <span className={`text-sm font-medium ${!platformData.isAvailable ? 'text-gray-400' : ''}`}>
                            {platformData.platform}
                          </span>
                          {platformData.isAvailable && (
                            <p className="text-xs text-gray-500">{platformData.deliveryTime}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {platformData.isAvailable ? (
                          <>
                            <span className="font-semibold">{formatPrice(platformData.price)}</span>
                            {platformData.savingsFromUser && platformData.savingsFromUser > 0 && (
                              <p className="text-xs text-red-500">
                                +{Math.round(platformData.savingsFromUser)}%
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">Out of stock</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <p className="text-sm text-blue-700 font-medium mb-1">Building Market Intelligence</p>
                    <p className="text-xs text-blue-600">Our AI is learning market prices to provide you with the best comparison insights!</p>
                  </div>
                )}

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    {(() => {
                      const availablePlatforms = platformComparison?.availablePlatforms || 0;
                      const mostExpensivePrice = platformComparison?.mostExpensivePrice;
                      
                      if (availablePlatforms === 0) {
                        return "🔍 Our team is fetching market prices for better comparison insights!";
                      }
                      
                      if (!mostExpensivePrice || mostExpensivePrice <= listing.price) {
                        return "🏆 Great deal! This is already competitively priced among local sellers.";
                      }
                      
                      const savings = Math.round(((mostExpensivePrice - listing.price) / listing.price) * 100);
                      
                      if (savings <= 0) {
                        return "💰 This listing offers competitive local pricing!";
                      }
                      
                      return `💡 You save up to ${savings}% by buying from this local seller!`;
                    })()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Similar Listings */}
            {similarListings && similarListings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🔍 Other Sellers</CardTitle>
                  <p className="text-sm text-gray-600">Similar listings for {masterItem?.name}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {similarListings.slice(0, 3).map((similarListing: any) => (
                    <Link 
                      key={similarListing._id} 
                      href={`/listing/${similarListing._id}`}
                      className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{similarListing.seller?.name}</p>
                          <p className="text-xs text-gray-500">
                            {similarListing.quantity} {similarListing.unit} • {similarListing.condition}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{formatPrice(similarListing.price)}</span>
                          <p className="text-xs text-gray-500">per {similarListing.unit}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🎯 Unique Find</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-3xl mb-2">🌟</div>
                    <p className="text-sm text-purple-700 font-medium mb-1">Exclusive Listing!</p>
                    <p className="text-xs text-purple-600">You're the first to discover this amazing local find. Our community of sellers is growing daily!</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🚀 Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  📍 Get Directions
                </Button>
                <Button className="w-full" variant="outline">
                  📞 Call Seller
                </Button>
                <Button className="w-full" variant="outline">
                  💬 Send Message
                </Button>
                <Button className="w-full" variant="outline">
                  🚨 Report Listing
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Seller Dialog */}
        {listing && masterItem && listing.seller && (
          <ContactSellerDialog
            isOpen={isContactDialogOpen}
            onClose={() => setIsContactDialogOpen(false)}
            listing={{
              _id: listing._id,
              price: listing.price,
              quantity: listing.quantity,
              unit: listing.unit,
              isDeliveryAvailable: listing.isDeliveryAvailable,
              isPickupAvailable: listing.isPickupAvailable,
              seller: {
                name: listing.seller.name,
                shopName: listing.seller.shopName,
                shopAddress: listing.seller.shopAddress,
              },
            }}
            masterItem={{
              name: masterItem.name,
              category: masterItem.category,
            }}
          />
        )}
      </div>
    </div>
  );
}