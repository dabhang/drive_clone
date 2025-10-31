"use server";
import { Client, Account, TablesDB, Storage, Avatars } from "appwrite";
import { cookies } from "next/headers";
import { appwriteConfig } from "@/lib/appwrite/config";

/**
 * Create a client with the user's session (session-based access)
 */
export const createSessionClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

  const session = (await cookies()).get("appwrite-session");

  if (!session) throw new Error("No session found");

  client.setSession(session.value);

  return {
    account: new Account(client),
    tablesDB: new TablesDB(client),
  };
};

/**
 * Create a client with admin access (full access with secret key)
 */
export const createAdminClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);
  client.headers = {
    ...client.headers,
    "X-Appwrite-Key": appwriteConfig.secretKey,
  };

  return {
    account: new Account(client),
    tablesDB: new TablesDB(client),
    storage: new Storage(client),
    avatars: new Avatars(client),
  };
};
