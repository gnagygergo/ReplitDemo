/**
 * Products Table Layout (Clean Version)
 * 
 * This layout only defines WHAT fields to show - the TableViewHandler
 * provides all the boilerplate (loading states, search, pagination, etc.)
 */

import type { TableLayoutProps } from "../../../components/ui/TableViewHandler";

export default function ProductsTableLayout({
  records,
  TableRow,
  TableCell,
  TableField,
  EditButton,
  DeleteButton,
}: TableLayoutProps) {
  if (records.length === 0) {
    return (
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell>Description</TableCell>
        <TableCell>Sales UoM</TableCell>
        <TableCell className="text-right">Actions</TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {records.map((record) => (
        <TableRow key={record.id as string} data-testid={`row-product-${record.id}`}>
          <TableCell>
            <TableField
              name="name"
              value={record.name}
              linkPath="/products"
              recordId={record.id as string}
            />
          </TableCell>
          <TableCell>
            <TableField name="description" value={record.description} />
          </TableCell>
          <TableCell>
            <TableField name="salesUomId" value={record.salesUomId} />
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <EditButton recordId={record.id as string} />
              <DeleteButton record={record} />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
