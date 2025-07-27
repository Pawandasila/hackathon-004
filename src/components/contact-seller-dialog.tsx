import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Truck, Home, Phone, MessageSquare, Package, ShoppingBag, Clock, MapPin, User } from "lucide-react";
import { toast } from "sonner";

interface ContactSellerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    _id: Id<"listings">;
    price: number;
    quantity: number;
    unit: string;
    isDeliveryAvailable?: boolean;
    isPickupAvailable?: boolean;
    seller: {
      name: string;
      shopName?: string;
      shopAddress: string;
    };
  };
  masterItem: {
    name: string;
    category: string;
  };
}

export function ContactSellerDialog({ 
  isOpen, 
  onClose, 
  listing, 
  masterItem 
}: ContactSellerDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [contactMethod, setContactMethod] = useState<"pickup" | "delivery" | "both">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [buyerMessage, setBuyerMessage] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createOrder = useMutation(api.orders.createOrder);

  const formatPrice = (priceInPaise: number) => {
    return `₹${(priceInPaise / 100).toFixed(2)}`;
  };

  useEffect(() => {
    console.log(listing)
  },[listing])

  const totalAmount = listing.price * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (quantity <= 0 || quantity > listing.quantity) {
        toast.error(`Please enter a valid quantity (1-${listing.quantity})`);
        return;
      }

      if (contactMethod === "delivery" && !deliveryAddress.trim()) {
        toast.error("Please provide a delivery address");
        return;
      }

      if (!buyerPhone.trim()) {
        toast.error("Please provide your phone number");
        return;
      }

      // Create the order
      const result = await createOrder({
        listingId: listing._id,
        quantity,
        contactMethod,
        deliveryAddress: contactMethod === "delivery" || contactMethod === "both" ? deliveryAddress : undefined,
        preferredTime,
        buyerMessage,
        buyerPhone,
      });

      if (result.success) {
        toast.success("Order placed successfully! The seller will be notified.");
        onClose();
        
        // Reset form
        setQuantity(1);
        setContactMethod("pickup");
        setDeliveryAddress("");
        setPreferredTime("");
        setBuyerMessage("");
        setBuyerPhone("");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            Contact Seller
          </DialogTitle>
          <DialogDescription>
            Send an order request to <span className="font-medium">{listing.seller.shopName || listing.seller.name}</span> for {masterItem.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Summary */}
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg space-y-2">
            <h4 className="font-medium text-sm text-gray-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-600" />
              Order Summary
            </h4>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">{masterItem.name}</span>
                <p className="text-xs text-gray-600">{masterItem.category}</p>
              </div>
              <div className="text-right">
                <span className="font-medium text-sm">{formatPrice(listing.price)}</span>
                <p className="text-xs text-gray-600">per {listing.unit}</p>
              </div>
            </div>
            <Separator className="bg-orange-200" />
            <div className="flex justify-between items-center text-base font-bold text-orange-600">
              <span>Total:</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium">
              Quantity ({listing.unit})
            </Label>
            <div className="relative">
              <Input
                id="quantity"
                type="number"
                min="1"
                max={listing.quantity}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                placeholder="Enter quantity"
                className="pr-16"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Badge variant="secondary" className="text-xs">
                  Max: {listing.quantity}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {listing.quantity} {listing.unit} available
            </p>
          </div>

          {/* Contact Method */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preferred Method</Label>
            <div className="space-y-2">
              {listing.isPickupAvailable && (
                <label className="flex items-center space-x-3 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="pickup"
                    checked={contactMethod === "pickup"}
                    onChange={(e) => setContactMethod(e.target.value as any)}
                    className="text-orange-500"
                  />
                  <div className="p-1.5 bg-blue-100 rounded">
                    <Home className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pickup from seller</p>
                    <p className="text-xs text-gray-600">Collect from seller's location</p>
                  </div>
                </label>
              )}
              
              {listing.isDeliveryAvailable && (
                <label className="flex items-center space-x-3 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="delivery"
                    checked={contactMethod === "delivery"}
                    onChange={(e) => setContactMethod(e.target.value as any)}
                    className="text-orange-500"
                  />
                  <div className="p-1.5 bg-green-100 rounded">
                    <Truck className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Delivery to you</p>
                    <p className="text-xs text-gray-600">Get it delivered to your location</p>
                  </div>
                </label>
              )}

              {listing.isPickupAvailable && listing.isDeliveryAvailable && (
                <label className="flex items-center space-x-3 cursor-pointer p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="both"
                    checked={contactMethod === "both"}
                    onChange={(e) => setContactMethod(e.target.value as any)}
                    className="text-orange-500"
                  />
                  <div className="p-1.5 bg-purple-100 rounded">
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Either option</p>
                    <p className="text-xs text-gray-600">Flexible with pickup or delivery</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          {(contactMethod === "delivery" || contactMethod === "both") && (
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress" className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Delivery Address
              </Label>
              <Textarea
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter your complete delivery address with landmarks"
                className="min-h-[60px]"
                rows={2}
              />
            </div>
          )}

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="buyerPhone" className="text-sm font-medium">
              Your Phone Number *
            </Label>
            <Input
              id="buyerPhone"
              type="tel"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>

          {/* Preferred Time */}
          <div className="space-y-2">
            <Label htmlFor="preferredTime" className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Preferred Time (Optional)
            </Label>
            <Input
              id="preferredTime"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              placeholder="e.g., Tomorrow evening, Today after 6 PM"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="buyerMessage" className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Message to Seller (Optional)
            </Label>
            <Textarea
              id="buyerMessage"
              value={buyerMessage}
              onChange={(e) => setBuyerMessage(e.target.value)}
              placeholder="Any specific requirements, quality preferences, or questions..."
              className="min-h-[70px]"
              rows={3}
            />
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Send Request
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
