import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen, List, StickyNote, Pin, Plus, Edit3, Trash2, Search,
  Download, Upload, Calendar, Check, X, ArrowLeft, FileText,
  AlertCircle, CheckCircle2, Palette, Paperclip, Eye, FileUp,
  ExternalLink, Wallet, Banknote, CreditCard, Utensils, ShoppingCart,
  Tag, Users, UserCheck, UserX, PlusCircle, TrendingDown, Coins,
  PiggyBank, Receipt, CheckSquare, ChevronLeft, ChevronRight,
  RotateCcw, Copy, ShieldCheck, ScrollText, Smartphone,
  Share2, ClipboardCheck, Star, Settings, Sun, Moon, RefreshCw,
  Cloud, Key, LogIn, LogOut, Link2, UserPlus, Sparkles
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';

const DB_NAME = 'DailyPulseDB';
const DB_VERSION = 1;
const DB_STORE = 'workspace_kv';

const DB_KEYS = {
  LOGS: 'dp_daily_entries_v3',
  NOTES: 'dp_sticky_notes_v3',
  ROUGH_NOTES: 'dp_rough_notes_v3',
  TODOS: 'dp_todos_v3',
  INFO_CARDS: 'dp_info_cards_v3',
  PERSONAL_WALLET: 'dp_personal_wallet_v3',
  PERSONAL_EXPENSES: 'dp_personal_expenses_v3',
  HOUSE_MEMBERS: 'dp_house_members_v3',
  HOUSE_EXPENSES: 'dp_house_expenses_v3',
  HOUSE_DEPOSITS: 'dp_house_deposits_v3',
  HOUSE_CATEGORIES: 'dp_house_categories_v3',
  HOUSE_RULES_TEXT: 'dp_house_rules_text_v3',
  TAB_ORDER: 'dp_tab_order_v3',
  TAB_LABELS: 'dp_tab_labels_v3',
  HEADER_META: 'dp_header_meta_v3',
  THEME: 'dp_theme_v3',
  FIREBASE_CFG: 'dp_firebase_cfg_v4',
  ROOM_KEY: 'dp_room_key_v4',
  ROOM_CAN_EDIT: 'dp_room_can_edit_v4',
  ALLOWED_USERS: 'dp_allowed_users_v5',
};

const ROOMMATE_SESSION_KEY = 'wa_roommate_active_key_v1';

// Sole Admin Account Email (only this account can ever be Admin)
const SOLE_ADMIN_EMAIL = 'waqasahmed5478437@gmail.com';

// Firebase project configuration injected via Vite env / GitHub Secrets
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wa-desk-6634c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wa-desk-6634c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'wa-desk-6634c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

const DEFAULT_TAB_ORDER = [
  'daily',
  'index',
  'rough',
  'sticky',
  'todo',
  'expenses',
  'house',
  'settings',
];

const TAB_CATALOG = {
  daily: { id: 'daily', label: 'Daily Log', icon: BookOpen },
  index: { id: 'index', label: 'Topic Index', icon: List },
  rough: { id: 'rough', label: 'Rough Notes', icon: ScrollText },
  sticky: { id: 'sticky', label: 'Sticky Notes', icon: StickyNote },
  todo: { id: 'todo', label: 'To-Do & Info', icon: CheckSquare },
  expenses: { id: 'expenses', label: 'My Expenses', icon: Wallet },
  house: { id: 'house', label: '8-Friends Mess', icon: Users },
  settings: { id: 'settings', label: 'Settings & Sync', icon: Settings },
};

const DEFAULT_HEADER_META = {
  title: 'WA Workspace',
  subtitle: 'Daily Operations & Ledger',
};

const MAX_PDF_BYTES = 25 * 1024 * 1024;
const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner'];
const DEFAULT_MESS_CATEGORIES = [
  'Vegetables',
  'Meat/Chicken',
  'Oil/Ghee',
  'Roti/Naan',
  'Spices',
  'Dairy',
  'Gas',
  'Custom',
];

const DEFAULT_HOUSE_RULES =
  '• Meals divide strictly among present members toggled at entry.\n• Groceries divide equally across all housemates.';

const NOTE_THEMES = {
  amber: {
    name: 'Amber',
    dark: 'bg-amber-500/15 border-amber-400/30 text-amber-50',
    light: 'bg-amber-500/15 border-amber-500/40 text-amber-950',
    dot: 'bg-amber-400',
  },
  emerald: {
    name: 'Emerald',
    dark: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-50',
    light: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950',
    dot: 'bg-emerald-400',
  },
  sky: {
    name: 'Sky',
    dark: 'bg-sky-500/15 border-sky-400/30 text-sky-50',
    light: 'bg-sky-500/15 border-sky-500/40 text-sky-950',
    dot: 'bg-sky-400',
  },
  rose: {
    name: 'Rose',
    dark: 'bg-rose-500/15 border-rose-400/30 text-rose-50',
    light: 'bg-rose-500/15 border-rose-500/40 text-rose-950',
    dot: 'bg-rose-400',
  },
  violet: {
    name: 'Violet',
    dark: 'bg-violet-500/15 border-violet-400/30 text-violet-50',
    light: 'bg-violet-500/15 border-violet-500/40 text-violet-950',
    dot: 'bg-violet-400',
  },
};

const PRIORITY_STYLES = {
  High: 'bg-rose-500/20 text-rose-500 border-rose-400/40',
  Medium: 'bg-amber-500/20 text-amber-500 border-amber-400/40',
  Low: 'bg-sky-500/20 text-sky-500 border-sky-400/40',
};

const ROUGH_TAGS = ['Rough Summary', 'Draft', 'Field Note', 'Meeting', 'General'];

const openDB = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const dbGet = async (key) => {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
};

const dbSet = async (key, value) => {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('IndexedDB write error:', err);
  }
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatMoney = (num) => {
  const val = Number(num) || 0;
  return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatPKR = (num) => {
  const val = Number(num) || 0;
  return `Rs. ${val.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const generateRandomRoomKey = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)];
    part2 += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ROOM-${part1}-${part2}`;
};

const parseFirebaseConfigInput = (raw) => {
  if (!raw || !raw.trim()) return null;
  let text = raw.trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  const jsonNormalized = text
    .replace(/([{,\s])([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
    .replace(/'/g, '"')
    .replace(/,\s*}/g, '}');
  const obj = JSON.parse(jsonNormalized);
  if (!obj.apiKey || !obj.projectId) {
    throw new Error('Missing apiKey or projectId');
  }
  return obj;
};

const WALogo = ({ theme, onClick }) => {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={onClick}
      title={isDark ? 'Switch to Light Glass Theme' : 'Switch to Dark Glass Theme'}
      aria-label="Toggle Dark and Light Theme"
      className={`group relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 cursor-pointer active:scale-95 ${
        isDark
          ? 'bg-gradient-to-br from-emerald-500/25 via-cyan-500/20 to-indigo-500/25 border border-white/20 shadow-lg shadow-emerald-950/30 hover:border-emerald-400/50 hover:shadow-emerald-500/20'
          : 'bg-gradient-to-br from-emerald-500/20 via-cyan-500/15 to-indigo-500/20 border border-slate-300/90 shadow-md shadow-slate-300/50 hover:border-emerald-500/60 hover:shadow-emerald-500/15'
      }`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="waLogoGrad" x1="2" y1="4" x2="34" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isDark ? '#34d399' : '#059669'} />
            <stop offset="100%" stopColor={isDark ? '#38bdf8' : '#0284c7'} />
          </linearGradient>
        </defs>
        <path
          d="M3.5 10.5L7.8 25.5L12.2 14.2L16.6 25.5L20.5 11.5"
          stroke="url(#waLogoGrad)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 25.5L26.2 10.5L31.5 25.5M22.8 21.2H29.7"
          stroke={isDark ? '#f8fafc' : '#0f172a'}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[8px] shadow-sm transition-colors ${
          isDark
            ? 'bg-slate-900 border-white/25 text-amber-300'
            : 'bg-white border-slate-300 text-indigo-600'
        }`}
      >
        {isDark ? <Sun className="w-2 h-2" /> : <Moon className="w-2 h-2" />}
      </span>
    </button>
  );
};

const getLongPollingDb = (cfg) => {
  const app = getApps().length ? getApps()[0] : initializeApp(cfg);
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
    });
  } catch {
    return getFirestore(app);
  }
};

export default function App() {
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const urlRoomKey = urlParams.get('room') || '';

  const [isStorageReady, setIsStorageReady] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [headerMeta, setHeaderMeta] = useState(DEFAULT_HEADER_META);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [tempHeaderTitle, setTempHeaderTitle] = useState('');
  const [tempHeaderSubtitle, setTempHeaderSubtitle] = useState('');

  const [tabOrder, setTabOrder] = useState(DEFAULT_TAB_ORDER);
  const [customTabLabels, setCustomTabLabels] = useState({});
  const [editingTabId, setEditingTabId] = useState(null);
  const [tempTabLabel, setTempTabLabel] = useState('');
  const [draggedTabId, setDraggedTabId] = useState(null);
  const [activeTab, setActiveTab] = useState('house');
  const [selectedEntryId, setSelectedEntryId] = useState(null);

  const [entries, setEntries] = useState([]);
  const [notes, setNotes] = useState([]);
  const [roughNotes, setRoughNotes] = useState([]);
  const [todos, setTodos] = useState([]);
  const [infoCards, setInfoCards] = useState([]);
  const [personalWallet, setPersonalWallet] = useState({ initialCash: 5000, initialAccount: 25000 });
  const [personalExpenses, setPersonalExpenses] = useState([]);
  const [houseMembers, setHouseMembers] = useState([]);
  const [houseExpenses, setHouseExpenses] = useState([]);
  const [houseDeposits, setHouseDeposits] = useState([]);
  const [messCategories, setMessCategories] = useState(DEFAULT_MESS_CATEGORIES);
  const [newMessCategoryInput, setNewMessCategoryInput] = useState('');
  const [houseRulesText, setHouseRulesText] = useState(DEFAULT_HOUSE_RULES);
  const [isEditingHouseRules, setIsEditingHouseRules] = useState(false);
  const [tempHouseRulesText, setTempHouseRulesText] = useState('');

  const [firebaseConfig, setFirebaseConfig] = useState(DEFAULT_FIREBASE_CONFIG);
  const [firebaseConfigText, setFirebaseConfigText] = useState('');
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [cloudUser, setCloudUser] = useState(null);
  const [cloudStatus, setCloudStatus] = useState('offline');
  const [roomKey, setRoomKey] = useState('ROOM-724Y-XBQN');
  const [roomCanEdit, setRoomCanEdit] = useState(false);
  const [roommateModeKey, setRoommateModeKey] = useState('');
  const [roomKeyLoginInput, setRoomKeyLoginInput] = useState('');
  const [showRoomLoginModal, setShowRoomLoginModal] = useState(false);
  const [roomKeyNotFound, setRoomKeyNotFound] = useState(false);

  const [allowedStandardUsers, setAllowedStandardUsers] = useState([]);
  const [newAllowedEmail, setNewAllowedEmail] = useState('');
  const [verifiedStandardUser, setVerifiedStandardUser] = useState(null);

  const isApplyingRemoteRef = useRef(false);
  const skipRemoteRoomKeyOnceRef = useRef(false);

  const isAdminAuthenticated = Boolean(
    cloudUser &&
      !cloudUser.isAnonymous &&
      cloudUser.emailVerified &&
      cloudUser.email?.toLowerCase() === SOLE_ADMIN_EMAIL.toLowerCase()
  );
  const isPublicOrRoommateLocked = !isAdminAuthenticated;
  const canEditHouseInRoomMode = isAdminAuthenticated;

  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  const [entryDate, setEntryDate] = useState(getTodayStr());
  const [entryTitle, setEntryTitle] = useState('');
  const [entryDetails, setEntryDetails] = useState('');
  const [entryAttachments, setEntryAttachments] = useState([]);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [previewPdf, setPreviewPdf] = useState(null);
  const pdfInputRef = useRef(null);

  const [roughTitle, setRoughTitle] = useState('');
  const [roughSummary, setRoughSummary] = useState('');
  const [roughDetails, setRoughDetails] = useState('');
  const [roughTag, setRoughTag] = useState('Rough Summary');
  const [editingRoughId, setEditingRoughId] = useState(null);
  const [roughFilter, setRoughFilter] = useState('All');

  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState('amber');
  const [noteIsPinned, setNoteIsPinned] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);

  const [todoText, setTodoText] = useState('');
  const [todoPriority, setTodoPriority] = useState('Medium');
  const [todoDueDate, setTodoDueDate] = useState('');
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editTodoText, setEditTodoText] = useState('');
  const [editTodoPriority, setEditTodoPriority] = useState('Medium');
  const [editTodoDueDate, setEditTodoDueDate] = useState('');
  const [todoFilter, setTodoFilter] = useState('all');

  const [infoTitle, setInfoTitle] = useState('');
  const [infoCategory, setInfoCategory] = useState('General');
  const [infoContent, setInfoContent] = useState('');
  const [editingInfoId, setEditingInfoId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [walletCashInput, setWalletCashInput] = useState('');
  const [walletAccountInput, setWalletAccountInput] = useState('');
  const [topUpSource, setTopUpSource] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState('');

  const [expDate, setExpDate] = useState(getTodayStr());
  const [expCategory, setExpCategory] = useState('Meal');
  const [expMeals, setExpMeals] = useState(['Dinner']);
  const [expDetail, setExpDetail] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expSource, setExpSource] = useState('Cash');
  const [editingExpId, setEditingExpId] = useState(null);

  // MessMate 8-Friends Mess state (fully editable)
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [memberNameInput, setMemberNameInput] = useState('');
  const [memberBalanceInput, setMemberBalanceInput] = useState('');
  const [topUpMemberId, setTopUpMemberId] = useState(null);
  const [memberTopUpAmount, setMemberTopUpAmount] = useState('');
  const [showBulkTopUp, setShowBulkTopUp] = useState(false);
  const [bulkTopUpAmount, setBulkTopUpAmount] = useState('');
  const [showDepositLedger, setShowDepositLedger] = useState(false);
  const [editingDepositId, setEditingDepositId] = useState(null);
  const [editDepositAmount, setEditDepositAmount] = useState('');
  const [editDepositDate, setEditDepositDate] = useState('');

  const [houseExpDate, setHouseExpDate] = useState(getTodayStr());
  const [houseExpCategory, setHouseExpCategory] = useState('Meal');
  const [houseExpMeals, setHouseExpMeals] = useState(['Dinner']);
  const [isMultiMealMode, setIsMultiMealMode] = useState(false);
  const [houseExpDetail, setHouseExpDetail] = useState('');
  const [houseExpAmount, setHouseExpAmount] = useState('');
  const [houseExpItems, setHouseExpItems] = useState([
    { id: 'hitem-init-1', name: '', amount: '', category: 'Vegetables', splitType: 'Meal' },
  ]);
  const [presentMemberIds, setPresentMemberIds] = useState([]);
  const [editingHouseExpId, setEditingHouseExpId] = useState(null);

  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3400);
  };

  useEffect(() => {
    if (isPublicOrRoommateLocked) {
      if (activeTab !== 'house') setActiveTab('house');
      if (selectedEntryId !== null) setSelectedEntryId(null);
      if (isEditingHeader) setIsEditingHeader(false);
    }
  }, [isPublicOrRoommateLocked, activeTab, selectedEntryId, isEditingHeader]);

  useEffect(() => {
    let isMounted = true;
    const loadAllData = async () => {
      const savedTheme = await dbGet(DB_KEYS.THEME);
      const savedHeader = await dbGet(DB_KEYS.HEADER_META);
      const savedTabOrder = await dbGet(DB_KEYS.TAB_ORDER);
      const savedTabLabels = await dbGet(DB_KEYS.TAB_LABELS);
      const savedLogs = await dbGet(DB_KEYS.LOGS);
      const savedNotes = await dbGet(DB_KEYS.NOTES);
      const savedRough = await dbGet(DB_KEYS.ROUGH_NOTES);
      const savedTodos = await dbGet(DB_KEYS.TODOS);
      const savedInfo = await dbGet(DB_KEYS.INFO_CARDS);
      const savedWallet = await dbGet(DB_KEYS.PERSONAL_WALLET);
      const savedExp = await dbGet(DB_KEYS.PERSONAL_EXPENSES);
      const savedMembers = await dbGet(DB_KEYS.HOUSE_MEMBERS);
      const savedHouseExp = await dbGet(DB_KEYS.HOUSE_EXPENSES);
      const savedHouseDep = await dbGet(DB_KEYS.HOUSE_DEPOSITS);
      const savedMessCats = await dbGet(DB_KEYS.HOUSE_CATEGORIES);
      const savedHouseRules = await dbGet(DB_KEYS.HOUSE_RULES_TEXT);
      const savedFbCfg = await dbGet(DB_KEYS.FIREBASE_CFG);
      const savedRoomKey = await dbGet(DB_KEYS.ROOM_KEY);
      const savedRoomCanEdit = await dbGet(DB_KEYS.ROOM_CAN_EDIT);
      const savedAllowedUsers = await dbGet(DB_KEYS.ALLOWED_USERS);

      if (!isMounted) return;

      if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
      if (savedHeader?.title) setHeaderMeta(savedHeader);
      if (savedTabLabels && typeof savedTabLabels === 'object') setCustomTabLabels(savedTabLabels);
      if (Array.isArray(savedTabOrder)) {
        const mergedOrder = [
          ...savedTabOrder.filter((id) => TAB_CATALOG[id]),
          ...DEFAULT_TAB_ORDER.filter((id) => !savedTabOrder.includes(id)),
        ];
        setTabOrder(mergedOrder);
      }

      const activeFbCfg = savedFbCfg?.apiKey ? savedFbCfg : DEFAULT_FIREBASE_CONFIG;
      setFirebaseConfig(activeFbCfg);

      const initialRoomKey = savedRoomKey || 'ROOM-724Y-XBQN';
      setRoomKey(initialRoomKey);
      if (!savedRoomKey) await dbSet(DB_KEYS.ROOM_KEY, initialRoomKey);
      if (typeof savedRoomCanEdit === 'boolean') setRoomCanEdit(savedRoomCanEdit);
      if (Array.isArray(savedAllowedUsers)) setAllowedStandardUsers(savedAllowedUsers);

      const sessionRoomKey = sessionStorage.getItem(ROOMMATE_SESSION_KEY) || '';
      const resolvedRoomKey = (urlRoomKey || sessionRoomKey).trim().toUpperCase();
      if (resolvedRoomKey) {
        sessionStorage.setItem(ROOMMATE_SESSION_KEY, resolvedRoomKey);
        setRoommateModeKey(resolvedRoomKey);
      }

      if (Array.isArray(savedLogs) && savedLogs.length > 0) {
        setEntries(savedLogs);
      } else {
        setEntries([
          {
            id: 'demo-1',
            date: getTodayStr(),
            title: 'Workspace Setup & Daily Operations',
            details:
              '• Organized daily work logs, rough summaries, and expense ledgers.\n• Configured 8-member house mess split rules (Meals split on present members; Groceries split equally across all 8).\n• Enabled offline IndexedDB storage & Cloud Sync with Roommate Tab-Key access.',
            attachments: [],
            updatedAt: new Date().toISOString(),
          },
        ]);
      }

      if (Array.isArray(savedNotes)) setNotes(savedNotes);

      if (Array.isArray(savedRough) && savedRough.length > 0) {
        setRoughNotes(savedRough);
      } else {
        setRoughNotes([
          {
            id: 'rough-1',
            title: 'Weekly Site & Lab Checkpoints',
            tag: 'Rough Summary',
            summary:
              'Verify calibration logs before Wednesday review and compile preliminary observations in the daily log.',
            details:
              'Key points to expand later:\n1. Double check reference readings.\n2. Attach scanned report PDF in Daily Log.\n3. Share updated pool balance with housemates.',
            pinned: true,
            updatedAt: new Date().toISOString(),
          },
        ]);
      }

      if (Array.isArray(savedTodos) && savedTodos.length > 0) {
        setTodos(savedTodos);
      } else {
        setTodos([
          {
            id: 'todo-1',
            text: 'Review weekly work logs and attach PDF summaries',
            priority: 'High',
            dueDate: getTodayStr(),
            completed: false,
          },
        ]);
      }

      if (Array.isArray(savedInfo) && savedInfo.length > 0) {
        setInfoCards(savedInfo);
      } else {
        setInfoCards([
          {
            id: 'info-1',
            title: 'House Wi-Fi & Mess Rules',
            category: 'House Info',
            content:
              '• Meals divide strictly among present members toggled at entry.\n• Groceries divide equally among all 8 housemates.',
          },
        ]);
      }

      if (savedWallet) setPersonalWallet(savedWallet);
      if (Array.isArray(savedExp)) setPersonalExpenses(savedExp);

      const finalMembers =
        Array.isArray(savedMembers) && savedMembers.length > 0
          ? savedMembers
          : Array.from({ length: 8 }, (_, idx) => ({
              id: `member-${idx + 1}`,
              name: `Member ${idx + 1}`,
              balance: 1000,
            }));
      setHouseMembers(finalMembers);
      setPresentMemberIds(finalMembers.map((m) => m.id));

      if (Array.isArray(savedHouseExp)) setHouseExpenses(savedHouseExp);
      if (Array.isArray(savedHouseDep)) setHouseDeposits(savedHouseDep);
      if (Array.isArray(savedMessCats) && savedMessCats.length > 0) setMessCategories(savedMessCats);
      if (typeof savedHouseRules === 'string' && savedHouseRules.trim()) setHouseRulesText(savedHouseRules);

      setIsStorageReady(true);
    };

    loadAllData();
    return () => {
      isMounted = false;
    };
  }, [urlRoomKey]);

  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.THEME, theme);
  }, [theme, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.HEADER_META, headerMeta);
  }, [headerMeta, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.TAB_ORDER, tabOrder);
  }, [tabOrder, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.TAB_LABELS, customTabLabels);
  }, [customTabLabels, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.LOGS, entries);
  }, [entries, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.NOTES, notes);
  }, [notes, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.ROUGH_NOTES, roughNotes);
  }, [roughNotes, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.TODOS, todos);
  }, [todos, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.INFO_CARDS, infoCards);
  }, [infoCards, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.PERSONAL_WALLET, personalWallet);
  }, [personalWallet, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.PERSONAL_EXPENSES, personalExpenses);
  }, [personalExpenses, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.HOUSE_MEMBERS, houseMembers);
  }, [houseMembers, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.HOUSE_EXPENSES, houseExpenses);
  }, [houseExpenses, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.HOUSE_DEPOSITS, houseDeposits);
  }, [houseDeposits, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.HOUSE_CATEGORIES, messCategories);
  }, [messCategories, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.HOUSE_RULES_TEXT, houseRulesText);
  }, [houseRulesText, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated && roomKey) dbSet(DB_KEYS.ROOM_KEY, roomKey);
  }, [roomKey, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) dbSet(DB_KEYS.ROOM_CAN_EDIT, roomCanEdit);
  }, [roomCanEdit, isStorageReady, isAdminAuthenticated]);
  useEffect(() => {
    if (isStorageReady && isAdminAuthenticated) {
      dbSet(DB_KEYS.ALLOWED_USERS, allowedStandardUsers);
    }
  }, [allowedStandardUsers, isStorageReady, isAdminAuthenticated]);

  useEffect(() => {
    if (!firebaseConfig?.apiKey || !isStorageReady) return;
    try {
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const unsubAuth = onAuthStateChanged(auth, async (user) => {
        if (user && !user.isAnonymous) {
          const emailLower = (user.email || '').toLowerCase();
          if (user.emailVerified && emailLower === SOLE_ADMIN_EMAIL.toLowerCase()) {
            setCloudUser(user);
            setVerifiedStandardUser(null);
            setActiveTab((prev) => (prev === 'house' ? 'daily' : prev));
          } else {
            await signOut(auth).catch(() => {});
            setCloudUser(null);
            setVerifiedStandardUser(user.email || 'Approved User');
            setActiveTab('house');
          }
        } else {
          setCloudUser(null);
          setActiveTab('house');
        }
      });
      return () => unsubAuth();
    } catch (err) {
      console.error('Firebase init error:', err);
      setCloudStatus('offline');
    }
  }, [firebaseConfig, isStorageReady]);

  useEffect(() => {
    if (!firebaseConfig?.apiKey || !isAdminAuthenticated || !isStorageReady) return;
    let unsubUser = () => {};
    let unsubRoom = () => {};
    try {
      setCloudStatus('connecting');
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const db = getLongPollingDb(firebaseConfig);

      const userDocRef = doc(db, 'users', cloudUser.uid, 'workspace', 'main');
      unsubUser = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            isApplyingRemoteRef.current = true;
            if (data.headerMeta?.title) setHeaderMeta(data.headerMeta);
            if (Array.isArray(data.tabOrder)) setTabOrder(data.tabOrder);
            if (data.customTabLabels && typeof data.customTabLabels === 'object') {
              setCustomTabLabels(data.customTabLabels);
            }
            if (Array.isArray(data.entries)) setEntries(data.entries);
            if (Array.isArray(data.notes)) setNotes(data.notes);
            if (Array.isArray(data.roughNotes)) setRoughNotes(data.roughNotes);
            if (Array.isArray(data.todos)) setTodos(data.todos);
            if (Array.isArray(data.infoCards)) setInfoCards(data.infoCards);
            if (data.personalWallet) setPersonalWallet(data.personalWallet);
            if (Array.isArray(data.personalExpenses)) setPersonalExpenses(data.personalExpenses);
            if (Array.isArray(data.allowedStandardUsers)) {
              setAllowedStandardUsers(data.allowedStandardUsers);
            }
            if (data.roomKey && !skipRemoteRoomKeyOnceRef.current) {
              setRoomKey(data.roomKey);
            }
            skipRemoteRoomKeyOnceRef.current = false;
            setTimeout(() => {
              isApplyingRemoteRef.current = false;
            }, 300);
          }
          setCloudStatus('synced');
        },
        (err) => {
          console.error('Firestore user listener error:', err);
          setCloudStatus('offline');
        }
      );

      if (roomKey) {
        const roomDocRef = doc(db, 'shared_rooms', roomKey);
        unsubRoom = onSnapshot(roomDocRef, (snap) => {
          if (snap.exists()) {
            const rData = snap.data();
            isApplyingRemoteRef.current = true;
            if (Array.isArray(rData.houseMembers) && rData.houseMembers.length > 0) {
              setHouseMembers(rData.houseMembers);
            }
            if (Array.isArray(rData.houseExpenses)) setHouseExpenses(rData.houseExpenses);
            if (Array.isArray(rData.houseDeposits)) setHouseDeposits(rData.houseDeposits);
            if (Array.isArray(rData.messCategories) && rData.messCategories.length > 0) {
              setMessCategories(rData.messCategories);
            }
            if (typeof rData.houseRulesText === 'string' && rData.houseRulesText.trim()) {
              setHouseRulesText(rData.houseRulesText);
            }
            setTimeout(() => {
              isApplyingRemoteRef.current = false;
            }, 300);
          }
        });
      }
    } catch (err) {
      console.error('Firestore sync setup error:', err);
      setCloudStatus('offline');
    }
    return () => {
      unsubUser();
      unsubRoom();
    };
  }, [firebaseConfig, isAdminAuthenticated, cloudUser, isStorageReady, roomKey]);

  useEffect(() => {
    if (!firebaseConfig?.apiKey || !isPublicOrRoommateLocked || !roommateModeKey || !isStorageReady) return;
    let unsubRoom = () => {};
    let isCancelled = false;

    const connectRoommate = async () => {
      try {
        setCloudStatus('connecting');
        setRoomKeyNotFound(false);
        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        const auth = getAuth(app);
        if (!auth.currentUser) {
          await signInAnonymously(auth).catch((authErr) => {
            console.warn('Anonymous auth skipped/failed:', authErr);
          });
        }
        if (isCancelled) return;
        const db = getLongPollingDb(firebaseConfig);
        const roomDocRef = doc(db, 'shared_rooms', roommateModeKey);
        unsubRoom = onSnapshot(
          roomDocRef,
          (snap) => {
            if (isCancelled) return;
            if (snap.exists()) {
              const rData = snap.data();
              isApplyingRemoteRef.current = true;
              if (Array.isArray(rData.houseMembers) && rData.houseMembers.length > 0) {
                setHouseMembers(rData.houseMembers);
              }
              if (Array.isArray(rData.houseExpenses)) setHouseExpenses(rData.houseExpenses);
              if (Array.isArray(rData.houseDeposits)) setHouseDeposits(rData.houseDeposits);
              if (Array.isArray(rData.messCategories) && rData.messCategories.length > 0) {
                setMessCategories(rData.messCategories);
              }
              if (typeof rData.houseRulesText === 'string' && rData.houseRulesText.trim()) {
                setHouseRulesText(rData.houseRulesText);
              }
              setRoomKeyNotFound(false);
              setTimeout(() => {
                isApplyingRemoteRef.current = false;
              }, 300);
              setCloudStatus('room_synced');
            } else {
              setRoomKeyNotFound(true);
              setCloudStatus('offline');
            }
          },
          (err) => {
            if (isCancelled) return;
            console.error('Roommate listener error:', err);
            showToast(
              err?.code === 'permission-denied'
                ? 'Firestore blocked read-only access for this room key.'
                : 'Unable to read mess status. Check key or Firestore rules.',
              'error'
            );
            setCloudStatus('error');
          }
        );
      } catch (err) {
        if (isCancelled) return;
        console.error('Roommate connect error:', err);
        showToast(err?.message || 'Could not connect to mess room.', 'error');
        setCloudStatus('error');
      }
    };
    connectRoommate();
    return () => {
      isCancelled = true;
      unsubRoom();
    };
  }, [firebaseConfig, isPublicOrRoommateLocked, roommateModeKey, isStorageReady]);

  useEffect(() => {
    if (!firebaseConfig?.apiKey || !isAdminAuthenticated || !isStorageReady || isApplyingRemoteRef.current) return;
    const timer = setTimeout(async () => {
      try {
        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        const db = getLongPollingDb(firebaseConfig);
        const cloudSafeEntries = entries.map((e) => ({
          ...e,
          attachments: (e.attachments || []).filter((a) => (a.dataUrl?.length || 0) < 750000),
        }));
        await setDoc(
          doc(db, 'users', cloudUser.uid, 'workspace', 'main'),
          {
            headerMeta,
            tabOrder,
            customTabLabels,
            entries: cloudSafeEntries,
            notes,
            roughNotes,
            todos,
            infoCards,
            personalWallet,
            personalExpenses,
            allowedStandardUsers,
            roomKey,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Cloud save error:', err);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [
    firebaseConfig,
    isAdminAuthenticated,
    cloudUser,
    isStorageReady,
    headerMeta,
    tabOrder,
    customTabLabels,
    entries,
    notes,
    roughNotes,
    todos,
    infoCards,
    personalWallet,
    personalExpenses,
    allowedStandardUsers,
    roomKey,
  ]);

  useEffect(() => {
    if (!firebaseConfig?.apiKey || !isAdminAuthenticated || !roomKey || !isStorageReady || isApplyingRemoteRef.current) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        const db = getLongPollingDb(firebaseConfig);
        await setDoc(
          doc(db, 'shared_rooms', roomKey),
          {
            houseMembers,
            houseExpenses,
            houseDeposits,
            messCategories,
            houseRulesText,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Shared room save error:', err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [
    firebaseConfig,
    isAdminAuthenticated,
    roomKey,
    isStorageReady,
    houseMembers,
    houseExpenses,
    houseDeposits,
    messCategories,
    houseRulesText,
  ]);

  const handleRegenerateRoomKey = async () => {
    const newKey = generateRandomRoomKey();
    skipRemoteRoomKeyOnceRef.current = true;
    setRoomKey(newKey);
    await dbSet(DB_KEYS.ROOM_KEY, newKey);

    if (firebaseConfig?.apiKey && isAdminAuthenticated) {
      try {
        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        const db = getLongPollingDb(firebaseConfig);
        await setDoc(
          doc(db, 'users', cloudUser.uid, 'workspace', 'main'),
          { roomKey: newKey, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        await setDoc(
          doc(db, 'shared_rooms', newKey),
          {
            houseMembers,
            houseExpenses,
            houseDeposits,
            messCategories,
            houseRulesText,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Error syncing regenerated key:', err);
      }
    }
    showToast(`New Mess Key generated: ${newKey}`);
  };

  const handleAddAllowedUserEmail = (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated) return;
    const email = newAllowedEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      showToast('Enter a valid Gmail/email address.', 'error');
      return;
    }
    if (email === SOLE_ADMIN_EMAIL.toLowerCase()) {
      showToast('This is already the Sole Admin account.', 'error');
      return;
    }
    if (allowedStandardUsers.includes(email)) {
      showToast('User is already in the approved read-only list.', 'error');
      return;
    }
    setAllowedStandardUsers((prev) => [...prev, email]);
    setNewAllowedEmail('');
    showToast(`Approved ${email} as Read-Only User (never Admin).`);
  };

  const handleRemoveAllowedUserEmail = (emailToRemove) => {
    if (!isAdminAuthenticated) return;
    setAllowedStandardUsers((prev) => prev.filter((item) => item !== emailToRemove));
    showToast(`Removed ${emailToRemove} access.`);
  };

  const handleSaveFirebaseConfig = async (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated) return;
    try {
      const parsed = parseFirebaseConfigInput(firebaseConfigText);
      const mergedCfg = { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
      setFirebaseConfig(mergedCfg);
      await dbSet(DB_KEYS.FIREBASE_CFG, mergedCfg);
      setFirebaseConfigText('');
      setShowAdvancedConfig(false);
      showToast('Firebase Config saved and hidden!');
    } catch {
      showToast('Invalid Firebase Config. Paste the full firebaseConfig { ... } block.', 'error');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const signedEmail = (result?.user?.email || '').toLowerCase();
      const isVerifiedAdmin =
        Boolean(result?.user?.emailVerified) &&
        signedEmail === SOLE_ADMIN_EMAIL.toLowerCase();

      if (isVerifiedAdmin) {
        sessionStorage.removeItem(ROOMMATE_SESSION_KEY);
        setRoommateModeKey('');
        setVerifiedStandardUser(null);
        setActiveTab('daily');
        showToast('Admin authenticated! Full workspace unlocked.');
      } else {
        await signOut(auth).catch(() => {});
        setCloudUser(null);
        setActiveTab('house');
        if (allowedStandardUsers.includes(signedEmail)) {
          setVerifiedStandardUser(signedEmail);
          setRoommateModeKey(roomKey);
          showToast('Signed in as Read-Only User. Admin access is restricted.');
        } else {
          setVerifiedStandardUser(null);
          showToast('Access Denied: Only approved users can view; only Admin can manage.', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err?.message || 'Sign-in failed. Check Authorized Domains in Firebase.', 'error');
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      if (firebaseConfig?.apiKey) {
        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        await signOut(getAuth(app));
      }
      setCloudUser(null);
      setVerifiedStandardUser(null);
      setCloudStatus('offline');
      setActiveTab('house');
      showToast('Signed out. Locked to 8-Friends Mess view.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnterRoommateMode = (e) => {
    e.preventDefault();
    const cleaned = roomKeyLoginInput.trim().toUpperCase();
    if (!cleaned) {
      showToast('Enter the 8-Friends Mess Key.', 'error');
      return;
    }
    sessionStorage.setItem(ROOMMATE_SESSION_KEY, cleaned);
    setRoommateModeKey(cleaned);
    setActiveTab('house');
    setShowRoomLoginModal(false);
    setRoomKeyLoginInput('');
    showToast(`Loading 8-Friends Mess status for ${cleaned}...`);
  };

  const handleClearRoommateKey = () => {
    sessionStorage.removeItem(ROOMMATE_SESSION_KEY);
    setRoommateModeKey('');
    setVerifiedStandardUser(null);
    setRoomKeyNotFound(false);
    setCloudStatus('offline');
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const buildRoommateInviteLink = () => {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}?mess=1`;
  };

  const isDark = theme === 'dark';

  const glassCard = isDark
    ? 'bg-white/[0.07] backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/25'
    : 'bg-white/75 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-300/40';
  const glassSubCard = isDark
    ? 'bg-white/[0.04] backdrop-blur-md border border-white/10'
    : 'bg-slate-900/[0.03] backdrop-blur-md border border-slate-200/80';
  const glassInput = isDark
    ? 'bg-slate-950/50 border border-white/15 text-white placeholder-slate-400 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all'
    : 'bg-white/90 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-300' : 'text-slate-600';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  const getTabLabel = (tabId) =>
    customTabLabels[tabId]?.trim() || TAB_CATALOG[tabId]?.label || tabId;

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Glass theme.`);
      return next;
    });
  };

  const startEditingHeader = () => {
    if (!isAdminAuthenticated) return;
    setTempHeaderTitle(headerMeta.title);
    setTempHeaderSubtitle(headerMeta.subtitle);
    setIsEditingHeader(true);
  };

  const saveHeaderMeta = (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated || !tempHeaderTitle.trim()) return;
    setHeaderMeta({
      title: tempHeaderTitle.trim(),
      subtitle: tempHeaderSubtitle.trim() || 'Daily Operations & Ledger',
    });
    setIsEditingHeader(false);
    showToast('Workspace title updated.');
  };

  const moveTabByIndex = (fromIndex, toIndex) => {
    if (!isAdminAuthenticated) return;
    if (toIndex < 0 || toIndex >= tabOrder.length || fromIndex === toIndex) return;
    const updated = [...tabOrder];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setTabOrder(updated);
  };

  const handleTabDragStart = (tabId) => {
    if (isAdminAuthenticated) setDraggedTabId(tabId);
  };
  const handleTabDragOver = (e, targetTabId) => {
    e.preventDefault();
    if (!isAdminAuthenticated || !draggedTabId || draggedTabId === targetTabId) return;
    const fromIdx = tabOrder.indexOf(draggedTabId);
    const toIdx = tabOrder.indexOf(targetTabId);
    if (fromIdx !== -1 && toIdx !== -1) moveTabByIndex(fromIdx, toIdx);
  };
  const handleTabDragEnd = () => setDraggedTabId(null);

  const resetTabOrder = () => {
    if (!isAdminAuthenticated) return;
    setTabOrder(DEFAULT_TAB_ORDER);
    setCustomTabLabels({});
    showToast('Tab order & names restored to default.');
  };

  const saveTabLabel = (tabId) => {
    if (!isAdminAuthenticated) return;
    const clean = tempTabLabel.trim();
    if (clean) {
      setCustomTabLabels((prev) => ({ ...prev, [tabId]: clean }));
      showToast('Tab renamed.');
    }
    setEditingTabId(null);
  };

  const handlePdfUpload = (e) => {
    if (!isAdminAuthenticated) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        showToast(`"${file.name}" is not a PDF file.`, 'error');
        return;
      }
      if (file.size > MAX_PDF_BYTES) {
        showToast(`"${file.name}" exceeds 25 MB limit.`, 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setEntryAttachments((prev) => [
          ...prev,
          {
            id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            size: file.size,
            dataUrl: reader.result,
          },
        ]);
        showToast(`Attached "${file.name}"`);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeDraftAttachment = (attId) =>
    setEntryAttachments((prev) => prev.filter((a) => a.id !== attId));

  const handleSaveEntry = (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated) return;
    if (!entryTitle.trim() || !entryDetails.trim()) {
      showToast('Please enter both a Main Topic Title and Work Details.', 'error');
      return;
    }
    if (editingEntryId) {
      setEntries((prev) =>
        prev.map((item) =>
          item.id === editingEntryId
            ? {
                ...item,
                date: entryDate,
                title: entryTitle.trim(),
                details: entryDetails.trim(),
                attachments: entryAttachments,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
      showToast('Daily work record updated.');
      setEditingEntryId(null);
    } else {
      setEntries((prev) => [
        {
          id: `entry-${Date.now()}`,
          date: entryDate,
          title: entryTitle.trim(),
          details: entryDetails.trim(),
          attachments: entryAttachments,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      showToast('Daily work record saved.');
    }
    setEntryTitle('');
    setEntryDetails('');
    setEntryAttachments([]);
    setEntryDate(getTodayStr());
  };

  const startEditEntry = (entry) => {
    if (!isAdminAuthenticated) return;
    setEditingEntryId(entry.id);
    setEntryDate(entry.date);
    setEntryTitle(entry.title);
    setEntryDetails(entry.details);
    setEntryAttachments(entry.attachments || []);
    setActiveTab('daily');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEntry = (id) => {
    if (!isAdminAuthenticated) return;
    setEntries((prev) => prev.filter((item) => item.id !== id));
    if (selectedEntryId === id) setSelectedEntryId(null);
    if (editingEntryId === id) {
      setEditingEntryId(null);
      setEntryTitle('');
      setEntryDetails('');
      setEntryAttachments([]);
    }
    showToast('Record deleted.');
  };

  const handleSaveRoughNote = (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated) return;
    if (!roughSummary.trim() && !roughDetails.trim()) {
      showToast('Please enter a Rough Summary or Details.', 'error');
      return;
    }
    const cleanTitle = roughTitle.trim() || `Rough Note (${formatDateDisplay(getTodayStr())})`;
    if (editingRoughId) {
      setRoughNotes((prev) =>
        prev.map((r) =>
          r.id === editingRoughId
            ? {
                ...r,
                title: cleanTitle,
                tag: roughTag,
                summary: roughSummary.trim(),
                details: roughDetails.trim(),
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
      setEditingRoughId(null);
      showToast('Rough note updated.');
    } else {
      setRoughNotes((prev) => [
        {
          id: `rough-${Date.now()}`,
          title: cleanTitle,
          tag: roughTag,
          summary: roughSummary.trim(),
          details: roughDetails.trim(),
          pinned: false,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      showToast('Rough note saved.');
    }
    setRoughTitle('');
    setRoughSummary('');
    setRoughDetails('');
    setRoughTag('Rough Summary');
  };

  const startEditRough = (item) => {
    if (!isAdminAuthenticated) return;
    setEditingRoughId(item.id);
    setRoughTitle(item.title);
    setRoughTag(item.tag || 'Rough Summary');
    setRoughSummary(item.summary || '');
    setRoughDetails(item.details || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleRoughPin = (id) => {
    if (!isAdminAuthenticated) return;
    setRoughNotes((prev) => prev.map((r) => (r.id === id ? { ...r, pinned: !r.pinned } : r)));
  };

  const duplicateRough = (item) => {
    if (!isAdminAuthenticated) return;
    setRoughNotes((prev) => [
      {
        ...item,
        id: `rough-${Date.now()}`,
        title: `${item.title} (Copy)`,
        pinned: false,
        updatedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    showToast('Rough note duplicated.');
  };

  const deleteRough = (id) => {
    if (!isAdminAuthenticated) return;
    setRoughNotes((prev) => prev.filter((r) => r.id !== id));
    if (editingRoughId === id) {
      setEditingRoughId(null);
      setRoughTitle('');
      setRoughSummary('');
      setRoughDetails('');
    }
    showToast('Rough note removed.');
  };

  const filteredRoughNotes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return roughNotes
      .filter((r) => {
        if (roughFilter !== 'All' && r.tag !== roughFilter) return false;
        if (!q) return true;
        return (
          r.title.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q) ||
          r.details.toLowerCase().includes(q) ||
          r.tag.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [roughNotes, roughFilter, searchQuery]);

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated || !noteText.trim()) return;
    if (editingNoteId) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNoteId
            ? { ...n, text: noteText.trim(), color: noteColor, pinned: noteIsPinned }
            : n
        )
      );
      setEditingNoteId(null);
      showToast('Note updated.');
    } else {
      setNotes((prev) => [
        {
          id: `note-${Date.now()}`,
          text: noteText.trim(),
          color: noteColor,
          pinned: noteIsPinned,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      showToast(noteIsPinned ? 'Pinned to Important Notes.' : 'Sticky note added.');
    }
    setNoteText('');
    setNoteIsPinned(false);
  };

  const startEditNote = (note) => {
    if (!isAdminAuthenticated) return;
    setEditingNoteId(note.id);
    setNoteText(note.text);
    setNoteColor(note.color || 'amber');
    setNoteIsPinned(Boolean(note.pinned));
  };

  const toggleNotePin = (id) => {
    if (!isAdminAuthenticated) return;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const handleDeleteNote = (id) => {
    if (!isAdminAuthenticated) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingNoteId === id) {
      setEditingNoteId(null);
      setNoteText('');
    }
    showToast('Note removed.');
  };

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated || !todoText.trim()) return;
    setTodos((prev) => [
      {
        id: `todo-${Date.now()}`,
        text: todoText.trim(),
        priority: todoPriority,
        dueDate: todoDueDate,
        completed: false,
      },
      ...prev,
    ]);
    setTodoText('');
    setTodoDueDate('');
    showToast('Task added to To-Do list.');
  };

  const startEditTodo = (todo) => {
    if (!isAdminAuthenticated) return;
    setEditingTodoId(todo.id);
    setEditTodoText(todo.text);
    setEditTodoPriority(todo.priority || 'Medium');
    setEditTodoDueDate(todo.dueDate || '');
  };

  const saveEditTodo = (id) => {
    if (!isAdminAuthenticated || !editTodoText.trim()) return;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              text: editTodoText.trim(),
              priority: editTodoPriority,
              dueDate: editTodoDueDate,
            }
          : t
      )
    );
    setEditingTodoId(null);
    showToast('Task updated.');
  };

  const toggleTodo = (id) => {
    if (!isAdminAuthenticated) return;
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };
  const deleteTodo = (id) => {
    if (!isAdminAuthenticated) return;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    showToast('Task deleted.');
  };

  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      if (todoFilter === 'active') return !t.completed;
      if (todoFilter === 'completed') return t.completed;
      return true;
    });
  }, [todos, todoFilter]);

  const handleSaveInfoCard = (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated || !infoTitle.trim() || !infoContent.trim()) return;
    if (editingInfoId) {
      setInfoCards((prev) =>
        prev.map((c) =>
          c.id === editingInfoId
            ? {
                ...c,
                title: infoTitle.trim(),
                category: infoCategory.trim() || 'General',
                content: infoContent.trim(),
              }
            : c
        )
      );
      setEditingInfoId(null);
      showToast('Important info updated.');
    } else {
      setInfoCards((prev) => [
        {
          id: `info-${Date.now()}`,
          title: infoTitle.trim(),
          category: infoCategory.trim() || 'General',
          content: infoContent.trim(),
        },
        ...prev,
      ]);
      showToast('Important info card saved.');
    }
    setInfoTitle('');
    setInfoCategory('General');
    setInfoContent('');
  };

  const startEditInfoCard = (card) => {
    if (!isAdminAuthenticated) return;
    setEditingInfoId(card.id);
    setInfoTitle(card.title);
    setInfoCategory(card.category);
    setInfoContent(card.content);
  };

  const deleteInfoCard = (id) => {
    if (!isAdminAuthenticated) return;
    setInfoCards((prev) => prev.filter((c) => c.id !== id));
    if (editingInfoId === id) {
      setEditingInfoId(null);
      setInfoTitle('');
      setInfoContent('');
    }
    showToast('Info card removed.');
  };

  const copyTextValue = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard.');
    setTimeout(() => setCopiedId(null), 1800);
  };

  const personalTotals = useMemo(() => {
    const cashSpent = personalExpenses
      .filter((e) => e.source === 'Cash')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const accountSpent = personalExpenses
      .filter((e) => e.source === 'Account')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalSpent = cashSpent + accountSpent;
    const cashRemaining = Number(personalWallet.initialCash || 0) - cashSpent;
    const accountRemaining = Number(personalWallet.initialAccount || 0) - accountSpent;
    const totalCredit =
      Number(personalWallet.initialCash || 0) + Number(personalWallet.initialAccount || 0);
    const totalRemaining = cashRemaining + accountRemaining;
    return {
      cashSpent,
      accountSpent,
      totalSpent,
      cashRemaining,
      accountRemaining,
      totalCredit,
      totalRemaining,
    };
  }, [personalWallet, personalExpenses]);

  const togglePersonalMeal = (meal) => {
    setExpMeals((prev) => {
      if (prev.includes(meal)) {
        return prev.length > 1 ? prev.filter((m) => m !== meal) : prev;
      }
      return [...prev, meal];
    });
  };

  const handleSavePersonalExpense = (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated) return;
    const numericAmt = parseFloat(expAmount);
    if (!numericAmt || numericAmt <= 0) {
      showToast('Please enter a valid expense amount.', 'error');
      return;
    }
    const payload = {
      id: editingExpId || `pexp-${Date.now()}`,
      date: expDate,
      category: expCategory,
      meals: expCategory === 'Meal' ? expMeals : [],
      detail:
        expDetail.trim() ||
        (expCategory === 'Meal' ? `${expMeals.join(', ')} Meal` : expCategory),
      amount: numericAmt,
      source: expSource,
    };
    if (editingExpId) {
      setPersonalExpenses((prev) => prev.map((item) => (item.id === editingExpId ? payload : item)));
      setEditingExpId(null);
      showToast('Personal expense updated & balances recalculated.');
    } else {
      setPersonalExpenses((prev) => [payload, ...prev]);
      showToast(`Deducted ${formatMoney(numericAmt)} from ${expSource}.`);
    }
    setExpDetail('');
    setExpAmount('');
    setExpCategory('Meal');
    setExpMeals(['Dinner']);
  };

  const startEditPersonalExpense = (item) => {
    if (!isAdminAuthenticated) return;
    setEditingExpId(item.id);
    setExpDate(item.date);
    setExpCategory(item.category);
    setExpMeals(item.meals && item.meals.length ? item.meals : ['Dinner']);
    setExpDetail(item.detail);
    setExpAmount(String(item.amount));
    setExpSource(item.source);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deletePersonalExpense = (id) => {
    if (!isAdminAuthenticated) return;
    setPersonalExpenses((prev) => prev.filter((item) => item.id !== id));
    if (editingExpId === id) {
      setEditingExpId(null);
      setExpDetail('');
      setExpAmount('');
    }
    showToast('Expense deleted & balance refunded.');
  };

  const handleSaveWalletCredits = (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated) return;
    setPersonalWallet({
      initialCash: parseFloat(walletCashInput) || 0,
      initialAccount: parseFloat(walletAccountInput) || 0,
    });
    setIsEditingWallet(false);
    showToast('Initial Cash & Account credits updated.');
  };

  const handleWalletTopUp = (e) => {
    e.preventDefault();
    if (!isAdminAuthenticated) return;
    const addAmt = parseFloat(topUpAmount);
    if (!addAmt || addAmt <= 0) return;
    setPersonalWallet((prev) => ({
      ...prev,
      initialCash:
        topUpSource === 'Cash' ? Number(prev.initialCash || 0) + addAmt : prev.initialCash,
      initialAccount:
        topUpSource === 'Account'
          ? Number(prev.initialAccount || 0) + addAmt
          : prev.initialAccount,
    }));
    showToast(`Added +${formatMoney(addAmt)} to ${topUpSource}.`);
    setTopUpSource(null);
    setTopUpAmount('');
  };

  const houseStats = useMemo(() => {
    const memberCount = Math.max(houseMembers.length, 1);
    let mealSpend = 0;
    let grocerySpend = 0;
    const memberAgg = {};
    houseMembers.forEach((m) => {
      memberAgg[m.id] = { mealDeducted: 0, groceryDeducted: 0, mealsAttended: 0 };
    });

    houseExpenses.forEach((exp) => {
      const items =
        Array.isArray(exp.items) && exp.items.length > 0
          ? exp.items
          : [
              {
                name: exp.detail || '',
                amount: Number(exp.amount || 0),
                category: exp.category === 'Groceries' ? 'Custom' : 'Roti/Naan',
                splitType: exp.category === 'Groceries' ? 'Grocery' : 'Meal',
              },
            ];

      let expMeal = 0;
      let expGrocery = 0;
      items.forEach((it) => {
        const amt = Number(it.amount || 0);
        if (it.splitType === 'Grocery') expGrocery += amt;
        else expMeal += amt;
      });

      mealSpend += expMeal;
      grocerySpend += expGrocery;

      const pIds =
        Array.isArray(exp.participantIds) && exp.participantIds.length > 0
          ? exp.participantIds
          : exp.category === 'Groceries'
          ? houseMembers.map((m) => m.id)
          : presentMemberIds;

      const perHeadMeal = expMeal > 0 && pIds.length > 0 ? expMeal / pIds.length : 0;
      const perHeadGrocery = expGrocery > 0 ? expGrocery / memberCount : 0;

      houseMembers.forEach((m) => {
        if (memberAgg[m.id]) {
          memberAgg[m.id].groceryDeducted += perHeadGrocery;
        }
      });

      pIds.forEach((id) => {
        if (memberAgg[id]) {
          if (expMeal > 0) {
            memberAgg[id].mealDeducted += perHeadMeal;
            memberAgg[id].mealsAttended += 1;
          }
        }
      });
    });

    const totalMemberBalances = houseMembers.reduce((sum, m) => sum + Number(m.balance || 0), 0);
    const totalHouseSpent = mealSpend + grocerySpend;
    const totalCollectedPool = totalMemberBalances + totalHouseSpent;

    return {
      totalCollectedPool,
      totalHouseSpent,
      mealSpend,
      grocerySpend,
      creditRemaining: totalMemberBalances,
      memberAgg,
    };
  }, [houseMembers, houseExpenses, presentMemberIds]);

  const toggleHouseMeal = (meal) => {
    setHouseExpMeals((prev) => {
      if (prev.includes(meal)) {
        return prev.length > 1 ? prev.filter((m) => m !== meal) : prev;
      }
      return [...prev, meal];
    });
  };

  const toggleMemberAttendance = (memberId) => {
    setPresentMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleAddHouseMember = () => {
    if (!canEditHouseInRoomMode) return;
    const nextIdx = houseMembers.length + 1;
    const newId = `member-${Date.now()}`;
    setHouseMembers((prev) => [
      ...prev,
      { id: newId, name: `Member ${nextIdx}`, balance: 1000 },
    ]);
    setPresentMemberIds((prev) => [...prev, newId]);
    showToast(`Added Member ${nextIdx} with Rs. 1,000 balance.`);
  };

  const handleRemoveHouseMember = (memberId) => {
    if (!canEditHouseInRoomMode || houseMembers.length <= 1) return;
    const target = houseMembers.find((m) => m.id === memberId);
    setHouseMembers((prev) => prev.filter((m) => m.id !== memberId));
    setPresentMemberIds((prev) => prev.filter((id) => id !== memberId));
    showToast(`Removed ${target?.name || 'member'}.`);
  };

  const startEditMember = (member) => {
    if (!canEditHouseInRoomMode) return;
    setEditingMemberId(member.id);
    setMemberNameInput(member.name);
    setMemberBalanceInput(String(member.balance));
  };

  const saveMemberEdit = (memberId) => {
    if (!canEditHouseInRoomMode) return;
    setHouseMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              name: memberNameInput.trim() || m.name,
              balance: parseFloat(memberBalanceInput) || 0,
            }
          : m
      )
    );
    setEditingMemberId(null);
    showToast('Member details updated.');
  };

  const handleMemberTopUp = (memberId) => {
    if (!canEditHouseInRoomMode) return;
    const addAmt = parseFloat(memberTopUpAmount);
    if (!addAmt || addAmt <= 0) return;
    const member = houseMembers.find((m) => m.id === memberId);
    setHouseMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, balance: Number(m.balance || 0) + addAmt } : m
      )
    );
    setHouseDeposits((prev) => [
      {
        id: `dep-${Date.now()}`,
        date: getTodayStr(),
        memberId,
        memberName: member?.name || 'Member',
        amount: addAmt,
      },
      ...prev,
    ]);
    setTopUpMemberId(null);
    setMemberTopUpAmount('');
    showToast(`Topped up ${member?.name} by +${formatPKR(addAmt)}.`);
  };

  const handleBulkMemberTopUp = (e) => {
    e.preventDefault();
    if (!canEditHouseInRoomMode) return;
    const addAmt = parseFloat(bulkTopUpAmount);
    if (!addAmt || addAmt <= 0) {
      showToast('Enter a valid bulk top-up amount.', 'error');
      return;
    }
    const nowIso = new Date().toISOString();
    const newDeps = houseMembers.map((m, idx) => ({
      id: `bdep-${Date.now()}-${idx}`,
      date: getTodayStr(),
      memberId: m.id,
      memberName: m.name,
      amount: addAmt,
      createdAt: nowIso,
    }));
    setHouseMembers((prev) =>
      prev.map((m) => ({ ...m, balance: Number(m.balance || 0) + addAmt }))
    );
    setHouseDeposits((prev) => [...newDeps, ...prev]);
    setBulkTopUpAmount('');
    setShowBulkTopUp(false);
    showToast(`Added ${formatPKR(addAmt)} to all ${houseMembers.length} members.`);
  };

  const startEditDeposit = (dep) => {
    if (!canEditHouseInRoomMode) return;
    setEditingDepositId(dep.id);
    setEditDepositAmount(String(dep.amount));
    setEditDepositDate(dep.date || getTodayStr());
  };

  const saveEditDeposit = (dep) => {
    if (!canEditHouseInRoomMode) return;
    const newAmt = parseFloat(editDepositAmount);
    if (isNaN(newAmt) || newAmt < 0) {
      showToast('Enter a valid deposit amount.', 'error');
      return;
    }
    const diff = newAmt - Number(dep.amount || 0);
    setHouseMembers((prev) =>
      prev.map((m) =>
        m.id === dep.memberId ? { ...m, balance: Number(m.balance || 0) + diff } : m
      )
    );
    setHouseDeposits((prev) =>
      prev.map((d) =>
        d.id === dep.id ? { ...d, amount: newAmt, date: editDepositDate || d.date } : d
      )
    );
    setEditingDepositId(null);
    showToast('Deposit updated & member balance adjusted.');
  };

  const deleteDepositRecord = (dep) => {
    if (!canEditHouseInRoomMode) return;
    setHouseMembers((prev) =>
      prev.map((m) =>
        m.id === dep.memberId
          ? { ...m, balance: Number(m.balance || 0) - Number(dep.amount || 0) }
          : m
      )
    );
    setHouseDeposits((prev) => prev.filter((d) => d.id !== dep.id));
    showToast('Deposit deleted & deducted from member balance.');
  };

  const handleAddMessCategory = (e) => {
    e.preventDefault();
    if (!canEditHouseInRoomMode) return;
    const clean = newMessCategoryInput.trim();
    if (!clean) return;
    if (messCategories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      showToast('Category already exists.', 'error');
      return;
    }
    setMessCategories((prev) => [...prev, clean]);
    setNewMessCategoryInput('');
    showToast(`Added category "${clean}".`);
  };

  const handleDeleteMessCategory = (catToRemove) => {
    if (!canEditHouseInRoomMode || messCategories.length <= 1) return;
    setMessCategories((prev) => prev.filter((c) => c !== catToRemove));
    showToast(`Removed category "${catToRemove}".`);
  };

  const addHouseItemRow = () => {
    setHouseExpItems((prev) => [
      ...prev,
      {
        id: `hitem-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: '',
        amount: '',
        category: messCategories[0] || 'Custom',
        splitType: houseExpCategory === 'Groceries' ? 'Grocery' : 'Meal',
      },
    ]);
  };

  const updateHouseItemRow = (id, field, value) => {
    setHouseExpItems((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeHouseItemRow = (id) => {
    setHouseExpItems((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  };

  const housePreview = useMemo(() => {
    const memberCount = Math.max(houseMembers.length, 1);
    const hasRowAmounts = houseExpItems.some((r) => parseFloat(r.amount) > 0);
    let mealTotal = 0;
    let groceryTotal = 0;

    if (hasRowAmounts) {
      houseExpItems.forEach((r) => {
        const amt = parseFloat(r.amount) || 0;
        if (r.splitType === 'Grocery') groceryTotal += amt;
        else mealTotal += amt;
      });
    } else {
      const singleAmt = parseFloat(houseExpAmount) || 0;
      if (houseExpCategory === 'Groceries') groceryTotal = singleAmt;
      else mealTotal = singleAmt;
    }

    const presentCount =
      houseExpCategory === 'Groceries' ? houseMembers.length : presentMemberIds.length;
    const perPresentMeal = presentCount > 0 ? mealTotal / presentCount : 0;
    const perMemberGrocery = groceryTotal / memberCount;
    const billTotal = mealTotal + groceryTotal;

    return {
      mealTotal,
      groceryTotal,
      billTotal,
      presentCount,
      perPresentMeal,
      perMemberGrocery,
      hasRowAmounts,
    };
  }, [houseExpItems, houseExpAmount, houseExpCategory, houseMembers.length, presentMemberIds.length]);

  const handleSaveHouseExpense = (e) => {
    e.preventDefault();
    if (!canEditHouseInRoomMode) return;

    const numericAmt = housePreview.billTotal;
    if (!numericAmt || numericAmt <= 0) {
      showToast('Please enter a valid house expense amount.', 'error');
      return;
    }

    const targetIds =
      houseExpCategory === 'Groceries' ? houseMembers.map((m) => m.id) : presentMemberIds;

    if (housePreview.mealTotal > 0 && targetIds.length === 0) {
      showToast('Select at least 1 present member for Meal expense.', 'error');
      return;
    }

    const normalizedItems = housePreview.hasRowAmounts
      ? houseExpItems
          .filter((r) => parseFloat(r.amount) > 0)
          .map((r) => ({
            id: r.id,
            name: r.name.trim(),
            amount: parseFloat(r.amount) || 0,
            category: r.category || 'Custom',
            splitType: r.splitType || (houseExpCategory === 'Groceries' ? 'Grocery' : 'Meal'),
          }))
      : [
          {
            id: `hitem-${Date.now()}`,
            name:
              houseExpDetail.trim() ||
              (houseExpCategory === 'Groceries'
                ? 'House Groceries'
                : `${houseExpMeals.join(', ')} Mess`),
            amount: numericAmt,
            category: houseExpCategory === 'Groceries' ? 'Custom' : 'Roti/Naan',
            splitType: houseExpCategory === 'Groceries' ? 'Grocery' : 'Meal',
          },
        ];

    const newSplits = {};
    houseMembers.forEach((m) => {
      const inMeal = housePreview.mealTotal > 0 && targetIds.includes(m.id);
      const share =
        (inMeal ? housePreview.perPresentMeal : 0) + housePreview.perMemberGrocery;
      newSplits[m.id] = share;
    });

    const mealLabel = isMultiMealMode ? houseExpMeals.join(', ') : 'Dinner';
    const baseMembers = editingHouseExpId
      ? houseMembers.map((m) => {
          const oldExp = houseExpenses.find((x) => x.id === editingHouseExpId);
          const refunded = oldExp?.splits ? Number(oldExp.splits[m.id] || 0) : 0;
          return { ...m, balance: Number(m.balance || 0) + refunded };
        })
      : houseMembers;

    const updatedMembers = baseMembers.map((m) => ({
      ...m,
      balance: Number(m.balance || 0) - (newSplits[m.id] || 0),
    }));

    const recordPayload = {
      id: editingHouseExpId || `hexp-${Date.now()}`,
      date: houseExpDate,
      category: houseExpCategory,
      mealType: mealLabel,
      meals: houseExpCategory === 'Meal' ? houseExpMeals : [],
      detail:
        houseExpDetail.trim() ||
        normalizedItems.map((i) => i.name || i.category).filter(Boolean).join(', ') ||
        (houseExpCategory === 'Groceries' ? 'House Groceries' : `${mealLabel} Mess`),
      amount: numericAmt,
      items: normalizedItems,
      splitMode:
        houseExpCategory === 'Groceries'
          ? `All ${houseMembers.length} Members`
          : 'Present Members Only',
      participantIds: targetIds,
      perHead:
        housePreview.mealTotal > 0 && housePreview.groceryTotal === 0
          ? housePreview.perPresentMeal
          : housePreview.groceryTotal > 0 && housePreview.mealTotal === 0
          ? housePreview.perMemberGrocery
          : housePreview.perPresentMeal + housePreview.perMemberGrocery,
      splits: newSplits,
      calcSnapshot: {
        mealTotal: housePreview.mealTotal,
        groceryTotal: housePreview.groceryTotal,
        billTotal: housePreview.billTotal,
        presentCount: targetIds.length,
        perPresentMeal: housePreview.perPresentMeal,
        perMemberGrocery: housePreview.perMemberGrocery,
      },
    };

    setHouseMembers(updatedMembers);
    if (editingHouseExpId) {
      setHouseExpenses((prev) =>
        prev.map((item) => (item.id === editingHouseExpId ? recordPayload : item))
      );
      setEditingHouseExpId(null);
      showToast('House expense updated & member balances adjusted.');
    } else {
      setHouseExpenses((prev) => [recordPayload, ...prev]);
      showToast(`Saved ${formatPKR(numericAmt)} and updated all ${houseMembers.length} balances.`);
    }

    setHouseExpDetail('');
    setHouseExpAmount('');
    setHouseExpItems([
      {
        id: `hitem-${Date.now()}`,
        name: '',
        amount: '',
        category: messCategories[0] || 'Vegetables',
        splitType: 'Meal',
      },
    ]);
    setHouseExpCategory('Meal');
    setHouseExpMeals(['Dinner']);
  };

  const startEditHouseExpense = (exp) => {
    if (!canEditHouseInRoomMode) return;
    setEditingHouseExpId(exp.id);
    setHouseExpDate(exp.date);
    setHouseExpCategory(exp.category || 'Meal');
    setHouseExpMeals(exp.meals && exp.meals.length ? exp.meals : ['Dinner']);
    setIsMultiMealMode(Boolean(exp.meals && exp.meals.length > 0 && exp.mealType !== 'Dinner'));
    setHouseExpDetail(exp.detail || '');
    setHouseExpAmount(String(exp.amount || ''));
    if (Array.isArray(exp.items) && exp.items.length > 0) {
      setHouseExpItems(
        exp.items.map((it, idx) => ({
          id: it.id || `hitem-edit-${idx}`,
          name: it.name || '',
          amount: String(it.amount ?? ''),
          category: it.category || 'Custom',
          splitType: it.splitType || (exp.category === 'Groceries' ? 'Grocery' : 'Meal'),
        }))
      );
    }
    if (exp.participantIds) setPresentMemberIds(exp.participantIds);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHouseExpense = (exp) => {
    if (!canEditHouseInRoomMode) return;
    if (exp.splits) {
      setHouseMembers((prev) =>
        prev.map((m) => ({
          ...m,
          balance: Number(m.balance || 0) + Number(exp.splits[m.id] || 0),
        }))
      );
    }
    setHouseExpenses((prev) => prev.filter((item) => item.id !== exp.id));
    if (editingHouseExpId === exp.id) {
      setEditingHouseExpId(null);
      setHouseExpDetail('');
      setHouseExpAmount('');
    }
    showToast('House expense deleted & amounts refunded to members.');
  };

  const copyHouseBillWhatsApp = (exp) => {
    const memberCount = Math.max(houseMembers.length, 1);
    const snap = exp.calcSnapshot || {
      mealTotal: exp.category === 'Groceries' ? 0 : Number(exp.amount || 0),
      groceryTotal: exp.category === 'Groceries' ? Number(exp.amount || 0) : 0,
      billTotal: Number(exp.amount || 0),
      presentCount: exp.participantIds?.length || memberCount,
      perPresentMeal: exp.category === 'Groceries' ? 0 : Number(exp.perHead || 0),
      perMemberGrocery: exp.category === 'Groceries' ? Number(exp.perHead || 0) : 0,
    };
    const itemsList =
      Array.isArray(exp.items) && exp.items.length > 0
        ? exp.items
        : [{ category: exp.category, name: exp.detail, amount: exp.amount, splitType: exp.category === 'Groceries' ? 'Grocery' : 'Meal' }];

    let text = `*MessMate Bill Summary*\n📅 ${formatDateDisplay(exp.date)} | 🍽️ ${exp.mealType || 'Dinner'}\n\n*Items:*\n`;
    itemsList.forEach((it) => {
      const icon = it.splitType === 'Grocery' ? '🛒' : '🍛';
      const note = it.name ? ` (${it.name})` : '';
      text += `${icon} ${it.category}${note}: Rs.${formatMoney(it.amount)}\n`;
    });
    text += `\n*Calculation:*\n`;
    text += `Total Meal: Rs.${formatMoney(snap.mealTotal)} (÷ ${snap.presentCount} present) = Rs.${Math.round(snap.perPresentMeal)}/head\n`;
    text += `Total Grocery: Rs.${formatMoney(snap.groceryTotal)} (÷ ${memberCount} all) = Rs.${Math.round(snap.perMemberGrocery)}/head\n`;
    text += `Total Bill: *Rs.${formatMoney(snap.billTotal)}*\n\n`;
    text += `*Per Person Charge:*\n`;
    text += `Present members pay: *Rs.${Math.round(snap.perPresentMeal + snap.perMemberGrocery)}*\n`;
    text += `Absent members pay: *Rs.${Math.round(snap.perMemberGrocery)}*\n`;

    const absentees = houseMembers.filter((m) => !(exp.participantIds || []).includes(m.id)).map((m) => m.name);
    if (exp.category !== 'Groceries' && absentees.length > 0) {
      text += `\n*Absentees:* ${absentees.join(', ')}\n`;
    }
    text += `\n_Generated by MessMate_`;
    copyTextValue(`wa-${exp.id}`, text);
  };

  const copyHouseBalancesWhatsApp = () => {
    let text = `*MessMate Status Update*\nTotal Pool: ${formatPKR(houseStats.totalCollectedPool)}\nNet Remaining: ${formatPKR(houseStats.creditRemaining)}\n\n*Member Balances:*\n`;
    houseMembers.forEach((m) => {
      const bal = Number(m.balance || 0);
      const flag = bal < 0 ? '🔴' : bal < 200 ? '🟡' : '🟢';
      text += `${flag} ${m.name}: ${formatPKR(Math.round(bal))}\n`;
    });
    copyTextValue('wa-balances', text);
  };

  const sortedEntries = useMemo(() => {
    return [...entries]
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.details.toLowerCase().includes(q) ||
          item.date.includes(q) ||
          (item.attachments || []).some((a) => a.name.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, searchQuery]);

  const pinnedNotes = useMemo(() => notes.filter((n) => n.pinned), [notes]);
  const stickyNotes = useMemo(() => notes.filter((n) => !n.pinned), [notes]);
  const selectedEntry = useMemo(
    () => entries.find((e) => e.id === selectedEntryId) || null,
    [entries, selectedEntryId]
  );

  const buildFullPayload = () => ({
    version: 7,
    exportedAt: new Date().toISOString(),
    theme,
    headerMeta,
    tabOrder,
    customTabLabels,
    entries,
    notes,
    roughNotes,
    todos,
    infoCards,
    personalWallet,
    personalExpenses,
    houseMembers,
    houseExpenses,
    houseDeposits,
    messCategories,
    houseRulesText,
    allowedStandardUsers,
    roomKey,
    roomCanEdit,
  });

  const applyImportedPayload = (parsed) => {
    if (!isAdminAuthenticated) return;
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid backup data');
    if (parsed.theme === 'dark' || parsed.theme === 'light') setTheme(parsed.theme);
    if (parsed.headerMeta?.title) setHeaderMeta(parsed.headerMeta);
    if (Array.isArray(parsed.tabOrder)) setTabOrder(parsed.tabOrder);
    if (parsed.customTabLabels && typeof parsed.customTabLabels === 'object') {
      setCustomTabLabels(parsed.customTabLabels);
    }
    if (Array.isArray(parsed.entries)) setEntries(parsed.entries);
    if (Array.isArray(parsed.notes)) setNotes(parsed.notes);
    if (Array.isArray(parsed.roughNotes)) setRoughNotes(parsed.roughNotes);
    if (Array.isArray(parsed.todos)) setTodos(parsed.todos);
    if (Array.isArray(parsed.infoCards)) setInfoCards(parsed.infoCards);
    if (parsed.personalWallet) setPersonalWallet(parsed.personalWallet);
    if (Array.isArray(parsed.personalExpenses)) setPersonalExpenses(parsed.personalExpenses);
    if (Array.isArray(parsed.houseMembers)) setHouseMembers(parsed.houseMembers);
    if (Array.isArray(parsed.houseExpenses)) setHouseExpenses(parsed.houseExpenses);
    if (Array.isArray(parsed.houseDeposits)) setHouseDeposits(parsed.houseDeposits);
    if (Array.isArray(parsed.messCategories)) setMessCategories(parsed.messCategories);
    if (typeof parsed.houseRulesText === 'string') setHouseRulesText(parsed.houseRulesText);
    if (Array.isArray(parsed.allowedStandardUsers)) {
      setAllowedStandardUsers(parsed.allowedStandardUsers);
    }
    if (parsed.roomKey) setRoomKey(parsed.roomKey);
    if (typeof parsed.roomCanEdit === 'boolean') setRoomCanEdit(parsed.roomCanEdit);
  };

  const handleExportJSON = () => {
    if (!isAdminAuthenticated) return;
    const payload = buildFullPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wa-vault-backup-${getTodayStr()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Backup file downloaded!');
  };

  const handleCopySyncCode = () => {
    if (!isAdminAuthenticated) return;
    const payload = buildFullPayload();
    const jsonStr = JSON.stringify(payload);
    navigator.clipboard?.writeText(jsonStr);
    showToast('Sync Code copied! Paste it into your new mobile.');
  };

  const handleRestoreFromSyncCode = () => {
    if (!isAdminAuthenticated) return;
    if (!syncCodeInput.trim()) {
      showToast('Paste your Sync Code first.', 'error');
      return;
    }
    try {
      const parsed = JSON.parse(syncCodeInput.trim());
      applyImportedPayload(parsed);
      setSyncCodeInput('');
      showToast('All data restored to this device!');
    } catch {
      showToast('Invalid Sync Code format.', 'error');
    }
  };

  const handleImportJSON = (e) => {
    if (!isAdminAuthenticated) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        applyImportedPayload(parsed);
        showToast('All mobile data restored successfully!');
      } catch {
        showToast('Invalid backup file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetAllData = () => {
    if (!isAdminAuthenticated) return;
    setEntries([]);
    setNotes([]);
    setRoughNotes([]);
    setTodos([]);
    setInfoCards([]);
    setPersonalWallet({ initialCash: 0, initialAccount: 0 });
    setPersonalExpenses([]);
    setHouseExpenses([]);
    setHouseDeposits([]);
    setHouseMembers(
      Array.from({ length: 8 }, (_, idx) => ({
        id: `member-${idx + 1}`,
        name: `Member ${idx + 1}`,
        balance: 1000,
      }))
    );
    setConfirmReset(false);
    showToast('All workspace records cleared.');
  };

  const totalPdfsCount = useMemo(
    () => entries.reduce((acc, e) => acc + (e.attachments?.length || 0), 0),
    [entries]
  );

  const visibleTabs = useMemo(() => {
    if (isPublicOrRoommateLocked) {
      return [TAB_CATALOG.house];
    }
    return tabOrder.map((id) => TAB_CATALOG[id]).filter(Boolean);
  }, [isPublicOrRoommateLocked, tabOrder]);

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden font-sans transition-colors duration-300 ${
        isDark
          ? 'bg-slate-950 text-slate-100 selection:bg-emerald-400/30 selection:text-emerald-100'
          : 'bg-slate-100 text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-950'
      }`}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {isDark ? (
          <>
            <div className="absolute -top-32 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-[130px]" />
            <div className="absolute top-1/4 -right-28 w-[28rem] h-[28rem] bg-indigo-500/20 rounded-full blur-[140px]" />
            <div className="absolute bottom-0 left-1/3 w-[30rem] h-[30rem] bg-cyan-500/15 rounded-full blur-[150px]" />
          </>
        ) : (
          <>
            <div className="absolute -top-32 -left-24 w-96 h-96 bg-emerald-300/35 rounded-full blur-[120px]" />
            <div className="absolute top-1/4 -right-28 w-[28rem] h-[28rem] bg-sky-300/35 rounded-full blur-[130px]" />
            <div className="absolute bottom-0 left-1/3 w-[30rem] h-[30rem] bg-indigo-200/40 rounded-full blur-[140px]" />
          </>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl backdrop-blur-xl shadow-2xl border text-sm font-medium ${
            toast.type === 'error'
              ? isDark
                ? 'bg-rose-950/85 border-rose-400/40 text-rose-100'
                : 'bg-rose-50/95 border-rose-300 text-rose-900'
              : isDark
              ? 'bg-slate-900/85 border-emerald-400/40 text-emerald-100'
              : 'bg-white/95 border-emerald-300 text-emerald-950'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {showRoomLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`${glassCard} w-full max-w-md rounded-3xl p-6 space-y-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <h3 className={`font-bold text-base ${textPrimary}`}>Enter 8-Friends Mess Key</h3>
              </div>
              <button
                onClick={() => setShowRoomLoginModal(false)}
                className={`p-1.5 rounded-xl ${textMuted}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className={`text-xs leading-relaxed ${textSecondary}`}>
              Enter the <strong>Mess Key</strong> shared by the admin to view the live <strong>8-Friends Mess</strong> status as a read-only user.
            </p>
            <form onSubmit={handleEnterRoommateMode} className="space-y-3">
              <input
                type="text"
                placeholder="e.g., ROOM-724Y-XBQN"
                value={roomKeyLoginInput}
                onChange={(e) => setRoomKeyLoginInput(e.target.value)}
                required
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-mono uppercase ${glassInput}`}
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm"
              >
                Load Mess Status
              </button>
            </form>
          </div>
        </div>
      )}

      {previewPdf && isAdminAuthenticated && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div
            className={`w-full max-w-5xl h-[88vh] rounded-3xl flex flex-col overflow-hidden border shadow-2xl ${
              isDark ? 'bg-slate-900/95 border-white/20' : 'bg-white border-slate-300'
            }`}
          >
            <div
              className={`flex items-center justify-between px-5 py-3.5 border-b ${
                isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                <span className={`font-semibold text-sm truncate ${textPrimary}`}>
                  {previewPdf.name}
                </span>
                <span className={`text-xs hidden sm:inline ${textMuted}`}>
                  ({formatBytes(previewPdf.size)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdf.dataUrl}
                  download={previewPdf.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-500 text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  onClick={() => setPreviewPdf(null)}
                  className={`p-1.5 rounded-xl ${
                    isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-950">
              <iframe
                src={previewPdf.dataUrl}
                title={previewPdf.name}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      <header
        className={`sticky top-0 z-30 backdrop-blur-2xl border-b transition-colors ${
          isDark
            ? 'bg-slate-950/65 border-white/10'
            : 'bg-white/75 border-slate-200/90 shadow-sm shadow-slate-200/40'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <WALogo theme={theme} onClick={toggleTheme} />
            {isEditingHeader && isAdminAuthenticated ? (
              <form onSubmit={saveHeaderMeta} className="flex flex-wrap items-center gap-1.5">
                <input
                  type="text"
                  value={tempHeaderTitle}
                  onChange={(e) => setTempHeaderTitle(e.target.value)}
                  placeholder="Workspace Name"
                  className={`px-2.5 py-1 rounded-lg text-sm font-bold ${glassInput}`}
                  autoFocus
                />
                <input
                  type="text"
                  value={tempHeaderSubtitle}
                  onChange={(e) => setTempHeaderSubtitle(e.target.value)}
                  placeholder="Subtitle"
                  className={`px-2.5 py-1 rounded-lg text-xs ${glassInput}`}
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingHeader(false)}
                  className={`p-1.5 rounded-lg ${glassSubCard} ${textSecondary}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="group flex items-center gap-2 min-w-0">
                <div className="min-w-0">
                  <h1
                    className={`font-bold text-base sm:text-lg tracking-tight leading-tight truncate ${textPrimary}`}
                  >
                    {isPublicOrRoommateLocked ? getTabLabel('house') : headerMeta.title}
                  </h1>
                  <p className={`text-[11px] truncate ${textMuted}`}>
                    {isPublicOrRoommateLocked
                      ? verifiedStandardUser
                        ? `User: ${verifiedStandardUser} (Read-Only User)`
                        : roommateModeKey
                        ? `Key: ${roommateModeKey} (Read-Only Mess View)`
                        : 'Enter Mess Key to view shared status'
                      : headerMeta.subtitle}
                  </p>
                </div>
                {isAdminAuthenticated && (
                  <button
                    onClick={startEditingHeader}
                    title="Rename Workspace"
                    className={`opacity-50 group-hover:opacity-100 p-1 rounded-lg transition-all ${
                      isDark
                        ? 'hover:bg-white/10 text-slate-300'
                        : 'hover:bg-slate-200/70 text-slate-500'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPublicOrRoommateLocked ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRoomLoginModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-500 text-xs font-semibold"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{roommateModeKey ? 'Change Key' : 'Enter Key'}</span>
                </button>
                <button
                  onClick={handleGoogleSignIn}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${glassSubCard} text-xs font-medium ${textSecondary} hover:text-emerald-500`}
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Admin Sign In</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('settings')}
                title="Cloud Synced"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-500 text-[11px] font-semibold"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Admin Synced</span>
              </button>
            )}
          </div>
        </div>

        <div
          className={`border-t ${
            isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-200/60 bg-slate-50/50'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {visibleTabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = isPublicOrRoommateLocked ? true : activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  draggable={isAdminAuthenticated}
                  onDragStart={() => isAdminAuthenticated && handleTabDragStart(tab.id)}
                  onDragOver={(e) => isAdminAuthenticated && handleTabDragOver(e, tab.id)}
                  onDragEnd={handleTabDragEnd}
                  onClick={() => {
                    if (isPublicOrRoommateLocked) {
                      setActiveTab('house');
                      return;
                    }
                    setActiveTab(tab.id);
                    if (tab.id !== 'index') setSelectedEntryId(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white border border-transparent'
                  }`}
                >
                  <IconComponent className="w-4 h-4 shrink-0" />
                  <span>{getTabLabel(tab.id)}</span>
                  {isPublicOrRoommateLocked && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-950/20 text-[10px] font-bold">
                      Read Only User
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isAdminAuthenticated && activeTab === 'daily' && (
          <div className="space-y-6">
            <div className={`${glassCard} rounded-3xl p-5 sm:p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`font-semibold text-base sm:text-lg flex items-center gap-2 ${textPrimary}`}>
                  {editingEntryId ? (
                    <>
                      <Edit3 className="w-5 h-5 text-amber-500" /> Edit Work Record
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-emerald-500" /> Add Daily Activity & Work Detail
                    </>
                  )}
                </h2>
                {editingEntryId && (
                  <button
                    onClick={() => {
                      setEditingEntryId(null);
                      setEntryTitle('');
                      setEntryDetails('');
                      setEntryAttachments([]);
                      setEntryDate(getTodayStr());
                    }}
                    className={`text-xs flex items-center gap-1 ${textMuted} hover:underline`}
                  >
                    <X className="w-3.5 h-3.5" /> Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveEntry} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>Date</label>
                    <input
                      type="date"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm ${glassInput}`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>
                      Main Topic / Day Headline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Lab Calibration & Circuit Testing Summary"
                      value={entryTitle}
                      onChange={(e) => setEntryTitle(e.target.value)}
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm ${glassInput}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>
                    Work Done & Detailed Information
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Document what you worked on today, technical observations, outcomes, or reference notes..."
                    value={entryDetails}
                    onChange={(e) => setEntryDetails(e.target.value)}
                    required
                    className={`w-full px-4 py-3 rounded-2xl text-sm leading-relaxed ${glassInput}`}
                  />
                </div>

                <div className={`${glassSubCard} rounded-2xl p-4`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-emerald-500" />
                      <span className={`text-xs font-semibold ${textPrimary}`}>
                        Attach PDF Documents (Up to 25 MB/file)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-xs font-medium text-emerald-500 transition-colors"
                    >
                      <FileUp className="w-3.5 h-3.5" /> Choose PDF
                    </button>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      multiple
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                  </div>

                  {entryAttachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entryAttachments.map((att) => (
                        <div
                          key={att.id}
                          className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl text-xs border ${
                            isDark
                              ? 'bg-slate-950/60 border-white/15 text-slate-200'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="max-w-[180px] truncate font-medium">{att.name}</span>
                          <span className={textMuted}>({formatBytes(att.size)})</span>
                          <button
                            type="button"
                            onClick={() => setPreviewPdf(att)}
                            className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDraftAttachment(att.id)}
                            className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                      editingEntryId
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20'
                        : 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-emerald-500/25'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {editingEntryId ? 'Update Record' : 'Save Daily Record'}
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className={`text-sm font-semibold uppercase tracking-wider ${textSecondary}`}>
                  Work Records ({sortedEntries.length})
                </h3>
                <div className="relative w-full sm:w-72">
                  <Search
                    className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`}
                  />
                  <input
                    type="text"
                    placeholder="Filter work logs or PDFs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs ${glassInput}`}
                  />
                </div>
              </div>

              {sortedEntries.length === 0 ? (
                <div className={`${glassCard} rounded-3xl p-10 text-center`}>
                  <p className={`text-sm ${textMuted}`}>
                    No work records found. Add your first daily activity above.
                  </p>
                </div>
              ) : (
                sortedEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className={`${glassCard} rounded-3xl p-5 sm:p-6 transition-all`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/15 border border-emerald-400/25 px-3 py-1 rounded-full mb-2">
                          <Calendar className="w-3.5 h-3.5" /> {formatDateDisplay(entry.date)}
                        </span>
                        <h4 className={`text-lg font-bold ${textPrimary}`}>{entry.title}</h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEditEntry(entry)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl ${glassSubCard} hover:text-amber-500 text-xs font-medium transition-colors ${textSecondary}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl ${glassSubCard} hover:text-rose-500 text-xs font-medium transition-colors ${textSecondary}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>

                    <div className={`text-sm whitespace-pre-line leading-relaxed ${textSecondary}`}>
                      {entry.details}
                    </div>

                    {entry.attachments && entry.attachments.length > 0 && (
                      <div
                        className={`mt-4 pt-3.5 border-t ${
                          isDark ? 'border-white/10' : 'border-slate-200'
                        }`}
                      >
                        <p
                          className={`text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${textMuted}`}
                        >
                          <Paperclip className="w-3 h-3 text-emerald-500" /> Attached PDFs (
                          {entry.attachments.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {entry.attachments.map((att) => (
                            <div
                              key={att.id}
                              className={`inline-flex items-center gap-2 ${glassSubCard} rounded-xl px-3 py-1.5 text-xs`}
                            >
                              <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className={`font-medium max-w-[180px] truncate ${textPrimary}`}>
                                {att.name}
                              </span>
                              <button
                                onClick={() => setPreviewPdf(att)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-500 font-medium"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
                              <a
                                href={att.dataUrl}
                                download={att.name}
                                className={`p-1 rounded-lg ${textMuted} hover:text-emerald-500`}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        )}

        {isAdminAuthenticated && activeTab === 'index' && (
          <div>
            {selectedEntry ? (
              <div className={`${glassCard} rounded-3xl p-6 sm:p-8`}>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-white/10">
                  <button
                    onClick={() => setSelectedEntryId(null)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${glassSubCard} text-xs font-medium ${textPrimary}`}
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to All Topics
                  </button>
                  <button
                    onClick={() => startEditEntry(selectedEntry)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit This Day
                  </button>
                </div>

                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/15 border border-emerald-400/25 px-3 py-1 rounded-full mb-2">
                    <Calendar className="w-3.5 h-3.5" /> {formatDateDisplay(selectedEntry.date)}
                  </span>
                  <h2 className={`text-2xl font-bold mt-1 ${textPrimary}`}>{selectedEntry.title}</h2>
                </div>

                <div
                  className={`${glassSubCard} rounded-2xl p-5 text-sm sm:text-base whitespace-pre-line leading-relaxed ${textSecondary}`}
                >
                  {selectedEntry.details}
                </div>

                {selectedEntry.attachments && selectedEntry.attachments.length > 0 && (
                  <div className="mt-6">
                    <h3
                      className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${textSecondary}`}
                    >
                      <Paperclip className="w-3.5 h-3.5 text-emerald-500" /> Attached Documents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedEntry.attachments.map((att) => (
                        <div
                          key={att.id}
                          className={`flex items-center justify-between gap-3 ${glassSubCard} rounded-2xl p-3.5`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${textPrimary}`}>
                                {att.name}
                              </p>
                              <p className={`text-[11px] ${textMuted}`}>{formatBytes(att.size)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setPreviewPdf(att)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-semibold"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open
                            </button>
                            <a
                              href={att.dataUrl}
                              download={att.name}
                              className={`p-1.5 rounded-xl ${glassSubCard} ${textSecondary}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={`${glassCard} rounded-3xl overflow-hidden`}>
                <div
                  className={`p-5 sm:p-6 border-b flex flex-wrap items-center justify-between gap-3 ${
                    isDark ? 'border-white/10' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <h2 className={`font-bold text-lg ${textPrimary}`}>Daily Main Topic Index</h2>
                    <p className={`text-xs mt-0.5 ${textMuted}`}>
                      Click any day&apos;s Main Topic Title to open the complete write-up and PDFs.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/15 border border-emerald-400/25 px-3 py-1 rounded-full">
                    {sortedEntries.length} Days Logged
                  </span>
                </div>

                {sortedEntries.length === 0 ? (
                  <div className={`p-10 text-center text-sm ${textMuted}`}>
                    No topics indexed yet.
                  </div>
                ) : (
                  <div className={`divide-y ${isDark ? 'divide-white/10' : 'divide-slate-200'}`}>
                    {sortedEntries.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedEntryId(item.id)}
                        className={`w-full text-left px-5 sm:px-6 py-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 group ${
                          isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-900/[0.03]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                          <span className="text-xs font-mono font-semibold text-emerald-500 bg-emerald-500/15 border border-emerald-400/25 px-3 py-1 rounded-lg w-fit shrink-0">
                            {formatDateDisplay(item.date)}
                          </span>
                          <span
                            className={`font-semibold text-sm sm:text-base group-hover:text-emerald-500 transition-colors truncate ${textPrimary}`}
                          >
                            {item.title}
                          </span>
                          {item.attachments && item.attachments.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-500 bg-rose-500/15 border border-rose-400/25 px-2.5 py-0.5 rounded-full w-fit shrink-0">
                              <Paperclip className="w-3 h-3" /> {item.attachments.length} PDF
                            </span>
                          )}
                        </div>
                        <span className={`text-xs group-hover:text-emerald-500 shrink-0 ${textMuted}`}>
                          View Details →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isAdminAuthenticated && activeTab === 'rough' && (
          <div className="space-y-6">
            <div className={`${glassCard} rounded-3xl p-5 sm:p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className={`font-bold text-lg flex items-center gap-2 ${textPrimary}`}>
                    <ScrollText className="w-5 h-5 text-cyan-500" />
                    {editingRoughId ? 'Edit Rough Summary & Details' : 'Rough Summary & Scratchpad'}
                  </h2>
                  <p className={`text-xs mt-0.5 ${textMuted}`}>
                    Capture rough summaries, raw outlines, field observations, and extra working details.
                  </p>
                </div>
                {editingRoughId && (
                  <button
                    onClick={() => {
                      setEditingRoughId(null);
                      setRoughTitle('');
                      setRoughSummary('');
                      setRoughDetails('');
                    }}
                    className={`text-xs flex items-center gap-1 ${textMuted} hover:underline`}
                  >
                    <X className="w-3.5 h-3.5" /> Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveRoughNote} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>
                      Title / Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Site Observation Rough Draft"
                      value={roughTitle}
                      onChange={(e) => setRoughTitle(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm ${glassInput}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>
                      Tag / Category
                    </label>
                    <select
                      value={roughTag}
                      onChange={(e) => setRoughTag(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm ${glassInput}`}
                    >
                      {ROUGH_TAGS.map((t) => (
                        <option
                          key={t}
                          value={t}
                          className={isDark ? 'bg-slate-900' : 'bg-white'}
                        >
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>
                    Rough Summary (Key Takeaway / Quick Gist)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Write a quick rough summary or main takeaway..."
                    value={roughSummary}
                    onChange={(e) => setRoughSummary(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-2xl text-sm ${glassInput}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>
                    Other Details & Full Scratchpad
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Dump all raw details, numbers, rough steps, links, or unstructured thoughts here..."
                    value={roughDetails}
                    onChange={(e) => setRoughDetails(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl text-sm leading-relaxed ${glassInput}`}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg ${
                      editingRoughId
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                        : 'bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {editingRoughId ? 'Update Rough Note' : 'Save Rough Note'}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {['All', ...ROUGH_TAGS].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setRoughFilter(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      roughFilter === tag
                        ? 'bg-cyan-500 text-slate-950'
                        : `${glassSubCard} ${textSecondary}`
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <span className={`text-xs ${textMuted}`}>{filteredRoughNotes.length} saved notes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRoughNotes.length === 0 ? (
                <div className={`md:col-span-2 ${glassCard} rounded-3xl p-10 text-center text-sm ${textMuted}`}>
                  No rough notes yet. Add a rough summary and details above.
                </div>
              ) : (
                filteredRoughNotes.map((item) => (
                  <div
                    key={item.id}
                    className={`${glassCard} rounded-3xl p-5 flex flex-col justify-between gap-4`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-500">
                            {item.tag}
                          </span>
                          {item.pinned && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-500 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" /> Pinned
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleRoughPin(item.id)}
                            title={item.pinned ? 'Unpin' : 'Pin to Top'}
                            className={`p-1.5 rounded-lg ${
                              item.pinned ? 'text-amber-500' : textMuted
                            }`}
                          >
                            <Star className={`w-4 h-4 ${item.pinned ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() =>
                              copyTextValue(
                                item.id,
                                `${item.title}
Summary: ${item.summary}

Details:
${item.details}`
                              )
                            }
                            title="Copy All"
                            className={`p-1.5 rounded-lg ${textMuted} hover:text-emerald-500`}
                          >
                            {copiedId === item.id ? (
                              <ClipboardCheck className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => duplicateRough(item)}
                            title="Duplicate Note"
                            className={`p-1.5 rounded-lg ${textMuted} hover:text-cyan-500`}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startEditRough(item)}
                            title="Edit"
                            className={`p-1.5 rounded-lg ${textMuted} hover:text-amber-500`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRough(item.id)}
                            title="Delete"
                            className={`p-1.5 rounded-lg ${textMuted} hover:text-rose-500`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className={`text-base font-bold mb-2 ${textPrimary}`}>{item.title}</h3>

                      {item.summary && (
                        <div className="mb-3 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-cyan-500 mb-1">
                            Rough Summary
                          </span>
                          <p className={`text-xs sm:text-sm leading-relaxed ${textPrimary}`}>
                            {item.summary}
                          </p>
                        </div>
                      )}

                      {item.details && (
                        <div>
                          <span
                            className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${textMuted}`}
                          >
                            Other Details
                          </span>
                          <p className={`text-xs sm:text-sm whitespace-pre-line leading-relaxed ${textSecondary}`}>
                            {item.details}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {isAdminAuthenticated && activeTab === 'sticky' && (
          <div className="space-y-6">
            <div className={`${glassCard} rounded-3xl p-5 sm:p-6`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`font-semibold text-base flex items-center gap-2 ${textPrimary}`}>
                  <StickyNote className="w-5 h-5 text-amber-500" />
                  {editingNoteId ? 'Edit Sticky / Important Note' : 'Create Sticky or Important Note'}
                </h2>
                {editingNoteId && (
                  <button
                    onClick={() => {
                      setEditingNoteId(null);
                      setNoteText('');
                    }}
                    className={`text-xs ${textMuted}`}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveNote} className="space-y-4">
                <textarea
                  rows={3}
                  placeholder="Write a quick sticky reminder or pin a permanent important note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl text-sm ${glassInput}`}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Palette className={`w-4 h-4 ${textMuted}`} />
                    {Object.entries(NOTE_THEMES).map(([key, val]) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setNoteColor(key)}
                        className={`w-6 h-6 rounded-full ${val.dot} transition-transform ${
                          noteColor === key
                            ? 'scale-125 ring-2 ring-emerald-400'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <label className={`inline-flex items-center gap-2 text-xs font-medium cursor-pointer ${textSecondary}`}>
                      <input
                        type="checkbox"
                        checked={noteIsPinned}
                        onChange={(e) => setNoteIsPinned(e.target.checked)}
                        className="rounded accent-emerald-400 w-4 h-4"
                      />
                      <Pin className="w-3.5 h-3.5 text-amber-500" /> Mark as Important
                    </label>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-semibold text-xs sm:text-sm"
                    >
                      <Check className="w-4 h-4" /> {editingNoteId ? 'Update Note' : 'Add Note'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {pinnedNotes.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 mb-3">
                  <Pin className="w-4 h-4" /> Important & Pinned Notes ({pinnedNotes.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinnedNotes.map((note) => {
                    const c = NOTE_THEMES[note.color] || NOTE_THEMES.amber;
                    return (
                      <div
                        key={note.id}
                        className={`rounded-3xl p-5 border backdrop-blur-xl ${
                          isDark ? c.dark : c.light
                        } flex flex-col justify-between gap-4`}
                      >
                        <p className="text-sm whitespace-pre-line leading-relaxed">{note.text}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-current/15 text-xs">
                          <span className="font-semibold text-amber-500 flex items-center gap-1">
                            <Pin className="w-3 h-3" /> Important
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => toggleNotePin(note.id)}
                              className="px-2 py-1 rounded-lg bg-current/10"
                            >
                              Unpin
                            </button>
                            <button
                              onClick={() => startEditNote(note)}
                              className="p-1.5 rounded-lg bg-current/10"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1.5 rounded-lg bg-current/10 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${textSecondary}`}>
                Quick Sticky Notes ({stickyNotes.length})
              </h3>
              {stickyNotes.length === 0 ? (
                <div className={`${glassCard} rounded-3xl p-8 text-center text-sm ${textMuted}`}>
                  No quick sticky notes yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stickyNotes.map((note) => {
                    const c = NOTE_THEMES[note.color] || NOTE_THEMES.amber;
                    return (
                      <div
                        key={note.id}
                        className={`rounded-3xl p-5 border backdrop-blur-xl ${
                          isDark ? c.dark : c.light
                        } flex flex-col justify-between gap-4`}
                      >
                        <p className="text-sm whitespace-pre-line leading-relaxed">{note.text}</p>
                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-current/15 text-xs">
                          <button
                            onClick={() => toggleNotePin(note.id)}
                            className="p-1.5 rounded-lg bg-current/10"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => startEditNote(note)}
                            className="p-1.5 rounded-lg bg-current/10"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 rounded-lg bg-current/10 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {isAdminAuthenticated && activeTab === 'todo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-5">
              <div className={`${glassCard} rounded-3xl p-5 sm:p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`font-bold text-lg flex items-center gap-2 ${textPrimary}`}>
                    <CheckSquare className="w-5 h-5 text-emerald-500" /> Action To-Do List
                  </h2>
                  <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/15 border border-emerald-400/25 px-3 py-1 rounded-full">
                    {todos.filter((t) => t.completed).length} / {todos.length} Done
                  </span>
                </div>

                <form onSubmit={handleAddTodo} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Add a new task or action item..."
                    value={todoText}
                    onChange={(e) => setTodoText(e.target.value)}
                    required
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm ${glassInput}`}
                  />
                  <div className="flex flex-wrap items-center gap-2.5">
                    <select
                      value={todoPriority}
                      onChange={(e) => setTodoPriority(e.target.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium ${glassInput}`}
                    >
                      <option value="High" className={isDark ? 'bg-slate-900' : 'bg-white'}>
                        High Priority
                      </option>
                      <option value="Medium" className={isDark ? 'bg-slate-900' : 'bg-white'}>
                        Medium Priority
                      </option>
                      <option value="Low" className={isDark ? 'bg-slate-900' : 'bg-white'}>
                        Low Priority
                      </option>
                    </select>
                    <input
                      type="date"
                      value={todoDueDate}
                      onChange={(e) => setTodoDueDate(e.target.value)}
                      className={`px-3 py-2 rounded-xl text-xs ${glassInput}`}
                    />
                    <button
                      type="submit"
                      className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-semibold text-xs"
                    >
                      <Plus className="w-4 h-4" /> Add Task
                    </button>
                  </div>
                </form>

                <div className="flex items-center gap-1.5 mt-5 pt-4 border-t border-white/10">
                  {['all', 'active', 'completed'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setTodoFilter(f)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                        todoFilter === f
                          ? 'bg-emerald-500 text-slate-950'
                          : `${glassSubCard} ${textSecondary}`
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-2.5">
                  {filteredTodos.length === 0 ? (
                    <p className={`text-xs text-center py-6 ${textMuted}`}>No tasks in this view.</p>
                  ) : (
                    filteredTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className={`p-3.5 rounded-2xl border ${
                          todo.completed
                            ? 'bg-emerald-500/10 border-emerald-400/20 opacity-85'
                            : glassSubCard
                        }`}
                      >
                        {editingTodoId === todo.id ? (
                          <div className="space-y-2.5">
                            <input
                              type="text"
                              value={editTodoText}
                              onChange={(e) => setEditTodoText(e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl text-sm ${glassInput}`}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={editTodoPriority}
                                onChange={(e) => setEditTodoPriority(e.target.value)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs ${glassInput}`}
                              >
                                <option value="High" className={isDark ? 'bg-slate-900' : 'bg-white'}>
                                  High
                                </option>
                                <option value="Medium" className={isDark ? 'bg-slate-900' : 'bg-white'}>
                                  Medium
                                </option>
                                <option value="Low" className={isDark ? 'bg-slate-900' : 'bg-white'}>
                                  Low
                                </option>
                              </select>
                              <input
                                type="date"
                                value={editTodoDueDate}
                                onChange={(e) => setEditTodoDueDate(e.target.value)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs ${glassInput}`}
                              />
                              <div className="ml-auto flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => saveEditTodo(todo.id)}
                                  className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingTodoId(null)}
                                  className={`px-2.5 py-1 rounded-lg text-xs ${textMuted}`}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <button
                              onClick={() => toggleTodo(todo.id)}
                              className="flex items-start gap-3 text-left flex-1 min-w-0"
                            >
                              <span
                                className={`w-5 h-5 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 ${
                                  todo.completed
                                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                    : 'border-slate-400'
                                }`}
                              >
                                {todo.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </span>
                              <div className="min-w-0">
                                <p
                                  className={`text-sm font-medium ${
                                    todo.completed ? `line-through ${textMuted}` : textPrimary
                                  }`}
                                >
                                  {todo.text}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                      PRIORITY_STYLES[todo.priority] || PRIORITY_STYLES.Medium
                                    }`}
                                  >
                                    {todo.priority}
                                  </span>
                                  {todo.dueDate && (
                                    <span className={`text-[11px] flex items-center gap-1 ${textMuted}`}>
                                      <Calendar className="w-3 h-3" /> {formatDateDisplay(todo.dueDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditTodo(todo)}
                                className={`p-1.5 rounded-lg ${textMuted} hover:text-amber-500`}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteTodo(todo.id)}
                                className={`p-1.5 rounded-lg ${textMuted} hover:text-rose-500`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-5">
              <div className={`${glassCard} rounded-3xl p-5 sm:p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`font-bold text-lg flex items-center gap-2 ${textPrimary}`}>
                    <ShieldCheck className="w-5 h-5 text-cyan-500" />
                    {editingInfoId ? 'Edit Important Info Card' : 'Important Information Vault'}
                  </h2>
                  {editingInfoId && (
                    <button
                      onClick={() => {
                        setEditingInfoId(null);
                        setInfoTitle('');
                        setInfoContent('');
                      }}
                      className={`text-xs ${textMuted}`}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveInfoCard} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      placeholder="Title (e.g., Bank IBAN, Wi-Fi)"
                      value={infoTitle}
                      onChange={(e) => setInfoTitle(e.target.value)}
                      required
                      className={`sm:col-span-2 px-3.5 py-2.5 rounded-xl text-sm ${glassInput}`}
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={infoCategory}
                      onChange={(e) => setInfoCategory(e.target.value)}
                      className={`px-3.5 py-2.5 rounded-xl text-sm ${glassInput}`}
                    />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Store vital reference numbers, rules, account numbers, or checklists..."
                    value={infoContent}
                    onChange={(e) => setInfoContent(e.target.value)}
                    required
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-sm ${glassInput}`}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 font-semibold text-xs"
                    >
                      <Check className="w-4 h-4" />
                      {editingInfoId ? 'Update Info Card' : 'Save Important Info'}
                    </button>
                  </div>
                </form>

                <div className="mt-5 space-y-3">
                  {infoCards.map((card) => (
                    <div key={card.id} className={`${glassSubCard} rounded-2xl p-4`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-500 bg-cyan-500/15 border border-cyan-400/25 px-2.5 py-0.5 rounded-full">
                            {card.category}
                          </span>
                          <h3 className={`text-sm font-bold mt-1.5 ${textPrimary}`}>{card.title}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyTextValue(card.id, card.content)}
                            className={`p-1.5 rounded-lg ${textMuted} hover:text-emerald-500`}
                          >
                            {copiedId === card.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => startEditInfoCard(card)}
                            className={`p-1.5 rounded-lg ${textMuted} hover:text-amber-500`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteInfoCard(card.id)}
                            className={`p-1.5 rounded-lg ${textMuted} hover:text-rose-500`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className={`text-xs whitespace-pre-line leading-relaxed ${textSecondary}`}>
                        {card.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {isAdminAuthenticated && activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`${glassCard} rounded-3xl p-5`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${textSecondary}`}>Cash Remaining</span>
                  <Banknote className="w-4 h-4 text-emerald-500" />
                </div>
                <div className={`text-2xl font-bold ${textPrimary}`}>
                  {formatMoney(personalTotals.cashRemaining)}
                </div>
                <div className={`mt-2 flex items-center justify-between text-[11px] ${textMuted}`}>
                  <span>Spent: {formatMoney(personalTotals.cashSpent)}</span>
                  <button
                    onClick={() => {
                      setTopUpSource('Cash');
                      setTopUpAmount('');
                    }}
                    className="text-emerald-500 hover:underline font-medium"
                  >
                    + Top Up
                  </button>
                </div>
              </div>

              <div className={`${glassCard} rounded-3xl p-5`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${textSecondary}`}>Account Remaining</span>
                  <CreditCard className="w-4 h-4 text-cyan-500" />
                </div>
                <div className={`text-2xl font-bold ${textPrimary}`}>
                  {formatMoney(personalTotals.accountRemaining)}
                </div>
                <div className={`mt-2 flex items-center justify-between text-[11px] ${textMuted}`}>
                  <span>Spent: {formatMoney(personalTotals.accountSpent)}</span>
                  <button
                    onClick={() => {
                      setTopUpSource('Account');
                      setTopUpAmount('');
                    }}
                    className="text-cyan-500 hover:underline font-medium"
                  >
                    + Top Up
                  </button>
                </div>
              </div>

              <div className={`${glassCard} rounded-3xl p-5`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${textSecondary}`}>Total Spent</span>
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-bold text-rose-500">
                  {formatMoney(personalTotals.totalSpent)}
                </div>
                <div className={`mt-2 text-[11px] ${textMuted}`}>
                  Across {personalExpenses.length} transactions
                </div>
              </div>

              <div className={`${glassCard} rounded-3xl p-5`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${textSecondary}`}>Total Credit Pool</span>
                  <PiggyBank className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-amber-500">
                  {formatMoney(personalTotals.totalRemaining)}
                </div>
                <div className={`mt-2 flex items-center justify-between text-[11px] ${textMuted}`}>
                  <span>Initial: {formatMoney(personalTotals.totalCredit)}</span>
                  <button
                    onClick={() => {
                      setWalletCashInput(String(personalWallet.initialCash));
                      setWalletAccountInput(String(personalWallet.initialAccount));
                      setIsEditingWallet(true);
                    }}
                    className="text-amber-500 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" /> Edit Credits
                  </button>
                </div>
              </div>
            </div>

            {topUpSource && (
              <form
                onSubmit={handleWalletTopUp}
                className={`${glassCard} rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 border-emerald-400/40`}
              >
                <span className={`text-xs sm:text-sm font-medium ${textPrimary}`}>
                  Add Money to <strong className="text-emerald-500">{topUpSource}</strong>:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Amount"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    required
                    className={`w-36 px-3 py-1.5 rounded-xl text-sm ${glassInput}`}
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopUpSource(null)}
                    className={`p-1.5 ${textMuted}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {isEditingWallet && (
              <form
                onSubmit={handleSaveWalletCredits}
                className={`${glassCard} rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-amber-400/40`}
              >
                <span className="text-xs sm:text-sm font-semibold text-amber-500">
                  Edit Base Cash & Account Credits:
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <label className={`text-xs ${textSecondary}`}>Cash:</label>
                    <input
                      type="number"
                      step="any"
                      value={walletCashInput}
                      onChange={(e) => setWalletCashInput(e.target.value)}
                      className={`w-28 px-3 py-1.5 rounded-xl text-sm ${glassInput}`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className={`text-xs ${textSecondary}`}>Account:</label>
                    <input
                      type="number"
                      step="any"
                      value={walletAccountInput}
                      onChange={(e) => setWalletAccountInput(e.target.value)}
                      className={`w-28 px-3 py-1.5 rounded-xl text-sm ${glassInput}`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-semibold text-xs"
                  >
                    Save Credits
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingWallet(false)}
                    className={`p-1.5 ${textMuted}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            <div className={`${glassCard} rounded-3xl p-5 sm:p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`font-semibold text-base sm:text-lg flex items-center gap-2 ${textPrimary}`}>
                  <Receipt className="w-5 h-5 text-emerald-500" />
                  {editingExpId ? 'Edit Personal Expense' : 'Add Personal Daily Expense'}
                </h2>
                {editingExpId && (
                  <button
                    onClick={() => {
                      setEditingExpId(null);
                      setExpDetail('');
                      setExpAmount('');
                    }}
                    className={`text-xs flex items-center gap-1 ${textMuted}`}
                  >
                    <X className="w-3.5 h-3.5" /> Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSavePersonalExpense} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>Date</label>
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm ${glassInput}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>
                      Expense Type
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'Meal', icon: Utensils },
                        { id: 'Grocery', icon: ShoppingCart },
                        { id: 'Other', icon: Tag },
                      ].map((cat) => {
                        const Icon = cat.icon;
                        const active = expCategory === cat.id;
                        return (
                          <button
                            type="button"
                            key={cat.id}
                            onClick={() => setExpCategory(cat.id)}
                            className={`flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                              active
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                : `${glassSubCard} ${textSecondary}`
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" /> {cat.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>
                      Pay From Account
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Cash', 'Account'].map((src) => (
                        <button
                          type="button"
                          key={src}
                          onClick={() => setExpSource(src)}
                          className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                            expSource === src
                              ? src === 'Cash'
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                : 'bg-cyan-500 text-slate-950 border-cyan-400'
                              : `${glassSubCard} ${textSecondary}`
                          }`}
                        >
                          {src === 'Cash' ? 'Cash' : 'My Account'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>
                      Amount
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold ${glassInput}`}
                    />
                  </div>
                </div>

                {expCategory === 'Meal' && (
                  <div className={`${glassSubCard} rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3`}>
                    <span className={`text-xs font-medium ${textSecondary}`}>
                      Select Meal(s) (Dinner selected by default — toggle any):
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {MEAL_OPTIONS.map((meal) => {
                        const selected = expMeals.includes(meal);
                        return (
                          <button
                            type="button"
                            key={meal}
                            onClick={() => togglePersonalMeal(meal)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              selected
                                ? 'bg-amber-400 text-slate-950 border-amber-300'
                                : `${glassSubCard} ${textSecondary}`
                            }`}
                          >
                            {selected ? '✓ ' : ''}
                            {meal}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Where did you spend? (e.g., Grocery store, restaurant, fuel...)"
                    value={expDetail}
                    onChange={(e) => setExpDetail(e.target.value)}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm ${glassInput}`}
                  />
                  <button
                    type="submit"
                    className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shrink-0 ${
                      editingExpId
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {editingExpId ? 'Update Expense' : 'Record Expense'}
                  </button>
                </div>
              </form>
            </div>

            <div className={`${glassCard} rounded-3xl overflow-hidden`}>
              <div
                className={`px-5 py-4 border-b flex items-center justify-between ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <h3 className={`font-semibold text-sm ${textPrimary}`}>
                  Personal Expense Ledger ({personalExpenses.length})
                </h3>
              </div>
              {personalExpenses.length === 0 ? (
                <div className={`p-8 text-center text-sm ${textMuted}`}>
                  No expenses logged yet.
                </div>
              ) : (
                <div className={`divide-y ${isDark ? 'divide-white/10' : 'divide-slate-200'}`}>
                  {personalExpenses.map((item) => (
                    <div
                      key={item.id}
                      className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                        <span className={`text-xs font-mono ${textMuted}`}>
                          {formatDateDisplay(item.date)}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-500">
                          {item.category}
                          {item.meals && item.meals.length > 0 ? ` • ${item.meals.join(', ')}` : ''}
                        </span>
                        <span className={`text-sm font-medium ${textPrimary}`}>{item.detail}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                            item.source === 'Cash'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-cyan-500/15 text-cyan-500'
                          }`}
                        >
                          {item.source === 'Cash' ? 'Cash' : 'My Account'}
                        </span>
                        <span className="text-sm font-bold text-rose-500">
                          -{formatMoney(item.amount)}
                        </span>
                        <button
                          onClick={() => startEditPersonalExpense(item)}
                          className={`p-1.5 rounded-lg ${textMuted} hover:text-amber-500`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deletePersonalExpense(item.id)}
                          className={`p-1.5 rounded-lg ${textMuted} hover:text-rose-500`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {(isPublicOrRoommateLocked || activeTab === 'house') && (
          <div className="space-y-6">
            {isPublicOrRoommateLocked && (
              <div className={`${glassCard} rounded-3xl p-5 border-amber-400/35 space-y-4`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Key className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className={`text-xs sm:text-sm font-semibold ${textPrimary}`}>
                      {roommateModeKey
                        ? `Viewing ${getTabLabel('house')} Status (Key: ${roommateModeKey})`
                        : `Enter Mess Key to View Live ${getTabLabel('house')} Status`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {roommateModeKey && (
                      <span
                        className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full ${
                          cloudStatus === 'room_synced'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : roomKeyNotFound
                            ? 'bg-rose-500/15 text-rose-500'
                            : 'bg-amber-500/15 text-amber-500'
                        }`}
                      >
                        {cloudStatus === 'room_synced'
                          ? '● Live Status Synced'
                          : roomKeyNotFound
                          ? 'Key Not Found'
                          : cloudStatus === 'error'
                          ? 'Connection Error'
                          : 'Connecting...'}
                      </span>
                    )}
                    {roommateModeKey && (
                      <button
                        type="button"
                        onClick={handleClearRoommateKey}
                        className="text-[11px] text-rose-500 hover:underline font-medium"
                      >
                        Clear Key
                      </button>
                    )}
                  </div>
                </div>

                {(!roommateModeKey || roomKeyNotFound) && (
                  <form onSubmit={handleEnterRoommateMode} className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      placeholder="Enter Mess Key (e.g., ROOM-724Y-XBQN)"
                      value={roomKeyLoginInput}
                      onChange={(e) => setRoomKeyLoginInput(e.target.value)}
                      required
                      className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono uppercase ${glassInput}`}
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shrink-0"
                    >
                      Load Mess Status
                    </button>
                  </form>
                )}

                {roomKeyNotFound && (
                  <p className="text-xs text-rose-500">
                    No mess record found for key <strong>{roommateModeKey}</strong>. Ask the admin for the latest Mess Key.
                  </p>
                )}
              </div>
            )}

            {(isAdminAuthenticated || (roommateModeKey && !roomKeyNotFound)) && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`${glassCard} rounded-3xl p-5`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${textSecondary}`}>Total Pool Collected</span>
                      <Coins className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className={`text-2xl font-bold font-mono ${textPrimary}`}>
                      {formatPKR(houseStats.totalCollectedPool)}
                    </div>
                    <p className={`text-[11px] mt-1 ${textMuted}`}>
                      Combined contributions from all {houseMembers.length} housemates
                    </p>
                  </div>

                  <div className={`${glassCard} rounded-3xl p-5`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${textSecondary}`}>Total Expense to Date</span>
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-rose-500">
                      {formatPKR(houseStats.totalHouseSpent)}
                    </div>
                    <p className={`text-[11px] mt-1 font-medium ${textMuted}`}>
                      Meals: {formatPKR(houseStats.mealSpend)} | Groceries: {formatPKR(houseStats.grocerySpend)}
                    </p>
                  </div>

                  <div className={`${glassCard} rounded-3xl p-5`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${textSecondary}`}>
                        Net Remaining Pool
                      </span>
                      <PiggyBank className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-cyan-500">
                      {formatPKR(houseStats.creditRemaining)}
                    </div>
                    <p className={`text-[11px] mt-1 ${textMuted}`}>
                      Sum of all {houseMembers.length} members&apos; current wallet balances
                    </p>
                  </div>
                </div>

                {/* Editable Split Rules Banner */}
                <div className={`${glassCard} rounded-3xl p-4 sm:p-5`}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Mess Split Rules & Notes
                    </span>
                    {canEditHouseInRoomMode && !isEditingHouseRules && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempHouseRulesText(houseRulesText);
                          setIsEditingHouseRules(true);
                        }}
                        className={`inline-flex items-center gap-1 text-xs font-medium ${textMuted} hover:text-amber-500`}
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Rules
                      </button>
                    )}
                  </div>
                  {isEditingHouseRules && canEditHouseInRoomMode ? (
                    <div className="space-y-2.5">
                      <textarea
                        rows={3}
                        value={tempHouseRulesText}
                        onChange={(e) => setTempHouseRulesText(e.target.value)}
                        className={`w-full px-3.5 py-2 rounded-xl text-xs leading-relaxed ${glassInput}`}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setHouseRulesText(tempHouseRulesText.trim() || DEFAULT_HOUSE_RULES);
                            setIsEditingHouseRules(false);
                            showToast('Mess rules updated.');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs"
                        >
                          Save Rules
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingHouseRules(false)}
                          className={`px-3 py-1.5 rounded-xl ${glassSubCard} text-xs ${textMuted}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-xs whitespace-pre-line leading-relaxed ${textSecondary}`}>
                      {houseRulesText}
                    </p>
                  )}
                </div>

                <div className={`${glassCard} rounded-3xl p-5 sm:p-6`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div>
                      <h2 className={`font-bold text-base sm:text-lg flex items-center gap-2 ${textPrimary}`}>
                        <Users className="w-5 h-5 text-emerald-500" /> Member Wallets ({houseMembers.length} Housemates)
                      </h2>
                      <p className={`text-xs mt-0.5 ${textMuted}`}>
                        {canEditHouseInRoomMode
                          ? 'Edit any member’s name or balance, add/remove members, or top up wallets.'
                          : 'Live individual wallet balances for all housemates (Read-Only User).'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canEditHouseInRoomMode && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowDepositLedger((prev) => !prev)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl ${glassSubCard} text-xs font-semibold text-cyan-500 hover:bg-cyan-500/10`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            Deposits ({houseDeposits.length})
                          </button>
                          <button
                            type="button"
                            onClick={copyHouseBalancesWhatsApp}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl ${glassSubCard} text-xs font-semibold text-emerald-500 hover:bg-emerald-500/10`}
                          >
                            {copiedId === 'wa-balances' ? (
                              <ClipboardCheck className="w-3.5 h-3.5" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                            Copy Balances
                          </button>
                          <button
                            type="button"
                            onClick={handleAddHouseMember}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl ${glassSubCard} text-xs font-semibold text-amber-500 hover:bg-amber-500/10`}
                          >
                            <UserPlus className="w-3.5 h-3.5" /> + Member
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowBulkTopUp((prev) => !prev);
                              setBulkTopUpAmount('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 text-xs font-bold shadow-md"
                          >
                            <Plus className="w-3.5 h-3.5" /> Bulk Top-Up (All {houseMembers.length})
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {canEditHouseInRoomMode && showBulkTopUp && (
                    <form
                      onSubmit={handleBulkMemberTopUp}
                      className={`${glassSubCard} rounded-2xl p-3.5 mb-4 flex flex-wrap items-center justify-between gap-3 border-emerald-400/35`}
                    >
                      <span className={`text-xs font-semibold ${textPrimary}`}>
                        Add amount to <strong>EVERY</strong> member&apos;s wallet:
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          placeholder="1000"
                          value={bulkTopUpAmount}
                          onChange={(e) => setBulkTopUpAmount(e.target.value)}
                          required
                          className={`w-32 px-3 py-1.5 rounded-xl text-xs font-mono font-bold ${glassInput}`}
                        />
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                        >
                          Confirm All {houseMembers.length}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowBulkTopUp(false)}
                          className={`p-1 ${textMuted}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}

                  {canEditHouseInRoomMode && showDepositLedger && (
                    <div className={`${glassSubCard} rounded-2xl p-4 mb-4 space-y-2.5`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-500">
                          Editable Deposit History ({houseDeposits.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowDepositLedger(false)}
                          className={`text-xs ${textMuted}`}
                        >
                          Hide
                        </button>
                      </div>
                      {houseDeposits.length === 0 ? (
                        <p className={`text-xs ${textMuted}`}>
                          No deposits logged yet. Use + Top Up or Bulk Top-Up to record deposits.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {houseDeposits.map((dep) => (
                            <div
                              key={dep.id}
                              className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-white/10 text-xs"
                            >
                              {editingDepositId === dep.id ? (
                                <div className="flex flex-wrap items-center gap-2 w-full">
                                  <span className={`font-bold ${textPrimary}`}>{dep.memberName}</span>
                                  <input
                                    type="date"
                                    value={editDepositDate}
                                    onChange={(e) => setEditDepositDate(e.target.value)}
                                    className={`px-2 py-1 rounded-lg text-xs ${glassInput}`}
                                  />
                                  <input
                                    type="number"
                                    step="any"
                                    value={editDepositAmount}
                                    onChange={(e) => setEditDepositAmount(e.target.value)}
                                    className={`w-28 px-2 py-1 rounded-lg text-xs font-mono font-bold ${glassInput}`}
                                  />
                                  <div className="ml-auto flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => saveEditDeposit(dep)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-semibold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingDepositId(null)}
                                      className={`px-2 py-1 ${textMuted}`}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-mono ${textMuted}`}>
                                      {formatDateDisplay(dep.date)}
                                    </span>
                                    <span className={`font-semibold ${textPrimary}`}>
                                      {dep.memberName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-emerald-500">
                                      +{formatPKR(dep.amount)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => startEditDeposit(dep)}
                                      className={`p-1 rounded-lg ${textMuted} hover:text-amber-500`}
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteDepositRecord(dep)}
                                      className={`p-1 rounded-lg ${textMuted} hover:text-rose-500`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {houseMembers.map((member) => {
                      const isEditing = editingMemberId === member.id && canEditHouseInRoomMode;
                      const isToppingUp = topUpMemberId === member.id && canEditHouseInRoomMode;
                      const balNum = Number(member.balance || 0);
                      const isNegative = balNum < 0;
                      const isLowBalance = balNum >= 0 && balNum < 200;
                      const agg = houseStats.memberAgg[member.id] || {
                        mealDeducted: 0,
                        groceryDeducted: 0,
                        mealsAttended: 0,
                      };
                      const depositedEst = balNum + agg.mealDeducted + agg.groceryDeducted;

                      return (
                        <div
                          key={member.id}
                          className={`${glassSubCard} rounded-2xl p-4 flex flex-col justify-between gap-3 ${
                            isNegative
                              ? 'border-rose-400/40'
                              : isLowBalance
                              ? 'border-amber-400/40'
                              : ''
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2.5">
                              <input
                                type="text"
                                value={memberNameInput}
                                onChange={(e) => setMemberNameInput(e.target.value)}
                                placeholder="Member Name"
                                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold ${glassInput}`}
                              />
                              <input
                                type="number"
                                step="any"
                                value={memberBalanceInput}
                                onChange={(e) => setMemberBalanceInput(e.target.value)}
                                placeholder="Balance"
                                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold ${glassInput}`}
                              />
                              <div className="flex items-center justify-between gap-1.5">
                                {houseMembers.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveHouseMember(member.id)}
                                    className="px-2 py-1 rounded-lg bg-rose-500/15 text-rose-500 text-xs font-semibold"
                                  >
                                    Remove
                                  </button>
                                )}
                                <div className="flex items-center gap-1.5 ml-auto">
                                  <button
                                    onClick={() => saveMemberEdit(member.id)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-semibold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingMemberId(null)}
                                    className={`px-2 py-1 rounded-lg text-xs ${textMuted}`}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <h3
                                      onClick={() => canEditHouseInRoomMode && startEditMember(member)}
                                      className={`font-bold text-sm truncate ${textPrimary} ${
                                        canEditHouseInRoomMode ? 'cursor-pointer hover:text-emerald-500' : ''
                                      }`}
                                    >
                                      {member.name}
                                    </h3>
                                    {(isNegative || isLowBalance) && (
                                      <span
                                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                          isNegative
                                            ? 'bg-rose-500/20 text-rose-500 border border-rose-400/30'
                                            : 'bg-amber-500/20 text-amber-500 border border-amber-400/30'
                                        }`}
                                      >
                                        {isNegative ? 'Deficit' : 'Low Bal'}
                                      </span>
                                    )}
                                  </div>
                                  {canEditHouseInRoomMode && (
                                    <button
                                      onClick={() => startEditMember(member)}
                                      className={`p-1.5 rounded-lg ${textMuted} hover:text-amber-500`}
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                <div className="space-y-1 text-xs mb-3">
                                  <div className="flex justify-between">
                                    <span className={textMuted}>Deposited:</span>
                                    <span className={`font-mono font-medium ${textSecondary}`}>
                                      {formatPKR(depositedEst)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={textMuted}>Meals ({agg.mealsAttended}):</span>
                                    <span className={`font-mono ${textMuted}`}>
                                      -{formatPKR(agg.mealDeducted)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className={textMuted}>Groceries:</span>
                                    <span className={`font-mono ${textMuted}`}>
                                      -{formatPKR(agg.groceryDeducted)}
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-white/10">
                                  <span className={`block text-[10px] uppercase font-semibold ${textMuted}`}>
                                    Remaining
                                  </span>
                                  <p
                                    className={`text-lg font-extrabold font-mono mt-0.5 ${
                                      isNegative ? 'text-rose-500' : isLowBalance ? 'text-amber-500' : 'text-emerald-500'
                                    }`}
                                  >
                                    {formatPKR(balNum)}
                                  </p>
                                </div>
                              </div>

                              {canEditHouseInRoomMode && (
                                <>
                                  {isToppingUp ? (
                                    <div className="flex items-center gap-1.5 pt-1">
                                      <input
                                        type="number"
                                        step="any"
                                        placeholder="+ Amount"
                                        value={memberTopUpAmount}
                                        onChange={(e) => setMemberTopUpAmount(e.target.value)}
                                        className={`w-full px-2.5 py-1 rounded-lg text-xs ${glassInput}`}
                                      />
                                      <button
                                        onClick={() => handleMemberTopUp(member.id)}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs shrink-0"
                                      >
                                        Add
                                      </button>
                                      <button
                                        onClick={() => setTopUpMemberId(null)}
                                        className={`p-1 ${textMuted}`}
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setTopUpMemberId(member.id);
                                        setMemberTopUpAmount('');
                                      }}
                                      className="w-full py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/25 text-emerald-500 text-xs font-semibold flex items-center justify-center gap-1"
                                    >
                                      <PlusCircle className="w-3.5 h-3.5" /> + Top Up
                                    </button>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {canEditHouseInRoomMode && (
                  <div className={`${glassCard} rounded-3xl p-5 sm:p-6`}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className={`font-semibold text-base sm:text-lg flex items-center gap-2 ${textPrimary}`}>
                        <Utensils className="w-5 h-5 text-amber-500" />
                        {editingHouseExpId ? 'Edit Daily House Expense' : 'Log Daily House Expense'}
                      </h2>
                      {editingHouseExpId && (
                        <button
                          onClick={() => {
                            setEditingHouseExpId(null);
                            setHouseExpDetail('');
                            setHouseExpAmount('');
                          }}
                          className={`text-xs ${textMuted}`}
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSaveHouseExpense} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>Date</label>
                          <input
                            type="date"
                            value={houseExpDate}
                            onChange={(e) => setHouseExpDate(e.target.value)}
                            required
                            className={`w-full px-3.5 py-2.5 rounded-xl text-sm ${glassInput}`}
                          />
                        </div>

                        <div>
                          <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>
                            Expense Type (Auto Split Rule)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setHouseExpCategory('Meal')}
                              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                                houseExpCategory === 'Meal'
                                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                                  : `${glassSubCard} ${textSecondary}`
                              }`}
                            >
                              <Utensils className="w-3.5 h-3.5" /> Meal (Present)
                            </button>
                            <button
                              type="button"
                              onClick={() => setHouseExpCategory('Groceries')}
                              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                                houseExpCategory === 'Groceries'
                                  ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                                  : `${glassSubCard} ${textSecondary}`
                              }`}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" /> Groceries (All {houseMembers.length})
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className={`block text-xs font-medium mb-1.5 ${textSecondary}`}>
                            Total Bill Amount
                          </label>
                          <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            value={housePreview.hasRowAmounts ? String(housePreview.billTotal) : houseExpAmount}
                            onChange={(e) => setHouseExpAmount(e.target.value)}
                            readOnly={housePreview.hasRowAmounts}
                            required={!housePreview.hasRowAmounts}
                            className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-semibold ${glassInput}`}
                          />
                        </div>
                      </div>

                      {houseExpCategory === 'Meal' && (
                        <div className={`${glassSubCard} rounded-2xl p-3.5 space-y-2.5`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${textSecondary}`}>
                              Meal Type ({isMultiMealMode ? 'Multi-Meal Active' : 'Dinner Default'}):
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsMultiMealMode((prev) => !prev)}
                              className="text-[11px] font-bold text-amber-500 hover:underline"
                            >
                              {isMultiMealMode ? 'Use Dinner Default' : 'Toggle Multi-Meal'}
                            </button>
                          </div>
                          {isMultiMealMode && (
                            <div className="flex flex-wrap items-center gap-2">
                              {MEAL_OPTIONS.map((meal) => {
                                const selected = houseExpMeals.includes(meal);
                                return (
                                  <button
                                    type="button"
                                    key={meal}
                                    onClick={() => toggleHouseMeal(meal)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                      selected
                                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                                        : `${glassSubCard} ${textSecondary}`
                                    }`}
                                  >
                                    {selected ? '✓ ' : ''}
                                    {meal}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`${glassSubCard} rounded-2xl p-4 space-y-3`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-xs font-semibold ${textPrimary}`}>
                            Purchased Items & Categories (Editable)
                          </span>
                          <button
                            type="button"
                            onClick={addHouseItemRow}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Row
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {messCategories.map((cat) => (
                            <span
                              key={cat}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border ${
                                isDark
                                  ? 'bg-slate-950/60 border-white/10 text-slate-300'
                                  : 'bg-white border-slate-300 text-slate-700'
                              }`}
                            >
                              {cat}
                              {messCategories.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessCategory(cat)}
                                  className="text-rose-500 hover:text-rose-400"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </span>
                          ))}
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="+ Category"
                              value={newMessCategoryInput}
                              onChange={(e) => setNewMessCategoryInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddMessCategory(e)}
                              className={`w-24 px-2 py-0.5 rounded-lg text-[11px] ${glassInput}`}
                            />
                            <button
                              type="button"
                              onClick={handleAddMessCategory}
                              className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-500 text-[11px] font-bold"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {houseExpItems.map((row) => (
                            <div
                              key={row.id}
                              className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
                            >
                              <div className="flex rounded-xl overflow-hidden border border-white/10 shrink-0">
                                {['Meal', 'Grocery'].map((st) => (
                                  <button
                                    type="button"
                                    key={st}
                                    onClick={() => updateHouseItemRow(row.id, 'splitType', st)}
                                    className={`px-2.5 py-1.5 text-[11px] font-bold ${
                                      row.splitType === st
                                        ? st === 'Meal'
                                          ? 'bg-amber-400 text-slate-950'
                                          : 'bg-cyan-400 text-slate-950'
                                        : `${glassSubCard} ${textMuted}`
                                    }`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                              <select
                                value={row.category}
                                onChange={(e) => updateHouseItemRow(row.id, 'category', e.target.value)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs ${glassInput}`}
                              >
                                {messCategories.map((c) => (
                                  <option key={c} value={c} className={isDark ? 'bg-slate-900' : 'bg-white'}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                placeholder="Item note (e.g., Chicken, Roti)"
                                value={row.name}
                                onChange={(e) => updateHouseItemRow(row.id, 'name', e.target.value)}
                                className={`flex-1 px-3 py-1.5 rounded-xl text-xs ${glassInput}`}
                              />
                              <input
                                type="number"
                                step="any"
                                placeholder="Amount"
                                value={row.amount}
                                onChange={(e) => updateHouseItemRow(row.id, 'amount', e.target.value)}
                                className={`w-28 px-3 py-1.5 rounded-xl text-xs font-mono font-bold ${glassInput}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeHouseItemRow(row.id)}
                                className={`p-1.5 rounded-lg ${textMuted} hover:text-rose-500 self-end sm:self-center`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`${glassSubCard} rounded-2xl p-4`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div>
                            <span className={`text-xs font-semibold block ${textPrimary}`}>
                              {houseExpCategory === 'Meal'
                                ? `Attendance (${presentMemberIds.length}/${houseMembers.length} Present — Meal divides ONLY on Present; Grocery splits on All ${houseMembers.length})`
                                : `Groceries Split Rule: Automatically divided equally across ALL ${houseMembers.length} members`}
                            </span>
                            {housePreview.billTotal > 0 && (
                              <span className="text-[11px] font-mono text-emerald-500 font-medium">
                                Present pay: {formatPKR(housePreview.perPresentMeal + housePreview.perMemberGrocery)} | Absent pay: {formatPKR(housePreview.perMemberGrocery)}
                              </span>
                            )}
                          </div>
                          {houseExpCategory === 'Meal' && (
                            <div className="flex items-center gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => setPresentMemberIds(houseMembers.map((m) => m.id))}
                                className="text-emerald-500 hover:underline font-medium"
                              >
                                All Present
                              </button>
                              <span className={textMuted}>|</span>
                              <button
                                type="button"
                                onClick={() => setPresentMemberIds([])}
                                className={`hover:underline ${textMuted}`}
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {houseMembers.map((m) => {
                            const isPresent =
                              houseExpCategory === 'Groceries' || presentMemberIds.includes(m.id);
                            return (
                              <button
                                type="button"
                                key={m.id}
                                disabled={houseExpCategory === 'Groceries'}
                                onClick={() => toggleMemberAttendance(m.id)}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                  isPresent
                                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-500'
                                    : `${glassSubCard} ${textMuted} opacity-65`
                                } ${houseExpCategory === 'Groceries' ? 'cursor-default' : 'cursor-pointer'}`}
                              >
                                <span className="truncate">{m.name}</span>
                                {isPresent ? (
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <UserX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          placeholder="Overall bill note (e.g., Chicken Dinner, Weekly Vegetables & Flour...)"
                          value={houseExpDetail}
                          onChange={(e) => setHouseExpDetail(e.target.value)}
                          className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm ${glassInput}`}
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-semibold text-sm shrink-0"
                        >
                          <Check className="w-4 h-4" />
                          {editingHouseExpId ? 'Update House Bill' : 'Save Record'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className={`${glassCard} rounded-3xl overflow-hidden`}>
                  <div
                    className={`px-5 py-4 border-b flex items-center justify-between ${
                      isDark ? 'border-white/10' : 'border-slate-200'
                    }`}
                  >
                    <h3 className={`font-semibold text-sm ${textPrimary}`}>
                      Expense Ledger ({houseExpenses.length})
                    </h3>
                  </div>
                  {houseExpenses.length === 0 ? (
                    <div className={`p-8 text-center text-sm ${textMuted}`}>
                      No house expenses recorded yet.
                    </div>
                  ) : (
                    <div className={`divide-y ${isDark ? 'divide-white/10' : 'divide-slate-200'}`}>
                      {houseExpenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="px-5 py-4 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-xs font-mono ${textMuted}`}>
                                {formatDateDisplay(exp.date)}
                              </span>
                              <span
                                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                                  exp.category === 'Groceries'
                                    ? 'bg-cyan-500/15 border-cyan-400/25 text-cyan-500'
                                    : 'bg-amber-500/15 border-amber-400/25 text-amber-500'
                                }`}
                              >
                                {exp.mealType || exp.category}
                              </span>
                              <span className={`text-sm font-semibold ${textPrimary}`}>{exp.detail}</span>
                            </div>
                            <p className={`text-xs ${textMuted}`}>
                              {exp.splitMode} ({exp.participantIds?.length || houseMembers.length} members) •{' '}
                              <strong className={`font-mono ${textSecondary}`}>
                                {formatPKR(exp.perHead)}
                              </strong>{' '}
                              / member
                            </p>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-bold font-mono text-rose-500">
                              -{formatPKR(exp.amount)}
                            </span>
                            {canEditHouseInRoomMode && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => copyHouseBillWhatsApp(exp)}
                                  title="Copy WhatsApp Summary"
                                  className={`p-1.5 rounded-lg ${textMuted} hover:text-emerald-500`}
                                >
                                  {copiedId === `wa-${exp.id}` ? (
                                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Share2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEditHouseExpense(exp)}
                                  className={`p-1.5 rounded-lg ${textMuted} hover:text-amber-500`}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteHouseExpense(exp)}
                                  className={`p-1.5 rounded-lg ${textMuted} hover:text-rose-500`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {isAdminAuthenticated && activeTab === 'settings' && (
          <div className="space-y-6">
            <div className={`${glassCard} rounded-3xl p-5 sm:p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <Cloud className="w-5 h-5 text-emerald-500" />
                  <h2 className={`font-bold text-lg ${textPrimary}`}>
                    Sole Admin Cloud Sync & Approved Read-Only Users
                  </h2>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    cloudUser
                      ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-500'
                      : 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-500'
                  }`}
                >
                  {cloudUser ? `Sole Admin: ${cloudUser.email}` : 'Cloud Backend Ready'}
                </span>
              </div>
              <p className={`text-xs mb-4 ${textMuted}`}>
                Only <strong>{SOLE_ADMIN_EMAIL}</strong> can ever access Admin tabs. Approved users can only view shared mess status as read-only users—they can never become Admin.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={`${glassSubCard} rounded-2xl p-4 flex flex-col justify-between gap-4`}>
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-500 block">
                      Admin Session
                    </span>
                    <p className={`text-xs leading-relaxed ${textSecondary}`}>
                      Signed in as Sole Admin (<strong>{cloudUser?.email}</strong>). All personal tabs and cloud sync are active.
                    </p>
                  </div>

                  <button
                    onClick={handleGoogleSignOut}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-500 font-semibold text-xs"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out ({cloudUser?.email})
                  </button>
                </div>

                <div className={`${glassSubCard} rounded-2xl p-4 flex flex-col justify-between gap-3`}>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                        Cloud Connection Status
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-500">
                        ● Active & Hidden
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${textSecondary}`}>
                      Configuration credentials are injected via build secrets and never displayed to visitors or users.
                    </p>
                  </div>

                  {!showAdvancedConfig ? (
                    <button
                      type="button"
                      onClick={() => setShowAdvancedConfig(true)}
                      className={`w-full py-2 rounded-xl ${glassSubCard} text-xs font-semibold ${textSecondary} hover:text-emerald-500`}
                    >
                      Update / Paste Web Config Key
                    </button>
                  ) : (
                    <form onSubmit={handleSaveFirebaseConfig} className="space-y-2.5 pt-1">
                      <textarea
                        rows={3}
                        placeholder={'Paste firebaseConfig { apiKey: "...", ... } here...'}
                        value={firebaseConfigText}
                        onChange={(e) => setFirebaseConfigText(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-mono ${glassInput}`}
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-500 font-semibold text-xs"
                        >
                          Save & Hide
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdvancedConfig(false);
                            setFirebaseConfigText('');
                          }}
                          className={`px-3 py-2 rounded-xl ${glassSubCard} text-xs ${textMuted}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              <div className={`${glassSubCard} rounded-2xl p-4 mt-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Approved Read-Only Users (Cannot Be Admin)
                  </span>
                  <span className={`text-[11px] ${textMuted}`}>
                    {allowedStandardUsers.length} approved
                  </span>
                </div>
                <form onSubmit={handleAddAllowedUserEmail} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="roommate@gmail.com"
                    value={newAllowedEmail}
                    onChange={(e) => setNewAllowedEmail(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs ${glassInput}`}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs shrink-0"
                  >
                    Allow User
                  </button>
                </form>
                {allowedStandardUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {allowedStandardUsers.map((em) => (
                      <div
                        key={em}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs border ${
                          isDark
                            ? 'bg-slate-950/60 border-white/15 text-slate-200'
                            : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <span>{em}</span>
                        <span className="text-[10px] text-cyan-500 font-semibold">Read-Only</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllowedUserEmail(em)}
                          className="text-rose-500 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={`${glassCard} rounded-3xl p-5 sm:p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <Key className="w-5 h-5 text-amber-500" />
                  <h2 className={`font-bold text-lg ${textPrimary}`}>
                    Roommate Mess Key Access ({getTabLabel('house')} Read-Only)
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-500">
                  {roomKey}
                </span>
              </div>
              <p className={`text-xs mb-4 ${textMuted}`}>
                Any visitor who is not signed in with your Sole Admin account sees <strong>ONLY the {getTabLabel('house')} tab</strong> in read-only mode. Share your website link and this <strong>Mess Key</strong>—no other tabs or Firebase settings are visible.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`${glassSubCard} rounded-2xl p-4 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${textPrimary}`}>Your Mess Key:</span>
                    <button
                      type="button"
                      onClick={handleRegenerateRoomKey}
                      className="text-[11px] text-amber-500 hover:underline font-medium"
                    >
                      Regenerate Key
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={roomKey}
                      onChange={(e) => {
                        skipRemoteRoomKeyOnceRef.current = true;
                        setRoomKey(e.target.value.toUpperCase());
                      }}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono font-bold ${glassInput}`}
                    />
                    <button
                      type="button"
                      onClick={() => copyTextValue('roomkey', roomKey)}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Key
                    </button>
                  </div>
                  <p className={`text-[11px] pt-1 ${textMuted}`}>
                    Roommates &amp; approved users get default <strong>Read-Only</strong> status for {getTabLabel('house')}.
                  </p>
                </div>

                <div className={`${glassSubCard} rounded-2xl p-4 flex flex-col justify-between gap-3`}>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 block mb-1">
                      Shareable Website Mess Link
                    </span>
                    <p className={`text-xs leading-relaxed ${textSecondary}`}>
                      Send this link to roommates. They open it, enter your <strong>Mess Key</strong>, and view only your <strong>{getTabLabel('house')}</strong> status.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyTextValue('roomlink', buildRoommateInviteLink())}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-bold text-xs"
                  >
                    <Link2 className="w-4 h-4" /> Copy Roommate Website Link
                  </button>
                </div>
              </div>
            </div>

            <div className={`${glassCard} rounded-3xl p-5 sm:p-6`}>
              <div className="flex items-center gap-2.5 mb-2">
                <Smartphone className="w-5 h-5 text-cyan-500" />
                <h2 className={`font-bold text-lg ${textPrimary}`}>
                  Manual File Backup & Offline Sync Code
                </h2>
              </div>
              <p className={`text-xs mb-4 ${textMuted}`}>
                Export a complete offline backup file (including large PDFs) or copy a Sync Code anytime.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`${glassSubCard} rounded-2xl p-4 space-y-3`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 block">
                    Backup File (.json — Includes All PDFs)
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={handleExportJSON}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-semibold text-xs"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Backup
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-400/40 text-emerald-500 font-semibold text-xs hover:bg-emerald-500/10"
                    >
                      <Upload className="w-3.5 h-3.5" /> Restore File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportJSON}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className={`${glassSubCard} rounded-2xl p-4 space-y-3`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-500 block">
                    Copy-Paste Sync Code
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopySyncCode}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-500 font-semibold text-xs shrink-0"
                    >
                      Copy Code
                    </button>
                    <input
                      type="text"
                      placeholder="Paste Sync Code here..."
                      value={syncCodeInput}
                      onChange={(e) => setSyncCodeInput(e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs ${glassInput}`}
                    />
                    <button
                      onClick={handleRestoreFromSyncCode}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs shrink-0"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${glassCard} rounded-3xl p-5 sm:p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className={`font-bold text-base sm:text-lg ${textPrimary}`}>
                    Arrange &amp; Rename Navigation Tabs
                  </h2>
                  <p className={`text-xs mt-0.5 ${textMuted}`}>
                    Click the pencil icon to rename any tab, or use arrows / drag tabs to customize sequence.
                  </p>
                </div>
                <button
                  onClick={resetTabOrder}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${glassSubCard} text-xs font-medium ${textSecondary} hover:text-emerald-500`}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Default Order &amp; Names
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
                {tabOrder.map((tabId, index) => {
                  const tab = TAB_CATALOG[tabId];
                  if (!tab) return null;
                  const Icon = tab.icon;
                  const isEditingThisTab = editingTabId === tab.id;
                  return (
                    <div
                      key={tab.id}
                      className={`${glassSubCard} rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2`}
                    >
                      {isEditingThisTab ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={tempTabLabel}
                            onChange={(e) => setTempTabLabel(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveTabLabel(tab.id)}
                            className={`flex-1 px-2 py-1 rounded-lg text-xs font-semibold ${glassInput}`}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => saveTabLabel(tab.id)}
                            className="p-1 rounded-lg bg-emerald-500 text-slate-950"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTabId(null)}
                            className={`p-1 ${textMuted}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-xs font-mono font-bold ${textMuted}`}>
                              {index + 1}.
                            </span>
                            <Icon className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className={`text-xs font-semibold truncate ${textPrimary}`}>
                              {getTabLabel(tab.id)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTabId(tab.id);
                                setTempTabLabel(getTabLabel(tab.id));
                              }}
                              title="Rename Tab"
                              className={`p-1 rounded-lg ${glassSubCard} ${textMuted} hover:text-amber-500`}
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveTabByIndex(index, index - 1)}
                              disabled={index === 0}
                              className={`p-1 rounded-lg ${glassSubCard} disabled:opacity-30 ${textPrimary}`}
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveTabByIndex(index, index + 1)}
                              disabled={index === tabOrder.length - 1}
                              className={`p-1 rounded-lg ${glassSubCard} disabled:opacity-30 ${textPrimary}`}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${glassCard} rounded-3xl p-5 sm:p-6 space-y-4`}>
                <h2 className={`font-bold text-base sm:text-lg ${textPrimary}`}>
                  Appearance & Data Reset
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${textPrimary}`}>Glassmorphism Theme</p>
                    <p className={`text-xs ${textMuted}`}>
                      Click the WA logo anytime to switch.
                    </p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-500 text-xs font-semibold"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {isDark ? 'Switch to Light' : 'Switch to Dark'}
                  </button>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${textPrimary}`}>Reset Local Data</p>
                    <p className={`text-xs ${textMuted}`}>
                      Clear saved records on this browser.
                    </p>
                  </div>
                  {confirmReset ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleResetAllData}
                        className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-semibold"
                      >
                        Confirm Clear
                      </button>
                      <button
                        onClick={() => setConfirmReset(false)}
                        className={`px-2.5 py-1.5 rounded-xl ${glassSubCard} text-xs ${textSecondary}`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmReset(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-500 text-xs font-semibold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset Data
                    </button>
                  )}
                </div>
              </div>

              <div className={`${glassCard} rounded-3xl p-5 sm:p-6`}>
                <h2 className={`font-bold text-base sm:text-lg mb-3 ${textPrimary}`}>
                  Workspace Data Summary
                </h2>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className={`${glassSubCard} rounded-xl p-3 flex justify-between`}>
                    <span className={textSecondary}>Daily Work Logs</span>
                    <strong className={textPrimary}>{entries.length}</strong>
                  </div>
                  <div className={`${glassSubCard} rounded-xl p-3 flex justify-between`}>
                    <span className={textSecondary}>Attached PDFs</span>
                    <strong className={textPrimary}>{totalPdfsCount}</strong>
                  </div>
                  <div className={`${glassSubCard} rounded-xl p-3 flex justify-between`}>
                    <span className={textSecondary}>Rough Notes</span>
                    <strong className={textPrimary}>{roughNotes.length}</strong>
                  </div>
                  <div className={`${glassSubCard} rounded-xl p-3 flex justify-between`}>
                    <span className={textSecondary}>Sticky Notes</span>
                    <strong className={textPrimary}>{notes.length}</strong>
                  </div>
                  <div className={`${glassSubCard} rounded-xl p-3 flex justify-between`}>
                    <span className={textSecondary}>To-Do Tasks</span>
                    <strong className={textPrimary}>{todos.length}</strong>
                  </div>
                  <div className={`${glassSubCard} rounded-xl p-3 flex justify-between`}>
                    <span className={textSecondary}>Expense Records</span>
                    <strong className={textPrimary}>
                      {personalExpenses.length + houseExpenses.length}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
