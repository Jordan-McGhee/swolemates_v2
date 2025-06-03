import { useFetch } from "@/hooks/useFetch";

// workout api
export const workoutApi = () => {

    const { isLoading, hasError, sendRequest, clearError } = useFetch()

    // 

    return {

        isLoadingApi: isLoading, hasError, clearError
    }
}