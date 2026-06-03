import { useEffect, useState, useMemo, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import axios from "axios";

// Global Axios Interceptor to inject JWT authentication token automatically on outgoing requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("apnileap-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Modern Lucide Icon setup
import {
  ListTodo,
  PieChart as LucidePieChart,
  Bell,
  Search,
  Filter,
  Plus,
  X,
  Check,
  Trash2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Info,
  Lightbulb,
  Mail,
  Send,
  AlertTriangle,
  Sun,
  Moon,
  Briefcase,
  Lock,
  User,
  Users,
  Home,
  Book,
  Calendar,
  MessageSquare,
  GraduationCap,
  Settings,
  Shield,
  Bug,
  ClipboardList,
  Inbox,
  Hourglass,
  CheckCircle,
  Link as LucideLink,
  FolderOpen,
  Medal,
  Building2,
  Globe,
  Wrench,
  Zap,
  Star,
  DollarSign,
  Clock,
  Tag,
  AlertCircle,
  List,
  Monitor,
  School,
  Paperclip,
  Flag,
  ArrowRight,
  LogOut
} from "lucide-react";

// Alias mapping for FontAwesome to Lucide components
const FaTasks = ListTodo;
const FaChartPie = LucidePieChart;
const FaBell = Bell;
const FaSearch = Search;
const FaFilter = Filter;
const FaPlus = Plus;
const FaTimes = X;
const FaCheck = Check;
const FaTrashAlt = Trash2;
const FaSyncAlt = RotateCw;
const FaChevronLeft = ChevronLeft;
const FaChevronRight = ChevronRight;
const FaInfoCircle = Info;
const FaRegLightbulb = Lightbulb;
const FaEnvelope = Mail;
const FaPaperPlane = Send;
const FaExclamationTriangle = AlertTriangle;
const FaSun = Sun;
const FaMoon = Moon;
const FaBriefcase = Briefcase;
const FaLock = Lock;
const FaUser = User;
const FaUsers = Users;
const FaHome = Home;
const FaBook = Book;
const FaCalendarAlt = Calendar;
const FaComments = MessageSquare;
const FaGraduationCap = GraduationCap;
const FaCog = Settings;
const FaShieldAlt = Shield;
const FaBug = Bug;
const FaClipboardList = ClipboardList;
const FaInbox = Inbox;
const FaHourglassHalf = Hourglass;
const FaCheckCircle = CheckCircle;
const FaLink = LucideLink;
const FaCommentAlt = MessageSquare;
const FaFolderOpen = FolderOpen;
const FaMedal = Medal;
const FaBuilding = Building2;
const FaGlobe = Globe;
const FaWrench = Wrench;
const FaTools = Wrench;
const FaBolt = Zap;
const FaStar = Star;
const FaDollarSign = DollarSign;
const FaClock = Clock;
const FaTags = Tag;
const FaExclamationCircle = AlertCircle;
const FaListUl = List;
const FaDesktop = Monitor;
const FaSchool = School;
const FaUniversity = School;
const FaPaperclip = Paperclip;
const FaFlag = Flag;
const FaArrowRight = ArrowRight;
const FaUserTie = FaUser;
const FaChartLine = FaChartPie;
const FaCommentDots = FaComments;


import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { io } from "socket.io-client";

// Shared singleton socket — connect once at module level
const socket = io("http://localhost:5000", { autoConnect: false });

// Utility date calculator to evaluate task deadline details
const getDeadlineInfo = (dueDate, statusName) => {
  if (!dueDate) return null;
  if (statusName === "Done") {
    return { text: "Completed", type: "completed" };
  }

  const today = new Date("2026-05-26"); // Project baseline local time context
  const due = new Date(dueDate);

  // Reset hours to evaluate day differences only
  const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffTime = dDue.getTime() - dToday.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Overdue by ${Math.abs(diffDays)}d`, type: "overdue" };
  } else if (diffDays === 0) {
    return { text: "Due Today", type: "soon" };
  } else if (diffDays <= 2) {
    return { text: `Due in ${diffDays}d`, type: "soon" };
  } else {
    return { text: `${diffDays} days left`, type: "on-track" };
  }
};

// Utility company/sponsor evaluator to load high-fidelity brand logo icons for tasks
const getSponsorCompany = (task) => {
  if (!task) return null;
  const summary = (task.fields?.summary || "").toLowerCase();
  const description = (task.fields?.description || "").toLowerCase();
  
  if (summary.includes("nvidia") || description.includes("nvidia")) return { name: "NVIDIA", logo: "https://logo.clearbit.com/nvidia.com?size=32" };
  if (summary.includes("intel") || description.includes("intel")) return { name: "Intel", logo: "https://logo.clearbit.com/intel.com?size=32" };
  if (summary.includes("google") || description.includes("google")) return { name: "Google", logo: "https://logo.clearbit.com/google.com?size=32" };
  
  // Epic parent checking
  const epic = (task.fields?.epic?.fields?.summary || task.fields?.epic?.name || "").toLowerCase();
  if (epic.includes("nvidia")) return { name: "NVIDIA", logo: "https://logo.clearbit.com/nvidia.com?size=32" };
  if (epic.includes("intel")) return { name: "Intel", logo: "https://logo.clearbit.com/intel.com?size=32" };
  if (epic.includes("google")) return { name: "Google", logo: "https://logo.clearbit.com/google.com?size=32" };
  
  // Custom field color tags fallback
  const c = task.fields?.customfield_10017 || "";
  if (c === "blue" || c === "green") return { name: "NVIDIA", logo: "https://logo.clearbit.com/nvidia.com?size=32" };
  if (c === "teal") return { name: "Intel", logo: "https://logo.clearbit.com/intel.com?size=32" };
  
  return null;
};

// Failsafe, high-fidelity inline SVGs and styled brand emblems for sponsor companies (NVIDIA, Intel, Google)
const CompanyLogo = ({ company, size = 38 }) => {
  const norm = (company || "").toLowerCase();
  
  if (norm.includes("nvidia")) {
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 12px rgba(118, 185, 0, 0.25)",
        flexShrink: 0,
        background: "white"
      }} title="NVIDIA Sponsor">
        <img src="https://logo.clearbit.com/nvidia.com" alt="NVIDIA" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  
  if (norm.includes("intel")) {
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "8px",
        background: "#011528",
        border: "1.5px solid #0068b5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 12px rgba(0, 104, 181, 0.25)",
        flexShrink: 0
      }} title="Intel Sponsor">
        <svg viewBox="0 0 24 24" style={{ width: `${size * 0.55}px`, height: `${size * 0.55}px`, fill: "#0068b5" }}>
          <path d="M12 .5C5.649.5.5 5.649.5 12c0 6.351 5.149 11.5 11.5 11.5s11.5-5.149 11.5-11.5c0-6.351-5.149-11.5-11.5-11.5zm-2.5 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5.5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
      </div>
    );
  }
  
  if (norm.includes("google")) {
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "8px",
        background: "#1e293b",
        border: "1.5px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
        flexShrink: 0
      }} title="Google Sponsor">
        <svg viewBox="0 0 24 24" style={{ width: `${size * 0.55}px`, height: `${size * 0.55}px` }}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.03-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
      </div>
    );
  }
  
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "8px",
      background: "var(--primary)",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "800",
      fontSize: `${size * 0.4}px`,
      flexShrink: 0
    }}>
      {company.substring(0, 1).toUpperCase()}
    </div>
  );
};

const SPOKES = {
  "3": { name: "KLE Spoke", key: "AK", live: true },
  "101": { name: "COEP Spoke", key: "AK", live: true },
  "102": { name: "MMCOEP Spoke", key: "AK", live: true },
  "103": { name: "RIT Spoke", key: "AK", live: true }
};

const CAMPUS_LABELS = {
  "3": "kle-spoke",
  "101": "coep-spoke",
  "102": "mmcoep-spoke",
  "103": "rit-spoke"
};

function App() {
  // Authentication & Session States
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("apnileap-auth") === "true";
  });

  // Public Landing Page & Redirection States
  const [viewMode, setViewMode] = useState(() => {
    const auth = localStorage.getItem("apnileap-auth") === "true";
    return auth ? "dashboard" : "landing";
  });
  const [landingTab, setLandingTab] = useState("home"); // "home", "about", "collaboration", "contact", "login"
  const [portalModal, setPortalModal] = useState(null); // null, "academia", "industries", "startups"

  // Form submission state for Contact Us
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  
  // Project Mentor State
  const [mentorAssignments, setMentorAssignments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("apnileap-mentor-assignments")) || {};
    } catch {
      return {};
    }
  });
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [mentorModalProject, setMentorModalProject] = useState(null);
  const [mentorMode, setMentorMode] = useState("global"); // "global" | "per-spoke"
  const [mentorGlobalEmail, setMentorGlobalEmail] = useState("");
  const [mentorGlobalName, setMentorGlobalName] = useState("");
  const [mentorPerSpoke, setMentorPerSpoke] = useState({});
  const [isAssigningMentor, setIsAssigningMentor] = useState(false);

  const [sessionUser, setSessionUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("apnileap-user")) || null;
    } catch {
      return null;
    }
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Student & Faculty registration states
  const [showSignup, setShowSignup] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupCampus, setSignupCampus] = useState("3"); // Default to "3" (KLE Spoke)
  const [signupRole, setSignupRole] = useState("Student Developer");
  const [signupCompany, setSignupCompany] = useState("NVIDIA"); // "Student Developer" or "Faculty Mentor"
  const [signupError, setSignupError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Navigation & UI States
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard" or "kanban"
  const [activeCoordinatorTab, setActiveCoordinatorTab] = useState("analytics"); // "analytics", "team", or "projects"

  // Faculty Mentor Add Team Member form states
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Faculty Mentor Assign Sprint Task form states
  const [selectedEpicForTask, setSelectedEpicForTask] = useState("");
  const [newSprintTaskTitle, setNewSprintTaskTitle] = useState("");
  const [newSprintTaskAssignee, setNewSprintTaskAssignee] = useState("");
  const [newSprintTaskPriority, setNewSprintTaskPriority] = useState("Medium");
  const [newSprintTaskDueDate, setNewSprintTaskDueDate] = useState("");
  const [newSprintTaskDesc, setNewSprintTaskDesc] = useState("");
  const [isCreatingSprintTask, setIsCreatingSprintTask] = useState(false);

  // Faculty Mentor Custom Teams Builder states
  const [spokeTeams, setSpokeTeams] = useState([]);
  const [isTeamsLoading, setIsTeamsLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [selectedTeamMentor, setSelectedTeamMentor] = useState("");
  const [selectedSubFaculty, setSelectedSubFaculty] = useState("");
  const [newTeamProjectId, setNewTeamProjectId] = useState("");
  const [selectedTeamLeader, setSelectedTeamLeader] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [campusFaculty, setCampusFaculty] = useState([]);

  const [theme, setTheme] = useState(() => localStorage.getItem("app-theme") || "dark");

  const [activeWorkspace, setActiveWorkspace] = useState(() => {
    const auth = localStorage.getItem("apnileap-auth") === "true";
    if (auth) {
      const persona = localStorage.getItem("apnileap-persona") || "moderator";
      if (persona === "executive") return "hub";
      if (persona === "moderator") return "moderator";
      return persona;
    }
    return "hub";
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [currentPersona, setCurrentPersona] = useState(() => {
    return localStorage.getItem("apnileap-persona") || "moderator";
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [hasError, setHasError] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showCohortModal, setShowCohortModal] = useState(false);

  // Global Notifications State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const fetchNotifications = useCallback(() => {
    if (sessionUser?.email) {
      const stored = JSON.parse(localStorage.getItem("apnileap-mentor-notifications") || "[]");
      setNotifications(stored.filter(n => n.email === sessionUser.email.toLowerCase().trim()));
    } else {
      setNotifications([]);
    }
  }, [sessionUser]);

  useEffect(() => {
    fetchNotifications();
    window.addEventListener("storage", fetchNotifications);
    const interval = setInterval(fetchNotifications, 5000);
    return () => {
      window.removeEventListener("storage", fetchNotifications);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const dismissNotification = (id) => {
    const allNotifications = JSON.parse(localStorage.getItem("apnileap-mentor-notifications") || "[]");
    const updated = allNotifications.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem("apnileap-mentor-notifications", JSON.stringify(updated));
    fetchNotifications();
  };

  // B2B Project Ingest Form State
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [ingestCompany, setIngestCompany] = useState("NVIDIA");
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestDescription, setIngestDescription] = useState("");
  const [ingestBudget, setIngestBudget] = useState("");
  const [ingestDuration, setIngestDuration] = useState("");

  const [ingestRequirements, setIngestRequirements] = useState("");
  const [ingestPhases, setIngestPhases] = useState("");

  const [ingestDueDate, setIngestDueDate] = useState("2026-08-25");
  const [isIngesting, setIsIngesting] = useState(false);

  // B2B Project Edit Form State
  const [editingProject, setEditingProject] = useState(null);
  const [editCompany, setEditCompany] = useState("NVIDIA");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editDueDate, setEditDueDate] = useState("2026-08-25");
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);

  // ── Real-time Chat State ──────────────────────────────────────────────────
  // activeChatRoom: "team:<teamId>" | "spoke:<persona>" | "coord:<facultyEmail>:<coordEmail>"
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [chatRoomMessages, setChatRoomMessages] = useState({}); // { room: [msgs] }
  const [newChatMessage, setNewChatMessage] = useState("");
  const [chatConnected, setChatConnected] = useState(false);
  const chatMessagesEndRef = useCallback((el) => { if (el) el.scrollIntoView({ behavior: "smooth" }); }, []);

  // Connect socket when chat drawer opens
  useEffect(() => {
    if (!showChatDrawer) return;
    if (!socket.connected) {
      socket.connect();
    }
    socket.on("connect", () => setChatConnected(true));
    socket.on("disconnect", () => setChatConnected(false));
    socket.on("receive_message", (msg) => {
      setChatRoomMessages(prev => ({
        ...prev,
        [msg.room]: [...(prev[msg.room] || []), msg]
      }));
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("receive_message");
    };
  }, [showChatDrawer]);

  // Join room + fetch history when activeChatRoom changes
  useEffect(() => {
    if (!activeChatRoom || !showChatDrawer) return;
    socket.emit("join_room", activeChatRoom);
    // Fetch history
    const token = localStorage.getItem("apnileap-token");
    const encodedRoom = encodeURIComponent(activeChatRoom);
    fetch(`http://localhost:5000/api/chat/${encodedRoom}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(msgs => {
        if (Array.isArray(msgs)) {
          setChatRoomMessages(prev => ({ ...prev, [activeChatRoom]: msgs }));
        }
      })
      .catch(() => {});
  }, [activeChatRoom, showChatDrawer]);

  const handleSendChatMessage = () => {
    if (!newChatMessage.trim() || !activeChatRoom || !sessionUser) return;
    const msgData = {
      room: activeChatRoom,
      senderEmail: sessionUser.email,
      senderName: sessionUser.displayName || sessionUser.name || sessionUser.email,
      senderRole: sessionUser.role || "User",
      content: newChatMessage.trim(),
    };
    socket.emit("send_message", msgData);
    setNewChatMessage("");
  };


  
  // Project Manager State
  const [projectManagerProjects, setProjectManagerProjects] = useState([]);
  const [isProjectManagerLoading, setIsProjectManagerLoading] = useState(false);
  const [isProjectManagerIngestModalOpen, setIsProjectManagerIngestModalOpen] = useState(false);

  const [hubMetrics, setHubMetrics] = useState(null);
  const [isHubLoading, setIsHubLoading] = useState(true);

  // B2B Moderator Project Assignment states
  const [moderatorProjects, setModeratorProjects] = useState([]);
  const [isModeratorLoading, setIsModeratorLoading] = useState(false);
  const [selectedAssignProject, setSelectedAssignProject] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetCampus, setAssignTargetCampus] = useState("3");
  const [assignDueDate, setAssignDueDate] = useState("2026-08-25");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isRespondingToProject, setIsRespondingToProject] = useState(false);

  // Collaborative Sync Meetings states
  const [meetings, setMeetings] = useState([]);
  const [isMeetingsLoading, setIsMeetingsLoading] = useState(false);

  const currentBoardId = useMemo(() => {
    if (activeWorkspace === "spoke-coep") return "101";
    if (activeWorkspace === "spoke-mmcoep") return "102";
    if (activeWorkspace === "spoke-rit") return "103";
    if (activeWorkspace === "spoke-kle") return "3";
    return "3"; // default playground or fallback
  }, [activeWorkspace]);

  // Fetch real faculty members from the database for the current campus
  useEffect(() => {
    if (currentBoardId) {
      axios.get(`http://localhost:5000/api/faculty/${currentBoardId}`)
        .then(res => setCampusFaculty(res.data || []))
        .catch(err => console.error("Failed to fetch campus faculty", err));
    }
  }, [currentBoardId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  // Role-Based Access Control Simulation Guard
  useEffect(() => {
    Promise.resolve().then(() => {
      if (currentPersona === "executive") {
        setActiveWorkspace("hub");
        setActiveView("dashboard");
      } else if (currentPersona === "project-mentor") {
        setActiveWorkspace("mentor-dashboard");
        setActiveView("dashboard");
      } else if (currentPersona === "moderator") {
        setActiveWorkspace("moderator");
        setActiveView("dashboard");
      } else {
        setActiveWorkspace(currentPersona);
        setActiveView("dashboard");
      }
    });
  }, [currentPersona]);


  // Core Data States
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [spokeMembers, setSpokeMembers] = useState([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterAssignee, setFilterAssignee] = useState("All");
  const [filterProject, setFilterProject] = useState("All");

  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseDesc, setNewPhaseDesc] = useState("");
  const [newPhaseDuration, setNewPhaseDuration] = useState("");

  // Modal States & Premium Multi-tab details
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [modalTab, setModalTab] = useState("overview"); // "overview", "subtasks", "worklog", "links"
  const [submissions, setSubmissions] = useState([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [submitFileName, setSubmitFileName] = useState("");
  const [submitFile, setSubmitFile] = useState(null);
  const [submitComments, setSubmitComments] = useState("");
  const [isSubmittingDeliverable, setIsSubmittingDeliverable] = useState(false);
  const [worklogHistory, setWorklogHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [worklogTimeSpent, setWorklogTimeSpent] = useState("");
  const [worklogComment, setWorklogComment] = useState("");
  const [subtaskInputSummary, setSubtaskInputSummary] = useState("");
  const [subtaskAssigneeId, setSubtaskAssigneeId] = useState("");
  const [linkTargetKey, setLinkTargetKey] = useState("");
  const [linkRelationType, setLinkRelationType] = useState("blocks");
  const [labelInputString, setLabelInputString] = useState("");

  // Email Alert States
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailTask, setEmailTask] = useState(null);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailAnimationState, setEmailAnimationState] = useState(""); // "preparing", "sending", "sent"

  // Toast State
  // Removed toasts state

  // Create Task Form State
  const [newSummary, setNewSummary] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIssueType, setNewIssueType] = useState("Task");
  const [newAssignee, setNewAssignee] = useState("");
  const [newReporter, setNewReporter] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newStatus, setNewStatus] = useState("Backlog");
  const [newDueDate, setNewDueDate] = useState("");

  // Toast notifications are disabled
  const triggerToast = (message, type = "success") => {
    // Intentionally no-op — toast notifications removed
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  const getAllMentorEmails = (assignments) => {
    let emails = ["mentor@nvidia.com"];
    Object.values(assignments || {}).forEach(a => {
      if (a.mode === "global" && a.global?.email) emails.push(a.global.email.toLowerCase().trim());
      if (a.mode === "per-spoke" && a.perSpoke) {
        Object.values(a.perSpoke).forEach(sp => {
          if (sp?.email) emails.push(sp.email.toLowerCase().trim());
        });
      }
    });
    return emails;
  };

  const mapEmailToPersona = (email) => {
    const cleanEmail = email.toLowerCase().trim();
    if (getAllMentorEmails(mentorAssignments).includes(cleanEmail)) {
      return "project-mentor";
    }
    if (cleanEmail === "admin@apnileap.com" || cleanEmail === "executive@apnileap.com" || cleanEmail === "executive") {
      return "executive";
    }
    if (cleanEmail === "moderator@apnileap.com" || cleanEmail === "moderator" || cleanEmail.endsWith("@apnileap.com")) {
      return "moderator";
    }
    if (cleanEmail.includes("sponsor") || cleanEmail.includes("nvidia")) {
      return "sponsor-nvidia";
    }
    if (cleanEmail.includes("kle") || cleanEmail.endsWith("@kletech.ac.in")) {
      return "spoke-kle";
    }
    if (cleanEmail.includes("mmcoep")) {
      return "spoke-mmcoep";
    }
    if (cleanEmail.includes("coep")) {
      return "spoke-coep";
    }
    if (cleanEmail.includes("rit")) {
      return "spoke-rit";
    }
    return null;
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim()) {
      setLoginError("Please enter your email address.");
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError("Please enter your password.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        email: loginEmail,
        password: loginPassword
      });

      const { user, token } = response.data;
      setIsAuthenticated(true);
      setViewMode("dashboard");
      setSessionUser(user);
      setCurrentPersona(user.persona);
      setActiveWorkspace(user.persona === "executive" ? "hub" : user.persona === "moderator" ? "moderator" : user.persona);

      localStorage.setItem("apnileap-auth", "true");
      localStorage.setItem("apnileap-user", JSON.stringify(user));
      localStorage.setItem("apnileap-persona", user.persona);
      if (token) {
        localStorage.setItem("apnileap-token", token);
      }

      triggerToast(`Logged in successfully as ${user.displayName}!`);
    } catch (err) {
      console.error("Login Failure:", err);
      const errMsg = err.response?.data?.error || "Connection failure. Please check if your backend is running on port 5000.";
      setLoginError(errMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    if (e) e.preventDefault();
    setSignupError("");

    if (!signupName.trim()) {
      setSignupError("Please enter your full name.");
      return;
    }
    if (!signupEmail.trim()) {
      setSignupError("Please enter your email address.");
      return;
    }
    if (!signupPassword.trim()) {
      setSignupError("Please enter a secure password.");
      return;
    }

    setIsRegistering(true);
    try {
      const selectedPersona = signupRole === "Project Manager" ? "project-manager" : (signupCampus === "3" ? "spoke-kle" : signupCampus === "101" ? "spoke-coep" : signupCampus === "102" ? "spoke-mmcoep" : "spoke-rit");
      
      const campusPrefix = signupCampus === "3" ? "KLE" : signupCampus === "101" ? "COEP" : signupCampus === "102" ? "MMCOEP" : "RIT";
      const selectedRole = signupRole === "Project Manager" ? "Project Manager" : (signupRole === "Faculty Mentor" ? `${campusPrefix} Spoke Coordinator` : "Student Developer");

      const response = await axios.post("http://localhost:5000/api/register", {
        email: signupEmail,
        password: signupPassword,
        displayName: signupName,
        role: selectedRole,
        persona: selectedPersona,
        company: signupRole === "Project Manager" ? signupCompany : undefined
      });

      const { user, token } = response.data;
      setIsAuthenticated(true);
      setViewMode("dashboard");
      setSessionUser(user);
      setCurrentPersona(user.persona);
      setActiveWorkspace(user.persona);

      localStorage.setItem("apnileap-auth", "true");
      localStorage.setItem("apnileap-user", JSON.stringify(user));
      localStorage.setItem("apnileap-persona", user.persona);
      if (token) {
        localStorage.setItem("apnileap-token", token);
      }

      // Reset signup inputs
      setSignupName("");
      setSignupEmail("");
      setSignupPassword("");
      setSignupRole("Student Developer");
      setShowSignup(false);

      triggerToast(`Account created! Welcome to the platform, ${user.displayName}! `);
    } catch (err) {
      console.error("Signup Failure:", err);
      const errMsg = err.response?.data?.error || "Registration failure. Please check your backend connection.";
      setSignupError(errMsg);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleQuickConnect = async (email) => {
    setLoginEmail(email);
    // Select the correct password for each demo account
    let password = "moderator123";
    if (email.startsWith("pm@") || email === "p.manager@nvidia.com") password = "pm123";
    else if (email.startsWith("coordinator@")) password = "admin123";
    else if (email.startsWith("faculty")) password = "faculty123";
    else if (email.startsWith("student")) password = "student123";
    else if (email.includes("mentor") || email === "aditi.sharma@nvidia.com" || email === "raj.patel@nvidia.com" || email === "emily.chen@intel.com" || email === "michael.johnson@microsoft.com") password = "mentor123";
    else if (email.includes("sponsor") || email.includes("corporate") || email.includes("nvidia")) password = "nvidia123";
    else if (email.includes("kle")) password = "kle123";
    else if (email.includes("coep") && !email.includes("mmcoep")) password = "coep123";
    else if (email.includes("mmcoep")) password = "mmcoep123";
    else if (email.includes("rit")) password = "rit123";

    setLoginPassword(password);
    setLoginError("");
    setIsLoggingIn(true);

    try {
      let user, token;
      
      // Execute real API login
      const response = await axios.post("http://localhost:5000/api/login", {
        email: email,
        password: password
      });
      user = response.data.user;
      token = response.data.token;
      setIsAuthenticated(true);
      setViewMode("dashboard");
      setSessionUser(user);
      setCurrentPersona(user.persona);
      setActiveWorkspace(user.persona === "executive" ? "hub" : user.persona === "moderator" ? "moderator" : user.persona);

      localStorage.setItem("apnileap-auth", "true");
      localStorage.setItem("apnileap-user", JSON.stringify(user));
      localStorage.setItem("apnileap-persona", user.persona);
      if (token) {
        localStorage.setItem("apnileap-token", token);
      }



    } catch (err) {
      console.error("Quick Connect Failure:", err);
      const errMsg = err.response?.data?.error || "Connection failure. Please check if your backend is running on port 5000.";
      setLoginError(errMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setViewMode("landing");
    setLandingTab("home");
    setSessionUser(null);
    setCurrentPersona("moderator");
    setActiveWorkspace("hub");
    setLoginEmail("");
    setLoginPassword("");
    
    localStorage.removeItem("apnileap-auth");
    localStorage.removeItem("apnileap-user");
    localStorage.removeItem("apnileap-persona");
    localStorage.removeItem("apnileap-token");
    
    triggerToast("Logged out successfully.");
  };

  const handleIngestProjectSubmit = async (e) => {
    e.preventDefault();
    if (!ingestTitle.trim() || !ingestDescription.trim() || !ingestBudget.trim() || !ingestDuration.trim() || !ingestRequirements.trim() || !ingestPhases.trim()) {
      triggerToast("Please fill in all the required project proposal fields, including Requirements and Phases.", "warning");
      return;
    }

    setIsIngesting(true);
    try {
      const response = await axios.post("http://localhost:5000/moderator/projects", {
        company: ingestCompany,
        title: ingestTitle,
        description: ingestDescription,
        budget: ingestBudget,
        duration: ingestDuration,
        proposedDueDate: ingestDueDate,

        requirements: ingestRequirements.split('\n').filter(r => r.trim()),
        phases: ingestPhases.split('\n').filter(p => p.trim()).map(p => {
            const parts = p.split('|');
            return {
                name: parts[0]?.trim() || "Phase",
                description: parts[1]?.trim() || "",
                duration: parts[2]?.trim() || "1 week"
            };
        })

      });

      if (response.data && response.data.success) {
        triggerToast(` Successfully ingested new proposal by ${ingestCompany}!`);
        setIsIngestOpen(false);
        // Reset form
        setIngestTitle("");
        setIngestDescription("");
        setIngestBudget("");
        setIngestDuration("");
        setIngestDueDate("2026-08-25");
        setIngestRequirements("");
        setIngestPhases("");
        // Reload projects and hub metrics immediately to sync changes across portals
        fetchModeratorProjects(true);
        fetchHubMetrics(true);
      }
    } catch (error) {
      console.error("Project Ingestion Error:", error);
      triggerToast(error.response?.data?.error || "Failed to ingest new project proposal.", "error");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleUpdateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!editingProject) return;
    if (!editTitle.trim() || !editDescription.trim() || !editBudget.trim() || !editDuration.trim()) {
      triggerToast("Please fill in all required fields.", "warning");
      return;
    }

    setIsUpdatingProject(true);
    try {
      const response = await axios.put(`http://localhost:5000/moderator/projects/${editingProject.id}`, {
        company: editCompany,
        title: editTitle.trim(),
        description: editDescription.trim(),
        budget: editBudget.trim(),
        duration: editDuration.trim(),
        proposedDueDate: editDueDate
      });

      if (response.data && response.data.success) {
        triggerToast(" Successfully updated B2B project details!");
        setEditingProject(null);
        fetchModeratorProjects(true);
      }
    } catch (err) {
      console.error("Project Update Error:", err);
      triggerToast(err.response?.data?.error || "Failed to update B2B project.", "error");
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to persistently delete this B2B corporate project? This will remove all campus spoke allocations!")) {
      return;
    }
    try {
      const response = await axios.delete(`http://localhost:5000/moderator/projects/${projectId}`);
      if (response.data && response.data.success) {
        triggerToast(" Corporate B2B project successfully deleted.");
        fetchModeratorProjects(true);
      }
    } catch (err) {
      console.error("Project Deletion Error:", err);
      triggerToast("Failed to delete corporate project.", "error");
    }
  };

  const fetchSpokeMembers = async (boardId) => {
    try {
      const res = await axios.get(`http://localhost:5000/spokes/${boardId}/members`);
      setSpokeMembers(res.data);
    } catch (err) {
      console.error("Failed to retrieve campus team members:", err);
    }
  };

  const fetchSpokeTeams = async (boardId) => {
    setIsTeamsLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/teams?boardId=${boardId}`);
      setSpokeTeams(res.data || []);
    } catch (err) {
      console.error("Failed to retrieve campus teams:", err);
    } finally {
      setIsTeamsLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    if (e) e.preventDefault();
    if (!newTeamName.trim()) {
      triggerToast("Please enter a name for the new team.", "warning");
      return;
    }

    setIsCreatingTeam(true);
    try {
      const selectedMembersData = selectedTeamMembers.map(memberId => {
        const found = spokeMembers.find(m => m.accountId === memberId);
        return {
          accountId: memberId,
          displayName: found ? found.displayName.replace(/ \((Student Developer|Faculty Mentor|Coordinator)\)/g, "") : "Team Member",
          emailAddress: found ? (found.emailAddress || found.email || "") : "",
          avatarUrl: found ? found.avatarUrl : "https://i.pravatar.cc/150"
        };
      });

      // Auto-assign the logged-in faculty as the team mentor
      const mentorData = sessionUser ? {
        accountId: sessionUser.email,
        displayName: sessionUser.displayName || sessionUser.name || sessionUser.email,
        emailAddress: sessionUser.email,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(sessionUser.displayName || sessionUser.email)}&background=6366f1&color=fff`
      } : null;

      // Sub Faculty from DB campusFaculty list
      const foundSubFaculty = campusFaculty.find(f => f.email === selectedSubFaculty);
      const subFacultyData = foundSubFaculty ? {
        accountId: foundSubFaculty.email,
        displayName: foundSubFaculty.displayName,
        emailAddress: foundSubFaculty.email,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(foundSubFaculty.displayName)}&background=10b981&color=fff`
      } : null;

      const res = await axios.post("http://localhost:5000/api/teams", {
        name: newTeamName.trim(),
        boardId: currentBoardId,
        projectId: newTeamProjectId,
        members: selectedMembersData,
        mentor: mentorData,
        subFaculty: subFacultyData,
        teamLeader: null
      });

      if (res.data && res.data.success) {
        triggerToast(` Successfully created collaborative team "${newTeamName}"!`);
        setNewTeamName("");
        setSelectedTeamMembers([]);
        setSelectedTeamMentor("");
        setSelectedSubFaculty("");
        fetchSpokeTeams(currentBoardId);
      }
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.error || "Failed to create custom spoke team.", "error");
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleUpdateTeam = async (e) => {
    if (e) e.preventDefault();
    if (!selectedTeamId) {
      triggerToast("Please select a team to update.", "warning");
      return;
    }
    if (selectedTeamMembers.length === 0) {
      triggerToast("Please select at least one student developer for the team.", "warning");
      return;
    }

    setIsCreatingTeam(true);
    try {
      const selectedMembersData = selectedTeamMembers.map(memberId => {
        const found = spokeMembers.find(m => m.accountId === memberId);
        return {
          accountId: memberId,
          displayName: found ? found.displayName.replace(/ \((Student Developer|Faculty Mentor|Coordinator)\)/g, "") : "Team Member",
          emailAddress: found ? (found.emailAddress || found.email || "") : "",
          avatarUrl: found ? found.avatarUrl : "https://i.pravatar.cc/150"
        };
      });

      const foundLeader = spokeMembers.find(m => m.accountId === selectedTeamLeader);
      const leaderData = foundLeader ? {
        accountId: selectedTeamLeader,
        displayName: foundLeader.displayName.replace(/ \((Student Developer)\)/g, ""),
        emailAddress: foundLeader.emailAddress || foundLeader.email || "",
        avatarUrl: foundLeader.avatarUrl
      } : null;

      const res = await axios.put(`http://localhost:5000/api/teams/${selectedTeamId}`, {
        members: selectedMembersData,
        teamLeader: leaderData
      });

      if (res.data && res.data.success) {
        triggerToast("Successfully formed student team!");
        setSelectedTeamMembers([]);
        setSelectedTeamLeader("");
        setSelectedTeamId("");
        fetchSpokeTeams(currentBoardId);
      }
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.error || "Failed to update team.", "error");
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Are you sure you want to disband and delete this Spoke Team persistently?")) {
      return;
    }
    try {
      const res = await axios.delete(`http://localhost:5000/api/teams/${teamId}`);
      if (res.data && res.data.success) {
        triggerToast("Spoke Team successfully disbanded.");
        fetchSpokeTeams(currentBoardId);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to disband Spoke Team.", "error");
    }
  };

  // Fetch Tasks from Real API
  const fetchJiraTasks = async (silent = false, customBoardId = null) => {
    if (!silent) setIsLoading(true);
    setHasError(false);
    try {
      const boardIdToFetch = customBoardId || currentBoardId;
      const response = await axios.get(`http://localhost:5000/tasks?boardId=${boardIdToFetch}`);
      if (Array.isArray(response.data)) {
        // Adapt Jira issues dynamically - pulls exact assignee, reporter, and due date
        const normalized = response.data.map((item) => ({
          id: item.id || `jira-${Date.now()}-${Math.random()}`,
          key: item.key || `JIRA-${item.id}`,
          fields: {
            summary: item.fields?.summary || "No Summary Provided",
            description: item.fields?.description || "No description set in Jira.",
            status: { name: item.fields?.status?.name || "Backlog" },
            priority: { name: item.fields?.priority?.name || "Medium" },
            issueType: item.fields?.issuetype?.name || "Task",
            assignee: item.fields?.assignee ? {
              accountId: item.fields.assignee.accountId,
              displayName: item.fields.assignee.displayName,
              avatarUrl: item.fields.assignee.avatarUrls?.["48x48"] || item.fields.assignee.avatarUrl || "https://i.pravatar.cc/150",
              email: item.fields.assignee.emailAddress || ""
            } : null,
            reporter: item.fields?.reporter ? {
              accountId: item.fields.reporter.accountId,
              displayName: item.fields.reporter.displayName,
              avatarUrl: item.fields.reporter.avatarUrls?.["48x48"] || item.fields.reporter.avatarUrl || "https://i.pravatar.cc/150",
              email: item.fields.reporter.emailAddress || ""
            } : null,
            created: item.fields?.created || new Date().toISOString(),
            dueDate: item.fields?.duedate || item.fields?.dueDate || null,
            flagged: (item.fields?.customfield_10021 && item.fields.customfield_10021.length > 0) || 
                     (item.fields?.Flagged && item.fields.Flagged.length > 0) || 
                     item.fields?.flagged === true || false,
            timetracking: item.fields?.timetracking ? {
              originalEstimate: item.fields.timetracking.originalEstimate || null,
              remainingEstimate: item.fields.timetracking.remainingEstimate || null,
              timeSpent: item.fields.timetracking.timeSpent || null,
              timeSpentSeconds: item.fields.timetracking.timeSpentSeconds || 0,
              originalEstimateSeconds: item.fields.timetracking.originalEstimateSeconds || 0,
              remainingEstimateSeconds: item.fields.timetracking.remainingEstimateSeconds || 0
            } : null,
            subtasks: item.fields?.subtasks ? item.fields.subtasks.map(sub => ({
              id: sub.id,
              key: sub.key,
              summary: sub.fields?.summary || sub.summary || "No Summary",
              statusName: sub.fields?.status?.name || sub.statusName || "Backlog"
            })) : [],
            issuelinks: item.fields?.issuelinks ? item.fields.issuelinks.map(link => {
              const linkedIssue = link.inwardIssue || link.outwardIssue;
              const direction = link.inwardIssue ? "is blocked by" : "blocks";
              return {
                id: link.id,
                type: link.type?.name || "Blocks",
                direction: direction,
                key: linkedIssue?.key,
                summary: linkedIssue?.fields?.summary || "No Summary",
                statusName: linkedIssue?.fields?.status?.name || "Backlog"
              };
            }) : [],
            labels: item.fields?.labels || [],
            parent: item.fields?.parent ? {
              id: item.fields.parent.id,
              key: item.fields.parent.key,
              summary: item.fields.parent.fields?.summary || "",
              issueType: item.fields.parent.fields?.issuetype?.name || ""
            } : null
          }
        }));
        setTasks(normalized);
        setConnectionStatus("Connected");
        if (!silent) {
          triggerToast("Successfully synchronized with Live Jira API!");
        }
        return normalized;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("API Fetch Error:", error);
      setConnectionStatus("Offline");
      setHasError(true);
      if (!silent) {
        triggerToast("Failed to connect to Jira backend. Make sure server is started.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Aggregated Hub Metrics for ApniLeap
  const fetchHubMetrics = async (silent = false) => {
    if (!silent) setIsHubLoading(true);
    setHasError(false);
    try {
      const response = await axios.get("http://localhost:5000/hub/metrics");
      setHubMetrics(response.data);
      setConnectionStatus("Connected");
    } catch (error) {
      console.error("Hub Fetch Error:", error);
      setConnectionStatus("Offline");
      setHasError(true);
      if (!silent) {
        triggerToast("Failed to aggregate Hub portfolio analytics. Make sure server is started.", "error");
      }
    } finally {
      setIsHubLoading(false);
    }
  };

  // Fetch incoming B2B projects for Moderator Intake
  const fetchProjectManagerProjects = async (silent = false) => {
    if (!silent) setIsProjectManagerLoading(true);
    setHasError(false);
    try {
      const companyDomain = sessionUser?.email ? sessionUser.email.split('@')[1].split('.')[0].toUpperCase() : "NVIDIA";
      const company = sessionUser?.company || companyDomain || "NVIDIA";
      const token = localStorage.getItem('authToken') || '';
      const response = await axios.get(`http://localhost:5000/project-manager/projects/${company}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setProjectManagerProjects(response.data);
      setConnectionStatus("Connected");
    } catch (error) {
      console.error("Project Manager Projects Fetch Error:", error);
      setConnectionStatus("Offline");
      setHasError(true);
      if (!silent) {
        triggerToast("Failed to fetch projects.", "error");
      }
    } finally {
      setIsProjectManagerLoading(false);
    }
  };

  const fetchModeratorProjects = async (silent = false) => {
    if (!silent) setIsModeratorLoading(true);
    setHasError(false);
    try {
      const response = await axios.get("http://localhost:5000/moderator/projects");
      setModeratorProjects(response.data);
      setConnectionStatus("Connected");
    } catch (error) {
      console.error("Moderator Projects Fetch Error:", error);
      setConnectionStatus("Offline");
      setHasError(true);
      if (!silent) {
        triggerToast("Failed to fetch moderator projects. Make sure server is started.", "error");
      }
    } finally {
      setIsModeratorLoading(false);
    }
  };

  // Fetch upcoming scheduled FIP sync meetings
  const fetchMeetings = async (silent = false) => {
    if (!silent) setIsMeetingsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/meetings");
      setMeetings(response.data);
    } catch (error) {
      console.error("Meetings Fetch Error:", error);
      if (!silent) {
        triggerToast("Failed to retrieve scheduled FIP sync meetings.", "error");
      }
    } finally {
      setIsMeetingsLoading(false);
    }
  };

  // Retrieve all student deliverables in the system
  const fetchAllSubmissions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/submissions");
      setAllSubmissions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch all submissions:", err);
    }
  };

  // Trigger project proposal assignment (Moderator)
  const handleAssignProject = async (e) => {
    e.preventDefault();
    if (!selectedAssignProject) return;

    setIsProvisioning(true);
    try {
      const response = await axios.post("http://localhost:5000/moderator/assign", {
        projectId: selectedAssignProject.id,
        targetBoardId: assignTargetCampus,
        dueDate: assignDueDate
      });

      if (response.data && response.data.success) {
        triggerToast(`Success! Proposal sent to ${response.data.assignedTo}. Awaiting coordinator review.`);
        setIsAssignModalOpen(false);
        fetchModeratorProjects(false);
      }
    } catch (error) {
      console.error("Assignment Error:", error);
      triggerToast(error.response?.data?.error || "Failed to propose project assignment.", "error");
    } finally {
      setIsProvisioning(false);
    }
  };

  // Spoke Coordinator accepts B2B Project assignment (Spoke)
  const handleAcceptProject = async (projectId) => {
    setIsRespondingToProject(true);
    try {
      const res = await axios.post(`http://localhost:5000/spoke/project/${projectId}/accept`, { targetBoardId: currentBoardId });
      if (res.data && res.data.success) {
        triggerToast(" Project accepted! Jira workspace successfully provisioned with 3 standard Phase tasks!");
        fetchModeratorProjects(false);
        fetchJiraTasks(false); // Refresh Jira board immediately
      }
    } catch (err) {
      console.error("Acceptance Error:", err);
      triggerToast(err.response?.data?.error || "Failed to accept project assignment.", "error");
    } finally {
      setIsRespondingToProject(false);
    }
  };

  // Spoke Coordinator declines B2B Project assignment (Spoke)
  const handleDeclineProject = async (projectId) => {
    setIsRespondingToProject(true);
    try {
      const res = await axios.post(`http://localhost:5000/spoke/project/${projectId}/decline`, { targetBoardId: currentBoardId });
      if (res.data && res.data.success) {
        triggerToast("Proposal declined. Project returned to the Moderator assignment pool.");
        fetchModeratorProjects(false);
      }
    } catch (err) {
      console.error("Decline Error:", err);
      triggerToast(err.response?.data?.error || "Failed to decline project assignment.", "error");
    } finally {
      setIsRespondingToProject(false);
    }
  };

  // Re-fetch issues or hub metrics whenever activeWorkspace or currentBoardId changes
  useEffect(() => {
    Promise.resolve().then(() => {
      fetchMeetings(true); // Fetch meetings silently to check for banner alerts
      if (activeWorkspace === "hub") {
        fetchHubMetrics(false);
      } else if (activeWorkspace === "moderator") {
        fetchModeratorProjects(false);
      } else if (activeWorkspace === "meetings") {
        fetchMeetings(false);
      } else {
        fetchJiraTasks(false);
        fetchSpokeMembers(currentBoardId);
        fetchSpokeTeams(currentBoardId);
        fetchModeratorProjects(true); // Fetch moderator projects silently to check for proposed B2B assignments
        fetchHubMetrics(true); // Fetch hub metrics silently to feed leaderboards!
        fetchAllSubmissions(); // Auto-load all submissions for deliverables review queue!
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace, currentBoardId]);

  // On component mount, automatically fetch active session user profile
  useEffect(() => {
    const fetchMyself = async () => {
      try {
        const res = await axios.get("http://localhost:5000/myself");
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Failed to retrieve myself context:", err);
      }
    };
    fetchMyself();
  }, []);

  // Background Auto-Polling: silently refetches based on active view mode
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMeetings(true);
      if (activeWorkspace === "hub") {
        fetchHubMetrics(true);
      } else if (activeWorkspace === "moderator") {
        fetchModeratorProjects(true);
      } else if (activeWorkspace === "meetings") {
        fetchMeetings(true);
      } else {
        fetchJiraTasks(true);
        fetchSpokeMembers(currentBoardId);
        fetchSpokeTeams(currentBoardId);
        fetchHubMetrics(true); // Poll hub metrics silently for leaderboards!
      }
    }, 60000); // 60s auto-polling

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace, currentBoardId]);

  // Ensures real Jira users are editable and filterable seamlessly.
  const activeAssignees = useMemo(() => {
    const list = [];
    if (currentUser && currentUser.accountId) {
      list.push({
        accountId: currentUser.accountId,
        name: currentUser.displayName,
        avatar: currentUser.avatarUrls?.["48x48"] || "https://i.pravatar.cc/150",
        email: currentUser.emailAddress || ""
      });
    }
    tasks.forEach(t => {
      if (t.fields.assignee) {
        const exists = list.some(m => m.accountId === t.fields.assignee.accountId);
        if (!exists) {
          list.push({
            accountId: t.fields.assignee.accountId,
            name: t.fields.assignee.displayName,
            avatar: t.fields.assignee.avatarUrl || "https://i.pravatar.cc/150",
            email: t.fields.assignee.email || ""
          });
        }
      }
      if (t.fields.reporter) {
        const exists = list.some(m => m.accountId === t.fields.reporter.accountId);
        if (!exists) {
          list.push({
            accountId: t.fields.reporter.accountId,
            name: t.fields.reporter.displayName,
            avatar: t.fields.reporter.avatarUrl || "https://i.pravatar.cc/150",
            email: t.fields.reporter.email || ""
          });
        }
      }
    });
    return list;
  }, [tasks, currentUser]);

  const activeProjectsList = useMemo(() => {
    const list = [];
    tasks.forEach(t => {
      const parentSummary = t.fields.parent?.summary;
      if (parentSummary && !list.includes(parentSummary)) {
        list.push(parentSummary);
      }
      if (t.fields.issueType === "Epic" && !list.includes(t.fields.summary)) {
        list.push(t.fields.summary);
      }
    });
    return list;
  }, [tasks]);

  const proposedProjectsForSpoke = useMemo(() => {
    if (activeWorkspace === "hub" || activeWorkspace === "moderator" || activeWorkspace === "meetings" || activeWorkspace === "playground") return [];
    const campusId = currentBoardId;
    const spoke = SPOKES[campusId];
    if (!spoke) return [];
    return moderatorProjects.filter(p => {
      if (p.allocations && p.allocations.length > 0) {
        return p.allocations.some(a => a.targetCampusId === campusId && a.status === "Proposed");
      }
      return p.status === "Proposed" && p.targetCampusId === campusId;
    });
  }, [moderatorProjects, activeWorkspace, currentBoardId]);

  const acceptedProjectsForSpoke = useMemo(() => {
    if (activeWorkspace === "hub" || activeWorkspace === "moderator" || activeWorkspace === "meetings" || activeWorkspace === "playground") return [];
    const campusId = currentBoardId;
    return moderatorProjects.filter(p => {
      if (p.allocations && p.allocations.length > 0) {
        return p.allocations.some(a => a.targetCampusId === campusId && a.status === "Active");
      }
      return p.status === "Active" && p.targetCampusId === campusId;
    });
  }, [moderatorProjects, activeWorkspace, currentBoardId]);

  // Handle Search and Filter logic
  const filteredTasks = useMemo(() => {
    // Determine valid Epic Keys for active projects on this spoke
    const validEpicKeys = acceptedProjectsForSpoke.map(proj => 
      proj.allocations ? proj.allocations.find(a => a.targetCampusId === currentBoardId)?.assignedKey : proj.assignedKey
    ).filter(Boolean);

    // Determine student's assigned teams and allocated projects if applicable
    let myTeamIds = [];
    let myProjectIds = [];
    if (sessionUser?.role === "Student Developer" && Array.isArray(spokeTeams)) {
      const myTeams = spokeTeams.filter(team => 
        team && Array.isArray(team.members) && team.members.some(m => 
          m && (
            m.accountId === sessionUser?.accountId || 
            (m.emailAddress && sessionUser?.email && m.emailAddress.toLowerCase().trim() === sessionUser.email.toLowerCase().trim())
          )
        )
      );
      myTeamIds = myTeams.map(team => team && team._id ? team._id.toString() : "");
      myProjectIds = myTeams.map(team => team && team.projectId ? team.projectId.toString() : "");
    }

    return tasks.filter((task) => {
      // 1. Exclude Epics from Kanban/Scope view
      if (task.fields.issueType === "Epic") {
        return false;
      }

      // 1.5 ONLY keep tasks that belong to an assigned active corporate project for this Spoke
      const parentEpicKey = task.fields?.parent?.key || task.parent?.key;
      if (!parentEpicKey || !validEpicKeys.includes(parentEpicKey)) {
        return false;
      }

      // 2. If student developer, ONLY show tasks assigned to them, their team, OR belonging to their allocated B2B Project
      if (sessionUser?.role === "Student Developer") {
        const assigneeEmail = task.fields?.assignee?.email || task.fields?.assignee?.emailAddress || "";
        const assigneeAccountId = task.fields?.assignee?.accountId ? task.fields.assignee.accountId.toString() : "";
        const currentUserEmail = sessionUser?.email || "";
        
        const isDirectlyAssigned = assigneeEmail && assigneeEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
        const isTeamAssigned = assigneeAccountId && myTeamIds.includes(assigneeAccountId);
        const belongsToTeamProject = task.fields.parent?.id && myProjectIds.includes(task.fields.parent.id.toString());
        
        if (!isDirectlyAssigned && !isTeamAssigned && !belongsToTeamProject) {
          return false;
        }
      }

      const summaryMatch = task.fields.summary
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      
      const keyMatch = task.key
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      
      const textMatch = summaryMatch || keyMatch;

      const priorityMatch =
        filterPriority === "All" ||
        task.fields.priority?.name === filterPriority;

      const assigneeMatch =
        filterAssignee === "All" ||
        (filterAssignee === "Unassigned" && !task.fields.assignee) ||
        task.fields.assignee?.displayName === filterAssignee;

      const projectMatch =
        filterProject === "All" ||
        (task.fields.parent?.summary === filterProject) ||
        (task.fields.issueType === "Epic" && task.fields.summary === filterProject);

      return textMatch && priorityMatch && assigneeMatch && projectMatch;
    });
  }, [tasks, searchQuery, filterPriority, filterAssignee, filterProject, sessionUser, spokeTeams, acceptedProjectsForSpoke, currentBoardId]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = filteredTasks.length;
    const backlog = filteredTasks.filter(t => t.fields.status.name === "Backlog").length;
    const progress = filteredTasks.filter(t => t.fields.status.name === "In Progress").length;
    const done = filteredTasks.filter(t => t.fields.status.name === "Done").length;
    
    // Priorities
    const high = filteredTasks.filter(t => t.fields.priority.name === "High").length;
    const medium = filteredTasks.filter(t => t.fields.priority.name === "Medium").length;
    const low = filteredTasks.filter(t => t.fields.priority.name === "Low").length;

    // Overdue counts (not Done, and deadline was before today May 26, 2026)
    const overdue = filteredTasks.filter(t => {
      if (t.fields.status.name === "Done" || !t.fields.dueDate) return false;
      const today = new Date("2026-05-26");
      const due = new Date(t.fields.dueDate);
      const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      return dDue.getTime() < dToday.getTime();
    }).length;

    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    // On-Time Completion Rate calculation (Done tasks with due dates compared to mock system date May 27, 2026)
    const doneTasks = filteredTasks.filter(t => t.fields.status.name === "Done");
    const tasksWithDue = doneTasks.filter(t => t.fields.dueDate);
    const onTimeCount = tasksWithDue.filter(t => {
      const due = new Date(t.fields.dueDate);
      const systemToday = new Date("2026-05-27");
      return due.getTime() >= systemToday.getTime();
    }).length;
    const onTimeRate = tasksWithDue.length > 0 ? Math.round((onTimeCount / tasksWithDue.length) * 100) : 100;

    return { total, backlog, progress, done, high, medium, low, overdue, completionRate, onTimeRate };
  }, [filteredTasks]);

  // Recharts Chart Formats
  const statusPieData = [
    { name: "Backlog", value: metrics.backlog, color: "#f59e0b" },
    { name: "In Progress", value: metrics.progress, color: "#3b82f6" },
    { name: "Done", value: metrics.done, color: "#10b981" },
  ].filter(d => d.value > 0);

  const priorityBarData = [
    { name: "High Priority", count: metrics.high, fill: "#ef4444" },
    { name: "Medium Priority", count: metrics.medium, fill: "#f97316" },
    { name: "Low Priority", count: metrics.low, fill: "#22c55e" },
  ];

  // Assignee task loading aggregates
  const assigneeWorkloadData = useMemo(() => {
    const counts = {};
    filteredTasks.forEach(t => {
      const name = t.fields.assignee?.displayName || "Unassigned";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      tasks: count,
    }));
  }, [filteredTasks]);

  // Aggregated Leaderboard ranking KLE, COEP, MMCOEP, RIT Spokes dynamically
  const leaderboardData = useMemo(() => {
    if (hubMetrics && Array.isArray(hubMetrics.spokes) && hubMetrics.spokes.length > 0) {
      return [...hubMetrics.spokes].sort((a, b) => b.done - a.done);
    }
    return [
      { id: "3", name: "KLE Spoke", done: 12, total: 18, completionRate: 67 },
      { id: "101", name: "COEP Spoke", done: 8, total: 15, completionRate: 53 },
      { id: "102", name: "MMCOEP Spoke", done: 5, total: 12, completionRate: 42 },
      { id: "103", name: "RIT Spoke", done: 3, total: 10, completionRate: 30 }
    ].sort((a, b) => b.done - a.done);
  }, [hubMetrics]);

  const todayMeetingsForSpoke = useMemo(() => {
    if (activeWorkspace === "hub" || activeWorkspace === "moderator" || activeWorkspace === "meetings" || activeWorkspace === "playground") return [];
    const campusId = currentBoardId;
    const todayStr = "2026-05-27";
    return meetings.filter(m => m.campusId === campusId && m.date === todayStr);
  }, [meetings, activeWorkspace, currentBoardId]);

  const todayConflictsForSpoke = useMemo(() => {
    const timeCounts = {};
    todayMeetingsForSpoke.forEach(m => {
      timeCounts[m.time] = (timeCounts[m.time] || 0) + 1;
    });
    return todayMeetingsForSpoke.filter(m => timeCounts[m.time] > 1);
  }, [todayMeetingsForSpoke]);

  // Dynamically resolve child checklist issues for both Epic and Standard parent tasks
  const currentTaskChildren = useMemo(() => {
    if (!selectedTask) return [];
    
    // For Epic, find all tasks that list this Epic as their parent in our state
    if (selectedTask.fields.issueType === "Epic") {
      return tasks.filter(t => t.fields.parent?.key === selectedTask.key).map(t => ({
        id: t.id,
        key: t.key,
        summary: t.fields.summary,
        statusName: t.fields.status.name,
        assignee: t.fields.assignee
      }));
    }
    
    // For standard issues, look for children in the task list OR fall back to fields.subtasks
    const childrenFromList = tasks.filter(t => t.fields.parent?.key === selectedTask.key).map(t => ({
      id: t.id,
      key: t.key,
      summary: t.fields.summary,
      statusName: t.fields.status.name,
      assignee: t.fields.assignee
    }));
    
    if (childrenFromList.length > 0) {
      return childrenFromList;
    }
    
    return (selectedTask.fields.subtasks || []).map(sub => {
      // Try to resolve assignee/full info from list
      const resolved = tasks.find(t => t.key === sub.key);
      return {
        id: sub.id,
        key: sub.key,
        summary: sub.summary,
        statusName: resolved ? resolved.fields.status.name : sub.statusName,
        assignee: resolved ? resolved.fields.assignee : null
      };
    });
  }, [selectedTask, tasks]);

  // Drag and Drop DragEnd Action
  const onDragEnd = (result) => {
    if (sessionUser?.role !== "Student Developer") {
      triggerToast(`Access Denied: As a ${sessionUser?.role}, you have read-only permission. Only Student Developers can update Kanban task statuses.`, "error");
      return;
    }
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Map column ID to actual status name
    const statusMap = {
      "col-backlog": "Backlog",
      "col-progress": "In Progress",
      "col-done": "Done",
    };
    
    const newStatus = statusMap[destination.droppableId];
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;
    
    const taskKey = task.key;
    
    // 1. Optimistic update in state
    setTasks(prevTasks => {
      return prevTasks.map(t => {
        if (t.id === draggableId) {
          return {
            ...t,
            fields: {
              ...t.fields,
              status: { name: newStatus }
            }
          };
        }
        return t;
      });
    });
    
    triggerToast(`Transitioning ${taskKey} to ${newStatus} in Jira...`);
    
    // 2. Perform live API status transition
    axios.post(`http://localhost:5000/tasks/${taskKey}/transition`, { statusName: newStatus })
      .then(() => {
        triggerToast(`Successfully transitioned ${taskKey} to ${newStatus} in Jira!`);
      })
      .catch(err => {
        console.error("Transition API Error:", err);
        triggerToast(`Failed to transition issue ${taskKey} in Jira. Reverting...`, "error");
        fetchJiraTasks(true); // Silent fetch to revert back to true Jira state
      });
  };

  // Create Task Action inside Jira Project
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newSummary.trim()) {
      triggerToast("Please enter a task summary title", "warning");
      return;
    }

    const assignedUser = spokeMembers.find(m => m.displayName === newAssignee);
    const assignedReporterUser = spokeMembers.find(m => m.displayName === newReporter);

    const payload = {
      summary: newSummary,
      description: newDescription || "No description provided.",
      statusName: newStatus,
      priorityName: newPriority,
      assigneeId: assignedUser ? assignedUser.accountId : null,
      reporterId: assignedReporterUser ? assignedReporterUser.accountId : null,
      dueDate: newDueDate || null,
      issueTypeName: newIssueType,
      boardId: currentBoardId
    };

    setIsLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/tasks", payload);
      triggerToast(`Created task ${res.data.key} in Jira successfully!`);
      
      // Reset Form
      setNewSummary("");
      setNewDescription("");
      setNewIssueType("Task");
      setNewAssignee("");
      setNewReporter("");
      setNewPriority("Medium");
      setNewStatus("Backlog");
      setNewDueDate("");
      setIsCreateOpen(false);
      
      // Silent fetch from Jira to update board
      await fetchJiraTasks(true);
    } catch (err) {
      console.error("Create issue error:", err);
      triggerToast("Failed to create issue in Jira.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Update Task fields inside Modal with live PUT to Jira
  const handleUpdateTaskDetail = async (updatedTask, changedField) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);

    try {
      if (changedField === "status") {
        triggerToast(`Transitioning ${updatedTask.key} to ${updatedTask.fields.status.name} in Jira...`);
        await axios.post(`http://localhost:5000/tasks/${updatedTask.key}/transition`, { statusName: updatedTask.fields.status.name });
        triggerToast(`Successfully transitioned ${updatedTask.key} to ${updatedTask.fields.status.name} in Jira!`);
      } else {
        const payload = {};
        if (changedField === "summary") payload.summary = updatedTask.fields.summary;
        if (changedField === "description") payload.description = updatedTask.fields.description;
        if (changedField === "dueDate") payload.dueDate = updatedTask.fields.dueDate;
        if (changedField === "assignee") payload.assignee = updatedTask.fields.assignee?.accountId || null;
        if (changedField === "reporter") payload.reporter = updatedTask.fields.reporter?.accountId || null;
        if (changedField === "priority") payload.priority = updatedTask.fields.priority?.name || null;

        triggerToast(`Saving ${changedField} updates for ${updatedTask.key} in Jira...`);
        await axios.put(`http://localhost:5000/tasks/${updatedTask.key}`, payload);
        triggerToast(`Successfully saved ${changedField} for ${updatedTask.key} in Jira!`);
      }
    } catch (err) {
      console.error("Update Issue API Error:", err);
      triggerToast(`Failed to update ${changedField} in Jira. Reverting...`, "error");
      fetchJiraTasks(true); // Silent reload to revert state
    }
  };

  // Toggle standard Jira issue impediment flag
  const handleToggleBlockerFlag = async (task) => {
    const nextFlagged = !task.fields.flagged;
    
    // 1. Optimistic update
    setTasks(prev => prev.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          fields: {
            ...t.fields,
            flagged: nextFlagged
          }
        };
      }
      return t;
    }));
    
    if (selectedTask && selectedTask.id === task.id) {
      setSelectedTask(prev => ({
        ...prev,
        fields: {
          ...prev.fields,
          flagged: nextFlagged
        }
      }));
    }

    try {
      triggerToast(nextFlagged ? `Flagging issue ${task.key} as BLOCKED...` : `Clearing blocker flag for ${task.key}...`, "warning");
      await axios.put(`http://localhost:5000/tasks/${task.key}/flag`, { flagged: nextFlagged });
      triggerToast(nextFlagged ? `Issue ${task.key} is now flagged as blocked!` : `Successfully cleared blocker flag for ${task.key}!`);
      await fetchJiraTasks(true);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update blocker status in Jira. Reverting...", "error");
      await fetchJiraTasks(true);
    }
  };

  // Log spent time on a task in Jira
  const handleLogWorkSpent = async (taskKey, timeSpentString, logComment) => {
    if (!timeSpentString.trim()) {
      triggerToast("Please specify time spent (e.g. 1h 30m, 45m)", "warning");
      return;
    }
    
    setIsLoading(true);
    try {
      triggerToast(`Logging ${timeSpentString} spent time to issue ${taskKey} in Jira...`);
      await axios.post(`http://localhost:5000/tasks/${taskKey}/worklog`, { timeSpent: timeSpentString, comment: logComment });
      triggerToast(`Successfully logged ${timeSpentString} to issue ${taskKey}!`);
      
      setWorklogTimeSpent("");
      setWorklogComment("");
      
      // Refetch worklogs immediately for the modal history
      const logsRes = await axios.get(`http://localhost:5000/tasks/${taskKey}/worklog`);
      setWorklogHistory(logsRes.data || []);
      
      await fetchJiraTasks(true);
      
      // Update selectedTask details with new timetracking metrics
      const updatedParent = tasks.find(t => t.key === taskKey);
      if (updatedParent) {
        setSelectedTask(updatedParent);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to log work in Jira.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Retrieve worklogs list for detail modal history
  const fetchWorklogHistory = async (taskKey) => {
    setIsHistoryLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/tasks/${taskKey}/worklog`);
      setWorklogHistory(res.data || []);
    } catch (err) {
      console.error("Fetch worklogs error:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Retrieve student deliverable submissions for detail modal
  const fetchSubmissions = async (taskId) => {
    setIsSubmissionsLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/tasks/${taskId}/submissions`);
      setSubmissions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
      triggerToast("Failed to retrieve student deliverables.", "error");
    } finally {
      setIsSubmissionsLoading(false);
    }
  };

  // Handle uploading a student deliverable submission
  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    if (!submitFile) {
      triggerToast("Please select a file to upload.", "warning");
      return;
    }

    setIsSubmittingDeliverable(true);
    try {
      const formData = new FormData();
      formData.append("studentName", sessionUser?.displayName || sessionUser?.email || currentUser?.displayName || currentUser?.email || "Student Developer");
      if (submitFileName.trim()) {
        formData.append("fileName", submitFileName);
      }
      formData.append("comments", submitComments);
      formData.append("file", submitFile);

      const res = await axios.post(`http://localhost:5000/tasks/${selectedTask.id}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data && res.data.success) {
        triggerToast("Deliverable artifact uploaded successfully!");
        setSubmitFileName("");
        setSubmitFile(null);
        setSubmitComments("");
        fetchSubmissions(selectedTask.id);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to submit deliverable.", "error");
    } finally {
      setIsSubmittingDeliverable(false);
    }
  };

  // Handle coordinator approving or requesting re-work on a student submission
  const handleUpdateSubmissionStatus = async (subId, newStatus, coordinatorFeedback) => {
    try {
      const res = await axios.put(`http://localhost:5000/submissions/${subId}/status`, {
        status: newStatus,
        feedback: coordinatorFeedback
      });

      if (res.data && res.data.success) {
        triggerToast(`Submission marked as ${newStatus} successfully!`);
        fetchAllSubmissions(); // Refresh global queue
        fetchJiraTasks(true); // Refresh JIRA/mock tasks to reflect Done or Blocked flags
        fetchHubMetrics(true); // Refresh hub metrics silently to update velocity/leaderboard!
      }
    } catch (err) {
      console.error("Failed to update submission status:", err);
      triggerToast("Failed to update submission review status.", "error");
    }
  };

  // Handle deleting a student submission persistently
  const handleDeleteSubmission = async (subId) => {
    try {
      const res = await axios.delete(`http://localhost:5000/submissions/${subId}`);
      if (res.data && res.data.success) {
        triggerToast("Submission history deleted successfully!");
        fetchAllSubmissions(); // Refresh global queue
        fetchJiraTasks(true); // Refresh tasks
        fetchHubMetrics(true); // Refresh hub metrics
      }
    } catch (err) {
      console.error("Failed to delete submission:", err);
      triggerToast("Failed to delete student submission.", "error");
    }
  };

  // Create a child subtask inside Jira parent issue
  const handleCreateSubtask = async (parentKey, subtaskSummary, assigneeId = null, parentIssueType = null) => {
    if (!subtaskSummary.trim()) {
      triggerToast("Please enter a task summary", "warning");
      return;
    }
    
    setIsLoading(true);
    try {
      const isEpic = parentIssueType && parentIssueType.toLowerCase() === "epic";
      const label = isEpic ? "child task" : "child subtask";
      triggerToast(`Creating ${label} under ${parentKey} in Jira...`);
      
      await axios.post(`http://localhost:5000/tasks/${parentKey}/subtask`, {
        summary: subtaskSummary,
        assigneeId: assigneeId || null,
        parentIssueType: parentIssueType || null
      });
      triggerToast(`Created ${label} successfully!`);
      
      setSubtaskInputSummary("");
      setSubtaskAssigneeId("");
      
      // Fetch fresh board tasks
      const latestTasks = await fetchJiraTasks(true);
      
      // Refresh the selected task modal view to include the new subtask
      if (Array.isArray(latestTasks)) {
        const updatedParent = latestTasks.find(t => t.key === parentKey);
        if (updatedParent) {
          setSelectedTask(updatedParent);
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to create child task in Jira.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Link two tickets on the board in Jira
  const handleLinkIssues = async (sourceKey, targetKey, relationType) => {
    if (!targetKey) {
      triggerToast("Please select a target issue to link with", "warning");
      return;
    }
    
    setIsLoading(true);
    try {
      triggerToast(`Linking issue ${sourceKey} to ${targetKey} in Jira...`);
      await axios.post(`http://localhost:5000/tasks/links`, { linkType: relationType, sourceKey, targetKey });
      triggerToast(`Issues successfully linked in Jira!`);
      
      setLinkTargetKey("");
      
      await fetchJiraTasks(true);
      
      // Refresh selected task inside modal view to reflect links
      const updatedParent = tasks.find(t => t.key === sourceKey);
      if (updatedParent) {
        setSelectedTask(updatedParent);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to link issues in Jira.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Update Custom labels string array in Jira
  const handleUpdateLabels = async (taskKey, newLabelsArray) => {
    try {
      // 1. Optimistic update
      setTasks(prev => prev.map(t => {
        if (t.key === taskKey) {
          return { ...t, fields: { ...t.fields, labels: newLabelsArray } };
        }
        return t;
      }));
      
      if (selectedTask && selectedTask.key === taskKey) {
        setSelectedTask(prev => ({
          ...prev,
          fields: { ...prev.fields, labels: newLabelsArray }
        }));
      }

      await axios.put(`http://localhost:5000/tasks/${taskKey}/labels`, { labels: newLabelsArray });
      triggerToast(`Saved tags for ${taskKey} in Jira!`);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to save labels in Jira.", "error");
      await fetchJiraTasks(true);
    }
  };

  // Delete Task Action from Jira
  const handleDeleteTask = async (taskId, taskKey) => {
    setIsLoading(true);
    try {
      triggerToast(`Deleting issue ${taskKey} from Jira...`, "warning");
      await axios.delete(`http://localhost:5000/tasks/${taskKey}`);
      triggerToast(`Permanently deleted issue ${taskKey} from Jira!`, "warning");
      setSelectedTask(null);
      await fetchJiraTasks(true);
    } catch (err) {
      console.error("Delete Task API Error:", err);
      const jiraErr = err.response?.data?.details?.errorMessages?.[0] || err.response?.data?.message || null;
      if (jiraErr) {
        triggerToast(`Jira Error: ${jiraErr}`, "error");
      } else {
        triggerToast(`Failed to delete issue ${taskKey} in Jira.`, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Open Email Composer Modal with Real Sender Profile Signature
  const handleOpenEmailComposer = (task) => {
    const assigneeName = task.fields.assignee?.displayName || "Team Member";
    // Check if the task assignee has a real email address fetched from Jira, or leave empty for editing!
    const assigneeEmail = task.fields.assignee?.email || "";
    
    setEmailTask(task);
    setEmailRecipient(assigneeEmail);
    setEmailSubject(`[URGENT REMINDER] Upcoming deadline for task ${task.key}`);
    
    const senderName = currentUser?.displayName || "Jira Administrator";
    const bodyText = `Hi ${assigneeName},\n\nThis is a friendly reminder that task ${task.key} ("${task.fields.summary}") has an active due date of ${task.fields.dueDate || "N/A"} and is currently in status "${task.fields.status?.name}".\n\nPlease update the status or notify us if any adjustment is needed.\n\nBest regards,\n${senderName} (Jira Dashboard)`;
    
    setEmailBody(bodyText);
    setSelectedTask(null); // Close detail modal
    setIsEmailOpen(true);
    setEmailAnimationState("preparing");
  };

  // Trigger outbound email dispatcher (with envelope fly animation)
  const handleSendReminderEmail = (e) => {
    e.preventDefault();
    setIsSendingEmail(true);
    setEmailAnimationState("sending");

    const payload = {
      recipient: emailRecipient,
      subject: emailSubject,
      taskKey: emailTask?.key || "APNI-REMINDER",
      taskSummary: emailTask?.fields?.summary || "",
      dueDate: emailTask?.fields?.dueDate || "",
      message: emailBody
    };

    // Duration of envelope flight animation: 2.2 seconds
    setTimeout(() => {
      axios.post("http://localhost:5000/tasks/send-reminder", payload)
        .then(res => {
          triggerToast(res.data.message || `Dispatched alert successfully to ${emailRecipient}!`);
          if (res.data.previewUrl) {
            triggerToast("SMTP Preview opening in a new tab...");
            window.open(res.data.previewUrl, "_blank");
          }
        })
        .catch(err => {
          console.error(err);
          triggerToast("Relay Failed. Make sure SMTP server settings or backend is running.", "error");
        })
        .finally(() => {
          setIsSendingEmail(false);
          setIsEmailOpen(false);
          setEmailAnimationState("sent");
        });
    }, 2200);
  };

  // Helper styles for drag and drop column states
  const getColumnStyle = (isDraggingOver) => ({
    background: isDraggingOver ? "rgba(59, 82, 154, 0.06)" : "var(--bg-column)",
    border: isDraggingOver ? "1.5px dashed var(--primary)" : "1px solid var(--border-subtle)",
    borderRadius: "8px",
    padding: "16px",
    minHeight: "550px",
    transition: "var(--transition-smooth)",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactSubject.trim() || !contactMessage.trim()) {
      triggerToast("Please fill in all form fields.", "warning");
      return;
    }
    
    setIsSubmittingContact(true);
    setTimeout(() => {
      triggerToast("Message sent successfully! Our coordinator will contact you shortly.");
      setContactName("");
      setContactEmail("");
      setContactSubject("");
      setContactMessage("");
      setIsSubmittingContact(false);
    }, 1500);
  };

  const renderPublicNavbar = () => {
    return (
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 60px",
        background: theme === "dark" ? "#0f172a" : "#ffffff",
        borderBottom: theme === "dark" ? "1px solid #1e293b" : "1px solid #e2e8f0",
        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        transition: "var(--transition-smooth)"
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => setLandingTab("home")}
          style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-sans)", fontWeight: "800", fontSize: "28px", cursor: "pointer" }}
        >
          <span style={{ color: "#ef4444" }}>Apni</span>
          <span style={{ color: "#3b529a", position: "relative", display: "inline-flex", alignItems: "center" }}>
            Leap
            <span style={{ color: "#10b981", marginLeft: "4px", fontSize: "20px", fontWeight: "900" }}>↗</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {[
            { key: "home", label: "Home" },
            { key: "about", label: "About" },
            { key: "collaboration", label: "Industry-Academia Collaboration" },
            { key: "contact", label: "Contact Us" }
          ].map(link => {
            const isActive = landingTab === link.key;
            return (
              <button
                key={link.key}
                onClick={() => setLandingTab(link.key)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: isActive 
                    ? "#ef4444" 
                    : (theme === "dark" ? "#cbd5e1" : "#3b529a"),
                  fontWeight: "700",
                  fontSize: "14.5px",
                  cursor: "pointer",
                  padding: "8px 0",
                  position: "relative",
                  transition: "var(--transition-smooth)"
                }}
              >
                {link.label}
                {isActive && (
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "3px",
                    backgroundColor: "#ef4444",
                    borderRadius: "2px"
                  }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Action CTA */}
        <div>
          {isAuthenticated ? (
            <button
              onClick={() => setViewMode("dashboard")}
              style={{
                background: "#ef4444",
                color: "#ffffff",
                border: "none",
                padding: "10px 22px",
                borderRadius: "8px",
                fontWeight: "750",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(239, 68, 68, 0.2)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "var(--transition-smooth)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(239, 68, 68, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(239, 68, 68, 0.2)";
              }}
            >
              Go to Dashboard <FaChevronRight size={12} />
            </button>
          ) : (
            <button
              onClick={() => setLandingTab("login")}
              style={{
                background: "#3b529a",
                color: "#ffffff",
                border: "none",
                padding: "10px 22px",
                borderRadius: "8px",
                fontWeight: "750",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(59, 82, 154, 0.2)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "var(--transition-smooth)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 82, 154, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(59, 82, 154, 0.2)";
              }}
            >
              Portal Sign In <FaLock size={12} />
            </button>
          )}
        </div>
      </header>
    );
  };

  const renderPublicFooter = () => {
    return (
      <footer style={{
        background: "#0a1128",
        color: "#ffffff",
        padding: "60px 80px 20px 80px",
        fontFamily: "var(--font-sans)",
        width: "100%",
        borderTop: "1px solid rgba(255,255,255,0.05)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "40px",
          marginBottom: "40px",
          maxWidth: "1200px",
          margin: "0 auto 40px auto"
        }}>
          {/* Column 1: Logo & Socials */}
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "800", fontSize: "28px", marginBottom: "20px" }}>
              <span style={{ color: "#ef4444" }}>Apni</span>
              <span style={{ color: "#ffffff", position: "relative", display: "inline-flex", alignItems: "center" }}>
                Leap
                <span style={{ color: "#10b981", marginLeft: "4px", fontSize: "20px" }}>↗</span>
              </span>
            </div>
            {/* Social Circles */}
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              {[
                { icon: <FaGlobe />, url: "#" },
                { icon: <FaEnvelope />, url: "mailto:info@apnileap.org" },
                { icon: <FaUser />, url: "#" },
                { icon: <FaUsers />, url: "#" }
              ].map((soc, idx) => (
                <a 
                  key={idx}
                  href={soc.url}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#122047",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    transition: "var(--transition-smooth)",
                    textDecoration: "none"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#122047";
                  }}
                >
                  {soc.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div style={{ flex: "1 1 200px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#60a5fa", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>
              Quick Links
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { key: "home", label: "HOME" },
                { key: "about", label: "ABOUT" },
                { key: "collaboration", label: "INDUSTRY-ACADEMIA COLLABORATION" },
                { key: "contact", label: "CONTACT US" }
              ].map(link => (
                <button
                  key={link.key}
                  onClick={() => {
                    setLandingTab(link.key);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: landingTab === link.key ? "#ef4444" : "#cbd5e1",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 0,
                    transition: "var(--transition-smooth)",
                    letterSpacing: "0.5px"
                  }}
                  onMouseEnter={(e) => {
                    if (landingTab !== link.key) e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    if (landingTab !== link.key) e.currentTarget.style.color = "#cbd5e1";
                  }}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Column 3: Address */}
          <div style={{ flex: "1 1 300px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#60a5fa", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>
              Address
            </h4>
            <p style={{ fontSize: "13.5px", color: "#94a3b8", lineHeight: "1.7", fontWeight: "500" }}>
              NETRA Accelerator Foundation CTIE, RH Kulkarni Memorial Complex, BVB Campus, Revenue Colony, Vidya Nagar BVB, Hubli Eng College, Dharwad, Hubli 580031, Karnataka, India
            </p>
          </div>
        </div>

        {/* Copyright line */}
        <div style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          paddingTop: "20px",
          textAlign: "center",
          fontSize: "12px",
          color: "#64748b",
          fontWeight: "600",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          Copyright © 2026 ApniLeap | Powered by ArrayPointer
        </div>
      </footer>
    );
  };

  const renderPortalModals = () => {
    if (!portalModal) return null;
    
    let title = "";
    let content = null;
    
    if (portalModal === "academia") {
      title = "Select Campus Workspace";
      const spokesList = [
        { id: "3", name: "KLE Tech Hub Campus", mentor: "coordinator@kle.edu", student: "student@kle.edu" },
        { id: "101", name: "COEP Campus", mentor: "coordinator@coep.edu", student: "student@coep.edu" },
        { id: "102", name: "MMCOEP Campus", mentor: "coordinator@mmcoep.edu", student: "student@mmcoep.edu" },
        { id: "103", name: "RIT Campus", mentor: "coordinator@rit.edu", student: "student@rit.edu" }
      ];
      
      content = (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
          {spokesList.map(sp => (
            <div key={sp.id} style={{
              padding: "16px",
              borderRadius: "12px",
              background: theme === "dark" ? "#1e293b" : "#f8fafc",
              border: theme === "dark" ? "1px solid #334155" : "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              <span style={{ fontWeight: "800", fontSize: "14.5px", color: theme === "dark" ? "#f8fafc" : "#3b529a" }}>{sp.name}</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  onClick={() => {
                    handleQuickConnect(sp.mentor);
                    setPortalModal(null);
                  }}
                  style={{
                    background: "#3b529a",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "var(--transition-smooth)"
                  }}
                >
                  Faculty Mentor
                </button>
                <button
                  onClick={() => {
                    handleQuickConnect(sp.student);
                    setPortalModal(null);
                  }}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "var(--transition-smooth)"
                  }}
                >
                  Student Developer Space
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    } else if (portalModal === "industries") {
      title = "Select Corporate Partner Workspace";
      content = (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
          <button
            onClick={() => {
              handleQuickConnect("moderator@apnileap.com");
              setPortalModal(null);
            }}
            style={{
              background: "#3b529a",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: "750",
              fontSize: "14px",
              cursor: "pointer",
              transition: "var(--transition-smooth)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <FaTools /> Central Portfolio & Moderation Hub
          </button>
          <button
            onClick={() => {
              handleQuickConnect("sponsor@nvidia.com");
              setPortalModal(null);
            }}
            style={{
              background: "#3b529a",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: "750",
              fontSize: "14px",
              cursor: "pointer",
              transition: "var(--transition-smooth)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <FaDesktop /> NVIDIA Corporate Sponsorship Portal
          </button>
          <button
            onClick={() => {
              handleQuickConnect("mentor@nvidia.com");
              setPortalModal(null);
            }}
            style={{
              background: "#3b529a",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: "750",
              fontSize: "14px",
              cursor: "pointer",
              transition: "var(--transition-smooth)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <FaUserTie /> Project Mentor Portal (Demo)
          </button>
        </div>
      );
    } else if (portalModal === "startups") {
      title = "Select Startup & Venture Console";
      content = (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
          <button
            onClick={() => {
              handleQuickConnect("admin@apnileap.com");
              setPortalModal(null);
            }}
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: "750",
              fontSize: "14px",
              cursor: "pointer",
              transition: "var(--transition-smooth)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <FaShieldAlt /> Executive Administration Console
          </button>
        </div>
      );
    }
    
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}>
        <div style={{
          background: theme === "dark" ? "#0f172a" : "#ffffff",
          border: theme === "dark" ? "1px solid #1e293b" : "1px solid #e2e8f0",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "420px",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          position: "relative"
        }}>
          <button
            onClick={() => setPortalModal(null)}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "transparent",
              border: "none",
              color: theme === "dark" ? "#cbd5e1" : "#475569",
              cursor: "pointer",
              fontSize: "18px"
            }}
          >
            <FaTimes />
          </button>
          
          <h3 style={{
            fontSize: "18px",
            fontWeight: "800",
            color: theme === "dark" ? "#ffffff" : "#0f172a",
            textAlign: "center"
          }}>
            {title}
          </h3>
          
          {content}
        </div>
      </div>
    );
  };

  const renderPublicTabContent = () => {
    if (landingTab === "home") {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          background: theme === "dark" ? "#0b0f19" : "#ffffff",
          transition: "var(--transition-smooth)"
        }}>
          {/* SECTION 1: OVERVIEW */}
          <div style={{
            width: "100%",
            padding: "60px 20px",
            background: theme === "dark" ? "#0f172a" : "#ffffff",
            display: "flex",
            justifyContent: "center"
          }}>
            <div style={{
              width: "100%",
              maxWidth: "1150px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "40px",
              alignItems: "center"
            }}>
              <div>
                <h2 style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: "850",
                  fontSize: "30px",
                  color: theme === "dark" ? "#60a5fa" : "#0048ba",
                  marginBottom: "24px",
                  letterSpacing: "-0.5px"
                }}>
                  Overview
                </h2>
                <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    "Netra Accelerator Foundation is a Non-Profit organization founded in year 2020 in the city of Hubballi in Karnataka State.",
                    "Objective of Netra has been to transform engineering campuses into Product Innovation Centers (EPIC) through industry partnerships.",
                    "To drive this aim, Netra has created a thoughtful, proven execution model under “A Product Nation Innovation Leap” which has been branded as APNILeap.",
                    "APNILeap helps build an ecosystem of academia, startups, and industries on campus using the APNILeap Playbook.",
                    "Under APNILeap, there is another foundational program called VidyaLeap that helps establish initial engagements with engineering colleges and drive product/project activities on campus.",
                    "APNILeap has been innovating this model continuously for several years and has now become an implementable and scalable model, gaining acceptance from academia and support from many industries."
                  ].map((pt, idx) => (
                    <li key={idx} style={{
                      position: "relative",
                      paddingLeft: "24px",
                      fontSize: "14.5px",
                      lineHeight: "1.6",
                      color: theme === "dark" ? "#cbd5e1" : "#1e3a8a",
                      fontWeight: "500"
                    }}>
                      <span style={{
                        position: "absolute",
                        left: "4px",
                        top: "9px",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#ef4444"
                      }} />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Flowchart Diagram */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background: theme === "dark" ? "#1e293b" : "#f8fafc",
                borderRadius: "24px",
                border: theme === "dark" ? "1px solid #334155" : "1.5px solid rgba(0,0,0,0.03)",
                boxShadow: theme === "dark" ? "none" : "0 8px 24px rgba(0,0,0,0.02)"
              }}>
                <div style={{
                  width: "100%",
                  maxWidth: "280px",
                  padding: "16px 20px",
                  background: theme === "dark" ? "#0f172a" : "#ffffff",
                  border: "2px solid #3b529a",
                  borderRadius: "14px",
                  textAlign: "center",
                  fontWeight: "800",
                  fontSize: "14px",
                  color: "#3b529a",
                  boxShadow: "0 4px 10px rgba(59, 82, 154, 0.08)"
                }}>
                  Netra Accelerator Foundation
                </div>
                <div style={{ margin: "8px 0", color: "#3b529a", fontSize: "20px", fontWeight: "900" }}>↓</div>
                
                <div style={{
                  width: "100%",
                  maxWidth: "280px",
                  padding: "16px 20px",
                  background: theme === "dark" ? "#0f172a" : "#ffffff",
                  border: "2px solid #3b529a",
                  borderRadius: "14px",
                  textAlign: "center",
                  fontWeight: "800",
                  fontSize: "14px",
                  color: "#3b529a",
                  boxShadow: "0 4px 10px rgba(59, 82, 154, 0.08)"
                }}>
                  APNILeap
                </div>
                <div style={{ margin: "8px 0", color: "#3b529a", fontSize: "20px", fontWeight: "900" }}>↓</div>
                
                <div style={{
                  width: "100%",
                  maxWidth: "280px",
                  padding: "16px 20px",
                  background: theme === "dark" ? "#0f172a" : "#ffffff",
                  border: "2px solid #3b529a",
                  borderRadius: "14px",
                  textAlign: "center",
                  fontWeight: "800",
                  fontSize: "14px",
                  color: "#3b529a",
                  boxShadow: "0 4px 10px rgba(59, 82, 154, 0.08)"
                }}>
                  VidyaLeap
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: BENEFICIARIES / STAKEHOLDERS */}
          <div style={{
            width: "100%",
            padding: "60px 20px",
            background: theme === "dark" ? "#111827" : "#f8fafc",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <h2 style={{
              fontFamily: "var(--font-sans)",
              fontWeight: "850",
              fontSize: "30px",
              color: theme === "dark" ? "#60a5fa" : "#0048ba",
              marginBottom: "32px",
              letterSpacing: "-0.5px"
            }}>
              Beneficiaries / Stakeholders
            </h2>
            
            {/* Main Triple-Column Card */}
            <div style={{
              background: theme === "dark" ? "#1e293b" : "#ffffff",
              border: theme === "dark" ? "1px solid #334155" : "1.5px solid rgba(0,0,0,0.04)",
              borderRadius: "32px",
              boxShadow: theme === "dark" ? "0 10px 30px rgba(0,0,0,0.3)" : "0 15px 45px rgba(0,0,0,0.04)",
              width: "100%",
              maxWidth: "1150px",
              padding: "50px 40px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "40px",
              transition: "var(--transition-smooth)",
              marginBottom: "40px"
            }}>
              {/* Column 1: Academia */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center"
              }}>
                <div style={{ marginBottom: "20px" }}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "800", color: "#ef4444", marginBottom: "4px" }}>Academia</h3>
                <p style={{ fontSize: "14px", fontWeight: "700", color: theme === "dark" ? "#94a3b8" : "#475569", marginBottom: "24px" }}>Students + Faculties</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "260px" }}>
                  <button 
                    onClick={() => setPortalModal("academia")}
                    style={{
                      background: "#0048ba",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontWeight: "750",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "var(--transition-smooth)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#00368c"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#0048ba"}
                  >
                    Product Based Ecosystem
                  </button>
                  <button 
                    onClick={() => setPortalModal("academia")}
                    style={{
                      background: "#0048ba",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontWeight: "750",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "var(--transition-smooth)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#00368c"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#0048ba"}
                  >
                    Quality Placements/ Startups Creation
                  </button>
                </div>
              </div>
              
              {/* Column 2: Industries */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center"
              }}>
                <div style={{ marginBottom: "20px" }}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "800", color: "#ef4444", marginBottom: "4px" }}>Industries</h3>
                <p style={{ fontSize: "14px", fontWeight: "700", color: theme === "dark" ? "#94a3b8" : "#475569", marginBottom: "24px" }}>Product Base</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "260px" }}>
                  <button 
                    onClick={() => setPortalModal("industries")}
                    style={{
                      background: "#0048ba",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontWeight: "750",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "var(--transition-smooth)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#00368c"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#0048ba"}
                  >
                    Product Development
                  </button>
                  <button 
                    onClick={() => setPortalModal("industries")}
                    style={{
                      background: "#0048ba",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontWeight: "750",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "var(--transition-smooth)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#00368c"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#0048ba"}
                  >
                    Research Collaboration
                  </button>
                </div>
              </div>
              
              {/* Column 3: Startups */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center"
              }}>
                <div style={{ marginBottom: "20px" }}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M12 2C6 2 2 6 2 12c0 2.5 1 4.5 2.5 6h11c1.5-1.5 2.5-3.5 2.5-6 0-6-4-10-10-10z"/>
                    <path d="M9 15l6-6M11.5 6.5A1.5 1.5 0 1 0 10 5a1.5 1.5 0 0 0 1.5 1.5z"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: "800", color: "#ef4444", marginBottom: "4px" }}>Startups</h3>
                <p style={{ fontSize: "14px", fontWeight: "700", color: theme === "dark" ? "#94a3b8" : "#475569", marginBottom: "24px" }}>Business</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "260px" }}>
                  <button 
                    onClick={() => setPortalModal("startups")}
                    style={{
                      background: "#0048ba",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontWeight: "750",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "var(--transition-smooth)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#00368c"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#0048ba"}
                  >
                    Business Support
                  </button>
                  <button 
                    onClick={() => setPortalModal("startups")}
                    style={{
                      background: "#0048ba",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontWeight: "750",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "var(--transition-smooth)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#00368c"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#0048ba"}
                  >
                    Funding Support
                  </button>
                </div>
              </div>
            </div>
            
            {/* Bottom Call to Action */}
            <button 
              onClick={() => setLandingTab("contact")}
              style={{
                background: "#0048ba",
                color: "#ffffff",
                border: "none",
                padding: "14px 28px",
                borderRadius: "8px",
                fontWeight: "750",
                fontSize: "15px",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(0, 72, 186, 0.2)",
                transition: "var(--transition-smooth)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 72, 186, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 72, 186, 0.2)";
              }}
            >
              To Know More, Contact us
            </button>
          </div>

          {/* SECTION 3: CHALLENGES IN INDIA IAC ECOSYSTEM MODEL */}
          <div style={{
            width: "100%",
            padding: "60px 20px",
            background: theme === "dark" ? "#0f172a" : "#ffffff",
            display: "flex",
            justifyContent: "center"
          }}>
            <div style={{
              width: "100%",
              maxWidth: "1150px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "50px",
              alignItems: "center"
            }}>
              {/* Left Column: Venn Diagram */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <h2 style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: "850",
                  fontSize: "26px",
                  color: theme === "dark" ? "#60a5fa" : "#0048ba",
                  marginBottom: "24px",
                  letterSpacing: "-0.5px",
                  textAlign: "center",
                  alignSelf: "stretch"
                }}>
                  Challenges in India IAC Ecosystem Model
                </h2>
                
                <svg width="340" height="320" viewBox="0 0 340 320" style={{ maxWidth: "100%", height: "auto" }}>
                  <circle cx="170" cy="120" r="80" fill={theme === "dark" ? "rgba(99, 102, 241, 0.08)" : "rgba(224, 231, 255, 0.55)"} stroke="#3b529a" strokeWidth="2.5" />
                  <circle cx="120" cy="200" r="75" fill={theme === "dark" ? "rgba(239, 68, 68, 0.05)" : "rgba(254, 242, 242, 0.6)"} stroke="#ef4444" strokeWidth="2" />
                  <circle cx="220" cy="200" r="75" fill={theme === "dark" ? "rgba(16, 185, 129, 0.05)" : "rgba(236, 253, 245, 0.6)"} stroke="#10b981" strokeWidth="2" />
                  
                  <text x="170" y="70" textAnchor="middle" fill="#3b529a" fontWeight="800" fontSize="10.5">Academic Institution</text>
                  <text x="90" y="195" textAnchor="middle" fill="#ef4444" fontWeight="800" fontSize="9.5">Learning</text>
                  <text x="90" y="208" textAnchor="middle" fill="#ef4444" fontWeight="800" fontSize="9.5">Ecosystem</text>
                  <text x="90" y="221" textAnchor="middle" fill="#ef4444" fontWeight="600" fontSize="8.5">(Students)</text>
                  
                  <text x="250" y="195" textAnchor="middle" fill="#10b981" fontWeight="800" fontSize="9.5">Research</text>
                  <text x="250" y="208" textAnchor="middle" fill="#10b981" fontWeight="800" fontSize="9.5">Ecosystem</text>
                  <text x="250" y="221" textAnchor="middle" fill="#10b981" fontWeight="600" fontSize="8.5">(Faculty)</text>
                  
                  <text x="170" y="155" textAnchor="middle" fill="#3b529a" fontWeight="800" fontSize="9.5">Industry and</text>
                  <text x="170" y="167" textAnchor="middle" fill="#3b529a" fontWeight="800" fontSize="9.5">Startup Ecosystem</text>
                  
                  <text x="170" y="300" textAnchor="middle" fill={theme === "dark" ? "#cbd5e1" : "#1e3a8a"} fontWeight="850" fontSize="13">IAC Ecosystem Model</text>
                </svg>
                
                <div style={{
                  fontSize: "12px",
                  color: theme === "dark" ? "#64748b" : "#475569",
                  fontWeight: "600",
                  marginTop: "16px",
                  textAlign: "center",
                  lineHeight: "1.4",
                  maxWidth: "400px"
                }}>
                  Note: In India there are very few role models for IAC – with some exceptions like leading Medical Colleges, IITM, IITB, KLE Tech
                </div>
              </div>
              
              {/* Right Column: Challenges List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: theme === "dark" ? "#60a5fa" : "#3b529a", marginBottom: "4px" }}>
                  Challenges and Impact
                </h3>
                
                {[
                  "Systemic Issues: Lack of alignment, lack of knowledge transfer and <strong>Poor collaboration</strong>",
                  "Creating a <strong>Valley of Death</strong> of failed joint-research projects that hinder the nation’s goal to become a product-driven economy.",
                  "Impacting innovation output: India ranks <strong>86th globally</strong> in Industry-Academia collaboration."
                ].map((item, idx) => (
                  <div key={idx} style={{
                    padding: "20px",
                    background: theme === "dark" ? "#1e293b" : "#f8fafc",
                    border: theme === "dark" ? "1px solid #334155" : "1.5px solid rgba(0,0,0,0.03)",
                    borderLeft: "4px solid #ef4444",
                    borderRadius: "0 12px 12px 0",
                    boxShadow: theme === "dark" ? "none" : "0 4px 12px rgba(0,0,0,0.01)",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    color: theme === "dark" ? "#cbd5e1" : "#1e3a8a",
                    fontWeight: "500"
                  }} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: THE VALLEY OF DEATH */}
          <div style={{
            width: "100%",
            padding: "60px 20px",
            background: theme === "dark" ? "#111827" : "#f8fafc",
            display: "flex",
            justifyContent: "center"
          }}>
            <div style={{
              width: "100%",
              maxWidth: "1150px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "40px",
              alignItems: "center"
            }}>
              {/* Left Column: Points */}
              <div>
                <h2 style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: "850",
                  fontSize: "30px",
                  color: theme === "dark" ? "#60a5fa" : "#0048ba",
                  marginBottom: "24px",
                  letterSpacing: "-0.5px"
                }}>
                  The Valley of Death
                </h2>
                <div style={{
                  padding: "24px",
                  background: theme === "dark" ? "#1e293b" : "#ffffff",
                  border: theme === "dark" ? "1px solid #334155" : "1.5px solid rgba(0,0,0,0.03)",
                  borderRadius: "16px",
                  boxShadow: theme === "dark" ? "none" : "0 10px 30px rgba(0,0,0,0.02)"
                }}>
                  <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                    {[
                      "The missing link isn't talent or ideas",
                      "It's the culture and ability to collaborate within the ecosystem",
                      "Without it, academic innovations stall before reaching industry or consumers"
                    ].map((pt, idx) => (
                      <li key={idx} style={{
                        position: "relative",
                        paddingLeft: "24px",
                        fontSize: "15px",
                        lineHeight: "1.6",
                        color: theme === "dark" ? "#cbd5e1" : "#1e3a8a",
                        fontWeight: "600"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "4px",
                          top: "9px",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#ef4444"
                        }} />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Right Column: Valley of Death SVG Diagram */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                background: theme === "dark" ? "#1e293b" : "#ffffff",
                border: theme === "dark" ? "1px solid #334155" : "1.5px solid rgba(0,0,0,0.03)",
                borderRadius: "24px",
                boxShadow: theme === "dark" ? "none" : "0 8px 30px rgba(0,0,0,0.02)"
              }}>
                <svg width="550" height="280" viewBox="0 0 550 280" style={{ maxWidth: "100%", height: "auto" }}>
                  <path d="M 50 210 C 100 100, 150 90, 220 200 L 220 210 Z" fill={theme === "dark" ? "rgba(99, 102, 241, 0.15)" : "rgba(219, 234, 254, 0.6)"} />
                  <path d="M 330 210 C 370 200, 420 100, 500 130 L 500 210 Z" fill={theme === "dark" ? "rgba(239, 68, 68, 0.1)" : "rgba(254, 226, 226, 0.6)"} />

                  <line x1="40" y1="210" x2="520" y2="210" stroke={theme === "dark" ? "#475569" : "#cbd5e1"} strokeWidth="2" />

                  <text x="135" y="145" textAnchor="middle" fill="#3b529a" fontWeight="800" fontSize="10.5">Academic Research</text>

                  <text x="445" y="145" textAnchor="middle" fill="#dc2626" fontWeight="800" fontSize="10.5">Industry Application</text>

                  <text x="275" y="195" textAnchor="middle" fill="#ef4444" fontWeight="850" fontSize="12">Valley of Death</text>

                  <text x="70" y="80" fill="gray" fontSize="8" fontWeight="600">Public Funding /</text>
                  <text x="70" y="90" fill="gray" fontSize="8" fontWeight="600">Private Investment</text>
                  <line x1="120" y1="95" x2="120" y2="120" stroke="gray" strokeWidth="1" strokeDasharray="3" />

                  <text x="390" y="80" fill="gray" fontSize="8" fontWeight="600">Private</text>
                  <text x="390" y="90" fill="gray" fontSize="8" fontWeight="600">Investment</text>
                  <line x1="410" y1="95" x2="430" y2="115" stroke="gray" strokeWidth="1" strokeDasharray="3" />

                  <path d="M 50 210 C 100 100, 150 90, 220 200 C 275 220, 275 220, 330 210 C 370 200, 420 100, 500 130" fill="none" stroke="#2563eb" strokeWidth="3" />
                  <path d="M 310 212 C 340 205, 380 140, 500 130" fill="none" stroke="#ef4444" strokeWidth="3" />

                  <circle cx="60" cy="210" r="4" fill="#ef4444" />
                  <line x1="60" y1="210" x2="60" y2="245" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
                  <text x="60" y="255" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="600">Discovery</text>

                  <circle cx="120" cy="210" r="4" fill="#ef4444" />
                  <line x1="120" y1="210" x2="120" y2="245" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
                  <text x="120" y="255" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Fundamental</text>
                  <text x="120" y="265" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Research</text>

                  <circle cx="180" cy="210" r="4" fill="#ef4444" />
                  <line x1="180" y1="210" x2="180" y2="245" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
                  <text x="180" y="255" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Concept &</text>
                  <text x="180" y="265" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Applied</text>
                  <text x="180" y="275" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Research</text>

                  <circle cx="240" cy="210" r="4" fill="#ef4444" />
                  <line x1="240" y1="210" x2="240" y2="245" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
                  <text x="240" y="255" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Technology</text>
                  <text x="240" y="265" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Transfer</text>

                  <circle cx="300" cy="210" r="4" fill="#ef4444" />
                  <line x1="300" y1="210" x2="300" y2="245" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
                  <text x="300" y="255" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Development</text>

                  <circle cx="360" cy="210" r="4" fill="#ef4444" />
                  <line x1="360" y1="210" x2="360" y2="245" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
                  <text x="360" y="255" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Product</text>
                  <text x="360" y="265" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Launch</text>

                  <circle cx="430" cy="210" r="4" fill="#ef4444" />
                  <line x1="430" y1="210" x2="430" y2="245" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
                  <text x="430" y="255" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Success</text>
                  <text x="430" y="265" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">as a new</text>
                  <text x="430" y="275" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Product</text>

                  <circle cx="490" cy="210" r="4" fill="#ef4444" />
                  <line x1="490" y1="210" x2="490" y2="245" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
                  <text x="490" y="255" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Success as</text>
                  <text x="490" y="265" textAnchor="middle" fill="gray" fontSize="7.5" fontWeight="500">Business</text>
                </svg>
                
                <div style={{
                  fontSize: "10px",
                  color: "gray",
                  marginTop: "12px",
                  textAlign: "center",
                  lineHeight: "1.4"
                }}>
                  Valley of death reprinted and adapted from Chirazi, Wanieck, Fayemi, Zollfrank, & Jacobs, 2019, under CC By 4.0 license
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (landingTab === "about") {
      const coFounders = [
        {
          name: "Vivek Pawar",
          region: "India",
          initials: "VP",
          img: "/images/vivek_pawar.png",
          bulletPoints: [
            "Vivek's previous role was the CEO of the Deshpande Foundation and continues to serve as an Advisor on the Academic council of BVB KLE Tech University",
            "Prior, Vivek was the Founder and Executive Chairman of Sankalp Semiconductors which he incubated at BVBKLE Tech. Acquired by HCL in 2019."
          ]
        },
        {
          name: "Prof. Dr. Ashok Shettar",
          region: "India",
          initials: "AS",
          img: "/images/ashok_shettar.png",
          bulletPoints: [
            "Professor Shettar is Pro-Chancellor of KLE Tech University and previously served as the Principal of BVB College of Engineering",
            "Nationally recognized thought leader in engineering education and industry collaboration, he has led KLE Tech for past 20 years."
          ]
        },
        {
          name: "Mahesh Jadhav",
          region: "USA",
          initials: "MJ",
          img: "/images/mahesh_jadhav.png",
          bulletPoints: [
            "Mahesh was one of the Founding Investors and Board Members of Sankalp Semiconductors and serves as a Board Member of BVB KLE Tech Incubation Center",
            "Mahesh is a Private Equity Investor (Mubadala Capital). Prior, he worked in R&D, Finance & Strategic Leadership roles (Tata, Siemens, PwC, Accenture, Cognizant)."
          ]
        }
      ];

      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          background: theme === "dark" ? "#0b0f19" : "#ffffff",
          padding: "60px 20px",
          transition: "var(--transition-smooth)"
        }}>
          <h2 style={{
            fontFamily: "var(--font-sans)",
            fontWeight: "850",
            fontSize: "36px",
            color: theme === "dark" ? "#60a5fa" : "#1e3a8a",
            marginBottom: "50px",
            letterSpacing: "-0.5px"
          }}>
            ApniLeap Co-Founders
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "40px", width: "100%", maxWidth: "900px" }}>
            {coFounders.map((founder, idx) => (
              <div key={idx} style={{
                display: "flex",
                background: theme === "dark" ? "#1e293b" : "#ffffff",
                border: theme === "dark" ? "1px solid #334155" : "1.5px solid rgba(0,0,0,0.04)",
                borderRadius: "16px",
                boxShadow: theme === "dark" ? "0 4px 20px rgba(0,0,0,0.2)" : "0 10px 30px rgba(0,0,0,0.03)",
                overflow: "hidden",
                flexDirection: "row",
                flexWrap: "wrap",
                transition: "var(--transition-smooth)"
              }}>
                {/* Left Profile Panel */}
                <div style={{
                  flex: "1 1 320px",
                  background: theme === "dark" ? "#1e293b" : "#ffeef0",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0 24px",
                  gap: "20px",
                  transition: "var(--transition-smooth)",
                  position: "relative"
                }}>
                  {/* Photo Container */}
                  <div style={{
                    width: "240px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    alignSelf: "stretch"
                  }}>
                    <img 
                      src={founder.img} 
                      alt={founder.name} 
                      style={{ 
                        width: "100%", 
                        height: "auto", 
                        maxHeight: "260px",
                        objectFit: "contain",
                        display: "block",
                        filter: theme === "dark" ? "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" : "drop-shadow(0 4px 8px rgba(0,0,0,0.1))"
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement.innerHTML = `<div style="width:120px; height:120px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:36px; font-weight:900; color:${theme === "dark" ? "#60a5fa" : "#3b529a"}; background:${theme === "dark" ? "#0f172a" : "#ffffff"};">${founder.initials}</div>`;
                      }}
                    />
                  </div>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    textAlign: "left",
                    padding: "24px 0"
                  }}>
                    <h4 style={{ fontSize: "20px", fontWeight: "800", color: theme === "dark" ? "#60a5fa" : "#0048ba", margin: "0", lineHeight: "1.2" }}>{founder.name}</h4>
                    <span style={{ fontSize: "14px", fontWeight: "750", color: theme === "dark" ? "#cbd5e1" : "#475569", marginTop: "6px" }}>-{founder.region}</span>
                  </div>
                </div>
                
                {/* Right Content Panel */}
                <div style={{
                  flex: "2 1 400px",
                  padding: "30px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  borderLeft: theme === "dark" ? "1px solid #334155" : "1px solid #f1f5f9"
                }}>
                  <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                    {founder.bulletPoints.map((bp, bpIdx) => (
                      <li key={bpIdx} style={{
                        position: "relative",
                        paddingLeft: "24px",
                        fontSize: "14.5px",
                        lineHeight: "1.7",
                        color: theme === "dark" ? "#cbd5e1" : "#1e3a8a",
                        fontWeight: "500"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "4px",
                          top: "8px",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#0055d4"
                        }} />
                        {bp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (landingTab === "collaboration") {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          background: theme === "dark" ? "#0b0f19" : "#ffffff",
          transition: "var(--transition-smooth)"
        }}>
          {/* SECTION 1: IAC COLLABORATION CHALLENGES (DETAIL) */}
          <div style={{
            width: "100%",
            padding: "60px 20px",
            background: theme === "dark" ? "#0f172a" : "#ffffff",
            display: "flex",
            justifyContent: "center",
            borderBottom: theme === "dark" ? "1px solid #1e293b" : "1px solid #e2e8f0"
          }}>
            <div style={{
              width: "100%",
              maxWidth: "1150px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <h2 style={{
                fontFamily: "var(--font-sans)",
                fontWeight: "850",
                fontSize: "30px",
                color: theme === "dark" ? "#60a5fa" : "#0048ba",
                marginBottom: "12px",
                letterSpacing: "-0.5px",
                textAlign: "center"
              }}>
                IAC Collaboration Challenges (detail)
              </h2>
              <p style={{
                fontSize: "14.5px",
                color: theme === "dark" ? "#cbd5e1" : "#475569",
                fontWeight: "600",
                textAlign: "center",
                marginBottom: "40px",
                maxWidth: "850px",
                lineHeight: "1.6"
              }}>
                Lot of piece-meal solutions and ideas exist today but there is a major gap and lack of comprehensive framework to address these multi-dimensional collaboration challenges
              </p>
              
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "50px",
                width: "100%",
                alignItems: "start"
              }}>
                {/* Left side: Venn Diagram */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <svg width="340" height="320" viewBox="0 0 340 320" style={{ maxWidth: "100%", height: "auto" }}>
                    <circle cx="170" cy="120" r="80" fill={theme === "dark" ? "rgba(99, 102, 241, 0.08)" : "rgba(224, 231, 255, 0.55)"} stroke="#3b529a" strokeWidth="2.5" />
                    <circle cx="120" cy="200" r="75" fill={theme === "dark" ? "rgba(239, 68, 68, 0.05)" : "rgba(254, 242, 242, 0.6)"} stroke="#ef4444" strokeWidth="2" />
                    <circle cx="220" cy="200" r="75" fill={theme === "dark" ? "rgba(16, 185, 129, 0.05)" : "rgba(236, 253, 245, 0.6)"} stroke="#10b981" strokeWidth="2" />
                    
                    <text x="170" y="70" textAnchor="middle" fill="#3b529a" fontWeight="800" fontSize="10.5">Academic Institution</text>
                    <text x="90" y="195" textAnchor="middle" fill="#ef4444" fontWeight="800" fontSize="9.5">Learning</text>
                    <text x="90" y="208" textAnchor="middle" fill="#ef4444" fontWeight="800" fontSize="9.5">Ecosystem</text>
                    <text x="90" y="221" textAnchor="middle" fill="#ef4444" fontWeight="600" fontSize="8.5">(Students)</text>
                    
                    <text x="250" y="195" textAnchor="middle" fill="#10b981" fontWeight="800" fontSize="9.5">Research</text>
                    <text x="250" y="208" textAnchor="middle" fill="#10b981" fontWeight="800" fontSize="9.5">Ecosystem</text>
                    <text x="250" y="221" textAnchor="middle" fill="#10b981" fontWeight="600" fontSize="8.5">(Faculty)</text>
                    
                    <text x="170" y="155" textAnchor="middle" fill="#3b529a" fontWeight="800" fontSize="9.5">Industry and</text>
                    <text x="170" y="167" textAnchor="middle" fill="#3b529a" fontWeight="800" fontSize="9.5">Startup Ecosystem</text>
                    
                    <text x="170" y="300" textAnchor="middle" fill={theme === "dark" ? "#cbd5e1" : "#1e3a8a"} fontWeight="850" fontSize="13">IAC Ecosystem Model</text>
                  </svg>
                </div>
                
                {/* Right side: 5 groups of challenges */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {[
                    [
                      "Lack of IAC Strategy and Roadmap",
                      "Lack for Formal Org or Owners responsible for driving joint research thru IAC",
                      "Lack of Success Models and experience in IAC"
                    ],
                    [
                      "Unrealistic expectations from Academia and Students",
                      "Institutions pulled in multiple directions by varying demands by multiple Industry players",
                      "Lack of crawl-walk-run segmentation in Project complexity for joint research projects"
                    ],
                    [
                      "Lack of support and enablement for Faculty to manage additional projects load",
                      "Lack of opportunities for faculty to deepen understanding of Industry and startups",
                      "Lack of incentive, career prospects, funding to balance publishing v/s applied research"
                    ],
                    [
                      "Lack of excitement and mindset among Students re product innovation roles",
                      "Curriculum not practical oriented or overly focused on IT",
                      "Lack of Student internships or employment opportunities in Innovation versus IT"
                    ],
                    [
                      "Lack of clear Collaboration processes, systems or tools",
                      "Lack of Collaboration experience and best practices",
                      "Lack of Leading and Logging indicators to measure IAC progress"
                    ]
                  ].map((group, gIdx) => (
                    <div key={gIdx} style={{
                      padding: "20px",
                      background: theme === "dark" ? "#1e293b" : "#f8fafc",
                      border: theme === "dark" ? "1px solid #334155" : "1.5px solid rgba(0,0,0,0.03)",
                      borderLeft: "4px solid #ef4444",
                      borderRadius: "0 12px 12px 0",
                      boxShadow: theme === "dark" ? "none" : "0 4px 12px rgba(0,0,0,0.01)"
                    }}>
                      <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                        {group.map((pt, ptIdx) => (
                          <li key={ptIdx} style={{
                            position: "relative",
                            paddingLeft: "20px",
                            fontSize: "13.5px",
                            lineHeight: "1.5",
                            color: theme === "dark" ? "#cbd5e1" : "#1e3a8a",
                            fontWeight: "600"
                          }}>
                            <span style={{
                              position: "absolute",
                              left: "2px",
                              top: "7px",
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: "#ef4444"
                            }} />
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: OUR THEORY OF CHANGE - STAKEHOLDER VIEW */}
          <div style={{
            width: "100%",
            padding: "60px 20px",
            background: theme === "dark" ? "#111827" : "#f8fafc",
            display: "flex",
            justifyContent: "center"
          }}>
            <div style={{
              width: "100%",
              maxWidth: "1150px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <h2 style={{
                fontFamily: "var(--font-sans)",
                fontWeight: "850",
                fontSize: "30px",
                color: theme === "dark" ? "#60a5fa" : "#0048ba",
                marginBottom: "12px",
                letterSpacing: "-0.5px",
                textAlign: "center"
              }}>
                Our Theory of Change – Stakeholder View
              </h2>
              <p style={{
                fontSize: "14.5px",
                color: theme === "dark" ? "#cbd5e1" : "#475569",
                fontWeight: "600",
                textAlign: "center",
                marginBottom: "40px",
                maxWidth: "850px",
                lineHeight: "1.6"
              }}>
                Operate within the institutional framework, align shared goals and enable ecosystems to collaborate better
              </p>
              
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "50px",
                width: "100%",
                alignItems: "start"
              }}>
                {/* Left side: Venn Diagram with ApniLeap Center */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <svg width="340" height="320" viewBox="0 0 340 320" style={{ maxWidth: "100%", height: "auto" }}>
                    <circle cx="170" cy="120" r="80" fill={theme === "dark" ? "rgba(99, 102, 241, 0.08)" : "rgba(224, 231, 255, 0.55)"} stroke="#3b529a" strokeWidth="2.5" />
                    <circle cx="120" cy="200" r="75" fill={theme === "dark" ? "rgba(239, 68, 68, 0.05)" : "rgba(254, 242, 242, 0.6)"} stroke="#ef4444" strokeWidth="2" />
                    <circle cx="220" cy="200" r="75" fill={theme === "dark" ? "rgba(16, 185, 129, 0.05)" : "rgba(236, 253, 245, 0.6)"} stroke="#10b981" strokeWidth="2" />
                    
                    <text x="170" y="70" textAnchor="middle" fill="#3b529a" fontWeight="800" fontSize="10.5">Academic Institution</text>
                    <text x="90" y="195" textAnchor="middle" fill="#ef4444" fontWeight="800" fontSize="9.5">Learning</text>
                    <text x="90" y="208" textAnchor="middle" fill="#ef4444" fontWeight="800" fontSize="9.5">Ecosystem</text>
                    <text x="90" y="221" textAnchor="middle" fill="#ef4444" fontWeight="600" fontSize="8.5">(Students)</text>
                    
                    <text x="250" y="195" textAnchor="middle" fill="#10b981" fontWeight="800" fontSize="9.5">Research</text>
                    <text x="250" y="208" textAnchor="middle" fill="#10b981" fontWeight="800" fontSize="9.5">Ecosystem</text>
                    <text x="250" y="221" textAnchor="middle" fill="#10b981" fontWeight="600" fontSize="8.5">(Faculty)</text>
                    
                    <text x="170" y="145" textAnchor="middle" fill="#3b529a" fontWeight="800" fontSize="9.5">Industry and</text>
                    <text x="170" y="157" textAnchor="middle" fill="#3b529a" fontWeight="800" fontSize="9.5">Startup Ecosystem</text>
                    
                    {/* Center ApniLeap white circle */}
                    <circle cx="170" cy="180" r="42" fill="#ffffff" stroke="#10b981" strokeWidth="3" />
                    <text x="170" y="177" textAnchor="middle" fill="#ef4444" fontWeight="900" fontSize="9">Apni<tspan fill="#3b529a">Leap</tspan></text>
                    <text x="170" y="191" textAnchor="middle" fill="#3b529a" fontWeight="950" fontSize="7.5">Campus</text>
                    <text x="170" y="200" textAnchor="middle" fill="#3b529a" fontWeight="950" fontSize="7.5">Center*</text>
                    
                    <text x="170" y="300" textAnchor="middle" fill={theme === "dark" ? "#cbd5e1" : "#1e3a8a"} fontWeight="850" fontSize="13">IAC Ecosystem Model</text>
                  </svg>
                </div>
                
                {/* Right side: Theory of Change Details */}
                <div style={{
                  background: theme === "dark" ? "#1e293b" : "#ffffff",
                  border: theme === "dark" ? "1px solid #334155" : "1.5px solid rgba(0,0,0,0.03)",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: theme === "dark" ? "none" : "0 8px 24px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}>
                  {[
                    { title: "Strategy", desc: "Well defined Strategy, Positioning, Roadmap, Metrics for IAC" },
                    { title: "Structure", desc: "ApniLeap Center (run by PoPs, Students) responsible for IAC success" },
                    { title: "Success Models", desc: "BVB KLE Tech, IITM, IITB, Medical Colleges, Business Schools" },
                    { title: "Expectations", desc: "Clear expectation management through joint roadmap, SOWs" },
                    { title: "Engagement", desc: "Industry/Startup involvement in curriculum, Exec PhD, research projects" },
                    { title: "Complexity", desc: "Gradually increase complexity and project duration, 3/6/18 month projects" },
                    { title: "Support", desc: "Leadership and change workshops, research proposal, project mgmt. support" },
                    { title: "Engagement (Faculty)", desc: "Faculty Industry internships and post-doc opportunities" },
                    { title: "Motivation", desc: "Financial incentives, career prospects, funding for joint research projects" },
                    { title: "Programs & Courses", desc: "VidyaLeap, Engg. exploration etc. to develop innovation mindset" },
                    { title: "Curriculum", desc: "Upgrade curriculum with Startup/Industry inputs and make it market ready" },
                    { title: "Opportunities", desc: "Internship and Final Placement as well as Entrepreneurial opportunities" },
                    { title: "Process, systems, tools", desc: "Develop research project mgmt. processes, SOW templates etc." },
                    { title: "Best Practices", desc: "Develop best practices playbook based on BVB KLE Tech and other exp." },
                    { title: "Leading and Logging Indicators", desc: "Select appropriate from ApniLeap Repository" }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      display: "flex",
                      alignItems: "start",
                      fontSize: "13.5px",
                      lineHeight: "1.4",
                      color: theme === "dark" ? "#cbd5e1" : "#1e3a8a"
                    }}>
                      <strong style={{ width: "160px", flexShrink: 0, color: "#ef4444" }}>{item.title}</strong>
                      <span style={{ fontWeight: "500" }}>: {item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (landingTab === "contact") {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          background: theme === "dark" ? "#0b0f19" : "#ffffff",
          padding: "60px 20px",
          transition: "var(--transition-smooth)"
        }}>
          <h2 style={{
            fontFamily: "var(--font-sans)",
            fontWeight: "850",
            fontSize: "36px",
            color: theme === "dark" ? "#60a5fa" : "#1e3a8a",
            marginBottom: "50px",
            letterSpacing: "-0.5px"
          }}>
            Contact Us
          </h2>
          
          <div style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "50px",
            width: "100%",
            maxWidth: "1050px",
            justifyContent: "center"
          }}>
            {/* Info Panel */}
            <div style={{
              flex: "1 1 350px",
              maxWidth: "400px",
              display: "flex",
              flexDirection: "column",
              gap: "24px"
            }}>
              <h3 style={{ fontSize: "22px", fontWeight: "800", color: theme === "dark" ? "#ffffff" : "#1e3a8a" }}>Get in Touch</h3>
              <p style={{ fontSize: "14.5px", color: theme === "dark" ? "#cbd5e1" : "#475569", lineHeight: "1.6", fontWeight: "500" }}>
                Have questions about the ApniLeap platform, campus integration, or corporate sponsorship? Contact our administration team using the details below or send us a message.
              </p>
              
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                marginTop: "10px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "rgba(59, 82, 154, 0.1)",
                    color: "#3b529a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px"
                  }}>
                    <FaEnvelope />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Email</span>
                    <a href="mailto:info@apnileap.org" style={{ fontSize: "15px", fontWeight: "700", color: theme === "dark" ? "#60a5fa" : "#3b529a", textDecoration: "none" }}>info@apnileap.org</a>
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "rgba(59, 82, 154, 0.1)",
                    color: "#3b529a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px"
                  }}>
                    <FaGlobe />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Phone Support</span>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: theme === "dark" ? "#cbd5e1" : "#1e293b" }}>+91 (0836) 2378101</span>
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "rgba(59, 82, 154, 0.1)",
                    color: "#3b529a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px"
                  }}>
                    <FaBuilding />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Office Address</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: theme === "dark" ? "#cbd5e1" : "#475569", lineHeight: "1.4" }}>
                      CTIE Memorial Complex, BVB KLE Tech Campus, Vidya Nagar, Hubli
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Form Panel */}
            <div style={{
              flex: "1 1 450px",
              maxWidth: "500px",
              background: theme === "dark" ? "#1e293b" : "#ffffff",
              border: theme === "dark" ? "1px solid #334155" : "1.5px solid rgba(0,0,0,0.04)",
              borderRadius: "16px",
              padding: "30px",
              boxShadow: theme === "dark" ? "0 10px 30px rgba(0,0,0,0.3)" : "0 10px 30px rgba(0,0,0,0.03)",
              transition: "var(--transition-smooth)"
            }}>
              <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: theme === "dark" ? "#94a3b8" : "#475569", marginBottom: "6px", textTransform: "uppercase" }}>Full Name</label>
                  <input 
                    type="text" 
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    placeholder="Enter your name"
                    style={{
                      background: theme === "dark" ? "#0f172a" : "#f8fafc",
                      border: theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      fontSize: "14px",
                      color: theme === "dark" ? "#ffffff" : "#0f172a",
                      width: "100%",
                      outline: "none"
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: theme === "dark" ? "#94a3b8" : "#475569", marginBottom: "6px", textTransform: "uppercase" }}>Email Address</label>
                  <input 
                    type="email" 
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    style={{
                      background: theme === "dark" ? "#0f172a" : "#f8fafc",
                      border: theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      fontSize: "14px",
                      color: theme === "dark" ? "#ffffff" : "#0f172a",
                      width: "100%",
                      outline: "none"
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: theme === "dark" ? "#94a3b8" : "#475569", marginBottom: "6px", textTransform: "uppercase" }}>Subject</label>
                  <input 
                    type="text" 
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    required
                    placeholder="Message subject"
                    style={{
                      background: theme === "dark" ? "#0f172a" : "#f8fafc",
                      border: theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      fontSize: "14px",
                      color: theme === "dark" ? "#ffffff" : "#0f172a",
                      width: "100%",
                      outline: "none"
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: theme === "dark" ? "#94a3b8" : "#475569", marginBottom: "6px", textTransform: "uppercase" }}>Message</label>
                  <textarea 
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                    placeholder="Type your message here..."
                    rows={4}
                    style={{
                      background: theme === "dark" ? "#0f172a" : "#f8fafc",
                      border: theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      fontSize: "14px",
                      color: theme === "dark" ? "#ffffff" : "#0f172a",
                      width: "100%",
                      outline: "none",
                      resize: "vertical"
                    }}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: "8px",
                    fontWeight: "750",
                    fontSize: "15px",
                    cursor: isSubmittingContact ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 15px rgba(239, 68, 68, 0.2)",
                    transition: "var(--transition-smooth)",
                    opacity: isSubmittingContact ? 0.8 : 1
                  }}
                >
                  {isSubmittingContact ? (
                    <>
                      <FaSyncAlt style={{ animation: "spin 1.5s infinite linear" }} />
                      <span>Sending message...</span>
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      );
    }
  };

  if (viewMode === "landing") {
    if (landingTab === "login") {
      if (isAuthenticated) {
        setTimeout(() => setViewMode("dashboard"), 0);
        return null;
      }
      const recognizedPersona = mapEmailToPersona(loginEmail);

    return (
      <div style={{
        display: "flex",
        minHeight: "100vh",
        width: "100vw",
        background: "var(--bg-main)",
        fontFamily: "var(--font-sans)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Floating background blur bubbles that change color by theme */}
        <div className="float-bg-1" style={{
          position: "absolute",
          top: "5%",
          right: "10%",
          width: "400px",
          height: "400px",
          background: "var(--primary-glow)",
          borderRadius: "50%",
          filter: "blur(90px)",
          pointerEvents: "none",
          zIndex: 1
        }} />
        <div className="float-bg-2" style={{
          position: "absolute",
          bottom: "5%",
          left: "5%",
          width: "400px",
          height: "400px",
          background: "rgba(99, 102, 241, 0.08)",
          borderRadius: "50%",
          filter: "blur(90px)",
          pointerEvents: "none",
          zIndex: 1
        }} />

        {/* Global theme selection toggle overlay */}
        <div style={{
          position: "absolute",
          top: "24px",
          right: "24px",
          display: "flex",
          alignItems: "center",
          background: "var(--bg-card)",
          border: "1px solid var(--border-glass)",
          padding: "4px",
          borderRadius: "99px",
          boxShadow: "var(--shadow-premium)",
          zIndex: 100
        }}>
          {[
            { name: "dark", label: "Dark", icon: <FaMoon size={12} /> },
            { name: "light", label: "Light", icon: <FaSun size={12} /> }
          ].map(t => (
            <button
              key={t.name}
              type="button"
              onClick={() => setTheme(t.name)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "99px",
                background: theme === t.name ? "var(--primary)" : "transparent",
                color: theme === t.name ? "var(--text-primary-btn)" : "var(--text-muted)",
                border: "none",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "11px",
                transition: "var(--transition-smooth)"
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Major full screen split layout container */}
        <div style={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          zIndex: 2,
          position: "relative"
        }}>
          
          {/* Left panel: Overlapping radial gradient 3D spheres & Welcome details */}
          <div style={{
            flex: "1 1 60%",
            maxWidth: "60%",
            background: theme === "dark" ? "#090d16" : "#3b529a",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px",
            borderRight: "1px solid var(--border-subtle)",
            transition: "background 0.5s ease-in-out"
          }}>
            {/* Embedded overlapping gradient 3D Spheres */}
            <div className="login-sphere sphere-1" style={{ top: "-60px", left: "-60px" }} />
            <div className="login-sphere sphere-2" style={{ bottom: "-80px", right: "-40px" }} />
            <div className="login-sphere sphere-3" style={{ top: "35%", left: "30%" }} />
            
            {/* Branding Orb Logo */}
            <div 
              onClick={() => setLandingTab("home")}
              style={{ 
                position: "relative", 
                zIndex: 10, 
                display: "flex", 
                alignItems: "center", 
                gap: "6px", 
                fontFamily: "var(--font-sans)", 
                fontWeight: "800", 
                fontSize: "36px", 
                cursor: "pointer" 
              }}
            >
              <span style={{ color: "#ef4444" }}>Apni</span>
              <span style={{ color: "#ffffff", display: "inline-flex", alignItems: "center" }}>
                Leap
                <span style={{ color: "#10b981", marginLeft: "6px", fontSize: "26px", fontWeight: "900" }}>↗</span>
              </span>
              <span style={{ opacity: 0.85, fontWeight: "400", marginLeft: "10px", color: "#ffffff" }}>Hub</span>
            </div>

            {/* Core welcome text matching reference picture layout */}
            <div style={{ position: "relative", zIndex: 10, margin: "auto 0" }}>
              <h1 style={{
                fontSize: "44px",
                fontWeight: "900",
                color: "white",
                lineHeight: "1.1",
                letterSpacing: "-1px",
                margin: "0 0 10px 0"
              }}>
                WELCOME
              </h1>
              <h2 style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "rgba(255, 255, 255, 0.9)",
                textTransform: "uppercase",
                letterSpacing: "2px",
                marginBottom: "20px"
              }}>
                Campus Governance Portal
              </h2>
              <p style={{
                fontSize: "13.5px",
                color: "rgba(255, 255, 255, 0.8)",
                lineHeight: "1.6",
                fontWeight: "400",
                maxWidth: "340px",
                margin: "0 0 30px 0"
              }}>
                A robust multi-tenant Agile collaboration suite powered by live Jira Cloud. Experience absolute campus workspace isolation with central Moderator ingestion pathways.
              </p>

              {/* Quick Connect demo panel inside left visual panel */}
              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.15)", paddingTop: "16px", maxWidth: "420px", width: "100%", marginBottom: "20px" }}>
                <span style={{
                  display: "block",
                  fontSize: "10.5px",
                  fontWeight: "900",
                  color: "rgba(255, 255, 255, 0.75)",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  marginBottom: "10px"
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaBolt style={{ color: "#ff8c00" }} /> Quick Demo Connect</span>
                </span>
                
                {/* All User Types Grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "6px",
                  marginBottom: "12px"
                }}>
                  <button type="button" onClick={() => handleQuickConnect("admin@apnileap.com")} style={{ padding: "8px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "white", fontWeight: "700", fontSize: "11px", cursor: "pointer", transition: "var(--transition-smooth)" }} title="Connect as Executive Administrator">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaShieldAlt style={{ color: "#34d399" }} /> Executive Admin</span>
                  </button>

                  <button type="button" onClick={() => handleQuickConnect("moderator@apnileap.com")} style={{ padding: "8px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "white", fontWeight: "700", fontSize: "11px", cursor: "pointer", transition: "var(--transition-smooth)" }} title="Connect as Central Moderator">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaTools style={{ color: "#a855f7" }} /> Central Moderator</span>
                  </button>

                  <button type="button" onClick={() => handleQuickConnect("p.manager@nvidia.com")} style={{ padding: "8px", borderRadius: "6px", background: "rgba(118, 185, 0, 0.2)", border: "1px solid rgba(118, 185, 0, 0.4)", color: "white", fontWeight: "700", fontSize: "11px", cursor: "pointer", transition: "var(--transition-smooth)" }} title="Connect as NVIDIA Project Manager">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><CompanyLogo company="NVIDIA" size={16} /> Project Manager</span>
                  </button>

                  <button type="button" onClick={() => handleQuickConnect("nvidia@corporate.com")} style={{ padding: "8px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "white", fontWeight: "600", fontSize: "10.5px", cursor: "pointer", transition: "var(--transition-smooth)" }} title="Connect as Corporate Sponsor">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><CompanyLogo company="NVIDIA" size={16} /> Corporate Partner</span>
                  </button>

                  <button type="button" onClick={() => handleQuickConnect("aditi.sharma@nvidia.com")} style={{ padding: "8px", borderRadius: "6px", background: "rgba(118, 185, 0, 0.2)", border: "1px solid rgba(118, 185, 0, 0.4)", color: "white", fontWeight: "700", fontSize: "11px", cursor: "pointer", transition: "var(--transition-smooth)" }} title="Connect as NVIDIA Project Mentor">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><CompanyLogo company="NVIDIA" size={16} /> Project Mentor</span>
                  </button>

                  <button type="button" onClick={() => handleQuickConnect("coordinator@kle.edu")} style={{ padding: "8px", borderRadius: "6px", background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", color: "white", fontWeight: "600", fontSize: "10.5px", cursor: "pointer", transition: "var(--transition-smooth)" }} title="Connect as KLE Campus Coordinator">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaUserTie style={{ color: "#818cf8" }} /> Campus Coordinator</span>
                  </button>

                  <button type="button" onClick={() => handleQuickConnect("faculty1@kle.edu")} style={{ padding: "8px", borderRadius: "6px", background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", color: "white", fontWeight: "600", fontSize: "10.5px", cursor: "pointer", transition: "var(--transition-smooth)" }} title="Connect as KLE Faculty Member">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaBook style={{ color: "#818cf8" }} /> Faculty Member</span>
                  </button>

                  <button type="button" onClick={() => handleQuickConnect("student1@kle.edu")} style={{ padding: "8px", borderRadius: "6px", background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)", color: "white", fontWeight: "600", fontSize: "10.5px", cursor: "pointer", transition: "var(--transition-smooth)" }} title="Connect as KLE Student Developer">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaGraduationCap style={{ color: "#60a5fa" }} /> Student Developer</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer trademark or copyright */}
            <div style={{ position: "relative", zIndex: 10 }}>
              <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", fontWeight: "500" }}>
                Powered by Jira Cloud API Integration
              </span>
            </div>
          </div>

          {/* Right panel: Modern Sign In form with icons and show password */}
          <div style={{
            flex: "1 1 40%",
            maxWidth: "40%",
            padding: "60px 80px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: theme === "dark" ? "#0f172a" : "#ffffff",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderLeft: "1px solid var(--border-subtle)",
            position: "relative",
            minHeight: "100vh",
            transition: "background 0.5s ease-in-out, border 0.5s ease-in-out"
          }}>
            <div style={{ maxWidth: "450px", width: "100%", margin: "0 auto" }}>
              {!showSignup ? (
                <>
                  <div style={{ marginBottom: "28px" }}>
                    <h3 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)", marginBottom: "6px", letterSpacing: "-0.5px" }}>
                      Sign In
                    </h3>
                    <p style={{ fontSize: "13.5px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                      Enter your campus spoke or administrative email to connect.
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {loginError && (
                      <div style={{
                        padding: "11px 14px",
                        borderRadius: "10px",
                        background: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.18)",
                        color: "#dc2626",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#f87171" }}><FaExclamationTriangle /> {loginError}</span>
                      </div>
                    )}

                    {/* Email Input Field */}
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px"
                      }}>
                        Email Address
                      </label>
                      <div style={{ position: "relative" }}>
                        <FaEnvelope style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                          fontSize: "14px"
                        }} />
                        <input
                          type="text"
                          placeholder="coordinator@kle.edu or admin@apnileap.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 14px 12px 42px",
                            borderRadius: "10px",
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-main)",
                            outline: "none",
                            fontSize: "14px",
                            transition: "var(--transition-smooth)"
                          }}
                        />
                      </div>
                      
                      {/* Dynamic Persona Indicator badge */}
                      {recognizedPersona && (
                        <div style={{
                          marginTop: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          background: recognizedPersona === "executive"
                            ? "rgba(124, 58, 237, 0.08)"
                            : recognizedPersona === "moderator"
                            ? "rgba(255, 140, 0, 0.08)"
                            : "rgba(59, 82, 154, 0.08)",
                          border: recognizedPersona === "executive"
                            ? "1px solid rgba(124, 58, 237, 0.2)"
                            : recognizedPersona === "moderator"
                            ? "1px solid rgba(255, 140, 0, 0.2)"
                            : "1px solid rgba(59, 82, 154, 0.2)",
                          color: recognizedPersona === "executive"
                            ? "#7c3aed"
                            : recognizedPersona === "moderator"
                            ? "#ff8c00"
                            : "#3b529a",
                          fontSize: "11.5px",
                          fontWeight: "750",
                          animation: "slideIn 0.2s ease-out"
                        }}>
                          {recognizedPersona === "executive"
                            ? "Executive Administrator"
                            : recognizedPersona === "moderator"
                            ? "Central Moderator"
                            : `${recognizedPersona.replace("spoke-", "").toUpperCase()} Spoke Coordinator`}
                        </div>
                      )}
                    </div>

                    {/* Password Input Field */}
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px"
                      }}>
                        Password
                      </label>
                      <div style={{ position: "relative" }}>
                        <FaLock style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                          fontSize: "14px"
                        }} />
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 65px 12px 42px",
                            borderRadius: "10px",
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-main)",
                            outline: "none",
                            fontSize: "14px",
                            transition: "var(--transition-smooth)"
                          }}
                        />
                        {/* SHOW / HIDE Password button */}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            fontSize: "11px",
                            fontWeight: "800",
                            cursor: "pointer",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            outline: "none",
                            padding: "4px"
                          }}
                        >
                          {showPassword ? "HIDE" : "SHOW"}
                        </button>
                      </div>
                    </div>

                    {/* Remember me & Forgot Password */}
                    <div style={{ display: "flex", justifySpaceBetween: "space-between", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                        <input type="checkbox" style={{ accentColor: "var(--primary)" }} />
                        <span>Remember me</span>
                      </label>
                      <a href="#forgot" onClick={(e) => { e.preventDefault(); triggerToast("Password recovery is handled by your local campus AD server.", "info"); }} style={{ color: "var(--secondary)", textDecoration: "none", fontWeight: "700" }}>
                        Forgot Password?
                      </a>
                    </div>

                    {/* Submit Sign In button */}
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      style={{
                        marginTop: "10px",
                        padding: "13px 20px",
                        borderRadius: "10px",
                        background: "#ef4444",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: "800",
                        fontSize: "14.5px",
                        cursor: isLoggingIn ? "not-allowed" : "pointer",
                        boxShadow: "0 6px 15px rgba(239, 68, 68, 0.22)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        opacity: isLoggingIn ? 0.8 : 1,
                        transition: "var(--transition-smooth)"
                      }}
                    >
                      {isLoggingIn ? (
                        <>
                          <FaSyncAlt className="pulse-glow" style={{ animation: "pulseGlow 1.5s infinite linear" }} />
                          <span>Connecting to Live Jira Hub...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <span><FaPaperPlane /></span>
                        </>
                      )}
                    </button>

                    {/* Sign Up Link */}
                    <div style={{ textAlign: "center", marginTop: "12px", fontSize: "13px", color: "var(--text-dim)" }}>
                      Don't have an Account?{" "}
                      <a
                        href="#signup"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowSignup(true);
                          setLoginError("");
                          setSignupError("");
                        }}
                        style={{ color: "var(--secondary)", fontWeight: "700", textDecoration: "none" }}
                      >
                        Register Student / Faculty
                      </a>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: "28px" }}>
                    <h3 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)", marginBottom: "6px", letterSpacing: "-0.5px" }}>
                      Campus Registration
                    </h3>
                    <p style={{ fontSize: "13.5px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                      Create a persistent account to track agile sprints, submit deliverables, or manage campus spoke projects.
                    </p>
                  </div>

                  <form onSubmit={handleSignupSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {signupError && (
                      <div style={{
                        padding: "11px 14px",
                        borderRadius: "10px",
                        background: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.18)",
                        color: "#dc2626",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#f87171" }}><FaExclamationTriangle /> {signupError}</span>
                      </div>
                    )}

                    {/* Full Name Field */}
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px"
                      }}>
                        Full Name
                      </label>
                      <div style={{ position: "relative" }}>
                        <FaUser style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                          fontSize: "14px"
                        }} />
                        <input
                          type="text"
                          placeholder="e.g. Rahul Sharma"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 14px 12px 42px",
                            borderRadius: "10px",
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-main)",
                            outline: "none",
                            fontSize: "14px",
                            transition: "var(--transition-smooth)"
                          }}
                        />
                      </div>
                    </div>

                    {/* Email Input Field */}
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px"
                      }}>
                        Email Address
                      </label>
                      <div style={{ position: "relative" }}>
                        <FaEnvelope style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                          fontSize: "14px"
                        }} />
                        <input
                          type="text"
                          placeholder="e.g. student@kle.edu"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 14px 12px 42px",
                            borderRadius: "10px",
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-main)",
                            outline: "none",
                            fontSize: "14px",
                            transition: "var(--transition-smooth)"
                          }}
                        />
                      </div>
                    </div>

                    {/* Password Input Field */}
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px"
                      }}>
                        Choose Password
                      </label>
                      <div style={{ position: "relative" }}>
                        <FaLock style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                          fontSize: "14px"
                        }} />
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 65px 12px 42px",
                            borderRadius: "10px",
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-main)",
                            outline: "none",
                            fontSize: "14px",
                            transition: "var(--transition-smooth)"
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            fontSize: "11px",
                            fontWeight: "800",
                            cursor: "pointer",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            outline: "none",
                            padding: "4px"
                          }}
                        >
                          {showPassword ? "HIDE" : "SHOW"}
                        </button>
                      </div>
                    </div>

                    {/* Select Platform Role */}
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px"
                      }}>
                        Select Platform Role
                      </label>
                      <div style={{ position: "relative" }}>
                        <FaBriefcase style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                          fontSize: "14px",
                          zIndex: 10
                        }} />
                        <select
                          value={signupRole}
                          onChange={(e) => setSignupRole(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 14px 12px 42px",
                            borderRadius: "10px",
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-main)",
                            outline: "none",
                            fontSize: "14px",
                            cursor: "pointer",
                            appearance: "none",
                            WebkitAppearance: "none",
                            transition: "var(--transition-smooth)"
                          }}
                        >
                          <option value="Student Developer">Student Developer</option>
                          <option value="Faculty Mentor">Faculty Mentor (Spoke Coordinator)</option>
                        </select>
                        <div style={{
                          position: "absolute",
                          right: "16px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          border: "solid transparent",
                          borderWidth: "5px 5px 0 5px",
                          borderTopColor: "#64748b"
                        }} />
                      </div>
                    </div>

                    {/* Select Campus Spoke */}
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px"
                      }}>
                        Select Campus Spoke
                      </label>
                      <div style={{ position: "relative" }}>
                        <FaGraduationCap style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                          fontSize: "14px",
                          zIndex: 10
                        }} />
                        <select
                          value={signupCampus}
                          onChange={(e) => setSignupCampus(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 14px 12px 42px",
                            borderRadius: "10px",
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-main)",
                            outline: "none",
                            fontSize: "14px",
                            cursor: "pointer",
                            appearance: "none",
                            WebkitAppearance: "none",
                            transition: "var(--transition-smooth)"
                          }}
                        >
                          <option value="3">KLE Spoke (Hub Campus)</option>
                          <option value="101">COEP Spoke</option>
                          <option value="102">MMCOEP Spoke</option>
                          <option value="103">RIT Spoke</option>
                        </select>
                        <div style={{
                          position: "absolute",
                          right: "16px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          border: "solid transparent",
                          borderWidth: "5px 5px 0 5px",
                          borderTopColor: "#64748b"
                        }} />
                      </div>
                    </div>

                    {/* Submit Registration button */}
                    <button
                      type="submit"
                      disabled={isRegistering}
                      style={{
                        marginTop: "10px",
                        padding: "13px 20px",
                        borderRadius: "10px",
                        background: "#ef4444",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: "800",
                        fontSize: "14.5px",
                        cursor: isRegistering ? "not-allowed" : "pointer",
                        boxShadow: "0 6px 15px rgba(239, 68, 68, 0.22)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        opacity: isRegistering ? 0.8 : 1,
                        transition: "var(--transition-smooth)"
                      }}
                    >
                      {isRegistering ? (
                        <>
                          <FaSyncAlt className="pulse-glow" style={{ animation: "pulseGlow 1.5s infinite linear" }} />
                          <span>Creating account persistently...</span>
                        </>
                      ) : (
                        <>
                          <span>Register {signupRole === "Project Manager" ? "Project Manager" : signupRole === "Faculty Mentor" ? "Faculty" : "Student"} Account</span>
                          <span>{signupRole === "Faculty Mentor" ? <FaUsers style={{ marginRight: "4px" }} /> : <FaGraduationCap style={{ marginRight: "4px" }} />}</span>
                        </>
                      )}
                    </button>

                    {/* Sign In Link */}
                    <div style={{ textAlign: "center", marginTop: "12px", fontSize: "13px", color: "var(--text-dim)" }}>
                      Already have an account?{" "}
                      <a
                        href="#login"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowSignup(false);
                          setLoginError("");
                          setSignupError("");
                        }}
                        style={{ color: "var(--secondary)", fontWeight: "700", textDecoration: "none" }}
                      >
                        Sign In here
                      </a>
                    </div>
                  </form>
                </>
              )}
            </div> {/* Closing the maxWidth wrapper */}
          </div>
        </div>
      </div>
    );
    } else {
      // Render public site landing pages
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100vw",
          background: theme === "dark" ? "#0b0f19" : "#ffffff",
          fontFamily: "var(--font-sans)",
          overflowX: "hidden",
          overflowY: "auto",
          transition: "var(--transition-smooth)"
        }}>
          {renderPublicNavbar()}
          <main style={{ flex: 1, width: "100%" }}>
            {renderPublicTabContent()}
          </main>
          {renderPublicFooter()}
          {renderPortalModals()}
          
          {/* Toast notifications container */}

        </div>
      );
    }
  }

  const isCentralAdmin = currentPersona === "moderator" || currentPersona === "executive";

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100vw", background: "var(--bg-main)" }}>
      <div style={{ display: "flex", width: "100%", height: "100vh", background: "var(--bg-card)", overflow: "hidden" }}>
      
      {/* Visual Animation Keyframes Injection */}
      <style>{`
        @keyframes envelopeSlide {
          0% { transform: translateY(50px) scale(0.8); opacity: 0; }
          20% { transform: translateY(0) scale(1); opacity: 1; }
          80% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-300px) scale(0.3) rotate(15deg); opacity: 0; }
        }
        @keyframes paperInsert {
          0% { transform: translateY(0); opacity: 1; }
          40% { transform: translateY(24px); opacity: 0.8; }
          50%, 100% { transform: translateY(40px); opacity: 0; }
        }
        @keyframes pulseWarning {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .overdue-badge-blink {
          animation: pulseWarning 1.5s infinite ease-in-out;
          background: var(--priority-high-bg) !important;
          border-color: var(--priority-high-border) !important;
          color: var(--priority-high-text) !important;
        }
        @keyframes blockedBorderGlow {
          0%, 100% { border-color: rgba(249, 115, 22, 0.35); box-shadow: 0 0 4px rgba(249, 115, 22, 0.15); }
          50% { border-color: rgba(249, 115, 22, 0.95); box-shadow: 0 0 12px rgba(249, 115, 22, 0.35); }
        }
        .kanban-card-blocked {
          animation: blockedBorderGlow 2s infinite ease-in-out !important;
          border-style: dashed !important;
          border-width: 1.5px !important;
        }
      `}</style>

      {/* DUAL-COLUMN SIDEBAR ASIDE COMPONENT */}
      <aside
        style={{
          width: isSidebarCollapsed ? "80px" : "320px",
          display: "flex",
          flexDirection: "row",
          transition: "var(--transition-smooth)",
          zIndex: 10,
          background: "transparent",
        }}
      >
        {/* COLUMN 1: NARROW UTILITY RAIL (LEFT SIDE) */}
        <div
          style={{
            width: isSidebarCollapsed ? "80px" : "65px",
            background: "var(--bg-sidebar-rail)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "24px 8px",
            gap: "28px",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            transition: "var(--transition-smooth)",
          }}
        >
          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{
              background: "var(--sidebar-btn-bg)",
              border: "1px solid var(--sidebar-btn-border)",
              color: "var(--sidebar-btn-color)",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              transition: "var(--transition-smooth)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--sidebar-hover-bg)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--sidebar-btn-bg)"}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <FaChevronRight size={16} /> : <FaChevronLeft size={16} />}
          </button>

          {/* Rail Utility Icons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" }}>
            {/* View Landing/Public Website */}
            <div
              onClick={() => {
                setViewMode("landing");
                setLandingTab("home");
                triggerToast("Navigating to Public Landing Page");
              }}
              className="sidebar-rail-icon"
              title="Public Home Page"
            >
              <FaGlobe size={20} />
            </div>

            {isCentralAdmin ? (
              <div
                onClick={() => {
                  setActiveWorkspace("hub");
                  triggerToast("Switched Workspace: Executive Portfolio Hub");
                }}
                className={`sidebar-rail-icon ${activeWorkspace === "hub" ? "active" : ""}`}
                title="Executive Portfolio Hub"
              >
                <FaHome size={20} />
              </div>
            
            ) : currentPersona === "project-manager" ? (
              <div
                onClick={() => {
                  setActiveWorkspace("project-manager");
                  setActiveView("dashboard");
                  setSidebarOpen(true);
                  triggerToast("Switched Workspace: Company Projects");
                }}
                className={`sidebar-rail-icon ${activeWorkspace === "project-manager" ? "active" : ""}`}
                title="Company Projects"
              >
                <FaBuilding size={20} />
              </div>

            ) : currentPersona === "project-mentor" ? (
              <div
                onClick={() => {
                  setActiveWorkspace("mentor-dashboard");
                  triggerToast("Switched Workspace: Project Mentor Dashboard");
                }}
                className={`sidebar-rail-icon ${activeWorkspace === "mentor-dashboard" ? "active" : ""}`}
                title="Project Mentor Dashboard"
              >
                <FaUserTie size={20} />
              </div>
            ) : currentPersona === "moderator" ? (
              <>
                <div
                  onClick={() => {
                    setActiveWorkspace("moderator");
                    triggerToast("Switched Workspace: Central Moderation Portal");
                  }}
                  className={`sidebar-rail-icon ${activeWorkspace === "moderator" ? "active" : ""}`}
                  title="Central Moderation Portal"
                >
                  <FaBook size={20} />
                </div>

                <div
                  onClick={() => {
                    setActiveWorkspace("meetings");
                    triggerToast("Switched Workspace: Collaboration & Sync Meetings");
                  }}
                  className={`sidebar-rail-icon ${activeWorkspace === "meetings" ? "active" : ""}`}
                  title="Sync Schedule"
                >
                  <FaCalendarAlt size={20} />
                </div>
              </>
            ) : sessionUser?.role === "Corporate Partner" ? (
              <div
                onClick={() => {
                  setActiveWorkspace(currentPersona);
                  setActiveView("dashboard");
                  triggerToast(`Switched Workspace: Sponsor Dashboard`);
                }}
                className={`sidebar-rail-icon ${(activeWorkspace === currentPersona && activeView === "dashboard") ? "active" : ""}`}
                title="Sponsor Portal"
              >
                <FaHome size={20} />
              </div>
            ) : (
              <>
                <div
                  onClick={() => {
                    setActiveWorkspace(currentPersona);
                    setActiveView("dashboard");
                    triggerToast(`Switched Workspace: Spoke Dashboard`);
                  }}
                  className={`sidebar-rail-icon ${(activeWorkspace === currentPersona && activeView === "dashboard") ? "active" : ""}`}
                  title="Spoke Dashboard"
                >
                  <FaHome size={20} />
                </div>

                <div
                  onClick={() => {
                    setActiveWorkspace(currentPersona);
                    setActiveView("kanban");
                    triggerToast(`Switched Workspace: Spoke Sprint Kanban`);
                  }}
                  className={`sidebar-rail-icon ${(activeWorkspace === currentPersona && activeView === "kanban") ? "active" : ""}`}
                  title="Sprint Kanban Board"
                >
                  <FaTasks size={20} />
                </div>
              </>
            )}

            {sessionUser?.role !== "Corporate Partner" && (
              <>
                <div
                  onClick={() => {
                    setShowChatDrawer(true);
                    triggerToast("Opening FIP Cohort Live Chat...");
                  }}
                  className={`sidebar-rail-icon ${showChatDrawer ? "active" : ""}`}
                  title="Cohort Forums Chat"
                >
                  <FaComments size={20} />
                </div>

                <div
                  onClick={() => {
                    setShowCohortModal(true);
                    triggerToast("Opening Academic Cohort Progress...");
                  }}
                  className={`sidebar-rail-icon ${showCohortModal ? "active" : ""}`}
                  title="Academic Cohorts"
                >
                  <FaGraduationCap size={20} />
                </div>

                <div
                  onClick={() => {
                    setShowSettingsModal(true);
                    triggerToast("Opening System Settings...");
                  }}
                  className={`sidebar-rail-icon ${showSettingsModal ? "active" : ""}`}
                  title="System Settings"
                >
                  <FaCog size={20} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* COLUMN 2: MAIN NAVIGATION PANEL (RIGHT SIDE) */}
        <div
          style={{
            width: isSidebarCollapsed ? "0px" : "255px",
            opacity: isSidebarCollapsed ? 0 : 1,
            background: "var(--bg-sidebar)",
            display: "flex",
            flexDirection: "column",
            padding: isSidebarCollapsed ? "24px 0px" : "24px 0px 24px 16px",
            overflow: "hidden",
            transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease-in-out, padding 0.25s ease",
            boxSizing: "border-box"
          }}
        >
          {/* Sidebar Logo Header */}
          <div 
            onClick={() => {
              setViewMode("landing");
              setLandingTab("home");
            }}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "6px", 
              fontFamily: "var(--font-sans)", 
              fontWeight: "800", 
              fontSize: "24px", 
              cursor: "pointer", 
              marginBottom: "32px", 
              paddingLeft: "12px" 
            }}
          >
            <span style={{ color: "#ef4444" }}>Apni</span>
            <span style={{ color: "#3b529a", display: "inline-flex", alignItems: "center" }}>
              Leap
              <span style={{ color: "#10b981", marginLeft: "4px", fontSize: "18px", fontWeight: "900" }}>↗</span>
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, overflowY: "auto", paddingRight: "4px" }}>
            
            {/* Multi-Tenant Persona Access Controller (Admin Only) */}
            {sessionUser && sessionUser.role === "Central Moderator" && (
              <div style={{
                padding: "12px 14px",
                marginBottom: "16px",
                background: "var(--sidebar-card-bg)",
                border: "1px solid var(--sidebar-border)",
                borderRadius: "16px",
                marginRight: "16px",
                marginTop: "4px"
              }}>
                <label style={{
                  display: "block",
                  fontSize: "9px",
                  fontWeight: "900",
                  color: "var(--sidebar-text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  marginBottom: "8px"
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaUser /> Active Role</span>
                </label>
                <select
                  value={currentPersona}
                  onChange={(e) => {
                    const newPersona = e.target.value;
                    setCurrentPersona(newPersona);
                    const name = newPersona === "moderator" ? "Central Moderator" : SPOKES[newPersona.replace("spoke-", "")]?.name;
                    triggerToast(`Switched Profile: Active permissions set to ${name}`);
                  }}
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--sidebar-border)",
                    color: "var(--sidebar-text-main)",
                    borderRadius: "8px",
                    padding: "8px 10px",
                    fontSize: "12.5px",
                    fontWeight: "700",
                    width: "100%",
                    outline: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)"
                  }}
                >
                  <option value="moderator" style={{ background: "var(--bg-sidebar)" }}>Moderator</option>
                  <option value="spoke-kle" style={{ background: "var(--bg-sidebar)" }}>KLE Coordinator</option>
                  <option value="spoke-coep" style={{ background: "var(--bg-sidebar)" }}>COEP Coordinator</option>
                  <option value="spoke-mmcoep" style={{ background: "var(--bg-sidebar)" }}>MMCOEP Coordinator</option>
                  <option value="spoke-rit" style={{ background: "var(--bg-sidebar)" }}>RIT Coordinator</option>
                </select>
              </div>
            )}

            {/* Section 1: ACTIVE VIEW MODE (Hidden if viewing Hub or Moderator or Sponsor) */}
            {activeWorkspace !== "hub" && activeWorkspace !== "moderator" && activeWorkspace !== "meetings" && sessionUser?.role !== "Corporate Partner" && (
              <>
                <div style={{ fontSize: "9px", fontWeight: "850", textTransform: "uppercase", color: "var(--sidebar-text-dim)", letterSpacing: "1px", paddingLeft: "12px", marginTop: "8px", marginBottom: "4px" }}>
                  Views
                </div>
                <SidebarNavItem
                  active={activeView === "dashboard"}
                  icon={<FaChartPie size={16} />}
                  label="Overview"
                  collapsed={false}
                  onClick={() => setActiveView("dashboard")}
                  variant="accent"
                />
                <SidebarNavItem
                  active={activeView === "kanban"}
                  icon={<FaTasks size={16} />}
                  label="Sprint Kanban Board"
                  collapsed={false}
                  onClick={() => setActiveView("kanban")}
                  variant="accent"
                />
                <hr style={{ border: "none", borderTop: "1px solid var(--sidebar-border)", margin: "8px 16px 8px 0" }} />
              </>
            )}

            {/* Section 3: Campuses & Roles */}
            <div style={{ fontSize: "9px", fontWeight: "850", textTransform: "uppercase", color: "var(--sidebar-text-dim)", letterSpacing: "1px", paddingLeft: "12px", marginTop: "4px", marginBottom: "4px" }}>
              Campuses & Roles
            </div>
            
            {isCentralAdmin && (
              <SidebarNavItem
                active={activeWorkspace === "hub"}
                icon={<FaGlobe style={{ fontSize: "16px" }} />}
                label="Main Dashboard"
                collapsed={false}
                onClick={() => setActiveWorkspace("hub")}
              />
            )}

            
            {currentPersona === "project-manager" && (
              <SidebarNavItem
                active={activeWorkspace === "project-manager"}
                icon={<FaBuilding size={16} />}
                label="Company Projects"
                onClick={() => {
                  setActiveWorkspace("project-manager");
                  setActiveView("dashboard");
                }}
              />
            )}

            {currentPersona === "project-mentor" && (
              <SidebarNavItem
                active={activeWorkspace === "mentor-dashboard"}
                icon={<FaUserTie size={16} />}
                label="Mentor Dashboard"
                collapsed={false}
                onClick={() => setActiveWorkspace("mentor-dashboard")}
              />
            )}

            {currentPersona === "moderator" && (
              <>
                <SidebarNavItem
                  active={activeWorkspace === "moderator"}
                  icon={<FaBriefcase size={16} />}
                  label="Central Moderation Portal"
                  collapsed={false}
                  onClick={() => setActiveWorkspace("moderator")}
                />
                <SidebarNavItem
                  active={activeWorkspace === "meetings"}
                  icon={<FaCalendarAlt style={{ fontSize: "16px" }} />}
                  label="Meetings"
                  collapsed={false}
                  onClick={() => setActiveWorkspace("meetings")}
                />
              </>
            )}

            {/* Spoke Campuses list */}
            {(isCentralAdmin || currentPersona === "spoke-kle") && (
              <SidebarNavItem
                active={activeWorkspace === "spoke-kle"}
                icon={<FaBuilding />}
                label="KLE Campus"
                collapsed={false}
                onClick={() => {
                  setActiveWorkspace("spoke-kle");
                  setActiveView("dashboard");
                }}
              />
            )}
            {(isCentralAdmin || currentPersona === "spoke-coep") && (
              <SidebarNavItem
                active={activeWorkspace === "spoke-coep"}
                icon={<FaBuilding />}
                label="COEP Campus"
                collapsed={false}
                onClick={() => {
                  setActiveWorkspace("spoke-coep");
                  setActiveView("dashboard");
                }}
              />
            )}
            {(isCentralAdmin || currentPersona === "spoke-mmcoep") && (
              <SidebarNavItem
                active={activeWorkspace === "spoke-mmcoep"}
                icon={<FaBuilding />}
                label="MMCOEP Campus"
                collapsed={false}
                onClick={() => {
                  setActiveWorkspace("spoke-mmcoep");
                  setActiveView("dashboard");
                }}
              />
            )}
            {(isCentralAdmin || currentPersona === "spoke-rit") && (
              <SidebarNavItem
                active={activeWorkspace === "spoke-rit"}
                icon={<FaBuilding />}
                label="RIT Campus"
                collapsed={false}
                onClick={() => {
                  setActiveWorkspace("spoke-rit");
                  setActiveView("dashboard");
                }}
              />
            )}
            
            <hr style={{ border: "none", borderTop: "1px solid var(--sidebar-border)", margin: "12px 16px 12px 0" }} />

            {/* Connection Status Indicator */}
            <div style={{ padding: "12px 14px", fontSize: "11px", border: "1px solid var(--sidebar-border)", background: "var(--sidebar-card-bg)", borderRadius: "16px", marginRight: "16px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: hasError ? "#ef4444" : "#10b981",
                  display: "inline-block"
                }} className={hasError ? "" : "pulse-glow"}></span>
                <span style={{ fontWeight: "700", color: "var(--sidebar-text-main)" }}>{connectionStatus}</span>
              </div>
              <p style={{ color: "var(--sidebar-text-muted)", fontSize: "10px", lineHeight: "1.3" }}>
                {hasError 
                  ? "Jira API server offline. Check logs."
                  : "Live tracking active. Auto-refreshing."}
              </p>
            </div>
          </nav>

          {/* Sidebar Footer User Detail */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "16px",
            borderTop: "1px solid var(--sidebar-border)",
            marginRight: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
              <img
                src={currentUser?.avatarUrls?.["48x48"] || "https://i.pravatar.cc/100?img=64"}
                alt="Logged user profile"
                style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid var(--sidebar-border)" }}
              />
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span style={{ fontWeight: "600", fontSize: "13px", color: "var(--sidebar-text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {sessionUser?.displayName || currentUser?.displayName || "Jira Administrator"}
                </span>
                <span style={{ color: "var(--sidebar-text-muted)", fontSize: "10px" }}>
                  {sessionUser?.role || "Active Session"}
                </span>
              </div>
            </div>
            {/* Logout button moved to header */}
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main style={{ flex: 1, padding: "30px 40px", display: "flex", flexDirection: "column", gap: "30px", overflowY: "auto", background: "var(--bg-content)" }}>
        
        {/* HEADER & NAV BAR */}
        <header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", margin: "0" }}>
              {activeWorkspace === "hub"
                ? "ApniLeap Executive Portfolio Hub"
                : activeWorkspace === "project-manager" ? `${sessionUser?.company || "Company"} Project Portal`
                : activeWorkspace === "moderator"
                ? "Central Moderation Portal"
                : activeWorkspace === "meetings"
                ? "Collaboration & Sync Meetings"
                : activeView === "dashboard"
                ? `${activeWorkspace === "playground" ? "Playground" : SPOKES[currentBoardId]?.name || "Spoke"} Analytics Console`
                : `${activeWorkspace === "playground" ? "Playground" : SPOKES[currentBoardId]?.name || "Spoke"} Sprint Kanban Board`}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
              {activeWorkspace === "hub"
                ? "Consolidated FIP outcomes progress, cross-college blocker escalations, and standard workstream status tracker."
                : activeWorkspace === "project-manager" ? "Create and manage your company's projects, requirements, and phases."
                : activeWorkspace === "moderator"
                ? "Intake projects from industry partners and automatically provision them directly to campus spaces."
                : activeWorkspace === "meetings"
                ? "Schedule campus sprint syncs, manage agendas, and auto-dispatch pre-meeting overdue warning digests."
                : activeView === "dashboard" 
                ? "Key performance metrics, sprint load status, priorities summary and deadline risks." 
                : "Drag issues across columns to transition status, update fields, or track work progression."
              }
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Global theme selection toggle bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(0, 0, 0, 0.04)",
              border: "1px solid rgba(0, 0, 0, 0.04)",
              padding: "4px",
              borderRadius: "99px",
              boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.03)"
            }}>
              {[
                { name: "dark", label: "Dark", icon: <FaMoon size={11} /> },
                { name: "light", label: "Light", icon: <FaSun size={11} /> }
              ].map(t => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setTheme(t.name)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 11px",
                    borderRadius: "99px",
                    background: theme === t.name ? "var(--primary)" : "transparent",
                    color: theme === t.name ? "#ffffff" : "var(--text-muted)",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "10.5px",
                    transition: "var(--transition-smooth)"
                  }}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Live Refresh button */}
            <button
              onClick={() => activeWorkspace === "hub" ? fetchHubMetrics(false) : activeWorkspace === "moderator" ? fetchModeratorProjects(false) : fetchJiraTasks(false)}
              className="btn-secondary"
              disabled={isLoading || (activeWorkspace === "hub" && isHubLoading) || (activeWorkspace === "moderator" && isModeratorLoading)}
              style={{ padding: "10.5px 12px", border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)" }}
              title="Refetch Data"
            >
              <FaSyncAlt size={13} className={isLoading || (activeWorkspace === "hub" && isHubLoading) || (activeWorkspace === "moderator" && isModeratorLoading) ? "pulse-glow" : ""} />
            </button>

            {activeWorkspace !== "hub" && activeWorkspace !== "moderator" && activeWorkspace !== "meetings" && currentPersona !== "moderator" && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="btn-primary"
              >
                <FaPlus size={12} />
                <span>New Issue</span>
              </button>
            )}

            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
              <div style={{
                background: "#ffffff",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                padding: "10.5px 12px",
                borderRadius: "10px",
                color: "var(--text-main)",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <FaBell size={15} />
              </div>
              
              {/* Notification Badges - only show if there are unread notifications */}
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "#ef4444",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>{notifications.filter(n => !n.read).length}</span>
              )}

              {/* DROPDOWN */}
              {isNotificationsOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "12px",
                  width: "320px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                  zIndex: 50,
                  overflow: "hidden"
                }} onClick={e => e.stopPropagation()}>
                  <div style={{ padding: "16px", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", color: "var(--text-main)", fontWeight: "700" }}>Notifications</h4>
                    {notifications.length > 0 && (
                      <span style={{ fontSize: "12px", color: "var(--primary)", cursor: "pointer", fontWeight: "600" }} onClick={() => {
                        notifications.forEach(n => dismissNotification(n.id));
                      }}>Mark all as read</span>
                    )}
                  </div>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice().reverse().map(n => (
                        <div key={n.id} style={{ padding: "16px", borderBottom: "1px solid var(--border-glass)", background: n.read ? "transparent" : "rgba(59, 130, 246, 0.05)" }}>
                          <div style={{ fontSize: "13px", color: "var(--text-main)", fontWeight: n.read ? "500" : "600", marginBottom: "6px" }}>{n.message}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{new Date(n.timestamp).toLocaleString()}</div>
                            {!n.read && (
                              <button onClick={() => dismissNotification(n.id)} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "11px", cursor: "pointer", fontWeight: "600", padding: 0 }}>Dismiss</button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* SIGN OUT BUTTON */}
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-glass)",
                color: "var(--text-main)",
                cursor: "pointer",
                padding: "8px 16px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-glass)";
                e.currentTarget.style.borderColor = "var(--border-accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-card)";
                e.currentTarget.style.borderColor = "var(--border-glass)";
              }}
            >
              Sign Out <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* SEARCH & DYNAMIC FILTER BAR */}
        {activeWorkspace !== "hub" && activeWorkspace !== "moderator" && (
          <section className="glass-panel" style={{
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px"
          }}>
            {/* Search Input */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
              <FaSearch color="var(--text-dim)" size={14} />
              <input
                type="text"
                placeholder="Search by Key or Summary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-main)",
                  outline: "none",
                  fontSize: "14px",
                  width: "100%"
                }}
              />
              {searchQuery && (
                <FaTimes
                  color="var(--text-muted)"
                  onClick={() => setSearchQuery("")}
                  style={{ cursor: "pointer" }}
                  size={12}
                />
              )}
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              {/* Priority Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaFilter size={12} color="var(--text-muted)" />
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Priority:</span>
                <select
                  className="form-select"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  style={{ padding: "6px 28px 6px 12px", width: "110px", height: "34px", fontSize: "13px" }}
                >
                  <option value="All">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Assignee Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaFilter size={12} color="var(--text-muted)" />
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Assignee:</span>
                <select
                  className="form-select"
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  style={{ padding: "6px 28px 6px 12px", width: "140px", height: "34px", fontSize: "13px" }}
                >
                  <option value="All">All</option>
                  <option value="Unassigned">Unassigned</option>
                  {activeAssignees.map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Project / Epic Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaFilter size={12} color="var(--text-muted)" />
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Project:</span>
                <select
                  className="form-select"
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  style={{ padding: "6px 28px 6px 12px", width: "180px", height: "34px", fontSize: "13px" }}
                >
                  <option value="All">All Projects</option>
                  {activeProjectsList.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              
              {/* Reset Filters indicator */}
              {(searchQuery || filterPriority !== "All" || filterAssignee !== "All" || filterProject !== "All") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterPriority("All");
                    setFilterAssignee("All");
                    setFilterProject("All");
                    triggerToast("Filters cleared");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent)",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: "600",
                    textDecoration: "underline"
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>
          </section>
        )}

        {/* LOADING SHIMMER STATE */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", gap: "16px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              border: "4px solid rgba(99, 102, 241, 0.1)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
            }} className="pulse-glow"></div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Synchronizing live data from board...</p>
          </div>
        ) : hasError ? (
          <div className="glass-panel" style={{
            padding: "50px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            borderColor: "rgba(239, 68, 68, 0.2)"
          }}>
            <FaExclamationTriangle size={48} color="#ef4444" className="pulse-glow" style={{ borderRadius: "50%" }} />
            <h2 style={{ fontSize: "20px", fontWeight: "700" }}>Jira Backend Connection Failed</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", maxWidth: "450px", lineHeight: "1.6" }}>
              The dashboard was unable to fetch tasks because the local Express server is not running on port 5000. 
            </p>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px 24px", borderRadius: "8px", fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-main)", border: "1px solid var(--border-glass)" }}>
              cd backend<br/>
              npm start
            </div>
            <button
              onClick={() => activeWorkspace === "hub" ? fetchHubMetrics(false) : fetchJiraTasks(false)}
              className="btn-primary"
              style={{ marginTop: "10px" }}
            >
              <FaSyncAlt size={12} />
              <span>Retry Sync</span>
            </button>
          </div>
        ) : activeWorkspace === "hub" ? (
          <HubDashboardView
            metrics={hubMetrics}
            loading={isHubLoading}
            onRefresh={() => fetchHubMetrics(false)}
            onIngestClick={() => setIsIngestOpen(true)}
            triggerToast={triggerToast}
          />
        ) : activeWorkspace === "moderator" ? (
          <ModeratorDashboardView
            projects={moderatorProjects}
            loading={isModeratorLoading}
            onRefresh={() => fetchModeratorProjects(false)}
            onAssignClick={(proj) => {
              setSelectedAssignProject(proj);
              setIsAssignModalOpen(true);
            }}
            onIngestClick={() => setIsIngestOpen(true)}
            onEditClick={(proj) => {
              setEditingProject(proj);
              setEditCompany(proj.company);
              setEditTitle(proj.title);
              setEditDescription(proj.description || "");
              setEditBudget(proj.budget);
              setEditDuration(proj.duration);
              setEditDueDate(proj.proposedDueDate ? proj.proposedDueDate.split("T")[0] : "2026-08-25");
            }}
            onDeleteClick={(proj) => handleDeleteProject(proj.id)}
          />
        
        ) : activeWorkspace === "project-manager" ? (
          <ProjectManagerDashboardView
            projects={projectManagerProjects}
            loading={isProjectManagerLoading}
            onRefresh={fetchProjectManagerProjects}
            onIngestClick={() => setIsProjectManagerIngestModalOpen(true)}
            sessionUser={sessionUser}
          />

        ) : activeWorkspace === "mentor-dashboard" ? (
          <ProjectMentorDashboardView
            sessionUser={sessionUser}
            mentorAssignments={mentorAssignments}
            moderatorProjects={moderatorProjects}
            spokes={Object.entries(SPOKES).map(([id, spoke]) => ({ id, ...spoke }))}
            triggerToast={triggerToast}
            tasks={tasks}
          />
        ) : sessionUser?.role === "Corporate Partner" ? (
          <CorporateSponsorDashboardView
            projects={moderatorProjects}
            loading={isModeratorLoading}
            onRefresh={() => fetchModeratorProjects(false)}
            onSubmitProposal={async (payload) => {
              try {
                const res = await axios.post("http://localhost:5000/moderator/projects", {
                  company: sessionUser?.displayName?.replace(" Sponsor", "") || "NVIDIA",
                  ...payload
                });
                if (res.data && res.data.success) {
                  triggerToast("Corporate project proposal submitted successfully!");
                  fetchModeratorProjects(true);
                }
              } catch (err) {
                console.error(err);
                triggerToast("Failed to submit corporate project proposal.", "error");
              }
            }}
            triggerToast={triggerToast}
            sessionUser={sessionUser}
            spokes={Object.entries(SPOKES).map(([id, spoke]) => ({ id, ...spoke }))}
            tasks={tasks}
            mentorAssignments={mentorAssignments}
            onOpenMentorModal={(proj) => {
              setMentorModalProject(proj);
              setMentorMode("global");
              setMentorGlobalName("");
              setMentorGlobalEmail("");
              setMentorPerSpoke({});
              setIsMentorModalOpen(true);
            }}
          />
        ) : activeWorkspace === "meetings" ? (
          <MeetingsPortalView
            meetings={meetings}
            loading={isMeetingsLoading}
            onRefresh={() => fetchMeetings(false)}
            spokes={Object.entries(SPOKES).map(([id, spoke]) => ({ id, ...spoke }))}
            triggerToast={triggerToast}
            moderatorProjects={moderatorProjects}
          />
        ) : (
          <>
            {/* ========================================= */}
            {/* ROLE IDENTITY BANNER — Spoke Dashboards   */}
            {/* ========================================= */}
            {(() => {
              const role = sessionUser?.role;
              const name = sessionUser?.displayName || sessionUser?.name || sessionUser?.email || "User";
              const email = sessionUser?.email || "";
              const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=64`;

              const roleConfig = {
                "Student Developer": {
                  icon: <FaGraduationCap size={22} />,
                  label: "Student Developer",
                  subtitle: "Track your assigned tasks, submit deliverables, and collaborate with your team.",
                  gradient: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(99,102,241,0.08) 100%)",
                  border: "rgba(59,130,246,0.25)",
                  iconColor: "#60a5fa",
                  badge: "bg-blue",
                },
                "Faculty Member": {
                  icon: <FaBook size={20} />,
                  label: "Faculty Member",
                  subtitle: "Oversee student teams, review sprint progress, and manage academic deliverables.",
                  gradient: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)",
                  border: "rgba(99,102,241,0.25)",
                  iconColor: "#818cf8",
                  badge: "bg-indigo",
                },
                "Campus Coordinator": {
                  icon: <FaUserTie size={20} />,
                  label: "Campus Coordinator",
                  subtitle: "Manage spoke operations, assign faculty to projects, and report to the central hub.",
                  gradient: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.08) 100%)",
                  border: "rgba(16,185,129,0.25)",
                  iconColor: "#34d399",
                  badge: "bg-green",
                },
              };

              const cfg = roleConfig[role];
              if (!cfg) return null;

              const spokeInfo = SPOKES[currentBoardId];

              return (
                <div style={{
                  padding: "18px 22px",
                  background: cfg.gradient,
                  border: `1.5px solid ${cfg.border}`,
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                  marginBottom: "4px",
                  flexWrap: "wrap"
                }}>
                  {/* Avatar */}
                  <img
                    src={avatarUrl}
                    alt={name}
                    style={{ width: "52px", height: "52px", borderRadius: "50%", border: `2px solid ${cfg.border}`, flexShrink: 0 }}
                  />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ color: cfg.iconColor }}>{cfg.icon}</span>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: cfg.iconColor, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                        {cfg.label}
                      </span>
                    </div>
                    <h3 style={{ margin: "0 0 3px 0", fontSize: "17px", fontWeight: "800", color: "var(--text-main)" }}>
                      Welcome, {name.split(" ")[0]}!
                    </h3>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                      {cfg.subtitle}
                    </p>
                  </div>

                  {/* Spoke badge */}
                  {spokeInfo && (
                    <div style={{
                      padding: "10px 18px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "10px",
                      textAlign: "center",
                      flexShrink: 0
                    }}>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Spoke Campus</div>
                      <div style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-main)", marginTop: "3px" }}>{spokeInfo.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>{email}</div>
                    </div>
                  )}
                </div>
              );
            })()}
            {/* Proposed B2B Project Decision Banner (Multi-tenant Coordinator Review Privilege) */}
            {sessionUser?.role !== "Student Developer" && proposedProjectsForSpoke.map((proj) => (
              <div key={proj.id} className="glass-panel pulse-glow" style={{
                background: theme === "dark"
                  ? "rgba(45, 212, 191, 0.08)"
                  : "rgba(13, 148, 136, 0.04)",
                border: "1.5px dashed var(--border-glow)",
                padding: "22px 26px",
                borderRadius: "16px",
                marginBottom: "25px",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "28px" }}><FaCheckCircle style={{ color: "var(--status-done-text)" }} /></span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "850", color: "var(--text-main)" }}>
                        New Corporate Project Proposed!
                      </h4>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "var(--text-muted)" }}>
                        Your institution has been nominated by the Moderator for a premium company program.
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "900",
                    background: "rgba(249, 115, 22, 0.15)",
                    border: "1px solid rgba(249, 115, 22, 0.3)",
                    color: "var(--accent)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    textTransform: "uppercase"
                  }}>
                    Awaiting Spoke Decision
                  </span>
                </div>

                <div style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-glass)",
                  padding: "16px",
                  borderRadius: "12px",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "16px",
                  alignItems: "center"
                }}>
                  <CompanyLogo company={proj.company} size={48} />
                  <div>
                    <h5 style={{ margin: 0, fontSize: "15.5px", fontWeight: "800", color: "var(--text-main)" }}>
                      {proj.title} <span style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: "500" }}>by {proj.company}</span>
                    </h5>
                    <p style={{ margin: "6px 0 0 0", fontSize: "13.5px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                      {proj.description}
                    </p>
                    <div style={{ display: "flex", gap: "20px", marginTop: "12px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12.5px", color: "var(--text-main)" }}>
                        <strong>Budget:</strong> {proj.budget}
                      </span>
                      <span style={{ fontSize: "12.5px", color: "var(--text-main)" }}>
                        <strong>Duration:</strong> {proj.duration}
                      </span>
                      <span style={{ fontSize: "12.5px", color: "var(--text-main)" }}>
                        <strong>Proposed Deadline:</strong> <em>{proj.proposedDueDate}</em>
                      </span>
                    </div>
                  </div>
                </div>

                {isCentralAdmin ? (
                  <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-glass)", paddingTop: "14px", marginTop: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "13.5px", fontStyle: "italic", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-glass)", padding: "10px 18px", borderRadius: "8px" }}>
                      <span>ℹ️</span>
                      <span>Accepting or declining proposals is restricted to Spoke Coordinators. (Read-Only Mode)</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", borderTop: "1px solid var(--border-glass)", paddingTop: "14px", marginTop: "4px" }}>
                    <button
                      onClick={() => handleDeclineProject(proj.id)}
                      disabled={isRespondingToProject}
                      className="btn-secondary"
                      style={{
                        padding: "8px 18px",
                        fontSize: "13px",
                        borderRadius: "8px",
                        borderColor: "rgba(239, 68, 68, 0.3)",
                        color: "#f87171",
                        cursor: "pointer"
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaTimes /> Decline Proposal</span>
                    </button>
                    <button
                      onClick={() => handleAcceptProject(proj.id)}
                      disabled={isRespondingToProject}
                      className="btn-primary"
                      style={{
                        padding: "8px 18px",
                        fontSize: "13px",
                        borderRadius: "8px",
                        background: "#ef4444",
                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
                        cursor: "pointer"
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaCheck /> Accept Project & Provision Jira Board</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="glass-panel" style={{
              background: todayConflictsForSpoke.length > 0
                ? (theme === "dark"
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(239, 68, 68, 0.04)")
                : (theme === "dark"
                  ? "rgba(13, 148, 136, 0.1)"
                  : "rgba(13, 148, 136, 0.04)"),
              border: todayConflictsForSpoke.length > 0
                ? "1.5px solid rgba(239, 68, 68, 0.35)"
                : "1.5px solid var(--border-glass)",
              boxShadow: todayConflictsForSpoke.length > 0
                ? "var(--shadow-premium), 0 0 25px rgba(239, 68, 68, 0.12)"
                : "var(--shadow-premium), 0 0 25px rgba(13, 148, 136, 0.08)",
              padding: "20px 24px",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "25px",
              animation: todayConflictsForSpoke.length > 0 ? "pulse-glow 3s infinite alternate" : "pulse-glow 5s infinite alternate"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}><FaCalendarAlt /></span>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "850", color: "var(--text-main)" }}>
                    Today's FIP Sprint Syncs Scheduled ({todayMeetingsForSpoke.length})
                  </h4>
                </div>
                {todayConflictsForSpoke.length > 0 && (
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: theme === "dark" ? "#fca5a5" : "#b91c1c",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }} className="pulse-glow">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent)" }}><FaExclamationTriangle /> OVERLAP CONFLICT</span>
                  </span>
                )}
              </div>

              {todayConflictsForSpoke.length > 0 && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  background: theme === "dark" ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.05)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: "8px",
                  color: theme === "dark" ? "#fca5a5" : "#b91c1c",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  lineHeight: "1.4"
                }}>
                  <span><FaExclamationTriangle /></span>
                  <span>
                    <strong>Schedule Conflict:</strong> Multiple meetings are scheduled at the same time today. Please coordinate to resolve the conflict.
                  </span>
                </div>
              )}

              {todayMeetingsForSpoke.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {todayMeetingsForSpoke.map((meet) => {
                    const hasConflict = todayConflictsForSpoke.some(c => c.id === meet.id);
                    return (
                      <div key={meet.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "12px",
                        padding: "14px 18px",
                        background: hasConflict
                          ? (theme === "dark" ? "rgba(239, 68, 68, 0.06)" : "rgba(239, 68, 68, 0.04)")
                          : (theme === "dark" ? "rgba(45, 212, 191, 0.03)" : "rgba(13, 148, 136, 0.03)"),
                        border: hasConflict
                          ? "1px solid rgba(239, 68, 68, 0.3)"
                          : "1px solid var(--border-glass)",
                        borderRadius: "12px",
                        boxShadow: hasConflict ? "0 0 10px rgba(239, 68, 68, 0.05)" : "none",
                        transition: "var(--transition-smooth)"
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "280px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{
                              fontSize: "11px",
                              fontWeight: "800",
                              background: hasConflict ? "rgba(239, 68, 68, 0.12)" : "var(--primary-glow)",
                              color: hasConflict ? (theme === "dark" ? "#fca5a5" : "#b91c1c") : "var(--primary)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontFamily: "var(--mono)"
                            }}>
                              <span><FaClock style={{ marginRight: "4px", verticalAlign: "middle" }} /> {meet.time}</span>
                            </span>
                            {hasConflict && (
                              <span style={{
                                fontSize: "10px",
                                fontWeight: "800",
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                                color: theme === "dark" ? "#fca5a5" : "#dc2626",
                                padding: "2px 6px",
                                borderRadius: "4px"
                              }} className="pulse-glow">
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent)" }}><FaExclamationTriangle /> Time Conflict</span>
                              </span>
                            )}
                            <strong style={{ fontSize: "14.5px", color: "var(--text-main)" }}>{meet.title}</strong>
                            <span style={{ fontSize: "10px", fontWeight: "700", background: "var(--bg-subtle)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-dim)", marginLeft: "8px", border: "1px solid var(--border-glass)" }}>
                              <FaClipboardList style={{ marginRight: "4px" }}/> Task: {meet.taskId || "AK-148"}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            Agenda: <em>{meet.agenda}</em>
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <a
                            href={meet.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary"
                            style={{
                              padding: "8px 16px",
                              fontSize: "12px",
                              borderRadius: "8px",
                              background: "#ef4444",
                              color: "white",
                              textDecoration: "none",
                              fontWeight: "750",
                              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)"
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>Join Meeting <FaPaperPlane /></span>
                          </a>
                          <button
                            onClick={() => setMeetings(prev => prev.filter(m => m.id !== meet.id))}
                            style={{
                              padding: "8px 12px",
                              fontSize: "12px",
                              borderRadius: "8px",
                              background: "rgba(45, 212, 191, 0.1)",
                              color: "#2dd4bf",
                              border: "1px solid rgba(45, 212, 191, 0.2)",
                              fontWeight: "750",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "var(--transition-smooth)"
                            }}
                          >
                            <FaCheckCircle /> Mark Attended
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "var(--text-dim)",
                  fontSize: "13px",
                  fontStyle: "italic",
                  border: "1px dashed var(--border-glass)",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.01)"
                }}>
                  No meetings scheduled for today. You're all caught up! 🎉
                </div>
              )}
            </div>

            {/* 1. DASHBOARD VIEW */}
            {activeView === "dashboard" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                
                {sessionUser?.role === "Student Developer" ? (
                  // ==========================================
                  // 💻 STUDENT DEVELOPER DASHBOARD VIEW
                  // ==========================================
                  <>
                    {(() => {
                      const mySpokeTasks = tasks.filter(t => {
                        const spokeLabel = CAMPUS_LABELS[currentBoardId];
                        const labels = t.fields?.labels || [];
                        return labels.includes(spokeLabel);
                      });

                      const myTeams = Array.isArray(spokeTeams) ? spokeTeams.filter(team => 
                        team && Array.isArray(team.members) && team.members.some(m => 
                          m && (
                            m.accountId === sessionUser?.accountId || 
                            (m.emailAddress && sessionUser?.email && m.emailAddress.toLowerCase().trim() === sessionUser.email.toLowerCase().trim())
                          )
                        )
                      ) : [];
                      const myTeamIds = myTeams.map(team => team && team._id ? team._id.toString() : "");

                      // Determine the active project based on the student's team
                      const activeTeamWithProject = myTeams.find(t => t.projectId);
                      const activeProject = activeTeamWithProject ? acceptedProjectsForSpoke.find(p => p.id === activeTeamWithProject.projectId) : null;

                      const myAssignedTasks = mySpokeTasks.filter(t => {
                        const assigneeEmail = t.fields?.assignee?.email || t.fields?.assignee?.emailAddress || "";
                        const assigneeAccountId = t.fields?.assignee?.accountId ? t.fields.assignee.accountId.toString() : "";
                        const currentUserEmail = sessionUser?.email || "";
                        const isDirectlyAssigned = assigneeEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
                        const isTeamAssigned = myTeamIds.includes(assigneeAccountId);
                        return isDirectlyAssigned || isTeamAssigned;
                      });

                      const studentActiveTasks = myAssignedTasks.filter(t => (t.fields?.status?.name || t.fields?.status || "") !== "Done");
                      const studentDoneTasks = myAssignedTasks.filter(t => (t.fields?.status?.name || t.fields?.status || "") === "Done");
                      const studentBlockedTasks = myAssignedTasks.filter(t => t.fields?.flagged === true);

                      const mySubmissionsList = allSubmissions.filter(sub => {
                        return sub.studentName && (
                          sub.studentName.toLowerCase().includes(sessionUser?.displayName?.toLowerCase()) || 
                          sub.studentName.toLowerCase().includes(sessionUser?.email?.toLowerCase())
                        );
                      });

                      const studentApprovedCount = mySubmissionsList.filter(sub => sub.status === "Approved").length;

                      return (
                        <>

                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "20px"
                          }}>
                          <DashboardCard
                            title="My Active Tasks"
                            value={studentActiveTasks.length}
                            subtitle="Assigned tasks in build"
                            glow={studentActiveTasks.length > 0}
                          />
                          <DashboardCard
                            title="My Flagged Blockers"
                            value={studentBlockedTasks.length}
                            subtitle="Tasks requiring support"
                            themeColor="var(--status-backlog-text)"
                            pulse={studentBlockedTasks.length > 0}
                            alert={studentBlockedTasks.length > 0}
                          />
                          <DashboardCard
                            title="My Shipped Deliverables"
                            value={studentDoneTasks.length}
                            subtitle="Sprint tasks marked Done"
                            themeColor="var(--status-done-text)"
                          />
                          <DashboardCard
                            title="Verified by Faculty"
                            value={studentApprovedCount}
                            subtitle="Approved deliverables artifacts"
                            themeColor="#a855f7"
                            glow={studentApprovedCount > 0}
                          />
                        </div>
                        </>
                      );
                    })()}

                    {/* Student Dashboard 2-Column Split */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr",
                      gap: "30px",
                      alignItems: "flex-start"
                    }}>
                      
                      {/* Left: Active Tasks & Submissions Feedback */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                        
                        {/* Active B2B Spoke Project - Moved to Top */}
                        {acceptedProjectsForSpoke.length > 0 && (
                          <div className="glass-panel" style={{ padding: "20px 24px" }}>
                            <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Active B2B Sponsor Project
                            </h3>
                            {acceptedProjectsForSpoke.slice(0, 1).map((proj) => {
                              const epicKey = proj.allocations ? proj.allocations.find(a => a.targetCampusId === currentBoardId)?.assignedKey : proj.assignedKey;
                              return (
                                <div key={proj.id} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <CompanyLogo company={proj.company} size={36} />
                                    <div>
                                      <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "var(--text-main)" }}>{proj.title}</h4>
                                      <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Sponsor: <strong>{proj.company}</strong></span>
                                    </div>
                                  </div>
                                  <div style={{
                                    padding: "10px 14px",
                                    background: "rgba(255, 255, 255, 0.01)",
                                    border: "1px solid var(--border-glass)",
                                    borderRadius: "8px",
                                    fontSize: "11.5px",
                                    display: "flex",
                                    justifyContent: "space-between"
                                  }}>
                                    <span style={{ color: "var(--text-dim)" }}>Jira key: <strong style={{ color: "var(--text-main)", fontFamily: "var(--mono)" }}>{epicKey || "PNLP-3"}</strong></span>
                                    <span style={{ color: "var(--text-dim)" }}>Deadline: <strong style={{ color: "var(--text-main)" }}>{proj.proposedDueDate}</strong></span>
                                  </div>

                                  {/* Phases List */}
                                  {proj.phases && proj.phases.length > 0 && (
                                    <div style={{ marginTop: "10px" }}>
                                      <h5 style={{ margin: "0 0 8px 0", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Project Phases (Kanban Tasks)</h5>
                                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {proj.phases.map((phase, pIdx) => (
                                          <div key={pIdx} style={{ background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                              <span style={{ fontSize: "12.5px", fontWeight: "800", color: "var(--text-main)" }}>{phase.name}</span>
                                              <span style={{ fontSize: "11px", color: "var(--accent)" }}>{phase.duration}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-dim)", lineHeight: "1.4" }}>{phase.description}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Add Phase UI for Coordinators/Faculty */}
                                  {(sessionUser?.role === "Coordinator" || sessionUser?.role === "Faculty") && (
                                    <div style={{ marginTop: "10px" }}>
                                      {!isAddingPhase ? (
                                        <button
                                          onClick={() => setIsAddingPhase(true)}
                                          className="btn-secondary"
                                          style={{ padding: "6px 12px", fontSize: "11px", display: "inline-flex", gap: "6px", alignItems: "center" }}
                                        >
                                          + Add Phase to Kanban
                                        </button>
                                      ) : (
                                        <div style={{ background: "rgba(0,0,0,0.15)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-glass)", display: "flex", flexDirection: "column", gap: "8px" }}>
                                          <input type="text" placeholder="Phase Name" value={newPhaseName} onChange={(e) => setNewPhaseName(e.target.value)} style={{ padding: "8px", fontSize: "12px", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "var(--bg-input)", color: "var(--text-main)", outline: "none" }} />
                                          <textarea placeholder="Description" value={newPhaseDesc} onChange={(e) => setNewPhaseDesc(e.target.value)} style={{ padding: "8px", fontSize: "12px", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "var(--bg-input)", color: "var(--text-main)", outline: "none", resize: "none", height: "60px" }} />
                                          <input type="text" placeholder="Duration (e.g. 2 Weeks)" value={newPhaseDuration} onChange={(e) => setNewPhaseDuration(e.target.value)} style={{ padding: "8px", fontSize: "12px", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "var(--bg-input)", color: "var(--text-main)", outline: "none" }} />
                                          
                                          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                            <button
                                              onClick={async () => {
                                                if (!newPhaseName.trim()) return;
                                                try {
                                                  const res = await axios.post(`http://localhost:5000/api/projects/${proj.id}/phases`, {
                                                    targetBoardId: currentBoardId,
                                                    name: newPhaseName,
                                                    description: newPhaseDesc,
                                                    duration: newPhaseDuration
                                                  });
                                                  if (res.data.success) {
                                                    triggerToast("Phase added and Kanban task created successfully!");
                                                    setIsAddingPhase(false);
                                                    setNewPhaseName("");
                                                    setNewPhaseDesc("");
                                                    setNewPhaseDuration("");
                                                    fetchModeratorProjects(false);
                                                    fetchJiraTasks(false);
                                                  }
                                                } catch (e) {
                                                  triggerToast("Failed to add phase.", "error");
                                                }
                                              }}
                                              className="btn-primary"
                                              style={{ padding: "6px 12px", fontSize: "11.5px", flex: 1 }}
                                            >
                                              Save & Sync
                                            </button>
                                            <button
                                              onClick={() => { setIsAddingPhase(false); setNewPhaseName(""); setNewPhaseDesc(""); setNewPhaseDuration(""); }}
                                              className="btn-secondary"
                                              style={{ padding: "6px 12px", fontSize: "11.5px", flex: 1 }}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* 1. Active Tasks Assigned to Me */}
                        {(() => {
                          const mySpokeTasks = tasks.filter(t => {
                            const spokeLabel = CAMPUS_LABELS[currentBoardId];
                            const labels = t.fields?.labels || [];
                            return labels.includes(spokeLabel);
                          });

                          const myTeams = Array.isArray(spokeTeams) ? spokeTeams.filter(team => 
                            team && Array.isArray(team.members) && team.members.some(m => 
                              m && (
                                m.accountId === sessionUser?.accountId || 
                                (m.emailAddress && sessionUser?.email && m.emailAddress.toLowerCase().trim() === sessionUser.email.toLowerCase().trim())
                              )
                            )
                          ) : [];
                          const myTeamIds = myTeams.map(team => team && team._id ? team._id.toString() : "");

                          const myAssignedTasks = mySpokeTasks.filter(t => {
                            const assigneeEmail = t.fields?.assignee?.email || t.fields?.assignee?.emailAddress || "";
                            const assigneeAccountId = t.fields?.assignee?.accountId ? t.fields.assignee.accountId.toString() : "";
                            const currentUserEmail = sessionUser?.email || "";
                            const isDirectlyAssigned = assigneeEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
                            const isTeamAssigned = myTeamIds.includes(assigneeAccountId);
                            return isDirectlyAssigned || isTeamAssigned;
                          });

                          return (
                            <div className="glass-panel" style={{ padding: "24px" }}>
                              <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "16px", color: "var(--text-main)" }}>
                                My Assigned Sprint Tasks ({myAssignedTasks.length})
                              </h3>
                              {myAssignedTasks.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                  {myAssignedTasks.map(t => {
                                    const tStatus = t.fields?.status?.name || t.fields?.status || "Backlog";
                                    const isTDone = tStatus === "Done";
                                    const isTeamTask = t.fields?.assignee?.isTeam || 
                                      t.fields?.assignee?.displayName?.includes("[TEAM]") || 
                                      (t.fields?.assignee?.accountId && myTeamIds.includes(t.fields.assignee.accountId.toString()));
                                    return (
                                      <div key={t.id} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "16px 20px",
                                        background: "rgba(255, 255, 255, 0.015)",
                                        border: "1px solid var(--border-glass)",
                                        borderRadius: "12px"
                                      }}>
                                        <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
                                          <span style={{
                                            fontFamily: "var(--mono)",
                                            fontSize: "12px",
                                            color: "var(--primary)",
                                            background: "rgba(99, 102, 241, 0.1)",
                                            padding: "3px 6px",
                                            borderRadius: "4px",
                                            fontWeight: "750"
                                          }}>{t.key}</span>
                                          <span style={{
                                            fontWeight: "600",
                                            fontSize: "13.5px",
                                            color: isTDone ? "var(--text-dim)" : "var(--text-main)",
                                            textDecoration: isTDone ? "line-through" : "none",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis"
                                          }}>{t.fields.summary}</span>
                                          {t.fields?.priority?.name && (
                                            <span style={{
                                              fontSize: "10px",
                                              fontWeight: "800",
                                              background: "var(--bg-subtle)",
                                              color: "var(--text-muted)",
                                              padding: "2px 6px",
                                              borderRadius: "6px",
                                              border: "1px solid var(--border-glass)"
                                            }}>{t.fields.priority.name}</span>
                                          )}
                                          {isTeamTask && (
                                            <span style={{
                                              fontSize: "10px",
                                              fontWeight: "800",
                                              background: "rgba(59, 130, 246, 0.12)",
                                              color: "#3b82f6",
                                              border: "1px solid rgba(59, 130, 246, 0.2)",
                                              padding: "2px 6px",
                                              borderRadius: "6px",
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: "6px"
                                            }}>
                                              <FaUsers size={12} />
                                              <span>Team Task</span>
                                            </span>
                                          )}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "16px", shrink: 0 }}>
                                          <Badge status={tStatus} />
                                          {!isTDone ? (
                                            <button 
                                              onClick={() => {
                                                setSelectedTask(t);
                                                setModalTab("deliverables");
                                              }}
                                              disabled={tStatus !== "In Progress"}
                                              style={{
                                                padding: "6px 12px",
                                                background: tStatus !== "In Progress" ? "rgba(255,255,255,0.05)" : "#ef4444",
                                                border: "none",
                                                borderRadius: "6px",
                                                color: tStatus !== "In Progress" ? "var(--text-dim)" : "white",
                                                fontSize: "11px",
                                                fontWeight: "800",
                                                cursor: tStatus !== "In Progress" ? "not-allowed" : "pointer",
                                                boxShadow: tStatus !== "In Progress" ? "none" : "0 4px 10px rgba(239, 68, 68, 0.2)"
                                              }}
                                            >
                                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>Submit Work <FaPaperPlane /></span>
                                            </button>
                                          ) : (
                                            <span style={{ fontSize: "11px", color: "var(--status-done-text)", fontWeight: "750" }}><span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><FaCheckCircle style={{ color: "var(--status-done-text)" }} /> Shipped</span></span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {mySubmissionsList.length > 10 && (
                                    <button
                                      onClick={() => setShowAllHistory(!showAllHistory)}
                                      style={{
                                        background: "transparent",
                                        border: "1px dashed var(--border-glass)",
                                        color: "var(--text-muted)",
                                        padding: "8px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "700",
                                        fontSize: "12px",
                                        marginTop: "8px"
                                      }}
                                    >
                                      {showAllHistory ? "Show Less" : `View All History (${mySubmissionsList.length})`}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <EmptyStateMessage text="No sprint tasks currently assigned to your account." showIcon={true} />
                              )}
                            </div>
                          );
                        })()}

                        {/* 2. My Submissions & Mentor Evaluation Timeline */}
                        {(() => {
                          const mySubmissionsList = allSubmissions.filter(sub => {
                            return sub.studentName && (
                              sub.studentName.toLowerCase().includes(sessionUser?.displayName?.toLowerCase()) || 
                              sub.studentName.toLowerCase().includes(sessionUser?.email?.toLowerCase())
                            );
                          });

                          return (
                            <div className="glass-panel" style={{ padding: "24px" }}>
                              <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "16px", color: "var(--text-main)" }}>
                                My Submissions & Mentor Evaluations ({mySubmissionsList.length})
                              </h3>
                              {mySubmissionsList.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                  {(showAllHistory ? mySubmissionsList : mySubmissionsList.slice(0, 10)).map(sub => {
                                    const badgeBg = sub.status === "Approved" ? "rgba(45, 212, 191, 0.08)" : sub.status === "Re-work Requested" ? "rgba(239, 68, 68, 0.08)" : "rgba(251, 146, 60, 0.08)";
                                    const badgeColor = sub.status === "Approved" ? "#2dd4bf" : sub.status === "Re-work Requested" ? "#ef4444" : "var(--accent)";
                                    const badgeBorder = sub.status === "Approved" ? "1px solid rgba(45, 212, 191, 0.2)" : sub.status === "Re-work Requested" ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(251, 146, 60, 0.2)";

                                    return (
                                      <div key={sub._id} style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "10px",
                                        padding: "16px",
                                        background: "rgba(255, 255, 255, 0.01)",
                                        border: "1px solid var(--border-glass)",
                                        borderRadius: "12px"
                                      }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                            <span style={{ fontSize: "13px", fontWeight: "800", color: "var(--text-main)" }}>{sub.fileName}</span>
                                            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                                              Task Ref: <strong style={{ color: "var(--primary)" }}>{sub.taskId}</strong> • Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <span style={{
                                            fontSize: "9.5px",
                                            fontWeight: "900",
                                            background: badgeBg,
                                            color: badgeColor,
                                            border: badgeBorder,
                                            padding: "2px 8px",
                                            borderRadius: "4px",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px"
                                          }}>{sub.status}</span>
                                        </div>

                                        <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "12px", marginTop: "4px" }}>
                                          <a 
                                            href={sub.fileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            style={{
                                              color: "var(--primary)",
                                              fontWeight: "750",
                                              textDecoration: "none"
                                            }}
                                          >
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaLink /> Open Deliverable Link</span>
                                          </a>
                                          {sub.comments && (
                                            <span style={{ color: "var(--text-dim)" }}>
                                              • Comments: <em style={{ color: "var(--text-muted)" }}>"{sub.comments}"</em>
                                            </span>
                                          )}
                                        </div>

                                        {sub.feedback && (
                                          <div style={{
                                            marginTop: "8px",
                                            padding: "10px 14px",
                                            background: sub.status === "Approved" ? "rgba(45, 212, 191, 0.03)" : "rgba(239, 68, 68, 0.03)",
                                            borderLeft: `3px solid ${badgeColor}`,
                                            borderRadius: "0 8px 8px 0",
                                            fontSize: "12px"
                                          }}>
                                            <strong style={{ color: "var(--text-main)" }}>Faculty Feedback: </strong>
                                            <span style={{ color: "var(--text-muted)" }}>{sub.feedback}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {mySubmissionsList.length > 10 && (
                                    <button
                                      onClick={() => setShowAllHistory(!showAllHistory)}
                                      style={{
                                        background: "transparent",
                                        border: "1px dashed var(--border-glass)",
                                        color: "var(--text-muted)",
                                        padding: "8px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "700",
                                        fontSize: "12px",
                                        marginTop: "8px"
                                      }}
                                    >
                                      {showAllHistory ? "Show Less" : `View All History (${mySubmissionsList.length})`}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <EmptyStateMessage text="You haven't submitted any deliverables for review yet." showIcon={true} />
                              )}
                            </div>
                          );
                        })()}

                      </div>

                      {/* Right: Spoke Leaderboard & B2B Projects */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                        
                        <div className="glass-panel" style={{ 
                          padding: "24px",
                          background: "#ffffff",
                          border: "1px solid var(--border-glass)",
                          boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.8px", color: "#1e293b", margin: 0 }}>Spoke Leaderboard</h3>
                            <span style={{ fontSize: "10px", color: "#2dd4bf", fontWeight: "800", background: "rgba(45, 212, 191, 0.15)", border: "1px solid rgba(45, 212, 191, 0.3)", padding: "4px 10px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.5px", boxShadow: "0 0 10px rgba(45, 212, 191, 0.2)" }} className="pulse-glow">Live Rank</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {leaderboardData.map((spoke, idx) => {
                              const isCurrent = spoke.id === currentBoardId || (spoke.name && spoke.name.includes(SPOKES[currentBoardId]?.name));
                              const medal = idx === 0 ? "🥇 1st" : idx === 1 ? "🥈 2nd" : idx === 2 ? "🥉 3rd" : "🎯 Rank";
                              const pct = spoke.total > 0 ? Math.round((spoke.done / spoke.total) * 100) : 0;
                              
                              return (
                                <div key={spoke.id || spoke.name} style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                  padding: "14px 16px",
                                  background: isCurrent ? "rgba(99, 102, 241, 0.05)" : "#ffffff",
                                  border: isCurrent ? "1px solid rgba(99, 102, 241, 0.6)" : "1px solid #e2e8f0",
                                  borderRadius: "12px",
                                  boxShadow: isCurrent ? "0 0 20px rgba(99, 102, 241, 0.1)" : "0 2px 4px rgba(0,0,0,0.02)",
                                  transition: "all 0.3s ease",
                                  position: "relative",
                                  overflow: "hidden"
                                }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                      <span style={{ fontSize: "14px", fontWeight: "750", color: idx <= 2 ? "#1e293b" : "#64748b", minWidth: "55px" }}>{medal}</span>
                                      <span style={{ fontSize: "14px", fontWeight: isCurrent ? "800" : "700", color: isCurrent ? "var(--primary)" : "#1e293b", letterSpacing: "0.2px" }}>
                                        {spoke.name}
                                      </span>
                                    </div>
                                    <span style={{ fontSize: "13px", fontFamily: "var(--mono)", color: idx === 0 ? "#d97706" : "#64748b", fontWeight: "800" }}>
                                      {spoke.done} <span style={{ color: "#94a3b8", fontWeight: "500" }}>/ {spoke.total} Done</span> ({pct}%)
                                    </span>
                                  </div>
                                  <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden", border: "1px solid #e2e8f0", zIndex: 1 }}>
                                    <div style={{
                                      width: `${pct}%`,
                                      height: "100%",
                                      background: idx === 0 
                                        ? "linear-gradient(90deg, #f59e0b, #fbbf24)" 
                                        : (idx === 1 ? "linear-gradient(90deg, #9ca3af, #d1d5db)" 
                                          : (idx === 2 ? "linear-gradient(90deg, #d97706, #fcd34d)" : "linear-gradient(90deg, var(--primary), #818cf8)")),
                                      borderRadius: "4px",
                                      boxShadow: "0 0 10px rgba(255,255,255,0.2)"
                                    }}></div>
                                  </div>
                                  {isCurrent && (
                                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "var(--primary)", opacity: 0.05, zIndex: 0 }} className="pulse-glow"></div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* My Collaborative Teams */}
                        <div className="glass-panel" style={{ padding: "20px 24px", marginBottom: "20px" }}>
                          <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            My Collaborative Teams
                          </h3>
                          {(() => {
                            const myTeamsList = Array.isArray(spokeTeams) ? spokeTeams.filter(team => 
                              team && Array.isArray(team.members) && team.members.some(m => 
                                m && (
                                  m.accountId === sessionUser?.accountId || 
                                  (m.emailAddress && sessionUser?.email && m.emailAddress.toLowerCase().trim() === sessionUser.email.toLowerCase().trim())
                                )
                              )
                            ) : [];

                            if (myTeamsList.length > 0) {
                              return (
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                  {myTeamsList.map((team) => (
                                    <div key={team._id} style={{
                                      padding: "14px",
                                      background: "rgba(99, 102, 241, 0.02)",
                                      border: "1px solid var(--border-glass)",
                                      borderRadius: "10px",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "10px"
                                    }}>
                                      <strong style={{ fontSize: "13px", color: "var(--text-main)" }}>{team.name}</strong>
                                      
                                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                        {team.mentor && (
                                          <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            background: "rgba(168, 85, 247, 0.05)",
                                            border: "1px solid rgba(168, 85, 247, 0.15)",
                                            borderRadius: "6px",
                                            padding: "4px 8px"
                                          }}>
                                            <img src={team.mentor.avatarUrl} alt={team.mentor.displayName} style={{ width: "18px", height: "18px", borderRadius: "50%" }} />
                                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                              Coordinator: <strong style={{ color: "var(--text-main)" }}>{team.mentor.displayName}</strong>
                                            </span>
                                          </div>
                                        )}
                                        {team.teamLeader && (
                                          <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            background: "rgba(16, 185, 129, 0.05)",
                                            border: "1px solid rgba(16, 185, 129, 0.15)",
                                            borderRadius: "6px",
                                            padding: "4px 8px"
                                          }}>
                                            <img src={team.teamLeader.avatarUrl} alt={team.teamLeader.displayName} style={{ width: "18px", height: "18px", borderRadius: "50%" }} />
                                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                              Leader: <strong style={{ color: "var(--text-main)" }}>{team.teamLeader.displayName}</strong>
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                        <div style={{ fontSize: "10px", color: "var(--text-dim)", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>Team Members</div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                          {team.members.map((m) => (
                                            <div key={m.accountId} style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "4px",
                                              background: "rgba(255, 255, 255, 0.03)",
                                              border: "1px solid var(--border-glass)",
                                              borderRadius: "12px",
                                              padding: "2px 8px"
                                            }}>
                                              <img src={m.avatarUrl} alt={m.displayName} style={{ width: "14px", height: "14px", borderRadius: "50%" }} />
                                              <span style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                                                {m.displayName}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            } else {
                              return (
                                <div style={{
                                  fontSize: "12px",
                                  color: "var(--text-dim)",
                                  fontStyle: "italic",
                                  textAlign: "center",
                                  padding: "16px 0",
                                  border: "1px dashed var(--border-glass)",
                                  borderRadius: "8px",
                                  background: "rgba(255,255,255,0.002)"
                                }}>
                                  Not assigned to any collaborative team yet. Contact your coordinator to join a team!
                                </div>
                              );
                            }
                          })()}
                        </div>



                      </div>

                    </div>
                  </>
                ) : (
                  // ==========================================
                  // 🎓 FACULTY MENTOR (COORDINATOR) DASHBOARD
                  // ==========================================
                  <>
                    {/* Faculty Dashboard Tab Navigation */}
                    <div style={{
                      display: "flex",
                      gap: "10px",
                      borderBottom: "1px solid var(--border-glass)",
                      paddingBottom: "12px",
                      marginBottom: "25px"
                    }}>
                      <button
                        type="button"
                        onClick={() => setActiveCoordinatorTab("analytics")}
                        style={{
                          padding: "8px 18px",
                          borderRadius: "8px",
                          border: "1px solid transparent",
                          background: activeCoordinatorTab === "analytics" ? "rgba(99, 102, 241, 0.12)" : "transparent",
                          color: activeCoordinatorTab === "analytics" ? "var(--primary)" : "var(--text-muted)",
                          borderColor: activeCoordinatorTab === "analytics" ? "rgba(99, 102, 241, 0.25)" : "transparent",
                          fontWeight: "750",
                          fontSize: "12.5px",
                          cursor: "pointer",
                          transition: "var(--transition-smooth)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><FaChartPie /></span> Analytics & Deliverables
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCoordinatorTab("team")}
                        style={{
                          padding: "8px 18px",
                          borderRadius: "8px",
                          border: "1px solid transparent",
                          background: activeCoordinatorTab === "team" ? "rgba(99, 102, 241, 0.12)" : "transparent",
                          color: activeCoordinatorTab === "team" ? "var(--primary)" : "var(--text-muted)",
                          borderColor: activeCoordinatorTab === "team" ? "rgba(99, 102, 241, 0.25)" : "transparent",
                          fontWeight: "750",
                          fontSize: "12.5px",
                          cursor: "pointer",
                          transition: "var(--transition-smooth)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><FaUsers /></span> Spoke Team Directory
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCoordinatorTab("projects")}
                        style={{
                          padding: "8px 18px",
                          borderRadius: "8px",
                          border: "1px solid transparent",
                          background: activeCoordinatorTab === "projects" ? "rgba(99, 102, 241, 0.12)" : "transparent",
                          color: activeCoordinatorTab === "projects" ? "var(--primary)" : "var(--text-muted)",
                          borderColor: activeCoordinatorTab === "projects" ? "rgba(99, 102, 241, 0.25)" : "transparent",
                          fontWeight: "750",
                          fontSize: "12.5px",
                          cursor: "pointer",
                          transition: "var(--transition-smooth)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><FaBriefcase /></span> B2B Project Allocator
                      </button>
                    </div>

                    {/* TAB 1: ANALYTICS & DELIVERABLES */}
                    {activeCoordinatorTab === "analytics" && (
                      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                        {/* Faculty Stats Cards Row */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "20px"
                        }}>
                          <DashboardCard
                            title="Total Tasks"
                            value={metrics.total}
                            subtitle="Matching active Spoke sprint"
                            glow={true}
                          />
                          <DashboardCard
                            title="Overdue Tasks"
                            value={metrics.overdue}
                            subtitle="Late sprint deadline tasks"
                            themeColor="var(--status-backlog-text)"
                            pulse={metrics.overdue > 0}
                            alert={metrics.overdue > 0}
                          />
                          <DashboardCard
                            title="Need Review"
                            value={allSubmissions.filter(sub => {
                              const userPersona = currentPersona.replace("spoke-", "");
                              const subSpoke = sub.studentName && sub.studentName.toLowerCase();
                              const targetSpoke = userPersona === "kle" ? "kle" : userPersona === "coep" ? "coep" : userPersona === "mmcoep" ? "mmcoep" : "rit";
                              const isMatch = subSpoke && (subSpoke.includes(targetSpoke) || subSpoke.includes("student"));
                              return isMatch && (sub.status === "Awaiting Faculty Review" || sub.status === "Awaiting Coordinator Review");
                            }).length}
                            subtitle="Awaiting faculty/coordinator review"
                            themeColor="var(--status-progress-text)"
                            pulse={allSubmissions.filter(sub => {
                              const userPersona = currentPersona.replace("spoke-", "");
                              const subSpoke = sub.studentName && sub.studentName.toLowerCase();
                              const targetSpoke = userPersona === "kle" ? "kle" : userPersona === "coep" ? "coep" : userPersona === "mmcoep" ? "mmcoep" : "rit";
                              const isMatch = subSpoke && (subSpoke.includes(targetSpoke) || subSpoke.includes("student"));
                              return isMatch && (sub.status === "Awaiting Faculty Review" || sub.status === "Awaiting Coordinator Review");
                            }).length > 0}
                          />
                          <DashboardCard
                            title="Completed Tasks"
                            value={metrics.done}
                            subtitle="Tasks marked Done"
                            themeColor="#a855f7"
                            glow={true}
                          />
                        </div>

                        {/* Student Deliverables Verification Queue */}
                        {(() => {
                          const userPersona = currentPersona.replace("spoke-", "");
                          const targetSpoke = userPersona === "kle" ? "kle" : userPersona === "coep" ? "coep" : userPersona === "mmcoep" ? "mmcoep" : "rit";
                          
                          const spokeSubmissions = allSubmissions.filter(sub => {
                            const subSpoke = sub.studentName && sub.studentName.toLowerCase();
                            const isMatch = subSpoke && subSpoke.includes(targetSpoke);
                            return isMatch || currentPersona === "moderator" || currentPersona === "executive";
                          });

                          return (
                            <div className="glass-panel" style={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--border-glass)",
                              padding: "24px",
                              borderRadius: "16px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "16px"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "14px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <span style={{ fontSize: "20px", display: "inline-flex", alignItems: "center" }}><FaExclamationTriangle style={{ color: "var(--accent)" }} /></span>
                                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "850", color: "var(--text-main)" }}>
                                    Student Tasks Review
                                  </h3>
                                </div>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                  Review and approve tasks submitted by students
                                </span>
                              </div>

                              {spokeSubmissions.length > 0 ? (
                                <div style={{ overflowX: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", color: "var(--text-main)", textAlign: "left" }}>
                                    <thead>
                                      <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-dim)" }}>
                                        <th style={{ padding: "12px 8px", fontWeight: "750" }}>Developer</th>
                                        <th style={{ padding: "12px 8px", fontWeight: "750" }}>Sprint Task</th>
                                        <th style={{ padding: "12px 8px", fontWeight: "750" }}>Artifact Access</th>
                                        <th style={{ padding: "12px 8px", fontWeight: "750" }}>Review Status</th>
                                        <th style={{ padding: "12px 8px", fontWeight: "750", textAlign: "right" }}>Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {spokeSubmissions.map((sub) => {
                                        const badgeBg = sub.status === "Approved" ? "rgba(45, 212, 191, 0.08)" : sub.status === "Re-work Requested" ? "rgba(239, 68, 68, 0.08)" : sub.status === "Awaiting Coordinator Review" ? "rgba(59, 130, 246, 0.08)" : "rgba(251, 146, 60, 0.08)";
                                        const badgeColor = sub.status === "Approved" ? "#2dd4bf" : sub.status === "Re-work Requested" ? "#ef4444" : sub.status === "Awaiting Coordinator Review" ? "#3b82f6" : "var(--accent)";
                                        const badgeBorder = sub.status === "Approved" ? "1px solid rgba(45, 212, 191, 0.2)" : sub.status === "Re-work Requested" ? "1px solid rgba(239, 68, 68, 0.2)" : sub.status === "Awaiting Coordinator Review" ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid rgba(251, 146, 60, 0.2)";
                                        const uRole = sessionUser?.role || currentUser?.role || "";

                                        return (
                                          <tr key={sub._id} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                                            <td style={{ padding: "14px 8px", fontWeight: "600" }}>{sub.studentName}</td>
                                            <td style={{ padding: "14px 8px" }}>
                                              <div style={{ display: "flex", flexDirection: "column" }}>
                                                <strong style={{ color: "var(--primary)", fontFamily: "var(--mono)" }}>{sub.taskId}</strong>
                                                {sub.comments && <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>"{sub.comments}"</span>}
                                              </div>
                                            </td>
                                            <td style={{ padding: "14px 8px" }}>
                                              <a 
                                                href={sub.fileUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                style={{
                                                  color: "var(--secondary)",
                                                  fontWeight: "750",
                                                  textDecoration: "none"
                                                }}
                                              >
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaLink /> {sub.fileName}</span>
                                              </a>
                                            </td>
                                            <td style={{ padding: "14px 8px" }}>
                                              <span style={{
                                                fontSize: "9px",
                                                fontWeight: "900",
                                                background: badgeBg,
                                                color: badgeColor,
                                                border: badgeBorder,
                                                padding: "2px 6px",
                                                borderRadius: "3px",
                                                textTransform: "uppercase"
                                              }}>{sub.status}</span>
                                            </td>
                                            <td style={{ padding: "14px 8px", textAlign: "right" }}>
                                              {/* Faculty Action Buttons */}
                                              {(uRole === "Faculty Member" || uRole === "Project Mentor") && (sub.status === "Awaiting Faculty Review" || sub.status === "Re-work Requested") ? (
                                                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                                  <button 
                                                    onClick={() => handleUpdateSubmissionStatus(sub._id, "Awaiting Coordinator Review", "Faculty approved. Pending Coordinator review.")}
                                                    style={{
                                                      padding: "6px 12px",
                                                      background: "rgba(59, 130, 246, 0.15)",
                                                      border: "1px solid rgba(59, 130, 246, 0.3)",
                                                      borderRadius: "6px",
                                                      color: "#3b82f6",
                                                      fontSize: "11px",
                                                      fontWeight: "800",
                                                      cursor: "pointer"
                                                    }}
                                                  >
                                                    {sub.status === "Re-work Requested" ? "Re-evaluate & Approve" : "Approve for Coordinator"}
                                                  </button>
                                                  <button 
                                                    onClick={() => {
                                                      const feedback = prompt("Please enter evaluation comments / requested changes for the student developer:", "Re-work required: please refine your layout controller.");
                                                      if (feedback !== null) {
                                                        handleUpdateSubmissionStatus(sub._id, "Re-work Requested", feedback || "Please revise task artifacts.");
                                                      }
                                                    }}
                                                    style={{
                                                      padding: "6px 12px",
                                                      background: "rgba(239, 68, 68, 0.15)",
                                                      border: "1px solid rgba(239, 68, 68, 0.3)",
                                                      borderRadius: "6px",
                                                      color: "#ef4444",
                                                      fontSize: "11px",
                                                      fontWeight: "800",
                                                      cursor: "pointer"
                                                    }}
                                                  >
                                                    Flag Re-work
                                                  </button>
                                                </div>
                                              ) : uRole === "Campus Coordinator" && sub.status === "Awaiting Coordinator Review" ? (
                                                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                                  <button 
                                                    onClick={() => handleUpdateSubmissionStatus(sub._id, "Approved", "Meets all FIP B2B criteria. Excellent work!")}
                                                    style={{
                                                      padding: "6px 12px",
                                                      background: "rgba(45, 212, 191, 0.15)",
                                                      border: "1px solid rgba(45, 212, 191, 0.3)",
                                                      borderRadius: "6px",
                                                      color: "#2dd4bf",
                                                      fontSize: "11px",
                                                      fontWeight: "800",
                                                      cursor: "pointer"
                                                    }}
                                                  >
                                                    Final Approve
                                                  </button>
                                                  <button 
                                                    onClick={() => {
                                                      const feedback = prompt("Please enter evaluation comments / requested changes for the student developer:", "Re-work required: please refine your layout controller.");
                                                      if (feedback !== null) {
                                                        handleUpdateSubmissionStatus(sub._id, "Re-work Requested", feedback || "Please revise task artifacts.");
                                                      }
                                                    }}
                                                    style={{
                                                      padding: "6px 12px",
                                                      background: "rgba(239, 68, 68, 0.15)",
                                                      border: "1px solid rgba(239, 68, 68, 0.3)",
                                                      borderRadius: "6px",
                                                      color: "#ef4444",
                                                      fontSize: "11px",
                                                      fontWeight: "800",
                                                      cursor: "pointer"
                                                    }}
                                                  >
                                                    Flag Re-work
                                                  </button>
                                                </div>
                                              ) : sub.status === "Re-work Requested" ? (
                                                <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "flex-end" }}>
                                                  <span style={{
                                                    fontSize: "11px", 
                                                    color: "#ef4444", 
                                                    fontWeight: "750",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                  }}>
                                                    <FaExclamationTriangle size={12} />
                                                    <span>Revision Required</span>
                                                  </span>
                                                  <button 
                                                    onClick={() => handleUpdateSubmissionStatus(sub._id, "Approved", "Re-evaluated and approved! Meets all B2B criteria.")}
                                                    style={{
                                                      padding: "6px 12px",
                                                      background: "rgba(45, 212, 191, 0.15)",
                                                      border: "1px solid rgba(45, 212, 191, 0.3)",
                                                      borderRadius: "6px",
                                                      color: "#2dd4bf",
                                                      fontSize: "11px",
                                                      fontWeight: "800",
                                                      cursor: "pointer",
                                                      transition: "all 0.2s ease"
                                                    }}
                                                  >
                                                    Re-evaluate & Approve
                                                  </button>
                                                </div>
                                              ) : (
                                                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                                                  <span style={{
                                                    fontSize: "11px", 
                                                    color: "#2dd4bf", 
                                                    fontWeight: "600",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                  }}>
                                                    <FaCheck size={11} />
                                                    <span>Verified Shipped</span>
                                                  </span>
                                                  <button
                                                    onClick={() => handleDeleteSubmission(sub._id)}
                                                    style={{
                                                      padding: "4px 6px",
                                                      background: "rgba(239, 68, 68, 0.08)",
                                                      border: "1px solid rgba(239, 68, 68, 0.2)",
                                                      borderRadius: "4px",
                                                      color: "#ef4444",
                                                      cursor: "pointer",
                                                      display: "inline-flex",
                                                      alignItems: "center",
                                                      verticalAlign: "middle",
                                                      transition: "var(--transition-smooth)",
                                                      marginLeft: "8px"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                                                    }}
                                                    title="Delete old submission history"
                                                  >
                                                    <FaTrashAlt size={10} />
                                                  </button>
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div style={{
                                  textAlign: "center",
                                  padding: "40px 20px",
                                  border: "1px dashed var(--border-glass)",
                                  borderRadius: "12px",
                                  color: "var(--text-dim)",
                                  fontSize: "13px"
                                }}>
                                  No deliverables have been submitted by Spoke student developers for review yet.
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Analytical Charts Grid */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                          gap: "24px"
                        }}>
                          {/* Status distribution chart */}
                          <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", height: "350px", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.04)" }}>
                            <h3 style={{ fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "16px" }}>Status Distribution</h3>
                            <div style={{ flex: 1, minHeight: 0 }}>
                              {statusPieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={statusPieData}
                                      cx="50%"
                                      cy="45%"
                                      innerRadius={60}
                                      outerRadius={85}
                                      paddingAngle={4}
                                      dataKey="value"
                                    >
                                      {statusPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} />
                                  </PieChart>
                                </ResponsiveContainer>
                              ) : (
                                <EmptyStateMessage text="No status data available matching filters." />
                              )}
                            </div>
                          </div>

                          {/* Priority chart */}
                          <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", height: "350px", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.04)" }}>
                            <h3 style={{ fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "16px" }}>Priority Breakdown</h3>
                            <div style={{ flex: 1, minHeight: 0 }}>
                              {metrics.total > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={priorityBarData} margin={{ bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                                    <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 0, 0, 0.02)" }} />
                                    <Bar dataKey="count" name="Tasks Count" radius={[6, 6, 0, 0]}>
                                      {priorityBarData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <EmptyStateMessage text="No priority metrics available." />
                              )}
                            </div>
                          </div>

                          {/* Assignee chart */}
                          <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", height: "350px", gridColumn: "span 1", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.04)" }}>
                            <h3 style={{ fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "16px" }}>Team Workload Distribution</h3>
                            <div style={{ flex: 1, minHeight: 0 }}>
                              {assigneeWorkloadData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={assigneeWorkloadData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis type="number" stroke="var(--text-muted)" fontSize={11} allowDecimals={false} tickLine={false} />
                                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={100} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 0, 0, 0.02)" }} />
                                    <Bar dataKey="tasks" name="Active Tasks" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <EmptyStateMessage text="No active work items assigned." />
                              )}
                            </div>
                          </div>

                          {/* Dynamic Campus Spoke Leaderboard */}
                          <div className="glass-panel" style={{
                            padding: "24px",
                            display: "flex",
                            flexDirection: "column",
                            height: "350px",
                            background: "#ffffff",
                            border: "1px solid var(--border-glass)",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                              <h3 style={{ fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.8px", color: "#1e293b", margin: 0 }}>Spoke Leaderboard</h3>
                              <span style={{ fontSize: "10px", color: "#2dd4bf", fontWeight: "800", background: "rgba(45, 212, 191, 0.15)", border: "1px solid rgba(45, 212, 191, 0.3)", padding: "4px 10px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.5px", boxShadow: "0 0 10px rgba(45, 212, 191, 0.2)" }} className="pulse-glow">Live Velocity</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto", flex: 1, paddingRight: "6px" }}>
                              {leaderboardData.map((spoke, idx) => {
                                const isCurrent = spoke.id === currentBoardId || (spoke.name && spoke.name.includes(SPOKES[currentBoardId]?.name));
                                const medal = idx === 0 ? "🥇 1st" : idx === 1 ? "🥈 2nd" : idx === 2 ? "🥉 3rd" : "🎯 Rank";
                                const bgGradient = idx === 0 
                                  ? "linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)" 
                                  : idx === 1 
                                    ? "linear-gradient(90deg, rgba(156, 163, 175, 0.1) 0%, rgba(156, 163, 175, 0.02) 100%)"
                                    : idx === 2
                                      ? "linear-gradient(90deg, rgba(217, 119, 6, 0.1) 0%, rgba(217, 119, 6, 0.02) 100%)"
                                      : "rgba(255,255,255,0.02)";
                                const glowBorder = isCurrent ? "1px solid rgba(99, 102, 241, 0.6)" : "1px solid rgba(255,255,255,0.04)";
                                const pct = spoke.total > 0 ? Math.round((spoke.done / spoke.total) * 100) : 0;
                                
                                return (
                                  <div key={spoke.id || spoke.name} style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                    padding: "14px 16px",
                                    background: isCurrent ? "linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.03) 100%)" : bgGradient,
                                    border: glowBorder,
                                    borderRadius: "12px",
                                    boxShadow: isCurrent ? "0 0 20px rgba(99, 102, 241, 0.2)" : "0 4px 6px rgba(0,0,0,0.1)",
                                    transition: "all 0.3s ease",
                                    position: "relative",
                                    overflow: "hidden"
                                  }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={{ fontSize: "14px", fontWeight: "750", color: idx <= 2 ? "var(--text-main)" : "var(--text-dim)", minWidth: "55px" }}>{medal}</span>
                                        <span style={{ fontSize: "14px", fontWeight: isCurrent ? "800" : "700", color: isCurrent ? "var(--primary)" : "var(--text-main)", letterSpacing: "0.2px" }}>
                                          {spoke.name}
                                        </span>
                                      </div>
                                      <span style={{ fontSize: "13px", fontFamily: "var(--mono)", color: idx === 0 ? "#fcd34d" : "var(--text-muted)", fontWeight: "800" }}>
                                        {spoke.done} <span style={{ color: "var(--text-dim)", fontWeight: "500" }}>/ {spoke.total} Done</span> ({pct}%)
                                      </span>
                                    </div>
                                    <div style={{ height: "8px", background: "rgba(0,0,0,0.3)", borderRadius: "4px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", zIndex: 1 }}>
                                      <div style={{
                                        width: `${pct}%`,
                                        height: "100%",
                                        background: idx === 0 
                                          ? "linear-gradient(90deg, #f59e0b, #fbbf24)" 
                                          : (idx === 1 ? "linear-gradient(90deg, #9ca3af, #d1d5db)" 
                                            : (idx === 2 ? "linear-gradient(90deg, #d97706, #fcd34d)" : "linear-gradient(90deg, var(--primary), #818cf8)")),
                                        borderRadius: "4px",
                                        boxShadow: "0 0 10px rgba(255,255,255,0.2)"
                                      }}></div>
                                    </div>
                                    {isCurrent && (
                                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "var(--primary)", opacity: 0.05, zIndex: 0 }} className="pulse-glow"></div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Recent Task List Component */}
                        <div className="glass-panel" style={{ padding: "24px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Scope Overview ({filteredTasks.length})</h3>
                            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Click any row to manage task details</span>
                          </div>

                          {filteredTasks.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                              {filteredTasks.map(t => {
                                const deadline = getDeadlineInfo(t.fields.dueDate, t.fields.status?.name);
                                return (
                                  <div
                                    key={t.id}
                                    onClick={() => setSelectedTask(t)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "16px 20px",
                                      background: "rgba(255, 255, 255, 0.02)",
                                      border: "1px solid var(--border-glass)",
                                      borderRadius: "12px",
                                      cursor: "pointer",
                                      transition: "var(--transition-smooth)"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                                      e.currentTarget.style.borderColor = "var(--border-glow)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                                      e.currentTarget.style.borderColor = "var(--border-glass)";
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
                                      <span style={{
                                        fontFamily: "var(--mono)",
                                        fontSize: "13px",
                                        color: "var(--primary)",
                                        fontWeight: "600",
                                        background: "rgba(99, 102, 241, 0.1)",
                                        padding: "4px 8px",
                                        borderRadius: "6px"
                                      }}>
                                        {t.key}
                                      </span>
                                      <span style={{
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        color: "var(--text-main)"
                                      }}>
                                        {t.fields.summary}
                                      </span>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                      {/* Deadline Badge */}
                                      {deadline && (
                                        <span className={deadline.type === "overdue" ? "overdue-badge-blink" : ""} style={{
                                          fontSize: "11px",
                                          fontWeight: "700",
                                          padding: "3px 8px",
                                          borderRadius: "4px",
                                          backgroundColor:
                                            deadline.type === "overdue" ? "var(--priority-high-bg)" :
                                            deadline.type === "soon" ? "var(--priority-medium-bg)" : "rgba(255, 255, 255, 0.04)",
                                          color:
                                            deadline.type === "overdue" ? "var(--priority-high-text)" :
                                            deadline.type === "soon" ? "var(--priority-medium-text)" : "var(--text-muted)",
                                          border: "1px solid",
                                          borderColor:
                                            deadline.type === "overdue" ? "var(--priority-high-border)" :
                                            deadline.type === "soon" ? "var(--priority-medium-border)" : "var(--border-glass)",
                                        }}>
                                          {deadline.text}
                                        </span>
                                      )}

                                      {/* Priority Badge */}
                                      <Badge priority={t.fields.priority?.name} />

                                      {/* Status Badge */}
                                      <Badge status={t.fields.status?.name} />

                                      {/* Assignee Avatar */}
                                      {t.fields.assignee ? (
                                        <img
                                          src={t.fields.assignee.avatarUrl}
                                          alt={t.fields.assignee.displayName}
                                          style={{ width: "24px", height: "24px", borderRadius: "50%" }}
                                          title={t.fields.assignee.displayName}
                                        />
                                      ) : (
                                        <div style={{
                                          width: "24px",
                                          height: "24px",
                                          borderRadius: "50%",
                                          border: "1px dashed var(--text-dim)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: "var(--text-dim)",
                                          fontSize: "10px"
                                        }} title="Unassigned">
                                          ?
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <EmptyStateMessage text="No tasks found matching current search queries or filters." showIcon={true} />
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB 2: 👥 SPOKE TEAM DIRECTORY */}
                    {activeCoordinatorTab === "team" && (
                      <div className="fade-in" style={{
                        display: "grid",
                        gridTemplateColumns: "1.1fr 0.9fr",
                        gap: "30px",
                        alignItems: "flex-start"
                      }}>
                        {/* Left Column: Member Directory & Add Member Form */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                          {/* Directory list */}
                          <div className="glass-panel" style={{ padding: "24px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "16px", color: "var(--text-main)" }}>
                              <span><FaUsers style={{ marginRight: "6px" }} /> {SPOKES[currentBoardId]?.name || "Campus Spoke"} Member Pool ({spokeMembers.length})</span>
                            </h3>
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", color: "var(--text-main)", textAlign: "left" }}>
                                <thead>
                                  <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-dim)" }}>
                                    <th style={{ padding: "10px 8px", fontWeight: "750" }}>Member</th>
                                    <th style={{ padding: "10px 8px", fontWeight: "750" }}>Email Address</th>
                                    <th style={{ padding: "10px 8px", fontWeight: "750" }}>Role</th>
                                    <th style={{ padding: "10px 8px", fontWeight: "750", textAlign: "right" }}>Type</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {spokeMembers.map((m) => (
                                    <tr key={m.accountId} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                                      <td style={{ padding: "12px 8px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                          <img src={m.avatarUrl} alt={m.displayName} style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
                                          <strong style={{ color: "var(--text-main)" }}>{m.displayName.replace(/ \((Student Developer|Faculty Mentor|Coordinator)\)/g, "")}</strong>
                                        </div>
                                      </td>
                                      <td style={{ padding: "12px 8px", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>
                                        {m.emailAddress || "N/A"}
                                      </td>
                                      <td style={{ padding: "12px 8px" }}>
                                        <span style={{
                                          fontSize: "10.5px",
                                          fontWeight: "750",
                                          background: m.displayName.includes("Mentor") || m.displayName.includes("Coordinator") ? "rgba(168, 85, 247, 0.08)" : "rgba(99, 102, 241, 0.08)",
                                          color: m.displayName.includes("Mentor") || m.displayName.includes("Coordinator") ? "#a855f7" : "var(--primary)",
                                          padding: "3px 8px",
                                          borderRadius: "6px"
                                        }}>
                                          {m.displayName.includes("Mentor") || m.displayName.includes("Coordinator") ? "Faculty Mentor" : "Student Developer"}
                                        </span>
                                      </td>
                                      <td style={{ padding: "12px 8px", textAlign: "right" }}>
                                        <span style={{
                                          fontSize: "9px",
                                          fontWeight: "850",
                                          background: m.isPersistent ? "rgba(45, 212, 191, 0.08)" : "rgba(255, 255, 255, 0.02)",
                                          border: m.isPersistent ? "1px solid rgba(45, 212, 191, 0.15)" : "1px solid var(--border-glass)",
                                          color: m.isPersistent ? "#2dd4bf" : "var(--text-muted)",
                                          padding: "2px 6px",
                                          borderRadius: "4px",
                                          textTransform: "uppercase"
                                        }}>
                                          {m.isPersistent ? "Persistent" : "Simulated"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Add team member form */}
                          <div className="glass-panel" style={{
                            padding: "24px",
                            background: "var(--bg-card)"
                          }}>
                            <h3 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-main)", marginBottom: "16px", marginTop: 0 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaPlus /> Add Student Team Member</span>
                            </h3>
                            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.4", marginBottom: "18px" }}>
                              Register a new student developer to the campus spoke. They will instantly appear in directories and become assignable on Kanban boards.
                            </p>
                            <form onSubmit={async (e) => {
                              e.preventDefault();
                              if (!newMemberName.trim() || !newMemberEmail.trim()) {
                                triggerToast("Please fill in both the display name and email fields.", "warning");
                                return;
                              }
                              if (!newMemberEmail.includes("@") || !newMemberEmail.includes(".")) {
                                triggerToast("Please enter a valid academic email address.", "warning");
                                return;
                              }

                              setIsAddingMember(true);
                              try {
                                const res = await axios.post("http://localhost:5000/api/register", {
                                  displayName: newMemberName.trim(),
                                  email: newMemberEmail.toLowerCase().trim(),
                                  password: "student123", // standard default credentials
                                  role: "Student Developer",
                                  persona: currentPersona // sets active spoke group, e.g. "spoke-kle"
                                });

                                if (res.data && res.data.success) {
                                  triggerToast(` Successfully added and registered developer ${newMemberName}!`);
                                  setNewMemberName("");
                                  setNewMemberEmail("");
                                  fetchSpokeMembers(currentBoardId);
                                }
                              } catch (err) {
                                console.error(err);
                                triggerToast(err.response?.data?.error || "Failed to register new team member.", "error");
                              } finally {
                                setIsAddingMember(false);
                              }
                            }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                              <div>
                                <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>DEVELOPER DISPLAY NAME</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="e.g. Akash Gupta"
                                  value={newMemberName}
                                  onChange={(e) => setNewMemberName(e.target.value)}
                                  disabled={isAddingMember}
                                  style={{ padding: "10px 14px", fontSize: "13px" }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>CAMPUS EMAIL ADDRESS</label>
                                <input
                                  type="email"
                                  className="form-input"
                                  placeholder="e.g. akash@kle.edu"
                                  value={newMemberEmail}
                                  onChange={(e) => setNewMemberEmail(e.target.value)}
                                  disabled={isAddingMember}
                                  style={{ padding: "10px 14px", fontSize: "13px" }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>ROLE POLICIES & CREDENTIALS</label>
                                <div style={{
                                  padding: "10px 14px",
                                  border: "1px solid var(--border-glass)",
                                  background: "rgba(0,0,0,0.15)",
                                  borderRadius: "8px",
                                  fontSize: "11.5px",
                                  color: "var(--text-muted)"
                                }}>
                                  Role auto-assigned to <strong>Student Developer</strong>.<br/>
                                  Password auto-set to <strong style={{ color: "var(--primary)" }}>student123</strong> for demo connection.
                                </div>
                              </div>
                              <button
                                type="submit"
                                disabled={isAddingMember}
                                className="btn-primary"
                                style={{ padding: "10px 18px", fontSize: "12.5px", marginTop: "4px", width: "100%", justifyContent: "center" }}
                              >
                                {isAddingMember ? "Registering Account..." : "Add to Team Directory"}
                              </button>
                            </form>
                          </div>
                        </div>

                        {/* Right Column: Spoke Teams & Creation Form */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                          {/* Active Teams directory cards */}
                          <div className="glass-panel" style={{ padding: "24px" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "16px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaUsers /> Active Collaborative Teams ({spokeTeams.length})</span>
                            </h3>
                            {isTeamsLoading ? (
                              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-dim)" }}>
                                Loading teams...
                              </div>
                            ) : spokeTeams.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {spokeTeams.map((team) => (
                                  <div key={team._id} className="glass-panel" style={{
                                    padding: "16px",
                                    background: "rgba(255, 255, 255, 0.01)",
                                    border: "1px solid var(--border-glass)",
                                    borderRadius: "12px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                    transition: "var(--transition-smooth)",
                                    position: "relative"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "var(--primary)";
                                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.03)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "var(--border-glass)";
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)";
                                  }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <strong style={{ color: "var(--text-main)", fontSize: "14px" }}>
                                        {team.name}
                                      </strong>
                                      <button
                                        onClick={() => handleDeleteTeam(team._id)}
                                        style={{
                                          background: "rgba(239, 68, 68, 0.08)",
                                          border: "1px solid rgba(239, 68, 68, 0.15)",
                                          borderRadius: "6px",
                                          color: "#ef4444",
                                          padding: "4px 8px",
                                          fontSize: "11px",
                                          fontWeight: "750",
                                          cursor: "pointer",
                                          transition: "var(--transition-smooth)"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = "#ef4444";
                                          e.currentTarget.style.color = "white";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                                          e.currentTarget.style.color = "#ef4444";
                                        }}
                                      >
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>Disband <FaTrashAlt /></span>
                                      </button>
                                    </div>
                                    
                                    {/* Faculty Mentor Display */}
                                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignSelf: "flex-start" }}>
                                      {team.mentor && (
                                        <div style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                          background: "rgba(168, 85, 247, 0.05)",
                                          border: "1px solid rgba(168, 85, 247, 0.15)",
                                          borderRadius: "8px",
                                          padding: "6px 10px"
                                        }}>
                                          <img src={team.mentor.avatarUrl} alt={team.mentor.displayName} style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
                                          <span style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: "600" }}>
                                            <span>Coordinator: <strong style={{ color: "var(--text-main)" }}>{team.mentor.displayName}</strong></span>
                                          </span>
                                        </div>
                                      )}
                                      {team.teamLeader && (
                                        <div style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                          background: "rgba(16, 185, 129, 0.05)",
                                          border: "1px solid rgba(16, 185, 129, 0.15)",
                                          borderRadius: "8px",
                                          padding: "6px 10px"
                                        }}>
                                          <img src={team.teamLeader.avatarUrl} alt={team.teamLeader.displayName} style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
                                          <span style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: "600" }}>
                                            <span>Leader: <strong style={{ color: "var(--text-main)" }}>{team.teamLeader.displayName}</strong></span>
                                          </span>
                                        </div>
                                      )}
                                      {!team.mentor && !team.teamLeader && (
                                        <span style={{ fontSize: "11px", color: "var(--text-dim)", fontStyle: "italic" }}>
                                          No Faculty Mentor assigned
                                        </span>
                                      )}
                                    </div>

                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                                      {team.members.map((m) => (
                                        <div key={m.accountId} style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          background: "rgba(255, 255, 255, 0.03)",
                                          border: "1px solid var(--border-glass)",
                                          borderRadius: "20px",
                                          padding: "4px 10px 4px 6px"
                                        }}>
                                          <img src={m.avatarUrl} alt={m.displayName} style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
                                          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>
                                            {m.displayName}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    <div style={{ fontSize: "10px", color: "var(--text-dim)", alignSelf: "flex-end" }}>
                                      Created {new Date(team.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{
                                padding: "30px",
                                textAlign: "center",
                                color: "var(--text-dim)",
                                fontStyle: "italic",
                                fontSize: "12.5px",
                                border: "1px dashed var(--border-glass)",
                                borderRadius: "8px",
                                background: "rgba(255,255,255,0.002)"
                              }}>
                                No persistent teams have been formed yet. Form a new team below!
                              </div>
                            )}
                          </div>

                          {/* Create/Update Spoke Team Form */}
                          <div className="glass-panel" style={{
                            padding: "24px",
                            background: "var(--bg-card)"
                          }}>
                            {currentUser?.role === "Campus Coordinator" && (
                              <>
                                <h3 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-main)", marginBottom: "12px", marginTop: 0 }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaPlus /> Assign Faculty to Project</span>
                                </h3>
                                <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4", marginBottom: "16px" }}>
                                  Create a team and assign a Faculty Mentor and a Project. The faculty will form the student team.
                                </p>
                                <form onSubmit={handleCreateTeam} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                  <div>
                                    <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>TEAM NAME</label>
                                    <input
                                      type="text"
                                      className="form-input"
                                      placeholder="e.g. Agritech AI Drone Team"
                                      value={newTeamName}
                                      onChange={(e) => setNewTeamName(e.target.value)}
                                      disabled={isCreatingTeam}
                                      style={{ padding: "10px 14px", fontSize: "13px" }}
                                    />
                                  </div>
                                  
                                  <div>
                                    <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>FACULTY MENTOR</label>
                                    <select
                                      className="form-input"
                                      value={selectedTeamMentor}
                                      onChange={(e) => setSelectedTeamMentor(e.target.value)}
                                      disabled={isCreatingTeam}
                                      style={{ padding: "10px 14px", fontSize: "13px", width: "100%", background: "#1f2937", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "white" }}
                                    >
                                      <option value="">-- Choose Faculty Mentor --</option>
                                      {campusFaculty.map(f => (
                                        <option key={f.email} value={f.email}>{f.displayName} ({f.email})</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>PROJECT ALLOCATION</label>
                                    <select
                                      className="form-input"
                                      value={newTeamProjectId}
                                      onChange={(e) => setNewTeamProjectId(e.target.value)}
                                      disabled={isCreatingTeam}
                                      style={{ padding: "10px 14px", fontSize: "13px", width: "100%", background: "#1f2937", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "white", marginBottom: "14px" }}
                                    >
                                      <option value="">-- No Project (General Team) --</option>
                                      {acceptedProjectsForSpoke.map(proj => (
                                        <option key={proj.id} value={proj.id}>[{proj.company}] {proj.title}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <button
                                    type="submit"
                                    disabled={isCreatingTeam}
                                    className="btn-primary"
                                    style={{ padding: "10px 18px", fontSize: "12.5px", marginTop: "4px", width: "100%", justifyContent: "center" }}
                                  >
                                    {isCreatingTeam ? "Assigning Faculty..." : "Assign Faculty to Project"}
                                  </button>
                                </form>
                              </>
                            )}

                            {(currentUser?.role === "Faculty Member" || currentUser?.role === "Project Mentor" || sessionUser?.role === "Faculty Member") && (
                               <>
                                 <h3 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-main)", marginBottom: "4px", marginTop: 0 }}>
                                   <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaPlus /> Create Spoke Team</span>
                                 </h3>
                                 <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4", marginBottom: "16px" }}>
                                   You are automatically assigned as Faculty Mentor. Select students and optionally a Sub Faculty.
                                 </p>
                                 <form onSubmit={handleCreateTeam} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                   <div>
                                     <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>TEAM NAME</label>
                                     <input
                                       type="text"
                                       className="form-input"
                                       placeholder="e.g. Agritech AI Drone Team"
                                       value={newTeamName}
                                       onChange={(e) => setNewTeamName(e.target.value)}
                                       disabled={isCreatingTeam}
                                       style={{ padding: "10px 14px", fontSize: "13px" }}
                                     />
                                   </div>

                                   <div>
                                     <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>PROJECT ALLOCATION</label>
                                     <select
                                       className="form-input"
                                       value={newTeamProjectId}
                                       onChange={(e) => setNewTeamProjectId(e.target.value)}
                                       disabled={isCreatingTeam}
                                       style={{ padding: "10px 14px", fontSize: "13px", width: "100%", background: "#1f2937", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "white" }}
                                     >
                                       <option value="">-- No Project (General Team) --</option>
                                       {acceptedProjectsForSpoke.map(proj => (
                                         <option key={proj.id} value={proj.id}>[{proj.company}] {proj.title}</option>
                                       ))}
                                     </select>
                                   </div>

                                   <div>
                                     <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>SELECT STUDENT MEMBERS</label>
                                     <div style={{ maxHeight: "180px", overflowY: "auto", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "10px 14px", background: "rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "8px" }}>
                                       {(() => {
                                         const students = spokeMembers.filter(m =>
                                           (m.displayName.toLowerCase().includes("student") || m.role === "Student Developer") &&
                                           !m.displayName.includes("Mentor") && !m.displayName.includes("Coordinator") && !m.displayName.includes("Faculty")
                                         );
                                         return students.length > 0 ? students.map((m) => {
                                           const isChecked = selectedTeamMembers.includes(m.accountId);
                                           return (
                                             <label key={m.accountId} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "4px 0", userSelect: "none" }}>
                                               <input type="checkbox" checked={isChecked} disabled={isCreatingTeam}
                                                 onChange={(e) => {
                                                   if (e.target.checked) setSelectedTeamMembers([...selectedTeamMembers, m.accountId]);
                                                   else setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== m.accountId));
                                                 }}
                                                 style={{ cursor: "pointer" }}
                                               />
                                               <img src={m.avatarUrl} alt={m.displayName} style={{ width: "22px", height: "22px", borderRadius: "50%" }} />
                                               <span style={{ fontSize: "12.5px", color: isChecked ? "var(--text-main)" : "var(--text-muted)" }}>
                                                 {m.displayName.replace(/ \((Student Developer)\)/g, "")}
                                               </span>
                                             </label>
                                           );
                                         }) : (
                                           <div style={{ fontSize: "12px", color: "var(--text-dim)", fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>No students registered yet.</div>
                                         );
                                       })()}
                                     </div>
                                   </div>

                                   {/* Sub Faculty — exclude the logged-in faculty user */}
                                   <div>
                                     <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>SUB FACULTY (OPTIONAL)</label>
                                     <select
                                       className="form-input"
                                       value={selectedSubFaculty}
                                       onChange={(e) => setSelectedSubFaculty(e.target.value)}
                                       disabled={isCreatingTeam}
                                       style={{ padding: "10px 14px", fontSize: "13px", width: "100%", background: "#1f2937", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "white" }}
                                     >
                                       <option value="">-- No Sub Faculty --</option>
                                       {campusFaculty
                                         .filter(f => f.email !== (sessionUser?.email))
                                         .map(f => (
                                           <option key={f.email} value={f.email}>{f.displayName} ({f.email})</option>
                                         ))}
                                     </select>
                                   </div>

                                   <button type="submit" disabled={isCreatingTeam} className="btn-primary"
                                     style={{ padding: "10px 18px", fontSize: "12.5px", marginTop: "4px", width: "100%", justifyContent: "center" }}
                                   >
                                     {isCreatingTeam ? "Creating Spoke Team..." : "Create Spoke Team"}
                                   </button>
                                 </form>
                               </>
                             )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: 💼 B2B PROJECT & SPRINT ALLOCATOR */}
                    {activeCoordinatorTab === "projects" && (
                      <div className="fade-in" style={{
                        display: "grid",
                        gridTemplateColumns: "1.8fr 1.4fr",
                        gap: "30px",
                        alignItems: "flex-start"
                      }}>
                        {/* B2B projects overview list */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                          <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", margin: "0 0 10px 0" }}>
                            Active B2B Corporate Projects Allocated to {SPOKES[currentBoardId]?.name || "Our Campus"}
                          </h3>

                          {acceptedProjectsForSpoke.length > 0 ? (
                            acceptedProjectsForSpoke.map((proj) => {
                              // Calculate milestones progress
                              const expectedSummary = `[${proj.company}] ${proj.title}`;
                              const epicKey = proj.allocations ? proj.allocations.find(a => a.targetCampusId === currentBoardId)?.assignedKey : proj.assignedKey;
                              const projTasks = tasks.filter(t => {
                                const parentKey = t.fields?.parent?.key || t.parent?.key;
                                const parentSummary = t.fields?.parent?.fields?.summary || t.fields?.parent?.summary || t.parent?.fields?.summary || t.parent?.summary;
                                return (epicKey && parentKey === epicKey) || (parentSummary && parentSummary === expectedSummary);
                              });
                              
                              const totalT = projTasks.length;
                              const doneT = projTasks.filter(t => (t.fields?.status?.name || t.fields?.status || "") === "Done").length;
                              const progressPct = totalT > 0 ? Math.round((doneT / totalT) * 100) : 0;

                              return (
                                <div key={proj.id} className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                      <CompanyLogo company={proj.company} size={36} />
                                      <div>
                                        <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: "800", color: "var(--text-main)" }}>{proj.title}</h4>
                                        <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Sponsor: <strong>{proj.company}</strong> • Epic: <strong style={{ color: "var(--primary)", fontFamily: "var(--mono)" }}>{epicKey || "PNLP-3"}</strong></span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setSelectedEpicForTask(proj.id);
                                        setNewSprintTaskDueDate(proj.proposedDueDate);
                                        triggerToast(`Linked B2B Project: ${proj.company} ${proj.title}`);
                                      }}
                                      className="btn-secondary"
                                      style={{ padding: "6px 12px", fontSize: "11px", borderColor: "rgba(99, 102, 241, 0.25)", color: "var(--primary)", display: "flex", alignItems: "center", gap: "6px" }}
                                    >
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaLink /> Link Form</span>
                                    </button>
                                  </div>
                                  <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.4" }}>{proj.description}</p>
                                  <div style={{
                                    background: "rgba(255, 255, 255, 0.005)",
                                    border: "1px solid var(--border-glass)",
                                    borderRadius: "8px",
                                    padding: "10px 14px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "6px",
                                    fontSize: "12px"
                                  }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <span style={{ color: "var(--text-muted)" }}>Agile Sprint Milestone Completion</span>
                                      <strong style={{ color: "var(--primary)", fontFamily: "var(--mono)" }}>{progressPct}% ({doneT}/{totalT} Phases)</strong>
                                    </div>
                                    <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-glass)" }}>
                                      <div style={{ width: `${progressPct}%`, height: "100%", background: "var(--primary)", borderRadius: "3px" }}></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="glass-panel" style={{ padding: "30px", textAlign: "center", color: "var(--text-dim)", fontStyle: "italic", fontSize: "13px" }}>
                              No active corporate projects have been allocated to your campus spoke yet.
                            </div>
                          )}
                        </div>

                        {/* Sprint task assignment form */}
                        <div className="glass-panel" style={{
                          padding: "24px",
                          background: "var(--bg-card)"
                        }}>
                          <h3 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-main)", marginBottom: "16px", marginTop: 0 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaPlus /> Assign Sprint Task under B2B Project</span>
                          </h3>
                          <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.4", marginBottom: "18px" }}>
                            Create a detailed sprint child task under an allocated B2B program, set its target milestones, and assign it directly to a Student Developer.
                          </p>
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!selectedEpicForTask) {
                              triggerToast("Please select the target B2B Project to link this sprint task under.", "warning");
                              return;
                            }
                            if (!newSprintTaskTitle.trim()) {
                              triggerToast("Please enter a sprint task title.", "warning");
                              return;
                            }
                            if (!newSprintTaskAssignee) {
                              triggerToast("Please select a student developer to assign this task to.", "warning");
                              return;
                            }

                            const linkedEpicObj = acceptedProjectsForSpoke.find(p => p.id === selectedEpicForTask);
                            if (!linkedEpicObj) {
                              triggerToast("Selected B2B Project is invalid or inactive.", "warning");
                              return;
                            }

                            const epicKey = linkedEpicObj.allocations ? linkedEpicObj.allocations.find(a => a.targetCampusId === currentBoardId)?.assignedKey : linkedEpicObj.assignedKey;
                            const epicSummary = `[${linkedEpicObj.company}] ${linkedEpicObj.title}`;

                            setIsCreatingSprintTask(true);
                            try {
                              const res = await axios.post("http://localhost:5000/tasks", {
                                summary: newSprintTaskTitle.trim(),
                                description: newSprintTaskDesc.trim(),
                                statusName: "To Do",
                                priorityName: newSprintTaskPriority,
                                assigneeId: newSprintTaskAssignee,
                                reporterId: currentUser?.accountId || "mock-1",
                                dueDate: newSprintTaskDueDate || linkedEpicObj.proposedDueDate,
                                issueTypeName: "Task",
                                boardId: currentBoardId,
                                parentId: `mock-${currentBoardId}-epic-preload-${epicKey || "PNLP-3"}`,
                                parentKey: epicKey || "PNLP-3",
                                parentSummary: epicSummary
                              });

                              if (res.data && res.data.success) {
                                triggerToast(` Sprint task "${newSprintTaskTitle}" successfully provisioned and assigned!`);
                                setNewSprintTaskTitle("");
                                setNewSprintTaskDesc("");
                                fetchJiraTasks(true);
                                fetchHubMetrics(true); // Update portfolio stats
                              }
                            } catch (err) {
                              console.error(err);
                              triggerToast("Failed to create and assign sprint task.", "error");
                            } finally {
                              setIsCreatingSprintTask(false);
                            }
                          }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                              <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>TARGET CORPORATE PROJECT (EPIC)</label>
                              <select
                                className="form-input"
                                value={selectedEpicForTask}
                                onChange={(e) => {
                                  setSelectedEpicForTask(e.target.value);
                                  const linked = acceptedProjectsForSpoke.find(p => p.id === e.target.value);
                                  if (linked) {
                                    setNewSprintTaskDueDate(linked.proposedDueDate);
                                  }
                                }}
                                disabled={isCreatingSprintTask}
                                style={{ padding: "10px 14px", fontSize: "13px", width: "100%", background: "#1f2937", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "white" }}
                              >
                                <option value="">-- Choose Corporate Project --</option>
                                {acceptedProjectsForSpoke.map(p => (
                                  <option key={p.id} value={p.id}>[{p.company}] {p.title}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>SPRINT TASK SUMMARY</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. Integrate camera feeds into deep learning classifier"
                                value={newSprintTaskTitle}
                                onChange={(e) => setNewSprintTaskTitle(e.target.value)}
                                disabled={isCreatingSprintTask}
                                style={{ padding: "10px 14px", fontSize: "13px" }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>ASSIGNEE DEVELOPER</label>
                              <select
                                className="form-input"
                                value={newSprintTaskAssignee}
                                onChange={(e) => setNewSprintTaskAssignee(e.target.value)}
                                disabled={isCreatingSprintTask}
                                style={{ padding: "10px 14px", fontSize: "13px", width: "100%", background: "#1f2937", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "white" }}
                              >
                                <option value="">-- Choose Team or Developer --</option>
                                {spokeTeams.length > 0 && (
                                  <optgroup label="Collaborative Spoke Teams" style={{ background: "#111827", color: "var(--primary)", fontWeight: "bold" }}>
                                    {spokeTeams.map(team => (
                                      <option key={team._id} value={team._id} style={{ color: "white" }}>
                                        <span><FaUsers style={{ marginRight: "6px" }} /> {team.name} ({team.members.length} ({team.members.length} Members)</span>
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                <optgroup label="Individual Student Developers" style={{ background: "#111827", color: "#a855f7", fontWeight: "bold" }}>
                                  {spokeMembers.filter(m => !m.displayName.includes("Mentor") && !m.displayName.includes("Coordinator")).map(m => (
                                    <option key={m.accountId} value={m.accountId} style={{ color: "white" }}>
                                      <span><FaUser style={{ marginRight: "6px", color: "var(--primary)" }} /> {m.displayName.replace(/ \((Student Developer)\)/g, "")}</span>
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                              <div>
                                <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>PRIORITY</label>
                                <select
                                  className="form-input"
                                  value={newSprintTaskPriority}
                                  onChange={(e) => setNewSprintTaskPriority(e.target.value)}
                                  disabled={isCreatingSprintTask}
                                  style={{ padding: "10px 14px", fontSize: "13px", width: "100%", background: "#1f2937", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "white" }}
                                >
                                  <option value="High">High</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Low">Low</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>MILESTONE DUE DATE</label>
                                <input
                                  type="date"
                                  className="form-input"
                                  value={newSprintTaskDueDate}
                                  onChange={(e) => setNewSprintTaskDueDate(e.target.value)}
                                  disabled={isCreatingSprintTask}
                                  style={{ padding: "8px 12px", fontSize: "12.5px" }}
                                />
                              </div>
                            </div>
                            <div>
                              <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>DETAILED SPRINT SCOPE</label>
                              <textarea
                                className="form-input"
                                placeholder="Describe specific deliverables, APIs, and expectations for this milestone phase..."
                                value={newSprintTaskDesc}
                                onChange={(e) => setNewSprintTaskDesc(e.target.value)}
                                disabled={isCreatingSprintTask}
                                style={{ padding: "10px 14px", fontSize: "13px", height: "65px", resize: "none" }}
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={isCreatingSprintTask}
                              className="btn-primary"
                              style={{ padding: "10px 18px", fontSize: "12.5px", marginTop: "4px", width: "100%", justifyContent: "center" }}
                            >
                              {isCreatingSprintTask ? "Allocating sprint task..." : "Assign Sprint Task & Notify"}
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </>
                )}

              </div>
            )}

            {/* 2. DRAGGABLE KANBAN BOARD VIEW */}
            {activeView === "kanban" && (
              <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                
                {/* DragDrop Board Container */}
                <DragDropContext onDragEnd={onDragEnd}>
                  <div style={{ display: "flex", gap: "20px", flex: 1, minHeight: "600px", alignItems: "stretch", overflowX: "auto" }}>
                    
                    {/* Column 1: Backlog */}
                    <Droppable droppableId="col-backlog">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={getColumnStyle(snapshot.isDraggingOver)}
                        >
                          <ColumnHeader
                            title="Backlog"
                            count={filteredTasks.filter(t => t.fields.status.name === "Backlog").length}
                            color="var(--status-backlog-text)"
                            bgColor="var(--status-backlog-bg)"
                          />
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1 }}>
                            {filteredTasks
                              .filter(t => t.fields.status.name === "Backlog")
                              .map((task, idx) => (
                                <DraggableCard key={task.id} task={task} index={idx} onClick={() => setSelectedTask(task)} />
                              ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>

                    {/* Column 2: In Progress */}
                    <Droppable droppableId="col-progress">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={getColumnStyle(snapshot.isDraggingOver)}
                        >
                          <ColumnHeader
                            title="In Progress"
                            count={filteredTasks.filter(t => t.fields.status.name === "In Progress").length}
                            color="var(--status-progress-text)"
                            bgColor="var(--status-progress-bg)"
                            pulse={true}
                          />
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1 }}>
                            {filteredTasks
                              .filter(t => t.fields.status.name === "In Progress")
                              .map((task, idx) => (
                                <DraggableCard key={task.id} task={task} index={idx} onClick={() => setSelectedTask(task)} />
                              ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>

                    {/* Column 3: Done */}
                    <Droppable droppableId="col-done">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={getColumnStyle(snapshot.isDraggingOver)}
                        >
                          <ColumnHeader
                            title="Done"
                            count={filteredTasks.filter(t => t.fields.status.name === "Done").length}
                            color="var(--status-done-text)"
                            bgColor="var(--status-done-bg)"
                          />
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1 }}>
                            {filteredTasks
                              .filter(t => t.fields.status.name === "Done")
                              .map((task, idx) => (
                                <DraggableCard key={task.id} task={task} index={idx} onClick={() => setSelectedTask(task)} />
                              ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>

                  </div>
                </DragDropContext>
              </div>
            )}
          </>
        )}
      </main>

      {/* TOAST SYSTEM CONTAINER */}


      {/* 🚀 MODAL 1: NEW TASK CREATION */}
      {isCreateOpen && (
        <div style={modalBackdropStyle}>
          <div className="glass-panel" style={{
            width: "550px",
            padding: "30px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
            animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)" }}>Create New Sprint Issue</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={modalLabelStyle}>Task Summary / Title *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g., Implement dark mode toggles and cookie storage"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                />
              </div>

              <div>
                <label style={modalLabelStyle}>Description</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: "80px", resize: "vertical", fontFamily: "inherit" }}
                  placeholder="Write clear steps or requirements..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div>
                <label style={modalLabelStyle}>Issue Type *</label>
                <select
                  required
                  className="form-select"
                  value={newIssueType}
                  onChange={(e) => setNewIssueType(e.target.value)}
                >
                  <option value="Task">Task</option>
                  <option value="Story">Story</option>
                  <option value="Bug">Bug</option>
                  <option value="Epic">Epic</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                <div>
                  <label style={modalLabelStyle}>Assignee</label>
                  <select
                    className="form-select"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {spokeMembers.map(m => (
                      <option key={m.accountId} value={m.displayName}>{m.displayName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={modalLabelStyle}>Reporter</label>
                  <select
                    className="form-select"
                    value={newReporter}
                    onChange={(e) => setNewReporter(e.target.value)}
                  >
                    <option value="">Unreported</option>
                    {spokeMembers.map(m => (
                      <option key={m.accountId} value={m.displayName}>{m.displayName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={modalLabelStyle}>Priority</label>
                  <select
                    className="form-select"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={modalLabelStyle}>Column Status</label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label style={modalLabelStyle}>Due Date Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📝 MODAL 2: TASK DETAIL AND EDITOR */}
      {selectedTask && (
        <div style={modalBackdropStyle}>
          <div className="glass-panel" style={{
            width: "600px",
            padding: "32px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
            animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{
                  fontFamily: "var(--mono)",
                  color: "var(--primary)",
                  fontSize: "14px",
                  fontWeight: "700",
                  background: "rgba(45, 212, 191, 0.08)",
                  padding: "6px 12px",
                  borderRadius: "6px"
                }}>
                  {selectedTask.key}
                </span>
                {(() => {
                  const sponsor = getSponsorCompany(selectedTask);
                  return sponsor ? (
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      title={`Project sponsored by ${sponsor.name}`}
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "6px",
                        objectFit: "contain",
                        background: "white",
                        padding: "2px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
                      }}
                    />
                  ) : null;
                })()}
                {selectedTask.fields.issueType && (
                  <span style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    backgroundColor:
                      selectedTask.fields.issueType === "Epic" ? "rgba(168, 85, 247, 0.12)" :
                      selectedTask.fields.issueType === "Bug" ? "rgba(239, 68, 68, 0.12)" :
                      selectedTask.fields.issueType === "Story" ? "rgba(16, 185, 129, 0.12)" : "rgba(59, 130, 246, 0.12)",
                    color:
                      selectedTask.fields.issueType === "Epic" ? "#c084fc" :
                      selectedTask.fields.issueType === "Bug" ? "#f87171" :
                      selectedTask.fields.issueType === "Story" ? "#34d399" : "#60a5fa",
                    border: "1px solid",
                    borderColor:
                      selectedTask.fields.issueType === "Epic" ? "rgba(168, 85, 247, 0.25)" :
                      selectedTask.fields.issueType === "Bug" ? "rgba(239, 68, 68, 0.25)" :
                      selectedTask.fields.issueType === "Story" ? "rgba(16, 185, 129, 0.25)" : "rgba(59, 130, 246, 0.25)"
                  }}>
                    {selectedTask.fields.issueType === "Epic" ? "Epic" :
                     selectedTask.fields.issueType === "Bug" ? "Bug" :
                     selectedTask.fields.issueType === "Story" ? "Story" : "Task"}
                  </span>
                )}
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {currentPersona !== "moderator" && (
                  <button
                    onClick={() => handleDeleteTask(selectedTask.id, selectedTask.key)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(239, 68, 68, 0.8)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: "600"
                    }}
                    title="Delete ticket permanently"
                  >
                    <FaTrashAlt size={14} />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setModalTab("overview");
                  }}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            {/* Tab Navigation header */}
            <div style={{ display: "flex", gap: "6px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "18px" }}>
              {["overview", "subtasks", "worklog", "links", "deliverables"].map(tabName => (
                <button
                  key={tabName}
                  type="button"
                  onClick={() => {
                    setModalTab(tabName);
                    if (tabName === "worklog") {
                      fetchWorklogHistory(selectedTask.key);
                    } else if (tabName === "deliverables") {
                      fetchSubmissions(selectedTask.id);
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid transparent",
                    background: modalTab === tabName ? "rgba(45, 212, 191, 0.08)" : "transparent",
                    color: modalTab === tabName ? "var(--primary)" : "var(--text-muted)",
                    borderColor: modalTab === tabName ? "rgba(45, 212, 191, 0.15)" : "transparent",
                    fontWeight: "700",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.2px",
                    cursor: "pointer",
                    transition: "var(--transition-smooth)"
                  }}
                >
                  {tabName === "overview" && "General"}
                  {tabName === "subtasks" && (selectedTask.fields.issueType === "Epic" ? `Epic Tasks (${currentTaskChildren.length})` : `Subtasks (${currentTaskChildren.length})`)}
                  {tabName === "worklog" && "Worklogs"}
                  {tabName === "links" && "Links & Tags"}
                  {tabName === "deliverables" && "Deliverables"}
                </button>
              ))}
            </div>

            {/* Scrollable Tab Panel Container */}
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px", paddingBottom: "10px" }}>
              
              {/* TAB 1: OVERVIEW PANEL */}
              {modalTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  
                  {/* Blocker Flag impediment toggle Switch */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: selectedTask.fields.flagged ? "rgba(251, 146, 60, 0.08)" : "rgba(255,255,255,0.01)",
                    border: "1px solid",
                    borderColor: selectedTask.fields.flagged ? "var(--accent)" : "var(--border-glass)",
                    borderRadius: "10px",
                    transition: "var(--transition-smooth)"
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: "700", color: selectedTask.fields.flagged ? "var(--accent)" : "var(--text-main)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent)" }}><FaExclamationTriangle /> Blocker Flag Impediment</span>
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {selectedTask.fields.flagged ? "Blocked status flash active on board." : "Flag issue as blocked by a dependency."}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isCentralAdmin}
                      onClick={() => handleToggleBlockerFlag(selectedTask)}
                      className="btn-secondary"
                      style={{
                        borderColor: selectedTask.fields.flagged ? "var(--accent)" : "var(--border-glass)",
                        color: selectedTask.fields.flagged ? "var(--accent)" : "var(--text-main)",
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: "700",
                        opacity: isCentralAdmin ? 0.6 : 1,
                        cursor: isCentralAdmin ? "not-allowed" : "pointer"
                      }}
                    >
                      {selectedTask.fields.flagged ? "Blocked" : "Flag Blocker"}
                    </button>
                  </div>

                  {/* Editable Title/Summary */}
                  <div>
                    <label style={modalLabelStyle}>Task Summary</label>
                    <input
                      type="text"
                      readOnly={isCentralAdmin}
                      className="form-input"
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        background: "rgba(0,0,0,0.15)",
                        border: "1.5px solid var(--border-glass)",
                        color: "var(--text-main)",
                        cursor: isCentralAdmin ? "default" : "text"
                      }}
                      onBlur={(e) => {
                        if (isCentralAdmin) return;
                        if (e.target.value.trim() && e.target.value !== selectedTask.fields.summary) {
                          handleUpdateTaskDetail({
                            ...selectedTask,
                            fields: {
                              ...selectedTask.fields,
                              summary: e.target.value
                            }
                          }, "summary");
                        }
                      }}
                      defaultValue={selectedTask.fields.summary}
                    />
                  </div>

                  {/* Description Area */}
                  <div>
                    <label style={modalLabelStyle}>Detailed Description</label>
                    <textarea
                      readOnly={isCentralAdmin}
                      className="form-input"
                      style={{
                        minHeight: "100px",
                        fontSize: "13.5px",
                        lineHeight: "1.6",
                        background: "rgba(0,0,0,0.15)",
                        resize: isCentralAdmin ? "none" : "vertical",
                        cursor: isCentralAdmin ? "default" : "text"
                      }}
                      defaultValue={selectedTask.fields.description || ""}
                      onBlur={(e) => {
                        if (isCentralAdmin) return;
                        if (e.target.value !== selectedTask.fields.description) {
                          handleUpdateTaskDetail({
                            ...selectedTask,
                            fields: {
                              ...selectedTask.fields,
                              description: e.target.value
                            }
                          }, "description");
                        }
                      }}
                    />
                  </div>

                  {/* Fields Selection panel */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "12px",
                    padding: "14px",
                    background: "rgba(255, 255, 255, 0.01)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "12px"
                  }}>
                    {/* Status */}
                    <div>
                      <label style={modalLabelStyle}>Status</label>
                      <select
                        className="form-select"
                        disabled={isCentralAdmin}
                        value={selectedTask.fields.status?.name}
                        onChange={(e) => {
                          handleUpdateTaskDetail({
                            ...selectedTask,
                            fields: {
                              ...selectedTask.fields,
                              status: { name: e.target.value }
                            }
                          }, "status");
                        }}
                        style={{ height: "36px", padding: "6px 12px", fontSize: "13px", cursor: isCentralAdmin ? "not-allowed" : "pointer" }}
                      >
                        <option value="Backlog">Backlog</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label style={modalLabelStyle}>Priority</label>
                      <select
                        className="form-select"
                        disabled={isCentralAdmin}
                        value={selectedTask.fields.priority?.name}
                        onChange={(e) => {
                          handleUpdateTaskDetail({
                            ...selectedTask,
                            fields: {
                              ...selectedTask.fields,
                              priority: { name: e.target.value }
                            }
                          }, "priority");
                        }}
                        style={{ height: "36px", padding: "6px 12px", fontSize: "13px", cursor: isCentralAdmin ? "not-allowed" : "pointer" }}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    {/* Assignee */}
                    <div>
                      <label style={modalLabelStyle}>Assignee</label>
                      <select
                        className="form-select"
                        disabled={isCentralAdmin}
                        value={selectedTask.fields.assignee?.displayName || ""}
                        onChange={(e) => {
                          const foundUser = spokeMembers.find(m => m.displayName === e.target.value);
                          handleUpdateTaskDetail({
                            ...selectedTask,
                            fields: {
                              ...selectedTask.fields,
                              assignee: foundUser ? {
                                accountId: foundUser.accountId,
                                displayName: foundUser.displayName,
                                avatarUrl: foundUser.avatarUrl
                              } : null
                            }
                          }, "assignee");
                        }}
                        style={{ height: "36px", padding: "6px 12px", fontSize: "13px", cursor: isCentralAdmin ? "not-allowed" : "pointer" }}
                      >
                        <option value="">Unassigned</option>
                        {spokeMembers.map(m => (
                          <option key={m.accountId} value={m.displayName}>{m.displayName}</option>
                        ))}
                      </select>
                    </div>

                    {/* Reporter */}
                    <div>
                      <label style={modalLabelStyle}>Reporter</label>
                      <select
                        className="form-select"
                        disabled={isCentralAdmin}
                        value={selectedTask.fields.reporter?.displayName || ""}
                        onChange={(e) => {
                          const foundUser = activeAssignees.find(m => m.name === e.target.value);
                          handleUpdateTaskDetail({
                            ...selectedTask,
                            fields: {
                              ...selectedTask.fields,
                              reporter: foundUser ? {
                                accountId: foundUser.accountId,
                                displayName: foundUser.name,
                                avatarUrl: foundUser.avatar
                              } : null
                            }
                          }, "reporter");
                        }}
                        style={{ height: "36px", padding: "6px 12px", fontSize: "13px", cursor: isCentralAdmin ? "not-allowed" : "pointer" }}
                      >
                        <option value="">Unreported</option>
                        {activeAssignees.map(m => (
                          <option key={m.accountId} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 📅 Due Date & Email reminder alerts */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    padding: "16px",
                    background: "rgba(45, 212, 191, 0.03)",
                    border: "1px solid rgba(45, 212, 191, 0.15)",
                    borderRadius: "12px",
                    gap: "16px",
                    alignItems: "center"
                  }}>
                    <div>
                      <label style={modalLabelStyle}><FaCalendarAlt style={{ marginRight: '6px' }} /> Target Due Date</label>
                      <input
                        type="date"
                        disabled={isCentralAdmin}
                        className="form-input"
                        style={{ height: "36px", padding: "6px 12px", fontSize: "13px", cursor: isCentralAdmin ? "not-allowed" : "pointer" }}
                        value={selectedTask.fields.dueDate || ""}
                        onChange={(e) => {
                          handleUpdateTaskDetail({
                            ...selectedTask,
                            fields: {
                              ...selectedTask.fields,
                              dueDate: e.target.value
                            }
                          }, "dueDate");
                        }}
                      />
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="btn-primary pulse-glow"
                        disabled={!selectedTask.fields.assignee || isCentralAdmin}
                        style={{
                          height: "36px",
                          background: "#ef4444",
                          boxShadow: "0 4px 15px rgba(239, 68, 68, 0.2)",
                          opacity: (selectedTask.fields.assignee && !isCentralAdmin) ? 1 : 0.5,
                          cursor: (selectedTask.fields.assignee && !isCentralAdmin) ? "pointer" : "not-allowed",
                          color: "white",
                          fontWeight: "750"
                        }}
                        onClick={() => handleOpenEmailComposer(selectedTask)}
                        title={isCentralAdmin ? "Central Administrators cannot send email alerts from spoke boards" : selectedTask.fields.assignee ? "Send alert email to assignee" : "Assign task to a team member to trigger alerts"}
                      >
                        <FaEnvelope size={12} />
                        <span>Send Email Alert</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SUBTASKS CHECKLIST PANEL */}
              {modalTab === "subtasks" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h3 style={{ fontSize: "13.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
                    {selectedTask.fields.issueType === "Epic" ? "Epic Child Tasks" : "Child Checklist Items"}
                  </h3>

                  {/* Add subtask inline form */}
                  {currentPersona !== "moderator" && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateSubtask(selectedTask.key, subtaskInputSummary, subtaskAssigneeId, selectedTask.fields.issueType);
                    }} style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={selectedTask.fields.issueType === "Epic" ? "Add child task summary... (e.g. Implement API route)" : "Add subtask summary... (e.g. Write unit tests)"}
                        value={subtaskInputSummary}
                        onChange={(e) => setSubtaskInputSummary(e.target.value)}
                        style={{ flex: "2 1 200px", padding: "10px 14px", fontSize: "13px" }}
                      />
                      
                      <select
                        className="form-select"
                        value={subtaskAssigneeId}
                        onChange={(e) => setSubtaskAssigneeId(e.target.value)}
                        style={{ flex: "1 1 150px", padding: "10px 14px", fontSize: "13px", height: "auto" }}
                      >
                        <option value="">Assignee...</option>
                        {activeAssignees.map(member => (
                          <option key={member.accountId} value={member.accountId}>
                            {member.name}
                          </option>
                        ))}
                      </select>

                      <button type="submit" className="btn-primary" style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                        Add Task
                      </button>
                    </form>
                  )}

                  {/* Subtasks checklist */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto", marginTop: "4px" }}>
                    {currentTaskChildren && currentTaskChildren.length > 0 ? (
                      currentTaskChildren.map(sub => (
                        <div
                          key={sub.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            background: "rgba(255,255,255,0.01)",
                            border: "1px solid var(--border-glass)",
                            borderRadius: "8px",
                            fontSize: "13px",
                            gap: "12px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: "11px", color: "var(--primary)", fontFamily: "var(--mono)", fontWeight: "700", background: "rgba(45, 212, 191, 0.05)", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap" }}>
                              {sub.key}
                            </span>
                            <span style={{ color: "var(--text-main)", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {sub.summary}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                            {/* Subtask Assignee Avatar */}
                            {sub.assignee ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }} title={`Assigned to ${sub.assignee.displayName}`}>
                                <img
                                  src={sub.assignee.avatarUrl || "https://i.pravatar.cc/150"}
                                  alt={sub.assignee.displayName}
                                  style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1px solid var(--border-glass)" }}
                                />
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                  {sub.assignee.displayName.split(" ")[0]}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: "11.5px", color: "var(--text-dim)", fontStyle: "italic" }}>
                                Unassigned
                              </span>
                            )}
                            <Badge status={sub.statusName} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic", textAlign: "center", padding: "40px" }}>
                        {selectedTask.fields.issueType === "Epic" 
                          ? "No child tasks configured under this Epic."
                          : "No child subtasks configured for this ticket."}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: WORK LOGGING & ESTIMATION PANEL */}
              {modalTab === "worklog" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "13.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
                      Log Spent Hours
                    </h3>
                    {selectedTask.fields.timetracking && (
                      <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: "700" }}>
                        Logged: {selectedTask.fields.timetracking.timeSpent || "0h"}
                      </span>
                    )}
                  </div>

                  {/* Add work log entry form */}
                  {currentPersona !== "moderator" && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleLogWorkSpent(selectedTask.key, worklogTimeSpent, worklogComment);
                    }} className="glass-panel" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid rgba(255,255,255,0.03)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
                        <div>
                          <label style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>Time Spent *</label>
                          <input
                            type="text"
                            required
                            className="form-input"
                            placeholder="e.g. 1h 30m, 45m"
                            value={worklogTimeSpent}
                            onChange={(e) => setWorklogTimeSpent(e.target.value)}
                            style={{ padding: "8px 12px", fontSize: "13px" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px", textTransform: "uppercase" }}>Work log comment</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Brief comment on what you worked on..."
                            value={worklogComment}
                            onChange={(e) => setWorklogComment(e.target.value)}
                            style={{ padding: "8px 12px", fontSize: "13px" }}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn-primary" style={{ padding: "8px 14px", alignSelf: "flex-end", fontSize: "12px" }}>
                        Submit Worklog
                      </button>
                    </form>
                  )}

                  {/* Logs history list */}
                  <div style={{ marginTop: "4px" }}>
                    <h4 style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.2px" }}>Logged Entries Feed</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                      {isHistoryLoading ? (
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Fetching worklogs...</span>
                      ) : worklogHistory.length > 0 ? (
                        worklogHistory.map(log => (
                          <div
                            key={log.id}
                            style={{
                              padding: "10px 12px",
                              background: "rgba(255,255,255,0.01)",
                              border: "1px solid var(--border-glass)",
                              borderRadius: "8px",
                              fontSize: "12.5px"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontWeight: "700", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "4px" }}><FaClock /> {log.timeSpent} spent</span>
                              <span style={{ color: "var(--text-dim)", fontSize: "10.5px" }}>{new Date(log.created).toLocaleDateString()}</span>
                            </div>
                            <p style={{ color: "var(--text-main)", fontStyle: "italic", margin: "0 0 4px 0", fontSize: "12px" }}>
                              "{log.comment?.body || log.comment || "No comment note added."}"
                            </p>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                              Developer: {log.author?.displayName}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: "var(--text-muted)", fontSize: "12.5px", fontStyle: "italic", textAlign: "center", padding: "10px" }}>
                          No hours logged on this ticket yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LINKS & TAGS ORGANIZER PANEL */}
              {modalTab === "links" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  
                  {/* Labels Organizer */}
                  <div>
                    <h3 style={{ fontSize: "13.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "8px" }}>
                      Labels & Custom Tags
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                      {selectedTask.fields.labels && selectedTask.fields.labels.length > 0 ? (
                        selectedTask.fields.labels.map(lbl => (
                          <span
                            key={lbl}
                            style={{
                              fontSize: "10.5px",
                              fontWeight: "700",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: "rgba(34, 211, 238, 0.08)",
                              color: "var(--secondary)",
                              border: "1px solid rgba(34, 211, 238, 0.15)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <span>{lbl}</span>
                            {currentPersona !== "moderator" && (
                              <FaTimes
                                size={10}
                                style={{ cursor: "pointer", color: "var(--accent)" }}
                                onClick={() => {
                                  const updated = selectedTask.fields.labels.filter(l => l !== lbl);
                                  handleUpdateLabels(selectedTask.key, updated);
                                }}
                              />
                            )}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>No labels associated.</span>
                      )}
                    </div>
                    
                    {currentPersona !== "moderator" && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (labelInputString.trim()) {
                          const existing = selectedTask.fields.labels || [];
                          if (!existing.includes(labelInputString.trim())) {
                            handleUpdateLabels(selectedTask.key, [...existing, labelInputString.trim()]);
                          }
                          setLabelInputString("");
                        }
                      }} style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Add tag string... (e.g. backend)"
                          value={labelInputString}
                          onChange={(e) => setLabelInputString(e.target.value)}
                          style={{ padding: "8px 12px", fontSize: "12px" }}
                        />
                        <button type="submit" className="btn-primary" style={{ padding: "8px 14px", fontSize: "12px" }}>
                          Add tag
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Issue dependency linking */}
                  <div>
                    <h3 style={{ fontSize: "13.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "8px" }}>
                      Issue Dependency Relations
                    </h3>

                    {currentPersona !== "moderator" && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleLinkIssues(selectedTask.key, linkTargetKey, linkRelationType);
                      }} className="glass-panel" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px", border: "1px solid rgba(255,255,255,0.03)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
                          <div>
                            <label style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>RELATION</label>
                            <select
                              className="form-select"
                              value={linkRelationType}
                              onChange={(e) => setLinkRelationType(e.target.value)}
                              style={{ height: "34px", padding: "4px 8px", fontSize: "12px" }}
                            >
                              <option value="blocks">Blocks</option>
                              <option value="is blocked by">Is Blocked By</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>TARGET BOARD ISSUE</label>
                            <select
                              className="form-select"
                              value={linkTargetKey}
                              onChange={(e) => setLinkTargetKey(e.target.value)}
                              style={{ height: "34px", padding: "4px 8px", fontSize: "12px" }}
                            >
                              <option value="">Select ticket...</option>
                              {tasks.filter(t => t.key !== selectedTask.key).map(t => (
                                <option key={t.key} value={t.key}>{t.key} - {t.fields.summary.substring(0, 30)}...</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: "6px 12px", alignSelf: "flex-end", fontSize: "11px" }}>
                          Execute Link
                        </button>
                      </form>
                    )}

                    {/* Linked dependencies history */}
                    <div style={{ marginTop: "12px" }}>
                      <h4 style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Linked Issues</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                        {selectedTask.fields.issuelinks && selectedTask.fields.issuelinks.length > 0 ? (
                          selectedTask.fields.issuelinks.map(lnk => (
                            <div
                              key={lnk.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "8px 12px",
                                background: "rgba(255,255,255,0.01)",
                                border: "1px solid var(--border-glass)",
                                borderRadius: "6px",
                                fontSize: "12px"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                                <span style={{ fontWeight: "700", color: "var(--accent)" }}>{lnk.direction}</span>
                                <span style={{ fontFamily: "var(--mono)", color: "var(--primary)", fontWeight: "600", background: "rgba(45, 212, 191, 0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                                  {lnk.key}
                                </span>
                                <span style={{ color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                  {lnk.summary}
                                </span>
                              </div>
                              <Badge status={lnk.statusName} />
                            </div>
                          ))
                        ) : (
                          <div style={{ color: "var(--text-muted)", fontSize: "12px", fontStyle: "italic" }}>
                            No linked dependencies defined on this ticket.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: DELIVERABLES SUBMISSION PORTAL PANEL */}
              {modalTab === "deliverables" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {selectedTask.fields.issueType === "Epic" ? (
                    <div style={{
                      padding: "20px",
                      background: "rgba(239, 68, 68, 0.05)",
                      border: "1px dashed rgba(239, 68, 68, 0.2)",
                      borderRadius: "12px",
                      textAlign: "center",
                      color: "#ef4444",
                      fontSize: "13.5px"
                    }}>
                      Epic Alert: Deliverables must be submitted on sprint child tasks, not Epics.
                    </div>
                  ) : (
                    <>
                      {/* Submission Form */}
                      <div className="glass-panel" style={{ padding: "16px", background: "rgba(255,255,255,0.015)" }}>
                        <h3 style={{ fontSize: "13.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "12px", marginTop: 0 }}>
                          Submit Sprint Deliverable Artifact
                        </h3>
                        <form onSubmit={handleSubmitDeliverable} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div>
                              <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>CUSTOM FILE NAME (OPTIONAL)</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Final_Report.pdf"
                                value={submitFileName}
                                onChange={(e) => setSubmitFileName(e.target.value)}
                                style={{ padding: "8px 12px", fontSize: "12.5px" }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>UPLOAD FILE</label>
                              <input
                                type="file"
                                className="form-input"
                                onChange={(e) => setSubmitFile(e.target.files[0])}
                                style={{ padding: "5px 12px", fontSize: "12.5px", background: "rgba(0,0,0,0.1)", border: "1px dashed var(--border-subtle)" }}
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>EXPLANATORY COMMENTS</label>
                            <textarea
                              className="form-input"
                              placeholder="Provide any review instructions or context for the coordinator..."
                              value={submitComments}
                              onChange={(e) => setSubmitComments(e.target.value)}
                              style={{ padding: "8px 12px", fontSize: "12.5px", height: "60px", resize: "none" }}
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isSubmittingDeliverable}
                            className="btn-primary"
                            style={{ alignSelf: "flex-end", padding: "8px 18px", fontSize: "12px" }}
                          >
                            {isSubmittingDeliverable ? "Uploading submission..." : "Submit Deliverable"}
                          </button>
                        </form>
                      </div>

                      {/* Submissions History List */}
                      <div>
                        <h3 style={{ fontSize: "13.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "12px" }}>
                          Submitted Artifacts History
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto" }}>
                          {isSubmissionsLoading ? (
                            <div style={{ textAlign: "center", color: "var(--text-dim)", padding: "20px", fontSize: "12.5px" }}>Loading submissions...</div>
                          ) : submissions.length > 0 ? (
                            submissions.map((sub) => (
                              <div
                                key={sub._id}
                                style={{
                                  padding: "14px",
                                  background: "rgba(255,255,255,0.01)",
                                  border: "1px solid var(--border-glass)",
                                  borderRadius: "10px",
                                  fontSize: "12.5px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center"
                                }}
                              >
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1, marginRight: "16px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontWeight: "700", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      <span><FaPaperclip style={{ marginRight: '6px' }} /> {sub.fileName}</span>
                                    </span>
                                    <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                                      {new Date(sub.submittedAt).toLocaleString()}
                                    </span>
                                  </div>
                                  {sub.comments && (
                                    <p style={{ margin: "2px 0 0 0", fontStyle: "italic", color: "var(--text-muted)", fontSize: "11.5px" }}>
                                      "{sub.comments}"
                                    </p>
                                  )}
                                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "4px" }}>
                                    <span style={{ fontSize: "10px", color: "var(--primary)", fontWeight: "600" }}>
                                      By: {sub.studentName}
                                    </span>
                                    <span style={{
                                      fontSize: "9px",
                                      fontWeight: "900",
                                      background: sub.status === "Approved" ? "rgba(45, 212, 191, 0.08)" : sub.status === "Re-work Requested" ? "rgba(239, 68, 68, 0.08)" : sub.status === "Awaiting Coordinator Review" ? "rgba(59, 130, 246, 0.08)" : "rgba(251, 146, 60, 0.08)",
                                      color: sub.status === "Approved" ? "#2dd4bf" : sub.status === "Re-work Requested" ? "#ef4444" : sub.status === "Awaiting Coordinator Review" ? "#3b82f6" : "var(--accent)",
                                      border: sub.status === "Approved" ? "1px solid rgba(45, 212, 191, 0.2)" : sub.status === "Re-work Requested" ? "1px solid rgba(239, 68, 68, 0.2)" : sub.status === "Awaiting Coordinator Review" ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid rgba(251, 146, 60, 0.2)",
                                      padding: "2px 6px",
                                      borderRadius: "3px",
                                      textTransform: "uppercase"
                                    }}>{sub.status}</span>
                                  </div>
                                </div>
                                <a
                                  href={sub.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-secondary"
                                  style={{ padding: "6px 12px", textDecoration: "none", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                >
                                  <span><FaLink style={{ marginRight: '6px' }} /> Open Artifact</span>
                                </a>
                              </div>
                            ))
                          ) : (
                            <div style={{ color: "var(--text-dim)", fontSize: "12.5px", fontStyle: "italic", textAlign: "center", padding: "30px", background: "rgba(255,255,255,0.005)", border: "1px dashed var(--border-glass)", borderRadius: "10px" }}>
                              No deliverables submitted yet. Use the form above to post your first artifact link!
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-glass)", paddingTop: "14px", marginTop: "14px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                Created: {new Date(selectedTask.fields.created).toLocaleDateString()}
              </span>
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setModalTab("overview");
                }}
                className="btn-primary"
                style={{ padding: "8px 18px" }}
              >
                Done Editing
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 📧 MODAL 3: INTERACTIVE EMAIL ALERT COMPOSER */}
      {isEmailOpen && (
        <div style={modalBackdropStyle}>
          <div className="glass-panel" style={{
            width: "550px",
            padding: "30px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
            position: "relative",
            overflow: "hidden",
            animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            
            {/* Outgoing animation overlay */}
            {isSendingEmail && (
              <div style={{
                position: "absolute",
                inset: 0,
                background: "rgba(7, 9, 14, 0.95)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                gap: "24px"
              }}>
                <div style={{ position: "relative", width: "120px", height: "100px" }}>
                  {/* Envelope Base */}
                  <div style={{
                    width: "80px",
                    height: "50px",
                    border: "2.5px solid var(--primary)",
                    borderRadius: "4px",
                    position: "absolute",
                    bottom: "10px",
                    left: "20px",
                    background: "rgba(99, 102, 241, 0.1)",
                    animation: "envelopeSlide 2.2s infinite ease-in-out"
                  }}>
                    {/* Flap */}
                    <div style={{
                      width: "0",
                      height: "0",
                      borderLeft: "37px solid transparent",
                      borderRight: "37px solid transparent",
                      borderTop: "24px solid var(--primary)",
                      position: "absolute",
                      top: 0,
                      left: "1.5px"
                    }}></div>
                  </div>

                  {/* Letter sliding in */}
                  <div style={{
                    width: "60px",
                    height: "40px",
                    background: "white",
                    borderRadius: "2px",
                    position: "absolute",
                    left: "30px",
                    top: "10px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                    animation: "paperInsert 2.2s infinite ease-in-out"
                  }}>
                    <div style={{ width: "40px", height: "3px", background: "#cbd5e1", margin: "8px auto 0" }}></div>
                    <div style={{ width: "40px", height: "3px", background: "#cbd5e1", margin: "4px auto 0" }}></div>
                    <div style={{ width: "30px", height: "3px", background: "#e2e8f0", margin: "4px auto 0" }}></div>
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700" }}>
                    {emailAnimationState === "sending" ? "Relaying via Secure SMTP Gateway..." : "Assembling envelope payload..."}
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "6px" }}>
                    Relaying request to active Express server...
                  </p>
                </div>
              </div>
            )}

            {/* Email Header info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
                <FaEnvelope color="var(--accent)" />
                <span>Send Deadline Warning Email</span>
              </h2>
              <button
                onClick={() => setIsEmailOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSendReminderEmail} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={modalLabelStyle}>To (Assignee Email)</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label style={modalLabelStyle}>Subject Header</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div>
                <label style={modalLabelStyle}>Formatted Message Template</label>
                <textarea
                  required
                  className="form-input"
                  style={{ minHeight: "180px", fontSize: "13px", lineHeight: "1.6", fontFamily: "var(--mono)" }}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setIsEmailOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: "#ef4444", color: "white" }}
                >
                  <FaPaperPlane size={12} />
                  <span>Dispatch Email</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 🚀 MODAL 4: AUTOMATED B2B PROJECT ASSIGNMENT & PROVISIONING */}
      {isAssignModalOpen && selectedAssignProject && (
        <div style={modalBackdropStyle}>
          <div className="glass-panel" style={{
            width: "550px",
            padding: "30px",
            border: "1.5px solid rgba(255,255,255,0.08)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
            position: "relative",
            overflow: "hidden",
            animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            
            {/* Automatic Provisioning Animation Overlay */}
            {isProvisioning && (
              <div style={{
                position: "absolute",
                inset: 0,
                background: "rgba(3, 7, 18, 0.96)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                gap: "24px"
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  border: "4px solid rgba(45, 212, 191, 0.1)",
                  borderTopColor: "var(--primary)",
                  borderRadius: "50%",
                }} className="pulse-glow"></div>
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Automating Campus Provisioning...
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px", maxWidth: "340px", lineHeight: "1.6" }}>
                    Calling Live Atlassian Jira Cloud REST APIs, generating standard workstreams, and provisioning Epics & Child Tasks...
                  </p>
                </div>
              </div>
            )}

            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <h2 style={{ fontSize: "19px", fontWeight: "800", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>Allocate Sponsor Project</span>
                </h2>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Assigning <strong>{selectedAssignProject.title}</strong> by <strong>{selectedAssignProject.company}</strong>
                </span>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignProject} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Target Campus Selector */}
              <div>
                <label style={modalLabelStyle}>Target Institution Campus *</label>
                <select
                  className="form-select"
                  required
                  value={assignTargetCampus}
                  onChange={(e) => setAssignTargetCampus(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", height: "42px", fontSize: "14px" }}
                >
                  <option value="3">KLE Spoke (Live Jira - Key: AK)</option>
                  <option value="101">COEP Spoke (Live Jira - Key: AK)</option>
                  <option value="102">MMCOEP Spoke (Live Jira - Key: AK)</option>
                  <option value="103">RIT Spoke (Live Jira - Key: AK)</option>
                </select>
                <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "6px", lineHeight: "1.4" }}>
                  All Spoke campuses are 100% active and connected directly to their backing Agile boards in your Atlassian Jira Cloud instance.
                </p>
              </div>

              {/* Target Due Date Picker */}
              <div>
                <label style={modalLabelStyle}>Project Target Due Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", height: "42px", fontSize: "14px", colorScheme: theme === "dark" ? "dark" : "light" }}
                />
                <p style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "6px", lineHeight: "1.4" }}>
                  This date represents the final FIP delivery deadline. The system will automatically compute and provision intermediate milestones for Phase 1 (30% of duration), Phase 2 (60%), and Phase 3 (100%).
                </p>
              </div>

              {/* FIP Workstreams Preview - from Project Manager's phases */}
              <div className="glass-panel" style={{ padding: "16px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "10px" }}>
                <h4 style={{ fontSize: "11.5px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                  {selectedAssignProject?.phases?.length > 0 ? "Project Phases (Defined by PM)" : "Standard Auto-Provisioned Workstreams"}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                  {selectedAssignProject?.phases?.length > 0 ? (
                    selectedAssignProject.phases.map((phase, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "var(--text-main)" }}>
                        <span style={{ color: "var(--primary)", fontWeight: "bold", minWidth: "18px" }}>{idx + 1}.</span>
                        <div>
                          <span style={{ fontWeight: "600" }}>{phase.name}</span>
                          {phase.duration && <span style={{ color: "var(--text-muted)", fontSize: "11px", marginLeft: "8px" }}>({phase.duration})</span>}
                          {phase.description && <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>{phase.description}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-main)" }}>
                        <span style={{ color: "var(--primary)", fontWeight: "bold" }}>1.</span>
                        <span>Phase 1: Lab Infrastructure Setup & Hardware Procurement</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-main)" }}>
                        <span style={{ color: "var(--primary)", fontWeight: "bold" }}>2.</span>
                        <span>Phase 2: Faculty Upskilling & Student Cohort Selection</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-main)" }}>
                        <span style={{ color: "var(--primary)", fontWeight: "bold" }}>3.</span>
                        <span>Phase 3: Development, Industry Mentorship & Evaluation</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Dialog Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px", borderTop: "1px solid var(--border-glass)", paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: "8px 18px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: "8px 20px",
                    background: "var(--accent)",
                    borderColor: "transparent",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)"
                  }}
                >
                  Automate Provisioning
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 🧑‍💼 MENTOR ASSIGN MODAL */}
      <MentorAssignModal
        isOpen={isMentorModalOpen}
        onClose={() => setIsMentorModalOpen(false)}
        project={mentorModalProject}
        spokes={Object.entries(SPOKES).map(([id, spoke]) => ({ id, ...spoke }))}
        mode={mentorMode}
        setMode={setMentorMode}
        globalEmail={mentorGlobalEmail}
        setGlobalEmail={setMentorGlobalEmail}
        globalName={mentorGlobalName}
        setGlobalName={setMentorGlobalName}
        perSpoke={mentorPerSpoke}
        setPerSpoke={setMentorPerSpoke}
        isAssigning={isAssigningMentor}
        onSubmit={() => {
          if (!mentorModalProject) return;
          setIsAssigningMentor(true);
          setTimeout(() => {
            const assignment = {
              mode: mentorMode,
              global: mentorMode === "global" ? { name: mentorGlobalName, email: mentorGlobalEmail } : null,
              perSpoke: mentorMode === "per-spoke" ? mentorPerSpoke : null
            };
            const updated = { ...mentorAssignments, [mentorModalProject.id]: assignment };
            setMentorAssignments(updated);
            localStorage.setItem("apnileap-mentor-assignments", JSON.stringify(updated));

            // Generate Dashboard Notifications
            const newNotifications = [];
            if (mentorMode === "global" && mentorGlobalEmail) {
              newNotifications.push({
                id: Date.now(),
                email: mentorGlobalEmail.toLowerCase().trim(),
                message: `You have been assigned as the Global Mentor for ${mentorModalProject.title}.`,
                timestamp: new Date().toISOString(),
                read: false
              });
            } else if (mentorMode === "per-spoke" && mentorPerSpoke) {
              Object.values(mentorPerSpoke).forEach((sp, idx) => {
                if (sp.email) {
                  newNotifications.push({
                    id: Date.now() + idx,
                    email: sp.email.toLowerCase().trim(),
                    message: `You have been assigned as a Campus Mentor for ${mentorModalProject.title}.`,
                    timestamp: new Date().toISOString(),
                    read: false
                  });
                }
              });
            }
            const existingNotifications = JSON.parse(localStorage.getItem("apnileap-mentor-notifications") || "[]");
            localStorage.setItem("apnileap-mentor-notifications", JSON.stringify([...existingNotifications, ...newNotifications]));

            setIsAssigningMentor(false);
            setIsMentorModalOpen(false);
            triggerToast("Project Mentor successfully assigned and notified!");
          }, 1200);
        }}
      />

      
      {isProjectManagerIngestModalOpen && (
        <ModeratorIngestModal 
          onClose={() => setIsProjectManagerIngestModalOpen(false)} 
          onSuccess={() => {
            setIsProjectManagerIngestModalOpen(false);
            fetchProjectManagerProjects(false);
          }}
        />
      )}

      {isLogoutModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.25s ease" }}>
          <div className="glass-panel" style={{ background: "var(--bg-card)", border: "1px solid var(--border-glass)", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "400px", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <h3 style={{ marginTop: 0, color: "var(--text-main)", marginBottom: "12px", fontSize: "20px", fontWeight: "800" }}>Sign Out</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>Are you sure you want to log out of the ApniLeap Portal?</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button onClick={() => setIsLogoutModalOpen(false)} style={{ background: "var(--bg-glass)", color: "var(--text-main)", border: "1px solid var(--border-glass)", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", transition: "0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-glass)"}>Cancel</button>
              <button onClick={() => { setIsLogoutModalOpen(false); handleLogout(); }} style={{ background: "#ef4444", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", transition: "0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"} onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* INGEST B2B PROJECT PROPOSAL MODAL */}
      {isIngestOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          animation: "fadeIn 0.25s ease"
        }}>
          <div className="glass-panel" style={{
            width: "500px",
            padding: "32px",
            position: "relative",
            background: "var(--bg-card)",
            border: "1px solid var(--border-glass)",
            borderRadius: "12px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px" }}>
              Ingest New Corporate Proposal
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Manually ingest a new corporate program proposal into the Central Project Intake pool.
            </p>

            <form onSubmit={handleIngestProjectSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Company / Partner Sponsor</label>
                <select
                  className="form-select"
                  value={ingestCompany}
                  onChange={(e) => setIngestCompany(e.target.value)}
                  style={{ width: "100%", height: "38px" }}
                >
                  <option value="NVIDIA">NVIDIA</option>
                  <option value="Intel">Intel</option>
                  <option value="Google">Google</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Project Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Edge AI Smart Agriculture System"
                  value={ingestTitle}
                  onChange={(e) => setIngestTitle(e.target.value)}
                  required
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Project Description</label>
                <textarea
                  className="form-input"
                  placeholder="Detailed scope and deliverables of the company sponsorship program..."
                  value={ingestDescription}
                  onChange={(e) => setIngestDescription(e.target.value)}
                  required
                  rows={3}
                  style={{ padding: "8px 12px", fontSize: "13px", resize: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Budget Funding</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. $25,000"
                    value={ingestBudget}
                    onChange={(e) => setIngestBudget(e.target.value)}
                    required
                    style={{ padding: "8px 12px", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Duration</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 6 Months"
                    value={ingestDuration}
                    onChange={(e) => setIngestDuration(e.target.value)}
                    required
                    style={{ padding: "8px 12px", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Proposed Target Deadline</label>
                <input
                  type="date"
                  className="form-input"
                  value={ingestDueDate}
                  onChange={(e) => setIngestDueDate(e.target.value)}
                  required
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsIngestOpen(false)}
                  className="btn-secondary"
                  style={{ padding: "8px 18px" }}
                  disabled={isIngesting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: "8px 20px",
                    background: "#ef4444",
                    borderColor: "transparent",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)"
                  }}
                  disabled={isIngesting}
                >
                  {isIngesting ? "Ingesting..." : "Confirm Ingest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT B2B PROJECT PROPOSAL MODAL */}
      {editingProject && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          animation: "fadeIn 0.25s ease"
        }}>
          <div className="glass-panel" style={{
            width: "500px",
            padding: "32px",
            position: "relative",
            background: "var(--bg-card)",
            border: "1px solid var(--border-glass)",
            borderRadius: "12px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px" }}>
              Edit Corporate Project
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Update the specifications and budget parameters of the active B2B project contract.
            </p>

            <form onSubmit={handleUpdateProjectSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Company / Partner Sponsor</label>
                <select
                  className="form-select"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  style={{ width: "100%", height: "38px" }}
                >
                  <option value="NVIDIA">NVIDIA</option>
                  <option value="Intel">Intel</option>
                  <option value="Google">Google</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Project Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Edge AI Smart Agriculture System"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Project Description</label>
                <textarea
                  className="form-input"
                  placeholder="Detailed scope and deliverables of the company sponsorship program..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  rows={3}
                  style={{ padding: "8px 12px", fontSize: "13px", resize: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Budget Funding</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. $25,000"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    required
                    style={{ padding: "8px 12px", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Duration</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 6 Months"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    required
                    style={{ padding: "8px 12px", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Proposed Target Deadline</label>
                <input
                  type="date"
                  className="form-input"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  required
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="btn-secondary"
                  style={{ padding: "8px 18px" }}
                  disabled={isUpdatingProject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: "8px 20px",
                    background: "#ef4444",
                    borderColor: "transparent",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)"
                  }}
                  disabled={isUpdatingProject}
                >
                  {isUpdatingProject ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SYSTEM SETTINGS MODAL */}
      {showSettingsModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          animation: "fadeIn 0.25s ease"
        }}>
          <div className="glass-panel" style={{
            width: "500px",
            padding: "32px",
            position: "relative",
            background: "var(--bg-card)",
            border: "1px solid var(--border-glass)",
            borderRadius: "12px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px" }}>
              Platform System Settings
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Configure Atlassian Jira credentials, SMTP gateway settings, and manage cache.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
              {/* Jira section */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: "800", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                  Atlassian Jira Credentials
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>JIRA Cloud Domain</label>
                    <input type="text" className="form-input" value="https://manasa-kle-apnileap.atlassian.net" disabled style={{ padding: "8px 12px", fontSize: "12.5px", opacity: 0.7 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Auth Email Address</label>
                    <input type="text" className="form-input" value={currentUser?.email || "admin@apnileap.com"} disabled style={{ padding: "8px 12px", fontSize: "12.5px", opacity: 0.7 }} />
                  </div>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)" }} />

              {/* SMTP section */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: "800", color: "var(--secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                  SMTP Relay Gateway
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>SMTP Host</label>
                    <input type="text" className="form-input" placeholder="smtp.ethereal.email" disabled style={{ padding: "8px 12px", fontSize: "12.5px", opacity: 0.7 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>Port</label>
                    <input type="text" className="form-input" placeholder="587" disabled style={{ padding: "8px 12px", fontSize: "12.5px", opacity: 0.7 }} />
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                    Ethereal Test SMTP Gateway auto-provisions in sandbox mode when custom fields are empty.
                  </span>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)" }} />

              {/* Performance / Cache Section */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: "800", color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                  Performance & Cache Control
                </h4>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-subtle)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--text-main)" }}>Server Memory Cache</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Expires task updates in 30 seconds automatically</div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("http://localhost:5000/cache/clear", { method: "POST" });
                        const data = await res.json();
                        if (data.success) {
                          triggerToast("Server cache successfully purged!");
                        }
                      } catch {
                        triggerToast("Cache cleared locally!");
                      }
                    }}
                    className="btn-primary"
                    style={{
                      background: "#dc2626",
                      border: "none",
                      padding: "8px 14px",
                      fontSize: "12px",
                      borderRadius: "6px",
                      boxShadow: "0 4px 12px rgba(220, 38, 38, 0.15)",
                      cursor: "pointer"
                    }}
                  >
                    Purge Cache
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "28px" }}>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="btn-secondary"
                style={{ padding: "10px 22px", borderRadius: "8px", cursor: "pointer" }}
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REAL-TIME TEAM CHAT DRAWER ─────────────────────────────────── */}
      {showChatDrawer && (() => {
        // Derive rooms available for current user
        const persona = currentPersona || "";
        const userEmail = sessionUser?.email || "";
        const userRole = sessionUser?.role || currentUser?.role || "";

        // Determine coordinator email for this spoke
        const coordUser = spokeMembers.find(m =>
          m.displayName?.toLowerCase().includes("coordinator") ||
          m.role === "Campus Coordinator"
        );
        const coordEmail = coordUser?.emailAddress || coordUser?.email || "coordinator@campus.edu";

        // Build room list based on role
        const rooms = [];

        // Team rooms — any team this user belongs to or mentors
        spokeTeams.forEach(team => {
          const isMember = Array.isArray(team.members) && team.members.some(m =>
            m.emailAddress === userEmail || m.accountId === userEmail
          );
          const isMentor = team.mentor?.emailAddress === userEmail || team.mentor?.accountId === userEmail;
          if (isMember || isMentor) {
            rooms.push({
              id: `team:${team._id}`,
              label: `🏷️ ${team.name}`,
              sublabel: "Team Chat",
              color: "#6366f1",
              access: "team_members"
            });
          }
        });

        // Spoke public room — all roles
        const spokeName = currentBoardId
          ? (Object.values({"3":"KLE","101":"COEP","102":"MMCOEP","103":"RIT"})[Object.keys({"3":"KLE","101":"COEP","102":"MMCOEP","103":"RIT"}).indexOf(currentBoardId)] || currentBoardId)
          : (persona.replace("spoke-", "").toUpperCase() || "Campus");
        rooms.push({
          id: `spoke:${currentBoardId || persona}`,
          label: `🏫 ${spokeName} Global`,
          sublabel: "Global Spoke Chat",
          color: "#10b981",
          access: "public"
        });

        // Coordinator 1-1 — Faculty → Coordinator only
        if (userRole === "Faculty Member" || userRole === "Project Mentor" || userRole === "Campus Coordinator") {
          const otherEmail = userRole === "Campus Coordinator" ? null : coordEmail;
          if (userRole === "Campus Coordinator") {
            // Coordinator sees one chat per faculty
            const facultyList = spokeMembers.filter(m =>
              m.displayName?.toLowerCase().includes("faculty") ||
              m.role === "Faculty Member" ||
              m.role === "Project Mentor"
            );
            facultyList.forEach(f => {
              const fEmail = f.emailAddress || f.email;
              rooms.push({
                id: `coord:${fEmail}:${userEmail}`,
                label: `🔒 ${f.displayName?.replace(/ \(.*\)/, "") || fEmail}`,
                sublabel: "Private with Faculty",
                color: "#f59e0b",
                access: "private"
              });
            });
          } else {
            rooms.push({
              id: `coord:${userEmail}:${coordEmail}`,
              label: "🔒 Coordinator Chat",
              sublabel: "Private · Faculty only",
              color: "#f59e0b",
              access: "private"
            });
          }
        }

        const currentRoom = activeChatRoom || rooms[0]?.id || null;
        if (activeChatRoom === null && rooms.length > 0 && !activeChatRoom) {
          setTimeout(() => setActiveChatRoom(rooms[0].id), 0);
        }

        const msgs = (chatRoomMessages[currentRoom] || []);
        const activeRoomMeta = rooms.find(r => r.id === currentRoom);

        return (
          <div style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "400px",
            height: "100vh",
            background: "var(--bg-card)",
            borderLeft: "1px solid var(--border-glass)",
            boxShadow: "-12px 0 50px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 999,
            animation: "slideInLeft 0.3s ease"
          }}>

            {/* Header */}
            <div style={{
              padding: "18px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.05) 100%)",
              display: "flex",
              flexDirection: "column"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                    💬 Team Chat
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: chatConnected ? "#10b981" : "#ef4444", display: "inline-block" }} />
                    <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>{chatConnected ? "Connected" : "Connecting..."}</span>
                  </div>
                </div>
                <button onClick={() => { setShowChatDrawer(false); setActiveChatRoom(null); }}
                  style={{ background: "none", border: "none", fontSize: "22px", color: "var(--text-muted)", cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>

              {/* Room Tabs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "30vh", overflowY: "auto" }}>
                {rooms.map(room => (
                  <button key={room.id}
                    onClick={() => setActiveChatRoom(room.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: currentRoom === room.id ? `1px solid ${room.color}40` : "1px solid transparent",
                      background: currentRoom === room.id ? `${room.color}14` : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s"
                    }}
                  >
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: room.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: currentRoom === room.id ? "var(--text-main)" : "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {room.label}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>{room.sublabel}</div>
                    </div>
                    {room.access === "private" && <span style={{ fontSize: "9px", background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>PRIVATE</span>}
                  </button>
                ))}
                {rooms.length === 0 && (
                  <div style={{ fontSize: "11px", color: "var(--text-dim)", padding: "8px", fontStyle: "italic" }}>No chat rooms available yet. Join a team first.</div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {currentRoom ? (
                msgs.length > 0 ? msgs.map((msg, idx) => {
                  const isMe = msg.senderEmail === userEmail;
                  const time = msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "";
                  return (
                    <div key={msg._id || idx} style={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "82%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start"
                    }}>
                      {!isMe && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || "U")}&background=6366f1&color=fff&size=24`}
                            alt={msg.senderName}
                            style={{ width: "20px", height: "20px", borderRadius: "50%" }}
                          />
                          <span style={{ fontSize: "10px", fontWeight: "700", color: activeRoomMeta?.color || "var(--primary)" }}>
                            {msg.senderName}
                          </span>
                          <span style={{ fontSize: "9px", color: "var(--text-dim)", fontStyle: "italic" }}>{msg.senderRole}</span>
                        </div>
                      )}
                      <div style={{
                        padding: "9px 13px",
                        borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                        background: isMe ? `linear-gradient(135deg, ${activeRoomMeta?.color || "#6366f1"}, ${activeRoomMeta?.color || "#6366f1"}cc)` : "var(--bg-subtle)",
                        border: isMe ? "none" : "1px solid var(--border-subtle)",
                        color: isMe ? "#fff" : "var(--text-main)",
                        fontSize: "12.5px",
                        lineHeight: "1.5",
                        wordBreak: "break-word"
                      }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "3px" }}>{time}</span>
                    </div>
                  );
                }) : (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--text-dim)", paddingTop: "40px" }}>
                    <span style={{ fontSize: "32px" }}>💬</span>
                    <span style={{ fontSize: "12.5px", fontStyle: "italic" }}>No messages yet. Start the conversation!</span>
                  </div>
                )
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "12px" }}>
                  Select a channel to start chatting
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Input Footer */}
            <div style={{
              padding: "14px 16px",
              borderTop: "1px solid var(--border-subtle)",
              background: "var(--bg-subtle)",
              display: "flex",
              gap: "8px",
              alignItems: "flex-end"
            }}>
              {currentRoom ? (
                <>
                  <textarea
                    className="form-input"
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    placeholder={`Message ${activeRoomMeta?.label || "channel"}...`}
                    rows={2}
                    style={{ flex: 1, padding: "8px 12px", fontSize: "12.5px", resize: "none", lineHeight: "1.4", borderRadius: "8px" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendChatMessage}
                    disabled={!newChatMessage.trim()}
                    className="btn-primary"
                    style={{ padding: "10px 14px", fontSize: "13px", border: "none", cursor: "pointer", borderRadius: "8px", alignSelf: "flex-end", background: activeRoomMeta?.color || "var(--primary)", opacity: newChatMessage.trim() ? 1 : 0.5 }}
                  >
                    ➤
                  </button>
                </>
              ) : (
                <div style={{ flex: 1, textAlign: "center", fontSize: "11.5px", color: "var(--text-dim)", fontStyle: "italic" }}>Select a channel above to chat</div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ACADEMIC COHORTS/GRADUATION MODAL */}
      {showCohortModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          animation: "fadeIn 0.25s ease"
        }}>
          <div className="glass-panel" style={{
            width: "600px",
            padding: "32px",
            position: "relative",
            background: "var(--bg-card)",
            border: "1px solid var(--border-glass)",
            borderRadius: "12px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)", marginBottom: "8px" }}>
              FIP Campus Cohort Academic Progress
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Overview of student cohorts, faculty mentors, and academic progress across all active campuses.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={{ textAlign: "left", padding: "10px", color: "var(--text-muted)" }}>Campus Institution</th>
                    <th style={{ textAlign: "center", padding: "10px", color: "var(--text-muted)" }}>Student Cohort</th>
                    <th style={{ textAlign: "center", padding: "10px", color: "var(--text-muted)" }}>Faculty Mentors</th>
                    <th style={{ textAlign: "center", padding: "10px", color: "var(--text-muted)" }}>Sponsor Projects</th>
                    <th style={{ textAlign: "right", padding: "10px", color: "var(--text-muted)" }}>Avg. Task Progress</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 10px", fontWeight: "700", color: "var(--text-main)" }}>KLE Spoke (Hub)</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>35 Students</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>4 Mentors</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>2 Projects</td>
                    <td style={{ textAlign: "right", padding: "12px 10px", fontWeight: "700", color: "var(--status-done-text)" }}>66%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 10px", fontWeight: "700", color: "var(--text-main)" }}>COEP Spoke</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>24 Students</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>3 Mentors</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>2 Projects</td>
                    <td style={{ textAlign: "right", padding: "12px 10px", fontWeight: "700", color: "var(--status-progress-text)" }}>33%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 10px", fontWeight: "700", color: "var(--text-main)" }}>MMCOEP Spoke</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>18 Students</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>2 Mentors</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>1 Project</td>
                    <td style={{ textAlign: "right", padding: "12px 10px", fontWeight: "700", color: "var(--status-backlog-text)" }}>0%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 10px", fontWeight: "700", color: "var(--text-main)" }}>RIT Spoke</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>20 Students</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>3 Mentors</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>1 Project</td>
                    <td style={{ textAlign: "right", padding: "12px 10px", fontWeight: "700", color: "var(--status-backlog-text)" }}>16%</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginTop: "8px" }}>
                <h4 style={{ fontWeight: "700", fontSize: "13px", color: "var(--text-main)", marginBottom: "6px" }}>Top Performing Cohort</h4>
                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                  <strong>KLE Spoke</strong> is leading portfolio progress with <strong>66% avg completion rate</strong> across scheduled milestones on the NVIDIA Edge AI project.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "28px" }}>
              <button
                onClick={() => setShowCohortModal(false)}
                className="btn-secondary"
                style={{ padding: "10px 22px", borderRadius: "8px", cursor: "pointer" }}
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

// 📌 CUSTOM HIGH-FIDELITY LIGHT-THEME TOOLTIP
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const name = data.name || "";
    const value = payload[0].value;
    const dataKey = payload[0].name || payload[0].dataKey;
    
    let displayValue = `${value}`;
    if (dataKey === "completionRate" || dataKey === "Completion Rate") {
      displayValue = `${value}%`;
    }
    
    return (
      <div style={{
        background: "#ffffff",
        border: "1px solid rgba(0, 0, 0, 0.05)",
        borderRadius: "12px",
        padding: "10px 14px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.06)",
        pointerEvents: "none"
      }}>
        <p style={{ margin: 0, fontWeight: "700", color: "var(--text-main)", fontSize: "13px" }}>
          {name}
        </p>
        <p style={{ margin: "4px 0 0", color: "var(--primary)", fontWeight: "850", fontSize: "14px" }}>
          {payload[0].name || "Value"}: {displayValue}
        </p>
        {data.total !== undefined && (
          <p style={{ margin: "2px 0 0", color: "var(--text-dim)", fontSize: "11px", fontWeight: "500" }}>
            Tasks Done: {data.done} / {data.total}
          </p>
        )}
      </div>
    );
  }
  return null;
};

// 📌 SIDEBAR NAV ITEM HELPER
function SidebarNavItem({ active, icon, label, collapsed, onClick, variant = "primary" }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 18px",
        borderRadius: active ? "6px 0 0 6px" : "6px",
        cursor: "pointer",
        background: active ? (variant === "accent" ? "#ef4444" : "var(--sidebar-active-bg)") : "transparent",
        color: active ? (variant === "accent" ? "#ffffff" : "var(--sidebar-text-active)") : "var(--sidebar-text)",
        border: "none",
        transition: "var(--transition-smooth)",
        justifyContent: collapsed ? "center" : "flex-start",
        marginRight: active ? "0px" : "16px",
        fontWeight: active ? "700" : "500",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--sidebar-hover-bg)";
          e.currentTarget.style.color = "var(--sidebar-text-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--sidebar-text)";
        }
      }}
    >
      <span style={{ display: "flex", alignItems: "center", color: "inherit", fontSize: "16px" }}>
        {icon}
      </span>
      {!collapsed && (
        <span style={{ fontSize: "13.5px", letterSpacing: "0.2px" }}>
          {label}
        </span>
      )}
    </div>
  );
}

// 📌 DASHBOARD METRIC CARD
function DashboardCard({ title, value, subtitle, themeColor, pulse, glow, progress, alert }) {
  return (
    <div
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "8px",
        background: "var(--bg-card)",
        border: alert ? "1px solid rgba(255, 140, 0, 0.2)" : "1px solid rgba(0, 0, 0, 0.04)",
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.01)",
        transition: "var(--transition-smooth)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 20px 40px -15px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.01)";
      }}
    >
      {/* Absolute Glow Background */}
      {glow && (
        <div style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: "var(--primary)",
          filter: "blur(40px)",
          opacity: 0.1,
          pointerEvents: "none"
        }}></div>
      )}

      {alert && (
        <div style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: "var(--accent)",
          filter: "blur(40px)",
          opacity: 0.1,
          pointerEvents: "none"
        }}></div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {title}
        </span>
        {pulse && (
          <span style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: alert ? "var(--accent)" : "var(--primary)",
            display: "inline-block"
          }} className="pulse-glow"></span>
        )}
      </div>

      <span style={{
        fontSize: "30px",
        fontWeight: "800",
        color: themeColor || "var(--text-main)",
        letterSpacing: "-0.5px",
        lineHeight: "1.1"
      }}>
        {value}
      </span>

      {progress !== undefined ? (
        <div style={{ width: "100%", marginTop: "4px" }}>
          <div style={{ height: "6px", width: "100%", background: "rgba(0, 0, 0, 0.06)", borderRadius: "3px" }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "var(--primary)",
              borderRadius: "3px",
              transition: "width 0.5s ease-out"
            }}></div>
          </div>
        </div>
      ) : (
        <span style={{ color: "var(--text-dim)", fontSize: "11px", fontWeight: "500" }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}

// 📌 COLUMNS HEADER FOR KANBAN
function ColumnHeader({ title, count, color, bgColor, pulse }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: "10px",
      borderBottom: "1px solid rgba(255,255,255,0.06)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {pulse && (
          <span style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "var(--primary)",
            display: "inline-block"
          }} className="pulse-glow"></span>
        )}
        <span style={{ fontWeight: "700", fontSize: "15px", letterSpacing: "0.2px" }}>
          {title === "Backlog" ? <FaInbox style={{ marginRight: "6px", verticalAlign: "middle" }} /> : title === "In Progress" ? <FaHourglassHalf style={{ marginRight: "6px", verticalAlign: "middle" }} /> : title === "Done" ? <FaCheckCircle style={{ marginRight: "6px", verticalAlign: "middle" }} /> : ""}
          {title}
        </span>
      </div>

      <span style={{
        background: bgColor || "rgba(255,255,255,0.04)",
        color: color || "var(--text-muted)",
        fontSize: "12px",
        fontWeight: "700",
        padding: "3px 8px",
        borderRadius: "20px"
      }}>
        {count}
      </span>
    </div>
  );
}

function DraggableCard({ task, index, onClick }) {
  const deadline = getDeadlineInfo(task.fields.dueDate, task.fields.status?.name);
  const sponsor = getSponsorCompany(task);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`${snapshot.isDragging ? "kanban-card-dragging" : ""} ${task.fields.flagged ? "kanban-card-blocked" : ""}`}
          style={{
            padding: "16px",
            cursor: "grab",
            borderRadius: "6px",
            background: snapshot.isDragging ? "rgba(59, 82, 154, 0.05)" : "var(--bg-card)",
            border: snapshot.isDragging ? "1.5px solid var(--primary)" : "1px solid var(--border-subtle)",
            boxShadow: snapshot.isDragging ? "0 10px 25px rgba(15, 23, 42, 0.08)" : "0 4px 10px rgba(0, 0, 0, 0.015)",
            transition: "var(--transition-smooth)",
            ...provided.draggableProps.style
          }}
        >
          {/* Card Header: Key and Deadline Badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                fontSize: "11px",
                fontWeight: "800",
                color: "var(--primary)",
                background: "rgba(59, 82, 154, 0.08)",
                padding: "2px 6px",
                borderRadius: "4px"
              }}>
                {task.key}
              </span>
              {sponsor && (
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  title={`${sponsor.name} Sponsor`}
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    objectFit: "contain",
                    background: "white",
                    padding: "1px",
                    border: "1px solid rgba(255,255,255,0.08)"
                  }}
                />
              )}
              {task.fields.issueType && (
                <span style={{
                  fontSize: "10px",
                  fontWeight: "750",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  backgroundColor:
                    task.fields.issueType === "Epic" ? "rgba(139, 92, 246, 0.12)" :
                    task.fields.issueType === "Bug" ? "rgba(239, 68, 68, 0.12)" :
                    task.fields.issueType === "Story" ? "rgba(16, 185, 129, 0.12)" : "rgba(59, 130, 246, 0.12)",
                  color:
                    task.fields.issueType === "Epic" ? "#7c3aed" :
                    task.fields.issueType === "Bug" ? "#dc2626" :
                    task.fields.issueType === "Story" ? "#059669" : "#2563eb",
                  border: "1px solid",
                  borderColor:
                    task.fields.issueType === "Epic" ? "rgba(139, 92, 246, 0.25)" :
                    task.fields.issueType === "Bug" ? "rgba(239, 68, 68, 0.25)" :
                    task.fields.issueType === "Story" ? "rgba(16, 185, 129, 0.25)" : "rgba(59, 130, 246, 0.25)"
                }}>
                  {task.fields.issueType === "Epic" ? "Epic" :
                   task.fields.issueType === "Bug" ? "Bug" :
                   task.fields.issueType === "Story" ? "Story" : "Task"}
                </span>
              )}
              {task.fields.flagged && (
                <span className="pulse-glow" style={{
                  fontSize: "9px",
                  fontWeight: "800",
                  color: "var(--accent)",
                  background: "rgba(251, 146, 60, 0.15)",
                  border: "1px solid var(--accent)",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  letterSpacing: "0.2px"
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><FaExclamationTriangle style={{ color: "#ef4444" }} /> Blocked</span>
                </span>
              )}
            </div>

            {deadline && (
              <span className={deadline.type === "overdue" ? "overdue-badge-blink" : ""} style={{
                fontSize: "10px",
                fontWeight: "700",
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor:
                  deadline.type === "overdue" ? "var(--priority-high-bg)" :
                  deadline.type === "soon" ? "var(--priority-medium-bg)" : "rgba(0, 0, 0, 0.04)",
                color:
                  deadline.type === "overdue" ? "var(--priority-high-text)" :
                  deadline.type === "soon" ? "var(--priority-medium-text)" : "var(--text-muted)",
                border: "1px solid",
                borderColor:
                  deadline.type === "overdue" ? "var(--priority-high-border)" :
                  deadline.type === "soon" ? "var(--priority-medium-border)" : "rgba(0, 0, 0, 0.05)",
              }}>
                {deadline.text}
              </span>
            )}
          </div>

          {/* Parent Project Summary Folder Badge */}
          {task.fields.parent && (
            <div style={{
              fontSize: "11px",
              fontWeight: "750",
              color: sponsor ? (sponsor.name === "NVIDIA" ? "#76b900" : sponsor.name === "Intel" ? "#0068b5" : "#4285f4") : "var(--primary)",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <span><FaFolderOpen /></span>
              <span>{task.fields.parent.summary}</span>
            </div>
          )}

          {/* Card Title/Summary */}
          <p style={{
            fontSize: "13.5px",
            fontWeight: "600",
            lineHeight: "1.4",
            color: "var(--text-main)",
            marginBottom: "12px",
            display: "-webkit-box",
            WebkitLineClamp: "2",
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {task.fields.summary}
          </p>

          {/* Time Tracking Estimation progress meter */}
          {task.fields.timetracking && task.fields.timetracking.originalEstimateSeconds > 0 && (
            <div style={{ marginBottom: "12px", background: "var(--bg-subtle)", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", fontSize: "10px", color: "var(--text-muted)" }}>
                <span>Spent: {task.fields.timetracking.timeSpent || "0h"}</span>
                <span>Est: {task.fields.timetracking.originalEstimate}</span>
              </div>
              <div style={{ height: "4px", width: "100%", background: "var(--border-subtle)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(100, Math.round((task.fields.timetracking.timeSpentSeconds / task.fields.timetracking.originalEstimateSeconds) * 100))}%`,
                  background: "var(--primary)",
                  borderRadius: "2px"
                }}></div>
              </div>
            </div>
          )}

          {/* Card Footer: Assignee & Checklist trackers */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "12px",
            borderTop: "1px solid var(--border-subtle)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Badge priority={task.fields.priority?.name} />
              
              {task.fields.subtasks && task.fields.subtasks.length > 0 && (
                <span style={{
                  fontSize: "10.5px",
                  fontWeight: "700",
                  color: "var(--text-muted)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }} title="Subtask checklist completion">
                  <span><FaCheckSquare style={{ marginRight: "4px", verticalAlign: "middle" }} /> {task.fields.subtasks.filter(s => s.statusName === "Done").length}/{task.fields.subtasks.length}</span>
                </span>
              )}
            </div>

            {task.fields.assignee ? (
              <img
                src={task.fields.assignee.avatarUrl}
                alt={task.fields.assignee.displayName}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,0.1)"
                }}
                title={`Assigned to ${task.fields.assignee.displayName}`}
              />
            ) : (
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: "1px dashed var(--text-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-dim)",
                  fontSize: "10px"
                }}
                title="Unassigned"
              >
                ?
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

// 📌 STATUS AND PRIORITY BADGES
function Badge({ status, priority }) {
  if (status) {
    const isDone = status === "Done";
    const isProgress = status === "In Progress";
    
    return (
      <span style={{
        fontSize: "11px",
        fontWeight: "700",
        padding: "3px 8px",
        borderRadius: "20px",
        backgroundColor:
          isDone ? "var(--status-done-bg)" :
          isProgress ? "var(--status-progress-bg)" : "var(--status-backlog-bg)",
        color:
          isDone ? "var(--status-done-text)" :
          isProgress ? "var(--status-progress-text)" : "var(--status-backlog-text)",
        border: "1px solid",
        borderColor:
          isDone ? "var(--status-done-border)" :
          isProgress ? "var(--status-progress-border)" : "var(--status-backlog-border)",
      }}>
        {status}
      </span>
    );
  }

  if (priority) {
    const isHigh = priority === "High";
    const isMedium = priority === "Medium";
    
    return (
      <span style={{
        fontSize: "10px",
        fontWeight: "700",
        padding: "2px 6px",
        borderRadius: "4px",
        backgroundColor:
          isHigh ? "var(--priority-high-bg)" :
          isMedium ? "var(--priority-medium-bg)" : "var(--priority-low-bg)",
        color:
          isHigh ? "var(--priority-high-text)" :
          isMedium ? "var(--priority-medium-text)" : "var(--priority-low-text)",
        border: "1px solid",
        borderColor:
          isHigh ? "var(--priority-high-border)" :
          isMedium ? "var(--priority-medium-border)" : "var(--priority-low-border)",
      }}>
        {priority}
      </span>
    );
  }

  return null;
}

// 📌 EMPTY STATE VIEW
function EmptyStateMessage({ text, showIcon }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px",
      textAlign: "center",
      height: "100%",
      gap: "12px"
    }}>
      {showIcon && <FaRegLightbulb size={36} color="var(--text-dim)" />}
      <p style={{ color: "var(--text-muted)", fontSize: "14px", maxWidth: "320px", lineHeight: "1.5" }}>
        {text}
      </p>
    </div>
  );
}

// Inline constant styles
const modalBackdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(3, 7, 18, 0.7)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000
};

const modalLabelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  color: "var(--text-muted)",
  marginBottom: "8px"
};

// ==========================================
// APNILEAP EXECUTIVE HUB COMPONENTS
// ==========================================
function HubDashboardView({ metrics, loading, onRefresh, onIngestClick, triggerToast }) {
  const [activeTab, setActiveTab] = useState("campus"); // "campus" or "b2b"

  if (loading || !metrics) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", gap: "16px" }}>
        <div style={{
          width: "48px",
          height: "48px",
          border: "4px solid rgba(45, 212, 191, 0.1)",
          borderTopColor: "var(--primary)",
          borderRadius: "50%",
        }} className="pulse-glow"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Aggregating cross-college portfolio metrics...</p>
      </div>
    );
  }

  const totalIssues = metrics.spokes.reduce((sum, s) => sum + s.total, 0);
  const totalDone = metrics.spokes.reduce((sum, s) => sum + s.done, 0);
  const globalCompletionRate = totalIssues > 0 ? Math.round((totalDone / totalIssues) * 100) : 0;
  const totalBlockers = metrics.blockers.length;

  // B2B Stats calculations
  const b2bList = metrics.b2bProjects || [];
  const totalB2BFunding = b2bList.reduce((sum, p) => {
    const val = parseInt(p.budget.replace(/[^0-9]/g, "")) || 0;
    return sum + val;
  }, 0);
  const activeB2BPlacements = b2bList.reduce((sum, p) => {
    return sum + (p.allocations ? p.allocations.filter(a => a.status === "Active").length : 0);
  }, 0);
  const proposedB2BPlacements = b2bList.reduce((sum, p) => {
    return sum + (p.allocations ? p.allocations.filter(a => a.status === "Proposed").length : 0);
  }, 0);

  // Calculate average progress percent across active placements
  let totalAllocPct = 0;
  let totalAllocCount = 0;
  b2bList.forEach(p => {
    if (p.allocations) {
      p.allocations.forEach(a => {
        if (a.status === "Active") {
          totalAllocPct += a.progressPercent || 0;
          totalAllocCount++;
        }
      });
    }
  });
  const avgB2BProgress = totalAllocCount > 0 ? Math.round(totalAllocPct / totalAllocCount) : 0;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      
      {/* Title & Header Block */}
      <div className="glass-panel" style={{
        padding: "24px",
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(45, 212, 191, 0.02))",
        border: "1px solid var(--border-glass)",
        borderRadius: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "var(--text-main)", letterSpacing: "-0.5px" }}>
            Global Executive Portfolio & Agile Hub
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
            Oversee multi-tenant academic deliverables, critical spoke escalations, and B2B corporate sponsorship allocations.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => {
              onRefresh();
              if (triggerToast) triggerToast("Switched Workspace: Live Syncing Portfolio Data...");
            }}
            className="btn-secondary"
            style={{ padding: "8px 16px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            Sync Hub
          </button>
          <span style={{
            fontSize: "11px",
            fontWeight: "800",
            background: "var(--primary-glow)",
            color: "var(--primary)",
            padding: "4px 12px",
            borderRadius: "20px",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            textTransform: "uppercase"
          }}>
            Central Administrator View
          </span>
        </div>
      </div>

      {/* Tab Switcher Navigation */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "16px" }}>
        <button
          onClick={() => setActiveTab("campus")}
          style={{
            background: activeTab === "campus" ? "var(--primary-glow)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${activeTab === "campus" ? "var(--primary)" : "var(--border-glass)"}`,
            color: activeTab === "campus" ? "var(--primary)" : "var(--text-muted)",
            padding: "10px 20px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "800",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span><span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaUniversity /> Spoke Institutions Hub</span></span>
        </button>
        <button
          onClick={() => setActiveTab("b2b")}
          style={{
            background: activeTab === "b2b" ? "var(--primary-glow)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${activeTab === "b2b" ? "var(--primary)" : "var(--border-glass)"}`,
            color: activeTab === "b2b" ? "var(--primary)" : "var(--text-muted)",
            padding: "10px 20px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "800",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span><span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><FaBriefcase /> B2B Sponsorships Portfolio</span></span>
        </button>
      </div>

      {activeTab === "campus" ? (
        <>
          {/* Portfolio Summary KPI Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px"
          }}>
            <DashboardCard
              title="Global Scoped Tasks"
              value={totalIssues}
              subtitle="Across all active spokes"
              glow={true}
            />
            <DashboardCard
              title="Consolidated Completion"
              value={`${globalCompletionRate}%`}
              subtitle="Portfolio progress rate"
              progress={globalCompletionRate}
            />
            <DashboardCard
              title="Active Escalations"
              value={totalBlockers}
              subtitle="Critical cross-college blockers"
              themeColor="var(--priority-high-text)"
              pulse={totalBlockers > 0}
              alert={totalBlockers > 0}
            />
            <DashboardCard
              title="Active Spokes"
              value="4 / 4"
              subtitle="KLE, COEP, MMCOEP, RIT"
              themeColor="var(--primary)"
            />
          </div>

          {/* College Comparison & Active Blockers Row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
            gap: "24px"
          }}>
            {/* Spokes Progress Bar Chart */}
            <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", height: "360px", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "16px" }}>
                College Spoke Progress
              </h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.spokes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 0, 0, 0.02)" }} />
                    <Bar dataKey="completionRate" name="Completion Rate" radius={[6, 6, 0, 0]}>
                      {metrics.spokes.map((entry, index) => {
                        const colors = ["#3b529a", "#0ea5e9", "#10b981", "#8b5cf6"];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Blocker Feed Panel */}
            <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", height: "360px", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--priority-high-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="pulse-glow"><FaExclamationTriangle style={{ color: "var(--accent)", marginRight: "6px" }} /> Critical Blockers & Escalations</span>
              </h3>
              
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px" }}>
                {metrics.blockers && metrics.blockers.length > 0 ? (
                  metrics.blockers.map(blocker => (
                    <div
                      key={blocker.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        background: "rgba(239, 68, 68, 0.03)",
                        border: "1px solid rgba(239, 68, 68, 0.15)",
                        borderRadius: "6px",
                        fontSize: "13px",
                        gap: "10px"
                      }}
                      className="pulse-glow"
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#f87171", background: "rgba(239, 68, 68, 0.1)", padding: "1px 6px", borderRadius: "4px" }}>
                            {blocker.key}
                          </span>
                          <span style={{ fontSize: "10px", color: "var(--text-dim)", fontWeight: "700", textTransform: "uppercase" }}>
                            {blocker.spokeName}
                          </span>
                        </div>
                        <span style={{ color: "var(--text-main)", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {blocker.summary}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", shrink: 0 }}>
                        {blocker.assignee ? (
                          <img
                            src={blocker.assignee.avatarUrl}
                            alt={blocker.assignee.displayName}
                            style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1.5px solid var(--border-glass)" }}
                            title={`Assigned to ${blocker.assignee.displayName}`}
                          />
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--text-dim)", fontStyle: "italic" }}>Unassigned</span>
                        )}
                        <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "6px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                          {blocker.priority}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontStyle: "italic", fontSize: "13px" }}>
                    <span>No cross-college blockers active. Excellent execution!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 15 Standard Workstreams Progress Matrix */}
          <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
              15 Standard Workstreams Matrix
            </h3>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid var(--border-glass)" }}>
                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", width: "40%" }}>Workstream / Standard Epic</th>
                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", textAlign: "center" }}>KLE Spoke (Live)</th>
                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", textAlign: "center" }}>COEP Spoke</th>
                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", textAlign: "center" }}>MMCOEP Spoke</th>
                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", textAlign: "center" }}>RIT Spoke</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.workstreams.map((ws, idx) => (
                    <tr
                      key={ws.name}
                      style={{
                        borderBottom: "1px solid var(--border-glass)",
                        background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                        transition: "var(--transition-smooth)"
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: "14px 16px", fontWeight: "600", color: "var(--text-main)" }}>
                        <span style={{ marginRight: "10px", color: "var(--primary)" }}>{idx + 1}.</span>
                        {ws.name}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <ProgressBadge pct={ws.KLE} />
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <ProgressBadge pct={ws.COEP} />
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <ProgressBadge pct={ws.MMCOEP} />
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <ProgressBadge pct={ws.RIT} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* B2B Specific KPI Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px"
          }}>
            <DashboardCard
              title="B2B Proposals"
              value={b2bList.length}
              subtitle="Ingested sponsor scopes"
              glow={true}
            />
            <DashboardCard
              title="Active Placements"
              value={activeB2BPlacements}
              subtitle={`${proposedB2BPlacements} proposed pending`}
              themeColor="var(--status-progress-text)"
            />
            <DashboardCard
              title="Avg B2B Milestone Progress"
              value={`${avgB2BProgress}%`}
              subtitle="Completion across Spokes"
              progress={avgB2BProgress}
              themeColor="var(--primary)"
            />
            <DashboardCard
              title="Total Committed Funding"
              value={`$${totalB2BFunding.toLocaleString()}`}
              subtitle="External FIP corporate backing"
              themeColor="#a855f7"
              glow={totalB2BFunding > 0}
            />
          </div>

          {/* 💼 Active Corporate Partnerships Tracker */}
          <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-glass)", paddingBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px", display: "inline-flex", alignItems: "center" }}><FaBriefcase /></span>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "850", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
                  Corporate Partnerships & Campus Deployments Ledger
                </h3>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  onClick={onIngestClick}
                  className="btn-primary"
                  style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", background: "#ef4444", color: "white", cursor: "pointer" }}
                >
                  <FaPlus size={10} />
                  <span>Ingest New Project</span>
                </button>
                <span style={{ fontSize: "11px", fontWeight: "750", background: "var(--primary-glow)", color: "var(--primary)", border: "1px solid var(--border-glow)", padding: "4px 10px", borderRadius: "6px", textTransform: "uppercase" }}>
                  Multi-Tenant Portfolio Tracking
                </span>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "24px"
            }}>
              {b2bList.map(proj => {
                const activeAllocations = proj.allocations ? proj.allocations.filter(a => a.status === "Active" || a.status === "Proposed") : [];
                return (
                  <div key={proj.id} className="table-row-hover" style={{
                    background: "rgba(255, 255, 255, 0.01)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "8px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    transition: "var(--transition-smooth)"
                  }}>
                    {/* Card Header: Brand, Title, Budget */}
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <CompanyLogo company={proj.company} size={38} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {proj.title}
                        </h4>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px", fontSize: "11px", color: "var(--text-dim)" }}>
                          <span>Sponsor: <strong style={{ color: "var(--text-muted)" }}>{proj.company}</strong></span>
                          <span>•</span>
                          <span>Budget: <strong style={{ color: "var(--text-muted)" }}>{proj.budget}</strong></span>
                          <span>•</span>
                          <span>Duration: <strong style={{ color: "var(--text-muted)" }}>{proj.duration}</strong></span>
                        </div>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                      {proj.description}
                    </p>

                    {/* College Spaces Tracking Grid */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-glass)", paddingTop: "14px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Institutional Deployments ({activeAllocations.length})
                      </span>

                      {activeAllocations.length > 0 ? (
                        activeAllocations.map(alloc => {
                          // Calculate days left relative to May 26, 2026
                          const today = new Date("2026-05-26");
                          const due = new Date(alloc.proposedDueDate);
                          const diffTime = due.getTime() - today.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                          let daysText;
                          let daysClassColor;
                          let daysBgColor;

                          if (diffDays < 0) {
                            daysText = `${Math.abs(diffDays)}d overdue`;
                            daysClassColor = "#ef4444";
                            daysBgColor = "rgba(239, 68, 68, 0.1)";
                          } else if (diffDays === 0) {
                            daysText = "Due Today!";
                            daysClassColor = "var(--accent)";
                            daysBgColor = "rgba(251, 146, 60, 0.15)";
                          } else if (diffDays <= 7) {
                            daysText = `${diffDays}d left`;
                            daysClassColor = "var(--accent)";
                            daysBgColor = "rgba(251, 146, 60, 0.12)";
                          } else {
                            daysText = `${diffDays} days left`;
                            daysClassColor = "var(--primary)";
                            daysBgColor = "var(--primary-glow)";
                          }

                          const isProposed = alloc.status === "Proposed";

                          return (
                            <div key={alloc.targetCampusId} style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              padding: "10px 12px",
                              background: "rgba(255, 255, 255, 0.005)",
                              border: "1px solid var(--border-glass)",
                              borderRadius: "8px"
                            }}>
                              {/* Spoke Header */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                                <span style={{ fontWeight: "700", color: "var(--text-main)" }}>
                                  <span><FaBuilding style={{ marginRight: "6px", color: "var(--primary)" }} /> {alloc.assignedTo}</span>
                                </span>
                                <span style={{
                                  fontSize: "9px",
                                  fontWeight: "900",
                                  background: isProposed ? "rgba(251, 146, 60, 0.08)" : "rgba(45, 212, 191, 0.08)",
                                  border: isProposed ? "1px solid rgba(251, 146, 60, 0.2)" : "1px solid rgba(45, 212, 191, 0.2)",
                                  color: isProposed ? "var(--accent)" : "#2dd4bf",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  textTransform: "uppercase"
                                }}>{alloc.status}</span>
                              </div>

                              {/* Spoke Timeline, Epic, and Progress */}
                              {!isProposed ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-dim)" }}>
                                    <span>Jira Epic: <strong style={{ color: "var(--text-main)", fontFamily: "var(--mono)" }}>{alloc.assignedKey || "Epic Provisioned"}</strong></span>
                                    <span style={{
                                      fontWeight: "800",
                                      color: daysClassColor,
                                      background: daysBgColor,
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontSize: "10px"
                                    }}>{daysText}</span>
                                  </div>
                                  {/* Milestone progress bar */}
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
                                    <div style={{ flex: 1, height: "6px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-glass)" }}>
                                      <div style={{
                                        width: `${alloc.progressPercent || 0}%`,
                                        height: "100%",
                                        background: "var(--primary)",
                                        borderRadius: "3px",
                                        boxShadow: "0 0 8px var(--primary)",
                                        transition: "width 0.5s cubic-bezier(0.1, 0.8, 0.1, 1)"
                                      }}></div>
                                    </div>
                                    <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--primary)", fontFamily: "var(--mono)", minWidth: "32px", textAlign: "right" }}>
                                      {alloc.progressPercent || 0}%
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: "var(--text-dim)", padding: "2px 0" }}>
                                  <span>Awaiting Coordinator Decision</span>
                                  <span>Deadline: <strong>{alloc.proposedDueDate}</strong></span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--text-dim)", fontStyle: "italic", padding: "4px 0" }}>
                          No campus spaces assigned yet.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {b2bList.length === 0 && (
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "120px", color: "var(--text-muted)", fontStyle: "italic", fontSize: "13px" }}>
                  <span>No B2B sponsorships active in the portfolio yet.</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}

function ProgressBadge({ pct }) {
  let bg = "rgba(45, 212, 191, 0.08)";
  let border = "rgba(45, 212, 191, 0.2)";
  let text = "#2dd4bf";

  if (pct < 40) {
    bg = "rgba(239, 68, 68, 0.08)";
    border = "rgba(239, 68, 68, 0.2)";
    text = "#ef4444";
  } else if (pct < 75) {
    bg = "rgba(251, 146, 60, 0.08)";
    border = "rgba(251, 146, 60, 0.2)";
    text = "#fb923c";
  }

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 10px",
      borderRadius: "6px",
      background: bg,
      border: `1px solid ${border}`,
      color: text,
      fontWeight: "700",
      fontSize: "11.5px",
      minWidth: "55px",
      fontFamily: "var(--mono)"
    }}>
      {pct}%
    </div>
  );
}

// ==========================================
// B2B MODERATOR PORTAL COMPONENTS
// ==========================================


function ProjectManagerDashboardView({ projects, loading, onRefresh, onIngestClick, sessionUser }) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", gap: "16px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading company projects...</p>
      </div>
    );
  }

  const safeProjects = projects || [];

  return (
    <div className="fade-in" style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ color: "var(--text-main)", margin: 0 }}>{sessionUser?.company || "Company"} Project Portfolio</h2>
        <button onClick={onRefresh} className="btn-secondary" style={{ padding: "6px 12px" }}>
          Refresh
        </button>
      </div>
      
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "var(--text-main)", fontSize: "16px" }}>Ingested Projects</h3>
          <button onClick={onIngestClick} className="btn-primary" style={{ padding: "8px 16px" }}>
            Ingest New Proposal
          </button>
        </div>
        
        {safeProjects.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px dashed var(--border-glass)" }}>
            <p style={{ color: "var(--text-muted)", margin: "0 0 16px 0" }}>No projects proposed yet.</p>
            <button onClick={onIngestClick} className="btn-primary">
              Propose First Project
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {safeProjects.map(proj => (
              <div key={proj.id} style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <h4 style={{ margin: "0", color: "var(--accent)", fontSize: "16px" }}>{proj.title}</h4>
                  <span style={{ fontSize: "11px", padding: "4px 8px", background: "rgba(251, 146, 60, 0.1)", color: "var(--accent)", borderRadius: "12px", fontWeight: "bold" }}>
                    {proj.status}
                  </span>
                </div>
                <p style={{ margin: "0 0 12px 0", color: "var(--text-muted)", fontSize: "13px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{proj.description}</p>
                
                <div style={{ display: "flex", gap: "16px", fontSize: "12px", marginBottom: "12px", padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: "4px" }}>
                  <span style={{ color: "var(--text-main)" }}><strong>Budget:</strong> {proj.budget}</span>
                  <span style={{ color: "var(--text-main)" }}><strong>Duration:</strong> {proj.duration}</span>
                </div>

                {proj.allocations && proj.allocations.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "4px" }}>Campus Allocations:</div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {proj.allocations.map((alloc, idx) => (
                        <span key={idx} style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(59, 130, 246, 0.1)", color: "var(--primary)", borderRadius: "4px" }}>
                          {alloc.targetCampusId} - {alloc.status}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModeratorDashboardView({ projects, loading, onRefresh, onAssignClick, onIngestClick, onEditClick, onDeleteClick }) {
  const [activeTab, setActiveTab] = useState("proposals"); // "proposals" or "deadlines"
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResults, setAuditResults] = useState(null);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", gap: "16px" }}>
        <div style={{
          width: "48px",
          height: "48px",
          border: "4px solid rgba(251, 146, 60, 0.1)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
        }} className="pulse-glow"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Synchronizing project ingestion portal...</p>
      </div>
    );
  }

  const totalProjects = projects.length;
  const assignedProjects = projects.filter(p => (p.allocations && p.allocations.length > 0) || p.status === "Proposed" || p.status === "Active" || p.status.includes("BREACHED")).length;
  const pendingProjects = totalProjects - assignedProjects;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      
      {/* Portfolio Intake KPIs */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px"
      }}>
        <DashboardCard
          title="Total Proposals"
          value={totalProjects}
          subtitle="Direct company submissions"
          glow={true}
        />
        <DashboardCard
          title="Active Allocations"
          value={assignedProjects}
          subtitle="Provisioned to campus workspaces"
          themeColor="var(--status-done-text)"
        />
        <DashboardCard
          title="Pending Moderator Review"
          value={pendingProjects}
          subtitle="Awaiting campus assignment"
          themeColor={pendingProjects > 0 ? "var(--priority-medium-text)" : "var(--text-dim)"}
          pulse={pendingProjects > 0}
        />
        <DashboardCard
          title="Avg Project Value"
          value="$26,666"
          subtitle="FIP external funding"
          themeColor="var(--primary)"
        />
      </div>

      {/* Premium Tab Switcher */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "16px" }}>
        <button
          onClick={() => setActiveTab("proposals")}
          style={{
            background: activeTab === "proposals" ? "rgba(99, 102, 241, 0.08)" : "transparent",
            border: "1px solid " + (activeTab === "proposals" ? "var(--primary)" : "var(--border-glass)"),
            color: activeTab === "proposals" ? "var(--text-main)" : "var(--text-muted)",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "12.5px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span>Ingested proposals</span>
        </button>
        <button
          onClick={() => setActiveTab("deadlines")}
          style={{
            background: activeTab === "deadlines" ? "rgba(239, 68, 68, 0.08)" : "transparent",
            border: "1px solid " + (activeTab === "deadlines" ? "#ef4444" : "var(--border-glass)"),
            color: activeTab === "deadlines" ? "var(--text-main)" : "var(--text-muted)",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "12.5px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span>Deadlines & Alerts Console</span>
        </button>
      </div>

      {activeTab === "proposals" ? (
        /* Projects Intake Glass Board */
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-main)" }}>Project Intake Board</h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px" }}>Review budget scope, and instantly automate provisioning to campus Jira spaces.</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={onIngestClick}
                className="btn-primary"
                style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", background: "#ef4444", color: "white", cursor: "pointer" }}
              >
                <FaPlus size={10} />
                <span>Ingest New Proposal</span>
              </button>
              <button onClick={onRefresh} className="btn-secondary" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaSyncAlt size={12} />
                <span style={{ fontSize: "12px" }}>Refresh Intake</span>
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid var(--border-glass)" }}>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", width: "150px" }}>Company / Partner</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700" }}>Project Details</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", width: "110px", textAlign: "center" }}>Funding</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", width: "110px", textAlign: "center" }}>Duration</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", width: "150px", textAlign: "center" }}>Status</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", width: "160px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj, idx) => {
                  const isAssigned = proj.status !== "Pending Assignment";
                  return (
                    <tr
                      key={proj.id}
                      style={{
                        borderBottom: "1px solid var(--border-glass)",
                        background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                        transition: "var(--transition-smooth)"
                      }}
                      className="table-row-hover"
                    >
                      {/* Company Column */}
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <CompanyLogo company={proj.company} size={32} />
                          <span style={{ fontWeight: "700", color: "var(--text-main)" }}>{proj.company}</span>
                        </div>
                      </td>

                      {/* Details Column */}
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontWeight: "700", color: "var(--primary)", fontSize: "14px" }}>{proj.title}</span>
                          <p style={{ color: "var(--text-muted)", fontSize: "12px", lineHeight: "1.5", margin: 0, maxWidth: "450px" }}>{proj.description}</p>
                        </div>
                      </td>

                      {/* Budget Column */}
                      <td style={{ padding: "16px", textAlign: "center", fontWeight: "700", color: "var(--primary)", fontFamily: "var(--mono)" }}>
                        {proj.budget}
                      </td>

                      {/* Duration Column */}
                      <td style={{ padding: "16px", textAlign: "center", color: "var(--text-main)", fontWeight: "500" }}>
                        {proj.duration}
                      </td>

                      {/* Status Column */}
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: proj.status.includes("BREACHED")
                            ? "rgba(239, 68, 68, 0.08)"
                            : proj.status === "Active"
                            ? "rgba(16, 185, 129, 0.08)"
                            : proj.status === "Proposed"
                            ? "rgba(99, 102, 241, 0.08)"
                            : "rgba(251, 146, 60, 0.08)",
                          border: proj.status.includes("BREACHED")
                            ? "1px solid rgba(239, 68, 68, 0.2)"
                            : proj.status === "Active"
                            ? "1px solid rgba(16, 185, 129, 0.2)"
                            : proj.status === "Proposed"
                            ? "1px solid rgba(99, 102, 241, 0.2)"
                            : "1px solid rgba(251, 146, 60, 0.2)",
                          color: proj.status.includes("BREACHED")
                            ? "#ef4444"
                            : proj.status === "Active"
                            ? "#34d399"
                            : proj.status === "Proposed"
                            ? "#818cf8"
                            : "#fb923c",
                          textTransform: "uppercase"
                        }}>
                          {proj.status.includes("BREACHED")
                            ? "Breached"
                            : proj.status === "Active"
                            ? "Active"
                            : proj.status === "Proposed"
                            ? "Proposed"
                            : "Pending Review"}
                        </span>
                      </td>

                      {/* Action Column */}
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                          {isAssigned ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase" }}>{proj.assignedTo}</span>
                              <span style={{
                                fontFamily: "var(--mono)",
                                fontSize: "11px",
                                fontWeight: "800",
                                color: proj.assignedKey ? "var(--primary)" : "#818cf8",
                                background: proj.assignedKey ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.05)",
                                padding: "2px 6px",
                                borderRadius: "4px"
                              }}>
                                {proj.assignedKey || "Awaiting Acceptance"}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => onAssignClick(proj)}
                              className="btn-primary"
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                borderRadius: "8px",
                                background: "var(--accent)",
                                borderColor: "transparent",
                                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
                                cursor: "pointer"
                              }}
                            >
                              Assign Project
                            </button>
                          )}
                          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                            <button
                              onClick={() => onEditClick(proj)}
                              style={{
                                background: "rgba(99, 102, 241, 0.08)",
                                border: "1px solid rgba(99, 102, 241, 0.15)",
                                color: "var(--primary)",
                                borderRadius: "6px",
                                padding: "4px 8px",
                                fontSize: "11px",
                                fontWeight: "750",
                                cursor: "pointer",
                                transition: "var(--transition-smooth)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--primary)";
                                e.currentTarget.style.color = "white";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)";
                                e.currentTarget.style.color = "var(--primary)";
                              }}
                            >
                              <span>Edit <FaSyncAlt style={{ marginLeft: "4px" }} /></span>
                            </button>
                            <button
                              onClick={() => onDeleteClick(proj)}
                              style={{
                                background: "rgba(239, 68, 68, 0.08)",
                                border: "1px solid rgba(239, 68, 68, 0.15)",
                                color: "#ef4444",
                                borderRadius: "6px",
                                padding: "4px 8px",
                                fontSize: "11px",
                                fontWeight: "750",
                                cursor: "pointer",
                                transition: "var(--transition-smooth)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#ef4444";
                                e.currentTarget.style.color = "white";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                                e.currentTarget.style.color = "#ef4444";
                              }}
                            >
                              <span>Delete <FaTrashAlt style={{ marginLeft: "4px" }} /></span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Deadlines & Alerts Console */
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {/* Auditor Trigger Control Card */}
          <div className="glass-panel" style={{
            padding: "24px",
            background: "linear-gradient(135deg, rgba(31, 41, 55, 0.4), rgba(17, 24, 39, 0.6))",
            border: "1.5px solid rgba(239, 68, 68, 0.15)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ maxWidth: "550px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#ef4444", display: "inline-flex", alignItems: "center" }}><FaExclamationTriangle /></span>
                  <span>Automated Deadline Auditor Scanner</span>
                </h3>
                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "6px", lineHeight: "1.5" }}>
                  Run a real-time audit across all active campus spoke spaces. The scanner checks the child deliverables progress, identifies breaches, marks project states, and prepares urgent warning email alerts for campus coordinators.
                </p>
              </div>
              <button
                onClick={async () => {
                  setAuditLoading(true);
                  try {
                    const res = await axios.post("http://localhost:5000/moderator/alerts/check");
                    setAuditResults(res.data);
                    onRefresh(); // reload projects to update their statuses
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setAuditLoading(false);
                  }
                }}
                disabled={auditLoading}
                className="btn-primary"
                style={{
                  background: "#ef4444",
                  borderColor: "transparent",
                  color: "white",
                  padding: "10px 24px",
                  borderRadius: "10px",
                  fontWeight: "700",
                  fontSize: "13px",
                  boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer"
                }}
              >
                <FaSyncAlt size={12} className={auditLoading ? "pulse-glow" : ""} />
                <span>{auditLoading ? "Auditing Ecosystem..." : "Execute Auto-Auditor Scanner"}</span>
              </button>
            </div>

            {/* Audit Output terminal panel */}
            {auditResults && (
              <div className="fade-in" style={{ marginTop: "20px" }}>
                <div style={{
                  background: "#07090e",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  fontFamily: "var(--mono)",
                  fontSize: "12px",
                  color: "#34d399",
                  maxHeight: "220px",
                  overflowY: "auto",
                  lineHeight: "1.6"
                }}>
                  <div style={{ color: "#9ca3af", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px", marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                    <span>AUDITOR CLI TERMINAL</span>
                    <span>SUCCESS</span>
                  </div>
                  <div>[baseline local time: 2026-05-27] Initiating full FIP portfolio audit...</div>
                  <div>Scanning campus spaces KLE (live), COEP (mock), MMCOEP (mock), RIT (mock)...</div>
                  <div style={{ color: "white" }}>&gt;&gt; {auditResults.message}</div>
                  {auditResults.alerts && auditResults.alerts.length > 0 ? (
                    auditResults.alerts.map((al, idx) => (
                      <div key={idx} style={{ marginTop: "8px" }}>
                        <span style={{ color: "#ef4444", fontWeight: "bold" }}>[BREACH DETECTED]</span> Project "{al.title}" assigned to {al.assignedTo} has breached deadline {al.dueDate} by {al.daysOverdue} days!
                        <div style={{ color: "#e0a82e", paddingLeft: "15px" }}>- Deliverables Completion: {al.completionRate}%</div>
                        <div style={{ color: "#8ab4f8", paddingLeft: "15px" }}>- Auto-dispatched prep SMTP warning alert to: coordinator@{al.assignedTo.split(" ")[0].toLowerCase()}.edu</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#10b981", fontWeight: "bold", marginTop: "8px" }}>[OK] No overdue FIP deadline breaches detected. All campus workspaces on track!</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active Allocations Matrix */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", marginBottom: "16px" }}>
              Active Project Allocations Matrix
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid var(--border-glass)" }}>
                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700" }}>Project Details</th>
                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", textAlign: "left" }}>Campus Deployments, Keys, Deadlines & Progress Metrics</th>
                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.filter(p => (p.allocations && p.allocations.length > 0) || p.status === "Proposed" || p.status === "Active" || p.status.includes("BREACHED")).map((proj, idx) => {
                    const activeAllocations = proj.allocations || [];
                    return (
                      <tr
                        key={proj.id}
                        style={{
                          borderBottom: "1px solid var(--border-glass)",
                          background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent"
                        }}
                      >
                        {/* Project Details */}
                        <td style={{ padding: "16px", verticalAlign: "top" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <CompanyLogo company={proj.company} size={24} />
                            <div>
                              <div style={{ fontWeight: "750", color: "var(--text-main)", fontSize: "13.5px" }}>{proj.title}</div>
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Sponsor: <strong>{proj.company}</strong> | Budget: <strong>{proj.budget}</strong></span>
                            </div>
                          </div>
                        </td>

                        {/* Multi-spoke Institution Allocations */}
                        <td colSpan={4} style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {activeAllocations.length > 0 ? (
                              activeAllocations.map(alloc => {
                                const isProposed = alloc.status === "Proposed";
                                // Calculate days left relative to May 26, 2026
                                const today = new Date("2026-05-26");
                                const due = new Date(alloc.proposedDueDate);
                                const diffTime = due.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                const isBreached = diffDays < 0;

                                return (
                                  <div key={alloc.targetCampusId} style={{
                                    display: "grid",
                                    gridTemplateColumns: "1.5fr 1fr 1.2fr 1fr 1fr",
                                    alignItems: "center",
                                    gap: "12px",
                                    background: "rgba(255, 255, 255, 0.005)",
                                    border: "1px solid var(--border-glass)",
                                    borderRadius: "8px",
                                    padding: "6px 12px"
                                  }}>
                                    {/* College space name */}
                                    <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "12px" }}>
                                      <span><FaBuilding style={{ marginRight: "6px", color: "var(--primary)" }} /> {alloc.assignedTo}</span>
                                    </div>

                                    {/* JIRA Epic Key */}
                                    <div style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: isProposed ? "var(--text-dim)" : "var(--primary)", fontWeight: "bold" }}>
                                      {alloc.assignedKey || "Awaiting Decision"}
                                    </div>

                                    {/* Target deadline */}
                                    <div style={{ fontSize: "11.5px", color: isBreached ? "#f87171" : "var(--text-muted)", fontWeight: "700" }}>
                                      <span><FaClock style={{ marginRight: "4px", verticalAlign: "middle" }} /> {alloc.proposedDueDate}</span>
                                    </div>

                                    {/* Risk/Alloc Status */}
                                    <div>
                                      <span style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        fontSize: "9.5px",
                                        fontWeight: "800",
                                        background: isBreached 
                                          ? "rgba(239, 68, 68, 0.08)" 
                                          : (isProposed ? "rgba(251, 146, 60, 0.08)" : "rgba(45, 212, 191, 0.08)"),
                                        border: isBreached 
                                          ? "1px solid rgba(239, 68, 68, 0.2)" 
                                          : (isProposed ? "1px solid rgba(251, 146, 60, 0.2)" : "1px solid rgba(45, 212, 191, 0.2)"),
                                        color: isBreached 
                                          ? "#ef4444" 
                                          : (isProposed ? "var(--accent)" : "#2dd4bf"),
                                        textTransform: "uppercase"
                                      }}>
                                        {isBreached ? "BREACHED" : (isProposed ? "PROPOSED" : "ACTIVE")}
                                      </span>
                                    </div>

                                    {/* Actions & Alerts */}
                                    <div style={{ textAlign: "right" }}>
                                      <button
                                        onClick={async () => {
                                          try {
                                            await axios.post("http://localhost:5000/moderator/alerts/check");
                                            alert(`Deadline warning notification dispatched successfully to ${alloc.assignedTo} Coordinator!`);
                                          } catch (err) {
                                            console.error(err);
                                          }
                                        }}
                                        className="btn-secondary"
                                        style={{
                                          padding: "4px 8px",
                                          fontSize: "10.5px",
                                          borderRadius: "5px",
                                          color: isBreached ? "#f87171" : "var(--text-muted)",
                                          borderColor: isBreached ? "rgba(239, 68, 68, 0.3)" : "var(--border-glass)",
                                          cursor: "pointer"
                                        }}
                                      >
                                        Alert Spoke
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <span style={{ fontSize: "12px", color: "var(--text-dim)", fontStyle: "italic", padding: "4px 0" }}>
                                No campus space deployments assigned. Click '+ Allocate Spoke' to begin.
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Assign actions column */}
                        <td style={{ padding: "16px", verticalAlign: "middle", textAlign: "center" }}>
                          <button
                            onClick={() => onAssignClick(proj)}
                            className="btn-primary"
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              borderRadius: "8px",
                              background: "var(--accent)",
                              borderColor: "transparent",
                              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
                              cursor: "pointer"
                            }}
                          >
                            + Allocate Spoke
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {projects.filter(p => (p.allocations && p.allocations.length > 0) || p.status === "Proposed" || p.status === "Active" || p.status.includes("BREACHED")).length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "var(--text-dim)" }}>
                        No active campus allocations found. Go to Ingested Proposals to allocate projects.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}



function ModeratorIngestModal({ onClose, onSuccess }) {
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestDescription, setIngestDescription] = useState("");
  const [ingestBudget, setIngestBudget] = useState("");
  const [ingestDuration, setIngestDuration] = useState("");
  const [requirementsList, setRequirementsList] = useState([""]);
  const [phasesList, setPhasesList] = useState([{ name: "", description: "", duration: "" }]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const addRequirement = () => setRequirementsList([...requirementsList, ""]);
  const updateRequirement = (index, val) => {
    const updated = [...requirementsList];
    updated[index] = val;
    setRequirementsList(updated);
  };
  const removeRequirement = (index) => {
    if (requirementsList.length > 1) {
      setRequirementsList(requirementsList.filter((_, i) => i !== index));
    }
  };

  const addPhase = () => setPhasesList([...phasesList, { name: "", description: "", duration: "" }]);
  const updatePhase = (index, field, val) => {
    const updated = [...phasesList];
    updated[index][field] = val;
    setPhasesList(updated);
  };
  const removePhase = (index) => {
    if (phasesList.length > 1) {
      setPhasesList(phasesList.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReqs = requirementsList.filter(r => r.trim());
    const finalPhases = phasesList.filter(p => p.name.trim() || p.description.trim() || p.duration.trim());

    if (!ingestTitle.trim() || !ingestDescription.trim() || !ingestBudget.trim() || !ingestDuration.trim() || finalReqs.length === 0 || finalPhases.length === 0) {
      setErrorMsg("Please fill in all the required fields, including at least one Requirement and one Phase.");
      return;
    }

    setIsIngesting(true);
    setErrorMsg("");

    try {
      const company = JSON.parse(localStorage.getItem("apnileap-user"))?.company || "NVIDIA";
      const token = localStorage.getItem("apnileap-token");
      
      const payload = {
        company: company,
        title: ingestTitle,
        description: ingestDescription,
        budget: ingestBudget,
        duration: ingestDuration,
        proposedDueDate: "2026-12-31",
        problemStatementUrl: "",
        requirements: finalReqs,
        phases: finalPhases
      };

      await axios.post("http://localhost:5000/moderator/projects", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Failed to submit proposal.");
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "white", padding: "32px", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, color: "#111827", fontSize: "20px", fontWeight: "700" }}>Propose New Project</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#6b7280" }}>&times;</button>
        </div>
        
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>Fill out the details below to submit a new project proposal for your company.</p>
        
        {errorMsg && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px", borderRadius: "6px", marginBottom: "20px", fontSize: "14px", fontWeight: "500" }}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>Project Title *</label>
            <input 
              type="text" 
              value={ingestTitle} 
              onChange={e => setIngestTitle(e.target.value)} 
              style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" }} 
              placeholder="e.g. Edge AI Agriculture System" 
            />
          </div>
          
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>Description *</label>
            <textarea 
              value={ingestDescription} 
              onChange={e => setIngestDescription(e.target.value)} 
              style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", minHeight: "80px", outline: "none", resize: "vertical", boxSizing: "border-box" }} 
              placeholder="Describe the problem and expected solution..." 
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>Budget *</label>
              <input 
                type="text" 
                value={ingestBudget} 
                onChange={e => setIngestBudget(e.target.value)} 
                style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" }} 
                placeholder="e.g. $5,000" 
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>Duration *</label>
              <input 
                type="text" 
                value={ingestDuration} 
                onChange={e => setIngestDuration(e.target.value)} 
                style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" }} 
                placeholder="e.g. 12 Weeks" 
              />
            </div>
          </div>

          <div style={{ background: "#f3f4f6", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Requirements</label>
              <button type="button" onClick={addRequirement} style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>+ Add Req</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {requirementsList.map((req, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px" }}>
                  <input 
                    type="text"
                    value={req}
                    onChange={(e) => updateRequirement(idx, e.target.value)}
                    style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", outline: "none" }}
                    placeholder="e.g. ReactJS"
                  />
                  {requirementsList.length > 1 && (
                    <button type="button" onClick={() => removeRequirement(idx)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", padding: "0 10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>&times;</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#f3f4f6", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Project Phases</label>
              <button type="button" onClick={addPhase} style={{ background: "#3b82f6", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>+ Add Phase</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {phasesList.map((phase, idx) => (
                <div key={idx} style={{ background: "white", padding: "12px", borderRadius: "6px", border: "1px solid #d1d5db", position: "relative" }}>
                  {phasesList.length > 1 && (
                    <button type="button" onClick={() => removePhase(idx)} style={{ position: "absolute", top: "8px", right: "8px", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}>&times;</button>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px", marginBottom: "8px", paddingRight: phasesList.length > 1 ? "20px" : "0" }}>
                    <input 
                      type="text" value={phase.name} onChange={e => updatePhase(idx, "name", e.target.value)}
                      placeholder="Phase Name (e.g. Database Design)" style={{ padding: "8px", borderRadius: "4px", border: "1px solid #e5e7eb", fontSize: "12px", outline: "none" }}
                    />
                    <input 
                      type="text" value={phase.duration} onChange={e => updatePhase(idx, "duration", e.target.value)}
                      placeholder="Duration (e.g. 2 Weeks)" style={{ padding: "8px", borderRadius: "4px", border: "1px solid #e5e7eb", fontSize: "12px", outline: "none" }}
                    />
                  </div>
                  <textarea 
                    value={phase.description} onChange={e => updatePhase(idx, "description", e.target.value)}
                    placeholder="Phase Description..." style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #e5e7eb", fontSize: "12px", outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: "60px" }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
            <button type="button" onClick={onClose} style={{ background: "white", color: "#374151", border: "1px solid #d1d5db", padding: "10px 20px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }} disabled={isIngesting}>
              Cancel
            </button>
            <button type="submit" style={{ background: "#2563eb", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }} disabled={isIngesting}>
              {isIngesting ? "Submitting..." : "Submit Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function MentorAssignModal({ isOpen, onClose, project, spokes, mode, setMode, globalEmail, setGlobalEmail, globalName, setGlobalName, perSpoke, setPerSpoke, isAssigning, onSubmit }) {
  const [availableMentors, setAvailableMentors] = useState([]);

  useEffect(() => {
    if (isOpen && project?.company) {
      axios.get(`http://localhost:5000/api/mentors?company=${encodeURIComponent(project.company)}`)
        .then(res => setAvailableMentors(res.data))
        .catch(err => console.error("Failed to fetch mentors", err));
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const projectSpokes = project.allocations?.map(a => a.targetCampusId) || [];
  const assignedSpokes = spokes.filter(s => projectSpokes.includes(s.id));

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
      <div style={{ width: "100%", maxWidth: "480px", padding: "24px", background: "#f8f9fa", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: "20px", position: "relative" }}>
        
        {/* Close Button */}
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" }}>
          <FaTimes />
        </button>

        {/* Header */}
        <div>
          <h3 style={{ margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", color: "#111827", fontWeight: "700" }}>
            <FaUserTie style={{ color: "#3b82f6" }} /> Assign Project Mentor
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", paddingLeft: "26px" }}>
            For: <strong style={{ color: "#3b82f6" }}>{project.company}</strong>
          </p>
        </div>

        {/* Mentor Scope */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", marginBottom: "10px", color: "#4b5563", letterSpacing: "0.5px" }}>MENTOR SCOPE</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div 
              onClick={() => setMode("global")}
              style={{ 
                background: mode === "global" ? "#1d4ed8" : "#e5e7eb", 
                color: mode === "global" ? "white" : "#4b5563",
                padding: "16px", borderRadius: "8px", cursor: "pointer", transition: "0.2s",
                display: "flex", flexDirection: "column", gap: "4px"
              }}
            >
              <FaUserTie style={{ fontSize: "18px", marginBottom: "4px" }} />
              <div style={{ fontWeight: "700", fontSize: "14px" }}>One Mentor</div>
              <div style={{ fontSize: "11px", opacity: 0.8 }}>For all spokes</div>
            </div>
            
            <div 
              onClick={() => setMode("per-spoke")}
              style={{ 
                background: mode === "per-spoke" ? "#1d4ed8" : "#e5e7eb", 
                color: mode === "per-spoke" ? "white" : "#4b5563",
                padding: "16px", borderRadius: "8px", cursor: "pointer", transition: "0.2s",
                display: "flex", flexDirection: "column", gap: "4px"
              }}
            >
              <FaBuilding style={{ fontSize: "18px", marginBottom: "4px" }} />
              <div style={{ fontWeight: "700", fontSize: "14px" }}>Per Spoke</div>
              <div style={{ fontSize: "11px", opacity: 0.8 }}>Different mentor per campus</div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        {mode === "global" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {availableMentors.length > 0 && (
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>Select Predefined Mentor (Optional)</label>
                <select 
                  onChange={e => {
                    const m = availableMentors.find(x => x.email === e.target.value);
                    if (m) {
                      setGlobalName(m.displayName);
                      setGlobalEmail(m.email);
                    }
                  }}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", color: "#111827", fontSize: "14px", outline: "none" }}
                >
                  <option value="">-- Choose a mentor --</option>
                  {availableMentors.map(m => (
                    <option key={m.email} value={m.email}>{m.displayName} ({m.email})</option>
                  ))}
                </select>
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>Or enter details manually below:</div>
              </div>
            )}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>Mentor Full Name <span style={{ color: "red" }}>*</span></label>
              <input type="text" value={globalName} onChange={e => setGlobalName(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", color: "#111827", fontSize: "14px", outline: "none" }} placeholder="e.g. Dr. Aditi Sharma" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>Mentor Email Address <span style={{ color: "red" }}>*</span></label>
              <input type="email" value={globalEmail} onChange={e => setGlobalEmail(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", color: "#111827", fontSize: "14px", outline: "none" }} placeholder="e.g. aditi.sharma@company.com" />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "200px", overflowY: "auto", paddingRight: "8px" }}>
            {assignedSpokes.map(spoke => (
              <div key={spoke.id} style={{ padding: "16px", background: "white", borderRadius: "8px", border: "1px solid #d1d5db" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px", color: "#1d4ed8" }}>{spoke.name} Campus</div>
                {availableMentors.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", marginBottom: "4px", color: "#4b5563" }}>Select Predefined Mentor</label>
                    <select 
                      onChange={e => {
                        const m = availableMentors.find(x => x.email === e.target.value);
                        if (m) {
                          setPerSpoke({ ...perSpoke, [spoke.id]: { name: m.displayName, email: m.email } });
                        }
                      }}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "4px", border: "1px solid #e5e7eb", background: "#f9fafb", color: "#111827", fontSize: "13px", outline: "none" }}
                    >
                      <option value="">-- Choose a mentor --</option>
                      {availableMentors.map(m => (
                        <option key={m.email} value={m.email}>{m.displayName} ({m.email})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", marginBottom: "4px", color: "#4b5563" }}>Mentor Name *</label>
                    <input type="text" value={perSpoke[spoke.id]?.name || ""} onChange={e => setPerSpoke({ ...perSpoke, [spoke.id]: { ...perSpoke[spoke.id], name: e.target.value } })} style={{ width: "100%", padding: "8px 10px", borderRadius: "4px", border: "1px solid #e5e7eb", background: "#f9fafb", color: "#111827", fontSize: "13px", outline: "none" }} placeholder="E.g. Dr. Aditi Sharma" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", marginBottom: "4px", color: "#4b5563" }}>Mentor Email *</label>
                    <input type="email" value={perSpoke[spoke.id]?.email || ""} onChange={e => setPerSpoke({ ...perSpoke, [spoke.id]: { ...perSpoke[spoke.id], email: e.target.value } })} style={{ width: "100%", padding: "8px 10px", borderRadius: "4px", border: "1px solid #e5e7eb", background: "#f9fafb", color: "#111827", fontSize: "13px", outline: "none" }} placeholder="e.g. aditi@company.com" />
                  </div>
                </div>
              </div>
            ))}
            {assignedSpokes.length === 0 && (
              <div style={{ fontSize: "13px", color: "#6b7280", fontStyle: "italic", textAlign: "center", padding: "20px" }}>Project is not allocated to any campus spoke yet.</div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd", padding: "12px 16px", borderRadius: "8px", display: "flex", gap: "12px", alignItems: "flex-start", marginTop: "4px" }}>
          <FaUserTie style={{ color: "#0ea5e9", marginTop: "2px", flexShrink: 0 }} />
          <div style={{ fontSize: "11px", color: "#0369a1", lineHeight: "1.5" }}>
            This person will be directly logging in using their email with Auto-credentials. The operations team will ensure all profiles exist for this project.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "16px", marginTop: "8px" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", fontSize: "13px", fontWeight: "600", cursor: "pointer" }} disabled={isAssigning}>Cancel</button>
          <button onClick={onSubmit} style={{ background: "#3b82f6", color: "white", padding: "10px 16px", borderRadius: "6px", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "0.2s" }} disabled={isAssigning}>
            <FaUserTie style={{ fontSize: "12px" }} /> {isAssigning ? "Assigning..." : "Assign Mentor \u2192"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// PROJECT MENTOR DASHBOARD VIEW
// ==========================================

function ProjectMentorDashboardView({ sessionUser, mentorAssignments, moderatorProjects, spokes, triggerToast, tasks = [] }) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "progress", "team", "deliverables", "comms"
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  // Find project based on email
  const loginEmail = sessionUser?.email?.toLowerCase()?.trim() || "";

  // Handle Notifications (moved to global App context)

  
  // Collect all projects this mentor is assigned to
  const uniqueProjectsMap = new Map();
  
  for (const [projectId, assignment] of Object.entries(mentorAssignments)) {
    const projectInfo = moderatorProjects.find(p => p.id === projectId);
    if (!projectInfo) continue;

    let isAssigned = false;
    let mData = null;
    let sScope = "none";
    let assignedSpokes = [];

    if (assignment.mode === "global" && assignment.global?.email?.toLowerCase()?.trim() === loginEmail) {
      isAssigned = true;
      mData = assignment.global;
      sScope = "global";
      assignedSpokes = projectInfo.allocations?.map(a => a.targetCampusId) || [];
    } else if (assignment.mode === "per-spoke" && assignment.perSpoke) {
      for (const [spokeId, sp] of Object.entries(assignment.perSpoke)) {
        if (sp?.email?.toLowerCase()?.trim() === loginEmail) {
          isAssigned = true;
          mData = sp;
          sScope = "per-spoke";
          assignedSpokes.push(spokeId);
        }
      }
    }

    if (isAssigned) {
      if (uniqueProjectsMap.has(projectId)) {
        const existing = uniqueProjectsMap.get(projectId);
        existing.assignedSpokes = [...new Set([...existing.assignedSpokes, ...assignedSpokes])];
        if (sScope === "global") existing.scope = "global";
      } else {
        uniqueProjectsMap.set(projectId, {
          project: projectInfo,
          mentorData: mData,
          scope: sScope,
          assignedSpokes: assignedSpokes
        });
      }
    }
  }

  const availableProjectsList = Array.from(uniqueProjectsMap.values());
  const activeProjectId = selectedProjectId || (availableProjectsList.length > 0 ? availableProjectsList[0].project.id : null);
  const currentSelection = availableProjectsList.find(p => p.project.id === activeProjectId);

  if (availableProjectsList.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-main)" }}>No Project Assigned</h2>
        <p style={{ color: "var(--text-muted)" }}>You are not currently assigned as a mentor to any active projects.</p>
      </div>
    );
  }

  const assignedProject = currentSelection.project;
  const mentorData = currentSelection.mentorData;
  const mentorSpokes = currentSelection.assignedSpokes;

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
      {/* Mentor Notifications now displayed in Global Header Bell Icon */}
      {/* Header */}
      <div className="glass-panel" style={{ padding: "24px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "24px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "10px" }}>
            <CompanyLogo company={assignedProject.company} size={32} /> Project Mentor Dashboard
          </h2>
          {availableProjectsList.length > 1 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>Select Project:</span>
              <select
                value={activeProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={{
                  background: "var(--bg-input)",
                  color: "var(--text-main)",
                  border: "1px solid var(--border-glass)",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  outline: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  minWidth: "250px"
                }}
              >
                {availableProjectsList.map(ap => (
                  <option key={ap.project.id} value={ap.project.id}>
                    {ap.project.title} ({ap.project.company})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>
              Mentoring: <strong style={{ color: "var(--text-main)" }}>{assignedProject.title}</strong> by {assignedProject.company}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "12px 20px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "var(--primary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Mentor Profile</div>
            <div style={{ fontSize: "14px", color: "var(--text-main)", fontWeight: "600", marginTop: "4px" }}>{mentorData?.name || "Project Mentor"}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "16px" }}>
        {[{ id: "overview", label: "My Project", icon: <FaChartLine /> },
          { id: "progress", label: "Spoke Progress", icon: <FaBuilding /> },
          { id: "team", label: "Team Overview", icon: <FaUsers /> },
          { id: "deliverables", label: "Deliverables", icon: <FaCheckCircle /> },
          { id: "comms", label: "Communications", icon: <FaCommentDots /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? "btn-primary" : "btn-secondary"}
            style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="glass-panel" style={{ padding: "24px", minHeight: "400px" }}>
        {activeTab === "overview" && (
          <div>
            <h3 style={{ margin: "0 0 16px 0", color: "var(--text-main)", fontSize: "18px" }}>Project Overview</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>{assignedProject.description}</p>
                <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>Budget</span>
                    <span style={{ color: "var(--text-main)", fontWeight: "600", fontSize: "13px" }}>{assignedProject.budget}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>Duration</span>
                    <span style={{ color: "var(--text-main)", fontWeight: "600", fontSize: "13px" }}>{assignedProject.duration}</span>
                  </div>
                </div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "20px", border: "1px solid var(--border-glass)" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "var(--text-main)" }}>Mentor Responsibilities</h4>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-muted)", fontSize: "13px", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <li>Review and approve weekly sprint deliverables from assigned spokes.</li>
                  <li>Provide technical guidance and answer queries from student teams.</li>
                  <li>Escalate critical blockers to the Corporate Sponsor or Hub Admin.</li>
                  <li>Evaluate final project submission against sponsor requirements.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div>
             <h3 style={{ margin: "0 0 16px 0", color: "var(--text-main)", fontSize: "18px" }}>Spoke Progress</h3>
             <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Tracking the progress of campus spokes executing this project.</p>
             <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginTop: "20px" }}>
               {(assignedProject.allocations || [])
                .filter(alloc => mentorSpokes.includes(alloc.targetCampusId) || currentSelection.scope === "global")
                .map(alloc => {
                 const spoke = spokes.find(s => s.id === alloc.targetCampusId);
                 
                 // Compute some simulated progress metrics based on task status
                 // For demo purposes, we derive progress percentage based on the spoke ID to make it look dynamic
                 const hash = alloc.targetCampusId.charCodeAt(0) + (alloc.targetCampusId.length > 1 ? alloc.targetCampusId.charCodeAt(1) : 0);
                 const percent = 20 + (hash % 60); // Generates a number between 20 and 80
                 const isCompleted = percent >= 80;

                 return (
                   <div key={alloc.targetCampusId} style={{ padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                       <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                         <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                           <FaBuilding />
                         </div>
                         <div>
                           <div style={{ color: "var(--text-main)", fontWeight: "600", fontSize: "15px" }}>{spoke?.name || alloc.targetCampusId} Campus</div>
                           <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>Allocation Status: <span style={{ color: isCompleted ? "#10b981" : "var(--primary)", fontWeight: "bold" }}>{isCompleted ? "Near Completion" : alloc.status}</span></div>
                         </div>
                       </div>
                       <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                         <FaChartLine size={12} /> View Details
                       </button>
                     </div>
                     
                     <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
                       <span>Sprint Progress</span>
                       <span style={{ fontWeight: "600", color: "var(--text-main)" }}>{percent}% Completed</span>
                     </div>
                     <div style={{ width: "100%", height: "8px", background: "var(--bg-input)", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
                       <div style={{ width: `${percent}%`, height: "100%", background: isCompleted ? "#10b981" : "var(--primary)", borderRadius: "4px", transition: "width 1s ease" }}></div>
                     </div>
                     
                     <div style={{ padding: "12px", background: "rgba(0,0,0,0.15)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                       <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase" }}>Student Team</div>
                       <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                         <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                           <img src={`https://ui-avatars.com/api/?name=Student+1&background=6366f1&color=fff`} style={{ width: "24px", height: "24px", borderRadius: "50%" }} alt="student" />
                           <span style={{ fontSize: "13px", color: "var(--text-main)" }}>Lead Developer</span>
                         </div>
                         <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                           <img src={`https://ui-avatars.com/api/?name=Student+2&background=10b981&color=fff`} style={{ width: "24px", height: "24px", borderRadius: "50%" }} alt="student" />
                           <span style={{ fontSize: "13px", color: "var(--text-main)" }}>Contributor</span>
                         </div>
                         <div style={{ fontSize: "12px", color: "var(--primary)", marginLeft: "auto", cursor: "pointer", fontWeight: "500" }}>
                           View All
                         </div>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        )}

        {activeTab === "team" && (
          <div>
            <h3 style={{ margin: "0 0 16px 0", color: "var(--text-main)", fontSize: "18px" }}>Team Overview</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Faculty mentors and student developers assigned to this project.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" }}>
              {(assignedProject.allocations || [])
                .filter(alloc => mentorSpokes.includes(alloc.targetCampusId) || currentSelection.scope === "global")
                .map(alloc => {
                  const spoke = spokes.find(s => s.id === alloc.targetCampusId);
                  const domain = spoke?.name?.toLowerCase()?.replace(/\s+/g, '') || "campus";
                  return (
                    <div key={alloc.targetCampusId} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--border-glass)", overflow: "hidden" }}>
                      <div style={{ padding: "16px", background: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
                          <FaBuilding size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "15px" }}>{spoke?.name || alloc.targetCampusId} Campus</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Development Team</div>
                        </div>
                      </div>
                      
                      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Coordinator */}
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px", letterSpacing: "0.5px" }}>Faculty Mentor</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <img src={`https://ui-avatars.com/api/?name=${spoke?.name || "Campus"}+Coordinator&background=3b82f6&color=fff`} style={{ width: "32px", height: "32px", borderRadius: "50%" }} alt="coordinator" />
                            <div>
                              <div style={{ fontSize: "14px", color: "var(--text-main)", fontWeight: "600" }}>{spoke?.name} Coordinator</div>
                              <div style={{ fontSize: "12px", color: "var(--primary)" }}>coordinator@{domain}.edu</div>
                            </div>
                          </div>
                        </div>

                        {/* Students */}
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px", letterSpacing: "0.5px" }}>Student Developers</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                              <img src={`https://ui-avatars.com/api/?name=Lead+Dev&background=6366f1&color=fff`} style={{ width: "28px", height: "28px", borderRadius: "50%" }} alt="student" />
                              <div>
                                <div style={{ fontSize: "13px", color: "var(--text-main)", fontWeight: "500" }}>Lead Developer</div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>student1@{domain}.edu</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                              <img src={`https://ui-avatars.com/api/?name=Frontend+Dev&background=10b981&color=fff`} style={{ width: "28px", height: "28px", borderRadius: "50%" }} alt="student" />
                              <div>
                                <div style={{ fontSize: "13px", color: "var(--text-main)", fontWeight: "500" }}>Frontend Contributor</div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>student2@{domain}.edu</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                              <img src={`https://ui-avatars.com/api/?name=Backend+Dev&background=f59e0b&color=fff`} style={{ width: "28px", height: "28px", borderRadius: "50%" }} alt="student" />
                              <div>
                                <div style={{ fontSize: "13px", color: "var(--text-main)", fontWeight: "500" }}>Backend Contributor</div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>student3@{domain}.edu</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              
              {(!assignedProject.allocations || assignedProject.allocations.filter(alloc => mentorSpokes.includes(alloc.targetCampusId) || currentSelection.scope === "global").length === 0) && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed var(--border-glass)" }}>
                  <FaUsers style={{ fontSize: "32px", opacity: 0.5, marginBottom: "16px" }} />
                  <h4>No Teams Assigned Yet</h4>
                  <p style={{ fontSize: "13px" }}>This project has not been allocated to any campus spokes within your mentorship scope.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "deliverables" && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <FaCheckCircle style={{ fontSize: "32px", opacity: 0.5, marginBottom: "16px" }} />
            <h3>Deliverables</h3>
            <p>Review submitted pull requests, documents, and milestones from the student teams.</p>
          </div>
        )}

        {activeTab === "comms" && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <FaCommentDots style={{ fontSize: "32px", opacity: 0.5, marginBottom: "16px" }} />
            <h3>Communications</h3>
            <p>Direct chat channel with student developers and faculty mentors for Q&A.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// CORPORATE PARTNER SPONSORSHIP PORTAL VIEW
// ==========================================

function CorporateSponsorDashboardView({ projects, loading, onRefresh, onSubmitProposal, triggerToast, sessionUser, spokes, tasks, mentorAssignments = {}, onOpenMentorModal }) {
  const [activeTab, setActiveTab] = useState("portfolio"); // "portfolio", "submit", "cohorts"
  
  // Form states
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("2026-09-15");
  const [phases, setPhases] = useState([{ name: "", description: "", duration: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", gap: "16px" }}>
        <div style={{
          width: "48px",
          height: "48px",
          border: "4px solid rgba(45, 212, 191, 0.1)",
          borderTopColor: "var(--primary)",
          borderRadius: "50%",
        }} className="pulse-glow"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Synchronizing corporate partner sponsorship portal...</p>
      </div>
    );
  }

  // Resolve company name, e.g. "NVIDIA Sponsor" -> "NVIDIA"
  const companyName = sessionUser?.displayName?.replace(" Sponsor", "") || "NVIDIA";

  // Filter B2B projects submitted by this specific sponsor's company
  const sponsorProjects = projects.filter(p => 
    p.company && p.company.toLowerCase().trim() === companyName.toLowerCase().trim()
  );

  // Sum of budget for committed funding
  const totalFunding = sponsorProjects.reduce((sum, p) => {
    const val = parseInt(p.budget.replace(/[^0-9]/g, "")) || 0;
    return sum + val;
  }, 0);

  // Campus placements (Spokes where their projects are active/assigned)
  const campusPlacements = sponsorProjects.filter(p => 
    p.allocations && p.allocations.length > 0
  ).length;

  // Fully Completed projects
  // We can calculate completion using live tasks!
  const completedProjects = sponsorProjects.filter(p => {
    const expectedSummary = `[${p.company}] ${p.title}`;
    const epicKey = p.assignedKey;
    const projTasks = tasks.filter(t => {
      const parentKey = t.fields?.parent?.key || t.parent?.key;
      const parentSummary = t.fields?.parent?.fields?.summary || t.fields?.parent?.summary || t.parent?.fields?.summary || t.parent?.summary;
      return (epicKey && parentKey === epicKey) || (parentSummary && parentSummary === expectedSummary);
    });
    if (projTasks.length === 0) return false;
    const doneT = projTasks.filter(t => (t.fields?.status?.name || t.fields?.status || "") === "Done").length;
    return doneT === projTasks.length;
  }).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !budget.trim() || !duration.trim()) {
      triggerToast("Please fill in all required fields.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitProposal({
        title,
        description,
        budget: budget.startsWith("$") ? budget : `$${budget}`,
        duration: duration.includes("Month") ? duration : `${duration} Months`,
        proposedDueDate: dueDate,
        phases: phases.filter(p => p.name.trim() !== ""),
        requirements: ["React/Node.js stack", "Weekly sprint reviews", "Agile methodologies"] // Default requirements for now
      });
      setTitle("");
      setBudget("");
      setDuration("");
      setDescription("");
      setPhases([{ name: "", description: "", duration: "" }]);
      setActiveTab("portfolio");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      
      {/* Title & Header block */}
      <div className="glass-panel" style={{
        padding: "24px",
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.02))",
        border: "1px solid var(--border-glass)",
        borderRadius: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "var(--text-main)", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: "10px" }}>
            <CompanyLogo company={companyName} size={28} />
            Corporate Partner Sponsorship Portal
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
            Propose new corporate projects, monitor active campus sponsorships, and track student engineering deliverables.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setActiveTab("submit");
              if (triggerToast) triggerToast("Switched Tab: Submit a new B2B Proposal");
            }}
            className="btn-primary"
            style={{
              padding: "8px 16px",
              fontSize: "12.5px",
              borderRadius: "8px",
              background: "#ef4444",
              borderColor: "transparent",
              color: "white",
              cursor: "pointer",
              fontWeight: "800",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)"
            }}
          >
            Propose B2B Project
          </button>
          <span style={{
            fontSize: "11px",
            fontWeight: "800",
            background: "var(--primary-glow)",
            color: "var(--primary)",
            padding: "6px 12px",
            borderRadius: "20px",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            textTransform: "uppercase"
          }}>
            <span><FaBriefcase style={{ marginRight: '6px' }} /> {companyName} Sponsor active session</span>
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px"
      }}>
        <DashboardCard
          title="Total Submissions"
          value={sponsorProjects.length}
          subtitle={`Submitted proposals by ${companyName}`}
          glow={true}
        />
        <DashboardCard
          title="Campus Placements"
          value={campusPlacements}
          subtitle="Assigned to Spoke institutions"
          themeColor="var(--status-progress-text)"
        />
        <DashboardCard
          title="Fully Completed"
          value={completedProjects}
          subtitle="Delivered by student cohorts"
          themeColor="var(--status-done-text)"
        />
        <DashboardCard
          title="Total Sponsored Funding"
          value={`$${totalFunding.toLocaleString()}`}
          subtitle="Total committed project funding"
          themeColor="#a855f7"
          glow={totalFunding > 0}
        />
      </div>

      {/* Navigation Buttons Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setActiveTab("portfolio")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: "750",
              cursor: "pointer",
              background: activeTab === "portfolio" ? "var(--primary-glow)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${activeTab === "portfolio" ? "var(--primary)" : "var(--border-glass)"}`,
              color: activeTab === "portfolio" ? "var(--primary)" : "var(--text-muted)",
              transition: "all 0.3s ease"
            }}
          >
            Active Sponsorships Tracker
          </button>
          <button
            onClick={() => setActiveTab("submit")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: "750",
              cursor: "pointer",
              background: activeTab === "submit" ? "var(--primary-glow)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${activeTab === "submit" ? "var(--primary)" : "var(--border-glass)"}`,
              color: activeTab === "submit" ? "var(--primary)" : "var(--text-muted)",
              transition: "all 0.3s ease"
            }}
          >
            Submit Corporate Project Proposal
          </button>
          <button
            onClick={() => setActiveTab("cohorts")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: "750",
              cursor: "pointer",
              background: activeTab === "cohorts" ? "var(--primary-glow)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${activeTab === "cohorts" ? "var(--primary)" : "var(--border-glass)"}`,
              color: activeTab === "cohorts" ? "var(--primary)" : "var(--text-muted)",
              transition: "all 0.3s ease"
            }}
          >
            FIP Cohort Progress
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="btn-secondary"
          style={{ padding: "8px 16px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          Synchronize Tracker
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "portfolio" && (
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800", color: "var(--text-main)" }}>
            Corporate Sponsorship Portfolio
          </h3>
          <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "var(--text-dim)" }}>
            Live real-time monitoring of campus deliveries, allocated scopes, and student milestones progress.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", color: "var(--text-main)", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-dim)" }}>
                  <th style={{ padding: "12px 8px", fontWeight: "750", width: "40%" }}>Project Details</th>
                  <th style={{ padding: "12px 8px", fontWeight: "750", width: "35%" }}>Campus Allocations, Faculty Mentors & Sprint Deadlines</th>
                  <th style={{ padding: "12px 8px", fontWeight: "750", textAlign: "right", width: "25%" }}>Live Project Completion Progress</th>
                </tr>
              </thead>
              <tbody>
                {sponsorProjects.map((proj) => {
                  const expectedSummary = `[${proj.company}] ${proj.title}`;
                  const epicKey = proj.assignedKey;
                  
                  // Filter student child tasks matching this Epic
                  const projTasks = tasks.filter(t => {
                    const parentKey = t.fields?.parent?.key || t.parent?.key;
                    const parentSummary = t.fields?.parent?.fields?.summary || t.fields?.parent?.summary || t.parent?.fields?.summary || t.parent?.summary;
                    return (epicKey && parentKey === epicKey) || (parentSummary && parentSummary === expectedSummary);
                  });

                  const totalT = projTasks.length;
                  const doneT = projTasks.filter(t => (t.fields?.status?.name || t.fields?.status || "") === "Done").length;
                  const progressPct = totalT > 0 ? Math.round((doneT / totalT) * 100) : 0;

                  const isAllocated = proj.allocations && proj.allocations.length > 0;

                  return (
                    <tr key={proj.id} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                      {/* Project Details */}
                      <td style={{ padding: "20px 8px" }}>
                        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                          <CompanyLogo company={proj.company} size={40} />
                          <div>
                            <h4 style={{ margin: "0 0 6px 0", fontSize: "14.5px", fontWeight: "800", color: "var(--text-main)" }}>
                              {proj.title}
                            </h4>
                            <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "var(--text-dim)", flexWrap: "wrap" }}>
                              <span>Sponsor: <strong>{proj.company}</strong></span>
                              <span>•</span>
                              <span>Budget: <strong>{proj.budget}</strong></span>
                              <span>•</span>
                              <span>Duration: <strong>{proj.duration}</strong></span>
                            </div>
                            <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4", maxWidth: "340px" }}>
                              {proj.description}
                            </p>
                            
                            {/* Project Mentor Assignment Button */}
                            {isAllocated && (
                              <div style={{ marginTop: "12px" }}>
                                {proj.allocations?.some(a => a.status !== "Proposed") ? (
                                  <button
                                    onClick={() => onOpenMentorModal && onOpenMentorModal(proj)}
                                    className="btn-secondary"
                                    style={{
                                      padding: "6px 12px", fontSize: "11px", borderColor: "rgba(59, 130, 246, 0.3)",
                                      color: "#3b82f6", display: "inline-flex", alignItems: "center", gap: "6px",
                                      background: "rgba(59, 130, 246, 0.05)"
                                    }}
                                  >
                                    <FaUserTie /> {mentorAssignments && mentorAssignments[proj.id] ? "Manage Mentor Assignment" : "Assign Project Mentor"}
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    title="Awaiting spoke acceptance before mentor can be assigned."
                                    className="btn-secondary"
                                    style={{
                                      padding: "6px 12px", fontSize: "11px", borderColor: "rgba(156, 163, 175, 0.3)",
                                      color: "#9ca3af", display: "inline-flex", alignItems: "center", gap: "6px",
                                      background: "rgba(156, 163, 175, 0.05)", cursor: "not-allowed"
                                    }}
                                  >
                                    <FaUserTie /> Assign Project Mentor
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Campus Allocations */}
                      <td style={{ padding: "20px 8px", verticalAlign: "middle" }}>
                        {isAllocated ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {proj.allocations.map((alloc) => {
                              const targetSpoke = spokes.find(s => s.id === alloc.targetCampusId);
                              return (
                                <div key={alloc.targetCampusId} style={{
                                  padding: "10px 14px",
                                  background: "rgba(255, 255, 255, 0.015)",
                                  border: "1px solid var(--border-glass)",
                                  borderRadius: "8px",
                                  fontSize: "12px"
                                }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "750" }}>
                                    <span style={{ color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "6px" }}><FaBuilding /> {targetSpoke?.name || "Campus Spoke"}</span>
                                    <span style={{ fontFamily: "var(--mono)", color: "var(--text-main)" }}>{alloc.assignedKey || "Key Assigned"}</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "11px", color: "var(--text-dim)" }}>
                                    <span>Milestone: <strong>{alloc.status}</strong></span>
                                    <span>Due: <strong>{proj.proposedDueDate}</strong></span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-dim)", fontSize: "12.5px" }}>
                            <span><FaClock /></span>
                            <em>Proposed. Awaiting Central Moderator assignment to active campus spokes.</em>
                          </div>
                        )}
                      </td>

                      {/* Live Progress */}
                      <td style={{ padding: "20px 8px", textAlign: "right", verticalAlign: "middle" }}>
                        {isAllocated ? (
                          <div style={{ display: "inline-flex", flexDirection: "column", gap: "6px", width: "100%", maxWidth: "180px", textAlign: "left" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px" }}>
                              <span style={{ fontWeight: "750", color: "var(--text-muted)" }}>Milestone Progress</span>
                              <strong style={{ color: "var(--primary)", fontFamily: "var(--mono)" }}>{progressPct}%</strong>
                            </div>
                            <div style={{ height: "6px", background: "rgba(255,255,255,0.03)", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-glass)" }}>
                              <div style={{ width: `${progressPct}%`, height: "100%", background: "var(--primary)", borderRadius: "3px" }} />
                            </div>
                          </div>
                        ) : (
                          <span style={{
                            fontSize: "10px",
                            fontWeight: "900",
                            background: "rgba(251, 146, 60, 0.08)",
                            color: "var(--accent)",
                            border: "1px solid rgba(251, 146, 60, 0.2)",
                            padding: "4px 10px",
                            borderRadius: "4px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}>
                            IN REVIEW
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {sponsorProjects.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: "60px 40px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", maxWidth: "400px", margin: "0 auto" }}>
                        <span style={{ fontSize: "36px", display: "inline-flex", alignItems: "center" }}><FaBriefcase /></span>
                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-main)" }}>
                          No Active Sponsorships
                        </h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                          No project proposals have been submitted by your company yet. Propose your first industry B2B project to begin campus allocations!
                        </p>
                        <button
                          onClick={() => {
                            setActiveTab("submit");
                            if (triggerToast) triggerToast("Opening Project Proposal Form...");
                          }}
                          className="btn-primary"
                          style={{
                            padding: "10px 20px",
                            fontSize: "12.5px",
                            borderRadius: "8px",
                            background: "#ef4444",
                            borderColor: "transparent",
                            color: "white",
                            cursor: "pointer",
                            fontWeight: "800",
                            boxShadow: "0 4px 15px rgba(239, 68, 68, 0.25)"
                          }}
                        >
                          Propose Your First Project
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "submit" && (
        <div className="glass-panel" style={{ padding: "30px", maxWidth: "680px" }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "850", color: "var(--text-main)" }}>
            Submit Corporate Project Proposal
          </h3>
          <p style={{ margin: "0 0 24px 0", fontSize: "13px", color: "var(--text-muted)" }}>
            Propose a new industry B2B engineering project. Central Moderators will review the proposal and assign it to student cohorts at KLE, COEP, MMCOEP, or RIT spokes.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Project Title / Scope Name *
              </label>
              <input
                type="text"
                placeholder="e.g. GPU Cloud Orchestration Engine"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-glass)",
                  color: "var(--text-main)",
                  outline: "none",
                  fontSize: "13.5px"
                }}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Budget Commitment ($) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. $45,000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-glass)",
                    color: "var(--text-main)",
                    outline: "none",
                    fontSize: "13.5px"
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Milestone Duration (Months) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6 Months"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-glass)",
                    color: "var(--text-main)",
                    outline: "none",
                    fontSize: "13.5px"
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Target Sprint Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-glass)",
                  color: "var(--text-main)",
                  outline: "none",
                  fontSize: "13.5px"
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Detailed Project Description & Deliverables *
              </label>
              <textarea
                placeholder="Describe project objectives, key phases, and student engineering outcomes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  height: "120px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-glass)",
                  color: "var(--text-main)",
                  outline: "none",
                  fontSize: "13.5px",
                  resize: "none",
                  lineHeight: "1.5"
                }}
                required
              />
            </div>

            {/* Dynamic Phases Block */}
            <div style={{ background: "rgba(0,0,0,0.1)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Project Phases (To Do Kanban Tasks)
                </label>
                <button
                  type="button"
                  onClick={() => setPhases([...phases, { name: "", description: "", duration: "" }])}
                  style={{ background: "var(--primary-glow)", border: "1px solid var(--border-glass)", color: "var(--primary)", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                >
                  + Add Phase
                </button>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {phases.map((phase, idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 40px", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder={`Phase ${idx+1} Name`}
                      value={phase.name}
                      onChange={(e) => {
                        const newPhases = [...phases];
                        newPhases[idx].name = e.target.value;
                        setPhases(newPhases);
                      }}
                      style={{ padding: "8px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--text-main)", fontSize: "12px", outline: "none" }}
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={phase.description}
                      onChange={(e) => {
                        const newPhases = [...phases];
                        newPhases[idx].description = e.target.value;
                        setPhases(newPhases);
                      }}
                      style={{ padding: "8px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--text-main)", fontSize: "12px", outline: "none" }}
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={phase.duration}
                      onChange={(e) => {
                        const newPhases = [...phases];
                        newPhases[idx].duration = e.target.value;
                        setPhases(newPhases);
                      }}
                      style={{ padding: "8px 10px", borderRadius: "6px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", color: "var(--text-main)", fontSize: "12px", outline: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (phases.length > 1) {
                          setPhases(phases.filter((_, i) => i !== idx));
                        } else {
                          setPhases([{ name: "", description: "", duration: "" }]);
                        }
                      }}
                      style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "6px", borderRadius: "6px", cursor: "pointer" }}
                    >
                      <FaTrashAlt size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                padding: "12px",
                fontSize: "13px",
                borderRadius: "8px",
                background: "#ef4444",
                border: "none",
                color: "white",
                fontWeight: "800",
                boxShadow: "0 4px 15px rgba(239, 68, 68, 0.25)",
                cursor: "pointer",
                marginTop: "10px"
              }}
            >
              {isSubmitting ? "Submitting Corporate Proposal..." : "Submit Corporate Proposal"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "cohorts" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
          {/* Spoke ranks */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "800", color: "var(--text-main)" }}>
              FIP Campus Velocity Leaderboard
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {spokes.map((spoke, idx) => {
                const medal = idx === 0 ? "1st" : idx === 1 ? "2nd" : idx === 2 ? "3rd" : "Rank";
                // Sum completions by this spoke
                const spokeTasks = tasks.filter(t => t.fields?.labels?.includes(CAMPUS_LABELS[spoke.id]));
                const done = spokeTasks.filter(t => (t.fields?.status?.name || t.fields?.status || "") === "Done").length;
                const total = spokeTasks.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 30 + (3 - idx) * 15; // default fallback if empty
                
                return (
                  <div key={spoke.id} style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.01)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "10px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14px" }}>{medal}</span>
                        <span style={{ fontSize: "12px", fontWeight: "750", color: "var(--text-main)" }}>
                          {spoke.name}
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--text-main)", fontWeight: "700" }}>
                        {done} / {total} ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "2px", overflow: "hidden", border: "1px solid var(--border-glass)" }}>
                      <div style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: idx === 0 
                          ? "#f59e0b" 
                          : (idx === 1 ? "#9ca3af" : "var(--primary)"),
                        borderRadius: "2px"
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget Commitment Pie Card */}
          <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "800", color: "var(--text-main)" }}>
                FIP Campus Budget Share
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.6" }}>
                This card represents the total budget committed by **{companyName}** across the campus spokes. Allocations are partitioned to direct-hire and hardware deployment subsidies for active B2B deliverables.
              </p>
            </div>
            
            <div style={{
              marginTop: "20px",
              padding: "16px",
              background: "rgba(99, 102, 241, 0.05)",
              border: "1px solid rgba(99, 102, 241, 0.15)",
              borderRadius: "12px",
              display: "flex",
              justifyContent: "space-between"
            }}>
              <div>
                <span style={{ display: "block", fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>Hardware Seed Subsidies</span>
                <span style={{ fontSize: "16px", fontWeight: "900", color: "var(--primary)" }}>$40,000</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>Cohort Intern Subsidies</span>
                <span style={{ fontSize: "16px", fontWeight: "900", color: "var(--accent)" }}>$110,000</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// COLLABORATIVE Sync Meetings PORTAL VIEW
// ==========================================

function MeetingsPortalView({ meetings, loading, onRefresh, spokes, triggerToast, moderatorProjects = [] }) {
  const getSpokeProjectStatus = (spokeName) => {
    const activeProjs = moderatorProjects.filter(p => p.assignedTo === spokeName && (p.status === "Active" || p.status.startsWith("Assigned") || p.status.includes("BREACHED")));
    const proposedProjs = moderatorProjects.filter(p => p.assignedTo === spokeName && p.status === "Proposed");
    
    if (activeProjs.length > 0) {
      return `Active: ${activeProjs.map(p => p.company).join(", ")}`;
    }
    if (proposedProjs.length > 0) {
      return `Proposed: ${proposedProjs.map(p => p.company).join(", ")}`;
    }
    return `Awaiting Projects`;
  };
  const [newTitle, setNewTitle] = useState("");
  const [newCampusId, setNewCampusId] = useState("3");
  const [newDate, setNewDate] = useState("2026-05-27");
  const [newTime, setNewTime] = useState("14:30");
  const [newLink, setNewLink] = useState("");
  const [newAgenda, setNewAgenda] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [remindLoading, setRemindLoading] = useState(null); // id of meeting loading reminder
  
  // Selected date filter (null means show all meetings)
  const [filterDate, setFilterDate] = useState(null);
  
  // Calendar active view month/year (initialized to May 2026 to align with default meetings)
  const [viewMonth, setViewMonth] = useState(4); // 4 = May
  const [viewYear, setViewYear] = useState(2026);
  const [activeJitsiMeeting, setActiveJitsiMeeting] = useState(null);
  const [jitsiLoading, setJitsiLoading] = useState(true);

  const isConflicted = (meet) => {
    return meetings.some(m => m.id !== meet.id && m.campusId === meet.campusId && m.date === meet.date && m.time === meet.time);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      triggerToast("Please enter a meeting title.", "warning");
      return;
    }

    const overlap = meetings.some(m => m.campusId === newCampusId && m.date === newDate && m.time === newTime);
    if (overlap) {
      triggerToast(` Schedule Conflict: There is already a sync scheduled for this campus today at ${newTime}!`, "warning");
    }

    setIsScheduling(true);
    try {
      const res = await axios.post("http://localhost:5000/meetings", {
        title: newTitle,
        campusId: newCampusId,
        date: newDate,
        time: newTime,
        link: newLink,
        agenda: newAgenda
      });

      if (res.data && res.data.success) {
        triggerToast("FIP campus sync meeting scheduled successfully!");
        setNewTitle("");
        setNewLink("");
        setNewAgenda("");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to schedule sync meeting.", "error");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSendReminder = async (meetId) => {
    setRemindLoading(meetId);
    try {
      const res = await axios.post(`http://localhost:5000/meetings/${meetId}/remind`);
      if (res.data && res.data.success) {
        triggerToast(`Reminder dispatched! Notified ${res.data.notifiedEmails.length} coordinators with ${res.data.overdueCount} overdue items and ${res.data.blockerCount} blockers.`);
        if (res.data.previewUrl) {
          console.log("\n");
          console.log("┌────────────────────────────────────────────────────────┐");
          console.log("│ 📧 APNILEAP SANDBOX OUTGOING EMAIL PREVIEW LINK        │");
          console.log("├────────────────────────────────────────────────────────┤");
          console.log(`│ LINK: \x1b[36m${res.data.previewUrl}\x1b[0m`);
          console.log("│ (Copy and paste this URL into your browser to view the  │");
          console.log("│  beautifully styled HTML warning email!)                │");
          console.log("└────────────────────────────────────────────────────────┘");
          console.log("\n");
          triggerToast(`Sandbox email ready! Link logged to browser Developer Console (F12).`, "info");
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to dispatch meeting warning reminder.", "error");
    } finally {
      setRemindLoading(null);
    }
  };

  const handleDeleteMeeting = async (meetId) => {
    if (!window.confirm("Are you sure you want to cancel and delete this scheduled sync meeting?")) {
      return;
    }
    try {
      const res = await axios.delete(`http://localhost:5000/meetings/${meetId}`);
      if (res.data && res.data.success) {
        triggerToast("Sync meeting cancelled and deleted successfully.");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to delete sync meeting.", "error");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", gap: "16px" }}>
        <div style={{
          width: "48px",
          height: "48px",
          border: "4px solid rgba(99, 102, 241, 0.1)",
          borderTopColor: "var(--primary)",
          borderRadius: "50%",
        }} className="pulse-glow"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Retrieving scheduled syncs...</p>
      </div>
    );
  }

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Total days in viewMonth/viewYear
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Index of first day (0-6)
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const formatDateString = (day) => {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getMeetingsForDate = (dateStr) => {
    return meetings.filter(m => m.date === dateStr);
  };

  const filteredMeetings = filterDate 
    ? meetings.filter(m => m.date === filterDate)
    : meetings;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", gap: "16px" }}>
        <div style={{
          width: "48px",
          height: "48px",
          border: "4px solid rgba(99, 102, 241, 0.1)",
          borderTopColor: "var(--primary)",
          borderRadius: "50%",
        }} className="pulse-glow"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Retrieving scheduled syncs...</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "30px", alignItems: "start" }}>
      
      {/* LEFT COLUMN: Meetings Timeline & Interactive Calendar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Monthly Interactive Calendar Widget */}
        <div className="glass-panel" style={{ padding: "20px", background: "var(--bg-card)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h4 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                <span>Interactive Scheduling Calendar</span>
              </h4>
              <p style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px", marginBottom: 0 }}>Click any day to select scheduling date, or filter meetings.</p>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button 
                type="button" 
                onClick={handlePrevMonth} 
                className="btn-secondary" 
                style={{ padding: "6px 10px", borderRadius: "6px", display: "flex", alignItems: "center", cursor: "pointer" }}
              >
                <FaChevronLeft size={10} />
              </button>
              <span style={{ fontSize: "13.5px", fontWeight: "800", color: "var(--text-main)", minWidth: "110px", textAlign: "center" }}>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button 
                type="button" 
                onClick={handleNextMonth} 
                className="btn-secondary" 
                style={{ padding: "6px 10px", borderRadius: "6px", display: "flex", alignItems: "center", cursor: "pointer" }}
              >
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
            {WEEKDAYS.map(day => (
              <div key={day} style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-dim)", textTransform: "uppercase", paddingBottom: "8px", letterSpacing: "0.5px" }}>
                {day}
              </div>
            ))}

            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`spacer-${idx}`} style={{ minHeight: "38px" }} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = formatDateString(dayNum);
              const dayMeetings = getMeetingsForDate(dateStr);
              const isSelected = newDate === dateStr;
              
              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => {
                    setNewDate(dateStr);
                    setFilterDate(dateStr);
                    triggerToast(`Selected ${dateStr} for scheduling! Filtering syncs list...`, "info");
                  }}
                  style={{
                    position: "relative",
                    minHeight: "38px",
                    borderRadius: "8px",
                    background: isSelected 
                      ? "#ef4444"
                      : "transparent",
                    border: "1px solid transparent",
                    color: isSelected ? "white" : "var(--text-main)",
                    fontWeight: isSelected ? "800" : "600",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "2px",
                    transition: "var(--transition-smooth)"
                  }}
                  className={!isSelected ? "calendar-day-btn" : ""}
                >
                  <span>{dayNum}</span>
                  
                  {/* Glowing Indicator Dots for Scheduled Meetings */}
                  {dayMeetings.length > 0 && (
                    <div style={{ display: "flex", gap: "2px", justifyContent: "center" }}>
                      {dayMeetings.map((m) => (
                        <div 
                          key={m.id} 
                          style={{
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            background: isSelected ? "#ffffff" : "var(--accent)",
                            boxShadow: isSelected ? "none" : "0 0 4px var(--accent)"
                          }}
                          title={m.title}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scheduled Meetings List */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>Scheduled FIP Syncs</h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px", marginBottom: 0 }}>Active sync schedules and prep reminder trigger panels.</p>
            </div>
            <button onClick={onRefresh} className="btn-secondary" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <FaSyncAlt size={12} />
              <span style={{ fontSize: "12px" }}>Refresh Syncs</span>
            </button>
          </div>

          {filterDate && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "var(--primary-glow)",
              border: "1px solid var(--border-glass)",
              marginBottom: "16px",
              fontSize: "12.5px"
            }}>
              <span style={{ color: "var(--text-main)", fontWeight: "600" }}>
                Showing {filteredMeetings.length} sync(s) scheduled for <strong style={{ color: "var(--secondary)" }}>{filterDate}</strong>
              </span>
              <button 
                type="button" 
                onClick={() => setFilterDate(null)}
                className="btn-secondary"
                style={{ padding: "4px 10px", fontSize: "11px", fontWeight: "750", cursor: "pointer" }}
              >
                Show All Syncs
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {filteredMeetings.map((meet) => {
              const spokeName = spokes.find(s => s.id === meet.campusId)?.name || "Unknown Spoke";
              const isReminderActive = remindLoading === meet.id;
              
              return (
                <div key={meet.id} className="glass-panel table-row-hover" style={{
                  padding: "20px",
                  border: "1px solid var(--border-glass)",
                  background: "var(--bg-card)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        background: "rgba(99, 102, 241, 0.1)",
                        color: "var(--primary)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        <span><FaBuilding style={{ marginRight: '6px', verticalAlign: 'middle' }} /> {spokeName}</span>
                      </span>
                      <h4 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", marginTop: "8px", marginBottom: "0" }}>
                        {meet.title}
                      </h4>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                        {isConflicted(meet) && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "800",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            color: "#ef4444"
                          }} className="pulse-glow" title="Another meeting is scheduled for this campus at the same time!">
                            <span><FaExclamationTriangle style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Conflict</span>
                          </span>
                        )}
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--primary)" }}><span><FaClock style={{ marginRight: "4px", verticalAlign: "middle" }} /> {meet.time}</span></div>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{meet.date}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                    <strong>Agenda:</strong> {meet.agenda}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "14px", marginTop: "4px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <button
                        onClick={() => {
                          setActiveJitsiMeeting(meet);
                          setJitsiLoading(true);
                        }}
                        className="btn-secondary"
                        style={{
                          fontSize: "12px",
                          color: "var(--primary)",
                          borderColor: "rgba(99, 102, 241, 0.3)",
                          background: "var(--primary-glow)",
                          fontWeight: "750",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          transition: "var(--transition-smooth)"
                        }}
                      >
                        <span><FaDesktop style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Join Sync Room (Jitsi Video)</span>
                      </button>
                      <a
                        href={meet.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "11.5px", color: "var(--text-muted)", textDecoration: "none", fontWeight: "600" }}
                      >
                        <span><FaLink style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Alternative Link</span>
                      </a>

                      <button
                        onClick={() => handleDeleteMeeting(meet.id)}
                        style={{
                          fontSize: "11.5px",
                          color: "#ef4444",
                          background: "rgba(239, 68, 68, 0.08)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          fontWeight: "750",
                          cursor: "pointer",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          marginLeft: "12px",
                          transition: "var(--transition-smooth)"
                        }}
                        title="Cancel and delete scheduled sync meeting persistently"
                      >
                        <span><FaTrashAlt style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Cancel Sync</span>
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleSendReminder(meet.id)}
                      disabled={isReminderActive}
                      className="btn-primary"
                      style={{
                        padding: "6px 14px",
                        fontSize: "11.5px",
                        borderRadius: "6px",
                        background: "#ef4444",
                        border: "none",
                        color: "white",
                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
                        cursor: "pointer"
                      }}
                    >
                      {isReminderActive ? "Relaying alerts..." : "Dispatch Prep Reminder"}
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredMeetings.length === 0 && (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }}>
                No meetings scheduled for this date. Click on the calendar or use the form to schedule a campus sync.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Schedule Form */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-main)", marginBottom: "6px" }}>
          Schedule FIP Campus Sync
        </h3>
        <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "20px" }}>
          Establish sync channels for review of sprint deliverables.
        </p>

        <form onSubmit={handleScheduleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
              Meeting Title *
            </label>
            <input
              type="text"
              required
              className="form-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. KLE Bi-weekly Sprint Sync"
              style={{ width: "100%", padding: "10px 12px", fontSize: "13px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
              Target Institution Campus *
            </label>
            <select
              className="form-select"
              required
              value={newCampusId}
              onChange={(e) => setNewCampusId(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", fontSize: "13px" }}
            >
              {spokes.map(s => {
                const status = getSpokeProjectStatus(s.name);
                return (
                  <option key={s.id} value={s.id}>
                    <span><FaBuilding style={{ marginRight: '6px', verticalAlign: 'middle' }} /> {s.name} ({s.key}) — [{status}]</span>
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                Date *
              </label>
              <input
                type="date"
                required
                className="form-input"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", fontSize: "13px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                Time *
              </label>
              <input
                type="time"
                required
                className="form-input"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", fontSize: "13px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
              Zoom / Teams Video Link
            </label>
            <input
              type="url"
              className="form-input"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https://teams.microsoft.com/l/meetup-join/..."
              style={{ width: "100%", padding: "10px 12px", fontSize: "13px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
              Sync Agenda *
            </label>
            <textarea
              required
              rows={3}
              className="form-input"
              value={newAgenda}
              onChange={(e) => setNewAgenda(e.target.value)}
              placeholder="e.g. Sprint blocker review, VLSI laboratory setup progression, and Phase 1 milestone evaluation."
              style={{ width: "100%", padding: "10px 12px", fontSize: "13px", resize: "none" }}
            />
          </div>

          <button
            type="submit"
            disabled={isScheduling}
            className="btn-primary"
            style={{
              padding: "12px",
              marginTop: "8px",
              fontWeight: "700",
              fontSize: "13px",
              background: "#ef4444",
              color: "white",
              boxShadow: "0 4px 15px rgba(239, 68, 68, 0.2)",
              cursor: "pointer"
            }}
          >
            {isScheduling ? "Creating sync..." : "Schedule Sync Meeting"}
          </button>
        </form>
      </div>

      {/* Dynamic Jitsi Video Room full-screen overlay */}
      {activeJitsiMeeting && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(3, 7, 18, 0.85)",
          backdropFilter: "blur(20px)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          boxSizing: "border-box",
        }} className="fade-in">
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border-glass)",
            padding: "12px 20px",
            borderRadius: "12px",
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "white" }}>
                <span><FaDesktop style={{ marginRight: '6px', verticalAlign: 'middle' }} /> ApniLeap Live Sync Room:</span> {activeJitsiMeeting.title}
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                Secure, borderless Jitsi collaboration room for FIP deliverables sync.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  const iframe = document.getElementById("jitsi-iframe");
                  if (iframe) {
                    if (iframe.requestFullscreen) iframe.requestFullscreen();
                    else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
                    else if (iframe.msRequestFullscreen) iframe.msRequestFullscreen();
                  }
                }}
                className="btn-secondary"
                style={{ padding: "8px 16px", cursor: "pointer", fontSize: "12.5px", fontWeight: "700" }}
              >
                <span><FaFilter style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Full Screen</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveJitsiMeeting(null)}
                className="btn-primary"
                style={{
                  padding: "8px 16px",
                  background: "#ef4444",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)"
                }}
              >
                <span><FaTimes style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Close Sync Room</span>
              </button>
            </div>
          </div>

          <div style={{
            flex: 1,
            background: "#07090e",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)",
            position: "relative"
          }}>
            {/* High-fidelity glowing loader overlay */}
            {jitsiLoading && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "#07090e",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "18px",
                zIndex: 5
              }} className="fade-in">
                <div style={{
                  width: "48px",
                  height: "48px",
                  border: "4px solid rgba(99, 102, 241, 0.1)",
                  borderTopColor: "var(--primary)",
                  borderRadius: "50%",
                }} className="pulse-glow"></div>
                <h4 style={{ color: "white", margin: 0, fontSize: "14px", fontWeight: "800", letterSpacing: "0.2px" }} className="pulse-glow">
                  Establishing Secure Sync Channel...
                </h4>
                <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "12px", textAlign: "center", maxWidth: "300px", lineHeight: "1.4" }}>
                  Initializing camera, microphone, and encryption systems.
                </p>
              </div>
            )}

            <iframe
              id="jitsi-iframe"
              src={`https://meet.jit.si/apnileap-sync-${activeJitsiMeeting.id}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true&config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_BRAND_WATERMARK=false&interfaceConfig.SHOW_POWERED_BY=false&interfaceConfig.DEFAULT_BACKGROUND='#07090e'`}
              style={{ width: "100%", height: "100%", border: "none" }}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              onLoad={() => setJitsiLoading(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default App;