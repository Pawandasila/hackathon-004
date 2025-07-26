'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Store, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  FileText,
  Save,
  Upload,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfileCompletion } from '@/hooks/use-profile-completion';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { completionPercentage, missingFields, checkCompletion } = useProfileCompletion();
  
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [shopImage, setShopImage] = useState('');
  
  const profileImageRef = useRef<HTMLInputElement>(null);
  const shopImageRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    shopName: '',
    address: '',
    bio: '',
  });

  // Update form data when user data loads or changes
  useEffect(() => {
    if (user && isLoaded) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.emailAddresses?.[0]?.emailAddress || '',
        phone: user.phoneNumbers?.[0]?.phoneNumber || '',
        shopName: user.publicMetadata?.shopName as string || '',
        address: user.publicMetadata?.address as string || '',
        bio: user.publicMetadata?.bio as string || '',
      });
      
      setProfileImage(user.imageUrl || '');
      setShopImage(user.publicMetadata?.shopImage as string || '');
    }
  }, [user, isLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (file: File, type: 'profile' | 'shop') => {
    try {
      setIsLoading(true);
      
      // Create FormData for upload
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('fileName', `${type}_${user?.id}_${Date.now()}`);
      uploadData.append('folder', type === 'profile' ? '/profiles' : '/shops');

      // Upload to ImageKit via API route
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (type === 'profile') {
        setProfileImage(result.url);
        toast.success('Profile image updated successfully!');
      } else {
        setShopImage(result.url);
        toast.success('Shop image updated successfully!');
      }
      
    } catch (error) {
      toast.error(`Failed to upload ${type} image`);
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);

      // Update Clerk user data
      await user?.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      // Update metadata
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          shopName: formData.shopName,
          address: formData.address,
          bio: formData.bio,
          shopImage: shopImage,
        }
      });

      // If profile image changed, update it
      if (profileImage !== user?.imageUrl) {
        await user?.setProfileImage({ file: profileImage });
      }

      // Recheck completion status
      checkCompletion();
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your profile information and shop details</p>
          
          {/* Completion Status */}
          <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Profile Completion</span>
              <span className="text-sm font-bold text-orange-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
              />
            </div>
            {missingFields.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span>Missing: {missingFields.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Images */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image */}
                <div className="text-center">
                  <Label className="text-sm font-medium text-gray-700">Profile Picture</Label>
                  <div className="mt-2 relative">
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-200 relative">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <button
                        onClick={() => profileImageRef.current?.click()}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </button>
                    </div>
                    <input
                      ref={profileImageRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'profile');
                      }}
                    />
                  </div>
                </div>

                {/* Shop Image */}
                <div className="text-center">
                  <Label className="text-sm font-medium text-gray-700">Shop Image</Label>
                  <div className="mt-2 relative">
                    <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-200 relative">
                      {shopImage ? (
                        <img
                          src={shopImage}
                          alt="Shop"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <button
                        onClick={() => shopImageRef.current?.click()}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <Upload className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <input
                      ref={shopImageRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'shop');
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                {/* Contact Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        className="pl-10"
                        disabled
                        placeholder="Email address"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="+91 XXXXXXXXXX"
                      />
                    </div>
                  </div>
                </div>

                {/* Shop Details */}
                <div>
                  <Label htmlFor="shopName">Shop/Business Name</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="shopName"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Enter your shop or business name"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter your complete address"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio">Bio/Description</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="Tell people about yourself and your food..."
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save Profile
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}