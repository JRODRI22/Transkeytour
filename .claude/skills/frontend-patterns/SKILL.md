---
name: frontend-patterns
description: "Comprehensive React and frontend patterns for building maintainable, performant applications. Covers component composition, custom hooks, state management, performance optimization, form handling, error boundaries, animations, and accessibility. Use when building or refactoring React components, implementing complex UI patterns, or reviewing frontend code quality."
---

# Frontend Patterns — React & Modern Frontend

Battle-tested patterns for building production-grade React applications. Use these patterns when building components, managing state, handling forms, optimizing performance, or implementing animations.

## When to Apply

- Building new React components or pages
- Refactoring existing components for better maintainability
- Implementing complex UI interactions (drag, resize, infinite scroll)
- Reviewing frontend code for quality and best practices
- Debugging performance issues (re-renders, layout shifts, slow lists)

---

## 1. Component Composition Patterns

### Compound Components

Use when building related components that share implicit state (Tabs, Accordion, Select).

```jsx
// Compound component pattern — parent manages state, children consume via context
const TabsContext = createContext(null);

function Tabs({ defaultValue, children }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div role="tablist">{children}</div>
    </TabsContext.Provider>
  );
}

function TabTrigger({ value, children }) {
  const { active, setActive } = useContext(TabsContext);
  return (
    <button role="tab" aria-selected={active === value}
      onClick={() => setActive(value)}
      className={active === value ? 'tab-active' : 'tab-inactive'}>
      {children}
    </button>
  );
}

function TabContent({ value, children }) {
  const { active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div role="tabpanel">{children}</div>;
}

// Usage — clean, declarative API
<Tabs defaultValue="overview">
  <TabTrigger value="overview">Overview</TabTrigger>
  <TabTrigger value="details">Details</TabTrigger>
  <TabContent value="overview">Overview content</TabContent>
  <TabContent value="details">Details content</TabContent>
</Tabs>
```

### Render Props (when composition isn't enough)

Use when the parent needs to control how children render dynamically.

```jsx
function DataLoader({ url, render }) {
  const { data, loading, error } = useFetch(url);
  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  return render(data);
}

// Usage
<DataLoader url="/api/users" render={(users) => (
  <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
)} />
```

### Slot Pattern (flexible layouts)

```jsx
function Card({ header, body, footer, className }) {
  return (
    <div className={`card ${className}`}>
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{body}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
```

---

## 2. Custom Hooks

### useToggle

```jsx
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  return [value, { toggle, setTrue, setFalse }];
}

// Usage
const [isOpen, { toggle, setFalse }] = useToggle();
```

### useDebounce

```jsx
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Usage — search input
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);
useEffect(() => { search(debouncedQuery); }, [debouncedQuery]);
```

### useLocalStorage

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* quota exceeded — fail silently */ }
  }, [key, value]);

  return [value, setValue];
}
```

### useMediaQuery

```jsx
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

// Usage
const isMobile = useMediaQuery('(max-width: 768px)');
```

---

## 3. State Management Patterns

### Context + useReducer (shared state without external libraries)

```jsx
const initialState = { items: [], loading: false, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START': return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS': return { ...state, loading: false, items: action.payload };
    case 'FETCH_ERROR': return { ...state, loading: false, error: action.payload };
    case 'ADD_ITEM': return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_ITEM': return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    default: return state;
  }
}

const ItemsContext = createContext(null);

function ItemsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <ItemsContext.Provider value={{ state, dispatch }}>
      {children}
    </ItemsContext.Provider>
  );
}

function useItems() {
  const context = useContext(ItemsContext);
  if (!context) throw new Error('useItems must be used within ItemsProvider');
  return context;
}
```

### When to use what

| Scenario | Tool |
|----------|------|
| Local component state (toggle, input) | `useState` |
| Complex state with multiple actions | `useReducer` |
| Shared state across 2-3 components | Lift state up + props |
| Shared state across many components | Context + useReducer |
| Server state (fetching, caching, sync) | TanStack Query or SWR |
| Global app state (auth, theme, preferences) | Context at app root |

---

## 4. Performance Patterns

### Memoization (use sparingly — profile first)

```jsx
// React.memo — prevent re-renders when props haven't changed
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
});

// useMemo — expensive computation
const sorted = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// useCallback — stable function reference for child components
const handleDelete = useCallback((id) => {
  dispatch({ type: 'REMOVE_ITEM', payload: id });
}, [dispatch]);
```

**Rule:** Don't memoize everything. Profile first. Memoize only when:
- A component re-renders frequently with the same props
- A computation is measurably expensive (> 1ms)
- A function reference causes unnecessary child re-renders

### Code Splitting

```jsx
// Route-level splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/settings" element={<SettingsPage />} />
  </Routes>
</Suspense>
```

### Virtualized Lists (50+ items)

```jsx
// Use react-window or @tanstack/react-virtual for long lists
import { FixedSizeList } from 'react-window';

<FixedSizeList height={600} width="100%" itemCount={items.length} itemSize={72}>
  {({ index, style }) => (
    <div style={style}><ItemRow item={items[index]} /></div>
  )}
</FixedSizeList>
```

---

## 5. Form Handling

### Controlled form with validation (react-hook-form)

```jsx
import { useForm } from 'react-hook-form';

function ContactForm({ onSubmit }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
          })}
          aria-invalid={errors.email ? 'true' : 'false'}
        />
        {errors.email && <p role="alert" className="error">{errors.email.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

## 6. Error Boundaries

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div role="alert" className="error-boundary">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Usage — wrap at route or feature level, not around everything
<ErrorBoundary fallback={<PageError />}>
  <DashboardPage />
</ErrorBoundary>
```

---

## 7. Animation Patterns

### CSS Transitions (simple hover/focus)

```css
.button {
  transition: background-color 200ms ease-out, transform 150ms ease-out;
}
.button:hover { background-color: var(--primary-hover); }
.button:active { transform: scale(0.97); }
```

### Framer Motion (complex enter/exit/layout)

```jsx
import { motion, AnimatePresence } from 'framer-motion';

// Fade in on mount
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}>
  {content}
</motion.div>

// List with stagger
<motion.ul>
  {items.map((item, i) => (
    <motion.li key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05 }}
    />
  ))}
</motion.ul>

// AnimatePresence for exit animations
<AnimatePresence>
  {isOpen && (
    <motion.div key="modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    />
  )}
</AnimatePresence>
```

### Reduced Motion

```jsx
// Always respect user preference
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

<motion.div
  animate={{ opacity: 1, y: prefersReducedMotion ? 0 : 20 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
/>
```

---

## 8. Accessibility Patterns

### Focus Management

```jsx
// Auto-focus first input in modal
function Modal({ isOpen, onClose, children }) {
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) firstInputRef.current?.focus();
  }, [isOpen]);

  // Trap focus inside modal
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;
  return (
    <div role="dialog" aria-modal="true" onKeyDown={handleKeyDown}>
      <input ref={firstInputRef} />
      {children}
    </div>
  );
}
```

### Keyboard Navigation

```jsx
// Arrow key navigation for lists/menus
function useArrowNavigation(items) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActiveIndex(i => Math.min(i + 1, items.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); break;
      case 'Home': e.preventDefault(); setActiveIndex(0); break;
      case 'End': e.preventDefault(); setActiveIndex(items.length - 1); break;
    }
  };

  return { activeIndex, handleKeyDown };
}
```

### Screen Reader Announcements

```jsx
// Live region for dynamic updates
function LiveAnnouncer({ message }) {
  return (
    <div aria-live="polite" aria-atomic="true"
      className="sr-only" /* visually hidden but announced */
    >
      {message}
    </div>
  );
}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Do Instead |
|---|---|---|
| Prop drilling > 2 levels | Hard to maintain, trace, refactor | Context or composition |
| `useEffect` for derived state | Unnecessary re-renders, stale data | `useMemo` or compute inline |
| Index as key in dynamic lists | Broken animations, stale data on reorder | Use stable unique ID |
| Mutating state directly | React won't detect changes | Spread operator or `structuredClone` |
| Fetching in `useEffect` without cleanup | Race conditions, memory leaks | AbortController or TanStack Query |
| `!loading && !error && data` patterns | Impossible states | Discriminated union: `{ status: 'success', data }` |
| Giant components (300+ lines) | Untestable, unreadable | Extract hooks and sub-components |
| CSS-in-JS runtime overhead | Performance cost on every render | Tailwind, CSS modules, or static extraction |
