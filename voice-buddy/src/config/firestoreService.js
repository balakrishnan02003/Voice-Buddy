import { db } from "./firebaseConfig";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Save user conversations to Firestore
 */
export async function saveUserConversations(userId, conversations) {
  try {
    if (!userId) {
      console.warn("No user ID provided. Skipping conversation save.");
      return;
    }

    // Ensure all conversation IDs are strings for consistency
    const normalizedConversations = conversations.map(conv => ({
      ...conv,
      id: conv.id.toString() // Ensure ID is a string
    }));

    const userDocRef = doc(db, "users", userId);
    
    // Use set with merge to ensure we don't overwrite other user data
    await setDoc(userDocRef, { 
      conversations: normalizedConversations,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    
    console.log("✅ Conversations saved successfully!", normalizedConversations.length);
    return true;
  } catch (error) {
    console.error("❌ Error saving conversations:", error);
    return false;
  }
}

/**
 * Retrieve user conversations from Firestore
 */
export async function getUserConversations(userId) {
  try {
    if (!userId) {
      console.warn("No user ID provided. Returning empty conversations.");
      return [];
    }

    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const conversations = userDoc.data().conversations || [];
      console.log(`✅ Retrieved ${conversations.length} conversations for user ${userId}`);
      return conversations;
    }
    
    console.log(`No conversations found for user ${userId}`);
    return [];
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    return [];
  }
}

/**
 * Save user presets to Firestore
 */
export async function saveUserPresets(userId, presets) {
  try {
    if (!userId) {
      console.warn("No user ID provided. Skipping preset save.");
      return;
    }

    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, { 
      presets: presets,
      presetsLastUpdated: new Date().toISOString()
    }, { merge: true });
    
    console.log("✅ Presets saved successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error saving presets:", error);
    return false;
  }
}

/**
 * Retrieve user presets from Firestore
 */
export async function getUserPresets(userId) {
  try {
    if (!userId) {
      console.warn("No user ID provided. Returning empty presets.");
      return {};
    }

    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const presets = userDoc.data().presets || {};
      console.log(`✅ Retrieved presets for user ${userId}`);
      return presets;
    }
    
    console.log(`No presets found for user ${userId}`);
    return {};
  } catch (error) {
    console.error("❌ Error fetching presets:", error);
    return {};
  }
}

/**
 * Add chat message to a conversation
 * @deprecated - Use saveUserConversations instead
 */
export async function addChatMessage(userId, conversationId, message) {
  console.warn("addChatMessage is deprecated - use saveUserConversations instead");
  try {
    // First get the user's conversations
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.error("User document doesn't exist");
      return false;
    }
    
    const conversations = userDoc.data().conversations || [];
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex === -1) {
      console.error("Conversation not found");
      return false;
    }
    
    // Add message to conversation
    conversations[conversationIndex].messages.push(message);
    
    // Update Firestore
    await updateDoc(userDocRef, {
      conversations: conversations
    });
    
    return true;
  } catch (error) {
    console.error("Error adding chat message:", error);
    return false;
  }
}
