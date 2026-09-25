export type AccountType = 
  | 'CASH' 
  | 'BANK' 
  | 'CREDIT_CARD' 
  | 'DEBIT_CARD' 
  | 'WALLET' 
  | 'INVESTMENT' 
  | 'OTHER';

export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';

export type RoomRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type SettlementMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type NotificationType = 
  | 'JOIN_REQUEST' 
  | 'JOIN_APPROVED' 
  | 'ROOM_INVITE' 
  | 'EXPENSE_ADDED' 
  | 'SETTLEMENT_RECORDED' 
  | 'BUDGET_ALERT' 
  | 'BILL_DUE' 
  | 'GOAL_MILESTONE';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  firstDayOfMonth: number;
  theme: 'light' | 'dark' | 'system';
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface IAccount {
  _id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: number; // in minor units
  currentBalance: number; // in minor units
  creditLimit?: number;
  statementDate?: number;
  dueDate?: number;
  color?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  userId?: string | null;
  name: string;
  type: 'EXPENSE' | 'INCOME';
  icon: string;
  color: string;
  isSystemDefault: boolean;
}

export interface ITransaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number; // in minor units
  currency: string;
  accountId: string;
  account?: IAccount;
  toAccountId?: string;
  toAccount?: IAccount;
  categoryId: string;
  category?: ICategory;
  subCategory?: string;
  date: string;
  merchant?: string;
  description: string;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
  isRecurring?: boolean;
  recurringId?: string;
  sharedExpenseId?: string;
  createdAt: string;
}

export interface ICategoryBudget {
  categoryId: string;
  limit: number; // in minor units
  rollover?: boolean;
}

export interface IBudget {
  _id: string;
  userId: string;
  period: string; // YYYY-MM
  overallLimit: number; // in minor units
  categoryLimits: ICategoryBudget[];
  alertThresholds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface IRoom {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  currency: string;
  createdBy: string;
  inviteCode: string;
  inviteCodeExpiresAt?: string;
  isArchived: boolean;
  createdAt: string;
  memberCount?: number;
  userRole?: RoomRole;
}

export interface IRoomMember {
  _id: string;
  roomId: string;
  userId: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  role: RoomRole;
  joinedAt: string;
}

export interface IExpensePayer {
  userId: string;
  amount: number; // in minor units
  user?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface IExpenseSplit {
  userId: string;
  amount: number; // in minor units
  percentage?: number;
  shares?: number;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface ISharedExpense {
  _id: string;
  roomId: string;
  title: string;
  amount: number; // in minor units
  currency: string;
  date: string;
  categoryId?: string;
  category?: ICategory;
  splitType: SplitType;
  payers: IExpensePayer[];
  splits: IExpenseSplit[];
  notes?: string;
  receiptUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface ISettlement {
  _id: string;
  roomId: string;
  fromUserId: string;
  fromUser?: {
    _id: string;
    name: string;
    email: string;
  };
  toUserId: string;
  toUser?: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number; // in minor units
  currency: string;
  method: SettlementMethod;
  date: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface IRecurringTransaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number; // minor units
  accountId: string;
  categoryId: string;
  description: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  nextOccurrence: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

export interface ISavingsGoal {
  _id: string;
  userId: string;
  name: string;
  targetAmount: number; // minor units
  currentAmount: number; // minor units
  targetDate: string;
  color: string;
  icon: string;
  isCompleted: boolean;
}

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface IActivityLog {
  _id: string;
  roomId: string;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  action: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface ISimplifiedDebt {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number; // minor units
}
