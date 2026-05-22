# PostgreSQL Migration Roadmap

## 1. Why PostgreSQL may be useful later
While our current MongoDB setup is working well, PostgreSQL offers distinct advantages for a growing pharmacy and retail management system:
- **Accounting**: Strict ACID compliance ensures that double-entry ledgers remain perfectly balanced without race conditions.
- **Ledger**: Structured relational tables make complex ledger queries (debits vs credits) simpler and more robust.
- **Customer Due**: Reliable enforcement of foreign keys ensures customer due balances match their underlying unpaid invoices.
- **Purchase & Supplier**: Advanced relational joins allow seamless tracking between supplier purchase orders, goods received notes, and stock increases.
- **Stock Movement**: Transactional rollbacks protect inventory accuracy (preventing overselling) during concurrent sales.
- **Reporting**: Complex aggregations (e.g., COGS, net profit, monthly sales tax) are significantly faster and more powerful using SQL.

## 2. Why we are not migrating now
- **Current MongoDB mode is working**: The current schema design, combined with our `DataService` abstraction, handles all business needs effectively without performance issues.
- **JSON fallback still useful for local dev**: The seamless switch between MongoDB and JSON storage accelerates local development and testing without requiring a dedicated database server.
- **Business modules are still evolving**: Phase-by-phase feature additions (like new accounting rules, notification templates, and future gateways) require a flexible schema. NoSQL adapts to these rapid schema changes much faster than relational migrations.
- **Live deployment not done yet**: We need to validate the actual business logic in a live environment first. Premature optimization or migration could introduce unnecessary delays and risks before launch.

## 3. Current Data Sources
The migration will need to securely map the following existing collections:
- `products`
- `orders`
- `posSales`
- `refunds`
- `expenses`
- `dayClosings`
- `customers`
- `customerLedgers`
- `notificationTemplates`
- `notificationLogs`
- `banners`
- `prescriptions`
- `paymentGatewayLogs` (if available/configured)

## 4. Future PostgreSQL Schema Plan
When the migration occurs, the data will be normalized into the following relational tables:
- `users`
- `roles`
- `products`
- `product_batches`
- `stock_movements`
- `orders`
- `order_items`
- `payments`
- `pos_sessions`
- `pos_sales`
- `pos_sale_items`
- `refunds`
- `customers`
- `customer_ledgers`
- `expenses`
- `accounting_day_closings`
- `suppliers`
- `supplier_ledgers`
- `prescriptions`
- `invoices`
- `banners`
- `notification_templates`
- `notification_logs`
- `gateway_attempts`
- `audit_logs`

## 5. Migration Strategy
1. **Backup MongoDB/JSON first**: Take a full snapshot of the production database and safely archive it.
2. **Create PostgreSQL schema**: Execute DDL scripts to create the tables, relationships, and indexes.
3. **Dry-run migration**: Run an ETL (Extract, Transform, Load) script in a staging environment.
4. **Compare record counts**: Verify that every collection matches the corresponding table row count exactly.
5. **Compare financial totals**: Ensure `posSales`, `orders`, and `dayClosings` totals sum identically in SQL as they did in NoSQL.
6. **Compare customer due totals**: Verify all customer ledgers match the outstanding balances exactly.
7. **Compare stock totals**: Ensure inventory counts remain perfectly synchronized.
8. **Run app in read-only verification mode**: Let the staging app run against PostgreSQL to manually verify UI data loading.
9. **Switch DB_DRIVER**: Update the production `.env` to `DB_DRIVER=postgres` only after all staging tests pass 100%.

## 6. Rollback Plan
- **Keep MongoDB untouched**: Do not drop the MongoDB database until PostgreSQL has been stable in production for at least 30 days.
- **Keep JSON backup**: Maintain the pre-migration JSON export in cold storage.
- **Switch DB_DRIVER back**: If critical issues occur in production, simply change `DB_DRIVER=mongodb` back in `.env` to immediately revert the application to the NoSQL cluster.
- **Restore from backup if needed**: Any transactions that occurred during the brief PostgreSQL window would need to be manually reconciled.

## 7. Risks
- **Accounting mismatch**: Incorrect floating-point math or timezone shifts during ETL could cause cent-level mismatches in daily totals.
- **Stock mismatch**: Concurrent sales during the migration window could lead to lost stock updates.
- **Customer due mismatch**: Incorrectly mapping historic POS due sales could incorrectly inflate or deflate a customer's real-world debt.
- **Invoice/order relation mismatch**: Losing the link between a POS sale and its subsequent refunds or ledger entries.
- **Prescription privacy**: Accidental exposure or loss of private patient prescription image paths during the data transfer.
- **Downtime**: The system will need a strict maintenance window to ensure no writes occur during the ETL process.
- **Performance indexes**: SQL queries might initially be slower if foreign keys and composite indexes are not optimized correctly for our specific dashboard queries.

## 8. Required Tests Before Migration
- `npm test` (All core unit/integration tests passing under the PostgreSQL driver).
- Accounting totals test (Verify today's income, expenses, and net profit matches).
- POS sale/refund test (Simulate a complex due sale and partial refund).
- Due collection test (Verify ledger math updates correctly).
- Invoice test (Ensure historical invoices render identically).
- Export test (Verify CSV reports generate with the same exact numbers).
- Payment verification test (Verify manual and gateway callbacks update order statuses).
- Prescription privacy test (Verify only authorized roles can access attached files).

## 9. Final Recommendation
**Do not migrate before the live soft launch.** 
Continue operating on MongoDB for now. The current architecture successfully abstracts the database layer, meaning business logic is already protected. We strongly recommend revisiting this PostgreSQL migration roadmap only after 1–3 months of real-world business data has been collected, stabilizing our feature requirements and schema shapes.
