import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface Profile {
  id: string; // usually just 'default'
  name: string;
  apiKeys: string[];
}

export interface Character {
  id: string;
  name: string;
  age: number;
  description: string;
  createdAt: number;
}

export interface Story {
  id: string;
  name: string;
  startingPoint: string;
  characterIds: string[];
  relationshipDynamics: string;
  createdAt: number;
  systemPromptA: string;
  systemPromptB: string;
}

export interface Message {
  id: string;
  storyId: string;
  characterId: string; // The POV character, or 'user' for injected, or 'system'
  content: string;
  timestamp: number;
}

interface DirectorDB extends DBSchema {
  profile: {
    key: string;
    value: Profile;
  };
  characters: {
    key: string;
    value: Character;
  };
  stories: {
    key: string;
    value: Story;
  };
  messages: {
    key: string;
    value: Message;
    indexes: { 'by-story': string };
  };
}

let dbPromise: Promise<IDBPDatabase<DirectorDB>>;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<DirectorDB>('director-ai-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('characters')) {
          db.createObjectStore('characters', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('stories')) {
          db.createObjectStore('stories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('by-story', 'storyId');
        }
      },
    });
  }
  return dbPromise;
}

export async function getProfile(): Promise<Profile | undefined> {
  const db = await initDB();
  return db.get('profile', 'default');
}

export async function saveProfile(profile: Profile) {
  const db = await initDB();
  await db.put('profile', profile);
}

export async function getCharacters(): Promise<Character[]> {
  const db = await initDB();
  return db.getAll('characters');
}

export async function saveCharacter(character: Character) {
  const db = await initDB();
  await db.put('characters', character);
}

export async function deleteCharacter(id: string) {
  const db = await initDB();
  await db.delete('characters', id);
}

export async function getStories(): Promise<Story[]> {
  const db = await initDB();
  return db.getAll('stories');
}

export async function getStory(id: string): Promise<Story | undefined> {
  const db = await initDB();
  return db.get('stories', id);
}

export async function saveStory(story: Story) {
  const db = await initDB();
  await db.put('stories', story);
}

export async function getMessages(storyId: string): Promise<Message[]> {
  const db = await initDB();
  return db.getAllFromIndex('messages', 'by-story', storyId);
}

export async function saveMessage(message: Message) {
  const db = await initDB();
  await db.put('messages', message);
}
