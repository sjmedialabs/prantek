import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Collections } from "@/lib/db-config";

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    const { email, phone } = await request.json();

    const result: { emailExists?: boolean; phoneExists?: boolean } = {};

    // Check email if provided - normalized to lowercase for indexed query
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUserByEmail = await db.collection(Collections.USERS).findOne(
        { email: normalizedEmail },
        { projection: { _id: 1 } } // Only fetch _id for faster query
      );
      result.emailExists = !!existingUserByEmail;
    }

    // Check phone if provided
    if (phone) {
      const normalizedPhone = phone.trim();
      const existingUserByPhone = await db.collection(Collections.USERS).findOne(
        { phone: normalizedPhone },
        { projection: { _id: 1 } } // Only fetch _id for faster query
      );
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
