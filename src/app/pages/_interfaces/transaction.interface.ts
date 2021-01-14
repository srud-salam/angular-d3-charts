export interface ITransaction {
  transactionNumber: number;
  departmentFamily: string;
  entity: string;
  date: Date;
  expenseType: string;
  expenseArea: string;
  supplier: string;
  amount: number;
  invoiceCurrencyUnit: string;
}
