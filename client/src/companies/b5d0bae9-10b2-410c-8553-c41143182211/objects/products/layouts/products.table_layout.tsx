/**
 * Products Table Layout (Clean Version)
 * 
 * This layout only defines WHAT fields to show - the TableViewHandler
 * provides all the boilerplate (loading states, search, pagination, etc.)
 * 
 * The RowWrapper provides LayoutContext for each row, enabling smart TableField
 * to auto-detect field types from metadata and display appropriate values
 * (e.g., LookupField shows display name instead of ID).
 */

import type { TableLayoutProps } from "../../../components/ui/TableViewHandler";

export default function ProductsTableLayout({
  records,
  TableRow,
  TableCell,
  TableField,
  EditButton,
  DeleteButton,
  RowWrapper,
}: TableLayoutProps) {
  if (records.length === 0) {
    return (
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell>Sales UoM</TableCell>
        <TableCell>Sales Category</TableCell>
        <TableCell className="text-right">Actions</TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {records.map((record) => (
        <RowWrapper key={record.id as string} record={record}>
          <TableRow data-testid={`row-product-${record.id}`}>
            <TableCell>
              <TableField name="name" linkPath="/products" />
            </TableCell>
            <TableCell>
              <TableField name="salesUomId" />
            </TableCell>
            <TableCell>
              <TableField name="salesCategory" />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <EditButton recordId={record.id as string} />
                <DeleteButton record={record} />
              </div>
            </TableCell>
          </TableRow>
        </RowWrapper>
      ))}
    </>
  );
}
