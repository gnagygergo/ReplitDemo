/**
 * Assets Table Layout (Clean Version)
 * 
 * This layout only defines WHAT fields to show - the TableViewHandler
 * provides all the boilerplate (loading states, search, pagination, etc.)
 * 
 * The RowWrapper provides LayoutContext for each row, enabling smart TableField
 * to auto-detect field types from metadata and display appropriate values
 * (e.g., LookupField shows display name instead of ID, AddressField shows compact address).
 */

import type { TableLayoutProps } from "../../../components/ui/TableViewHandler";

export default function AssetsTableLayout({
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
        <TableCell>Serial Number</TableCell>
        <TableCell>Name</TableCell>
        <TableCell>Account</TableCell>
        <TableCell>Product</TableCell>
        <TableCell>Location</TableCell>
        <TableCell>Installation Date</TableCell>
        <TableCell className="text-right">Actions</TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {records.map((record) => (
        <RowWrapper key={record.id as string} record={record}>
          <TableRow data-testid={`row-asset-${record.id}`}>
            <TableCell>
              <TableField name="serialNumber" linkPath="/assets" />
            </TableCell>
            <TableCell>
              <TableField name="name" />
            </TableCell>
            <TableCell>
              <TableField name="accountId" />
            </TableCell>
            <TableCell>
              <TableField name="productId" />
            </TableCell>
            <TableCell>
              <TableField name="location" />
            </TableCell>
            <TableCell>
              <TableField name="installationDate" />
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
