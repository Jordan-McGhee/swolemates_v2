import { useCallback, useRef, useState, useEffect } from "react"

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

    const activeHttpRequests = useRef<AbortController[]>([])

    const sendRequest = useCallback(async ({ url, method = "GET", headers = {}, body = null }: FetchOptions): Promise<T> => {
        setIsLoading(true)

        const httpAbortController = new AbortController()
        activeHttpRequests.current.push(httpAbortController)

        try {
            const response = await fetch(url, {
                method,
                body,
                headers,
                signal: httpAbortController.signal,
            })

            const responseData: T = await response.json()

            activeHttpRequests.current = activeHttpRequests.current.filter(
                ctrl => ctrl !== httpAbortController
            )

            if (!response.ok) {
                const message = (responseData as any)?.message || "Request failed"
                throw new Error(message)
            }

            setIsLoading(false)
            return responseData

        } catch (err: any) {
            if (err.name === "AbortError") {
                // Request was aborted, do not set error or throw
                setIsLoading(false)
                return Promise.reject(err)
            }
            console.error(err)
            setHasError(err.message || "Something went wrong. Please try again!")
            setIsLoading(false)
            throw err
        }
    }, [])

    const clearError = () => {
        setHasError(null)
    }

    useEffect(() => {
        return () => {
            activeHttpRequests.current.forEach(controller => controller.abort())
        }
    }, [])

    return { isLoading, hasError, sendRequest, clearError }
}
