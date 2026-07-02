export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string | null;
  created_at: string;
};

export type Income = {
  id: string;
  user_id: string;
  category_id: string | null;
  category?: Category | null;
  amount: number;
  description: string | null;
  source: string | null;
  date: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  category_id: string | null;
  category?: Category | null;
  amount: number;
  description: string | null;
  merchant: string | null;
  date: string;
  is_recurring: boolean;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string | null;
  category?: Category | null;
  name: string;
  limit_amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
};

export type Bill = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  category_id: string | null;
  category?: Category | null;
  is_paid: boolean;
  is_recurring: boolean;
  frequency: 'weekly' | 'monthly' | 'yearly';
  created_at: string;
  updated_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'debit' | 'savings';
  balance: number;
  currency: string;
  institution: string | null;
  created_at: string;
  updated_at: string;
};

export type Card = {
  id: string;
  user_id: string;
  wallet_id: string | null;
  name: string;
  card_type: 'visa' | 'mastercard' | 'amex' | 'discover';
  last_four: string | null;
  limit_amount: number;
  balance: number;
  expiry_date: string | null;
  color: string;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
};

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  monthly_budget: number;
  created_at: string;
  updated_at: string;
};

export type DashboardStats = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlySavings: number;
  budgetUsage: number;
  budgetLimit: number;
  activeGoals: number;
  upcomingBills: number;
};
