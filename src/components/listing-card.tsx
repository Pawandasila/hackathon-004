import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Clock, Badge, Truck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Doc } from "../../convex/_generated/dataModel";

interface ListingCardProps {
  listing: Doc<"listings"> & {
    seller?: Doc<"users"> | null;
  };
  distance: number | null;
}

export const ListingCard = ({ listing, distance }: ListingCardProps) => {
  const pricePerUnit = (listing.price / 100).toFixed(2);

  const expiryDate = new Date(listing.expiresAt);
  const isExpiringSoon = expiryDate.getTime() - Date.now() < 6 * 60 * 60 * 1000;

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case "fresh":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-yellow-100 text-yellow-800";
      case "fair":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-lg hover:border-orange-300 flex flex-col h-full">
      <div className="relative w-full h-46">
        <Image
          src={
            listing.imageUrl ||
            "https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=No+Image+Available"
          }
          alt={listing.description || "Product image"}
          fill
          className="object-cover"
        />

        {listing.condition && (
          <div className="absolute top-2 left-2">
            <UIBadge
              className={`text-xs font-medium ${getConditionColor(listing.condition)}`}
            >
              {listing.condition.charAt(0).toUpperCase() +
                listing.condition.slice(1)}
            </UIBadge>
          </div>
        )}

        {isExpiringSoon && (
          <div className="absolute top-2 right-2">
            <UIBadge className="bg-red-100 text-red-800 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Expiring Soon
            </UIBadge>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 mb-2">
          {listing.description || "Product Description"}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-row justify-start items-center gap-3">
            <p className="text-2xl font-bold text-orange-600">
              ₹{pricePerUnit}
            </p>
            <p className="text-sm text-gray-500">
              for {listing.quantity} {listing.unit}
            </p>
          </div>
          {listing.minQuantity && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Min. Order</p>
              <p className="text-sm font-medium">
                {listing.minQuantity} {listing.unit}
              </p>
            </div>
          )}
        </div>

        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {listing.tags.slice(0, 3).map((tag, index) => (
              <UIBadge key={index} variant="secondary" className="text-xs">
                {tag}
              </UIBadge>
            ))}
            {listing.tags.length > 3 && (
              <UIBadge variant="secondary" className="text-xs">
                +{listing.tags.length - 3}
              </UIBadge>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 mb-3 text-xs text-gray-600">
          {listing.isDeliveryAvailable && (
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              <span>Delivery</span>
            </div>
          )}
          {listing.isPickupAvailable && (
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span>Pickup</span>
            </div>
          )}
          {listing.deliveryRadius && (
            <span>• {listing.deliveryRadius}km radius</span>
          )}
        </div>

        <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {listing.seller?.imageUrl ? (
              <Image
                src={listing.seller.imageUrl}
                alt={listing.seller.name || "Seller"}
                width={32}
                height={32}
                className="rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-semibold text-sm">
                  {(listing.seller?.name || "V").charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {listing.seller?.shopName ||
                    listing.seller?.name ||
                    "Anonymous Vendor"}
                </p>
                {listing.seller?.isVerified && (
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                )}
              </div>
              {listing.seller?.shopAddress && (
                <div className="flex items-center gap-1 min-w-0">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                  <p className="text-xs text-gray-500 truncate">
                    {listing.seller.shopAddress}
                  </p>
                </div>
              )}
            </div>
          </div>

          {distance !== null && (
            <div className="text-right flex-shrink-0 ml-2">
              <p className="text-xs text-gray-500">Distance</p>
              <p className="text-sm font-medium text-orange-600">
                {distance.toFixed(1)} km
              </p>
            </div>
          )}
        </div>

        {listing.viewCount !== undefined && listing.viewCount > 0 && (
          <p className="text-xs text-gray-400 mb-3">
            {listing.viewCount} view{listing.viewCount !== 1 ? "s" : ""}
          </p>
        )}

        {/* Push button to bottom with flex-grow spacer */}
        <div className="mt-auto">
          <Link href={`/listing/${listing._id}`} className="block">
            <Button className="w-full bg-green-500 hover:bg-green-600 transition-colors">
              View Details & Contact
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
