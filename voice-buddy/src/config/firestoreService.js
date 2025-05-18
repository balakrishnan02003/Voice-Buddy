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
  orderBy,
  writeBatch
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Save user conversations to Firestore
 */
export async function saveUserConversations(userId, conversations) {
  try {
    if (!userId) {
      console.warn("No user ID provided. Skipping conversation save.");
      return false;
    }

    // Ensure all conversation IDs are strings for consistency
    const normalizedConversations = conversations.map(conv => ({
      ...conv,
      id: conv.id.toString() // Ensure ID is a string
    }));

    const userDocRef = doc(db, "users", userId);
    
    // Check document size before saving
    const conversationsSize = JSON.stringify(normalizedConversations).length;
    
    // If document is too large (> 1MB), split into smaller chunks
    if (conversationsSize > 900000) { // Leave some margin below Firestore's 1MB limit
      console.log("Large conversation data detected, splitting into batches...");
      
      // Use a batch to ensure atomicity
      const batch = writeBatch(db);
      
      // Clear existing conversations first
      batch.set(userDocRef, { 
        conversationsCount: normalizedConversations.length,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      // Store conversations in chunks of max 10 conversations per document
      const chunkSize = 10;
      for (let i = 0; i < normalizedConversations.length; i += chunkSize) {
        const chunk = normalizedConversations.slice(i, i + chunkSize);
        const chunkDocRef = doc(db, "users", userId, "conversationChunks", `chunk_${Math.floor(i/chunkSize)}`);
        batch.set(chunkDocRef, { 
          conversations: chunk,
          chunkIndex: Math.floor(i/chunkSize),
          timestamp: new Date().toISOString()
        });
      }
      
      await batch.commit();
      console.log("✅ Large conversations saved successfully in chunks!");
    } else {
      // Normal case - document size is within limits
      await setDoc(userDocRef, { 
        conversations: normalizedConversations,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      console.log("✅ Conversations saved successfully!", normalizedConversations.length);
    }
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
      // Check if conversations are directly in the user document
      if (userDoc.data().conversations) {
        const conversations = userDoc.data().conversations || [];
        console.log(`✅ Retrieved ${conversations.length} conversations for user ${userId}`);
        return conversations;
      }
      
      // If conversationsCount exists, data is split into chunks
      if (userDoc.data().conversationsCount) {
        console.log("Conversations are stored in chunks, retrieving...");
        const chunksCollectionRef = collection(db, "users", userId, "conversationChunks");
        const chunksSnapshot = await getDocs(chunksCollectionRef);
        
        let allConversations = [];
        chunksSnapshot.forEach(doc => {
          const chunkData = doc.data();
          if (chunkData.conversations && Array.isArray(chunkData.conversations)) {
            allConversations = [...allConversations, ...chunkData.conversations];
          }
        });
        
        // Sort by chunk index if needed
        allConversations.sort((a, b) => {
          // Sort by timestamp if available, otherwise by ID
          const dateA = new Date(a.timestamp || 0);
          const dateB = new Date(b.timestamp || 0);
          return dateB - dateA; // Newest first
        });
        
        console.log(`✅ Retrieved ${allConversations.length} conversations from chunks for user ${userId}`);
        return allConversations;
      }
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