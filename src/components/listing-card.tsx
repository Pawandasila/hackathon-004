import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Doc } from '../../convex/_generated/dataModel';

interface ListingCardProps {
  listing: Doc<'listings'> & { 
    seller?: Doc<'users'> | null;
  };
  distance: number | null;
}

export const ListingCard = ({ listing, distance }: ListingCardProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md">
      <div className="relative w-full h-48">
        <Image
          src={listing.imageUrl + '?tr=w-400,h-400,c-force'} // Optimized image from ImageKit
          alt={listing.itemName}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800">{listing.itemName}</h3>
        <p className="text-orange-600 font-semibold text-md mt-1">
          ₹{listing.price} for {listing.quantity} {listing.unit}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
          <div className='flex items-center gap-1'>
            {listing.seller?.isVerified && (
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            )}
            <span>{listing.seller?.name ?? 'Anonymous Vendor'}</span>
          </div>
          {distance !== null && (
            <p className="font-medium text-gray-600">
              {distance.toFixed(1)} km away
            </p>
          )}
        </div>

        <Link href={`/listing/${listing._id}`} className="mt-4 block">
          <Button className="w-full bg-green-500 hover:bg-green-600">
            Connect to Buy
          </Button>
        </Link>
      </div>
    </div>
  );
};
