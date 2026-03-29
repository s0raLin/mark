import { StorageEditorConfig, StorageFileSystem, StorageUserSettings } from "@/api/client";
import { getUserData as getUserDataApi, saveUserData as saveUserDataApi } from "@/api/client/user";

export async function getUserData(): Promise<StorageUserSettings | undefined> {
    try {
        const response = await getUserDataApi();
        return response;
    } catch (error) {
        console.error("获取用户数据失败:", error);
        throw error;
    }
}

export async function saveUserData(
    { fileSystem, editorConfig }: {
        fileSystem: StorageFileSystem,
        editorConfig: StorageEditorConfig
    }
): Promise<{ success: boolean; updatedAt: number } | undefined> {
    try {
        const response = await saveUserDataApi({
            fileSystem,
            editorConfig
        });
        return response;
    } catch (error) {
        console.error("保存用户数据失败:", error);
        throw error;
    }
}