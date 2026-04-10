import { NextRequest, NextResponse } from "next/server";

// Demo webhook endpoint
// In production this would store events in a database.
// Since API routes cannot access localStorage, this endpoint
// returns a success response and the client-side WebhookWidget
// handles demo/simulation via localStorage.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { title, message, type } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "title and message are required" },
        { status: 400 }
      );
    }

    // In a real implementation, this would store to a database.
    // For now, we acknowledge receipt.
    const event = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      webhookId: id,
      title,
      message,
      type: type || "info",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(
      { success: true, event },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return NextResponse.json({
    webhookId: id,
    status: "active",
    message: "Send POST requests with { title, message, type? } to trigger events.",
  });
}
