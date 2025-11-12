import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Collections } from "@/lib/db-config";

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    const { email, phone } = await request.json();

    const result: { emailExists?: boolean; phoneExists?: boolean } = {};

    // Check email if provided
    if (email) {
      const existingUserByEmail = await db.collection(Collections.USERS).findOne({
        email: { $regex: new RegExp(`^${email}$`, 'i') }
      });
      result.emailExists = !!existingUserByEmail;
    }

    // Check phone if provided
    if (phone) {
      const existingUserByPhone = await db.collection(Collections.USERS).findOne({
        phone: phone.trim()
      });
      result.phoneExists = !!existingUserByPhone;
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
