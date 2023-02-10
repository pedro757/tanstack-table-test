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

export default function Page() {
  const [data, setData] = React.useState(() => makeData(100));
  const [globalFilter, setGlobalFilter] = React.useState("");

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <input
        type="text"
        value={globalFilter}
        onChange={(el) => setGlobalFilter(el.target.value)}
        placeholder="Search"
        className="bg-white p-4 text-black"
      />
      <table className="border">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
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
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
  return <button className="bg-white p-4 text-black">Submit</button>;
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
      className="bg-transparent text-white"
    />
  );
}
