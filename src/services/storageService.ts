import { getUserData } from "@/api/client";

export async function loadInitialUserData() {
    return await getUserData()
}