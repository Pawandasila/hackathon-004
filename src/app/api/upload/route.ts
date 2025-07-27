import { NextRequest, NextResponse } from 'next/server';
import ImageKit from 'imagekit';

export async function POST(request: NextRequest) {
  try {
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || 
        !process.env.IMAGEKIT_PRIVATE_KEY || 
        !process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
      // Return fallback response when ImageKit is not configured
      console.log('ImageKit not configured, using fallback image');
      return NextResponse.json({
        success: true,
        url: "/logo.png",
        fileId: `fallback_${Date.now()}`,
        name: "fallback_image",
        message: 'Using fallback image - ImageKit not configured'
      });
    }

    // Initialize ImageKit
    const imagekit = new ImageKit({
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
    });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const folder = formData.get('folder') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size should be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const uniqueFileName = fileName || `${Date.now()}_${file.name}`;
    
    // Upload to ImageKit with timeout
    const uploadResponse = await Promise.race([
      imagekit.upload({
        file: buffer,
        fileName: uniqueFileName,
        folder: folder || '/listings',
        useUniqueFileName: true,
        overwriteFile: false,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 15000)
      )
    ]) as any;

    return NextResponse.json({
      success: true,
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      name: uploadResponse.name,
    });

  } catch (error) {
    console.error('ImageKit upload error:', error);
    
    // Return fallback response instead of error
    return NextResponse.json({
      success: true,
      url: "/logo.png",
      fileId: `fallback_${Date.now()}`,
      name: "fallback_image", 
      message: 'Upload failed, using fallback image'
    });
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
