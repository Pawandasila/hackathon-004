import { useState } from "react";
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
import { Truck, Home, Phone, MessageSquare, Package } from "lucide-react";
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            Contact Seller
          </DialogTitle>
          <DialogDescription>
            Send an order request to {listing.seller.shopName || listing.seller.name} for {masterItem.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Order Summary</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm">{masterItem.name}</span>
              <span className="font-medium">{formatPrice(listing.price)} per {listing.unit}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold text-orange-600">
              <span>Total:</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity ({listing.unit})</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={listing.quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              placeholder="Enter quantity"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Available: {listing.quantity} {listing.unit}
            </p>
          </div>

          {/* Contact Method */}
          <div className="space-y-2">
            <Label>Preferred Method</Label>
            <div className="grid grid-cols-1 gap-2">
              {listing.isPickupAvailable && (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="pickup"
                    checked={contactMethod === "pickup"}
                    onChange={(e) => setContactMethod(e.target.value as any)}
                    className="text-orange-500"
                  />
                  <Home className="w-4 h-4" />
                  <span className="text-sm">Pickup from seller location</span>
                </label>
              )}
              
              {listing.isDeliveryAvailable && (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="delivery"
                    checked={contactMethod === "delivery"}
                    onChange={(e) => setContactMethod(e.target.value as any)}
                    className="text-orange-500"
                  />
                  <Truck className="w-4 h-4" />
                  <span className="text-sm">Delivery to my location</span>
                </label>
              )}

              {listing.isPickupAvailable && listing.isDeliveryAvailable && (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="both"
                    checked={contactMethod === "both"}
                    onChange={(e) => setContactMethod(e.target.value as any)}
                    className="text-orange-500"
                  />
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Either pickup or delivery</span>
                </label>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          {(contactMethod === "delivery" || contactMethod === "both") && (
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Textarea
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter your complete delivery address"
                className="w-full"
                rows={2}
              />
            </div>
          )}

          {/* Preferred Time */}
          <div className="space-y-2">
            <Label htmlFor="preferredTime">Preferred Time (Optional)</Label>
            <Input
              id="preferredTime"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              placeholder="e.g., Tomorrow evening, Today after 6 PM"
              className="w-full"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="buyerPhone">Your Phone Number *</Label>
            <Input
              id="buyerPhone"
              type="tel"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="buyerMessage">Message to Seller (Optional)</Label>
            <Textarea
              id="buyerMessage"
              value={buyerMessage}
              onChange={(e) => setBuyerMessage(e.target.value)}
              placeholder="Any specific requirements or questions..."
              className="w-full"
              rows={3}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Order Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
