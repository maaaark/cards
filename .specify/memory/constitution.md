<!--
Sync Impact Report - Version 1.0.0
=====================================
Version change: Initial → 1.0.0
Ratification: New constitution created for Cards project
Principles defined:
  - I. Type Safety & Code Quality (NEW)
  - II. Component-First Architecture (NEW)
  - III. User Experience Consistency (NEW)
  - IV. Performance Requirements (NEW)

Templates alignment status:
  ✅ plan-template.md - Updated constitution check section
  ✅ spec-template.md - Aligned with UX and performance principles
  ✅ tasks-template.md - Removed test-related tasks, aligned with constitution
  ⚠ agent-file-template.md - Generic template, no updates needed

Follow-up TODOs: None

Suggested commit message:
  docs: establish Cards constitution v1.0.0 (code quality, UX, performance)
-->

# Cards Constitution

## Core Principles

### I. Type Safety & Code Quality

TypeScript MUST be used throughout the codebase with strict mode enabled. All components, functions, and data structures MUST have explicit type definitions. No `any` types are permitted without documented justification. Code MUST follow Next.js and React best practices, including proper use of Server and Client Components.

**Rationale**: Type safety prevents runtime errors and improves developer experience through better IDE support and refactoring capabilities. Strict typing is essential for maintainable Next.js applications.

### II. Component-First Architecture

Every UI feature MUST be implemented as a reusable React component with a single, well-defined responsibility. Components MUST be organized in a logical hierarchy within `app/` or a dedicated `components/` directory. Shared components MUST be extracted to avoid duplication. Server Components are preferred by default; Client Components MUST be explicitly marked with `"use client"` directive only when client-side interactivity is required.

**Rationale**: Component-first design enables code reuse, easier maintenance, and better separation of concerns. Proper Server/Client Component usage optimizes bundle size and improves performance.

### III. User Experience Consistency (NON-NEGOTIABLE)

All UI elements MUST maintain consistent styling, spacing, and interaction patterns across the application. Tailwind CSS classes MUST be used for styling with a consistent design system. Dark mode support MUST be implemented where applicable using Tailwind's dark mode utilities. Responsive design MUST be implemented for all components using Tailwind's responsive breakpoints. Accessibility standards (WCAG 2.1 Level AA) MUST be followed, including proper semantic HTML, ARIA labels, and keyboard navigation.

**Rationale**: Consistent UX builds user trust and reduces cognitive load. Accessibility ensures the application is usable by all users, which is both an ethical requirement and often a legal one.

### IV. Performance Requirements

Pages MUST achieve a Lighthouse performance score of 90+ in production builds. Images MUST use Next.js Image component with proper optimization (width, height, and alt attributes). Code splitting MUST be implemented using dynamic imports for large components or features. Bundle size MUST be monitored, with client-side JavaScript kept under 200KB (parsed) for initial page load. Performance-critical operations MUST be profiled and optimized to maintain responsive user interactions (<100ms response time for user actions).

**Rationale**: Performance directly impacts user satisfaction, SEO rankings, and conversion rates. Next.js provides excellent optimization tools that must be leveraged properly.

## Technical Standards

### Stack Requirements

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript 5+ with strict mode enabled
- **Styling**: Tailwind CSS 4+ with PostCSS
- **Package Manager**: npm, pnpm, yarn, or bun (as specified in project setup)
- **Runtime**: Node.js 20+

### Code Organization

- **App Directory**: Primary routing and page components live in `app/`
- **Components**: Reusable components organized by feature or shared status
- **Utilities**: Helper functions and utilities in dedicated module
- **Types**: Shared TypeScript types and interfaces centralized
- **Assets**: Static assets in `public/` directory with optimized formats

### Code Style

- Follow ESLint configuration (`eslint-config-next`)
- Use functional components with hooks (no class components)
- Prefer named exports for components to improve refactoring
- Use descriptive variable and function names
- Keep files under 300 lines; extract when exceeding
- Document complex logic with inline comments

## Development Workflow

### Feature Implementation Process

1. **Specification**: Define feature requirements in `specs/[###-feature-name]/spec.md`
2. **Planning**: Generate implementation plan in `specs/[###-feature-name]/plan.md`
3. **Constitution Check**: Verify compliance with all four core principles
4. **Implementation**: Build feature following plan and principles
5. **Verification**: Validate performance, accessibility, and UX consistency
6. **Documentation**: Update relevant docs and component documentation

### Quality Gates

Before considering any feature complete, the following MUST be verified:

- ✅ **Type Safety**: No TypeScript errors, strict mode passes
- ✅ **Component Architecture**: Components are properly decomposed and reusable
- ✅ **UX Consistency**: Styling matches design system, dark mode works, responsive behavior verified
- ✅ **Performance**: Lighthouse score 90+, bundle size within limits, Image optimization verified
- ✅ **Accessibility**: Keyboard navigation works, semantic HTML used, ARIA labels present

### Complexity Justification

Any violation of core principles MUST be documented in the implementation plan with:
- What principle is being violated
- Why the violation is necessary
- What simpler alternative was considered and why it was rejected
- Migration path to compliance (if temporary violation)

## Governance

This constitution supersedes all other development practices and guidelines. Changes to core principles require:

1. Documentation of the proposed change and rationale
2. Analysis of impact on existing codebase
3. Update of affected templates and documentation
4. Version increment following semantic versioning rules

All feature implementations MUST verify compliance with this constitution. Complexity and principle violations MUST be justified and documented. Refer to `.specify/templates/agent-file-template.md` for runtime development guidance as the project evolves.

**Version**: 1.0.0 | **Ratified**: 2025-10-27 | **Last Amended**: 2025-10-27
