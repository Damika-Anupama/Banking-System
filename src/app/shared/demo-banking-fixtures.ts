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
    { date: '2026-05-24T09:40:00', type: 'Salary Credit', sender_remarks: 'Monthly payroll received', amount: 185000, status: 'up' },
    { date: '2026-05-23T14:20:00', type: 'Utility Payment', sender_remarks: 'Electricity and water bill', amount: 18500, status: 'down' },
    { date: '2026-05-22T11:05:00', type: 'Card Settlement', sender_remarks: 'Supermarket purchase', amount: 9450, status: 'down' }
  ],
  'ACC-492811': [
    { date: '2026-05-24T08:15:00', type: 'Client Transfer', sender_remarks: 'Invoice BS-1024 paid', amount: 64000, status: 'up' },
    { date: '2026-05-21T16:10:00', type: 'Vendor Payment', sender_remarks: 'Office equipment supplier', amount: 42000, status: 'down' }
  ],
  'ACC-492812': [
    { date: '2026-05-20T10:00:00', type: 'Fixed Deposit Interest', sender_remarks: 'Quarterly interest posting', amount: 31500, status: 'up' },
    { date: '2026-05-18T13:25:00', type: 'Internal Transfer', sender_remarks: 'Moved to savings account', amount: 50000, status: 'down' }
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

export const DEMO_CUSTOMER_LOANS = [
  { loan_basic_detail_id: 'LN-49201', amount: 210000, starting_date: '2026-05-12', duration_days: 180, interest: 13, loan_type: 'Personal' },
  { loan_basic_detail_id: 'LN-49202', amount: 480000, starting_date: '2026-03-20', duration_days: 365, interest: 14, loan_type: 'Business' }
];
