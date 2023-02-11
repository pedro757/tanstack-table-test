import { faker } from "@faker-js/faker";
import type { CellContext, ColumnDef, RowData } from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { createPortal } from "react-dom";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

import { atom, useAtom } from "jotai";

const Modal = atom(false);

export default function Page() {
  const [data, setData] = React.useState(() => makeData(100));
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [showModal, setShowModal] = useAtom(Modal);

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    state: {
      globalFilter,
    },
    meta: {
      updateData(rowIndex, columnId, value) {
        // Skip age index reset until after next rerender
        // skipAutoResetPageIndex()
        setData((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ...old[rowIndex]!,
                [columnId]: value,
              };
            }
            return row;
          })
        );
      },
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "auto",
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <main
      id="main"
      className="flex min-h-screen flex-col items-center justify-center"
    >
      <div className="m-8 p-8 shadow-lg bg-slate-50 rounded-lg">
        <input
          type="text"
          value={globalFilter}
          onChange={(el) => setGlobalFilter(el.target.value)}
          placeholder="Search"
          className="p-4 w-full border mb-4 rounded-lg"
        />

      <table className="rounded-lg border border-separate">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="odd:bg-slate-50">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border-r border-b last:border-r-0 p-2">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="even:bg-slate-50 hover:even:bg-slate-100 hover:odd:bg-slate-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border-r border-b last:border-r-0">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {typeof window !== "undefined" &&
        showModal &&
        createPortal(
          <div className="fixed left-1/2 top-1/2">
            <div className="relative -left-1/2 -top-1/2 flex flex-col rounded-lg bg-white p-4">
              ¿Estas seguro que quieres modificar este Producto?
              <div className="flex gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg bg-black p-2 text-white"
                >
                  Si
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg bg-black p-2 text-white"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}

type Product = {
  name: string;
  quantity: string;
  sku: string;
};

const range = (len: number) => {
  const arr = [];
  for (let i = 0; i < len; i++) {
    arr.push(i);
  }
  return arr;
};

const newProduct = (): Product => {
  return {
    name: faker.commerce.productName(),
    quantity: faker.random.numeric(3),
    sku: faker.random.numeric(10),
  };
};

export function makeData(len: number) {
  return range(len).map((): Product => {
    return newProduct();
  });
}

const columnHelper = createColumnHelper<Product>();

const columns = [
  columnHelper.accessor("name", {
    header: "Nombre del Producto",
  }),
  columnHelper.accessor("sku", {
    header: "SKU",
  }),
  columnHelper.accessor("quantity", {
    header: "Cantidad",
  }),
  columnHelper.display({
    header: "Actions",
    cell: ActionButton,
  }),
];

function ActionButton(_row: CellContext<Product, unknown>) {
  const [, setShowModal] = useAtom(Modal);

  return (
    <button
      onClick={() => setShowModal(true)}
      className="rounded-lg bg-slate-100 shadow-lg p-2 text-black"
    >
      Editar
    </button>
  );
}

const defaultColumn: Partial<ColumnDef<Product>> = {
  cell: Cell,
};

function Cell(cell: CellContext<Product, unknown>) {
  const initialValue = cell.getValue();
  // We need to keep and update the state of the cell normally
  const [value, setValue] = React.useState(initialValue);

  // When the input is blurred, we'll call our table meta's updateData function
  const onBlur = () => {
    cell.table.options.meta?.updateData(cell.row.index, cell.column.id, value);
  };

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <input
      value={value as string}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      className="bg-transparent p-2"
    />
  );
}
