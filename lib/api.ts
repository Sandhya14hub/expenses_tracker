import type {
  Category, Income, Expense, Budget, Goal, Bill, Wallet, Card,
  Notification, Profile, DashboardStats,
} from '@/types';

const STORAGE_KEY = 'fintrack_data';
const AUTH_KEY = 'fintrack_auth';

type Database = {
  profile: Profile;
  categories: Category[];
  income: Income[];
  expenses: Expense[];
  budgets: Budget[];
  goals: Goal[];
  bills: Bill[];
  wallets: Wallet[];
  cards: Card[];
  notifications: Notification[];
};

function genId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function now(): string {
  return new Date().toISOString();
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function getDB(): Database {
  if (typeof window === 'undefined') return getDefaultDB();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  const db = getDefaultDB();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  return db;
}

function saveDB(db: Database): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function getDefaultDB(): Database {
  const userId = 'demo-user';
  const profile: Profile = {
    id: userId, email: 'demo@fintrack.app', full_name: 'Demo User',
    avatar_url: null, currency: 'USD', monthly_budget: 5000,
    created_at: now(), updated_at: now(),
  };

  const categories: Category[] = [
    { id: genId(), user_id: userId, name: 'Salary', type: 'income', color: '#22c55e', icon: null, created_at: now() },
    { id: genId(), user_id: userId, name: 'Freelance', type: 'income', color: '#06b6d4', icon: null, created_at: now() },
    { id: genId(), user_id: userId, name: 'Groceries', type: 'expense', color: '#6366f1', icon: null, created_at: now() },
    { id: genId(), user_id: userId, name: 'Transport', type: 'expense', color: '#f97316', icon: null, created_at: now() },
    { id: genId(), user_id: userId, name: 'Dining', type: 'expense', color: '#ec4899', icon: null, created_at: now() },
    { id: genId(), user_id: userId, name: 'Utilities', type: 'expense', color: '#eab308', icon: null, created_at: now() },
    { id: genId(), user_id: userId, name: 'Entertainment', type: 'expense', color: '#8b5cf6', icon: null, created_at: now() },
  ];

  const income: Income[] = [];
  const expenses: Expense[] = [];
  const budgets: Budget[] = [];
  const goals: Goal[] = [];
  const bills: Bill[] = [];
  const wallets: Wallet[] = [];
  const cards: Card[] = [];
  const notifications: Notification[] = [];

  return { profile, categories, income, expenses, budgets, goals, bills, wallets, cards, notifications };
}

function delay(ms = 200): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Auth
export const mockAuth = {
  async signIn(email: string, _password: string) {
    await delay();
    const db = getDB();
    db.profile.email = email;
    saveDB(db);
    const token = btoa(`${email}:demo`);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token, email }));
    return { error: null as string | null };
  },
  async signUp(email: string, _password: string, fullName: string) {
    await delay();
    const db = getDB();
    db.profile.email = email;
    db.profile.full_name = fullName;
    saveDB(db);
    return { error: null as string | null };
  },
  async signOut() {
    localStorage.removeItem(AUTH_KEY);
  },
  getSession() {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  },
  isAuthenticated() {
    return !!this.getSession();
  },
};

// Generic CRUD factory
function createService<T extends { id: string; user_id: string }>(table: keyof Database) {
  return {
    async list(): Promise<T[]> {
      await delay();
      const db = getDB();
      return [...(db[table] as unknown as T[])].sort((a, b) =>
        ((b as unknown as { created_at?: string }).created_at || '').localeCompare((a as unknown as { created_at?: string }).created_at || '')
      );
    },
    async create(data: Partial<T> & Record<string, unknown>): Promise<T> {
      await delay();
      const db = getDB();
      const item = { user_id: 'demo-user', ...data, id: genId(), created_at: now(), updated_at: now() } as unknown as T;
      (db[table] as unknown as T[]).push(item);
      saveDB(db);
      return item;
    },
    async update(id: string, data: Partial<T>): Promise<T | null> {
      await delay();
      const db = getDB();
      const arr = db[table] as unknown as T[];
      const idx = arr.findIndex((x) => x.id === id);
      if (idx === -1) return null;
      arr[idx] = { ...arr[idx], ...data, updated_at: now() };
      saveDB(db);
      return arr[idx];
    },
    async remove(id: string): Promise<void> {
      await delay();
      const db = getDB();
      const arr = db[table] as unknown as T[];
      const idx = arr.findIndex((x) => x.id === id);
      if (idx !== -1) arr.splice(idx, 1);
      saveDB(db);
    },
    async get(id: string): Promise<T | null> {
      await delay();
      const db = getDB();
      const arr = db[table] as unknown as T[];
      return arr.find((x) => x.id === id) || null;
    },
  };
}

export const categoryService = createService<Category>('categories');
export const incomeService = createService<Income>('income');
export const expenseService = createService<Expense>('expenses');
export const budgetService = createService<Budget>('budgets');
export const goalService = createService<Goal>('goals');
export const billService = createService<Bill>('bills');
export const walletService = createService<Wallet>('wallets');
export const cardService = createService<Card>('cards');
export const notificationService = createService<Notification>('notifications');

// Profile service
export const profileService = {
  async get(): Promise<Profile> {
    await delay();
    return getDB().profile;
  },
  async update(data: Partial<Profile>): Promise<Profile> {
    await delay();
    const db = getDB();
    db.profile = { ...db.profile, ...data, updated_at: now() };
    saveDB(db);
    return db.profile;
  },
};

// Dashboard service
export async function fetchDashboardData(): Promise<{
  stats: DashboardStats;
  income: Income[];
  expenses: Expense[];
  budgets: Budget[];
  goals: Goal[];
  bills: Bill[];
  categories: Category[];
  expenseByCategory: { name: string; value: number; color: string }[];
}> {
  await delay();
  const db = getDB();
  const nowDate = new Date();
  const startOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0).toISOString().split('T')[0];

  const monthIncome = db.income.filter((i) => i.date >= startOfMonth && i.date <= endOfMonth);
  const monthExpenses = db.expenses.filter((e) => e.date >= startOfMonth && e.date <= endOfMonth);
  const activeGoals = db.goals.filter((g) => g.status === 'active');
  const upcomingBills = db.bills.filter((b) => !b.is_paid && b.due_date >= today());
  const expenseCategories = db.categories.filter((c) => c.type === 'expense');

  const totalIncome = monthIncome.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const budgetLimit = db.budgets.reduce((s, b) => s + Number(b.limit_amount), 0);

  const stats: DashboardStats = {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    monthlySavings: totalIncome - totalExpense,
    budgetUsage: budgetLimit > 0 ? Math.min((totalExpense / budgetLimit) * 100, 100) : 0,
    budgetLimit,
    activeGoals: activeGoals.length,
    upcomingBills: upcomingBills.length,
  };

  const expenseByCategory = expenseCategories
    .map((cat) => ({
      name: cat.name,
      value: monthExpenses.filter((e) => e.category_id === cat.id).reduce((s, e) => s + Number(e.amount), 0),
      color: cat.color,
    }))
    .filter((c) => c.value > 0);

  return {
    stats,
    income: monthIncome,
    expenses: monthExpenses,
    budgets: db.budgets,
    goals: activeGoals,
    bills: upcomingBills,
    categories: expenseCategories,
    expenseByCategory,
  };
}

export async function fetchMonthlyTrend(): Promise<{ month: string; income: number; expense: number }[]> {
  await delay();
  const db = getDB();
  const months: { month: string; income: number; expense: number }[] = [];
  const nowDate = new Date();

  for (let i = 5; i >= 0; i--) {
    const start = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
    const end = new Date(nowDate.getFullYear(), nowDate.getMonth() - i + 1, 0);
    const monthName = start.toLocaleString('en-US', { month: 'short' });
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    months.push({
      month: monthName,
      income: db.income.filter((x) => x.date >= startStr && x.date <= endStr).reduce((s, x) => s + Number(x.amount), 0),
      expense: db.expenses.filter((x) => x.date >= startStr && x.date <= endStr).reduce((s, x) => s + Number(x.amount), 0),
    });
  }

  return months;
}
