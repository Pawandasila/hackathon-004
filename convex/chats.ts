import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Create or get existing chat between two users for a specific listing
 */
export const createOrGetChat = mutation({
  args: {
    listingId: v.id("listings"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
  },
  handler: async (ctx, { listingId, buyerId, sellerId }) => {
    // Check if chat already exists
    const existingChat = await ctx.db
      .query("chats")
      .withIndex("by_listingId", (q) => q.eq("listingId", listingId))
      .filter((q) => 
        q.and(
          q.eq(q.field("participantIds"), [buyerId, sellerId]),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    if (existingChat) {
      return existingChat._id;
    }

    // Create new chat
    const chatId = await ctx.db.insert("chats", {
      listingId,
      participantIds: [buyerId, sellerId],
      isActive: true,
      isBlocked: false,
      lastMessageAt: Date.now(),
      lastMessagePreview: "Chat started",
      unreadCounts: {
        [buyerId]: 0,
        [sellerId]: 0,
      },
    });

    // Create initial system message
    await ctx.db.insert("messages", {
      chatId,
      senderId: buyerId,
      body: "Chat started for this listing",
      messageType: "system",
      systemMessageType: "chat_started",
      isRead: false,
    });

    return chatId;
  },
});

/**
 * Send a message in a chat
 */
export const sendMessage = mutation({
  args: {
    chatId: v.id("chats"),
    senderId: v.id("users"),
    body: v.string(),
    messageType: v.optional(v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("location")
    )),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { chatId, senderId, body, messageType = "text", imageUrl }) => {
    // Verify chat exists and user is participant
    const chat = await ctx.db.get(chatId);
    if (!chat || !chat.participantIds.includes(senderId)) {
      throw new Error("Unauthorized to send message in this chat");
    }

    if (!chat.isActive) {
      throw new Error("Cannot send message to inactive chat");
    }

    if (chat.isBlocked) {
      throw new Error("Cannot send message to blocked chat");
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      chatId,
      senderId,
      body,
      messageType,
      imageUrl,
      isRead: false,
    });

    // Update chat with last message info
    const otherParticipantId = chat.participantIds.find(id => id !== senderId);
    const newUnreadCounts = { ...chat.unreadCounts };
    if (otherParticipantId) {
      newUnreadCounts[otherParticipantId] = (newUnreadCounts[otherParticipantId] || 0) + 1;
    }

    await ctx.db.patch(chatId, {
      lastMessageAt: Date.now(),
      lastMessagePreview: messageType === "text" ? body.substring(0, 100) : `Sent ${messageType}`,
      unreadCounts: newUnreadCounts,
    });

    // Create notification for the other participant
    if (otherParticipantId) {
      const sender = await ctx.db.get(senderId);
      const listing = await ctx.db.get(chat.listingId);
      const masterItem = listing ? await ctx.db.get(listing.masterItemId) : null;
      
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        userId: otherParticipantId,
        title: `New message from ${sender?.name || 'Someone'}`,
        message: `About ${masterItem?.name || 'your listing'}: ${body.substring(0, 50)}${body.length > 50 ? '...' : ''}`,
        type: "message_received" as const,
        category: "messages" as const,
        relatedId: chatId,
        relatedType: "chat" as const,
        actionUrl: `/messages`,
        priority: "medium" as const,
        senderId: senderId,
      });
    }

    return messageId;
  },
});

/**
 * Get messages for a chat
 */
export const getChatMessages = query({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
  },
  handler: async (ctx, { chatId, userId }) => {
    // Verify user is participant
    const chat = await ctx.db.get(chatId);
    if (!chat || !chat.participantIds.includes(userId)) {
      throw new Error("Unauthorized to view this chat");
    }

    // Get messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(50); // Limit to last 50 messages

    // Get sender details for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender: sender ? {
            _id: sender._id,
            name: sender.name,
            imageUrl: sender.imageUrl,
          } : null,
        };
      })
    );

    return messagesWithSenders.reverse();
  },
});

/**
 * Get user's chats
 */
export const getUserChats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Get all active chats and filter where user is a participant
    const allChats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    // Filter chats where user is a participant
    const chats = allChats.filter(chat => 
      chat.participantIds.includes(userId)
    );

    // Get additional details for each chat
    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        const listing = await ctx.db.get(chat.listingId);
        const otherParticipantId = chat.participantIds.find(id => id !== userId);
        const otherParticipant = otherParticipantId ? await ctx.db.get(otherParticipantId) : null;
        
        // Get master item details
        const masterItem = listing ? await ctx.db.get(listing.masterItemId) : null;

        return {
          ...chat,
          listing: listing ? {
            _id: listing._id,
            masterItemId: listing.masterItemId,
            price: listing.price,
            unit: listing.unit,
            imageUrl: listing.imageUrl,
            masterItem: masterItem ? {
              name: masterItem.name,
              category: masterItem.category,
            } : null,
          } : null,
          otherParticipant: otherParticipant ? {
            _id: otherParticipant._id,
            name: otherParticipant.name,
            imageUrl: otherParticipant.imageUrl,
          } : null,
          unreadCount: chat.unreadCounts?.[userId] || 0,
        };
      })
    );

    return chatsWithDetails;
  },
});

/**
 * Mark messages as read
 */
export const markMessagesAsRead = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
  },
  handler: async (ctx, { chatId, userId }) => {
    // Verify user is participant
    const chat = await ctx.db.get(chatId);
    if (!chat || !chat.participantIds.includes(userId)) {
      throw new Error("Unauthorized to mark messages as read");
    }

    // Update unread count for user
    const newUnreadCounts = { ...chat.unreadCounts };
    newUnreadCounts[userId] = 0;

    await ctx.db.patch(chatId, {
      unreadCounts: newUnreadCounts,
    });

    // Mark individual messages as read
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .filter((q) => 
        q.and(
          q.neq(q.field("senderId"), userId),
          q.eq(q.field("isRead"), false)
        )
      )
      .collect();

    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, {
        isRead: true,
        readAt: Date.now(),
      });
    }
  },
});

/**
 * Block or unblock a chat
 */
export const toggleChatBlock = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
    isBlocked: v.boolean(),
  },
  handler: async (ctx, { chatId, userId, isBlocked }) => {
    // Verify user is participant
    const chat = await ctx.db.get(chatId);
    if (!chat || !chat.participantIds.includes(userId)) {
      throw new Error("Unauthorized to modify this chat");
    }

    await ctx.db.patch(chatId, {
      isBlocked,
      blockedBy: isBlocked ? userId : undefined,
    });
  },
});

/**
 * Get a single chat by ID with all details
 */
export const getChatById = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, { chatId }) => {
    const chat = await ctx.db.get(chatId);
    if (!chat) return null;

    const listing = await ctx.db.get(chat.listingId);
    if (!listing) return null;

    // Get master item details
    const masterItem = await ctx.db.get(listing.masterItemId);
    
    // Get seller details
    const seller = await ctx.db.get(listing.sellerId);

    return {
      ...chat,
      listing: {
        _id: listing._id,
        masterItemId: listing.masterItemId,
        sellerId: listing.sellerId,
        price: listing.price,
        quantity: listing.quantity,
        unit: listing.unit,
        imageUrl: listing.imageUrl,
        masterItem: masterItem ? {
          name: masterItem.name,
          category: masterItem.category,
        } : null,
        seller: seller ? {
          _id: seller._id,
          name: seller.name,
          phone: seller.phone,
          shopName: seller.shopName,
          shopAddress: seller.shopAddress,
          imageUrl: seller.imageUrl,
        } : null,
      },
    };
  },
});
