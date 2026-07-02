'use client';

import { useState, useCallback } from 'react';

export function usePagination(totalItems: number, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.min(Math.max(1, page), totalPages));
    },
    [totalPages]
  );

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  return { currentPage, totalPages, goToPage, nextPage, prevPage, start, end, itemsPerPage };
}
