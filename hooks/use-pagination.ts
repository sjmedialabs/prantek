"use client"

import { useState, useCallback } from "react"

interface UsePaginationProps {
  initialPage?: number
  initialLimit?: number
}

interface PaginationState {
  page: number
  limit: number
  totalPages: number
  totalItems: number
}

export function usePagination({ initialPage = 1, initialLimit = 10 }: UsePaginationProps = {}) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    totalPages: 1,
    totalItems: 0,
  })

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }))
  }, [])

  const setTotalItems = useCallback((totalItems: number) => {
    setPagination((prev) => ({
      ...prev,
      totalItems,
      totalPages: Math.ceil(totalItems / prev.limit),
    }))
  }, [])

  const reset = useCallback(() => {
    setPagination({
      page: initialPage,
      limit: initialLimit,
      totalPages: 1,
      totalItems: 0,
    })
  }, [initialPage, initialLimit])

  return {
    ...pagination,
    setPage,
    setLimit,
    setTotalItems,
    reset,
  }
}
