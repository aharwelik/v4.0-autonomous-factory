import { NextRequest, NextResponse } from "next/server";
import { settings, costs } from "@/lib/db";

/**
 * Generate Image API - Uses Gemini Imagen for preview images
 * Falls back to placeholder if not configured
 */

export async function POST(request: NextRequest) {
  try {
    const { prompt, width = 1024, height = 768 } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    const geminiKey = settings.get<string>("GEMINI_API_KEY");

    if (!geminiKey) {
      // Return placeholder image URL
      return NextResponse.json({
        success: true,
        imageUrl: `https://placehold.co/${width}x${height}/1a1a2e/ffffff?text=${encodeURIComponent(prompt.slice(0, 30))}`,
        placeholder: true,
        message: "Using placeholder - add Gemini API key for AI images",
      });
    }

    // Try Gemini Imagen API
    try {
      // Gemini 2.0 Flash has image generation built-in
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate an image: ${prompt}`
                  }
                ]
              }
            ],
            generationConfig: {
              responseModalities: ["image", "text"],
              responseMimeType: "image/png"
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      // Check for image in response
      const imagePart = data.candidates?.[0]?.content?.parts?.find(
        (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.mimeType?.startsWith("image/")
      );

      if (imagePart?.inlineData) {
        // Track cost (Gemini images ~$0.039 per image)
        costs.add("gemini", 0.039, 0, "image_generation");

        // Return base64 image
        return NextResponse.json({
          success: true,
          imageUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
          generated: true,
        });
      }

      // If no image in response, use alternative method
      throw new Error("No image in response");

    } catch (geminiError) {
      console.log("Gemini image gen unavailable, using placeholder:", geminiError);

      // Fallback: Generate a nice gradient placeholder with text
      return NextResponse.json({
        success: true,
        imageUrl: `https://placehold.co/${width}x${height}/667eea/ffffff?text=${encodeURIComponent(prompt.slice(0, 40))}`,
        placeholder: true,
        message: "Using placeholder - Gemini image generation requires Gemini 2.0",
      });
    }

  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { success: false, error: "Image generation failed" },
      { status: 500 }
    );
  }
}

// GET: Check image generation status
export async function GET() {
  const geminiKey = settings.get<string>("GEMINI_API_KEY");

  return NextResponse.json({
    success: true,
    available: !!geminiKey,
    provider: geminiKey ? "Gemini 2.0" : "Placeholder",
    message: geminiKey
      ? "Image generation is available"
      : "Add Gemini API key for AI-generated images",
  });
}
