import { DB_NAME, DB_VERSION, STORE_USER, STORE_INVENTORY, INITIAL_USER_STATE } from '../constants';
import { UserProfile, Pokemon } from '../types';

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database error:", event);
      reject("Database failed to open");
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_USER)) {
        db.createObjectStore(STORE_USER, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_INVENTORY)) {
        db.createObjectStore(STORE_INVENTORY, { keyPath: 'id' });
      }
    };
  });
};

export const getUserProfile = async (): Promise<UserProfile> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_USER], 'readonly');
    const store = transaction.objectStore(STORE_USER);
    const request = store.get('profile');

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result as UserProfile);
      } else {
        // Initialize if empty
        const initial = { ...INITIAL_USER_STATE, joinedAt: Date.now() };
        saveUserProfile(initial).then(() => resolve(initial));
      }
    };
    request.onerror = () => reject("Failed to load user profile");
  });
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_USER], 'readwrite');
    const store = transaction.objectStore(STORE_USER);
    const request = store.put({ ...profile, id: 'profile' }); // Fixed ID for single user
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Failed to save profile");
  });
};

export const getInventory = async (): Promise<Pokemon[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_INVENTORY], 'readonly');
    const store = transaction.objectStore(STORE_INVENTORY);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as Pokemon[]);
    request.onerror = () => reject("Failed to load inventory");
  });
};

export const addPokemonToInventory = async (pokemon: Pokemon): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_INVENTORY], 'readwrite');
    const store = transaction.objectStore(STORE_INVENTORY);
    const request = store.add(pokemon);
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Failed to add pokemon");
  });
};

export const removePokemonFromInventory = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_INVENTORY], 'readwrite');
    const store = transaction.objectStore(STORE_INVENTORY);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Failed to remove pokemon");
  });
};