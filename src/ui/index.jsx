/* Fixer for Android — UI kit. Every screen is built from these. */
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useGoBack } from "../core/nav";
import { setSystemBars } from "../core/native";
import { MdArrowBack, MdChevronRight, MdErrorOutline, MdArrowDropDown, MdInfoOutline, MdCheckCircleOutline, MdWarningAmber, MdSearch, MdRadioButtonChecked, MdRadioButtonUnchecked } from "react-icons/md";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ── App bar ───────────────────────────────────────────────────── */
export function AppBar({ title, subtitle, back, actions, variant, logo }) {
  const navigate = useNavigate();
  const goBackSafely = useGoBack();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goBack = () => (typeof back === "string" ? navigate(back) : goBackSafely());

  // Status-bar icons: light over the navy brand header, theme-coloured elsewhere.
  useEffect(() => {
    setSystemBars({ onDark: variant === "brand" });
  }, [variant]);

  return (
    <header className={cx("appbar", back && "appbar--back", variant === "brand" && "appbar--brand", scrolled && "is-scrolled")}>
      {back && <IconButton icon={<MdArrowBack />} label="Back" onClick={goBack} />}
      <div className="appbar__title">
        {logo ? (
          <span className="appbar__logo" aria-label="Fixer">
            <b>fix</b>er
          </span>
        ) : (
          <h1>{title}</h1>
        )}
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="appbar__actions">{actions}</div>}
    </header>
  );
}

/* ── Screen ────────────────────────────────────────────────────── */
export function Screen({ appBar, children, fab, flush, className }) {
  return (
    <div className={cx("screen", className)}>
      {appBar}
      <main className={cx("screen__body", flush && "screen__body--flush")}>{children}</main>
      {fab}
    </div>
  );
}

/* ── Bottom navigation ─────────────────────────────────────────── */
export function BottomNav({ items }) {
  return (
    <nav className="navbar" aria-label="Main">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cx("navbar__item", isActive && "active")}>
          {({ isActive }) => (
            <>
              <span className="navbar__pill">
                {isActive && item.activeIcon ? item.activeIcon : item.icon}
                {item.badge > 0 && <span className="badge">{item.badge > 99 ? "99+" : item.badge}</span>}
              </span>
              <span className="navbar__label">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/* ── Buttons ───────────────────────────────────────────────────── */
export function Button({ variant = "filled", icon, loading, block, size, to, children, className, ...rest }) {
  const classes = cx("btn", `btn--${variant}`, icon && "btn--icon", block && "btn--block", size === "lg" && "btn--lg", className);
  const content = (
    <>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon}
      {children}
    </>
  );
  if (to) {
    return (
      <Link className={classes} to={to} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} disabled={loading || rest.disabled} {...rest}>
      {content}
    </button>
  );
}

export function IconButton({ icon, label, badge, tonal, className, ...rest }) {
  return (
    <button type="button" className={cx("icon-btn", tonal && "icon-btn--tonal", className)} aria-label={label} title={label} {...rest}>
      {icon}
      {badge > 0 && <span className="badge">{badge > 99 ? "99+" : badge}</span>}
    </button>
  );
}

export function Fab({ icon, label, to, onClick, extended = true }) {
  const classes = cx("fab", extended && label && "fab--extended");
  const content = (
    <>
      {icon}
      {extended && label && <span>{label}</span>}
    </>
  );
  return to ? (
    <Link className={classes} to={to} aria-label={label}>
      {content}
    </Link>
  ) : (
    <button type="button" className={classes} onClick={onClick} aria-label={label}>
      {content}
    </button>
  );
}

/* ── Cards, sections, lists ────────────────────────────────────── */
export function Card({ variant = "filled", to, onClick, className, children, ...rest }) {
  const classes = cx("card", `card--${variant}`, (to || onClick) && "card--press", className);
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} style={{ width: "100%", textAlign: "left", border: 0, font: "inherit" }} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export function Section({ title, action, children }) {
  return (
    <section className="section">
      {(title || action) && (
        <div className="section__head">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function List({ plain, children, className }) {
  return <div className={cx("list", plain && "list--plain", className)}>{children}</div>;
}

export function ListItem({ icon, leadTone, avatar, over, title, text, trailing, to, onClick, chevron, href, ...rest }) {
  const body = (
    <>
      {avatar || (icon && <span className={cx("li__lead", leadTone && `li__lead--${leadTone}`)}>{icon}</span>)}
      <span className="li__main">
        {over && <span className="li__over">{over}</span>}
        <span className="li__title">{title}</span>
        {text && <span className="li__text">{text}</span>}
      </span>
      {(trailing || chevron || to) && (
        <span className="li__trail">
          {trailing}
          {(chevron ?? Boolean(to)) && <MdChevronRight aria-hidden="true" />}
        </span>
      )}
    </>
  );
  if (to) {
    return (
      <Link to={to} className="li" {...rest}>
        {body}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className="li" {...rest}>
        {body}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" className="li" onClick={onClick} {...rest}>
        {body}
      </button>
    );
  }
  return (
    <div className="li" {...rest}>
      {body}
    </div>
  );
}

export function Pill({ tone, icon, children }) {
  return (
    <span className={cx("pill", tone && `pill--${tone}`)}>
      {icon}
      {children}
    </span>
  );
}

export function Avatar({ name = "", size }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
  return (
    <span className={cx("avatar", size === "lg" && "avatar--lg")} aria-hidden="true">
      {initials || "?"}
    </span>
  );
}

export function StatTile({ icon, value, label, to, tone }) {
  const body = (
    <>
      <span className="stat__icon">{icon}</span>
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </>
  );
  return to ? (
    <Link to={to} className={cx("stat", tone && `stat--${tone}`)}>
      {body}
    </Link>
  ) : (
    <div className={cx("stat", tone && `stat--${tone}`)}>{body}</div>
  );
}

/* ── Chips, segmented, tabs ────────────────────────────────────── */
export function Chip({ selected, icon, children, ...rest }) {
  return (
    <button type="button" className={cx("chip", selected && "is-selected")} aria-pressed={selected} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === o.value}
          key={o.value}
          className={cx(value === o.value && "is-selected")}
          onClick={() => onChange(o.value)}>
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs({ value, onChange, tabs }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button type="button" role="tab" key={t.value} aria-selected={value === t.value} className={cx(value === t.value && "is-selected")} onClick={() => onChange(t.value)}>
          {t.label}
          {t.count > 0 ? ` (${t.count})` : ""}
        </button>
      ))}
    </div>
  );
}

/* ── Fields ────────────────────────────────────────────────────── */
export function TextField({ label, multiline, supporting, error, trailing, className, ...rest }) {
  const id = useId();
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className={cx("field", error && "field--error", className)}>
      <div className="field__box">
        <Tag id={id} className="field__input" placeholder=" " aria-invalid={Boolean(error)} aria-describedby={supporting || error ? `${id}-s` : undefined} {...rest} />
        <label htmlFor={id} className="field__label">
          {label}
        </label>
        {trailing && <span className="field__trail">{trailing}</span>}
      </div>
      {(error || supporting) && (
        <span id={`${id}-s`} className="field__support">
          {error || supporting}
        </span>
      )}
    </div>
  );
}

export function SelectField({ label, options, placeholder, supporting, error, ...rest }) {
  const id = useId();
  return (
    <div className={cx("field", "field--select", error && "field--error")}>
      <div className="field__box">
        <select id={id} className="field__input" {...rest}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label htmlFor={id} className="field__label">
          {label}
        </label>
        <MdArrowDropDown className="field__chevron" aria-hidden="true" />
      </div>
      {(error || supporting) && <span className="field__support">{error || supporting}</span>}
    </div>
  );
}

/**
 * A field that opens a bottom sheet to choose from a list — Android's
 * way of picking from more than a handful of options. Options:
 * { value, label, meta?, group? }. `searchable` adds a filter box.
 */
export function PickerField({ label, value, options, onChange, placeholder = "Choose", supporting, error, searchable, sheetTitle, disabled }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((o) => String(o.value) === String(value));

  const q = query.trim().toLowerCase();
  const visible = q ? options.filter((o) => `${o.label} ${o.group || ""}`.toLowerCase().includes(q)) : options;
  const groups = [];
  for (const o of visible) {
    const g = o.group || "";
    const bucket = groups.find((x) => x.name === g) || (groups.push({ name: g, items: [] }), groups[groups.length - 1]);
    bucket.items.push(o);
  }

  const choose = (o) => {
    onChange(o.value);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className={cx("field", "field--select", error && "field--error")}>
      <div className="field__box">
        <button
          id={id}
          type="button"
          className={cx("field__input", "picker__btn", !selected && "picker__btn--empty")}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen(true)}>
          {selected ? selected.label : placeholder}
        </button>
        <label htmlFor={id} className="field__label">
          {label}
        </label>
        <MdArrowDropDown className="field__chevron" aria-hidden="true" />
      </div>
      {(error || supporting) && <span className="field__support">{error || supporting}</span>}

      <Sheet open={open} onClose={() => setOpen(false)} title={sheetTitle || label}>
        {searchable && (
          <TextField label="Search" value={query} onChange={(e) => setQuery(e.target.value)} trailing={<MdSearch className="picker__search-icon" />} autoFocus />
        )}
        {visible.length === 0 ? (
          <p className="muted">Nothing matches "{query}".</p>
        ) : (
          groups.map((g) => (
            <div key={g.name || "all"} className="picker__group" role="radiogroup" aria-label={g.name || label}>
              {g.name && <h3 className="picker__group-title">{g.name}</h3>}
              {g.items.map((o) => {
                const on = String(o.value) === String(value);
                return (
                  <button key={o.value} type="button" role="radio" aria-checked={on} className={cx("picker__option", on && "is-on")} onClick={() => choose(o)}>
                    {on ? <MdRadioButtonChecked className="picker__radio" /> : <MdRadioButtonUnchecked className="picker__radio" />}
                    <span className="picker__label">{o.label}</span>
                    {o.meta && <span className="picker__meta">{o.meta}</span>}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </Sheet>
    </div>
  );
}

export function Checkbox({ label, ...rest }) {
  return (
    <label className="check">
      <input type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
}

/* ── Feedback ──────────────────────────────────────────────────── */
export function Notice({ tone, children, icon }) {
  const icons = { error: <MdErrorOutline />, ok: <MdCheckCircleOutline />, warn: <MdWarningAmber /> };
  return (
    <div className={cx("notice", tone && `notice--${tone}`)} role={tone === "error" ? "alert" : "status"}>
      {icon || icons[tone] || <MdInfoOutline />}
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="state">
      {icon && <span className="state__icon">{icon}</span>}
      {title && <h3>{title}</h3>}
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Loading({ label = "Loading…" }) {
  return (
    <div className="state" role="status">
      <span className="spinner spinner--lg" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="stack" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 72 }} />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <EmptyState icon={<MdErrorOutline />} title="Something went wrong" action={onRetry && <Button variant="tonal" onClick={onRetry}>Try again</Button>}>
      {message}
    </EmptyState>
  );
}

/* ── Sheets & dialogs ──────────────────────────────────────────── */
function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

// Lets the Android back button close the top-most sheet/dialog first.
export const overlayStack = [];

function useOverlay(open, onClose) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const entry = () => ref.current?.();
    overlayStack.push(entry);
    return () => {
      const i = overlayStack.lastIndexOf(entry);
      if (i >= 0) overlayStack.splice(i, 1);
    };
  }, [open]);
}

export function Sheet({ open, onClose, title, subtitle, children }) {
  useEscape(open, onClose);
  useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__handle" aria-hidden="true" />
        {title && <h2 className="sheet__title">{title}</h2>}
        {subtitle && <p className="sheet__sub">{subtitle}</p>}
        <div className="sheet__body">{children}</div>
      </div>
    </>,
    document.body,
  );
}

export function Dialog({ open, onClose, title, children, actions }) {
  useEscape(open, onClose);
  useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        <div>{children}</div>
        <div className="btn-row btn-row--end">{actions}</div>
      </div>
    </>,
    document.body,
  );
}

/** Promise-based confirm: const ok = await confirm({ title, body, confirm }) */
const ConfirmContext = createContext(null);
const SnackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null);
  const [snack, setSnack] = useState(null);
  const timer = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setConfirmState({ ...opts, resolve });
      }),
    [],
  );

  const close = (value) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  const showSnack = useCallback((message, action) => {
    clearTimeout(timer.current);
    setSnack({ message, action, key: Date.now() });
    timer.current = setTimeout(() => setSnack(null), 4000);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      <SnackContext.Provider value={showSnack}>
        {children}
        <Dialog
          open={Boolean(confirmState)}
          onClose={() => close(false)}
          title={confirmState?.title}
          actions={
            <>
              <Button variant="text" onClick={() => close(false)}>
                {confirmState?.cancel || "Cancel"}
              </Button>
              <Button variant="text" onClick={() => close(true)} style={confirmState?.danger ? { color: "var(--error)" } : undefined}>
                {confirmState?.confirm || "OK"}
              </Button>
            </>
          }>
          {confirmState?.body && <p>{confirmState.body}</p>}
        </Dialog>
        {snack &&
          createPortal(
            <div key={snack.key} className={cx("snackbar", document.querySelector(".navbar") && "snackbar--above-nav")} role="status">
              <span>{snack.message}</span>
              {snack.action && (
                <button
                  type="button"
                  onClick={() => {
                    snack.action.onClick();
                    setSnack(null);
                  }}>
                  {snack.action.label}
                </button>
              )}
            </div>,
            document.body,
          )}
      </SnackContext.Provider>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext) || (async () => window.confirm("Are you sure?"));
export const useSnack = () => useContext(SnackContext) || (() => {});

/* ── Data loading ──────────────────────────────────────────────── */
/** Runs an async loader; returns { data, error, loading, reload, setData }. */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true });
  const run = useRef(0);

  const reload = useCallback(async () => {
    const id = ++run.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loader();
      if (id === run.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === run.current) setState((s) => ({ ...s, error, loading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === "function" ? updater(s.data) : updater })), []);

  return { ...state, reload, setData };
}

/** Pull-to-refresh-free "refresh when you come back to the app". */
export function useRefreshOnFocus(reload) {
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);
}
