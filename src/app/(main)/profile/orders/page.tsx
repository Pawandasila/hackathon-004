"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
  MapPin,
  User,
  Calendar,
  Star,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

export default function OrdersPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState<
    "pending" | "accepted" | "rejected" | "completed" | "all"
  >("pending");
  const [viewType, setViewType] = useState<"seller" | "buyer">("seller");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [response, setResponse] = useState("");

  const shouldQuery = isLoaded && isSignedIn;

  const allOrders = useQuery(
    api.orders.getUserOrders,
    shouldQuery
      ? {
          type: viewType,
        }
      : "skip"
  );

  const orders = useQuery(
    api.orders.getUserOrders,
    shouldQuery
      ? {
          type: viewType,
          status: activeTab === "all" ? undefined : activeTab,
        }
      : "skip"
  );

  const pendingCount = useQuery(
    api.orders.getPendingOrdersCount,
    shouldQuery ? {} : "skip"
  );

  console.log("Auth state:", { isLoaded, isSignedIn, shouldQuery });
  console.log("View type:", viewType);
  console.log("Active tab:", activeTab);
  console.log("All orders received:", allOrders?.length);
  console.log("All orders by status:", {
    pending: allOrders?.filter((o) => o.status === "pending").length,
    accepted: allOrders?.filter((o) => o.status === "accepted").length,
    rejected: allOrders?.filter((o) => o.status === "rejected").length,
    completed: allOrders?.filter((o) => o.status === "completed").length,
  });
  console.log("Filtered orders received:", orders?.length);
  console.log(
    "Filtered orders:",
    orders?.map((o) => o.status)
  );

  const respondToOrder = useMutation(api.orders.respondToOrder);
  const completeOrder = useMutation(api.orders.completeOrder);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-8 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Sign In Required
            </h3>
            <p className="text-gray-500 text-center mb-4">
              Please sign in to view your orders and manage your business.
            </p>
            <Button asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatPrice = (priceInPaise: number) => {
    return `₹${(priceInPaise / 100).toFixed(2)}`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "completed":
        return <Package className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await respondToOrder({
        orderId: orderId as any,
        status: "accepted",
        sellerResponse: response.trim() || undefined,
      });
      toast.success("Order accepted successfully!");
      setRespondingTo(null);
      setResponse("");
    } catch (error: any) {
      toast.error(error.message || "Failed to accept order");
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      if (!response.trim()) {
        toast.error("Please provide a reason for rejection");
        return;
      }

      await respondToOrder({
        orderId: orderId as any,
        status: "rejected",
        rejectionReason: response.trim(),
      });
      toast.success("Order rejected");
      setRespondingTo(null);
      setResponse("");
    } catch (error: any) {
      toast.error(error.message || "Failed to reject order");
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await completeOrder({
        orderId: orderId as any,
        completionNotes: "Order completed successfully",
      });
      toast.success("Order marked as completed!");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete order");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Management
          </h1>
          <p className="text-gray-600">
            {viewType === "seller"
              ? "Manage orders from buyers and track your sales"
              : "View your order history and track your purchases"}
          </p>

          {/* View Type Switcher */}
          <div className="mt-4">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                onClick={() => setViewType("seller")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewType === "seller"
                    ? "bg-white text-orange-600 shadow-sm border border-gray-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                💰 As Seller
              </button>
              <button
                onClick={() => setViewType("buyer")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewType === "buyer"
                    ? "bg-white text-orange-600 shadow-sm border border-gray-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🛒 As Buyer
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {allOrders?.filter((o) => o.status === "pending").length ||
                      0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-green-600">
                    {allOrders?.filter((o) => o.status === "accepted").length ||
                      0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {allOrders?.filter((o) => o.status === "rejected").length ||
                      0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {allOrders?.filter((o) => o.status === "completed")
                      .length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {viewType === "seller" ? "Total Revenue" : "Total Spent"}
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatPrice(
                      allOrders
                        ?.filter((o) => o.status === "completed")
                        .reduce((sum, o) => sum + o.totalAmount, 0) || 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                {
                  key: "pending",
                  label: "Pending",
                  count: allOrders?.filter((o) => o.status === "pending")
                    .length,
                },
                {
                  key: "accepted",
                  label: "Accepted",
                  count: allOrders?.filter((o) => o.status === "accepted")
                    .length,
                },
                {
                  key: "rejected",
                  label: "Rejected",
                  count: allOrders?.filter((o) => o.status === "rejected")
                    .length,
                },
                {
                  key: "completed",
                  label: "Completed",
                  count: allOrders?.filter((o) => o.status === "completed")
                    .length,
                },
                { key: "all", label: "All Orders", count: allOrders?.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.key
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {tab.count && tab.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {!orders || orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {activeTab === "pending" &&
                    (viewType === "seller"
                      ? "No pending orders"
                      : "No pending orders")}
                  {activeTab === "accepted" &&
                    (viewType === "seller"
                      ? "No accepted orders"
                      : "No accepted orders")}
                  {activeTab === "rejected" &&
                    (viewType === "seller"
                      ? "No rejected orders"
                      : "No rejected orders")}
                  {activeTab === "completed" &&
                    (viewType === "seller"
                      ? "No completed orders"
                      : "No completed orders")}
                  {activeTab === "all" && "No orders found"}
                </h3>
                <p className="text-gray-500 text-center">
                  {activeTab === "pending" &&
                    viewType === "seller" &&
                    "New orders will appear here when buyers contact you."}
                  {activeTab === "pending" &&
                    viewType === "buyer" &&
                    "Orders you've placed that are awaiting seller response will appear here."}
                  {activeTab === "accepted" &&
                    viewType === "seller" &&
                    "Orders you've accepted will appear here."}
                  {activeTab === "accepted" &&
                    viewType === "buyer" &&
                    "Orders that sellers have accepted will appear here."}
                  {activeTab === "rejected" &&
                    viewType === "seller" &&
                    "Orders you've rejected will appear here."}
                  {activeTab === "rejected" &&
                    viewType === "buyer" &&
                    "Orders that were rejected by sellers will appear here."}
                  {activeTab === "completed" &&
                    viewType === "seller" &&
                    "Completed transactions will appear here."}
                  {activeTab === "completed" &&
                    viewType === "buyer" &&
                    "Your completed purchases will appear here."}
                  {activeTab === "all" &&
                    viewType === "seller" &&
                    "No orders in any category yet."}
                  {activeTab === "all" &&
                    viewType === "buyer" &&
                    "You haven't placed any orders yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card
                key={order._id}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      {/* Item Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={
                            order.listing?.imageUrl ||
                            order.masterItem?.imageUrl ||
                            "/logo.png"
                          }
                          alt={order.masterItem?.name || "Item"}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/logo.png";
                          }}
                        />
                      </div>

                      {/* Order Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {order.masterItem?.name || "Unknown Item"}
                          </h3>
                          <Badge
                            className={`${getStatusColor(order.status)} border`}
                          >
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">
                              {order.status}
                            </span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Quantity:</span>
                            <p>
                              {order.quantity} {order.unit}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Total Amount:</span>
                            <p className="text-lg font-bold text-orange-600">
                              {formatPrice(order.totalAmount)}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Contact Method:</span>
                            <p className="capitalize">{order.contactMethod}</p>
                          </div>
                          <div>
                            <span className="font-medium">Order Date:</span>
                            <p>{formatTime(order._creationTime)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Contact Information - Show relevant person based on perspective */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {viewType === "seller"
                          ? "Buyer Information"
                          : "Seller Information"}
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {viewType === "seller" ? (
                          <>
                            <p>
                              <span className="font-medium">Name:</span>{" "}
                              {order.buyer?.name}
                            </p>
                            {order.buyerPhone && (
                              <p className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {order.buyerPhone}
                              </p>
                            )}
                            {order.buyer?.shopName && (
                              <p>
                                <span className="font-medium">Shop:</span>{" "}
                                {order.buyer.shopName}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p>
                              <span className="font-medium">Name:</span>{" "}
                              {order.seller?.name}
                            </p>
                            {order.seller?.phone && (
                              <p className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {order.seller.phone}
                              </p>
                            )}
                            {order.seller?.shopName && (
                              <p>
                                <span className="font-medium">Shop:</span>{" "}
                                {order.seller.shopName}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Delivery Details
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {order.deliveryAddress && (
                          <p>
                            <span className="font-medium">Address:</span>{" "}
                            {order.deliveryAddress}
                          </p>
                        )}
                        {order.preferredTime && (
                          <p>
                            <span className="font-medium">Preferred Time:</span>{" "}
                            {order.preferredTime}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  {order.buyerMessage && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <h4 className="font-medium text-blue-900 mb-1 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Buyer's Message
                      </h4>
                      <p className="text-sm text-blue-800">
                        {order.buyerMessage}
                      </p>
                    </div>
                  )}

                  {order.sellerResponse && (
                    <div className="bg-green-50 p-3 rounded-lg mb-4">
                      <h4 className="font-medium text-green-900 mb-1">
                        Your Response
                      </h4>
                      <p className="text-sm text-green-800">
                        {order.sellerResponse}
                      </p>
                    </div>
                  )}

                  {order.rejectionReason && (
                    <div className="bg-red-50 p-3 rounded-lg mb-4">
                      <h4 className="font-medium text-red-900 mb-1">
                        Rejection Reason
                      </h4>
                      <p className="text-sm text-red-800">
                        {order.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4">
                    {/* Seller Actions */}
                    {viewType === "seller" && (
                      <>
                        {order.status === "pending" && (
                          <>
                            {respondingTo === order._id ? (
                              <div className="flex-1 space-y-3">
                                <Textarea
                                  value={response}
                                  onChange={(e) => setResponse(e.target.value)}
                                  placeholder="Add a message (optional for accept, required for reject)..."
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleAcceptOrder(order._id)}
                                    className="bg-green-500 hover:bg-green-600"
                                    size="sm"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Confirm Accept
                                  </Button>
                                  <Button
                                    onClick={() => handleRejectOrder(order._id)}
                                    variant="destructive"
                                    size="sm"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Confirm Reject
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setRespondingTo(null);
                                      setResponse("");
                                    }}
                                    variant="outline"
                                    size="sm"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <Button
                                  onClick={() => setRespondingTo(order._id)}
                                  className="bg-green-500 hover:bg-green-600"
                                  size="sm"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Accept Order
                                </Button>
                                <Button
                                  onClick={() => setRespondingTo(order._id)}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject Order
                                </Button>
                              </>
                            )}
                          </>
                        )}

                        {order.status === "accepted" && (
                          <Button
                            onClick={() => handleCompleteOrder(order._id)}
                            className="bg-blue-500 hover:bg-blue-600"
                            size="sm"
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Mark as Completed
                          </Button>
                        )}

                        {/* Contact Buyer */}
                        {order.buyerPhone && order.status !== "rejected" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(`tel:${order.buyerPhone}`, "_self")
                            }
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call Buyer
                          </Button>
                        )}
                      </>
                    )}

                    {/* Buyer Actions */}
                    {viewType === "buyer" && (
                      <>
                        {/* Contact Seller */}
                        {order.seller?.phone && order.status !== "rejected" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${order.seller?.phone}`, '_self')}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Call Seller
                          </Button>
                        )}
                        
                        {/* Show status message for buyer */}
                        <div className="flex-1">
                          {order.status === "pending" && (
                            <p className="text-sm text-yellow-600 font-medium">
                              ⏳ Waiting for seller response
                            </p>
                          )}
                          {order.status === "accepted" && (
                            <p className="text-sm text-green-600 font-medium">
                              ✅ Order accepted - seller will contact you soon
                            </p>
                          )}
                          {order.status === "rejected" && (
                            <p className="text-sm text-red-600 font-medium">
                              ❌ Order was rejected
                            </p>
                          )}
                          {order.status === "completed" && (
                            <p className="text-sm text-blue-600 font-medium">
                              📦 Order completed successfully
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* View Listing - Available for both */}
                    {order.listing && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/listing/${order.listingId}`}>
                          View Listing
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
