import { StorageEditorConfig, StorageUserSettings } from "@/api/client";
import { loadInitialUserData } from "@/services/storageService";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

const UserDataContext = createContext<UserDataContextProps | undefined>(
  undefined,
);

interface UserDataContextProps {
    initialUserData: StorageUserSettings,
   setInitialUserData: React.Dispatch<React.SetStateAction<StorageUserSettings>>,
}

export interface UserDataProps {
  children: ReactNode;
}

export function UserDataProvider({ children }: UserDataProps): ReactNode {
  const [initialUserData, setInitialUserData] =
    useState<StorageUserSettings>(null);
  useEffect(() => {
    const getUserData = async () => {
      const userData = await loadInitialUserData();
      setInitialUserData(userData);
    };

    getUserData();
  });

  return (
    <UserDataContext.Provider value={{initialUserData, setInitialUserData}}>
        {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
    const context = useContext(UserDataContext);

    if (!context) {
        throw new Error("useUserDataContext must be used within UserDataProvider");
    }

    return context;
}