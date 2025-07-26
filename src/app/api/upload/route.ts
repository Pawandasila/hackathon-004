import { NextRequest, NextResponse } from 'next/server';
import ImageKit from 'imagekit';
import { auth } from '@clerk/nextjs/server';

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const folder = formData.get('folder') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: fileName || `${userId}_${Date.now()}`,
      folder: folder || '/general',
      useUniqueFileName: true,
      tags: [`user_${userId}`],
    });

    return NextResponse.json({
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      name: uploadResponse.name,
    });

  } catch (error) {
    console.error('ImageKit upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

// Generate authentication parameters for client-side uploads
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authenticationParameters = imagekit.getAuthenticationParameters();
    return NextResponse.json(authenticationParameters);
    
  } catch (error) {
    console.error('ImageKit auth error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication parameters' },
      { status: 500 }
    );
  }
}