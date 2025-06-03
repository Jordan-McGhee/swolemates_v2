import { useFetch } from "@/hooks/useFetch";

// notification api
export const notificationApi = () => {

    const { isLoading, hasError, sendRequest, clearError } = useFetch()

    // 

    return {

        isLoadingApi: isLoading, hasError, clearError
    }
}