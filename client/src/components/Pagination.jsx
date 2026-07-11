function Pagination({
    pagination,
    onPageChange,
    itemLabel = "items",
}) {
    const {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
    } = pagination;

    if (totalItems === 0) {
        return null;
    }

    const firstItem = (page - 1) * pageSize + 1;
    const lastItem = Math.min(
        page * pageSize,
        totalItems
    );

    return (
        <div className="pagination">
            <p className="pagination-summary">
                Showing {firstItem}–{lastItem} of {totalItems}{" "}
                {itemLabel}
            </p>

            <div className="pagination-controls">
                <button
                    type="button"
                    className="pagination-button"
                    disabled={!hasPreviousPage}
                    onClick={() => onPageChange(page - 1)}
                >
                    Previous
                </button>

                <span className="pagination-page">
                    Page {page} of {totalPages}
                </span>

                <button
                    type="button"
                    className="pagination-button"
                    disabled={!hasNextPage}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default Pagination;