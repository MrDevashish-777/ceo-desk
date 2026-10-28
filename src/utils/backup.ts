import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { exportAllDataJSON, importAllDataJSON } from '../db/queries';

// Portable XOR-Salted obfuscation/encryption for export files
const simpleEncrypt = (text: string, pass: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ pass.charCodeAt(i % pass.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(unescape(encodeURIComponent(result)));
};

const simpleDecrypt = (encoded: string, pass: string): string => {
  const text = decodeURIComponent(escape(atob(encoded)));
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ pass.charCodeAt(i % pass.length);
    result += String.fromCharCode(charCode);
  }
  return result;
};

export const exportBackup = async (password?: string): Promise<{ success: boolean; message: string }> => {
  try {
    const rawJsonStr = exportAllDataJSON();
    let exportPayload = rawJsonStr;

    if (password && password.trim().length > 0) {
      const encryptedData = simpleEncrypt(rawJsonStr, password.trim());
      exportPayload = JSON.stringify({
        appName: 'CEO Desk',
        encrypted: true,
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        payload: encryptedData,
      });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `CEO_Desk_Backup_${dateStr}.json`;

    if (Platform.OS === 'web') {
      const blob = new Blob([exportPayload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      return { success: true, message: 'Backup downloaded successfully.' };
    }

    const backupFile = new File(Paths.document, fileName);
    await backupFile.write(exportPayload);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(backupFile.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export CEO Desk Backup',
        UTI: 'public.json',
      });
      return { success: true, message: 'Backup shared successfully.' };
    } else {
      return { success: true, message: `Backup saved to ${backupFile.uri}` };
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Export failed.' };
  }
};

export const importBackup = async (password?: string): Promise<{ success: boolean; message: string; requiresPassword?: boolean }> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, message: 'Import cancelled.' };
    }

    const asset = result.assets[0];
    let fileContent = '';

    if (Platform.OS === 'web') {
      const response = await fetch(asset.uri);
      fileContent = await response.text();
    } else {
      const sourceFile = new File(asset.uri);
      fileContent = await sourceFile.text();
    }

    // Check if backup is encrypted
    try {
      const parsed = JSON.parse(fileContent);
      if (parsed.encrypted && parsed.payload) {
        if (!password) {
          return {
            success: false,
            message: 'This backup is password protected.',
            requiresPassword: true,
          };
        }
        try {
          fileContent = simpleDecrypt(parsed.payload, password.trim());
        } catch {
          return { success: false, message: 'Incorrect decryption password.' };
        }
      }
    } catch {
      // Raw string
    }

    return importAllDataJSON(fileContent);
  } catch (error: any) {
    return { success: false, message: error.message || 'Import failed.' };
  }
};
