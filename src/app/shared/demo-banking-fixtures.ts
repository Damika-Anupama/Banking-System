import { isoDaysFromNow, localIsoToday } from './local-date';

/**
 * The "now" this file's absolute dates were authored against.
 *
 * Every dated fixture below is shifted by the drift between this and the real
 * today, so a transaction written as "yesterday" is still yesterday when
 * rendered, an FD that had four months to maturity still does, and the ledger
 * never turns into a two-month-old wall the way the standing orders once did.
 */
const AUTHORED_NOW = new Date(2026, 4, 25);

const DRIFT_DAYS = (() => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((startOfToday.getTime() - AUTHORED_NOW.getTime()) / 86400000);
})();

/** Shifts an authored `YYYY-MM-DD[Thh:mm:ss]` stamp by the drift, keeping the time. */
function rebaseDate(authored: string): string {
  const [datePart, timePart] = authored.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const shifted = new Date(y, m - 1, d + DRIFT_DAYS);
  return timePart ? `${localIsoToday(shifted)}T${timePart}` : localIsoToday(shifted);
}

/** Rebases the `date` field of every transaction row in a ledger map. */
function rebaseLedger(ledger: Record<string, any[]>): Record<string, any[]> {
  return Object.fromEntries(
    Object.entries(ledger).map(([account, rows]) => [
      account,
      rows.map(row => ({ ...row, date: rebaseDate(row.date) })),
    ])
  );
}

export interface DemoAccount {
  account_id: string;
  account_type: string;
  saving_type: string;
  branch_name: string;
  amount: string;
}

export interface DemoCustomer {
  user_id: string;
  username: string;
  fullname: string;
  gender: string;
  dob: string;
  address: string;
  email: string;
  contact_no: string;
  account_count: number;
  status: string;
}

export interface DemoLoanApplication {
  loan_basic_detail_id: string;
  amount: number;
  customer_id: string;
  duration_days: number;
  interest: number;
  loan_type: string;
  status: string;
  purpose: string;
}

export interface DemoProfile {
  user_id: string;
  username: string;
  fullname: string;
  gender: string;
  dob: string;
  address: string;
  email: string;
  contact_no: string;
  kyc_status: string;
  last_login: string;
}

export const DEMO_PROFILE: DemoProfile = {
  user_id: 'CUS-1001',
  username: 'amara.perera',
  fullname: 'Amara Perera',
  gender: 'FEMALE',
  dob: '1991-04-18',
  address: 'No. 24, Marine Drive, Colombo 03',
  email: 'amara@banking.demo',
  contact_no: '+94 77 123 4567',
  kyc_status: 'Verified',
  last_login: rebaseDate('2026-05-25T08:45:00')
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { account_id: 'ACC-492810', account_type: 'PERSONAL', saving_type: 'SAVING', branch_name: 'Colombo Main Branch', amount: '1245800' },
  { account_id: 'ACC-492811', account_type: 'PERSONAL', saving_type: 'CURRENT', branch_name: 'Colombo Main Branch', amount: '485250' },
  { account_id: 'ACC-492812', account_type: 'ORGANIZATION', saving_type: 'SAVING', branch_name: 'Kandy City Branch', amount: '2000000' }
];

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  { user_id: 'CUS-1001', username: 'amara.perera', fullname: 'Amara Perera', gender: 'Female', dob: '1991-04-18', address: 'No. 24, Marine Drive, Colombo 03', email: 'amara@banking.demo', contact_no: '+94 77 123 4567', account_count: 3, status: 'KYC verified' },
  { user_id: 'CUS-1002', username: 'nuwan.silva', fullname: 'Nuwan Silva', gender: 'Male', dob: '1988-09-02', address: 'Lake Road, Kandy', email: 'nuwan@banking.demo', contact_no: '+94 71 555 0199', account_count: 2, status: 'Loan review' },
  { user_id: 'CUS-1003', username: 'sofia.fernando', fullname: 'Sofia Fernando', gender: 'Female', dob: '1995-12-11', address: 'Galle Fort, Galle', email: 'sofia@banking.demo', contact_no: '+94 76 222 8899', account_count: 4, status: 'Priority customer' },
  { user_id: 'CUS-1004', username: 'ishan.jay', fullname: 'Ishan Jayawardena', gender: 'Male', dob: '1984-06-25', address: 'Negombo Road, Wattala', email: 'ishan@banking.demo', contact_no: '+94 70 445 7812', account_count: 1, status: 'New onboarding' },
  { user_id: 'CUS-1005', username: 'dilani.rajapaksa', fullname: 'Dilani Rajapaksa', gender: 'Female', dob: '1990-02-14', address: 'Temple Road, Maharagama', email: 'dilani@banking.demo', contact_no: '+94 77 901 2233', account_count: 2, status: 'KYC verified' },
  { user_id: 'CUS-1006', username: 'kasun.mendis', fullname: 'Kasun Mendis', gender: 'Male', dob: '1986-11-30', address: 'Beach Road, Mount Lavinia', email: 'kasun@banking.demo', contact_no: '+94 71 334 5566', account_count: 3, status: 'KYC verified' },
  { user_id: 'CUS-1007', username: 'tharushi.silva', fullname: 'Tharushi Silva', gender: 'Female', dob: '1998-07-08', address: 'Hill Street, Nuwara Eliya', email: 'tharushi@banking.demo', contact_no: '+94 76 778 9900', account_count: 1, status: 'New onboarding' },
  { user_id: 'CUS-1008', username: 'roshan.peiris', fullname: 'Roshan Peiris', gender: 'Male', dob: '1982-03-19', address: 'Main Street, Kurunegala', email: 'roshan@banking.demo', contact_no: '+94 70 112 4455', account_count: 5, status: 'Priority customer' },
  { user_id: 'CUS-1009', username: 'menaka.gunawardena', fullname: 'Menaka Gunawardena', gender: 'Female', dob: '1993-09-27', address: 'Station Road, Panadura', email: 'menaka@banking.demo', contact_no: '+94 77 556 1122', account_count: 2, status: 'KYC verified' },
  { user_id: 'CUS-1010', username: 'pradeep.bandara', fullname: 'Pradeep Bandara', gender: 'Male', dob: '1979-12-05', address: 'Kandy Road, Matale', email: 'pradeep@banking.demo', contact_no: '+94 71 889 3344', account_count: 1, status: 'Loan review' },
  { user_id: 'CUS-1011', username: 'hashini.wijesinghe', fullname: 'Hashini Wijesinghe', gender: 'Female', dob: '1996-05-22', address: 'Lake View, Battaramulla', email: 'hashini@banking.demo', contact_no: '+94 76 443 7788', account_count: 3, status: 'KYC verified' },
  { user_id: 'CUS-1012', username: 'sanjaya.fernando', fullname: 'Sanjaya Fernando', gender: 'Male', dob: '1991-08-16', address: 'Sea Street, Chilaw', email: 'sanjaya@banking.demo', contact_no: '+94 70 667 2211', account_count: 2, status: 'New onboarding' },
  { user_id: 'CUS-1013', username: 'amaya.kumari', fullname: 'Amaya Kumari', gender: 'Female', dob: '2000-01-09', address: 'Park Lane, Rajagiriya', email: 'amaya@banking.demo', contact_no: '+94 77 224 6688', account_count: 1, status: 'KYC verified' },
  { user_id: 'CUS-1014', username: 'chamath.alwis', fullname: 'Chamath Alwis', gender: 'Male', dob: '1987-10-12', address: 'Galle Road, Dehiwala', email: 'chamath@banking.demo', contact_no: '+94 71 990 5544', account_count: 4, status: 'Priority customer' }
];

const RAW_DEMO_TRANSACTIONS: Record<string, any[]> = {
  'ACC-492810': [
    { date: '2026-05-24T09:40:00', type: 'Salary Credit', sender_remarks: 'Monthly payroll received', beneficiary_remarks: 'Monthly salary', amount: 185000, status: 'up', audit_status: 'Posted', channel: 'Payroll' },
    { date: '2026-05-23T14:20:00', type: 'Utility Payment', sender_remarks: 'Electricity and water bill', beneficiary_remarks: 'CEB and NWSDB monthly bills', amount: 18500, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-22T11:05:00', type: 'Card Settlement', sender_remarks: 'Supermarket purchase', beneficiary_remarks: 'Debit card settlement', amount: 9450, status: 'down', audit_status: 'Posted', channel: 'Card' },
    { date: '2026-05-21T10:18:00', type: 'Internal Transfer', sender_remarks: 'Moved surplus to current account', beneficiary_remarks: 'Working capital top-up', amount: 75000, status: 'down', audit_status: 'Posted', channel: 'Mobile app', to_account: 'ACC-492811' },
    { date: '2026-05-20T17:42:00', type: 'ATM Withdrawal', sender_remarks: 'Cash withdrawal - Colombo 03 ATM', beneficiary_remarks: 'ATM cash', amount: 20000, status: 'down', audit_status: 'Posted', channel: 'ATM' },
    { date: '2026-05-19T15:30:00', type: 'Interest Credit', sender_remarks: 'Monthly savings interest', beneficiary_remarks: 'Interest posting', amount: 8200, status: 'up', audit_status: 'Posted', channel: 'Core banking' },
    { date: '2026-05-18T08:55:00', type: 'Standing Order', sender_remarks: 'Apartment rent payment', beneficiary_remarks: 'Monthly rent', amount: 95000, status: 'down', audit_status: 'Posted', channel: 'Standing order' },
    { date: '2026-05-17T12:12:00', type: 'QR Merchant Payment', sender_remarks: 'Restaurant payment', beneficiary_remarks: 'Merchant QR payment', amount: 6800, status: 'down', audit_status: 'Posted', channel: 'QR Pay' },
    { date: '2026-05-16T09:10:00', type: 'Refund Credit', sender_remarks: 'Card refund - travel booking', beneficiary_remarks: 'Merchant refund', amount: 27500, status: 'up', audit_status: 'Posted', channel: 'Card' },
    { date: '2026-05-15T13:26:00', type: 'Insurance Premium', sender_remarks: 'Life insurance monthly premium', beneficiary_remarks: 'Policy premium', amount: 14500, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-14T18:05:00', type: 'Fund Transfer', sender_remarks: 'Family support transfer', beneficiary_remarks: 'Monthly support', amount: 35000, status: 'down', audit_status: 'Posted', channel: 'Mobile app' },
    { date: '2026-05-13T11:45:00', type: 'Dividend Credit', sender_remarks: 'Portfolio dividend payout', beneficiary_remarks: 'Quarterly dividend', amount: 16200, status: 'up', audit_status: 'Posted', channel: 'Clearing' },
    { date: '2026-05-12T08:30:00', type: 'Salary Advance', sender_remarks: 'Mid-month advance', beneficiary_remarks: 'Advance credit', amount: 40000, status: 'up', audit_status: 'Posted', channel: 'Payroll' },
    { date: '2026-05-11T13:15:00', type: 'Mobile Reload', sender_remarks: 'Prepaid top-up', beneficiary_remarks: 'Dialog reload', amount: 2000, status: 'down', audit_status: 'Posted', channel: 'Mobile app' },
    { date: '2026-05-10T16:40:00', type: 'Loan Installment', sender_remarks: 'Personal loan repayment', beneficiary_remarks: 'LN-49201 installment', amount: 22500, status: 'down', audit_status: 'Posted', channel: 'Standing order' },
    { date: '2026-05-09T10:05:00', type: 'Cheque Deposit', sender_remarks: 'Client cheque cleared', beneficiary_remarks: 'Cheque 884201', amount: 128000, status: 'up', audit_status: 'Posted', channel: 'Branch' },
    { date: '2026-05-08T19:20:00', type: 'Online Purchase', sender_remarks: 'E-commerce order', beneficiary_remarks: 'Daraz order', amount: 13750, status: 'down', audit_status: 'Posted', channel: 'Card' },
    { date: '2026-05-07T09:50:00', type: 'Interest Credit', sender_remarks: 'Savings interest', beneficiary_remarks: 'Interest posting', amount: 7600, status: 'up', audit_status: 'Posted', channel: 'Core banking' }
  ],
  'ACC-492811': [
    { date: '2026-05-24T08:15:00', type: 'Client Transfer', sender_remarks: 'Invoice BS-1024 paid', beneficiary_remarks: 'Consulting invoice', amount: 64000, status: 'up', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-21T16:10:00', type: 'Vendor Payment', sender_remarks: 'Office equipment supplier', beneficiary_remarks: 'Supplier settlement', amount: 42000, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-20T09:00:00', type: 'Internal Transfer', sender_remarks: 'Working capital top-up', beneficiary_remarks: 'From savings account', amount: 75000, status: 'up', audit_status: 'Posted', channel: 'Mobile app', from_account: 'ACC-492810' },
    { date: '2026-05-19T10:35:00', type: 'Subscription Payment', sender_remarks: 'Cloud service monthly invoice', beneficiary_remarks: 'SaaS subscription', amount: 18500, status: 'down', audit_status: 'Posted', channel: 'Card' },
    { date: '2026-05-18T15:15:00', type: 'Tax Payment', sender_remarks: 'Quarterly PAYE settlement', beneficiary_remarks: 'Tax reference Q2', amount: 38000, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-17T09:20:00', type: 'Client Transfer', sender_remarks: 'Invoice BS-1018 paid', beneficiary_remarks: 'Project milestone', amount: 93000, status: 'up', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-16T14:50:00', type: 'Payroll Disbursement', sender_remarks: 'Part-time contractor payment', beneficiary_remarks: 'Contractor payout', amount: 56000, status: 'down', audit_status: 'Posted', channel: 'Bulk payment' },
    { date: '2026-05-15T16:44:00', type: 'Bank Charge', sender_remarks: 'Account service fee', beneficiary_remarks: 'Monthly service fee', amount: 1250, status: 'down', audit_status: 'Posted', channel: 'Core banking' },
    { date: '2026-05-14T11:30:00', type: 'Client Transfer', sender_remarks: 'Invoice BS-1015 paid', beneficiary_remarks: 'Retainer fee', amount: 72000, status: 'up', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-13T14:05:00', type: 'Vendor Payment', sender_remarks: 'Marketing agency retainer', beneficiary_remarks: 'Campaign settlement', amount: 48000, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-12T09:48:00', type: 'Card Settlement', sender_remarks: 'Fuel and travel expenses', beneficiary_remarks: 'Corporate card', amount: 16400, status: 'down', audit_status: 'Posted', channel: 'Card' },
    { date: '2026-05-11T17:22:00', type: 'Client Transfer', sender_remarks: 'Invoice BS-1011 paid', beneficiary_remarks: 'Maintenance contract', amount: 88000, status: 'up', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-10T10:15:00', type: 'Utility Payment', sender_remarks: 'Office electricity bill', beneficiary_remarks: 'CEB commercial', amount: 24500, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-09T13:40:00', type: 'Loan Disbursement', sender_remarks: 'Working capital facility drawdown', beneficiary_remarks: 'LN-50208 tranche', amount: 250000, status: 'up', audit_status: 'Posted', channel: 'Core banking' },
    { date: '2026-05-08T16:18:00', type: 'Vendor Payment', sender_remarks: 'Stationery and supplies', beneficiary_remarks: 'Office supplies', amount: 9800, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-07T08:35:00', type: 'Client Transfer', sender_remarks: 'Invoice BS-1007 paid', beneficiary_remarks: 'Advisory fee', amount: 54000, status: 'up', audit_status: 'Posted', channel: 'Online banking' }
  ],
  'ACC-492812': [
    { date: '2026-05-20T10:00:00', type: 'Fixed Deposit Interest', sender_remarks: 'Quarterly interest posting', beneficiary_remarks: 'FD interest', amount: 31500, status: 'up', audit_status: 'Posted', channel: 'Core banking' },
    { date: '2026-05-18T13:25:00', type: 'Internal Transfer', sender_remarks: 'Moved to savings account', beneficiary_remarks: 'Treasury allocation', amount: 50000, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-16T10:30:00', type: 'Corporate Deposit', sender_remarks: 'Branch cash deposit', beneficiary_remarks: 'Daily collection', amount: 240000, status: 'up', audit_status: 'Posted', channel: 'Branch' },
    { date: '2026-05-14T12:05:00', type: 'Supplier Payment', sender_remarks: 'Inventory purchase order', beneficiary_remarks: 'PO-8891 settlement', amount: 185000, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-12T09:35:00', type: 'Standing Order', sender_remarks: 'Warehouse lease payment', beneficiary_remarks: 'Monthly lease', amount: 125000, status: 'down', audit_status: 'Posted', channel: 'Standing order' },
    { date: '2026-05-10T15:45:00', type: 'Client Settlement', sender_remarks: 'Distributor settlement received', beneficiary_remarks: 'Distributor settlement', amount: 310000, status: 'up', audit_status: 'Posted', channel: 'Clearing' },
    { date: '2026-05-09T11:20:00', type: 'Payroll Disbursement', sender_remarks: 'Staff salary run', beneficiary_remarks: 'Payroll batch', amount: 420000, status: 'down', audit_status: 'Posted', channel: 'Bulk payment' },
    { date: '2026-05-08T14:55:00', type: 'Corporate Deposit', sender_remarks: 'Branch cash deposit', beneficiary_remarks: 'Daily collection', amount: 175000, status: 'up', audit_status: 'Posted', channel: 'Branch' },
    { date: '2026-05-07T10:10:00', type: 'Tax Payment', sender_remarks: 'VAT remittance Q2', beneficiary_remarks: 'Tax reference VAT-Q2', amount: 96000, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-06T16:30:00', type: 'Client Settlement', sender_remarks: 'Wholesale order received', beneficiary_remarks: 'Order WS-2210', amount: 268000, status: 'up', audit_status: 'Posted', channel: 'Clearing' },
    { date: '2026-05-05T09:25:00', type: 'Supplier Payment', sender_remarks: 'Raw material procurement', beneficiary_remarks: 'PO-8875 settlement', amount: 142000, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-04T13:50:00', type: 'Utility Payment', sender_remarks: 'Warehouse utilities', beneficiary_remarks: 'CEB and NWSDB commercial', amount: 38500, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-03T11:05:00', type: 'Interest Credit', sender_remarks: 'Monthly savings interest', beneficiary_remarks: 'Interest posting', amount: 12800, status: 'up', audit_status: 'Posted', channel: 'Core banking' },
    { date: '2026-05-02T15:15:00', type: 'Insurance Premium', sender_remarks: 'Commercial property insurance', beneficiary_remarks: 'Policy premium', amount: 45000, status: 'down', audit_status: 'Posted', channel: 'Online banking' }
  ]
};

export const DEMO_TRANSACTIONS: Record<string, any[]> = rebaseLedger(RAW_DEMO_TRANSACTIONS);

export const DEMO_LOAN_APPLICATIONS: DemoLoanApplication[] = [
  { loan_basic_detail_id: 'LN-50210', amount: 750000, customer_id: 'CUS-1002', duration_days: 730, interest: 12.5, loan_type: 'Personal', status: 'Pending review', purpose: 'Home renovation' },
  { loan_basic_detail_id: 'LN-50208', amount: 1850000, customer_id: 'CUS-1003', duration_days: 1095, interest: 14.2, loan_type: 'Business', status: 'Documents verified', purpose: 'Inventory expansion' },
  { loan_basic_detail_id: 'LN-50201', amount: 420000, customer_id: 'CUS-1004', duration_days: 365, interest: 11.8, loan_type: 'Personal', status: 'Risk check', purpose: 'Education support' }
];

export const DEMO_SAVING_ACCOUNTS = [
  { saving_account_id: 492810, account_type: 'SAVING', amount: 1245800 },
  { saving_account_id: 492812, account_type: 'SAVING', amount: 2000000 }
];

export const DEMO_FIXED_DEPOSITS = [
  { fd_id: 7001, saving_account_id: 492810, duration: 'SIX_MONTHS', rate_per_annum: 13, fd_opening_date: rebaseDate('2026-02-12'), amount: 350000 },
  { fd_id: 7002, saving_account_id: 492812, duration: 'ONE_YEAR', rate_per_annum: 14, fd_opening_date: rebaseDate('2026-04-04'), amount: 900000 }
];

export const createDemoFixedDeposit = (payload: { saving_account_id: number | string; duration: string; rate_per_annum: string | number; amount: number }) => ({
  fd_id: Math.floor(8000 + Math.random() * 900),
  saving_account_id: Number(payload.saving_account_id),
  duration: payload.duration,
  rate_per_annum: Number(payload.rate_per_annum),
  fd_opening_date: new Date().toISOString().slice(0, 10),
  amount: Number(payload.amount),
  status: 'Pending confirmation'
});

export const DEMO_CUSTOMER_LOANS = [
  { loan_basic_detail_id: 'LN-49201', amount: 210000, starting_date: rebaseDate('2026-05-12'), duration_days: 180, interest: 13, loan_type: 'Personal' },
  { loan_basic_detail_id: 'LN-49202', amount: 480000, starting_date: rebaseDate('2026-03-20'), duration_days: 365, interest: 14, loan_type: 'Business' },
  { loan_basic_detail_id: 'LN-49188', amount: 150000, starting_date: rebaseDate('2026-02-05'), duration_days: 180, interest: 13, loan_type: 'Personal' },
  { loan_basic_detail_id: 'LN-49170', amount: 920000, starting_date: rebaseDate('2025-12-18'), duration_days: 1080, interest: 15, loan_type: 'Business' },
  { loan_basic_detail_id: 'LN-49152', amount: 65000, starting_date: rebaseDate('2026-04-28'), duration_days: 180, interest: 13, loan_type: 'Personal' },
  { loan_basic_detail_id: 'LN-49133', amount: 340000, starting_date: rebaseDate('2026-01-15'), duration_days: 365, interest: 14, loan_type: 'Business' }
];

export const createDemoLoan = (payload: { amount: number; duration_days: string | number; interest: string | number; loan_type: string }) => ({
  loan_basic_detail_id: 'LN-DEMO-' + Math.floor(1000 + Math.random() * 9000),
  amount: Number(payload.amount),
  starting_date: new Date().toISOString().slice(0, 10),
  duration_days: Number(payload.duration_days),
  interest: Number(payload.interest),
  loan_type: payload.loan_type === 'BUSINESS' ? 'Business' : 'Personal',
  status: 'Submitted'
});

export interface DemoCard {
  id: string;
  type: 'Debit' | 'Credit';
  network: 'Visa' | 'Mastercard';
  number_last4: string;
  holder: string;
  expiry: string;
  linked_account: string;
  balance?: number;
  credit_limit?: number;
  credit_used?: number;
  status: 'Active' | 'Frozen';
}

export const DEMO_CARDS: DemoCard[] = [
  { id: 'CARD-4821', type: 'Debit', network: 'Visa', number_last4: '4821', holder: 'Amara Perera', expiry: '08/28', linked_account: 'ACC-492810', balance: 1245800, status: 'Active' },
  { id: 'CARD-7390', type: 'Credit', network: 'Mastercard', number_last4: '7390', holder: 'Amara Perera', expiry: '03/27', linked_account: 'ACC-492811', credit_limit: 500000, credit_used: 142500, status: 'Active' },
  { id: 'CARD-1156', type: 'Debit', network: 'Visa', number_last4: '1156', holder: 'Amara Perera', expiry: '11/26', linked_account: 'ACC-492812', balance: 2000000, status: 'Frozen' }
];

export interface DemoStandingOrder {
  id: string;
  payee: string;
  account_id: string;
  category: string;
  amount: number;
  frequency: 'Monthly' | 'Weekly' | 'Quarterly';
  next_date: string;
  status: 'Active' | 'Paused';
}

// Relative, not absolute: absolute seed dates rot — a "due soon" order
// written in May reads as "overdue by 45 days" by July. The spread is
// deliberate: one order lands tomorrow so the amber urgency state shows.
export const DEMO_STANDING_ORDERS: DemoStandingOrder[] = [
  { id: 'SO-3001', payee: 'Ceylon Electricity Board', account_id: 'ACC-880021', category: 'Utilities', amount: 18500, frequency: 'Monthly', next_date: isoDaysFromNow(5), status: 'Active' },
  { id: 'SO-3002', payee: 'Apartment Lease', account_id: 'ACC-770814', category: 'Rent / lease', amount: 95000, frequency: 'Monthly', next_date: isoDaysFromNow(1), status: 'Active' },
  { id: 'SO-3003', payee: 'Life Insurance Premium', account_id: 'ACC-560010', category: 'Insurance', amount: 14500, frequency: 'Monthly', next_date: isoDaysFromNow(14), status: 'Active' },
  { id: 'SO-3004', payee: 'Cloud Subscription', account_id: 'ACC-335500', category: 'Subscription', amount: 4800, frequency: 'Monthly', next_date: isoDaysFromNow(20), status: 'Paused' }
];

export const createDemoStandingOrder = (payload: {
  payee: string; account_id: string; category: string; amount: number;
  frequency: 'Monthly' | 'Weekly' | 'Quarterly'; next_date: string;
}): DemoStandingOrder => ({
  id: 'SO-' + Math.floor(3100 + Math.random() * 6899),
  payee: payload.payee,
  account_id: payload.account_id.toUpperCase(),
  category: payload.category,
  amount: Number(payload.amount),
  frequency: payload.frequency,
  next_date: payload.next_date,
  status: 'Active'
});

export interface DemoBeneficiary {
  id: string;
  name: string;
  account_id: string;
  nickname?: string;
}

export const DEMO_BENEFICIARIES: DemoBeneficiary[] = [
  { id: 'BEN-1001', name: 'Sunil Construction', account_id: 'ACC-772901', nickname: 'Contractor' },
  { id: 'BEN-1002', name: 'Greenfield Supplies', account_id: 'ACC-560010', nickname: 'Supplier' },
  { id: 'BEN-1003', name: 'Amara Perera (Savings)', account_id: 'ACC-492811', nickname: 'My current a/c' }
];

export const createDemoBeneficiary = (payload: { name: string; account_id: string; nickname?: string }): DemoBeneficiary => ({
  id: 'BEN-' + Math.floor(2000 + Math.random() * 7999),
  name: payload.name,
  account_id: payload.account_id.toUpperCase(),
  nickname: payload.nickname
});

export const createDemoLoanApplication = (payload: {
  customer_id: string; amount: number; duration_days: string | number;
  interest: string | number; loan_type: string; purpose?: string;
}): DemoLoanApplication => ({
  loan_basic_detail_id: 'LN-' + Math.floor(50300 + Math.random() * 699),
  amount: Number(payload.amount),
  customer_id: payload.customer_id,
  duration_days: Number(payload.duration_days),
  interest: Number(payload.interest),
  loan_type: payload.loan_type,
  status: 'Pending review',
  purpose: payload.purpose || 'Branch-assisted application'
});

const titleCaseGender = (gender: string): string => {
  const g = (gender || '').toUpperCase();
  return g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other';
};

export const createDemoEmployee = (payload: {
  username: string; fullname: string; gender: string; dob: string;
  address: string; email: string; contact_no: string; branch_id?: string | null;
}) => ({
  employee_id: 'EMP-' + Math.floor(2100 + Math.random() * 7900),
  username: payload.username,
  fullname: payload.fullname,
  gender: titleCaseGender(payload.gender),
  dob: payload.dob,
  address: payload.address,
  email: payload.email,
  contact_no: payload.contact_no,
  branch_id: payload.branch_id || 'BR-001',
  status: 'Active'
});

export const createDemoCustomer = (payload: {
  username: string; fullname: string; gender: string; dob: string;
  address: string; email: string; contact_no: string;
}): DemoCustomer => ({
  user_id: 'CUS-' + Math.floor(1100 + Math.random() * 8900),
  username: payload.username,
  fullname: payload.fullname,
  gender: titleCaseGender(payload.gender),
  dob: payload.dob,
  address: payload.address,
  email: payload.email,
  contact_no: payload.contact_no,
  account_count: 0,
  status: 'New onboarding'
});

// ----- Branch employee roster (manager employee management) -----
export interface DemoEmployee {
  employee_id: string;
  username: string;
  fullname: string;
  role: string;
  email: string;
  contact_no: string;
  branch_id: string;
  joined_date: string;
  transactions_handled: number;
  status: 'Active' | 'Inactive';
}

export const DEMO_EMPLOYEES: DemoEmployee[] = [
  { employee_id: 'EMP-2001', username: 'kavindu.rajapaksha', fullname: 'Kavindu Rajapaksha', role: 'Teller', email: 'kavindu@banking.demo', contact_no: '+94 77 451 9023', branch_id: 'BR-001', joined_date: '2022-03-14', transactions_handled: 1840, status: 'Active' },
  { employee_id: 'EMP-2002', username: 'nadeesha.silva', fullname: 'Nadeesha Silva', role: 'Customer Service Officer', email: 'nadeesha@banking.demo', contact_no: '+94 71 220 7781', branch_id: 'BR-001', joined_date: '2021-08-02', transactions_handled: 2310, status: 'Active' },
  { employee_id: 'EMP-2003', username: 'tharindu.fernando', fullname: 'Tharindu Fernando', role: 'Loan Officer', email: 'tharindu@banking.demo', contact_no: '+94 76 884 3320', branch_id: 'BR-001', joined_date: '2020-11-19', transactions_handled: 1495, status: 'Active' },
  { employee_id: 'EMP-2004', username: 'ishara.gunasekara', fullname: 'Ishara Gunasekara', role: 'Teller', email: 'ishara@banking.demo', contact_no: '+94 70 113 6654', branch_id: 'BR-001', joined_date: '2023-01-30', transactions_handled: 980, status: 'Active' },
  { employee_id: 'EMP-2005', username: 'dilshan.perera', fullname: 'Dilshan Perera', role: 'Operations Officer', email: 'dilshan@banking.demo', contact_no: '+94 77 905 2218', branch_id: 'BR-001', joined_date: '2019-06-11', transactions_handled: 3120, status: 'Active' },
  { employee_id: 'EMP-2006', username: 'rashmi.jayasuriya', fullname: 'Rashmi Jayasuriya', role: 'Customer Service Officer', email: 'rashmi@banking.demo', contact_no: '+94 71 776 4490', branch_id: 'BR-001', joined_date: '2022-09-25', transactions_handled: 1670, status: 'Active' },
  { employee_id: 'EMP-2007', username: 'sahan.weerasinghe', fullname: 'Sahan Weerasinghe', role: 'Loan Officer', email: 'sahan@banking.demo', contact_no: '+94 76 332 1108', branch_id: 'BR-001', joined_date: '2018-02-07', transactions_handled: 2890, status: 'Inactive' },
  { employee_id: 'EMP-2008', username: 'piumi.dissanayake', fullname: 'Piumi Dissanayake', role: 'Teller', email: 'piumi@banking.demo', contact_no: '+94 70 558 9931', branch_id: 'BR-001', joined_date: '2023-07-18', transactions_handled: 640, status: 'Active' }
];
