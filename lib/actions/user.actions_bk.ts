"use server";

import { ID, Query } from "appwrite";
import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { parseStringify } from "@/lib/utils";
import { avatarPlaceholderUrl } from "@/constants";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string) => {
  const { tablesDB } = await createAdminClient();

  const result = await tablesDB.listRows({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.usersTableId,
    queries: [Query.equal("email", email)],
  });

  return result.total > 0 ? result.rows[0] : null;
};

/**
 * Send email OTP
 */
export const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();

  try {
    const session = await account.createEmailToken(ID.unique(), email);
    return session.userId;
  } catch (error) {
    console.error("Failed to send email OTP:", error);
    throw error;
  }
};

/**
 * Create a new user account
 */
export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);
  const accountId = await sendEmailOTP({ email });

  if (!accountId) throw new Error("Failed to send OTP");

  if (!existingUser) {
    const { tablesDB } = await createAdminClient();

    await tablesDB.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.usersTableId,
      rowId: ID.unique(),
      data: {
        fullName,
        email,
        avatar: avatarPlaceholderUrl,
        accountId,
      },
    });
  }

  return parseStringify({ accountId });
};

/**
 * Verify OTP / Secret
 */
export const verifySecret = async ({
  accountId,
  password,
}: {
  accountId: string;
  password: string;
}) => {
  try {
    const { account } = await createAdminClient();

    const session = await account.createSession({
      userId: accountId,
      secret: password,
    });

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify({ sessionId: session.$id });
  } catch (error) {
    console.error("Failed to verify OTP:", error);
    throw error;
  }
};

/**
 * Get current logged-in user
 */
export const getCurrentUser = async () => {
  try {
    const { tablesDB, account } = await createSessionClient();

    const result = await account.get();

    const userResult = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.usersTableId,
      queries: [Query.equal("accountId", result.$id)],
    });

    if (userResult.total <= 0) return null;

    return parseStringify(userResult.rows[0]);
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
};

/**
 * Sign out user
 */
export const signOutUser = async () => {
  const { account } = await createSessionClient();

  try {
    await account.deleteSession("current");
    (await cookies()).delete("appwrite-session");
  } catch (error) {
    console.error("Failed to sign out:", error);
    throw error;
  } finally {
    redirect("/sign-in");
  }
};

/**
 * Sign in user (send OTP)
 */
export const signInUser = async ({ email }: { email: string }) => {
  try {
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      await sendEmailOTP({ email });
      return parseStringify({ accountId: existingUser.accountId });
    }

    return parseStringify({ accountId: null, error: "User not found" });
  } catch (error) {
    console.error("Failed to sign in user:", error);
    throw error;
  }
};
