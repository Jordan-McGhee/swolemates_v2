import { useCallback, useState } from "react"

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface FetchOptions {
    url: string
    method?: HttpMethod
    headers?: HeadersInit
    body?: BodyInit | null
}

interface UseFetchResult<T> {
    isLoading: boolean
    hasError: string | null
    sendRequest: (options: FetchOptions) => Promise<T>
    clearError: () => void
}

export const useFetch = <T = any>(): UseFetchResult<T> => {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [hasError, setHasError] = useState<string | null>(null)

    const sendRequest = useCallback(async ({ url, method = "GET", headers = {}, body = null }: FetchOptions): Promise<T> => {
        setIsLoading(true)
        try {
            const response = await fetch(url, {
                method,
                body,
                headers,
            })

            const responseData: T = await response.json()

            if (!response.ok) {
                const message = (responseData as any)?.message || "Request failed"
                throw new Error(message)
            }

            setIsLoading(false)
            return responseData

        } catch (err: any) {
            console.error(err)
            setHasError(err.message || "Something went wrong. Please try again!")
            setIsLoading(false)
            throw err
        }
    }, [])

    const clearError = () => {
        setHasError(null)
    }

    return { isLoading, hasError, sendRequest, clearError }
}
