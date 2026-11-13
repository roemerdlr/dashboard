import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';
import { ADMIN_ROLE_ID, DEFAULT_ROLES } from '../lib/permissions';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '../lib/cache';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function seedRoles() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS roles (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      is_system BOOLEAN NOT NULL DEFAULT FALSE
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission VARCHAR(64) NOT NULL,
      PRIMARY KEY (role_id, permission)
    );
  `;

  for (const role of DEFAULT_ROLES) {
    await sql`
      INSERT INTO roles (id, name, description, is_system)
      VALUES (${role.id}, ${role.name}, ${role.description}, ${role.isSystem})
      ON CONFLICT (id) DO NOTHING;
    `;
    for (const permission of role.permissions) {
      await sql`
        INSERT INTO role_permissions (role_id, permission)
        VALUES (${role.id}, ${permission})
        ON CONFLICT DO NOTHING;
      `;
    }
  }
}

async function seedUsers() {
  // users.role_id references roles, so roles must exist first.
  await seedRoles();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;
  // Added after the course schema; ADD COLUMN IF NOT EXISTS migrates existing databases.
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  // The seeded user is the first administrator.
  await sql`
    UPDATE users SET role_id = ${ADMIN_ROLE_ID}
    WHERE id = ${users[0].id} AND role_id IS NULL;
  `;

  return insertedUsers;
}

async function seedInvoices() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  // The placeholder invoices have no id, so ON CONFLICT can't detect them and
  // re-running /seed (e.g. to apply the roles migration) would duplicate them.
  const [{ count }] = await sql`SELECT COUNT(*) FROM invoices`;
  if (Number(count) > 0) return [];

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedInvoices;
}

async function seedCustomers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedCustomers;
}

async function seedRevenue() {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `,
    ),
  );

  return insertedRevenue;
}

export async function GET() {
  try {
    const result = await sql.begin((sql) => [
      seedUsers(),
      seedCustomers(),
      seedInvoices(),
      seedRevenue(),
    ]);

    // Seeding writes the tables directly, so drop every cached query result.
    // updateTag is only available in Server Actions; expire: 0 is the
    // Route Handler equivalent (no stale data served afterwards).
    for (const tag of Object.values(CACHE_TAGS)) {
      revalidateTag(tag, { expire: 0 });
    }

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
