# email (or username) & password example with Lucia, SvelteKit and Cloudflare D1

## local development

### prepare db

```bash
pnpm generate
> ...
> [✓] Your SQL migration file ➜ drizzle\0000_furry_wendell_vaughn.sql 🚀
```

```bash
pnpm miragete drizzle\0000_furry_wendell_vaughn.sql
```

### run dev

Do both of the following at the same time

```bash
pnpm cdev
```

```bash
pnpm dev
```
