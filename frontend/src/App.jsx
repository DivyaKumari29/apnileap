import { useEffect, useState, useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import axios from "axios";

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("apnileap-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.defaults.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";


// Modern Lucide-style Icon setup using React Icons Fa
import {
  FaTasks,
  FaChartPie,
  FaBell,
  FaSearch,
  FaFilter,
  FaPlus,
  FaTimes,
  FaCheck,
  FaTrashAlt,
  FaSyncAlt,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
  FaRegLightbulb,
  FaEnvelope,
  FaPaperPlane,
  FaExclamationTriangle,
  FaSun,
  FaMoon,
  FaBriefcase,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaGraduationCap,
  FaRunning
} from "react-icons/fa";
import {
  LayoutDashboard, FolderKanban, CheckCircle, Clock, Zap, Crown, Building2,
  CalendarDays, Settings, PlayCircle, PlusCircle, AlertTriangle, Monitor,
  Activity, Users, LogOut, Sun, Moon, Briefcase, Calendar, FolderHeart, FileText
} from "lucide-react";


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
import FIPProgressModal from "./components/FIPProgressModal";
import AssignMentorsModal from "./components/AssignMentorsModal";
import CreateSprintModal from "./components/CreateSprintModal";

import FacultyDashboardView from "./components/FacultyDashboardView";
import StudentDashboardView from "./components/StudentDashboardView";
import { InviteToMeetingModal } from "./components/InviteToMeetingModal";
import DocumentsView from "./components/DocumentsView";

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

const SPOKES = {
  "3": { name: "KLE Spoke", key: "PNLP", live: true },
  "101": { name: "COEP Spoke", key: "PNLP", live: true },
  "102": { name: "MMCOEP Spoke", key: "PNLP", live: true },
  "103": { name: "RIT Spoke", key: "PNLP", live: true }
};

function App() {
  // Authentication & Session States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration States
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("STUDENT");
  const [regCampusId, setRegCampusId] = useState("3");
  const [regError, setRegError] = useState("");
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Forgot Password States
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetTokenInput, setResetTokenInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Navigation & UI States
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard" or "kanban"
  const [theme, setTheme] = useState(() => localStorage.getItem("app-theme") || "dark");

  const [activeWorkspace, setActiveWorkspace] = useState("hub");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPersona, setCurrentPersona] = useState("moderator");
  const [currentUser, setCurrentUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting to Jira...");
  const [hasError, setHasError] = useState(false);

  const [hubMetrics, setHubMetrics] = useState(null);
  const [isHubLoading, setIsHubLoading] = useState(true);
  
  const [pendingUsers, setPendingUsers] = useState([]);

  const fetchPendingUsers = async () => {
    if (currentUser?.role !== "COORDINATOR") return;
    try {
      const res = await axios.get(`/api/auth/users/pending?campusId=${currentUser.campusId}`);
      setPendingUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch pending users", err);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await axios.post(`/api/auth/users/${userId}/approve`);
      triggerToast("User approved successfully!");
      fetchPendingUsers();
    } catch (err) {
      console.error("Approve user error", err);
      triggerToast("Failed to approve user.", "error");
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      await axios.post(`/api/auth/users/${userId}/reject`);
      triggerToast("User rejected and removed.", "warning");
      fetchPendingUsers();
    } catch (err) {
      console.error("Reject user error", err);
      triggerToast("Failed to reject user.", "error");
    }
  };

  // B2B Moderator Project Assignment states
  const [moderatorProjects, setModeratorProjects] = useState([]);
  const [isModeratorLoading, setIsModeratorLoading] = useState(false);
  const [selectedAssignProject, setSelectedAssignProject] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssignMentorsOpen, setIsAssignMentorsOpen] = useState(false);
  const [assignMentorsProject, setAssignMentorsProject] = useState(null);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [assignTargetCampus, setAssignTargetCampus] = useState("3");
  const [assignDueDate, setAssignDueDate] = useState("2026-08-25");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isRespondingToProject, setIsRespondingToProject] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);



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

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  // Role-Based Access Control Simulation Guard
  useEffect(() => {
    if (currentPersona !== "moderator") {
      setActiveWorkspace(currentPersona);
      setActiveView("dashboard");
    }
  }, [currentPersona]);


  // Core Data States
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tasksCache, setTasksCache] = useState({});

  const setTasksAndCache = (newTasksOrFn, boardId = currentBoardId) => {
    setTasks(prev => {
      const resolved = typeof newTasksOrFn === "function" ? newTasksOrFn(prev) : newTasksOrFn;
      setTasksCache(cache => ({ ...cache, [boardId]: resolved }));
      return resolved;
    });
  };

  const [spokeMembers, setSpokeMembers] = useState([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  // Sprints State
  const [activeSprints, setActiveSprints] = useState([]);
  const [sprintFilter, setSprintFilter] = useState("All");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterAssignee, setFilterAssignee] = useState("All");

  // Modal States & Premium Multi-tab details
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [modalTab, setModalTab] = useState("overview"); // "overview", "subtasks", "worklog", "links"
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
  const [toasts, setToasts] = useState([]);

  // Create Task Form State
  const [newSummary, setNewSummary] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIssueType, setNewIssueType] = useState("Task");
  const [newAssignee, setNewAssignee] = useState("");
  const [newReporter, setNewReporter] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newStatus, setNewStatus] = useState("Backlog");
  const [newDueDate, setNewDueDate] = useState("");

  // Trigger Toast Notification
  const triggerToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const mapEmailToPersona = (email) => {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail.endsWith("@apnileap.com") || cleanEmail === "admin" || cleanEmail === "moderator") {
      return "moderator";
    }
    if (cleanEmail.includes("nvidia") || cleanEmail.endsWith("@nvidia.com") || cleanEmail.includes("google") || cleanEmail.endsWith("@google.com") || cleanEmail.includes("intel") || cleanEmail.endsWith("@intel.com")) {
      return "company";
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

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setRegError("");

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError("Please fill in all fields.");
      return;
    }

    setIsSubmittingReg(true);
    try {
      const res = await axios.post("/api/auth/register", {
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        campusId: regCampusId
      });
      triggerToast(res.data.message);
      setIsRegistering(false); // flip back to login
      setLoginEmail(regEmail); // pre-fill email
    } catch (err) {
      setRegError(err.response?.data?.error || "Failed to register.");
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim()) {
      setLoginError("Please enter your email address.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await axios.post("/api/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });

      const { token, user } = res.data;
      
      setIsLoggingIn(false);
      setIsAuthenticated(true);
      setSessionUser(user);
      
      let persona = "moderator";
      if (user.role === "COORDINATOR") {
        if (user.campusId === "3") persona = "spoke-kle";
        else if (user.campusId === "101") persona = "spoke-coep";
        else if (user.campusId === "102") persona = "spoke-mmcoep";
        else if (user.campusId === "103") persona = "spoke-rit";
      } else if (user.role === "MENTOR") {
        persona = "faculty-dashboard";
      } else if (user.role === "STUDENT") {
        persona = "student-dashboard";
      } else if (user.role === "SPONSOR" || user.role === "COMPANY") {
        persona = "company";
      } else {
        persona = mapEmailToPersona(user.email) || "moderator";
      }

      setCurrentPersona(persona);
      setActiveWorkspace(persona === "moderator" ? "hub" : persona);

      localStorage.setItem("apnileap-token", token);
      localStorage.setItem("apnileap-auth", "true");
      localStorage.setItem("apnileap-user", JSON.stringify(user));
      localStorage.setItem("apnileap-persona", persona);

      triggerToast(`Logged in successfully as ${user.name}!`);
    } catch (err) {
      setIsLoggingIn(false);
      setLoginError(err.response?.data?.error || "Login failed. Please check your credentials.");
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) {
      triggerToast("Please enter your email.", "error");
      return;
    }
    setIsResetting(true);
    try {
      const res = await axios.post("/api/auth/forgot-password", {
        email: forgotPasswordEmail
      });
      setIsResetting(false);
      setForgotPasswordStep(2);
      // Demo Mode: Show the token in an alert!
      if (res.data.demoToken) {
        alert(`[SIMULATED EMAIL]\n\nPassword Reset Token: ${res.data.demoToken}\n\nPlease copy this token.`);
      }
      triggerToast("Reset token generated! (See alert for demo token)", "success");
    } catch (err) {
      setIsResetting(false);
      triggerToast(err.response?.data?.error || "Failed to initiate reset.", "error");
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetTokenInput.trim() || !newPasswordInput.trim()) {
      triggerToast("Please fill all fields.", "error");
      return;
    }
    setIsResetting(true);
    try {
      const res = await axios.post("/api/auth/reset-password", {
        email: forgotPasswordEmail,
        token: resetTokenInput,
        newPassword: newPasswordInput
      });
      setIsResetting(false);
      setIsForgotPasswordOpen(false);
      setForgotPasswordStep(1);
      setForgotPasswordEmail("");
      setResetTokenInput("");
      setNewPasswordInput("");
      triggerToast("Password reset successfully! You can now log in.", "success");
    } catch (err) {
      setIsResetting(false);
      triggerToast(err.response?.data?.error || "Failed to reset password.", "error");
    }
  };

  const handleQuickConnect = async (email, name, boardId, persona) => {
    let password = "spoke123";
    if (email === "admin@apnileap.com") password = "admin123";
    else if (email.includes("kle.in") || email.includes("coep.in") || email.includes("mmcoep.in") || email.includes("rit.in")) password = "faculty123";
    else if (email.includes("kle.edu") || email.includes("coep.edu") || email.includes("mmcoep.edu") || email.includes("rit.edu")) password = "student123";

    setLoginEmail(email);
    setLoginPassword(password);
    setLoginError("");
    setIsLoggingIn(true);
    
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      const { token, user } = res.data;
      
      setIsLoggingIn(false);
      setIsAuthenticated(true);
      setSessionUser(user);
      
      let finalPersona = persona;
      if (user.role === "MODERATOR") finalPersona = "moderator";
      else if (user.role === "SPONSOR") {
        if (user.campusId === "3") finalPersona = "spoke-kle";
        else if (user.campusId === "101") finalPersona = "spoke-coep";
        else if (user.campusId === "102") finalPersona = "spoke-mmcoep";
        else if (user.campusId === "103") finalPersona = "spoke-rit";
        else finalPersona = "company";
      } else if (user.role === "MENTOR") finalPersona = "faculty-dashboard";
      else if (user.role === "STUDENT") finalPersona = "student-dashboard";
      
      setCurrentPersona(finalPersona);
      setActiveWorkspace(finalPersona === "moderator" ? "hub" : finalPersona);

      localStorage.setItem("apnileap-token", token);
      localStorage.setItem("apnileap-auth", "true");
      localStorage.setItem("apnileap-user", JSON.stringify(user));
      localStorage.setItem("apnileap-persona", finalPersona);

      triggerToast(`Quick Connected as ${user.name}!`);
    } catch (err) {
      setIsLoggingIn(false);
      setLoginError(err.response?.data?.error || "Login failed via Quick Connect.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSessionUser(null);
    setCurrentPersona("moderator");
    setActiveWorkspace("hub");
    setLoginEmail("");
    setLoginPassword("");
    
    localStorage.removeItem("apnileap-auth");
    localStorage.removeItem("apnileap-user");
    localStorage.removeItem("apnileap-persona");
    setTasksCache({});
    setTasks([]);
    
    triggerToast("Logged out successfully.");
  };

  const handleSignOutWithConfirmation = () => {
    setIsSignOutConfirmOpen(true);
  };

  const fetchSpokeMembers = async (boardId, silent = false) => {
    if (!silent) setIsMembersLoading(true);
    try {
      const res = await axios.get(`/spokes/${boardId}/members`);
      setSpokeMembers(res.data);
    } catch (err) {
      console.error("Failed to retrieve campus team members:", err);
    } finally {
      setIsMembersLoading(false);
    }
  };

  // Fetch Tasks from Real API
  const fetchJiraTasks = async (silent = false, customBoardId = null) => {
    if (!silent) {
      setIsLoading(true);
      setHasError(false);
    }
    try {
      const boardIdToFetch = customBoardId || currentBoardId;
      const response = await axios.get(`/tasks?boardId=${boardIdToFetch}`);
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
            sprints: item.fields?.customfield_10020 || item.fields?.sprint ? (Array.isArray(item.fields?.customfield_10020) ? item.fields.customfield_10020 : [item.fields.sprint]) : [],
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
        setTasksAndCache(normalized, boardIdToFetch);
        setConnectionStatus(currentBoardId === "3" ? "Connected to Jira Cloud" : `Connected to Spoke (${currentBoardId})`);
        if (silent) setHasError(false);
        if (!silent) {
          triggerToast("Successfully synchronized with Live Jira API!");
        }
        return normalized;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("API Fetch Error:", error);
      setConnectionStatus("Offline - Connection Failed");
      setHasError(true);
      if (!silent) {
        triggerToast("Failed to connect to Jira backend. Make sure server is started.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Active Sprints
  const fetchSprints = async (silent = false, customBoardId = null) => {
    try {
      const boardIdToFetch = customBoardId || currentBoardId;
      const res = await axios.get(`/sprints?boardId=${boardIdToFetch}`);
      setActiveSprints(res.data || []);
    } catch (err) {
      console.error("Sprint Fetch Error:", err);
      setActiveSprints([]);
    }
  };

  // Fetch Aggregated Hub Metrics for ApniLeap
  const fetchHubMetrics = async (silent = false) => {
    if (!silent) {
      setIsHubLoading(true);
      setHasError(false);
    }
    try {
      const response = await axios.get("/hub/metrics");
      if (silent) setHasError(false);
      setHubMetrics(response.data);
      setConnectionStatus("Connected to Jira Cloud (HUB)");
    } catch (error) {
      console.error("Hub Fetch Error:", error);
      setConnectionStatus("Offline - Connection Failed");
      setHasError(true);
      if (!silent) {
        triggerToast("Failed to aggregate Hub portfolio analytics. Make sure server is started.", "error");
      }
    } finally {
      setIsHubLoading(false);
    }
  };

  // Fetch incoming B2B projects for Moderator Intake
  const fetchModeratorProjects = async (silent = false) => {
    if (!silent) {
      setIsModeratorLoading(true);
      setHasError(false);
    }
    try {
      const response = await axios.get("/moderator/projects");
      if (silent) setHasError(false);
      setModeratorProjects(response.data);
      setConnectionStatus("Connected to Ingestion Portal");
    } catch (error) {
      console.error("Moderator Projects Fetch Error:", error);
      setConnectionStatus("Offline - Connection Failed");
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
      const response = await axios.get("/meetings");
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

  // Trigger project proposal assignment (Moderator)
  const handleAssignProject = async (e) => {
    e.preventDefault();
    if (!selectedAssignProject) return;

    setIsProvisioning(true);
    try {
      const response = await axios.post("/moderator/assign", {
        projectId: selectedAssignProject.id,
        targetBoardId: assignTargetCampus,
        dueDate: assignDueDate
      });

      if (response.data && response.data.success) {
        triggerToast(`Success! Proposal sent to ${response.data.assignedTo}. Awaiting coordinator review.`);
        setIsAssignModalOpen(false);
        fetchModeratorProjects(true);
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
      const res = await axios.post(`/spoke/project/${projectId}/accept`, { targetBoardId: currentBoardId });
      if (res.data && res.data.success) {
        triggerToast("Project accepted! Jira workspace successfully provisioned with 3 standard Phase tasks!");
        fetchModeratorProjects(true);
        fetchJiraTasks(true); // Refresh Jira board immediately
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
      const res = await axios.post(`/spoke/project/${projectId}/decline`, { targetBoardId: currentBoardId });
      if (res.data && res.data.success) {
        triggerToast("Proposal declined. Project returned to the Moderator assignment pool.");
        fetchModeratorProjects(true);
      }
    } catch (err) {
      console.error("Decline Error:", err);
      triggerToast(err.response?.data?.error || "Failed to decline project assignment.", "error");
    } finally {
      setIsRespondingToProject(false);
    }
  };

  const handleAssignFacultyToProject = async (projectId, facultyName) => {
    try {
      const res = await axios.post(`/spoke/project/${projectId}/assign`, {
        targetBoardId: currentBoardId,
        facultyName
      });
      if (res.data && res.data.success) {
        triggerToast("Faculty successfully assigned to project.", "success");
        fetchModeratorProjects(true);
      }
    } catch (err) {
      console.error("Assign Faculty Error:", err);
      triggerToast(err.response?.data?.error || "Failed to assign faculty.", "error");
    }
  };

  // Re-fetch issues or hub metrics whenever activeWorkspace or currentBoardId changes
  useEffect(() => {
    fetchMeetings(true); // Fetch meetings silently to check for banner alerts
    if (activeWorkspace === "hub") {
      fetchHubMetrics(hubMetrics !== null);
    } else if (activeWorkspace === "moderator") {
      fetchModeratorProjects(moderatorProjects.length > 0);
    } else if (activeWorkspace === "company") {
      fetchModeratorProjects(moderatorProjects.length > 0);
    } else if (activeWorkspace === "meetings") {
      fetchMeetings(meetings.length > 0);
    } else {
      const cached = tasksCache[currentBoardId];
      if (cached !== undefined) {
        setTasks(cached);
        fetchJiraTasks(true); // silent background fetch
      } else {
        fetchJiraTasks(false); // blocking first-load shimmer
      }
      fetchSprints(true); // silent fetch sprints
      fetchSpokeMembers(currentBoardId, true); // silent non-blocking fetch
      fetchModeratorProjects(true); // Fetch moderator projects silently to check for proposed B2B assignments
    }
  }, [activeWorkspace, currentBoardId]);

  // On component mount, automatically fetch active session user profile
  useEffect(() => {
    const fetchMyself = async () => {
      try {
        const res = await axios.get("/myself");
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
      } else if (activeWorkspace === "company") {
        fetchModeratorProjects(true);
      } else if (activeWorkspace === "meetings") {
        fetchMeetings(true);
      } else {
        fetchJiraTasks(true);
        fetchSprints(true);
        fetchSpokeMembers(currentBoardId, true);
      }
    }, 10000); // 10s auto-polling

    return () => clearInterval(interval);
  }, [activeWorkspace, currentBoardId]);

  // Dynamically extract all unique assignees and reporters present in active task lists (Live + Mock)
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

  // Handle Search and Filter logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Exclude Epics — they are parent containers, not individual work items
      const issueType = task.fields?.issuetype?.name || task.fields?.issueType || "";
      if (issueType === "Epic") return false;

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

      let sprintMatch = true;
      if (sprintFilter !== "All") {
        if (sprintFilter === "Active Sprints") {
          const activeSprintIds = activeSprints.map(s => s.id);
          const taskSprints = task.fields.sprints || [];
          sprintMatch = taskSprints.some(s => s && s.id && activeSprintIds.includes(s.id)) || 
                        taskSprints.some(s => typeof s === 'string' && s.includes('state=ACTIVE')); // Handle string format 
        }
      }

      return textMatch && priorityMatch && assigneeMatch && sprintMatch;
    });
  }, [tasks, searchQuery, filterPriority, filterAssignee, sprintFilter, activeSprints]);

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

    return { total, backlog, progress, done, high, medium, low, overdue, completionRate };
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

  const proposedProjectsForSpoke = useMemo(() => {
    if (activeWorkspace === "hub" || activeWorkspace === "moderator" || activeWorkspace === "meetings" || activeWorkspace === "playground") return [];
    const campusId = currentBoardId;
    const spoke = SPOKES[campusId];
    if (!spoke) return [];
    // ONLY use allocations[] — root-level targetCampusId is unreliable for multi-campus projects
    return moderatorProjects.filter(p =>
      Array.isArray(p.allocations) &&
      p.allocations.some(a => a.targetCampusId === campusId && a.status === "Proposed")
    );
  }, [moderatorProjects, activeWorkspace, currentBoardId]);

  const acceptedProjectsForSpoke = useMemo(() => {
    if (activeWorkspace === "hub" || activeWorkspace === "moderator" || activeWorkspace === "meetings" || activeWorkspace === "playground") return [];
    const campusId = currentBoardId;
    // ONLY use allocations[] — root-level targetCampusId is unreliable for multi-campus projects
    return moderatorProjects.filter(p =>
      Array.isArray(p.allocations) &&
      p.allocations.some(a => a.targetCampusId === campusId && a.status === "Active")
    );
  }, [moderatorProjects, activeWorkspace, currentBoardId]);

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
    if (currentPersona === "moderator") {
      triggerToast("Access Denied: Moderators have read-only progress tracking permission on spoke boards.", "error");
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
    setTasksAndCache(prevTasks => {
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
    axios.post(`/tasks/${taskKey}/transition`, { statusName: newStatus })
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

    // Close modal instantly and notify user
    setIsCreateOpen(false);
    triggerToast("Creating task in Jira...", "info");
    try {
      const res = await axios.post("/tasks", payload);
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
      
      // Silent fetch from Jira to update board
      await fetchJiraTasks(true);
    } catch (err) {
      console.error("Create issue error:", err);
      triggerToast("Failed to create issue in Jira.", "error");
    }
  };

  // Update Task fields inside Modal with live PUT to Jira
  const handleUpdateTaskDetail = async (updatedTask, changedField) => {
    // Optimistic update
    setTasksAndCache(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setSelectedTask(updatedTask);

    try {
      if (changedField === "status") {
        triggerToast(`Transitioning ${updatedTask.key} to ${updatedTask.fields.status.name} in Jira...`);
        await axios.post(`/tasks/${updatedTask.key}/transition`, { statusName: updatedTask.fields.status.name });
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
        await axios.put(`/tasks/${updatedTask.key}`, payload);
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
    setTasksAndCache(prev => prev.map(t => {
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
      await axios.put(`/tasks/${task.key}/flag`, { flagged: nextFlagged });
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
    
    try {
      triggerToast(`Logging ${timeSpentString} spent time to issue ${taskKey} in Jira...`);
      await axios.post(`/tasks/${taskKey}/worklog`, { timeSpent: timeSpentString, comment: logComment });
      triggerToast(`Successfully logged ${timeSpentString} to issue ${taskKey}!`);
      
      setWorklogTimeSpent("");
      setWorklogComment("");
      
      // Refetch worklogs immediately for the modal history
      const logsRes = await axios.get(`/tasks/${taskKey}/worklog`);
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
    }
  };

  // Retrieve worklogs list for detail modal history
  const fetchWorklogHistory = async (taskKey) => {
    setIsHistoryLoading(true);
    try {
      const res = await axios.get(`/tasks/${taskKey}/worklog`);
      setWorklogHistory(res.data || []);
    } catch (err) {
      console.error("Fetch worklogs error:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Create a child subtask inside Jira parent issue
  const handleCreateSubtask = async (parentKey, subtaskSummary, assigneeId = null, parentIssueType = null) => {
    if (!subtaskSummary.trim()) {
      triggerToast("Please enter a task summary", "warning");
      return;
    }
    
    try {
      const isEpic = parentIssueType && parentIssueType.toLowerCase() === "epic";
      const label = isEpic ? "child task" : "child subtask";
      triggerToast(`Creating ${label} under ${parentKey} in Jira...`);
      
      await axios.post(`/tasks/${parentKey}/subtask`, {
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
    }
  };

  // Link two tickets on the board in Jira
  const handleLinkIssues = async (sourceKey, targetKey, relationType) => {
    if (!targetKey) {
      triggerToast("Please select a target issue to link with", "warning");
      return;
    }
    
    try {
      triggerToast(`Linking issue ${sourceKey} to ${targetKey} in Jira...`);
      await axios.post(`/tasks/links`, { linkType: relationType, sourceKey, targetKey });
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
    }
  };

  // Update Custom labels string array in Jira
  const handleUpdateLabels = async (taskKey, newLabelsArray) => {
    try {
      // 1. Optimistic update
      setTasksAndCache(prev => prev.map(t => {
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

      await axios.put(`/tasks/${taskKey}/labels`, { labels: newLabelsArray });
      triggerToast(`Saved tags for ${taskKey} in Jira!`);
    } catch (err) {
      console.error(err);
      triggerToast("Failed to save labels in Jira.", "error");
      await fetchJiraTasks(true);
    }
  };

  // Delete Task Action from Jira
  const handleDeleteTask = async (taskId, taskKey) => {
    // 1. Optimistic update
    setTasksAndCache(prev => prev.filter(t => t.key !== taskKey));
    setSelectedTask(null);
    try {
      triggerToast(`Deleting issue ${taskKey} from Jira...`, "warning");
      await axios.delete(`/tasks/${taskKey}`);
      triggerToast(`Permanently deleted issue ${taskKey} from Jira!`, "warning");
      await fetchJiraTasks(true);
    } catch (err) {
      console.error("Delete Task API Error:", err);
      const jiraErr = err.response?.data?.details?.errorMessages?.[0] || err.response?.data?.message || null;
      if (jiraErr) {
        triggerToast(`Jira Error: ${jiraErr}`, "error");
      } else {
        triggerToast(`Failed to delete issue ${taskKey} in Jira. Reverting...`, "error");
      }
      await fetchJiraTasks(true);
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
      axios.post("/tasks/send-reminder", payload)
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
    background: isDraggingOver ? "rgba(99, 102, 241, 0.08)" : "rgba(11, 15, 26, 0.4)",
    border: isDraggingOver ? "1.5px dashed var(--primary)" : "1.5px solid var(--border-glass)",
    borderRadius: "14px",
    padding: "16px",
    minHeight: "550px",
    transition: "var(--transition-smooth)",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  });

  if (!isAuthenticated) {


    return (
      <>
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
          background: "rgba(34, 211, 238, 0.1)",
          borderRadius: "50%",
          filter: "blur(90px)",
          pointerEvents: "none",
          zIndex: 1
        }} />

        {/* Global theme selection toggle overlay */}
        <div style={{
          position: "absolute",
          top: "36px",
          right: "36px",
          display: "flex",
          alignItems: "center",
          background: "var(--bg-card)",
          border: "1px solid var(--border-glass)",
          padding: "6px",
          borderRadius: "99px",
          boxShadow: "var(--shadow-premium)",
          zIndex: 100
        }}>
          {[
            { name: "dark", label: "Dark", icon: <FaMoon size={18} /> },
            { name: "light", label: "Light", icon: <FaSun size={18} /> }
          ].map(t => (
            <button
              key={t.name}
              type="button"
              onClick={() => setTheme(t.name)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 22px",
                borderRadius: "99px",
                background: theme === t.name ? "linear-gradient(135deg, var(--primary), var(--secondary))" : "transparent",
                color: theme === t.name ? "var(--text-primary-btn)" : "var(--text-muted)",
                border: "none",
                cursor: "pointer",
                fontWeight: "800",
                fontSize: "15px",
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
            background: "linear-gradient(135deg, rgba(13, 148, 136, 0.85), rgba(8, 145, 178, 0.9))",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px",
            borderRight: "1px solid var(--border-glass)"
          }}>
            {/* Embedded overlapping gradient 3D Spheres */}
            <div className="login-sphere sphere-1" style={{ top: "-60px", left: "-60px" }} />
            <div className="login-sphere sphere-2" style={{ bottom: "-80px", right: "-40px" }} />
            <div className="login-sphere sphere-3" style={{ top: "35%", left: "30%" }} />
            
            <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: "18px" }}>
              <div style={{
                background: "white",
                width: "60px",
                height: "60px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                color: "#0d9488",
                fontSize: "28px",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)"
              }}>
                AL
              </div>
              <span style={{ fontSize: "42px", fontWeight: "900", letterSpacing: "-0.5px", color: "white" }}>
                ApniLeap <span style={{ opacity: 0.85, fontWeight: "400" }}>Hub</span>
              </span>
            </div>

            {/* Core welcome text matching reference picture layout */}
            <div style={{ position: "relative", zIndex: 10, margin: "auto 0" }}>
              <h1 style={{
                fontSize: "72px",
                fontWeight: "900",
                color: "white",
                lineHeight: "1.1",
                letterSpacing: "-1.5px",
                margin: "0 0 16px 0"
              }}>
                WELCOME
              </h1>
              <h2 style={{
                fontSize: "30px",
                fontWeight: "700",
                color: "rgba(255, 255, 255, 0.9)",
                textTransform: "uppercase",
                letterSpacing: "3px",
                marginBottom: "32px"
              }}>
                Campus Governance Portal
              </h2>
              <p style={{
                fontSize: "21px",
                color: "rgba(255, 255, 255, 0.8)",
                lineHeight: "1.65",
                fontWeight: "400",
                maxWidth: "640px",
                margin: "0 0 45px 0"
              }}>
                A robust multi-tenant Agile collaboration suite powered by live Jira Cloud. Experience absolute campus workspace isolation with central Moderator ingestion pathways.
              </p>
            </div>

            {/* Footer trademark or copyright */}
            <div style={{ position: "relative", zIndex: 10 }}>
              <span style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.6)", fontWeight: "500" }}>
                Powered by Jira Cloud API Integration
              </span>
            </div>
          </div>

          {/* Right panel: Modern Sign In form with icons and show password */}
          <div style={{
            flex: "1 1 45%",
            maxWidth: "45%",
            padding: "60px 80px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: "var(--bg-main)",
            position: "relative",
            minHeight: "100vh"
          }}>
            <div style={{ maxWidth: "540px", width: "100%", margin: "0 auto" }}>
              <div style={{ marginBottom: "38px" }}>
                <h3 style={{ fontSize: "46px", fontWeight: "800", color: "var(--text-main)", marginBottom: "12px", letterSpacing: "-0.5px" }}>
                  Sign In
                </h3>
                <p style={{ fontSize: "20px", color: "var(--text-muted)" }}>
                  Enter your campus spoke or administrative email to connect.
                </p>
              </div>
              
              {isRegistering ? (
              <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {regError && (
                  <div style={{ padding: "18px 22px", borderRadius: "14px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "12px" }}>
                    ️ {regError}
                  </div>
                )}
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>Full Name</label>
                  <input type="text" placeholder="John Doe" value={regName} onChange={(e) => setRegName(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "10px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-main)", outline: "none", fontSize: "16px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>Email Address</label>
                  <input type="email" placeholder="john@university.edu" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "10px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-main)", outline: "none", fontSize: "16px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>Password</label>
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "10px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-main)", outline: "none", fontSize: "16px" }} />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>Role</label>
                    <select value={regRole} onChange={(e) => setRegRole(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "10px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-main)", outline: "none", fontSize: "16px" }}>
                      <option value="STUDENT">Student</option>
                      <option value="MENTOR">Faculty / Mentor</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>Campus</label>
                    <select value={regCampusId} onChange={(e) => setRegCampusId(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "10px", background: "var(--bg-input)", border: "1px solid var(--border-glass)", color: "var(--text-main)", outline: "none", fontSize: "16px" }}>
                      <option value="3">KLE Tech</option>
                      <option value="101">COEP Pune</option>
                      <option value="102">MMCOEP</option>
                      <option value="103">RIT</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={isSubmittingReg} style={{ marginTop: "10px", padding: "16px", borderRadius: "10px", background: "var(--primary)", color: "var(--text-primary-btn)", border: "none", fontWeight: "800", fontSize: "18px", cursor: isSubmittingReg ? "not-allowed" : "pointer" }}>
                  {isSubmittingReg ? "Submitting..." : "Sign Up"}
                </button>
                <div style={{ textAlign: "center", marginTop: "10px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Already have an account? </span>
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(false); }} style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>Sign In</a>
                </div>
              </form>
            ) : (
            <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {loginError && (
                <div style={{
                  padding: "18px 22px",
                  borderRadius: "14px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#ef4444",
                  fontSize: "18px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  ️ {loginError}
                </div>
              )}

              {/* Email Input Field */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "17px",
                  fontWeight: "800",
                  color: "var(--text-muted)",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px"
                }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <FaEnvelope style={{
                    position: "absolute",
                    left: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-dim)",
                    fontSize: "21px"
                  }} />
                  <input
                    type="email"
                    placeholder="user@campus.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "18px 90px 18px 56px",
                      borderRadius: "14px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-glass)",
                      color: "var(--text-main)",
                      outline: "none",
                      fontSize: "20px",
                      transition: "var(--transition-smooth)"
                    }}
                  />
                </div>
              </div>

              {/* Password Input Field */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "17px",
                  fontWeight: "800",
                  color: "var(--text-muted)",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px"
                }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <FaLock style={{
                    position: "absolute",
                    left: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-dim)",
                    fontSize: "21px"
                  }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "18px 90px 18px 56px",
                      borderRadius: "14px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-glass)",
                      color: "var(--text-main)",
                      outline: "none",
                      fontSize: "20px",
                      transition: "var(--transition-smooth)"
                    }}
                  />
                  {/* SHOW / HIDE Password button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "22px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: "15px",
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "18px", color: "var(--text-muted)", marginTop: "4px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input type="checkbox" style={{ accentColor: "var(--primary)", width: "18px", height: "18px" }} />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" onClick={(e) => { 
                  e.preventDefault(); 
                  setIsForgotPasswordOpen(true); 
                  setForgotPasswordStep(1);
                  setForgotPasswordEmail(loginEmail);
                }} style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>
                  Forgot Password?
                </a>
              </div>

              {/* Submit Sign In button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                style={{
                  marginTop: "16px",
                  padding: "18px 30px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                  color: "var(--text-primary-btn)",
                  border: "none",
                  fontWeight: "800",
                  fontSize: "22px",
                  cursor: isLoggingIn ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 15px var(--primary-glow)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  opacity: isLoggingIn ? 0.8 : 1,
                  transition: "var(--transition-smooth)"
                }}
              >
                {isLoggingIn ? (
                  <>
                    <FaSyncAlt className="pulse-glow" style={{ animation: "pulseGlow 1.5s infinite linear", fontSize: "22px" }} />
                    <span>Connecting to Live Jira Hub...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span></span>
                  </>
                )}
              </button>
              
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "16px" }}>Don't have an account? </span>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(true); }} style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none", fontSize: "16px" }}>Sign Up</a>
              </div>
            </form>
            )}
            </div> {/* Closing the maxWidth wrapper */}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "var(--bg-panel)",
            padding: "30px",
            borderRadius: "16px",
            width: "400px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            border: "1px solid var(--border-color)",
            position: "relative"
          }}>
            <button 
              onClick={() => setIsForgotPasswordOpen(false)}
              style={{
                position: "absolute", top: "15px", right: "15px",
                background: "transparent", border: "none",
                color: "var(--text-muted)", cursor: "pointer", fontSize: "18px"
              }}
            >
              <FaTimes />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "var(--text-primary)" }}>
              {forgotPasswordStep === 1 ? "Reset Password" : "Enter Token"}
            </h3>
            
            {forgotPasswordStep === 1 ? (
              <form onSubmit={handleForgotPasswordSubmit}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>Email Address</label>
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "8px",
                      background: "var(--bg-main)", border: "1px solid var(--border-color)",
                      color: "var(--text-primary)", boxSizing: "border-box"
                    }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isResetting}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "8px",
                    background: "var(--primary)", color: "white",
                    border: "none", fontWeight: "bold", cursor: isResetting ? "not-allowed" : "pointer",
                    opacity: isResetting ? 0.7 : 1
                  }}
                >
                  {isResetting ? "Generating Token..." : "Send Reset Token"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>Reset Token</label>
                  <input
                    type="text"
                    value={resetTokenInput}
                    onChange={(e) => setResetTokenInput(e.target.value)}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "8px",
                      background: "var(--bg-main)", border: "1px solid var(--border-color)",
                      color: "var(--text-primary)", boxSizing: "border-box"
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>New Password</label>
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "8px",
                      background: "var(--bg-main)", border: "1px solid var(--border-color)",
                      color: "var(--text-primary)", boxSizing: "border-box"
                    }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isResetting}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "8px",
                    background: "var(--primary)", color: "white",
                    border: "none", fontWeight: "bold", cursor: isResetting ? "not-allowed" : "pointer",
                    opacity: isResetting ? 0.7 : 1
                  }}
                >
                  {isResetting ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      </>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      
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

      {/* SIDEBAR COMPONENT */}
      <aside
        style={{
          width: isSidebarCollapsed ? "80px" : "280px",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-glass)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          transition: "var(--transition-smooth)",
          zIndex: 10,
        }}
      >
        {/* Sidebar Header / Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          {!isSidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                color: "white",
                fontSize: "18px"
              }}>
                DB
              </div>
              <span style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px" }}>
                Dashboard
              </span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: isSidebarCollapsed ? "center" : "auto",
              margin: isSidebarCollapsed ? "0 auto" : "0"
            }}
          >
            {isSidebarCollapsed ? <FaChevronRight size={18} /> : <FaChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          
          {/* Multi-Tenant Persona Access Controller (Admin Only) */}
          {!isSidebarCollapsed && sessionUser && sessionUser.role === "Central Moderator" && (
            <div className="glass-panel" style={{
              padding: "12px 14px",
              marginBottom: "12px",
              background: theme === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(13, 148, 136, 0.03)",
              border: "1px solid var(--border-glass)",
              borderRadius: "12px",
              marginTop: "4px"
            }}>
              <label style={{
                display: "block",
                fontSize: "9px",
                fontWeight: "900",
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "8px"
              }}>
                Active Profile Role
              </label>
              <select
                value={currentPersona}
                onChange={(e) => {
                  const newPersona = e.target.value;
                  setCurrentPersona(newPersona);
                  const name = newPersona === "moderator" ? "Central Moderator" : newPersona === "company" ? "Corporate Sponsor (NVIDIA)" : SPOKES[newPersona.replace("spoke-", "")]?.name;
                  if (newPersona === "company") {
                    setActiveWorkspace("company");
                  } else {
                    setActiveWorkspace(newPersona === "moderator" ? "hub" : newPersona);
                  }
                  triggerToast(`Switched Profile: Active permissions set to ${name}`);
                }}
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-glass)",
                  color: "var(--text-main)",
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
                <option value="moderator">Central Moderator (Full)</option>
                <option value="company">Corporate Sponsor (NVIDIA)</option>
                <option value="spoke-kle">KLE Coordinator (Private)</option>
                <option value="spoke-coep">COEP Coordinator (Private)</option>
                <option value="spoke-mmcoep">MMCOEP Coordinator (Private)</option>
                <option value="spoke-rit">RIT Coordinator (Private)</option>
              </select>
            </div>
          )}

          {/* Section 1: ACTIVE VIEW MODE (Only shown for Spokes and Playground) */}
          {(activeWorkspace === "playground" || activeWorkspace?.startsWith("spoke-")) && (
            <>
              <div style={{ fontSize: "9px", fontWeight: "850", textTransform: "uppercase", color: "var(--text-dim)", letterSpacing: "1px", paddingLeft: "12px", marginTop: "8px", marginBottom: "4px" }}>
                {!isSidebarCollapsed && "View Mode"}
              </div>
              <SidebarNavItem
                active={activeView === "dashboard"}
                icon={<FaChartPie size={16} />}
                label="Analytics Dashboard"
                collapsed={isSidebarCollapsed}
                onClick={() => setActiveView("dashboard")}
              />
              <SidebarNavItem
                active={activeView === "kanban"}
                icon={<FaTasks size={16} />}
                label="Kanban Board"
                collapsed={isSidebarCollapsed}
                onClick={() => setActiveView("kanban")}
              />
              <SidebarNavItem
                active={activeView === "projects"}
                icon={<FaBriefcase size={16} />}
                label="Project Portfolio"
                collapsed={isSidebarCollapsed}
                onClick={() => setActiveView("projects")}
              />
              {currentUser?.role === "COORDINATOR" && (
                <SidebarNavItem
                  active={activeView === "approvals"}
                  icon={<FaUsers size={16} />}
                  label="Approve Student/Faculty"
                  collapsed={isSidebarCollapsed}
                  onClick={() => {
                    setActiveView("approvals");
                    fetchPendingUsers();
                  }}
                />
              )}
              <hr style={{ border: "none", borderTop: "1px solid var(--border-glass)", margin: "8px 0" }} />
            </>
          )}

          {/* Section 2: GLOBAL RESOURCES */}
          <div style={{ fontSize: "9px", fontWeight: "850", textTransform: "uppercase", color: "var(--text-dim)", letterSpacing: "1px", paddingLeft: "12px", marginTop: "8px", marginBottom: "4px" }}>
            {!isSidebarCollapsed && "Global Resources"}
          </div>
          <SidebarNavItem
            active={activeWorkspace === "documents-global"}
            icon={<FileText size={16} style={{ color: "var(--accent)" }} />}
            label="Global Documents"
            collapsed={isSidebarCollapsed}
            onClick={() => {
               setActiveWorkspace("documents-global");
               setActiveView("documents");
            }}
          />
          <SidebarNavItem
            active={activeWorkspace === "documents-student"}
            icon={<FileText size={16} style={{ color: "var(--primary)" }} />}
            label="Student Submissions"
            collapsed={isSidebarCollapsed}
            onClick={() => {
               setActiveWorkspace("documents-student");
               setActiveView("documents");
            }}
          />
          <hr style={{ border: "none", borderTop: "1px solid var(--border-glass)", margin: "8px 0" }} />



          {/* Section 3: APNILEAP SUITE */}
          <div style={{ fontSize: "9px", fontWeight: "850", textTransform: "uppercase", color: "var(--text-dim)", letterSpacing: "1px", paddingLeft: "12px", marginTop: "4px", marginBottom: "4px" }}>
            {!isSidebarCollapsed && "ApniLeap Portfolio"}
          </div>
          
          {currentPersona === "moderator" && (
            <>
              <SidebarNavItem
                active={activeWorkspace === "hub"}
                icon={<LayoutDashboard size={18} style={{ color: "var(--primary)" }} />}
                label="Executive HUB"
                collapsed={isSidebarCollapsed}
                onClick={() => setActiveWorkspace("hub")}
              />
              <SidebarNavItem
                active={activeWorkspace === "moderator"}
                icon={<FaBriefcase size={16} style={{ color: "var(--accent)" }} />}
                label="Moderator Portal"
                collapsed={isSidebarCollapsed}
                onClick={() => setActiveWorkspace("moderator")}
              />
              <SidebarNavItem
                active={activeWorkspace === "meetings-campus"}
                icon={<CalendarDays size={18} style={{ color: "var(--secondary)" }} />}
                label="Campus Syncs"
                collapsed={isSidebarCollapsed}
                onClick={() => setActiveWorkspace("meetings-campus")}
              />
              <SidebarNavItem
                active={activeWorkspace === "meetings-cohort"}
                icon={<CalendarDays size={18} style={{ color: "var(--accent)" }} />}
                label="Cohort Syncs"
                collapsed={isSidebarCollapsed}
                onClick={() => setActiveWorkspace("meetings-cohort")}
              />
            </>
          )}

          {currentPersona === "company" && (
            <>
              <SidebarNavItem
                active={activeWorkspace === "company"}
                icon={<FaBriefcase size={16} style={{ color: "var(--accent)" }} />}
                label="Sponsor Portal"
                collapsed={isSidebarCollapsed}
                onClick={() => setActiveWorkspace("company")}
              />
            </>
          )}

          {currentPersona === "faculty-dashboard" && (
            <>
              <SidebarNavItem
                active={activeWorkspace === "faculty-dashboard"}
                icon={<FaGraduationCap size={16} style={{ color: "var(--accent)" }} />}
                label="Mentor Dashboard"
                collapsed={isSidebarCollapsed}
                onClick={() => setActiveWorkspace("faculty-dashboard")}
              />
            </>
          )}
          
          {currentPersona === "student-dashboard" && (
            <>
              <SidebarNavItem
                active={activeWorkspace === "student-dashboard"}
                icon={<FaGraduationCap size={16} style={{ color: "var(--accent)" }} />}
                label="Student Portal"
                collapsed={isSidebarCollapsed}
                onClick={() => setActiveWorkspace("student-dashboard")}
              />
            </>
          )}

          {/* Spoke Campuses list: Restricted to active Persona if locked */}
          {(currentPersona === "moderator" || currentPersona === "spoke-kle") && (
            <SidebarNavItem
              active={activeWorkspace === "spoke-kle"}
              icon={<Building2 size={18} style={{ color: "var(--primary)" }} />}
              label="KLE Spoke (Live)"
              collapsed={isSidebarCollapsed}
              onClick={() => {
                setActiveWorkspace("spoke-kle");
                setActiveView("dashboard");
              }}
            />
          )}
          {(currentPersona === "moderator" || currentPersona === "spoke-coep") && (
            <SidebarNavItem
              active={activeWorkspace === "spoke-coep"}
              icon={<Building2 size={18} style={{ color: "var(--secondary)" }} />}
              label="COEP Spoke (Live)"
              collapsed={isSidebarCollapsed}
              onClick={() => {
                setActiveWorkspace("spoke-coep");
                setActiveView("dashboard");
              }}
            />
          )}
          {(currentPersona === "moderator" || currentPersona === "spoke-mmcoep") && (
            <SidebarNavItem
              active={activeWorkspace === "spoke-mmcoep"}
              icon={<Building2 size={18} style={{ color: "var(--accent)" }} />}
              label="MMCOEP Spoke (Live)"
              collapsed={isSidebarCollapsed}
              onClick={() => {
                setActiveWorkspace("spoke-mmcoep");
                setActiveView("dashboard");
              }}
            />
          )}
          {(currentPersona === "moderator" || currentPersona === "spoke-rit") && (
            <SidebarNavItem
              active={activeWorkspace === "spoke-rit"}
              icon={<Building2 size={18} style={{ color: "var(--primary)" }} />}
              label="RIT Spoke (Live)"
              collapsed={isSidebarCollapsed}
              onClick={() => {
                setActiveWorkspace("spoke-rit");
                setActiveView("dashboard");
              }}
            />
          )}
          
          <hr style={{ border: "none", borderTop: "1px solid var(--border-glass)", margin: "12px 0" }} />

          {/* Connection Status Indicator */}
          {!isSidebarCollapsed && (
            <div className="glass-panel" style={{ padding: "12px 14px", fontSize: "11px", border: "1px solid rgba(255,255,255,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: hasError ? "#ef4444" : "#10b981",
                  display: "inline-block"
                }} className={hasError ? "" : "pulse-glow"}></span>
                <span style={{ fontWeight: "700", color: "var(--text-main)" }}>{connectionStatus}</span>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "10px", lineHeight: "1.3" }}>
                {hasError 
                  ? "Jira API server offline. Check logs."
                  : "Live tracking active. Background auto-polling enabled."}
              </p>
            </div>
          )}
        </nav>

        {/* Sidebar Footer User Detail */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          paddingTop: "16px",
          borderTop: "1px solid var(--border-glass)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden", width: "100%", justifyContent: isSidebarCollapsed ? "center" : "flex-start" }}>
            <img
              src={currentUser?.avatarUrls?.["48x48"] || "https://i.pravatar.cc/100?img=64"}
              alt="Logged user profile"
              style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid var(--primary)", flexShrink: 0 }}
            />
            {!isSidebarCollapsed && (
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span style={{ fontWeight: "600", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {sessionUser?.name || sessionUser?.displayName || currentUser?.displayName || "Jira Administrator"}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                  {sessionUser?.role || "Active Session"}
                </span>
              </div>
            )}
          </div>
          
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main style={{ flex: 1, padding: "30px 40px", display: "flex", flexDirection: "column", gap: "30px", overflowY: "auto" }}>
        
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
                ? "ApniLeap Executive HUB Portfolio"
                : activeWorkspace === "moderator"
                ? "Moderator Project Assignment"
                : activeWorkspace === "meetings"
                ? "FIP Sync Meetings & Collaboration"
                : activeWorkspace === "company"
                ? "Corporate Partner Sponsorship Portal"
                : activeWorkspace === "student-dashboard"
                ? "My Learning & Project Portal"
                : activeView === "dashboard"
                ? `${activeWorkspace === "playground" ? "Playground" : SPOKES[currentBoardId]?.name || "Spoke"} Analytics Dashboard`
                : `${activeWorkspace === "playground" ? "Playground" : SPOKES[currentBoardId]?.name || "Spoke"} Active Sprint Kanban`}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
              {activeWorkspace === "hub"
                ? "Consolidated FIP outcomes progress, cross-college blocker escalations, and standard workstream status tracker."
                : activeWorkspace === "moderator"
                ? "Intake projects from industry partners and automatically provision them directly to campus spaces."
                : activeWorkspace === "meetings"
                ? "Schedule campus sprint syncs, manage agendas, and auto-dispatch pre-meeting overdue warning digests."
                : activeWorkspace === "company"
                ? "Propose new corporate projects, monitor active campus sponsorships, and track student engineering deliverables."
                : activeWorkspace === "student-dashboard"
                ? "Track your individual engineering progress, coursework submissions, and sprint deliverables."
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
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-glass)",
              padding: "4px",
              borderRadius: "99px",
              boxShadow: "var(--shadow-premium)"
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
                    background: theme === t.name ? "linear-gradient(135deg, var(--primary), var(--secondary))" : "transparent",
                    color: theme === t.name ? "var(--text-primary-btn)" : "var(--text-muted)",
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
              style={{ padding: "10px" }}
              title="Refetch Data"
            >
              <FaSyncAlt size={14} className={isLoading || (activeWorkspace === "hub" && isHubLoading) || (activeWorkspace === "moderator" && isModeratorLoading) ? "pulse-glow" : ""} />
            </button>

            {activeWorkspace !== "hub" && activeWorkspace !== "moderator" && activeWorkspace !== "meetings" && currentPersona !== "moderator" && (
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setIsCreateSprintOpen(true)}
                  className="btn-secondary"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <FaRunning size={12} />
                  <span>New Sprint</span>
                </button>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <FaPlus size={12} />
                  <span>New Issue</span>
                </button>
              </div>
            )}

            <div style={{ position: "relative", cursor: "pointer" }}>
              <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-glass)",
                padding: "10px",
                borderRadius: "10px",
                color: "var(--text-main)"
              }}>
                <FaBell size={16} />
              </div>
              {activeWorkspace === "hub" ? (
                hubMetrics?.blockers?.length > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>{hubMetrics.blockers.length}</span>
                )
              ) : (
                metrics.overdue > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>{metrics.overdue}</span>
                )
              )}
            </div>
            
            <button
              onClick={handleSignOutWithConfirmation}
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#f87171",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "12px",
                fontWeight: "700",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                marginLeft: "8px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.18)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.35)";
                e.currentTarget.style.boxShadow = "0 0 10px rgba(239, 68, 68, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                e.currentTarget.style.boxShadow = "none";
              }}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* SEARCH & DYNAMIC FILTER BAR */}
        {activeWorkspace !== "hub" && activeWorkspace !== "moderator" && activeWorkspace !== "student-dashboard" && (
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
              
              {/* Sprint Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaFilter size={12} color="var(--text-muted)" />
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sprint:</span>
                <select
                  className="form-select"
                  value={sprintFilter}
                  onChange={(e) => setSprintFilter(e.target.value)}
                  style={{ padding: "6px 28px 6px 12px", width: "140px", height: "34px", fontSize: "13px" }}
                >
                  <option value="All">All Backlog</option>
                  <option value="Active Sprints">Active Sprints</option>
                </select>
              </div>
              
              {/* Reset Filters indicator */}
              {(searchQuery || filterPriority !== "All" || filterAssignee !== "All" || sprintFilter !== "All") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterPriority("All");
                    setFilterAssignee("All");
                    setSprintFilter("All");
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
        {(isLoading && activeWorkspace !== "hub" && activeWorkspace !== "moderator" && activeWorkspace !== "company" && activeWorkspace !== "meetings") ? (
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
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px 24px", borderRadius: "8px", fontFamily: "monospace", fontSize: "13px", color: "var(--text-main)", border: "1px solid var(--border-glass)" }}>
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
            moderatorProjects={moderatorProjects}
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
            triggerToast={triggerToast}
            onOpenProgressModal={() => setIsProgressModalOpen(true)}
          />
        ) : activeWorkspace === "company" ? (
          <CompanySponsorView
            projects={moderatorProjects}
            loading={isModeratorLoading}
            onRefresh={() => fetchModeratorProjects(false)}
            sessionUser={sessionUser}
            triggerToast={triggerToast}
            onOpenProgressModal={() => setIsProgressModalOpen(true)}
          />
        ) : activeWorkspace.startsWith("meetings") ? (
          <MeetingsPortalView 
            meetings={meetings} 
            loading={isMeetingsLoading} 
            onRefresh={fetchMeetings} 
            spokes={Object.values(SPOKES).filter(s => s.live)}
            triggerToast={triggerToast}
            moderatorProjects={moderatorProjects}
            sessionUser={sessionUser}
            meetingType={activeWorkspace === "meetings-campus" ? "campus" : "cohort"}
          />
        ) : activeWorkspace === "faculty-dashboard" ? (
          <FacultyDashboardView
            sessionUser={sessionUser}
            moderatorProjects={moderatorProjects}
            loading={isModeratorLoading}
            onRefresh={() => fetchModeratorProjects(true)}
          />
        ) : activeWorkspace === "student-dashboard" ? (
          <StudentDashboardView currentUser={sessionUser} campusId={sessionUser.campusId || currentBoardId} />
        ) : activeWorkspace.startsWith("documents") ? (
          <DocumentsView currentUser={sessionUser} documentType={activeWorkspace === "documents-global" ? "project" : "allocation"} />
        ) : (
          <>
            {/* Proposed B2B Project Decision Banner (Multi-tenant Coordinator Review Privilege) */}
            {proposedProjectsForSpoke.map((proj) => (
              <div key={proj.id} className="glass-panel pulse-glow" style={{
                background: theme === "dark"
                  ? "linear-gradient(135deg, rgba(45, 212, 191, 0.1), rgba(249, 115, 22, 0.1))"
                  : "linear-gradient(135deg, rgba(13, 148, 136, 0.05), rgba(249, 115, 22, 0.05))",
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
                    <span style={{ fontSize: "28px" }}></span>
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
                  {proj.logoUrl && (
                    <img
                      src={proj.logoUrl}
                      alt={proj.company}
                      style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "contain", background: "white", padding: "4px", border: "1px solid var(--border-glass)" }}
                    />
                  )}
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
                        ️ <strong>Duration:</strong> {proj.duration}
                      </span>
                      <span style={{ fontSize: "12.5px", color: "var(--text-main)" }}>
                        <strong>Proposed Deadline:</strong> <em>{proj.proposedDueDate}</em>
                      </span>
                    </div>
                  </div>
                </div>

                {currentPersona === "moderator" ? (
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
                      Decline Proposal
                    </button>
                    <button
                      onClick={() => handleAcceptProject(proj.id)}
                      disabled={isRespondingToProject}
                      className="btn-primary"
                      style={{
                        padding: "8px 18px",
                        fontSize: "13px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                        boxShadow: "0 4px 12px rgba(45, 212, 191, 0.2)",
                        cursor: "pointer"
                      }}
                    >
                      Accept Project & Provision Jira Board
                    </button>
                  </div>
                )}
              </div>
            ))}

            {todayMeetingsForSpoke.length > 0 && (
              <div className="glass-panel" style={{
                background: todayConflictsForSpoke.length > 0
                  ? (theme === "dark"
                    ? "linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(251, 146, 60, 0.12))"
                    : "linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(251, 146, 60, 0.05))")
                  : (theme === "dark"
                    ? "linear-gradient(135deg, rgba(13, 148, 136, 0.15), rgba(8, 145, 178, 0.15))"
                    : "linear-gradient(135deg, rgba(13, 148, 136, 0.06), rgba(8, 145, 178, 0.06))"),
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
                    <span style={{ fontSize: "24px" }}></span>
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
                      ️ OVERLAP CONFLICT
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
                    <span>️</span>
                    <span>
                      <strong>Schedule Conflict:</strong> Multiple meetings are scheduled at the same time today. Please coordinate to resolve the conflict.
                    </span>
                  </div>
                )}

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
                              {meet.time}
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
                                ️ Time Conflict
                              </span>
                            )}
                            <strong style={{ fontSize: "14.5px", color: "var(--text-main)" }}>{meet.title}</strong>
                          </div>
                          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            Agenda: <em>{meet.agenda}</em>
                          </p>
                        </div>
                        <a
                          href={meet.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary"
                          style={{
                            padding: "8px 16px",
                            fontSize: "12px",
                            borderRadius: "8px",
                            background: hasConflict
                              ? "linear-gradient(135deg, #ef4444, var(--accent))"
                              : "linear-gradient(135deg, var(--primary), var(--secondary))",
                            color: "var(--text-primary-btn)",
                            textDecoration: "none",
                            fontWeight: "750",
                            boxShadow: hasConflict
                              ? "0 4px 12px rgba(239, 68, 68, 0.2)"
                              : "0 4px 12px rgba(45, 212, 191, 0.15)"
                          }}
                        >
                          Join Meeting </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ACTIVE SPRINTS OVERVIEW */}
            {activeSprints && activeSprints.length > 0 && (
              <div className="glass-panel" style={{
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.04))",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                padding: "20px 24px",
                borderRadius: "16px",
                marginBottom: "25px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <FaRunning size={16} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-main)" }}>
                      Active Sprints for {SPOKES[currentBoardId]?.name || "Spoke"}
                    </h3>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                      Currently running phases for this project board.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "4px" }}>
                  {activeSprints.map(sprint => (
                    <div key={sprint.id} style={{
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      minWidth: "250px",
                      flex: "1 1 auto"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "800", color: "#60a5fa" }}>{sprint.name}</span>
                        <span className="pulse-glow" style={{
                          fontSize: "10px", fontWeight: "800", background: "rgba(59, 130, 246, 0.15)",
                          color: "#93c5fd", padding: "2px 8px", borderRadius: "12px", textTransform: "uppercase"
                        }}>
                          ACTIVE
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-dim)", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {sprint.startDate && <span><strong>Start:</strong> {new Date(sprint.startDate).toLocaleDateString()}</span>}
                        {sprint.endDate && <span><strong>End:</strong> {new Date(sprint.endDate).toLocaleDateString()}</span>}
                        {sprint.goal && <span style={{ marginTop: "4px", color: "var(--text-muted)", fontStyle: "italic" }}>"{sprint.goal}"</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1. DASHBOARD VIEW */}
            {activeView === "dashboard" && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                
                {/* KPI Cards Row */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "20px"
                }}>
                  <DashboardCard
                    title="Total Scoped Issues"
                    value={metrics.total}
                    subtitle="Matching active filters"
                    glow={true}
                  />
                  <DashboardCard
                    title="Deadline Alerts"
                    value={metrics.overdue}
                    subtitle="Active overdue tickets"
                    themeColor="var(--status-backlog-text)"
                    pulse={metrics.overdue > 0}
                    alert={metrics.overdue > 0}
                  />
                  <DashboardCard
                    title="In Progress"
                    value={metrics.progress}
                    subtitle="Actively building"
                    themeColor="var(--status-progress-text)"
                    pulse={metrics.progress > 0}
                  />
                  <DashboardCard
                    title="Done"
                    value={metrics.done}
                    subtitle="Shipped items"
                    themeColor="var(--status-done-text)"
                  />
                  <DashboardCard
                    title="Completion Rate"
                    value={`${metrics.completionRate}%`}
                    subtitle="Of total scoped tasks"
                    progress={metrics.completionRate}
                  />
                </div>

                {/* Accepted Ingested B2B Projects Panel */}
                {acceptedProjectsForSpoke.length > 0 && (
                  <div className="glass-panel" style={{
                    background: "linear-gradient(135deg, rgba(45, 212, 191, 0.04), rgba(34, 211, 238, 0.02))",
                    border: "1px solid var(--border-glass)",
                    padding: "20px 24px",
                    borderRadius: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "12px" }}>
                      <span style={{ fontSize: "20px" }}></span>
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "850", color: "var(--text-main)", letterSpacing: "-0.2px" }}>
                        Active Corporate Projects Accepted by {SPOKES[currentBoardId]?.name || "Our Campus"} Spoke
                      </h3>
                    </div>

                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}>
                      {acceptedProjectsForSpoke.map((proj) => {
                        // Calculate days left relative to baseline May 26, 2026
                        const today = new Date("2026-05-26");
                        const due = new Date(proj.proposedDueDate);
                        const diffTime = due.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let daysText = "";
                        let daysClassColor = "var(--primary)";
                        let daysBgColor = "var(--primary-glow)";
                        
                        if (diffDays < 0) {
                          daysText = `Overdue by ${Math.abs(diffDays)}d`;
                          daysClassColor = "#ef4444";
                          daysBgColor = "rgba(239, 68, 68, 0.1)";
                        } else if (diffDays === 0) {
                          daysText = "Due Today!";
                          daysClassColor = "var(--accent)";
                          daysBgColor = "rgba(251, 146, 60, 0.15)";
                        } else if (diffDays <= 7) {
                          daysText = `Only ${diffDays}d left! `;
                          daysClassColor = "var(--accent)";
                          daysBgColor = "rgba(251, 146, 60, 0.12)";
                        } else {
                          daysText = `${diffDays} days left`;
                          daysClassColor = "var(--primary)";
                          daysBgColor = "var(--primary-glow)";
                        }

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
                          <div key={proj.id} style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            padding: "20px",
                            background: "rgba(255, 255, 255, 0.015)",
                            border: "1px solid var(--border-glass)",
                            borderRadius: "14px",
                            transition: "var(--transition-smooth)"
                          }}>
                            {/* Top Info Row */}
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: "16px"
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 60%" }}>
                                {proj.logoUrl && (
                                  <img
                                    src={proj.logoUrl}
                                    alt={proj.company}
                                    style={{
                                      width: "42px",
                                      height: "42px",
                                      borderRadius: "8px",
                                      objectFit: "contain",
                                      background: "white",
                                      padding: "3px",
                                      border: "1px solid var(--border-glass)"
                                    }}
                                  />
                                )}
                                <div>
                                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "var(--text-main)" }}>
                                    {proj.title}
                                  </h4>
                                  <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                                    {proj.description}
                                  </p>
                                  <div style={{ display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap", fontSize: "11.5px", color: "var(--text-dim)" }}>
                                    <span>Jira Epic: <strong style={{ color: "var(--text-main)", fontFamily: "var(--mono)" }}>{epicKey || "Epic Provisioned"}</strong></span>
                                    <span>Budget: <strong style={{ color: "var(--text-main)" }}>{proj.budget}</strong></span>
                                    <span>Ingested: <strong style={{ color: "var(--text-main)" }}>{proj.dateAdded}</strong></span>
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                                <span style={{
                                  fontSize: "11px",
                                  fontWeight: "800",
                                  background: daysBgColor,
                                  color: daysClassColor,
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  border: `1px solid ${daysClassColor}30`,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px"
                                }}>
                                  {daysText}
                                </span>
                                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                                  Target: <strong>{proj.proposedDueDate}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Milestone Progress Bar Row */}
                            <div style={{
                              background: "rgba(255, 255, 255, 0.005)",
                              border: "1px solid var(--border-glass)",
                              borderRadius: "10px",
                              padding: "12px 16px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                                <span style={{ fontWeight: "750", color: "var(--text-muted)" }}>Project Milestone Completion</span>
                                <strong style={{ color: "var(--primary)", fontFamily: "var(--mono)" }}>{progressPct}% ({doneT} of {totalT} Phases Done)</strong>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ flex: 1, height: "8px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "4px", overflow: "hidden", border: "1px solid var(--border-glass)" }}>
                                  <div style={{
                                    width: `${progressPct}%`,
                                    height: "100%",
                                    background: "linear-gradient(90deg, var(--primary), var(--secondary))",
                                    borderRadius: "4px",
                                    boxShadow: "0 0 8px var(--primary)",
                                    transition: "width 0.5s cubic-bezier(0.1, 0.8, 0.1, 1)"
                                  }}></div>
                                </div>
                              </div>

                              {/* Accordion Detail list for Standard Phases */}
                              {totalT > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", borderTop: "1px solid var(--border-glass)", paddingTop: "10px" }}>
                                  <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                                    Standard FIP Milestone Deliverables
                                  </div>
                                  {projTasks.map(t => {
                                    const tStatus = t.fields?.status?.name || t.fields?.status || "Backlog";
                                    const tDue = t.fields?.dueDate || t.dueDate || "N/A";
                                    const isTDone = tStatus === "Done";
                                    
                                    return (
                                      <div key={t.id} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        fontSize: "12px",
                                        padding: "4px 8px",
                                        background: "rgba(255,255,255,0.005)",
                                        border: "1px solid var(--border-glass)",
                                        borderRadius: "6px"
                                      }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                                          <span style={{ color: isTDone ? "#2dd4bf" : "var(--text-muted)", fontSize: "12px" }}>
                                            {isTDone ? "🟢" : ""}
                                          </span>
                                          <span style={{
                                            color: isTDone ? "var(--text-dim)" : "var(--text-main)",
                                            textDecoration: isTDone ? "line-through" : "none",
                                            fontWeight: isTDone ? "400" : "600",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                          }}>
                                            {t.fields?.summary || t.summary}
                                          </span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", shrink: 0 }}>
                                          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{tDue}</span>
                                          <span style={{
                                            fontSize: "9px",
                                            fontWeight: "900",
                                            background: isTDone 
                                              ? "rgba(45, 212, 191, 0.08)" 
                                              : (tStatus === "In Progress" ? "rgba(251, 146, 60, 0.08)" : "rgba(255, 255, 255, 0.02)"),
                                            border: isTDone 
                                              ? "1px solid rgba(45, 212, 191, 0.2)" 
                                              : (tStatus === "In Progress" ? "1px solid rgba(251, 146, 60, 0.2)" : "1px solid var(--border-glass)"),
                                            color: isTDone ? "#2dd4bf" : (tStatus === "In Progress" ? "var(--accent)" : "var(--text-muted)"),
                                            padding: "1px 5px",
                                            borderRadius: "3px",
                                            textTransform: "uppercase"
                                          }}>{tStatus}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}


                {/* Analytical Charts Grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                  gap: "24px"
                }}>
                  {/* Status distribution chart */}
                  <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", height: "350px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>Status Distribution</h3>
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
                            <Tooltip
                              contentStyle={{ background: "var(--bg-sidebar)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-main)" }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyStateMessage text="No status data available matching filters." />
                      )}
                    </div>
                  </div>

                  {/* Priority chart */}
                  <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", height: "350px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>Priority Breakdown</h3>
                    <div style={{ flex: 1, minHeight: 0 }}>
                      {metrics.total > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={priorityBarData} margin={{ bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                            <Tooltip
                              contentStyle={{ background: "var(--bg-sidebar)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-main)" }}
                              cursor={{ fill: "rgba(255,255,255,0.02)" }}
                            />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
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
                  <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", height: "350px", gridColumn: "span 1" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>Team Workload Distribution</h3>
                    <div style={{ flex: 1, minHeight: 0 }}>
                      {assigneeWorkloadData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={assigneeWorkloadData} layout="vertical" margin={{ left: 20, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                            <XAxis type="number" stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                            <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={100} />
                            <Tooltip
                              contentStyle={{ background: "var(--bg-sidebar)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-main)" }}
                              cursor={{ fill: "rgba(255,255,255,0.02)" }}
                            />
                            <Bar dataKey="tasks" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyStateMessage text="No active work items assigned." />
                      )}
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
                            count={filteredTasks.filter(t => ["Backlog", "To Do", "Open"].includes(t.fields.status.name)).length}
                            color="var(--status-backlog-text)"
                            bgColor="var(--status-backlog-bg)"
                          />
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1 }}>
                            {filteredTasks
                              .filter(t => ["Backlog", "To Do", "Open"].includes(t.fields.status.name))
                              .map((task, idx) => (
                                <DraggableCard key={task.id} task={task} index={idx} activeSprints={activeSprints} onClick={() => setSelectedTask(task)} />
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
                            count={filteredTasks.filter(t => ["In Progress", "In Review"].includes(t.fields.status.name)).length}
                            color="var(--status-progress-text)"
                            bgColor="var(--status-progress-bg)"
                            pulse={true}
                          />
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1 }}>
                            {filteredTasks
                              .filter(t => ["In Progress", "In Review"].includes(t.fields.status.name))
                              .map((task, idx) => (
                                <DraggableCard key={task.id} task={task} index={idx} activeSprints={activeSprints} onClick={() => setSelectedTask(task)} />
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
                            count={filteredTasks.filter(t => ["Done", "Closed", "Resolved"].includes(t.fields.status.name)).length}
                            color="var(--status-done-text)"
                            bgColor="var(--status-done-bg)"
                          />
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1 }}>
                            {filteredTasks
                              .filter(t => ["Done", "Closed", "Resolved"].includes(t.fields.status.name))
                              .map((task, idx) => (
                                <DraggableCard key={task.id} task={task} index={idx} activeSprints={activeSprints} onClick={() => setSelectedTask(task)} />
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

            {/* 3. PROJECT PORTFOLIO VIEW */}
            {activeView === "projects" && (
              <div className="fade-in" style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.5px" }}>Project Portfolio</h1>
                    <p style={{ margin: "6px 0 0 0", color: "var(--text-muted)", fontSize: "14px" }}>Manage accepted corporate contracts, budgets, and assign faculty leads.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
                  {acceptedProjectsForSpoke.length > 0 ? (
                    acceptedProjectsForSpoke.map(proj => {
                      const allocation = proj.allocations?.find(a => a.targetCampusId === currentBoardId);
                      const mentorAssignments = allocation?.mentorAssignments || [];
                      const progress = allocation?.progressPercent || 0;
                      
                      return (
                        <div key={proj.id} className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", position: "relative", overflow: "hidden" }}>
                          
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "white", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <img src={proj.logoUrl} alt={proj.company} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                              </div>
                              <div>
                                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-main)", fontWeight: "700" }}>{proj.title}</h3>
                                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{proj.company}</div>
                              </div>
                            </div>
                            <div style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>Accepted</div>
                          </div>

                          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5", flex: 1 }}>{proj.description}</p>
                          
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "10px" }}>
                            <div>
                              <div style={{ fontSize: "10px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Budget</div>
                              <div style={{ fontSize: "13px", color: "var(--text-main)", fontWeight: "600" }}>{proj.budget}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: "10px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Duration</div>
                              <div style={{ fontSize: "13px", color: "var(--text-main)", fontWeight: "600" }}>{proj.duration}</div>
                            </div>
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>
                              <span style={{ color: "var(--text-muted)" }}>Project Progress</span>
                              <span style={{ color: "var(--primary)" }}>{progress}%</span>
                            </div>
                            <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, var(--primary), var(--secondary))", borderRadius: "10px", transition: "width 0.5s ease" }} />
                            </div>
                          </div>

                          <div style={{ marginTop: "8px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              {mentorAssignments.length > 0 ? mentorAssignments.map(assignment => (
                                <div key={assignment.id} style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "20px" }}>
                                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", fontWeight: "bold" }}>
                                    {assignment.faculty?.name?.charAt(0) || "?"}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "var(--text-main)", fontWeight: "600" }}>
                                    {assignment.faculty?.name || "Unknown"}
                                  </div>
                                </div>
                              )) : (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", fontWeight: "bold" }}>?</div>
                                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>No Faculty Assigned</div>
                                </div>
                              )}
                            </div>
                            
                            <button 
                              onClick={() => {
                                setAssignMentorsProject(proj);
                                setIsAssignMentorsOpen(true);
                              }}
                              className="btn-glow hover-bg-glass"
                              style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", borderRadius: "6px", color: "var(--text-main)", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                            >
                              <FaPlus size={10} color="var(--primary)" />
                              Manage Faculty
                            </button>
                          </div>

                        </div>
                      );
                    })
                  ) : (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <EmptyStateMessage text="No active project contracts. Awaiting incoming corporate proposals." showIcon={true} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        
        {activeView === "approvals" && (() => {
          const [approvalTab, setApprovalTab] = React.useState("ALL");
          const filtered = approvalTab === "ALL" ? pendingUsers : pendingUsers.filter(u => u.role === approvalTab);
          return (
          <div className="fade-in" style={{ flex: 1, padding: "24px", overflowY: "auto" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.5px" }}>
                  Approve Student / Faculty
                </h1>
                <p style={{ margin: "6px 0 0 0", color: "var(--text-muted)", fontSize: "14px" }}>
                  Review new registrations for your campus and grant or deny access.
                </p>
              </div>
              <button onClick={fetchPendingUsers} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaSyncAlt size={12} /> Refresh
              </button>
            </div>

            {/* Stats strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: "Total Pending", value: pendingUsers.length, color: "var(--primary)" },
                { label: "Students", value: pendingUsers.filter(u => u.role === "STUDENT").length, color: "#60a5fa" },
                { label: "Faculty", value: pendingUsers.filter(u => u.role === "FACULTY").length, color: "#c084fc" },
              ].map(s => (
                <div key={s.label} className="glass-panel" style={{ padding: "18px 20px" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</p>
                  <p style={{ margin: "6px 0 0 0", fontSize: "28px", fontWeight: "800", color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Role filter tabs */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              {["ALL", "STUDENT", "FACULTY"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setApprovalTab(tab)}
                  style={{
                    padding: "7px 18px",
                    borderRadius: "8px",
                    border: "1px solid " + (approvalTab === tab ? "var(--primary)" : "var(--border-glass)"),
                    background: approvalTab === tab ? "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.15))" : "transparent",
                    color: approvalTab === tab ? "var(--text-main)" : "var(--text-muted)",
                    fontSize: "12.5px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s ease"
                  }}
                >
                  {tab === "ALL" ? "All Roles" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  <span style={{ marginLeft: "6px", background: "rgba(255,255,255,0.1)", padding: "1px 6px", borderRadius: "4px", fontSize: "11px" }}>
                    {tab === "ALL" ? pendingUsers.length : pendingUsers.filter(u => u.role === tab).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-glass)", borderRadius: "16px", overflow: "hidden" }}>
              {filtered.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-main)", fontSize: "13.5px" }}>
                  <thead style={{ background: "rgba(0,0,0,0.25)", borderBottom: "1px solid var(--border-glass)" }}>
                    <tr>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)" }}>Name</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)" }}>Email</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)" }}>Role</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)" }}>Registered On</th>
                      <th style={{ padding: "14px 20px", textAlign: "right", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, idx) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid var(--border-glass)", background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent", transition: "background 0.2s" }}
                        onMouseOver={e => e.currentTarget.style.background = "rgba(99,102,241,0.04)"}
                        onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent"}
                      >
                        <td style={{ padding: "16px 20px", fontWeight: "700" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: u.role === "STUDENT" ? "rgba(59,130,246,0.2)" : "rgba(168,85,247,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "14px", color: u.role === "STUDENT" ? "#60a5fa" : "#c084fc", flexShrink: 0 }}>
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            {u.name}
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px", color: "var(--text-dim)" }}>{u.email}</td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{ background: u.role === "STUDENT" ? "rgba(59,130,246,0.15)" : "rgba(168,85,247,0.15)", color: u.role === "STUDENT" ? "#60a5fa" : "#c084fc", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: "13px" }}>
                          {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => handleApproveUser(u.id)}
                              style={{ padding: "7px 16px", borderRadius: "8px", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", fontWeight: "700", cursor: "pointer", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px", transition: "opacity 0.2s" }}
                              onMouseOver={e => e.currentTarget.style.opacity = "0.85"}
                              onMouseOut={e => e.currentTarget.style.opacity = "1"}
                            >
                              <FaCheck size={11} /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectUser(u.id)}
                              style={{ padding: "7px 16px", borderRadius: "8px", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", fontWeight: "700", cursor: "pointer", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                              onMouseOver={e => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)"; }}
                              onMouseOut={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)"; }}
                            >
                              <FaTimes size={11} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: "60px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
                  <p style={{ color: "var(--text-muted)", fontSize: "15px", fontWeight: "600" }}>All clear! No pending registrations.</p>
                  <p style={{ color: "var(--text-dim)", fontSize: "13px", marginTop: "4px" }}>New sign-ups will appear here for review.</p>
                </div>
              )}
            </div>
          </div>
          );
        })()}
      </main>

      {/* TOAST SYSTEM CONTAINER */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="toast"
            style={{
              borderLeftColor:
                toast.type === "warning" ? "#f59e0b" :
                toast.type === "error" ? "#ef4444" : "var(--primary)"
            }}
          >
            {toast.type === "error" ? <FaExclamationTriangle color="#ef4444" /> : toast.type === "warning" ? <FaInfoCircle color="#f59e0b" /> : <FaCheck color="var(--primary)" />}
            <span style={{ fontSize: "13px", fontWeight: "500" }}>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* MODAL 0: CREATE SPRINT */}
      <CreateSprintModal
        isOpen={isCreateSprintOpen}
        onClose={() => setIsCreateSprintOpen(false)}
        currentBoardId={currentBoardId}
        onSuccess={() => fetchSprints(true, currentBoardId)}
        triggerToast={triggerToast}
        acceptedProjects={acceptedProjectsForSpoke}
      />

      {/* MODAL 1: NEW TASK CREATION */}
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

      {/* MODAL 2: TASK DETAIL AND EDITOR */}
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
              {["overview", "subtasks", "worklog", "links"].map(tabName => (
                <button
                  key={tabName}
                  type="button"
                  onClick={() => {
                    setModalTab(tabName);
                    if (tabName === "worklog") {
                      fetchWorklogHistory(selectedTask.key);
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
                  {tabName === "subtasks" && (selectedTask.fields.issueType === "Epic" ? `Epic Tasks (${currentTaskChildren.length})` : `️ Subtasks (${currentTaskChildren.length})`)}
                  {tabName === "worklog" && "️ Worklogs"}
                  {tabName === "links" && "️ Links & Tags"}
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
                        ️ Blocker Flag Impediment
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {selectedTask.fields.flagged ? "Card flashing active on Kanban board." : "Flag issue as blocked by a dependency."}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={currentPersona === "moderator"}
                      onClick={() => handleToggleBlockerFlag(selectedTask)}
                      className="btn-secondary"
                      style={{
                        borderColor: selectedTask.fields.flagged ? "var(--accent)" : "var(--border-glass)",
                        color: selectedTask.fields.flagged ? "var(--accent)" : "var(--text-main)",
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: "700",
                        opacity: currentPersona === "moderator" ? 0.6 : 1,
                        cursor: currentPersona === "moderator" ? "not-allowed" : "pointer"
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
                      readOnly={currentPersona === "moderator"}
                      className="form-input"
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        background: "rgba(0,0,0,0.15)",
                        border: "1.5px solid var(--border-glass)",
                        color: "var(--text-main)",
                        cursor: currentPersona === "moderator" ? "default" : "text"
                      }}
                      onBlur={(e) => {
                        if (currentPersona === "moderator") return;
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
                      readOnly={currentPersona === "moderator"}
                      className="form-input"
                      style={{
                        minHeight: "100px",
                        fontSize: "13.5px",
                        lineHeight: "1.6",
                        background: "rgba(0,0,0,0.15)",
                        resize: currentPersona === "moderator" ? "none" : "vertical",
                        cursor: currentPersona === "moderator" ? "default" : "text"
                      }}
                      defaultValue={selectedTask.fields.description || ""}
                      onBlur={(e) => {
                        if (currentPersona === "moderator") return;
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
                        disabled={currentPersona === "moderator"}
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
                        style={{ height: "36px", padding: "6px 12px", fontSize: "13px", cursor: currentPersona === "moderator" ? "not-allowed" : "pointer" }}
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
                        disabled={currentPersona === "moderator"}
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
                        style={{ height: "36px", padding: "6px 12px", fontSize: "13px", cursor: currentPersona === "moderator" ? "not-allowed" : "pointer" }}
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
                        disabled={currentPersona === "moderator"}
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
                        style={{ height: "36px", padding: "6px 12px", fontSize: "13px", cursor: currentPersona === "moderator" ? "not-allowed" : "pointer" }}
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
                        disabled={currentPersona === "moderator"}
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
                        style={{ height: "36px", padding: "6px 12px", fontSize: "13px", cursor: currentPersona === "moderator" ? "not-allowed" : "pointer" }}
                      >
                        <option value="">Unreported</option>
                        {activeAssignees.map(m => (
                          <option key={m.accountId} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Due Date & Email reminder alerts */}
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
                      <label style={modalLabelStyle}>Target Due Date</label>
                      <input
                        type="date"
                        disabled={currentPersona === "moderator"}
                        className="form-input"
                        style={{ height: "36px", padding: "6px 12px", fontSize: "13px", cursor: currentPersona === "moderator" ? "not-allowed" : "pointer" }}
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
                        disabled={!selectedTask.fields.assignee || currentPersona === "moderator"}
                        style={{
                          height: "36px",
                          background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                          boxShadow: "0 4px 15px rgba(251, 146, 60, 0.2)",
                          opacity: (selectedTask.fields.assignee && currentPersona !== "moderator") ? 1 : 0.5,
                          cursor: (selectedTask.fields.assignee && currentPersona !== "moderator") ? "pointer" : "not-allowed",
                          color: "#020609",
                          fontWeight: "700"
                        }}
                        onClick={() => handleOpenEmailComposer(selectedTask)}
                        title={currentPersona === "moderator" ? "Moderators cannot send email alerts from spoke boards" : selectedTask.fields.assignee ? "Send alert email to assignee" : "Assign task to a team member to trigger alerts"}
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
                    {selectedTask.fields.issueType === "Epic" ? "Epic Child Tasks" : "️ Child Checklist Items"}
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
                      ️ Log Spent Hours
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
                              <span style={{ fontWeight: "700", color: "var(--primary)" }}>️ {log.timeSpent} spent</span>
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
                      ️ Labels & Custom Tags
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

      {/* MODAL 3: INTERACTIVE EMAIL ALERT COMPOSER */}
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
                  style={{ minHeight: "180px", fontSize: "13px", lineHeight: "1.6", fontFamily: "monospace" }}
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
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--secondary))" }}
                >
                  <FaPaperPlane size={12} />
                  <span>Dispatch Email</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 4: AUTOMATED B2B PROJECT ASSIGNMENT & PROVISIONING */}
      <FIPProgressModal isOpen={isProgressModalOpen} onClose={() => setIsProgressModalOpen(false)} />

      {isAssignMentorsOpen && assignMentorsProject && (
        <AssignMentorsModal
          isOpen={isAssignMentorsOpen}
          onClose={() => {
            setIsAssignMentorsOpen(false);
            setAssignMentorsProject(null);
          }}
          allocationId={assignMentorsProject.allocations?.find(a => a.targetCampusId === currentBoardId)?.id}
          campusId={currentBoardId}
          projectTitle={assignMentorsProject.title}
          company={assignMentorsProject.company}
          currentAssignments={assignMentorsProject.allocations?.find(a => a.targetCampusId === currentBoardId)?.mentorAssignments || []}
          onAssignSuccess={() => fetchModeratorProjects(true)}
          triggerToast={triggerToast}
        />
      )}

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
                background: "rgba(3, 7, 18, 0.95)",
                backdropFilter: "blur(12px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2000,
                gap: "24px",
                padding: "30px"
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  border: "5px solid rgba(99, 102, 241, 0.1)",
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
                  This date represents the final FIP delivery deadline. The system will automatically provision the custom initial workstream assigned by the company, allowing the Spoke Coordinator to build upon it.
                </p>
              </div>

              {/* Custom Initial Workstream Preview */}
              <div className="glass-panel" style={{ padding: "16px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "10px" }}>
                <h4 style={{ fontSize: "11.5px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                  📦 Initial Auto-Provisioned Workstream
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "var(--text-main)", lineHeight: "1.4" }}>
                    <span style={{ color: "var(--primary)", fontWeight: "bold" }}>⚡</span>
                    <span>{selectedAssignProject.initialWorkstream || "Phase 1: Lab Infrastructure Setup & Hardware Procurement"}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: "4px 0 0 0", lineHeight: "1.4" }}>
                    Coordinators can create additional workstreams as needed after accepting.
                  </p>
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
                  Automate Provisioning </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 5: SIGN OUT CONFIRMATION */}
      {isSignOutConfirmOpen && (
        <div style={modalBackdropStyle}>
          <div className="glass-panel" style={{
            width: "420px",
            padding: "30px",
            border: "1.5px solid rgba(239, 68, 68, 0.15)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
            textAlign: "center",
            position: "relative",
            animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto"
            }} className="pulse-glow">
              <LogOut size={24} color="#f87171" />
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)", marginBottom: "10px" }}>
              Sign Out Confirmation
            </h3>
            
            <p style={{ color: "var(--text-muted)", fontSize: "13.5px", lineHeight: "1.5", marginBottom: "26px" }}>
              Are you sure you want to sign out of your active ApniLeap session? Any unsaved form progress will be lost.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setIsSignOutConfirmOpen(false)}
                className="btn-secondary"
                style={{ padding: "10px 24px", flex: 1, justifyContent: "center" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignOutConfirmOpen(false);
                  handleLogout();
                }}
                className="btn-primary"
                style={{
                  padding: "10px 24px",
                  flex: 1,
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  borderColor: "transparent",
                  color: "#ffffff",
                  boxShadow: "0 4px 15px rgba(239, 68, 68, 0.25)"
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// SIDEBAR NAV ITEM HELPER
function SidebarNavItem({ active, icon, label, collapsed, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "14px",
        borderRadius: "12px",
        cursor: "pointer",
        background: active ? "rgba(99, 102, 241, 0.12)" : "transparent",
        color: active ? "var(--text-main)" : "var(--text-muted)",
        border: active ? "1px solid rgba(99, 102, 241, 0.2)" : "1px solid transparent",
        transition: "var(--transition-smooth)",
        justifyContent: collapsed ? "center" : "flex-start",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
          e.currentTarget.style.color = "var(--text-main)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-muted)";
        }
      }}
    >
      <span style={{ display: "flex", alignItems: "center", color: active ? "var(--primary)" : "inherit" }}>
        {icon}
      </span>
      {!collapsed && (
        <span style={{ fontSize: "14px", fontWeight: active ? "700" : "500", letterSpacing: "0.2px" }}>
          {label}
        </span>
      )}
    </div>
  );
}

// DASHBOARD METRIC CARD
function DashboardCard({ title, value, subtitle, themeColor, pulse, glow, progress, alert, onClick }) {
  return (
    <div
      className="glass-panel"
      onClick={onClick}
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        position: "relative",
        overflow: "hidden",
        borderTop: glow ? "2.5px solid var(--primary)" : alert ? "2.5px solid var(--accent)" : "1px solid var(--border-glass)",
        animation: alert ? "pulseWarning 1.5s infinite" : "none",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseOver={(e) => onClick && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)")}
      onMouseOut={(e) => onClick && (e.currentTarget.style.transform = "none", e.currentTarget.style.boxShadow = "none")}
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
          opacity: 0.15,
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
          opacity: 0.15,
          pointerEvents: "none"
        }}></div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: "600", letterSpacing: "0.2px" }}>
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
        fontSize: "32px",
        fontWeight: "800",
        color: themeColor || "var(--text-main)",
        letterSpacing: "-1px",
        lineHeight: "1.2"
      }}>
        {value}
      </span>

      {progress !== undefined ? (
        <div style={{ width: "100%", marginTop: "4px" }}>
          <div style={{ height: "6px", width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: "3px" }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--primary), var(--secondary))",
              borderRadius: "3px",
              transition: "width 0.5s ease-out"
            }}></div>
          </div>
        </div>
      ) : (
        <span style={{ color: "var(--text-dim)", fontSize: "11px" }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}

// COLUMNS HEADER FOR KANBAN
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
        <span style={{ fontWeight: "700", fontSize: "15px", letterSpacing: "0.2px" }}>{title}</span>
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

// DRAGGABLE TASK CARD (KANBAN BOARD)
function DraggableCard({ task, index, onClick, activeSprints }) {
  const deadline = getDeadlineInfo(task.fields.dueDate, task.fields.status?.name);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`glass-panel ${snapshot.isDragging ? "kanban-card-dragging" : ""} ${task.fields.flagged ? "kanban-card-blocked" : ""}`}
          style={{
            padding: "16px",
            cursor: "grab",
            background: snapshot.isDragging ? "rgba(4, 15, 20, 0.95)" : "var(--bg-card)",
            borderColor: snapshot.isDragging ? "var(--primary)" : "var(--border-glass)",
            boxShadow: snapshot.isDragging ? "0 20px 30px rgba(0,0,0,0.6)" : "var(--shadow-premium)",
            ...provided.draggableProps.style
          }}
        >
          {/* Card Header: Key and Deadline Badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                fontWeight: "700",
                color: "var(--primary)",
                background: "rgba(45, 212, 191, 0.08)",
                padding: "2px 6px",
                borderRadius: "4px"
              }}>
                {task.key}
              </span>
              {task.fields.issueType && (
                <span style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  backgroundColor:
                    task.fields.issueType === "Epic" ? "rgba(168, 85, 247, 0.12)" :
                    task.fields.issueType === "Bug" ? "rgba(239, 68, 68, 0.12)" :
                    task.fields.issueType === "Story" ? "rgba(16, 185, 129, 0.12)" : "rgba(59, 130, 246, 0.12)",
                  color:
                    task.fields.issueType === "Epic" ? "#c084fc" :
                    task.fields.issueType === "Bug" ? "#f87171" :
                    task.fields.issueType === "Story" ? "#34d399" : "#60a5fa",
                  border: "1px solid",
                  borderColor:
                    task.fields.issueType === "Epic" ? "rgba(168, 85, 247, 0.25)" :
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
                  BLOCKED
                </span>
              )}
              {activeSprints && activeSprints.length > 0 && task.fields.sprints && (
                task.fields.sprints.some(s => s && s.id && activeSprints.map(as => as.id).includes(s.id)) || 
                task.fields.sprints.some(s => typeof s === 'string' && s.includes('state=ACTIVE'))
              ) && (
                <span style={{
                  fontSize: "9px",
                  fontWeight: "700",
                  color: "#3b82f6",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  letterSpacing: "0.2px"
                }}>
                  ACTIVE SPRINT
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
          </div>

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
            <div style={{ marginBottom: "12px", background: "rgba(255, 255, 255, 0.01)", padding: "6px 8px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", fontSize: "10px", color: "var(--text-muted)" }}>
                <span>Spent: {task.fields.timetracking.timeSpent || "0h"}</span>
                <span>Est: {task.fields.timetracking.originalEstimate}</span>
              </div>
              <div style={{ height: "4px", width: "100%", background: "rgba(255, 255, 255, 0.04)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(100, Math.round((task.fields.timetracking.timeSpentSeconds / task.fields.timetracking.originalEstimateSeconds) * 100))}%`,
                  background: "linear-gradient(90deg, var(--primary), var(--secondary))",
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
            borderTop: "1px solid rgba(255, 255, 255, 0.03)"
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
                  ️ {task.fields.subtasks.filter(s => s.statusName === "Done").length}/{task.fields.subtasks.length}
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

// STATUS AND PRIORITY BADGES
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

// EMPTY STATE VIEW
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

function HubDashboardView({ metrics, loading, onRefresh, moderatorProjects }) {
  if (loading && !metrics) {
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

  const safeSpokes = metrics?.spokes || [];
  const safeBlockers = metrics?.blockers || [];

  const totalIssues = safeSpokes.reduce((sum, s) => sum + s.total, 0);
  const totalDone = safeSpokes.reduce((sum, s) => sum + s.done, 0);
  const globalCompletionRate = totalIssues > 0 ? Math.round((totalDone / totalIssues) * 100) : 0;
  const totalBlockers = safeBlockers.length;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      
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
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", height: "360px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
            College Spoke Progress
          </h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.spokes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ background: "var(--bg-sidebar)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-main)", fontSize: 12 }}
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                />
                <Bar dataKey="completionRate" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Completion Rate">
                  {metrics.spokes.map((entry, index) => {
                    const colors = ["#2dd4bf", "#fb923c", "#22d3ee", "#a855f7"];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blocker Feed Panel */}
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", height: "360px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--priority-high-text)", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaExclamationTriangle className="pulse-glow" style={{ borderRadius: "50%" }} />
            <span>️ Critical Blockers & Escalations</span>
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
                    borderRadius: "10px",
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

      {/* Active Corporate Partnerships Tracker */}
      <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-glass)", paddingBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}></span>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "850", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
              Corporate Partnerships & Campus Deployments
            </h3>
          </div>
          <span style={{ fontSize: "11px", fontWeight: "750", background: "var(--primary-glow)", color: "var(--primary)", border: "1px solid var(--border-glow)", padding: "4px 10px", borderRadius: "6px", textTransform: "uppercase" }}>
            Multi-Tenant Portfolio Tracking
          </span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "24px"
        }}>
          {metrics.b2bProjects && metrics.b2bProjects.length > 0 ? (
            metrics.b2bProjects.map(proj => {
              const activeAllocations = proj.allocations ? proj.allocations.filter(a => a.status === "Active" || a.status === "Proposed") : [];
              return (
                <div key={proj.id} className="table-row-hover" style={{
                  background: "rgba(255, 255, 255, 0.01)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "14px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  transition: "var(--transition-smooth)"
                }}>
                  {/* Card Header: Brand, Title, Budget */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {proj.logoUrl && (
                      <img
                        src={proj.logoUrl}
                        alt={proj.company}
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "8px",
                          objectFit: "contain",
                          background: "white",
                          padding: "2px",
                          border: "1px solid var(--border-glass)"
                        }}
                      />
                    )}
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

                        let daysText = "";
                        let daysClassColor = "var(--primary)";
                        let daysBgColor = "var(--primary-glow)";

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
                                {alloc.assignedTo}
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
                                      background: "linear-gradient(90deg, var(--primary), var(--secondary))",
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
            })
          ) : (
            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "120px", color: "var(--text-muted)", fontStyle: "italic", fontSize: "13px" }}>
              <span>No corporate projects active in the portfolio yet.</span>
            </div>
          )}
        </div>
      </div>


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

function ModeratorDashboardView({ projects, loading, onRefresh, onAssignClick, triggerToast, onOpenProgressModal }) {
  const [activeTab, setActiveTab] = useState("proposals"); // "proposals" or "deadlines"
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResults, setAuditResults] = useState(null);
  const [metricFilter, setMetricFilter] = useState("total"); // "total", "active", "pending", "value"

  const safeProjects = Array.isArray(projects) ? projects : [];

  if (loading && safeProjects.length === 0) {
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

  const totalProjects = safeProjects.length;
  // Exclude "Proposed" from assigned since they are awaiting assignment
  const assignedProjects = safeProjects.filter(p => (p.allocations && p.allocations.length > 0) || p.status === "Active" || p.status?.includes("BREACHED")).length;
  const pendingProjects = totalProjects - assignedProjects;

  const calculateAverageBudget = (projs) => {
    if (projs.length === 0) return "$0";
    let total = 0;
    let count = 0;
    projs.forEach(p => {
      if (p.budget) {
        let val = p.budget.replace(/[^0-9.kKmM]/g, '');
        let num = parseFloat(val);
        if (val.toLowerCase().includes('k')) num *= 1000;
        if (val.toLowerCase().includes('m')) num *= 1000000;
        if (!isNaN(num)) {
          total += num;
          count++;
        }
      }
    });
    if (count === 0) return "$0";
    return "$" + Math.round(total / count).toLocaleString();
  };
  const avgBudgetStr = calculateAverageBudget(safeProjects);

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
          glow={metricFilter === "total"}
          onClick={() => setMetricFilter("total")}
        />
        <DashboardCard
          title="Active Allocations"
          value={assignedProjects}
          subtitle="Provisioned to campus workspaces"
          themeColor="var(--status-done-text)"
          glow={metricFilter === "active"}
          onClick={() => setMetricFilter("active")}
        />
        <DashboardCard
          title="Pending Moderator Review"
          value={pendingProjects}
          subtitle="Awaiting campus assignment"
          themeColor={pendingProjects > 0 ? "var(--priority-medium-text)" : "var(--text-dim)"}
          pulse={pendingProjects > 0}
          glow={metricFilter === "pending"}
          onClick={() => setMetricFilter("pending")}
        />
        <DashboardCard
          title="Avg Project Value"
          value={avgBudgetStr}
          subtitle="FIP external funding"
          themeColor="var(--primary)"
          glow={metricFilter === "value"}
          onClick={() => setMetricFilter("value")}
        />
      </div>

      {/* Premium Tab Switcher */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "16px", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setActiveTab("proposals")}
          style={{
            background: activeTab === "proposals" ? "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))" : "transparent",
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
          <span>️ Ingested proposals</span>
        </button>
        <button
          onClick={() => setActiveTab("deadlines")}
          style={{
            background: activeTab === "deadlines" ? "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(249, 115, 22, 0.08))" : "transparent",
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
        <button 
          onClick={onOpenProgressModal}
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))",
            border: "1px solid var(--primary)",
            color: "var(--text-main)",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease"
          }}
          className="hover-glow"
        >
          <FaChartPie size={14} /> FIP Cohort Progress
        </button>
      </div>

      {activeTab === "proposals" ? (() => {
        let filteredProjects = safeProjects;
        if (metricFilter === "active") {
          filteredProjects = safeProjects.filter(p => (p.allocations && p.allocations.length > 0) || p.status === "Active" || p.status?.includes("BREACHED"));
        } else if (metricFilter === "pending") {
          filteredProjects = safeProjects.filter(p => !((p.allocations && p.allocations.length > 0) || p.status === "Active" || p.status?.includes("BREACHED")));
        }
        
        return (
        /* Projects Intake Glass Board */
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                ️ Project Intake Board
                {metricFilter !== "total" && metricFilter !== "value" && (
                  <span style={{ fontSize: "12px", background: "var(--primary)", padding: "2px 8px", borderRadius: "4px", color: "white", display: "flex", alignItems: "center" }}>
                    Filtered: {metricFilter === "active" ? "Active Allocations" : "Pending Review"}
                    <button onClick={(e) => { e.stopPropagation(); setMetricFilter("total"); }} style={{ background: "none", border: "none", color: "white", cursor: "pointer", marginLeft: "6px", padding: 0, fontWeight: "bold" }}>×</button>
                  </span>
                )}
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px" }}>Review budget scope, and instantly automate provisioning to campus Jira spaces.</p>
            </div>
            <button onClick={onRefresh} className="btn-secondary" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaSyncAlt size={12} />
              <span style={{ fontSize: "12px" }}>Refresh Intake</span>
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid var(--border-glass)" }}>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", width: "300px" }}>Project Details</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", textAlign: "left" }}>Campus Deployments, Keys, Deadlines & Progress Metrics</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", textAlign: "center", width: "150px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((proj, idx) => {
                  const activeAllocations = Array.isArray(proj.allocations) ? proj.allocations : [];
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
                      {/* Project Details */}
                      <td style={{ padding: "16px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                          {proj.logoUrl && (
                            <img
                              src={proj.logoUrl}
                              alt={proj.company}
                              style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "contain", border: "1.5px solid var(--border-glass)", background: "white", padding: "2px" }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontWeight: "800", color: "var(--primary)", fontSize: "14px" }}>{proj.title}</span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              Sponsor: <strong>{proj.company}</strong> | Budget: <strong>{proj.budget}</strong> | Duration: <strong>{proj.duration}</strong>
                            </span>
                            <p style={{ color: "var(--text-dim)", fontSize: "11.5px", lineHeight: "1.4", margin: "4px 0 0 0", maxWidth: "260px" }}>{proj.description}</p>
                          </div>
                        </div>
                      </td>

                      {/* Campus Deployments, Keys, Deadlines & Progress Metrics */}
                      <td style={{ padding: "16px", verticalAlign: "top" }}>
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
                                <React.Fragment key={alloc.targetCampusId}>
                                <div style={{
                                  display: "grid",
                                  gridTemplateColumns: "1.5fr 1fr 1.2fr 1fr 1fr",
                                  alignItems: "center",
                                  gap: "12px",
                                  background: "rgba(255, 255, 255, 0.005)",
                                  border: "1px solid var(--border-glass)",
                                  borderRadius: "8px",
                                  padding: "6px 12px"
                                }}>
                                  <span style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "12.5px" }}>
                                    {alloc.assignedTo}
                                  </span>
                                  <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: isProposed ? "var(--text-dim)" : "var(--primary)", fontWeight: "700" }}>
                                    {isProposed ? "Awaiting Decision" : (alloc.assignedKey || "Epic Provisioned")}
                                  </span>
                                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                    {alloc.proposedDueDate}
                                  </span>
                                  
                                  {/* Status */}
                                  <span style={{
                                    display: "inline-flex",
                                    justifyContent: "center",
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

                                  {/* Action / Alert */}
                                  <div style={{ textAlign: "right" }}>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await axios.post("/moderator/alerts/check");
                                          triggerToast(`Deadline warning notification dispatched successfully to ${alloc.assignedTo} Coordinator!`);
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
                                      Alert Spoke ️
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Render Phases if available */}
                                {alloc.phases && alloc.phases.length > 0 && (
                                  <div style={{ marginLeft: "12px", marginTop: "4px", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "6px", borderLeft: "2px solid rgba(255, 255, 255, 0.05)", paddingLeft: "12px" }}>
                                    <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>Phases / Tasks:</span>
                                    {alloc.phases.map(phase => (
                                      <div key={phase.id || phase.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.2)", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.03)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                          <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "var(--primary)", background: "rgba(45, 212, 191, 0.1)", padding: "2px 4px", borderRadius: "4px" }}>{phase.key}</span>
                                          <span style={{ fontSize: "12.5px", color: "var(--text-main)", fontWeight: "600" }}>{phase.summary}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{phase.assignee}</span>
                                          <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px", background: phase.status === "Done" ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.05)", color: phase.status === "Done" ? "#10b981" : "var(--text-muted)" }}>
                                            {phase.status}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </React.Fragment>
                              );
                            })
                          ) : (
                            <span style={{ fontSize: "12px", color: "var(--text-dim)", fontStyle: "italic", padding: "4px 0" }}>
                              No campus space deployments assigned. Click '+ Allocate Spoke' to begin.
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action Column */}
                      <td style={{ padding: "16px", verticalAlign: "middle", textAlign: "center" }}>
                        <button
                          onClick={() => onAssignClick(proj)}
                          className="btn-primary"
                          style={{
                            padding: "8px 14px",
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
              </tbody>
            </table>
          </div>
        </div>
      ); })() : (
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
                  <span style={{ color: "#ef4444" }}></span>
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
                    const res = await axios.post("/moderator/alerts/check");
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
                  background: "linear-gradient(135deg, #ef4444, #f97316)",
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
                    <span>️ AUDITOR CLI TERMINAL</span>
                    <span>SUCCESS</span>
                  </div>
                  <div>[baseline local time: 2026-05-27] Initiating full FIP portfolio audit...</div>
                  <div>Scanning campus spaces KLE (live), COEP (live), MMCOEP (live), RIT (live)...</div>
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
        </div>
      )}

    </div>
  );
}

// ==========================================
// COLLABORATIVE Sync Meetings PORTAL VIEW
// ==========================================

function MeetingsPortalView({ meetings, loading, onRefresh, spokes, triggerToast, moderatorProjects = [], sessionUser, meetingType = "campus" }) {
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
  const [newAllocationId, setNewAllocationId] = useState("");
  const [newDate, setNewDate] = useState("2026-05-27");
  const [newTime, setNewTime] = useState("14:30");
  const [newLink, setNewLink] = useState("");
  const [newAgenda, setNewAgenda] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [remindLoading, setRemindLoading] = useState(null); // id of meeting loading reminder
  const [inviteModalMeeting, setInviteModalMeeting] = useState(null);

  const availableAllocations = useMemo(() => {
    if (!moderatorProjects) return [];
    let allocs = [];
    moderatorProjects.forEach(p => {
      if (Array.isArray(p.allocations)) {
        p.allocations.forEach(a => {
          if (a.status === 'Active' || a.status === 'Proposed') {
            allocs.push({ ...a, projectCompany: p.company, projectTitle: p.title });
          }
        });
      }
    });
    return allocs;
  }, [moderatorProjects]);

  const isConflicted = (meet) => {
    return meetings.some(m => m.id !== meet.id && m.campusId === meet.campusId && m.date === meet.date && m.time === meet.time);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      triggerToast("Please enter a meeting title.", "warning");
      return;
    }
    
    if (meetingType === 'cohort' && !newAllocationId) {
      triggerToast("Please select a target student cohort.", "warning");
      return;
    }

    const overlap = meetings.some(m => 
      m.date === newDate && 
      m.time === newTime && 
      ((meetingType === 'campus' && m.campusId === newCampusId) || 
       (meetingType === 'cohort' && m.allocationId === newAllocationId))
    );
    if (overlap) {
      triggerToast(`️ Schedule Conflict: There is already a sync scheduled for this target today at ${newTime}!`, "warning");
    }

    setIsScheduling(true);
    try {
      const res = await axios.post("/meetings", {
        title: newTitle,
        meetingType: meetingType,
        campusId: meetingType === 'campus' ? newCampusId : null,
        allocationId: meetingType === 'cohort' ? newAllocationId : null,
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
      const res = await axios.post(`/meetings/${meetId}/remind`);
      if (res.data && res.data.success) {
        triggerToast(`Reminder dispatched! Notified ${res.data.notifiedEmails.length} coordinators with ${res.data.overdueCount} overdue items and ${res.data.blockerCount} blockers.`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to dispatch meeting warning reminder.", "error");
    } finally {
      setRemindLoading(null);
    }
  };

  if (loading && (!meetings || meetings.length === 0)) {
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
      
      {/* LEFT COLUMN: Meetings Timeline */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-main)" }}>Scheduled FIP Syncs</h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px" }}>Active sync schedules and prep reminder trigger panels.</p>
          </div>
          <button onClick={onRefresh} className="btn-secondary" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaSyncAlt size={12} />
            <span style={{ fontSize: "12px" }}>Refresh Syncs</span>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {meetings.filter(m => m.meetingType === meetingType || (meetingType === 'campus' && !m.meetingType)).map((meet) => {
            const spokeName = spokes.find(s => s.id === meet.campusId)?.name || "Unknown Spoke";
            let targetLabel = spokeName;
            let badgeBg = "rgba(99, 102, 241, 0.1)";
            let badgeColor = "var(--primary)";
            
            if (meet.meetingType === 'cohort') {
              const alloc = availableAllocations.find(a => a.id === meet.allocationId);
              targetLabel = alloc ? `Cohort: ${alloc.projectCompany} (${alloc.targetCampusId === '3' ? 'KLE' : alloc.targetCampusId === '101' ? 'COEP' : alloc.targetCampusId === '102' ? 'MMCOEP' : 'RIT'})` : "Unknown Cohort";
              badgeBg = "rgba(16, 185, 129, 0.1)";
              badgeColor = "var(--accent)";
            }

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
                      background: badgeBg,
                      color: badgeColor,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      {targetLabel}
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
                          ️ Conflict
                        </span>
                      )}
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--primary)" }}>{meet.time}</div>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{meet.date}</span>
                  </div>
                </div>

                <div style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                  <strong>Agenda:</strong> {meet.agenda}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "14px", marginTop: "4px" }}>
                  <a
                    href={meet.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "12px", color: "var(--primary)", textDecoration: "none", fontWeight: "700" }}
                  >
                    Join Sync Call (Teams/Zoom)
                  </a>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setInviteModalMeeting(meet)}
                      className="btn-primary"
                      style={{
                        padding: "6px 14px",
                        fontSize: "11.5px",
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
                        cursor: "pointer"
                      }}
                    >
                      Invite Users
                    </button>
                    <button
                      onClick={() => handleSendReminder(meet.id)}
                      disabled={isReminderActive}
                      className="btn-primary"
                      style={{
                        padding: "6px 14px",
                        fontSize: "11.5px",
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(249, 115, 22, 0.15)",
                        cursor: "pointer"
                      }}
                    >
                      {isReminderActive ? "Relaying alerts..." : "Dispatch Prep Reminder"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {meetings.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }}>
              No meetings scheduled. Use the form to schedule a campus sync.
            </div>
          )}
        </div>
      </div>

      {inviteModalMeeting && (
        <InviteToMeetingModal
          meeting={inviteModalMeeting}
          currentUser={sessionUser}
          onClose={() => setInviteModalMeeting(null)}
          onInviteSuccess={() => {
            setInviteModalMeeting(null);
            onRefresh();
            triggerToast("Invites sent successfully!", "success");
          }}
        />
      )}

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
              placeholder={meetingType === 'campus' ? "e.g. KLE Bi-weekly Sprint Sync" : "e.g. NVIDIA Architecture Review"}
              style={{ width: "100%", padding: "10px 12px", fontSize: "13px" }}
            />
          </div>

          {meetingType === 'campus' ? (
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
                      {s.name} ({s.key}) — [{status}]
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                Target Student Cohort *
              </label>
              {availableAllocations.length === 0 ? (
                <div style={{ padding: "10px", fontSize: "12px", color: "var(--text-muted)", background: "var(--bg-elevated)", borderRadius: "8px" }}>
                  No active project cohorts available for syncs.
                </div>
              ) : (
                <select
                  className="form-select"
                  required
                  value={newAllocationId}
                  onChange={(e) => setNewAllocationId(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", fontSize: "13px" }}
                >
                  <option value="" disabled>Select Cohort</option>
                  {availableAllocations.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.projectCompany} - {a.projectTitle} (Target: {a.targetCampusId === '3' ? 'KLE' : a.targetCampusId === '101' ? 'COEP' : a.targetCampusId === '102' ? 'MMCOEP' : 'RIT'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

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
              background: "linear-gradient(135deg, var(--primary), var(--secondary))",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.2)",
              cursor: "pointer"
            }}
          >
            {isScheduling ? "Creating sync..." : "Schedule Sync Meeting "}
          </button>
        </form>
      </div>

    </div>
  );
}

function CompanySponsorView({ projects, loading, onRefresh, sessionUser, triggerToast, onOpenProgressModal }) {
  const [activeTab, setActiveTab] = useState("portfolio"); // "portfolio" or "submit"
  
  // Submit Form States
  const [formCompany, setFormCompany] = useState(sessionUser?.company || "NVIDIA");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBudget, setFormBudget] = useState("$25,000");
  const [formDuration, setFormDuration] = useState("6 Months");
  const [formLogoUrl, setFormLogoUrl] = useState("");
  const [formInitialWorkstream, setFormInitialWorkstream] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter projects by current logged-in company name context
  const companyContext = sessionUser?.company || "NVIDIA";
  const safeProjects = Array.isArray(projects) ? projects : [];
  const myProjects = safeProjects.filter(p => p.company && p.company.toLowerCase() === companyContext.toLowerCase());

  // Calculations for KPI Cards
  const totalSubmissions = myProjects.length;
  const approvedSponsorships = myProjects.filter(p => p.allocations && p.allocations.length > 0).length;
  const doneSponsorships = myProjects.filter(p => {
    if (!p.allocations || p.allocations.length === 0) return false;
    return p.allocations.every(alloc => alloc.progressPercent === 100);
  }).length;
  
  const totalFundingValue = myProjects.reduce((sum, p) => {
    const val = parseInt(p.budget.replace(/[^0-9]/g, '')) || 0;
    return sum + val;
  }, 0);

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      triggerToast("Please enter a project title and description.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("/company/projects", {
        company: formCompany,
        title: formTitle,
        description: formDescription,
        budget: formBudget,
        duration: formDuration,
        logoUrl: formLogoUrl,
        initialWorkstream: formInitialWorkstream
      });
      
      triggerToast("Project Proposal submitted successfully to Central Moderator!");
      setFormTitle("");
      setFormDescription("");
      setFormLogoUrl("");
      setFormInitialWorkstream("");
      setActiveTab("portfolio");
      onRefresh(); // Refresh projects list from server
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.error || "Failed to submit project proposal.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && safeProjects.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", gap: "16px" }}>
        <div style={{
          width: "48px",
          height: "48px",
          border: "4px solid rgba(251, 146, 60, 0.1)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
        }} className="pulse-glow"></div>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Retrieving active sponsorship contracts...</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      
      {/* Portfolio Sponsor KPI Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px"
      }}>
        <DashboardCard
          title="Total Submissions"
          value={totalSubmissions}
          subtitle={`Submitted proposals by ${companyContext}`}
          glow={true}
        />
        <DashboardCard
          title="Campus Placements"
          value={approvedSponsorships}
          subtitle="Assigned to Spoke institutions"
          themeColor="var(--primary)"
        />
        <DashboardCard
          title="Fully Completed"
          value={doneSponsorships}
          subtitle="Delivered by student cohorts"
          themeColor="var(--status-done-text)"
        />
        <DashboardCard
          title="Total Sponsored Funding"
          value={`$${totalFundingValue.toLocaleString()}`}
          subtitle="Total committed project funding"
          themeColor="var(--accent)"
        />
      </div>

      {/* Sponsor Tab Switcher */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "16px", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => setActiveTab("portfolio")}
          style={{
            background: activeTab === "portfolio" ? "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))" : "transparent",
            border: "1px solid " + (activeTab === "portfolio" ? "var(--primary)" : "var(--border-glass)"),
            color: activeTab === "portfolio" ? "var(--text-main)" : "var(--text-muted)",
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
          <span>📋 Active Sponsorships Tracker</span>
        </button>
        <button
          onClick={() => setActiveTab("submit")}
          style={{
            background: activeTab === "submit" ? "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(249, 115, 22, 0.08))" : "transparent",
            border: "1px solid " + (activeTab === "submit" ? "var(--accent)" : "var(--border-glass)"),
            color: activeTab === "submit" ? "var(--text-main)" : "var(--text-muted)",
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
          <span>🚀 Submit Corporate Project Proposal</span>
        </button>
        </div>
        <button 
          onClick={onOpenProgressModal}
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))",
            border: "1px solid var(--primary)",
            color: "var(--text-main)",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease"
          }}
          className="hover-glow"
        >
          <FaChartPie size={14} /> FIP Cohort Progress
        </button>
      </div>

      {activeTab === "portfolio" ? (
        /* ACTIVE SPONSORSHIPS PORTFOLIO GRID */
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-main)" }}>📋 Corporate Sponsorship Portfolio</h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px" }}>Live real-time monitoring of campus deliveries, allocated scopes, and student milestones progress.</p>
            </div>
            <button onClick={onRefresh} className="btn-secondary" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaSyncAlt size={12} />
              <span style={{ fontSize: "12px" }}>Synchronize Tracker</span>
            </button>
          </div>

          {myProjects.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-dim)" }}>
              <Building2 size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
              <p style={{ fontSize: "15px", fontWeight: "600" }}>No corporate proposals found for {companyContext}.</p>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px" }}>Click on "Submit Corporate Project Proposal" tab to sponsor a new workspace program!</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid var(--border-glass)" }}>
                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", width: "300px" }}>Project Details</th>
                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", textAlign: "left" }}>Campus Allocations, Faculty Mentors & Sprint Deadlines</th>
                    <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontWeight: "700", textAlign: "center", width: "150px" }}>Live Project Completion Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {myProjects.map((proj, idx) => {
                    const activeAllocations = Array.isArray(proj.allocations) ? proj.allocations : [];
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
                        {/* Project Details */}
                        <td style={{ padding: "16px", verticalAlign: "top" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                            {proj.logoUrl && (
                              <img
                                src={proj.logoUrl}
                                alt={proj.company}
                                style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "contain", border: "1.5px solid var(--border-glass)", background: "white", padding: "2px" }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <span style={{ fontWeight: "800", color: "var(--primary)", fontSize: "14px" }}>{proj.title}</span>
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                Sponsor: <strong>{proj.company}</strong> | Budget: <strong>{proj.budget}</strong> | Duration: <strong>{proj.duration}</strong>
                              </span>
                              <p style={{ color: "var(--text-dim)", fontSize: "11.5px", lineHeight: "1.4", margin: "4px 0 0 0", maxWidth: "260px" }}>{proj.description}</p>
                            </div>
                          </div>
                        </td>

                        {/* Campus Allocations, Faculty Mentors & Sprint Deadlines */}
                        <td style={{ padding: "16px", verticalAlign: "top" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {activeAllocations.length > 0 ? (
                              activeAllocations.map(alloc => {
                                const isProposed = alloc.status === "Proposed";
                                // Calculate days left relative to May 26, 2026
                                const today = new Date("2026-05-26");
                                const due = new Date(alloc.proposedDueDate);
                                const diffTime = due.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                return (
                                  <div key={alloc.targetCampusId} style={{
                                    display: "grid",
                                    gridTemplateColumns: "1.5fr 1.2fr 1fr 1fr",
                                    alignItems: "center",
                                    gap: "12px",
                                    background: "rgba(255, 255, 255, 0.005)",
                                    border: "1px solid var(--border-glass)",
                                    borderRadius: "8px",
                                    padding: "6px 12px"
                                  }}>
                                    <span style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "12.5px" }}>
                                      🏢 {alloc.assignedTo}
                                    </span>
                                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>
                                      🎓 {alloc.facultyLead || "Faculty lead Awaiting"}
                                    </span>
                                    <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: isProposed ? "var(--text-dim)" : "var(--primary)", fontWeight: "700" }}>
                                      🏷️ {isProposed ? "Awaiting Accept" : (alloc.assignedKey || "Jira Active")}
                                    </span>
                                    <span style={{
                                      fontSize: "11px",
                                      fontWeight: "800",
                                      color: diffDays < 0 ? "#ef4444" : "var(--text-muted)",
                                      textAlign: "right"
                                    }}>
                                      📅 {alloc.proposedDueDate} ({diffDays < 0 ? "Breached" : `${diffDays} days left`})
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ color: "var(--text-dim)", fontSize: "12px", padding: "6px 0" }}>
                                ⏳ Proposed. Awaiting Central Moderator assignment to active campus spokes.
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Live Project Completion Progress */}
                        <td style={{ padding: "16px", verticalAlign: "middle", textAlign: "center" }}>
                          {activeAllocations.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                              {activeAllocations.map(alloc => {
                                const prog = alloc.progressPercent || 0;
                                return (
                                  <div key={alloc.targetCampusId} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", justifyContent: "center" }}>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", width: "70px", textAlign: "left", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                      {alloc.assignedTo.split(" ")[0]}
                                    </span>
                                    <div style={{ width: "80px", height: "6px", background: "var(--border-glass)", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
                                      <div style={{
                                        width: `${prog}%`,
                                        height: "100%",
                                        background: "linear-gradient(90deg, var(--primary), var(--secondary))",
                                        borderRadius: "3px",
                                        boxShadow: "0 0 8px var(--primary-glow)"
                                      }}></div>
                                    </div>
                                    <span style={{
                                      fontSize: "12px",
                                      fontWeight: "800",
                                      color: prog === 100 ? "var(--status-done-text)" : "var(--primary)",
                                      width: "40px",
                                      textAlign: "right"
                                    }}>
                                      {prog}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{
                              fontSize: "11px",
                              fontWeight: "900",
                              background: "var(--bg-input)",
                              border: "1px solid var(--border-glass)",
                              color: "var(--text-dim)",
                              padding: "4px 8px",
                              borderRadius: "6px"
                            }}>
                              IN REVIEW
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* R&D SPONSORSHIP PROPOSAL INTAKE SUBMISSION CARD */
        <div className="glass-panel" style={{ padding: "30px", maxWidth: "700px", margin: "0 auto" }}>
          <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-main)", marginBottom: "6px", letterSpacing: "-0.5px" }}>
            🚀 Submit Corporate Sponsorship Contract
          </h3>
          <p style={{ fontSize: "13.5px", color: "var(--text-muted)", marginBottom: "25px" }}>
            Submit an external research and engineering contract. Once received, the Central Moderator will review and delegate it directly to the appropriate campus spoke.
          </p>

          <form onSubmit={handleSubmitProposal} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                Sponsor Organization Name *
              </label>
              <input
                type="text"
                required
                disabled={true}
                className="form-input"
                value={formCompany}
                style={{ width: "100%", padding: "11px 14px", fontSize: "14px", opacity: 0.75, cursor: "not-allowed" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                Corporate Project Proposal Title *
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. LLM-Powered Legal Document Analyzer"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", fontSize: "14px" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                  Corporate Sponsorship Budget *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. $30,000"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  style={{ width: "100%", padding: "11px 14px", fontSize: "14px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                  Expected Delivery Duration *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. 6 Months"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  style={{ width: "100%", padding: "11px 14px", fontSize: "14px" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                Company Brand Logo URL (Optional)
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="e.g. https://logo.clearbit.com/nvidia.com"
                value={formLogoUrl}
                onChange={(e) => setFormLogoUrl(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                Initial Workstream / Phase 1 Deliverable *
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Phase 1: Setup Jetson Orin Nano environment and calibrate depth cameras"
                value={formInitialWorkstream}
                onChange={(e) => setFormInitialWorkstream(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                Detailed Project Description & Research Deliverables *
              </label>
              <textarea
                required
                rows={5}
                className="form-input"
                placeholder="Provide a comprehensive summary of key engineering milestones, hardware required, and standard delivery outcomes..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", fontSize: "14px", resize: "vertical" }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                padding: "13px 20px",
                marginTop: "8px",
                fontWeight: "800",
                fontSize: "14.5px",
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                boxShadow: "0 6px 15px rgba(99, 102, 241, 0.2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              {isSubmitting ? (
                <span>Submitting Proposal...</span>
              ) : (
                <>
                  <span>Submit Proposal Contract</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "50px", color: "red", background: "#111", minHeight: "100vh", fontFamily: "monospace", zIndex: 9999, position: "relative" }}>
          <h1>React Runtime Crash Detected</h1>
          <pre style={{ whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.5)", padding: "20px", marginTop: "20px" }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <pre style={{ whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.5)", padding: "20px", marginTop: "10px", fontSize: "12px" }}>
            {this.state.error && this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppWrapper = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWrapper;
