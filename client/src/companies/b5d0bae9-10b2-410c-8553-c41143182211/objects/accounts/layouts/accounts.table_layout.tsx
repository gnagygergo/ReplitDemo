/**
 * Accounts Table Layout (Clean Version)
 * 
 * This layout only defines WHAT fields to show - the TableViewHandler
 * provides all the boilerplate (loading states, search, pagination, etc.)
 * 
 * The RowWrapper provides LayoutContext for each row, enabling smart TableField
 * to auto-detect field types from metadata and display appropriate values.
 */

import type { TableLayoutProps } from "../../../components/ui/TableViewHandler";

export default function AccountsTableLayout({
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
        <TableCell>Account Name</TableCell>
        <TableCell>Address</TableCell>
        <TableCell>Owner</TableCell>
        <TableCell>Tax id</TableCell>
        <TableCell className="text-right">Actions</TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {records.map((record) => (
        <RowWrapper key={record.id as string} record={record}>
          <TableRow data-testid={`row-account-${record.id}`}>
            <TableCell>
              <TableField name="name" linkPath="/accounts" />
            </TableCell>
            <TableCell>
              <TableField name="address" />
            </TableCell>
            <TableCell>
              <TableField name="ownerId" />
            </TableCell>
            <TableCell>
              <TableField name="taxId" />
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
