"use server";

import { Client, Account, Query, ID } from "appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { createSessionClient, createAdminClient } from "@/lib/appwrite/index";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";

const getUserByEmail = async (email: string) => {
  const { tablesDB } = await createAdminClient();
  const result = await tablesDB.listRows({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.usersTableId,
    queries: [Query.equal("email", email)],
  });

  return result.total > 0 ? result.rows[0] : null;
};

export const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();
  try {
    const session = await account.createEmailToken({
      userId: ID.unique(),
      email,
    });
    return session.userId;
  } catch (error) {}
};

export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);
  const accountId = await sendEmailOTP({ email });
  if (!accountId) {
    throw new Error("Failed to create account");
  }

  if (!existingUser) {
    const { tablesDB } = await createAdminClient();

    await tablesDB.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.usersTableId,
      rowId: ID.unique(),
      data: {
        fullName: fullName,
        email: email,
        accountId: accountId,
        avatar:
          "https://static.vecteezy.com/system/resources/thumbnails/027/951/137/small_2x/stylish-spectacles-guy-3d-avatar-character-illustrations-png.png",
      },
    });
  }
  return parseStringify({ accountId });
};

/**
 * Verify secret / login user
 */
export async function verifySecret({
  email,
  password,
  accountId,
}: {
  email: string;
  password: string;
  accountId: string;
}) {
  const { account } = await createSessionClient();
  const session = await account.createSession({
    userId: accountId,
    secret: password,
  });

  const jwt = await account.createJWT();
  // Store session in cookie
  (await cookies()).set("appwrite-session", session.$id, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });
  return { sessionId: session.$id };
}

// export async function getUserByEmail(email: string) {
//   const result = await createAdminClient(
//     `/users?search=${encodeURIComponent(email)}`,
//     {
//       method: "GET",
//     }
//   );

//   return result.total > 0 ? result.users[0] : null;
// }

// /**
//  * Create new user (admin only)
//  */
// export async function createAccount({
//   fullName,
//   email,
// }: {
//   fullName: string;
//   email: string;
// }) {
//   const existingUser = await getUserByEmail(email);
//   if (existingUser) {
//     return { userId: existingUser.$id, email: existingUser.email };
//   }

//   // Temporary random password (can implement OTP logic)
//   const password = Math.random().toString(36).slice(-8);

//   const user = await appwriteAdminFetch("/users", {
//     method: "POST",
//     body: JSON.stringify({
//       userId: "unique()",
//       email,
//       name: fullName,
//       password,
//     }),
//   });

//   return { userId: user.$id, email: user.email, password };
// }

// /**
//  * Get current logged-in user
//  */
// export async function getCurrentUser() {
//   try {
//     const sessionCookie = (await cookies()).get("appwrite-session");
//     if (!sessionCookie?.value) return null;

//     const { account } = createSessionClient();
//     return await account.get();
//   } catch (error) {
//     console.error("Failed to get current user:", error);
//     return null;
//   }
// }

// /**
//  * Sign out user
//  */
// export async function signOutUser() {
//   const { account } = createSessionClient();

//   try {
//     await account.deleteSession({ sessionId: "current" });
//     (await cookies()).delete("appwrite-session");
//   } catch (error) {
//     console.error("Failed to sign out:", error);
//   } finally {
//     redirect("/sign-in");
//   }
// }

// /**
//  * Sign in user
//  */
// export async function signInUser({
//   email,
//   password,
// }: {
//   email: string;
//   password: string;
// }) {
//   const { account } = createSessionClient();
//   const session = await account.createEmailPasswordSession({ email, password });

//   (await cookies()).set("appwrite-session", session.$id, {
//     path: "/",
//     httpOnly: true,
//     sameSite: "strict",
//     secure: true,
//   });

//   return { sessionId: session.$id };
// }
