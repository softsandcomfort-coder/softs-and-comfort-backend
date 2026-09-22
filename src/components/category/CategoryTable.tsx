"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConfirmModal from "@/components/common/ConfirmModal";
import Link from "next/link";
import { Category } from "@/types/models";
import Image from "next/image";

const EMPTY_CATEGORY: Category[] = [];

type CategoryListProps = {
  CategoryItem?: Category[];
    /** When supplied, the trash icon deletes in Sanity instead of only on screen. */
    onDelete?: (id: string) => Promise<void>;
};

export default function CategoryTable({ CategoryItem = EMPTY_CATEGORY , onDelete }: CategoryListProps) {
  const [list, setList] = useState<Category[]>(CategoryItem);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Sort by (Default)");
  const [entries, setEntries] = useState(5);
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => { setList(CategoryItem ?? []); }, [CategoryItem]);

  const filtered = useMemo(() => {
    let result = [...list];

    if (search.trim()) {
      const keyword = search.toLowerCase();
      result = result.filter((item) =>
        item.name.toLowerCase().includes(keyword)
      );
    }

    if (sort === "Name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sort === "Products") {
      result.sort((a, b) => b.quantity - a.quantity);
    }

    return result;
  }, [list, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / entries));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * entries;
  const end = start + entries;
  const paginated = filtered.slice(start, end);

  useEffect(() => {
    setPage(1);
  }, [search, sort, entries]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleDelete = async () => {
        if (!selectedItem) return;
        const id = String(selectedItem.id);

        if (onDelete) {
            setDeleting(true);
            setDeleteError(null);
            try {
                await onDelete(id);
            } catch (err) {
                setDeleteError(err instanceof Error ? err.message : "Could not delete this item");
                setDeleting(false);
                setSelectedItem(null);
                return;
            }
            setDeleting(false);
        }

        setList((prev) => prev.filter((item) => String(item.id) !== id));
        setSelectedItem(null);
    };

  return (
    <>
            {deleteError && (
                <div className="wg-box mb-20">
                    <div className="body-text" style={{ color: "#e53e3e" }}>{deleteError}</div>
                </div>
            )}
      <div className="wg-box">
        <div className="flex items-center justify-between gap10 flex-wrap">
          <div className="wg-filter flex-grow">
            <div className="show">
              <div className="text-tiny">Showing</div>
              <div className="select">
                <select
                  value={entries}
                  onChange={(e) => setEntries(Number(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div className="text-tiny">entries</div>
            </div>

            <form className="form-search" onSubmit={(e) => e.preventDefault()}>
              <fieldset className="name">
                <input
                  type="text"
                  placeholder="Search here..."
                  name="name"
                  tabIndex={2}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </fieldset>
              <div className="button-submit">
                <button type="submit">
                  <i className="icon-search"></i>
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-between gap10 flex-wrap">
            <div className="tf-select">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option>Sort by (Default)</option>
                <option>Name</option>
                <option>Products</option>
              </select>
            </div>

            <Link className="tf-button px-40" href={"/add-category"}>
              <i className="icon-plus"></i>
              Add new
            </Link>
          </div>
        </div>

        <div className="wg-table table-all-category">
          <ul className="table-title flex gap20 mb-14">
            <li>
              <div className="body-title">Category</div>
            </li>
            <li>
              <div className="body-title">Products</div>
            </li>
            <li>
              <div className="body-title">Audience</div>
            </li>
            <li>
              <div className="body-title">Action</div>
            </li>
          </ul>

          <ul className="flex flex-column">
            {paginated.map((item) => (
              <li className="wg-product item-row gap20" key={item.id}>
                <div className="name">
                  <div className="image">
                    <Image width={50} height={50} src={item.image} alt="image" />
                  </div>
                  <div className="title line-clamp-2 mb-0">
                    <Link href={`/add-category?id=${item.id}`} className="body-text">
                      {item.name}
                    </Link>
                  </div>
                </div>

                <div className="body-text text-main-dark mt-4">
                  {item.quantity.toLocaleString()}
                </div>
                <div className="body-text text-main-dark mt-4" style={{ textTransform: "capitalize" }}>
                  {item.category || "—"}
                </div>

                <div className="list-icon-function">
                  <Link href={`/add-category?id=${item.id}`} className="item edit" title="Edit category">
                    <i className="icon-edit-3"></i>
                  </Link>
                  <div
                    className="item trash"
                    onClick={() => setSelectedItem(item)}
                    style={{ cursor: "pointer" }}
                  >
                    <i className="icon-trash-2"></i>
                  </div>
                </div>
              </li>
            ))}

            {paginated.length === 0 && (
              <li className="body-text text-center">No categories found</li>
            )}
          </ul>
        </div>

        <div className="divider"></div>

        <div className="flex items-center justify-between flex-wrap gap10">
          <div className="text-tiny text-surface-2">
            {filtered.length > 0
              ? `Showing ${start + 1} to ${Math.min(end, filtered.length)} of ${
                  filtered.length
                } entries`
              : "Showing 0 entries"}
          </div>

          {/* Hide pagination if only 1 page */}
          {totalPages > 1 && (
            <ul className="wg-pagination">
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (safePage > 1) setPage(safePage - 1);
                  }}
                >
                  <i className="icon-chevron-left"></i>
                </a>
              </li>

              {Array.from({ length: totalPages }, (_, i) => {
                const current = i + 1;
                return (
                  <li key={current} className={safePage === current ? "active" : ""}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(current);
                      }}
                    >
                      {current}
                    </a>
                  </li>
                );
              })}

              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (safePage < totalPages) setPage(safePage + 1);
                  }}
                >
                  <i className="icon-chevron-right"></i>
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!selectedItem}
        title="Confirm delete"
        message={
          selectedItem ? (
            <>
              Are you sure you want to delete category{" "}
              <strong>{selectedItem.name}</strong>?
            </>
          ) : null
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
                busy={deleting}
        onCancel={() => setSelectedItem(null)}
      />
    </>
  );
}
