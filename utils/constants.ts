export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
];

export const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Income', href: '/income', icon: 'TrendingUp' },
  { label: 'Expenses', href: '/expenses', icon: 'TrendingDown' },
  { label: 'Categories', href: '/categories', icon: 'Tags' },
  { label: 'Budgets', href: '/budgets', icon: 'Wallet' },
  { label: 'Goals', href: '/goals', icon: 'Target' },
  { label: 'Bills', href: '/bills', icon: 'Receipt' },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { label: 'Reports', href: '/reports', icon: 'FileText' },
  { label: 'Wallets', href: '/wallets', icon: 'CreditCard' },
  { label: 'Cards', href: '/cards', icon: 'Banknote' },
  { label: 'Notifications', href: '/notifications', icon: 'Bell' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
  { label: 'Profile', href: '/profile', icon: 'User' },
];

export const MOBILE_NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Expenses', href: '/expenses', icon: 'TrendingDown' },
  { label: 'Income', href: '/income', icon: 'TrendingUp' },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
];

export const PERIOD_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const WALLET_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Account' },
  { value: 'credit', label: 'Credit' },
  { value: 'debit', label: 'Debit' },
  { value: 'savings', label: 'Savings' },
];

export const CARD_TYPES = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'amex', label: 'American Express' },
  { value: 'discover', label: 'Discover' },
];

export const NOTIFICATION_TYPES = {
  info: { color: 'text-blue-600', bg: 'bg-blue-50', icon: 'Info' },
  success: { color: 'text-green-600', bg: 'bg-green-50', icon: 'CheckCircle' },
  warning: { color: 'text-amber-600', bg: 'bg-amber-50', icon: 'AlertTriangle' },
  error: { color: 'text-red-600', bg: 'bg-red-50', icon: 'XCircle' },
};
