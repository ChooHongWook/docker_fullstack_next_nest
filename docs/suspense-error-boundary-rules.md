# React Query + Suspense / ErrorBoundary Usage Rules

This document defines **mandatory rules** for using Suspense and ErrorBoundary
in a Next.js (App Router) project using TanStack React Query.

These rules MUST be followed exactly.

---

## 1. Mandatory Rules

### 1.1 Required Boundary Structure

Any component that fetches **required data on initial page load** MUST be wrapped as follows:

ErrorBoundary (outer)
└─ Suspense (inner)
└─ Data-fetching Component

- Error handling MUST be delegated to `ErrorBoundary`
- Loading state MUST be delegated to `Suspense`

---

### 1.2 Required Data Fetching API

- Components rendered inside `Suspense` MUST use:
  - `useSuspenseQuery`
- `useQuery` is NOT allowed inside Suspense boundaries

---

### 1.3 Component Responsibility

- Data-fetching components MUST assume data is always available
- No loading or error branching logic is allowed inside these components

---

## 2. Prohibited Rules

### 2.1 Suspense Usage is STRICTLY FORBIDDEN in the following cases

- User-triggered actions (`onClick`, `onSubmit`)
- Mutations (`useMutation`)
- Refetching caused by interaction
- Form input, typing-related UI
- Optional or non-blocking data

---

### 2.2 Forbidden Patterns

- ❌ Using `isLoading`, `isError`, or `status` inside Suspense-wrapped components
- ❌ Wrapping presentational (pure UI) components with Suspense or ErrorBoundary
- ❌ Nesting Suspense or ErrorBoundary without a clear UI semantic boundary
- ❌ Using Suspense as a replacement for button-level or field-level loading indicators

---

## 3. Allowed & Recommended Examples (예시)

### 3.1 Correct Usage (Page Entry Data)

```tsx
<ErrorBoundary fallback={<ErrorView />}>
  <Suspense fallback={<UserListSkeleton />}>
    <UserList />
  </Suspense>
</ErrorBoundary>
```

```tsx
function UserList() {
  const { data } = useSuspenseQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  return <List users={data} />;
}
```

3.2 Correct Boundary Placement (Semantic UI Unit)

```tsx
<PageLayout>
  <Header />

  <ErrorBoundary fallback={<ErrorSection />}>
    <Suspense fallback={<FeedSkeleton />}>
      <Feed />
    </Suspense>
  </ErrorBoundary>

  <Footer />
</PageLayout>
```

3.3 Forbidden Usage Examples
❌ Suspense for User Interaction

```tsx
function SaveButton() {
  // ❌ NEVER do this
  const { data } = useSuspenseQuery(...);
}
```

❌ Loading State Inside Suspense

```tsx
function Product() {
  // ❌ Forbidden
  const { isLoading, data } = useSuspenseQuery(...);

  if (isLoading) {
    return <Spinner />;
  }

  return <View data={data} />;
}
```

❌ Boundary on Presentational Component

```tsx
// ❌ Pure UI components must NOT have boundaries
<Suspense>
  <Button />
</Suspense>
```

4. Decision Checklist (Self-Validation)
   Before adding Suspense, ALL answers must be YES:

- Is this data required for initial page render?
- Does the UI have no meaningful state without this data?
- Is this NOT triggered by user interaction?
- Is this a page-level or section-level component?

If any answer is NO → DO NOT use Suspense

5. Final Principles

- Suspense is an architectural decision, not a convenience feature
- Error handling and loading states MUST be externalized
- Boundaries exist to protect UX, not to simplify code locally

Failure to follow these rules will result in:

- Broken UX
- Unpredictable loading behavior
- Hard-to-debug rendering issues
