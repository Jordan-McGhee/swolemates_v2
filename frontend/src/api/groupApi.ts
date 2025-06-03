import { useFetch } from "@/hooks/useFetch";

// group api
export const groupApi = () => {

    const { isLoading, hasError, sendRequest, clearError } = useFetch()

    // 

    return {

        isLoadingApi: isLoading, hasError, clearError
    }
}