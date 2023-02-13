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

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

import { atom, useAtom } from "jotai";

const Modal = atom(false);
const ModalInfo = atom<CellContext<Product, unknown>>({
  row: {
    getValue(_columnId:string) {
      return ""
    }
  }
} as CellContext<Product, unknown>);

export default function Page() {
  const [data, setData] = React.useState(() => makeData(100));
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [showModal, setShowModal] = useAtom(Modal);
  const [modalInfo] = useAtom(ModalInfo);

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
      <div className="m-8 rounded-lg bg-slate-50 p-8 shadow-lg">
        <input
          type="text"
          value={globalFilter}
          onChange={(el) => setGlobalFilter(el.target.value)}
          placeholder="Search"
          className="mb-4 w-full rounded-lg border p-4"
        />

        <table className="border-separate rounded-lg border">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="odd:bg-slate-50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-r border-b p-2 last:border-r-0"
                  >
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
              <tr
                key={row.id}
                className="even:bg-slate-50 hover:odd:bg-slate-50 hover:even:bg-slate-100"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border-r border-b last:border-r-0"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dialog open={showModal} className="fixed top-1/3">
        <div className="flex flex-col rounded-lg bg-white p-4">
          ¿Estas seguro que quieres modificar este Producto?
          <p>Producto: {modalInfo.row.getValue("name")}</p>
          <p>SKU: {modalInfo.row.getValue("sku")}</p>
          <p>Cantidad: {modalInfo.row.getValue("quantity")}</p>
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
      </dialog>
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
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("sku", {
    header: "SKU",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("quantity", {
    header: "Cantidad",
  }),
  columnHelper.display({
    header: "Actions",
    cell: ActionButton,
  }),
];

function ActionButton(row: CellContext<Product, unknown>) {
  const [, setShowModal] = useAtom(Modal);
  const [, setModalInfo] = useAtom(ModalInfo);

  return (
    <button
      onClick={() => {
        setShowModal(true);
        setModalInfo(row);
      }}
      className="rounded-lg bg-slate-100 p-2 text-black shadow-lg"
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
