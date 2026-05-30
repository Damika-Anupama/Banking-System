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
  last_login: '2026-05-25T08:45:00'
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
  { user_id: 'CUS-1004', username: 'ishan.jay', fullname: 'Ishan Jayawardena', gender: 'Male', dob: '1984-06-25', address: 'Negombo Road, Wattala', email: 'ishan@banking.demo', contact_no: '+94 70 445 7812', account_count: 1, status: 'New onboarding' }
];

export const DEMO_TRANSACTIONS: Record<string, any[]> = {
  'ACC-492810': [
    { date: '2026-05-24T09:40:00', type: 'Salary Credit', sender_remarks: 'Monthly payroll received', beneficiary_remarks: 'May salary', amount: 185000, status: 'up', audit_status: 'Posted', channel: 'Payroll' },
    { date: '2026-05-23T14:20:00', type: 'Utility Payment', sender_remarks: 'Electricity and water bill', beneficiary_remarks: 'CEB and NWSDB monthly bills', amount: 18500, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-22T11:05:00', type: 'Card Settlement', sender_remarks: 'Supermarket purchase', beneficiary_remarks: 'Debit card settlement', amount: 9450, status: 'down', audit_status: 'Posted', channel: 'Card' },
    { date: '2026-05-21T10:18:00', type: 'Internal Transfer', sender_remarks: 'Moved surplus to current account', beneficiary_remarks: 'Working capital top-up', amount: 75000, status: 'down', audit_status: 'Posted', channel: 'Mobile app', to_account: 'ACC-492811' },
    { date: '2026-05-20T17:42:00', type: 'ATM Withdrawal', sender_remarks: 'Cash withdrawal - Colombo 03 ATM', beneficiary_remarks: 'ATM cash', amount: 20000, status: 'down', audit_status: 'Posted', channel: 'ATM' },
    { date: '2026-05-19T15:30:00', type: 'Interest Credit', sender_remarks: 'Monthly savings interest', beneficiary_remarks: 'Interest posting', amount: 8200, status: 'up', audit_status: 'Posted', channel: 'Core banking' },
    { date: '2026-05-18T08:55:00', type: 'Standing Order', sender_remarks: 'Apartment rent payment', beneficiary_remarks: 'May rent', amount: 95000, status: 'down', audit_status: 'Posted', channel: 'Standing order' },
    { date: '2026-05-17T12:12:00', type: 'QR Merchant Payment', sender_remarks: 'Restaurant payment', beneficiary_remarks: 'Merchant QR payment', amount: 6800, status: 'down', audit_status: 'Posted', channel: 'QR Pay' },
    { date: '2026-05-16T09:10:00', type: 'Refund Credit', sender_remarks: 'Card refund - travel booking', beneficiary_remarks: 'Merchant refund', amount: 27500, status: 'up', audit_status: 'Posted', channel: 'Card' },
    { date: '2026-05-15T13:26:00', type: 'Insurance Premium', sender_remarks: 'Life insurance monthly premium', beneficiary_remarks: 'Policy premium', amount: 14500, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-14T18:05:00', type: 'Fund Transfer', sender_remarks: 'Family support transfer', beneficiary_remarks: 'Monthly support', amount: 35000, status: 'down', audit_status: 'Posted', channel: 'Mobile app' },
    { date: '2026-05-13T11:45:00', type: 'Dividend Credit', sender_remarks: 'Portfolio dividend payout', beneficiary_remarks: 'Quarterly dividend', amount: 16200, status: 'up', audit_status: 'Posted', channel: 'Clearing' }
  ],
  'ACC-492811': [
    { date: '2026-05-24T08:15:00', type: 'Client Transfer', sender_remarks: 'Invoice BS-1024 paid', beneficiary_remarks: 'Consulting invoice', amount: 64000, status: 'up', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-21T16:10:00', type: 'Vendor Payment', sender_remarks: 'Office equipment supplier', beneficiary_remarks: 'Supplier settlement', amount: 42000, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-20T09:00:00', type: 'Internal Transfer', sender_remarks: 'Working capital top-up', beneficiary_remarks: 'From savings account', amount: 75000, status: 'up', audit_status: 'Posted', channel: 'Mobile app', from_account: 'ACC-492810' },
    { date: '2026-05-19T10:35:00', type: 'Subscription Payment', sender_remarks: 'Cloud service monthly invoice', beneficiary_remarks: 'SaaS subscription', amount: 18500, status: 'down', audit_status: 'Posted', channel: 'Card' },
    { date: '2026-05-18T15:15:00', type: 'Tax Payment', sender_remarks: 'Quarterly PAYE settlement', beneficiary_remarks: 'Tax reference Q2', amount: 38000, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-17T09:20:00', type: 'Client Transfer', sender_remarks: 'Invoice BS-1018 paid', beneficiary_remarks: 'Project milestone', amount: 93000, status: 'up', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-16T14:50:00', type: 'Payroll Disbursement', sender_remarks: 'Part-time contractor payment', beneficiary_remarks: 'May contractor payout', amount: 56000, status: 'down', audit_status: 'Posted', channel: 'Bulk payment' },
    { date: '2026-05-15T16:44:00', type: 'Bank Charge', sender_remarks: 'Account service fee', beneficiary_remarks: 'Monthly service fee', amount: 1250, status: 'down', audit_status: 'Posted', channel: 'Core banking' }
  ],
  'ACC-492812': [
    { date: '2026-05-20T10:00:00', type: 'Fixed Deposit Interest', sender_remarks: 'Quarterly interest posting', beneficiary_remarks: 'FD interest', amount: 31500, status: 'up', audit_status: 'Posted', channel: 'Core banking' },
    { date: '2026-05-18T13:25:00', type: 'Internal Transfer', sender_remarks: 'Moved to savings account', beneficiary_remarks: 'Treasury allocation', amount: 50000, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-16T10:30:00', type: 'Corporate Deposit', sender_remarks: 'Branch cash deposit', beneficiary_remarks: 'Daily collection', amount: 240000, status: 'up', audit_status: 'Posted', channel: 'Branch' },
    { date: '2026-05-14T12:05:00', type: 'Supplier Payment', sender_remarks: 'Inventory purchase order', beneficiary_remarks: 'PO-8891 settlement', amount: 185000, status: 'down', audit_status: 'Posted', channel: 'Online banking' },
    { date: '2026-05-12T09:35:00', type: 'Standing Order', sender_remarks: 'Warehouse lease payment', beneficiary_remarks: 'Monthly lease', amount: 125000, status: 'down', audit_status: 'Posted', channel: 'Standing order' },
    { date: '2026-05-10T15:45:00', type: 'Client Settlement', sender_remarks: 'Distributor settlement received', beneficiary_remarks: 'May distributor settlement', amount: 310000, status: 'up', audit_status: 'Posted', channel: 'Clearing' }
  ]
};

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
  { fd_id: 7001, saving_account_id: 492810, duration: 'SIX_MONTHS', rate_per_annum: 13, fd_opening_date: '2026-02-12', amount: 350000 },
  { fd_id: 7002, saving_account_id: 492812, duration: 'ONE_YEAR', rate_per_annum: 14, fd_opening_date: '2026-04-04', amount: 900000 }
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
  { loan_basic_detail_id: 'LN-49201', amount: 210000, starting_date: '2026-05-12', duration_days: 180, interest: 13, loan_type: 'Personal' },
  { loan_basic_detail_id: 'LN-49202', amount: 480000, starting_date: '2026-03-20', duration_days: 365, interest: 14, loan_type: 'Business' }
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
