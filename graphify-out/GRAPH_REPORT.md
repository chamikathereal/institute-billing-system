# Graph Report - institute-billing-system  (2026-09-20)

## Corpus Check
- 105 files · ~32,734 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 766 nodes · 1492 edges · 45 communities (36 shown, 6 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1a131015`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- @nestjs/common
- students/[id]/page.tsx
- auth.module.ts
- institute-billing-server/package.json
- CoursesService
- DiscountsService
- EnrollmentsService
- StudentsService
- components.json
- institute-billing-client/package.json
- compilerOptions
- .uploadImage
- compilerOptions
- providers.tsx
- dependencies
- devDependencies
- dependencies
- public-portal.module.ts
- DashboardController
- scripts
- SettingsController
- InvoicesController
- PaymentsController
- AppService
- SmsController
- devDependencies
- ReportsController
- contact-form.tsx
- oxlint.json
- tsconfig.build.json
- scripts
- nest-cli.json
- RecordPaymentDto
- eslint.config.mjs
- orval
- postcss.config.mjs
- 🛠️ Getting Started
- institute-billing-server/README.md
- institute-billing-client
- rules/graphify.md
- workflows/graphify.md
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `@nestjs/common` - 50 edges
2. `PrismaService` - 31 edges
3. `TenantsService` - 30 edges
4. `react` - 26 edges
5. `@nestjs/swagger` - 21 edges
6. `scripts` - 20 edges
7. `useToast()` - 19 edges
8. `compilerOptions` - 19 edges
9. `lucide-react` - 18 edges
10. `api` - 18 edges

## Surprising Connections (you probably didn't know these)
- `DiscountsManagementPage()` --calls--> `useToast()`  [EXTRACTED]
  institute-billing-client/src/app/discounts/page.tsx → institute-billing-client/src/components/ui/toast.tsx
- `DashboardPage()` --calls--> `useToast()`  [EXTRACTED]
  institute-billing-client/src/app/page.tsx → institute-billing-client/src/components/ui/toast.tsx
- `PaymentsTerminalContent()` --calls--> `useToast()`  [EXTRACTED]
  institute-billing-client/src/app/payments/page.tsx → institute-billing-client/src/components/ui/toast.tsx
- `SettingsPage()` --calls--> `useToast()`  [EXTRACTED]
  institute-billing-client/src/app/settings/page.tsx → institute-billing-client/src/components/ui/toast.tsx
- `StudentProfilePage()` --calls--> `useToast()`  [EXTRACTED]
  institute-billing-client/src/app/students/[id]/page.tsx → institute-billing-client/src/components/ui/toast.tsx

## Import Cycles
- None detected.

## Communities (45 total, 6 thin omitted)

### Community 0 - "@nestjs/common"
Cohesion: 0.06
Nodes (42): CoursesModule, Module, DashboardModule, Module, DashboardService, Injectable, EnrollmentsModule, Module (+34 more)

### Community 1 - "students/[id]/page.tsx"
Cohesion: 0.11
Nodes (54): calculateEqualInstallments(), CoursesManagementPage(), getOrdinal(), parseMonthsFromDuration(), DiscountsManagementPage(), LoginPage(), DashboardPage(), PaymentsTerminalContent() (+46 more)

### Community 2 - "auth.module.ts"
Cohesion: 0.08
Nodes (26): ApiBearerAuth, AuthController, ApiOperation, ApiTags, Body, Controller, Get, Post (+18 more)

### Community 3 - "institute-billing-server/package.json"
Cohesion: 0.04
Nodes (41): author, description, @types/node, typescript, license, name, prisma, seed (+33 more)

### Community 4 - "CoursesService"
Cohesion: 0.12
Nodes (17): Delete, CoursesController, ApiOperation, ApiTags, Body, Controller, Get, Param (+9 more)

### Community 5 - "DiscountsService"
Cohesion: 0.11
Nodes (17): DiscountsController, ApiOperation, ApiTags, Body, Controller, Get, Param, Patch (+9 more)

### Community 6 - "EnrollmentsService"
Cohesion: 0.11
Nodes (17): EnrollmentsController, ApiOperation, ApiTags, Body, Controller, Get, Param, Post (+9 more)

### Community 7 - "StudentsService"
Cohesion: 0.13
Nodes (15): StudentsController, ApiOperation, ApiTags, Body, Controller, Get, Param, Patch (+7 more)

### Community 8 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 9 - "institute-billing-client/package.json"
Cohesion: 0.10
Nodes (20): @types/node, typescript, name, private, version, axios, @base-ui/react, clsx (+12 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+11 more)

### Community 11 - ".uploadImage"
Cohesion: 0.11
Nodes (19): ApiBody, ApiConsumes, CLOUDINARY, CloudinaryProvider, ApiOperation, ApiTags, Controller, Post (+11 more)

### Community 12 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 13 - "providers.tsx"
Cohesion: 0.18
Nodes (8): nextConfig, inter, metadata, Providers(), QueryProvider(), ToastProvider(), AuthProvider(), next

### Community 14 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, axios, @base-ui/react, class-variance-authority, clsx, cn, framer-motion, @hookform/resolvers (+10 more)

### Community 15 - "devDependencies"
Cohesion: 0.10
Nodes (20): devDependencies, @nestjs/cli, @nestjs/mau, @nestjs/schematics, @nestjs/testing, oxlint, prettier, prisma (+12 more)

### Community 16 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, bcryptjs, class-transformer, class-validator, cloudinary, jsonwebtoken, multer, @nestjs/common (+11 more)

### Community 17 - "public-portal.module.ts"
Cohesion: 0.16
Nodes (10): PublicPortalController, ApiOperation, ApiTags, Controller, Get, Param, PublicPortalModule, Module (+2 more)

### Community 18 - "DashboardController"
Cohesion: 0.22
Nodes (6): DashboardController, ApiOperation, ApiTags, Controller, Get, Query

### Community 19 - "scripts"
Cohesion: 0.10
Nodes (20): scripts, build, db:generate, db:migrate, db:reset, db:seed, db:studio, deploy (+12 more)

### Community 20 - "SettingsController"
Cohesion: 0.22
Nodes (8): SettingsController, ApiOperation, ApiTags, Body, Controller, Get, Patch, Query

### Community 21 - "InvoicesController"
Cohesion: 0.20
Nodes (7): InvoicesController, ApiOperation, ApiTags, Controller, Get, Param, Query

### Community 22 - "PaymentsController"
Cohesion: 0.18
Nodes (9): PaymentsController, ApiOperation, ApiTags, Body, Controller, Get, Param, Post (+1 more)

### Community 23 - "AppService"
Cohesion: 0.29
Nodes (5): AppController, Controller, Get, AppService, Injectable

### Community 24 - "SmsController"
Cohesion: 0.22
Nodes (7): SmsController, ApiOperation, ApiTags, Controller, Get, Post, Query

### Community 25 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, orval, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+2 more)

### Community 27 - "ReportsController"
Cohesion: 0.22
Nodes (6): ReportsController, ApiOperation, ApiTags, Controller, Get, Query

### Community 28 - "contact-form.tsx"
Cohesion: 0.38
Nodes (4): ContactFormData, contactFormSchema, react-hook-form, zod

### Community 29 - "oxlint.json"
Cohesion: 0.29
Nodes (6): env, node, rules, @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises, $schema

### Community 30 - "tsconfig.build.json"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 31 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, gen, lint, start

### Community 32 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 33 - "RecordPaymentDto"
Cohesion: 0.67
Nodes (3): RecordPaymentDto, ApiProperty, ApiPropertyOptional

### Community 42 - "🛠️ Getting Started"
Cohesion: 0.17
Nodes (11): 1. Prerequisites, 2. Clone & Install Dependencies, 3. Configure Database, 4. Push Schema & Seed Database, 5. Run the Application, 🛠️ Getting Started, 🎓 Institute Billing & Invoicing System, 🚀 Key Features (+3 more)

### Community 43 - "institute-billing-server/README.md"
Cohesion: 0.18
Nodes (10): Compile and run the project, Deployment, Description, License, Observability, Project setup, Resources, Run tests (+2 more)

### Community 44 - "institute-billing-client"
Cohesion: 0.20
Nodes (9): Available Scripts, Getting Started, Installation, institute-billing-client, Prerequisites, Project Structure, Shadcn UI, Tech Stack (+1 more)

## Knowledge Gaps
- **256 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+251 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 398 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `@nestjs/common` to `auth.module.ts`, `institute-billing-server/package.json`, `DiscountsService`, `.uploadImage`, `public-portal.module.ts`, `AppService`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Why does `@nestjs/swagger` connect `@nestjs/common` to `auth.module.ts`, `institute-billing-server/package.json`, `DiscountsService`, `.uploadImage`, `public-portal.module.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `institute-billing-server/package.json`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _256 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `@nestjs/common` be split into smaller, more focused modules?**
  _Cohesion score 0.060073260073260075 - nodes in this community are weakly interconnected._
- **Should `students/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11053351573187414 - nodes in this community are weakly interconnected._
- **Should `auth.module.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07507507507507508 - nodes in this community are weakly interconnected._