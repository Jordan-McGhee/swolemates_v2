import { useFetch } from "@/hooks/useFetch";

// search api
export const searchApi = () => {

    const { isLoading, hasError, sendRequest, clearError } = useFetch()

    // 

    return {

        isLoadingApi: isLoading, hasError, clearError
    }
}