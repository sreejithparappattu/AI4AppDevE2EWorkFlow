import { useEffect, useMemo, useState } from 'react';

const categories = {
  income: ['Salary', 'Freelance', 'Bonus', 'Investment', 'Other'],
  expense: [
    'Housing',
    'Food',
    'Transportation',
    'Utilities',
    'Health',
    'Entertainment',
    'Education',
    'Shopping',
    'Travel',
    'Other',
  ],
};

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'The request could not be completed.');
  }
  return payload;
}

function currency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function AuthPanel({ onAuthenticated, setError }) {
  const [mode, setMode] = useState('register');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      email: String(form.get('email')).trim(),
      password: String(form.get('password')),
    };
    if (mode === 'register') {
      payload.name = String(form.get('name')).trim();
    }

    try {
      const result = await request(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      formElement.reset();
      await onAuthenticated(result.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel auth-panel">
      <div className="auth-header">
        <h2>{mode === 'register' ? 'Start with a clear picture' : 'Welcome back'}</h2>
        <p>Track income, expenses, and savings goals in one place.</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h3>{mode === 'register' ? 'Create your account' : 'Sign in'}</h3>
        {mode === 'register' && (
          <label>
            Full name
            <input name="name" autoComplete="name" maxLength="100" placeholder="Alex Morgan" required />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" autoComplete="email" maxLength="254" placeholder="you@example.com" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            minLength="8"
            maxLength="72"
            placeholder="At least 8 characters"
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
        </button>
        <p className="auth-switch">
          {mode === 'register' ? 'Already have an account?' : 'New to Budget Pro?'}{' '}
          <button className="text-button" type="button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>
            {mode === 'register' ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </form>
    </section>
  );
}

function TransactionForm({ onSaved, setError }) {
  const [type, setType] = useState('expense');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await request('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type,
          category: String(form.get('category')),
          description: String(form.get('description')).trim(),
          amount: Number(form.get('amount')),
          date: String(form.get('date')),
        }),
      });
      formElement.reset();
      setType('expense');
      onSaved();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <h3>Add transaction</h3>
      </div>
      <form className="transaction-form" onSubmit={handleSubmit}>
        <label>
          Type
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label>
          Category
          <select name="category" key={type} required>
            {categories[type].map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label>
          Description
          <input name="description" maxLength="200" placeholder="Groceries, salary, rent…" required />
        </label>
        <label>
          Amount
          <input name="amount" type="number" min="0.01" max="9999999999.99" step="0.01" required />
        </label>
        <label>
          Date
          <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save transaction'}</button>
      </form>
    </section>
  );
}

function Dashboard({ user, transactions, refresh, onLogout, setError }) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.date.startsWith(monthKey)),
    [transactions, monthKey],
  );
  const summary = useMemo(() => monthTransactions.reduce(
    (totals, transaction) => {
      totals[transaction.type] += Number(transaction.amount);
      return totals;
    },
    { income: 0, expense: 0 },
  ), [monthTransactions]);
  const categoryTotals = useMemo(() => {
    const totals = {};
    monthTransactions.forEach((transaction) => {
      if (transaction.type === 'expense') {
        totals[transaction.category] = (totals[transaction.category] || 0) + Number(transaction.amount);
      }
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [monthTransactions]);
  const maxCategoryTotal = Math.max(0, ...categoryTotals.map(([, amount]) => amount));

  return (
    <>
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Welcome back, {user.name}</h2>
        </div>
        <div className="dashboard-actions">
          <span className="summary-pill">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now)}</span>
          <button type="button" className="secondary-button" onClick={onLogout}>Log out</button>
        </div>
      </div>

      <div className="summary-grid">
        <article className="metric-card balance"><span>Net balance</span><strong>{currency(summary.income - summary.expense)}</strong></article>
        <article className="metric-card income"><span>Total income</span><strong>{currency(summary.income)}</strong></article>
        <article className="metric-card expense"><span>Total expenses</span><strong>{currency(summary.expense)}</strong></article>
        <article className="metric-card savings"><span>Savings</span><strong>{currency(summary.income - summary.expense)}</strong></article>
      </div>

      <div className="content-grid">
        <TransactionForm onSaved={refresh} setError={setError} />
        <section className="panel">
          <div className="section-header"><h3>Recent activity</h3></div>
          {transactions.length === 0 ? (
            <p className="transaction-meta">No transactions yet. Add your first income or expense.</p>
          ) : (
            <ul className="transaction-list">
              {transactions.slice(0, 8).map((transaction) => (
                <li className={`transaction-item ${transaction.type}`} key={transaction.id}>
                  <div className="transaction-main">
                    <strong>{transaction.description}</strong>
                    <span className="transaction-meta">
                      {transaction.category} · {new Date(`${transaction.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <span className={`amount-pill ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '−'}{currency(Number(transaction.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel report-panel">
          <div className="section-header"><h3>Spending by category</h3></div>
          {categoryTotals.length === 0 ? (
            <p className="transaction-meta">Track expenses to see your category breakdown.</p>
          ) : (
            <div className="breakdown-list">
              {categoryTotals.map(([category, amount]) => (
                <div className="breakdown-row" key={category}>
                  <div className="breakdown-label"><span>{category}</span><strong>{currency(amount)}</strong></div>
                  <div className="breakdown-bar">
                    <div className="breakdown-fill" style={{ width: `${(amount / maxCategoryTotal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTransactions() {
    const result = await request('/transactions');
    setTransactions(result.transactions);
  }

  useEffect(() => {
    let mounted = true;
    request('/auth/me')
      .then(async ({ user: activeUser }) => {
        if (!mounted) return;
        setUser(activeUser);
        const result = await request('/transactions');
        if (mounted) setTransactions(result.transactions);
      })
      .catch((requestError) => {
        if (mounted && !requestError.message.includes('sign in') && !requestError.message.includes('session')) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  async function authenticated(activeUser) {
    setUser(activeUser);
    setError('');
    await loadTransactions();
  }

  async function logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
      setUser(null);
      setTransactions([]);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function refresh() {
    try {
      await loadTransactions();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Money management</p>
          <h1>Budget Pro</h1>
        </div>
      </header>
      <main>
        {error && <div className="error-banner" role="alert">{error}</div>}
        {loading ? (
          <section className="panel loading-panel" aria-live="polite">Loading your budget…</section>
        ) : user ? (
          <Dashboard user={user} transactions={transactions} refresh={refresh} onLogout={logout} setError={setError} />
        ) : (
          <AuthPanel onAuthenticated={authenticated} setError={setError} />
        )}
      </main>
    </div>
  );
}
