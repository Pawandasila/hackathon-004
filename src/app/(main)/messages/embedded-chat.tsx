import { memo } from "react";
import { ChatDialog } from "@/components/chat-dialog";
import { Id } from "../../../../convex/_generated/dataModel";

interface EmbeddedChatProps {
  selectedChat: {
    _id: Id<"chats">;
    listing: {
      _id: Id<"listings">;
      sellerId: Id<"users">;
      price: number;
      quantity: number;
      unit: string;
      imageUrl?: string;
      masterItem?: {
        name: string;
        category: string;
      } | null;
      seller: {
        _id: Id<"users">;
        name: string;
        phone?: string;
        shopName?: string;
        shopAddress: string;
        imageUrl?: string;
      } | null;
    };
  };
  onClose: () => void;
}

const EmbeddedChat = memo(function EmbeddedChat({
  selectedChat,
  onClose,
}: EmbeddedChatProps) {
  if (!selectedChat.listing.seller) {
    return (
      <div className="p-4 text-center text-gray-500">
        Seller information not available
      </div>
    );
  }

  return (
    <ChatDialog
      isOpen={true}
      onClose={onClose}
      listing={{
        _id: selectedChat.listing._id,
        sellerId: selectedChat.listing.sellerId,
        price: selectedChat.listing.price,
        quantity: selectedChat.listing.quantity,
        unit: selectedChat.listing.unit,
        imageUrl: selectedChat.listing.imageUrl,
        seller: selectedChat.listing.seller,
      }}
      masterItem={{
        name: selectedChat.listing.masterItem?.name || "Item",
        category: selectedChat.listing.masterItem?.category || "Food",
      }}
      embedded={true}
      chatId={selectedChat._id}
    />
  );
});

export default EmbeddedChat;
