import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
import { auth } from "@clerk/nextjs/server";
import https from "https";

// Validate environment variables
if (!process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY) {
  throw new Error("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is not set");
}
if (!process.env.IMAGEKIT_PRIVATE_KEY) {
  throw new Error("IMAGEKIT_PRIVATE_KEY is not set");
}
if (!process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
  throw new Error("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT is not set");
}

// Create custom HTTPS agent to handle SSL issues
const httpsAgent = new https.Agent({
  secureProtocol: 'TLSv1_2_method',
  ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384',
  rejectUnauthorized: true,
});

// Initialize ImageKit with custom options
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
  transformationPosition: 'query',
});

// Custom upload function using fetch to avoid SSL issues
async function uploadToImageKitDirectly(buffer: Buffer, fileName: string, folder: string) {
  const formData = new FormData();
  const blob = new Blob([buffer]);
  
  formData.append('file', blob);
  formData.append('fileName', fileName);
  formData.append('folder', folder);
  
  // Create basic auth header
  const auth = Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64');
  
  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`ImageKit upload failed: ${response.status} - ${errorData}`);
  }

  return await response.json();
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;
    const folder = formData.get("folder") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "Please select an image file" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size should be less than 5MB" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = fileName?.replace(/[^a-zA-Z0-9.-]/g, "_") || "upload";
    const uniqueFileName = `${userId}/${timestamp}_${sanitizedFileName}`;

    // Use the folder from form data or default to "/projects"
    const uploadFolder = folder || "/projects";

    // Upload to ImageKit using direct API call to avoid SSL issues
    const uploadResponse = await uploadToImageKitDirectly(
      buffer,
      uniqueFileName,
      uploadFolder
    );

    // Generate thumbnail URL using ImageKit transformations
    const thumbnailUrl = imagekit.url({
      src: uploadResponse.url,
      transformation: [
        {
          width: 400,
          height: 300,
          cropMode: "maintain_ar",
          quality: 80,
        },
      ],
    });

    // Return upload data
    return NextResponse.json({
      success: true,
      url: uploadResponse.url,
      thumbnailUrl: thumbnailUrl,
      fileId: uploadResponse.fileId,
      width: uploadResponse.width,
      height: uploadResponse.height,
      size: uploadResponse.size,
      name: uploadResponse.name,
    });
  } catch (error: any) {
    console.error("ImageKit upload error:", error);
    
    // More specific error handling
    let errorMessage = "Failed to upload image";
    let statusCode = 500;
    
    if (error.message?.includes("Authentication")) {
      errorMessage = "ImageKit authentication failed";
      statusCode = 401;
    } else if (error.message?.includes("File size")) {
      errorMessage = "File too large";
      statusCode = 400;
    } else if (error.message?.includes("File type")) {
      errorMessage = "Invalid file type";
      statusCode = 400;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error.message,
      },
      { status: statusCode }
    );
  }
}
