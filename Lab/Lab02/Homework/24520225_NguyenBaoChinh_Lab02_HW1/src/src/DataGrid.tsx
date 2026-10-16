// src/DataGrid.tsx
import React, { useState, useMemo, useRef, useId } from 'react';
import { DataGridProps } from './data-grid-contract';
import './DataGrid.css';

interface SortConfig<T> {
    key: keyof T | null;
    direction: 'ascending' | 'descending';
}

export function DataGrid<T extends { id: string | number }>({
    data,
    columns,
    onRowSelect,
    ariaLabel,
}: DataGridProps<T>) {
    const [filterText, setFilterText] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
        key: null,
        direction: 'ascending',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    // Roving tabindex coordinates: row 0 = header, row 1..N = body rows
    const [focusedCoord, setFocusedCoord] = useState<{ row: number; col: number }>({
        row: 0,
        col: 0,
    });
    const [selectedRowIds, setSelectedRowIds] = useState<Set<string | number>>(new Set());

    const gridRef = useRef<HTMLTableElement>(null);
    const searchInputId = useId();
    const liveRegionId = useId();

    // 1. Filtering
    const filteredData = useMemo(() => {
        if (!filterText.trim()) return data;
        const lowerFilter = filterText.toLowerCase();
        return data.filter((item) =>
            columns.some((col) => {
                const val = item[col.accessorKey];
                return String(val ?? '').toLowerCase().includes(lowerFilter);
            })
        );
    }, [data, columns, filterText]);

    // 2. Sorting
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;
        const { key, direction } = sortConfig;
        return [...filteredData].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (aVal < bVal) return direction === 'ascending' ? -1 : 1;
            if (aVal > bVal) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // 3. Pagination
    const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    // Handlers
    const handleSort = (key: keyof T) => {
        setSortConfig((prev) => ({
            key,
            direction:
                prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
        }));
    };

    const toggleRowSelection = (item: T) => {
        setSelectedRowIds((prev) => {
            const next = new Set(prev);
            if (next.has(item.id)) {
                next.delete(item.id);
            } else {
                next.add(item.id);
            }
            return next;
        });
    };

    const focusCell = (row: number, col: number) => {
        setFocusedCoord({ row, col });
        requestAnimationFrame(() => {
            const cell = gridRef.current?.querySelector<HTMLElement>(
                `[data-row="${row}"][data-col="${col}"]`
            );
            if (cell) {
                const focusTarget = cell.querySelector<HTMLElement>('button') || cell;
                focusTarget.focus();
            }
        });
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLTableElement>,
        rowIdx: number,
        colIdx: number,
        rowItem?: T
    ) => {
        const maxRow = paginatedData.length; // 0 is thead, 1..length is tbody
        const maxCol = columns.length - 1;

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                if (colIdx < maxCol) focusCell(rowIdx, colIdx + 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (colIdx > 0) focusCell(rowIdx, colIdx - 1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (rowIdx < maxRow) focusCell(rowIdx + 1, colIdx);
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (rowIdx > 0) focusCell(rowIdx - 1, colIdx);
                break;
            case 'Enter':
                if (rowIdx > 0 && rowItem) {
                    e.preventDefault();
                    onRowSelect?.(rowItem);
                }
                break;
            case ' ':
                if (rowIdx > 0 && rowItem) {
                    e.preventDefault();
                    toggleRowSelection(rowItem);
                }
                break;
            default:
                break;
        }
    };

    return (
        <section className="dg-wrapper" aria-label={`${ariaLabel} container`}>
            <div className="dg-toolbar">
                <div className="dg-filter-group">
                    <label htmlFor={searchInputId} className="dg-filter-label">
                        Filter records:
                    </label>
                    <input
                        id={searchInputId}
                        type="search"
                        className="dg-filter-input"
                        value={filterText}
                        onChange={(e) => {
                            setFilterText(e.target.value);
                            setCurrentPage(1);
                            setFocusedCoord({ row: 0, col: 0 });
                        }}
                        placeholder="Type to search..."
                    />
                </div>
                <div id={liveRegionId} className="sr-only" aria-live="polite" aria-atomic="true">
                    Showing {paginatedData.length} of {sortedData.length} rows. Page {currentPage} of{' '}
                    {totalPages}.
                </div>
            </div>

            <table
                ref={gridRef}
                role="grid"
                aria-label={ariaLabel}
                aria-rowcount={sortedData.length + 1}
                aria-colcount={columns.length}
                className="dg-table"
            >
                <thead>
                    <tr role="row" aria-rowindex={1}>
                        {columns.map((col, colIdx) => {
                            const isSorted = sortConfig.key === col.accessorKey;
                            const ariaSort = isSorted ? sortConfig.direction : 'none';
                            const isFocused = focusedCoord.row === 0 && focusedCoord.col === colIdx;

                            return (
                                <th
                                    key={String(col.accessorKey)}
                                    scope="col"
                                    role="columnheader"
                                    aria-colindex={colIdx + 1}
                                    aria-sort={col.sortable ? ariaSort : undefined}
                                    data-row={0}
                                    data-col={colIdx}
                                    tabIndex={!col.sortable && isFocused ? 0 : -1}
                                    onFocus={() => setFocusedCoord({ row: 0, col: colIdx })}
                                    onKeyDown={(e) => handleKeyDown(e, 0, colIdx)}
                                >
                                    {col.sortable ? (
                                        <button
                                            type="button"
                                            className="dg-sort-btn"
                                            tabIndex={isFocused ? 0 : -1}
                                            onClick={() => handleSort(col.accessorKey)}
                                            aria-label={`Sort by ${col.header}, currently ${ariaSort}`}
                                        >
                                            <span>{col.header}</span>
                                            <span aria-hidden="true">
                                                {isSorted ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                                            </span>
                                        </button>
                                    ) : (
                                        col.header
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((item, rIdx) => {
                        const actualRowIndex = rIdx + 1;
                        const isSelected = selectedRowIds.has(item.id);

                        return (
                            <tr
                                key={item.id}
                                role="row"
                                aria-rowindex={(currentPage - 1) * pageSize + actualRowIndex + 1}
                                aria-selected={isSelected}
                                onClick={() => onRowSelect?.(item)}
                            >
                                {columns.map((col, colIdx) => {
                                    const isFocused =
                                        focusedCoord.row === actualRowIndex && focusedCoord.col === colIdx;

                                    return (
                                        <td
                                            key={String(col.accessorKey)}
                                            role="gridcell"
                                            aria-colindex={colIdx + 1}
                                            data-row={actualRowIndex}
                                            data-col={colIdx}
                                            tabIndex={isFocused ? 0 : -1}
                                            onFocus={() => setFocusedCoord({ row: actualRowIndex, col: colIdx })}
                                            onKeyDown={(e) => handleKeyDown(e, actualRowIndex, colIdx, item)}
                                        >
                                            {String(item[col.accessorKey] ?? '')}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="dg-pagination">
                <span>
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (
                    {sortedData.length} total items)
                </span>
                <div className="dg-page-controls">
                    <button
                        type="button"
                        className="dg-page-btn"
                        onClick={() => {
                            setCurrentPage((p) => Math.max(1, p - 1));
                            setFocusedCoord({ row: 0, col: 0 });
                        }}
                        disabled={currentPage === 1}
                        aria-label="Previous Page"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        className="dg-page-btn"
                        onClick={() => {
                            setCurrentPage((p) => Math.min(totalPages, p + 1));
                            setFocusedCoord({ row: 0, col: 0 });
                        }}
                        disabled={currentPage === totalPages}
                        aria-label="Next Page"
                    >
                        Next
                    </button>
                </div>
            </div>
        </section>
    );
}