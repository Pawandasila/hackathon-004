"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, ArrowLeft, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ChatDialog } from "@/components/chat-dialog";
import { useRouter } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import EmbeddedChat from "./embedded-chat";

export default function MessagesPage() {
  const router = useRouter();
  const [selectedChatId, setSelectedChatId] = useState<Id<"chats"> | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = useQuery(api.users.getCurrentUser);

  const chats = useQuery(
    api.chats.getUserChats,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const selectedChat = useQuery(
    api.chats.getChatById,
    selectedChatId ? { chatId: selectedChatId } : "skip"
  );

  const handleChatSelect = useCallback((chatId: Id<"chats">) => {
    setSelectedChatId(chatId);
  }, []);

  if (currentUser === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading messages...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser === null) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Please Sign In
            </h1>
            <p className="text-gray-600 mb-6">
              You need to be signed in to view your messages.
            </p>
            <Link href="/sign-in">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatPrice = (priceInPaise: number) => {
    return `₹${(priceInPaise / 100).toFixed(2)}`;
  };

  const filteredChats = chats?.filter((chat) => {
    if (!searchQuery) return true;

    const otherParticipant = chat.otherParticipant;
    const listing = chat.listing;

    return (
      otherParticipant?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      listing?.masterItem?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      chat.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600">
                Manage your conversations with buyers and sellers
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Conversations
                  {chats && chats.length > 0 && (
                    <Badge variant="secondary">{chats.length}</Badge>
                  )}
                </CardTitle>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredChats && filteredChats.length > 0 ? (
                  <div className="space-y-1">
                    {filteredChats.map((chat) => {
                      const otherParticipant = chat.otherParticipant;
                      const unreadCount =
                        chat.unreadCounts?.[currentUser._id] || 0;
                      const isSelected = selectedChatId === chat._id;

                      return (
                        <div
                          key={chat._id}
                          onClick={() => handleChatSelect(chat._id)}
                          className={`p-4 cursor-pointer transition-colors border-b hover:bg-gray-50 ${
                            isSelected ? "bg-orange-50 border-orange-200" : ""
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              {otherParticipant?.imageUrl ? (
                                <Image
                                  src={otherParticipant.imageUrl}
                                  alt={otherParticipant.name || "User"}
                                  width={48}
                                  height={48}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-lg">👤</span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-sm truncate">
                                    {otherParticipant?.name || "Unknown User"}
                                  </h3>
                                  <p className="text-xs text-gray-500 truncate">
                                    {chat.listing?.masterItem?.name} -{" "}
                                    {formatPrice(chat.listing?.price || 0)}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 ml-2">
                                  {chat.lastMessageAt && (
                                    <span className="text-xs text-gray-400">
                                      {formatTime(chat.lastMessageAt)}
                                    </span>
                                  )}
                                  {unreadCount > 0 && (
                                    <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                                      {unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {chat.lastMessagePreview && (
                                <p className="text-sm text-gray-600 truncate mt-1">
                                  {chat.lastMessagePreview}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">
                      No conversations yet
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Start messaging buyers and sellers to see your
                      conversations here.
                    </p>
                    <Link href="/">
                      <Button variant="outline">Browse Listings</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedChat &&
            selectedChat.listing &&
            selectedChat.listing.seller ? (
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {selectedChat.listing.imageUrl ? (
                          <Image
                            src={selectedChat.listing.imageUrl}
                            alt={
                              selectedChat.listing.masterItem?.name || "Item"
                            }
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm">📦</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {selectedChat.listing.masterItem?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatPrice(selectedChat.listing.price)} per{" "}
                          {selectedChat.listing.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {selectedChat.listing.seller?.phone && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (selectedChat.listing.seller?.phone) {
                              window.open(`tel:${selectedChat.listing.seller.phone}`, '_self');
                            }
                          }}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call Seller
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const address = encodeURIComponent(selectedChat.listing.seller?.shopAddress || '');
                          const url = `https://www.google.com/maps/search/${address}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Get Directions
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden">
                  <EmbeddedChat
                    selectedChat={selectedChat}
                    onClose={() => setSelectedChatId(null)}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-gray-500">
                    Choose a conversation from the left to start messaging.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
