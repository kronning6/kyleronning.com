import Link from "next/link";

type PaginationNavProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
};

function getHref(basePath: string, page: number) {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

export function PaginationNav({
  basePath,
  currentPage,
  totalPages,
}: PaginationNavProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-4">
      {currentPage > 1 ? (
        <Link href={getHref(basePath, currentPage - 1)}>newer</Link>
      ) : (
        <span className="opacity-50">newer</span>
      )}
      <p className="m-0 text-sm opacity-70">
        page {currentPage} of {totalPages}
      </p>
      {currentPage < totalPages ? (
        <Link href={getHref(basePath, currentPage + 1)}>older</Link>
      ) : (
        <span className="opacity-50">older</span>
      )}
    </nav>
  );
}
