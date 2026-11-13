import postgres from 'postgres';
import {
  Customer,
  CustomerField,
  RoleField,
  RoleForm,
  RolesTableRow,
  UserForm,
  UsersTableRow,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { cachedQuery, CACHE_TAGS } from './cache';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Every read query below is wrapped with cachedQuery (see the exports at the
// end of the file), so repeated page loads are served from the cache instead
// of Postgres until a Server Action invalidates the matching tag.

async function fetchRevenueQuery() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<Revenue[]>`SELECT * FROM revenue`;

    // console.log('Data fetch completed after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

async function fetchLatestInvoicesQuery() {
  try {
    const data = await sql<LatestInvoiceRaw[]>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

async function fetchCardDataQuery() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0][0].count ?? '0');
    const numberOfCustomers = Number(data[1][0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2][0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2][0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
async function fetchFilteredInvoicesQuery(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await sql<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

async function fetchInvoicesPagesQuery(query: string) {
  try {
    const data = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

async function fetchInvoiceByIdQuery(id: string) {
  try {
    const data = await sql<InvoiceForm[]>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

async function fetchCustomersQuery() {
  try {
    const customers = await sql<CustomerField[]>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

async function fetchFilteredCustomersQuery(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const data = await sql<CustomersTableType[]>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
		LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
	  `;

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

async function fetchCustomersPagesQuery(query: string) {
  try {
    const data = await sql`SELECT COUNT(*)
    FROM customers
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of customers.');
  }
}

async function fetchCustomerByIdQuery(id: string) {
  try {
    const data = await sql<Customer[]>`
      SELECT id, name, email, image_url
      FROM customers
      WHERE id = ${id};
    `;

    return data[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch customer.');
  }
}

// ---------- Users & roles administration ----------

async function fetchUsersQuery() {
  try {
    return await sql<UsersTableRow[]>`
      SELECT users.id, users.name, users.email, users.role_id, roles.name AS role_name
      FROM users
      LEFT JOIN roles ON roles.id = users.role_id
      ORDER BY users.name ASC
    `;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch users.');
  }
}

async function fetchUserByIdQuery(id: string) {
  try {
    const data = await sql<UserForm[]>`
      SELECT id, name, email, role_id FROM users WHERE id = ${id}
    `;
    return data[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user.');
  }
}

// Roles for the user form's role picker.
async function fetchRoleOptionsQuery() {
  try {
    return await sql<RoleField[]>`
      SELECT id, name FROM roles ORDER BY is_system DESC, name ASC
    `;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch roles.');
  }
}

async function fetchRolesQuery() {
  try {
    const data = await sql<RolesTableRow[]>`
      SELECT
        roles.id,
        roles.name,
        roles.description,
        roles.is_system,
        (SELECT COUNT(*) FROM users WHERE users.role_id = roles.id) AS user_count,
        (SELECT COUNT(*) FROM role_permissions WHERE role_permissions.role_id = roles.id) AS permission_count
      FROM roles
      ORDER BY roles.is_system DESC, roles.name ASC
    `;
    // COUNT(*) comes back from Postgres as a bigint string.
    return data.map((role) => ({
      ...role,
      user_count: Number(role.user_count),
      permission_count: Number(role.permission_count),
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch roles.');
  }
}

async function fetchRoleByIdQuery(id: string) {
  try {
    const data = await sql<RoleForm[]>`
      SELECT
        roles.id,
        roles.name,
        roles.description,
        roles.is_system,
        ARRAY(
          SELECT permission FROM role_permissions
          WHERE role_permissions.role_id = roles.id
        ) AS permissions
      FROM roles
      WHERE roles.id = ${id}
    `;
    return data[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch role.');
  }
}

// ---------- Cached exports ----------

export const fetchRevenue = cachedQuery(
  fetchRevenueQuery,
  'fetchRevenue',
  [CACHE_TAGS.revenue],
);
export const fetchLatestInvoices = cachedQuery(
  fetchLatestInvoicesQuery,
  'fetchLatestInvoices',
  [CACHE_TAGS.invoices, CACHE_TAGS.customers],
);
export const fetchCardData = cachedQuery(
  fetchCardDataQuery,
  'fetchCardData',
  [CACHE_TAGS.invoices, CACHE_TAGS.customers],
);
export const fetchFilteredInvoices = cachedQuery(
  fetchFilteredInvoicesQuery,
  'fetchFilteredInvoices',
  [CACHE_TAGS.invoices, CACHE_TAGS.customers],
);
export const fetchInvoicesPages = cachedQuery(
  fetchInvoicesPagesQuery,
  'fetchInvoicesPages',
  [CACHE_TAGS.invoices, CACHE_TAGS.customers],
);
export const fetchInvoiceById = cachedQuery(
  fetchInvoiceByIdQuery,
  'fetchInvoiceById',
  [CACHE_TAGS.invoices],
);
export const fetchCustomers = cachedQuery(
  fetchCustomersQuery,
  'fetchCustomers',
  [CACHE_TAGS.customers],
);
export const fetchFilteredCustomers = cachedQuery(
  fetchFilteredCustomersQuery,
  'fetchFilteredCustomers',
  [CACHE_TAGS.customers, CACHE_TAGS.invoices],
);
export const fetchCustomersPages = cachedQuery(
  fetchCustomersPagesQuery,
  'fetchCustomersPages',
  [CACHE_TAGS.customers],
);
export const fetchCustomerById = cachedQuery(
  fetchCustomerByIdQuery,
  'fetchCustomerById',
  [CACHE_TAGS.customers],
);
export const fetchUsers = cachedQuery(
  fetchUsersQuery,
  'fetchUsers',
  [CACHE_TAGS.users, CACHE_TAGS.roles],
);
export const fetchUserById = cachedQuery(
  fetchUserByIdQuery,
  'fetchUserById',
  [CACHE_TAGS.users],
);
export const fetchRoleOptions = cachedQuery(
  fetchRoleOptionsQuery,
  'fetchRoleOptions',
  [CACHE_TAGS.roles],
);
export const fetchRoles = cachedQuery(
  fetchRolesQuery,
  'fetchRoles',
  [CACHE_TAGS.roles, CACHE_TAGS.users],
);
export const fetchRoleById = cachedQuery(
  fetchRoleByIdQuery,
  'fetchRoleById',
  [CACHE_TAGS.roles],
);
