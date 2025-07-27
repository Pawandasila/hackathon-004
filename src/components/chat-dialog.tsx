import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { Id } from "../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Phone, MapPin, Package } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    _id: Id<"listings">;
    sellerId: Id<"users">;
    price: number;
    quantity: number;
    unit: string;
    imageUrl?: string;
    seller: {
      _id: Id<"users">;
      name: string;
      phone?: string;
      shopName?: string;
      shopAddress: string;
      imageUrl?: string;
    };
  };
  masterItem: {
    name: string;
    category: string;
  };
  embedded?: boolean;
  chatId?: Id<"chats">;
}

export function ChatDialog({
  isOpen,
  onClose,
  listing,
  masterItem,
  embedded = false,
  chatId: predefinedChatId,
}: ChatDialogProps) {
  const [message, setMessage] = useState("");
  const [chatId, setChatId] = useState<Id<"chats"> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user: clerkUser } = useUser();
  const user = useQuery(api.users.getCurrentUser);

  const createOrGetChat = useMutation(api.chats.createOrGetChat);
  const sendMessage = useMutation(api.chats.sendMessage);
  const markAsRead = useMutation(api.chats.markMessagesAsRead);

  const messages = useQuery(
    api.chats.getChatMessages,
    (chatId || predefinedChatId) && user
      ? {
          chatId: (chatId || predefinedChatId)!,
          userId: user._id,
        }
      : "skip"
  );

  useEffect(() => {
    if (predefinedChatId) {
      setChatId(predefinedChatId);
    } else if (isOpen && user && listing.sellerId !== user._id) {
      createOrGetChat({
        listingId: listing._id,
        buyerId: user._id,
        sellerId: listing.sellerId,
      })
        .then(setChatId)
        .catch(console.error);
    }
  }, [
    isOpen,
    user?._id,
    listing._id,
    listing.sellerId,
    createOrGetChat,
    predefinedChatId,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const activeChatId = chatId || predefinedChatId;
    if (activeChatId && user && (isOpen || embedded)) {
      markAsRead({ chatId: activeChatId, userId: user._id }).catch(
        console.error
      );
    }
  }, [chatId, predefinedChatId, user, isOpen, embedded, markAsRead]);

  const handleSendMessage = useCallback(async () => {
    const activeChatId = chatId || predefinedChatId;
    if (!message.trim() || !activeChatId || !user) {
      toast.error("Cannot send message - chat not initialized");
      return;
    }

    try {
      await sendMessage({
        chatId: activeChatId,
        senderId: user._id,
        body: message.trim(),
        messageType: "text",
      });

      setMessage("");
      toast.success("Message sent!");
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    }
  }, [message, chatId, predefinedChatId, user, sendMessage]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value);
    },
    []
  );

  const formatPrice = useCallback((priceInPaise: number) => {
    return `₹${(priceInPaise / 100).toFixed(2)}`;
  }, []);

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const handleCallSeller = useCallback(() => {
    if (listing.seller.phone) {
      window.open(`tel:${listing.seller.phone}`, "_self");
    } else {
      toast.error("Phone number not available");
    }
  }, [listing.seller.phone]);

  const handleGetDirections = useCallback(() => {
    const address = encodeURIComponent(listing.seller.shopAddress);
    const url = `https://www.google.com/maps/search/${address}`;
    window.open(url, "_blank");
  }, [listing.seller.shopAddress]);

  if (!user) {
    return null;
  }

  if (!embedded && listing.sellerId === user._id) {
    return null;
  }

  if (embedded && !predefinedChatId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  const ChatContent = useMemo(() => {
    if (embedded) {
      return (
        <div className="h-full flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="space-y-4">
                  {messages?.map((msg) => {
                    const isOwnMessage = msg.senderId === user._id;
                    const isSystemMessage = msg.messageType === "system";

                    if (isSystemMessage) {
                      return (
                        <div key={msg._id} className="text-center">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {msg.body}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] ${isOwnMessage ? "order-1" : "order-2"}`}
                        >
                          <div
                            className={`p-3 rounded-lg text-sm ${
                              isOwnMessage
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {msg.body}
                          </div>
                          <div
                            className={`text-xs text-gray-500 mt-1 ${
                              isOwnMessage ? "text-right" : "text-left"
                            }`}
                          >
                            {formatTime(msg._creationTime)}
                          </div>
                        </div>
                        {!isOwnMessage && (
                          <Avatar className="h-6 w-6 order-1 mr-2">
                            <AvatarImage src={msg.sender?.imageUrl} />
                            <AvatarFallback className="text-xs">
                              {msg.sender?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Message Input - Fixed at bottom for embedded */}
          <div className="border-t bg-white p-3 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                size="sm"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        <div className="border-b">
          <DialogHeader className="p-4 pb-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={listing.seller.imageUrl} />
                <AvatarFallback>
                  {listing.seller.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-sm font-medium">
                  {listing.seller.name}
                </DialogTitle>
                <p className="text-xs text-gray-500">
                  {listing.seller.shopName || "Seller"}
                </p>
              </div>
            </div>
          </DialogHeader>
          {/* Action buttons row */}
          <div className="px-4 pb-3">
            <div className="flex gap-2">
              {listing.seller.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCallSeller}
                  className="flex-1 h-8 text-xs"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleGetDirections}
                className="flex-1 h-8 text-xs"
              >
                <MapPin className="h-3 w-3 mr-1" />
                Directions
              </Button>
            </div>
          </div>
        </div>

        {/* Listing Info */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-3">
            {listing.imageUrl && (
              <img
                src={listing.imageUrl}
                alt={masterItem.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h4 className="font-medium text-sm">{masterItem.name}</h4>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium text-orange-600">
                  {formatPrice(listing.price)}
                </span>
                <span>•</span>
                <span>
                  {listing.quantity} {listing.unit}
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Package className="w-3 h-3 mr-1" />
              {masterItem.category}
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4">
            <div className="space-y-4">
              {messages?.map((msg) => {
                const isOwnMessage = msg.senderId === user._id;
                const isSystemMessage = msg.messageType === "system";

                if (isSystemMessage) {
                  return (
                    <div key={msg._id} className="text-center">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {msg.body}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg._id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] ${isOwnMessage ? "order-1" : "order-2"}`}
                    >
                      <div
                        className={`p-3 rounded-lg text-sm ${
                          isOwnMessage
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {msg.body}
                      </div>
                      <div
                        className={`text-xs text-gray-500 mt-1 ${
                          isOwnMessage ? "text-right" : "text-left"
                        }`}
                      >
                        {formatTime(msg._creationTime)}
                      </div>
                    </div>
                    {!isOwnMessage && (
                      <Avatar className="h-6 w-6 order-1 mr-2">
                        <AvatarImage src={msg.sender?.imageUrl} />
                        <AvatarFallback className="text-xs">
                          {msg.sender?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>

        {/* Message Input - Fixed at bottom */}
        <div className="border-t bg-white p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    );
  }, [
    embedded,
    listing,
    masterItem,
    messages,
    user,
    message,
    handleInputChange,
    handleKeyPress,
    handleSendMessage,
    handleCallSeller,
    handleGetDirections,
    formatPrice,
    formatTime,
  ]);

  if (embedded) {
    return ChatContent;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[80vh] max-h-[600px] flex flex-col p-0 overflow-hidden">
        {ChatContent}
      </DialogContent>
    </Dialog>
  );
}
