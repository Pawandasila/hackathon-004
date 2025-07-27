"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, Plus } from "lucide-react";
import Link from "next/link";

interface FormData {
  masterItemId: Id<"masterItems"> | "";
  description: string;
  price: number;
  quantity: number;
  unit: string;
  condition: "fresh" | "good" | "fair";
  tags: string[];
  notes: string;
  isDeliveryAvailable: boolean;
  isPickupAvailable: boolean;
  deliveryRadius: number;
  expiresIn: number; // hours
  imageUrl?: string;
}

const CONDITION_OPTIONS = [
  { value: "fresh", label: "Fresh" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

const CATEGORY_OPTIONS = [
  "Vegetable",
  "Fruit", 
  "Spice",
  "Lentil",
  "Flour & Grain",
  "Dairy & Fat",
  "Other"
];

const UNIT_OPTIONS = [
  "kg",
  "gram",
  "piece",
  "bunch",
  "packet",
  "bottle",
  "can",
  "box",
];

const EXPIRY_OPTIONS = [
  { value: 6, label: "6 hours" },
  { value: 12, label: "12 hours" },
  { value: 24, label: "1 day" },
  { value: 48, label: "2 days" },
  { value: 72, label: "3 days" },
  { value: 168, label: "1 week" },
];

export default function PostSurplusPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // States for searchable select
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAlias, setNewItemAlias] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Vegetable");
  
  // Ref for dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    masterItemId: "",
    description: "",
    price: 0,
    quantity: 1,
    unit: "kg",
    condition: "fresh",
    tags: [],
    notes: "",
    isDeliveryAvailable: true,
    isPickupAvailable: true,
    deliveryRadius: 5,
    expiresIn: 24,
    imageUrl: "",
  });

  // Fetch master items for the dropdown
  const masterItems = useQuery(api.masterItems.getAll);
  
  // Mutation to create a new listing
  const createListing = useMutation(api.listings.create);
  
  // Mutation to create new master item
  const createMasterItem = useMutation(api.masterItems.create);
  
  // Mutation to seed database
  const seedDatabase = useMutation(api.seed.seedAll);
  const [isSeeding, setIsSeeding] = useState(false);

  // Filter master items based on search term
  const filteredItems = masterItems?.filter((item: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    // Search in name
    if (item.name.toLowerCase().includes(term)) return true;
    
    // Search in aliases
    if (item.aliases && item.aliases.some((alias: string) => 
      alias.toLowerCase().includes(term)
    )) return true;
    
    return false;
  }) || [];

  // Get selected item name for display
  const selectedItem = masterItems?.find((item: any) => item._id === formData.masterItemId);

  const handleCreateNewItem = async () => {
    if (!newItemName.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    try {
      const aliases = newItemAlias.trim() 
        ? [newItemAlias.trim()] 
        : [newItemName.trim()];

      const newItemId = await createMasterItem({
        name: newItemName.trim(),
        category: newItemCategory,
        aliases: aliases,
      });

      // Select the newly created item
      handleInputChange("masterItemId", newItemId);
      setSearchTerm(newItemName.trim());
      
      // Reset form
      setNewItemName("");
      setNewItemAlias("");
      setShowAddNew(false);
      setIsDropdownOpen(false);
      
      toast.success("New item created and selected!");
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Failed to create new item");
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setImageUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `listing_${Date.now()}`);
      formData.append('folder', '/listings');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      // Update form data with the uploaded image URL
      handleInputChange("imageUrl", result.url);
      setImagePreview(result.url);
      
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    handleInputChange("imageUrl", "");
    setImagePreview(null);
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const result = await seedDatabase({});
      toast.success(`Database seeded successfully! Created ${result.masterItems.created} items and ${result.platformPrices.created} platform prices.`);
    } catch (error) {
      console.error("Error seeding database:", error);
      toast.error("Failed to seed database");
    } finally {
      setIsSeeding(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Set image preview when imageUrl changes
  useEffect(() => {
    if (formData.imageUrl && !imagePreview) {
      setImagePreview(formData.imageUrl);
    }
  }, [formData.imageUrl, imagePreview]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.masterItemId) {
      toast.error("Please select an item");
      return;
    }

    if (formData.price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (formData.quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setIsSubmitting(true);

    try {
      const listingData = {
        masterItemId: formData.masterItemId as Id<"masterItems">,
        description: formData.description,
        price: Math.round(formData.price * 100), // Convert to paise
        quantity: formData.quantity,
        unit: formData.unit,
        imageUrl: formData.imageUrl || "/logo.png", // Use fallback image if not provided
        expiryHours: formData.expiresIn,
        condition: formData.condition,
        tags: formData.tags,
        notes: formData.notes,
        isDeliveryAvailable: formData.isDeliveryAvailable,
        isPickupAvailable: formData.isPickupAvailable,
        deliveryRadius: formData.deliveryRadius,
      };

      const listingId = await createListing(listingData);

      toast.success("Listing created successfully!");
      router.push(`/listing/${listingId}`);
    } catch (error) {
      console.error("Error creating listing:", error);
      toast.error("Failed to create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            
            {/* Seed Database Button - for development */}
            {(!masterItems || masterItems.length === 0) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                {isSeeding ? "Seeding..." : "Seed Database"}
              </Button>
            )}
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Share Your Surplus Food
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Help reduce food waste by sharing your excess food with the community
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Basic Information */}
          <div className="space-y-6">
            
            {/* What are you sharing? */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-gray-800 flex items-center">
                  🥬 What are you sharing?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-base font-medium text-gray-700 mb-2 block">
                    Food Item *
                  </Label>
                  <div className="relative" ref={dropdownRef}>
                    <Input
                      className="h-12 text-base"
                      placeholder="Search for food item (e.g., tomato, pyaz, aam)"
                      value={selectedItem ? selectedItem.name : searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                        if (selectedItem) {
                          handleInputChange("masterItemId", "");
                        }
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      disabled={masterItems === undefined}
                    />
                    
                    {isDropdownOpen && masterItems && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                        {filteredItems.length > 0 ? (
                          filteredItems.map((item: any) => (
                            <div
                              key={item._id}
                              className="px-4 py-2 cursor-pointer hover:bg-blue-50 border-b last:border-b-0"
                              onClick={() => {
                                handleInputChange("masterItemId", item._id);
                                setSearchTerm(item.name);
                                setIsDropdownOpen(false);
                                setShowAddNew(false);
                              }}
                            >
                              <div className="font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">
                                {item.category}
                                {item.aliases && item.aliases.length > 0 && (
                                  <span className="ml-2">
                                    • Also known as: {item.aliases.join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : searchTerm ? (
                          <div className="px-4 py-3">
                            <div className="text-gray-500 mb-3">
                              No items found for "{searchTerm}"
                            </div>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                              onClick={() => {
                                setShowAddNew(true);
                                setNewItemName(searchTerm);
                              }}
                            >
                              ➕ Add "{searchTerm}" as new item
                            </button>
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-gray-500">
                            Start typing to search items...
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add new item form */}
                  {showAddNew && (
                    <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-medium mb-3 text-blue-800">Add New Food Item</h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Item Name *</Label>
                          <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Enter item name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Category *</Label>
                          <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORY_OPTIONS.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Other Names (Optional)</Label>
                          <Input
                            value={newItemAlias}
                            onChange={(e) => setNewItemAlias(e.target.value)}
                            placeholder="e.g., Pyaz, Kanda"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            onClick={handleCreateNewItem}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Add Item
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowAddNew(false);
                              setNewItemName("");
                              setNewItemAlias("");
                            }}
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium text-gray-700 mb-2 block">
                    Tell us about it *
                  </Label>
                  <Textarea
                    className="min-h-[100px] text-base"
                    placeholder="Describe your food - freshness, quantity details, best before date, etc."
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleInputChange("description", e.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <Label className="text-base font-medium text-gray-700 mb-2 block">
                    Add Photo (Optional)
                  </Label>
                  
                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                        }}
                        disabled={imageUploading}
                        className="hidden"
                        id="image-upload"
                      />
                      <label 
                        htmlFor="image-upload" 
                        className="cursor-pointer flex flex-col items-center"
                      >
                        {imageUploading ? (
                          <>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                            <p className="text-gray-600">Uploading...</p>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-gray-600 mb-1">Click to upload an image</p>
                            <p className="text-sm text-gray-500">PNG, JPG, WEBP up to 5MB</p>
                          </>
                        )}
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-500 mt-2">
                    Photos help others see what you're sharing
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quantity & Price */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-gray-800 flex items-center">
                  ⚖️ How much & how much?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base font-medium text-gray-700 mb-2 block">
                      Quantity *
                    </Label>
                    <Input
                      className="h-12 text-base"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={formData.quantity}
                      onChange={(e) =>
                        handleInputChange("quantity", parseFloat(e.target.value) || 0)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium text-gray-700 mb-2 block">
                      Unit *
                    </Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value: string) => handleInputChange("unit", value)}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base font-medium text-gray-700 mb-2 block">
                      Price per {formData.unit} (₹) *
                    </Label>
                    <Input
                      className="h-12 text-base"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        handleInputChange("price", parseFloat(e.target.value) || 0)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-base font-medium text-gray-700 mb-2 block">
                      Condition *
                    </Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value: string) => handleInputChange("condition", value)}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Availability & Additional Info */}
          <div className="space-y-6">
            
            {/* Availability */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-gray-800 flex items-center">
                  🚚 How to get it?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-base font-medium text-gray-700 mb-3 block">
                    Available for how long?
                  </Label>
                  <Select
                    value={formData.expiresIn.toString()}
                    onValueChange={(value: string) =>
                      handleInputChange("expiresIn", parseInt(value))
                    }
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPIRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium text-gray-700 block">
                    How can people get it?
                  </Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id="pickup"
                        checked={formData.isPickupAvailable}
                        onCheckedChange={(checked: boolean) =>
                          handleInputChange("isPickupAvailable", checked)
                        }
                      />
                      <Label htmlFor="pickup" className="text-base font-medium">
                        🏠 Pickup from my location
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id="delivery"
                        checked={formData.isDeliveryAvailable}
                        onCheckedChange={(checked: boolean) =>
                          handleInputChange("isDeliveryAvailable", checked)
                        }
                      />
                      <Label htmlFor="delivery" className="text-base font-medium">
                        🚛 I can deliver
                      </Label>
                    </div>
                  </div>

                  {formData.isDeliveryAvailable && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <Label className="text-base font-medium text-gray-700 mb-2 block">
                        How far can you deliver? (km)
                      </Label>
                      <Input
                        className="h-12 text-base"
                        type="number"
                        min="1"
                        max="50"
                        value={formData.deliveryRadius}
                        onChange={(e) =>
                          handleInputChange("deliveryRadius", parseInt(e.target.value) || 5)
                        }
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-gray-800 flex items-center">
                  📝 Anything else?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-base font-medium text-gray-700 mb-2 block">
                    Tags (Optional)
                  </Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      className="h-12 text-base"
                      placeholder="e.g., organic, homemade, spicy"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addTag())
                      }
                    />
                    <Button type="button" onClick={addTag} size="lg" className="px-6">
                      Add
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 cursor-pointer hover:bg-green-200"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ✕
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium text-gray-700 mb-2 block">
                    Special Notes (Optional)
                  </Label>
                  <Textarea
                    className="min-h-[100px] text-base"
                    placeholder="Any special instructions, best before date, preparation details, etc."
                    value={formData.notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleInputChange("notes", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="space-y-4">
              <Button
                type="submit"
                disabled={isSubmitting || !formData.masterItemId}
                className="w-full h-14 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSubmitting ? "Posting..." : "🚀 Share My Food"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="w-full h-12 text-black"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
