import { useFetch } from "@/hooks/useFetch";

// post api
export const postApi = () => {

    const { isLoading, hasError, sendRequest, clearError } = useFetch()

    // 

    return {

        isLoadingApi: isLoading, hasError, clearError
    }
}