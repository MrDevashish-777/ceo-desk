import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { exportAllDataJSON, importAllDataJSON } from '../db/queries';

export const exportBackup = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const jsonStr = exportAllDataJSON();
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `CEO_Desk_Backup_${dateStr}.json`;

    if (Platform.OS === 'web') {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      return { success: true, message: 'Backup downloaded successfully.' };
    }

    const backupFile = new File(Paths.document, fileName);
    await backupFile.write(jsonStr);

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

export const importBackup = async (): Promise<{ success: boolean; message: string }> => {
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

    return importAllDataJSON(fileContent);
  } catch (error: any) {
    return { success: false, message: error.message || 'Import failed.' };
  }
};
