import { app, safeStorage } from 'electron';
import fs from 'fs';
import path from 'path';

export function getStorageFilePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'pulse-store.json');
}

export function loadPulseData(): any {
  const filePath = getStorageFilePath();
  if (!fs.existsSync(filePath)) {
    return {
      version: 1,
      collections: [],
      environments: [
        {
          id: 'global',
          name: 'Global',
          variables: [
            { id: '1', key: 'base_url', value: 'https://httpbin.org', isSecret: false, enabled: true },
          ]
        },
        {
          id: 'dev',
          name: 'Development',
          variables: [
            { id: '2', key: 'api_key', value: 'pulse_dev_test_token_123', isSecret: true, enabled: true },
          ]
        }
      ],
      activeEnvId: 'global',
      history: [],
      tabs: [],
      activeTabId: null,
    };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading store file:', e);
    return null;
  }
}

export function savePulseData(data: any): boolean {
  try {
    const filePath = getStorageFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error saving store file:', e);
    return false;
  }
}

export function encryptSecret(plainText: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    // Fallback if OS encryption is unavailable
    return 'b64:' + Buffer.from(plainText, 'utf8').toString('base64');
  }
  const encrypted = safeStorage.encryptString(plainText);
  return 'dpapi:' + encrypted.toString('base64');
}

export function decryptSecret(cipherText: string): string {
  if (!cipherText) return '';
  if (cipherText.startsWith('dpapi:')) {
    if (!safeStorage.isEncryptionAvailable()) return '[Protected Secret]';
    const buffer = Buffer.from(cipherText.slice(6), 'base64');
    return safeStorage.decryptString(buffer);
  }
  if (cipherText.startsWith('b64:')) {
    return Buffer.from(cipherText.slice(4), 'base64').toString('utf8');
  }
  return cipherText;
}
