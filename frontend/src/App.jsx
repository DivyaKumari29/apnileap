import { useEffect, useState, useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import axios from "axios";

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
  FaHome,
  FaBook,
  FaCalendarAlt,
  FaComments,
  FaGraduationCap,
  FaCog
} from "react-icons/fa";

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
        background: "linear-gradient(135deg, #162402, #0d1601)",
        border: "1.5px solid #76b900",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 12px rgba(118, 185, 0, 0.25)",
        flexShrink: 0
      }} title="NVIDIA Sponsor">
        <svg viewBox="0 0 24 24" style={{ width: `${size * 0.55}px`, height: `${size * 0.55}px`, fill: "#76b900" }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      </div>
    );
  }
  
  if (norm.includes("intel")) {
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "8px",
        background: "linear-gradient(135deg, #011528, #010a14)",
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
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
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
      background: "linear-gradient(135deg, var(--primary), var(--secondary))",
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

function App() {
  // Authentication & Session States
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("apnileap-auth") === "true";
  });
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
  const [signupRole, setSignupRole] = useState("Student Developer"); // "Student Developer" or "Faculty Mentor"
  const [signupError, setSignupError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Navigation & UI States
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard" or "kanban"
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
  const [currentPersona, setCurrentPersona] = useState(() => {
    return localStorage.getItem("apnileap-persona") || "moderator";
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting to Jira...");
  const [hasError, setHasError] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showCohortModal, setShowCohortModal] = useState(false);

  // B2B Project Ingest Form State
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [ingestCompany, setIngestCompany] = useState("NVIDIA");
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestDescription, setIngestDescription] = useState("");
  const [ingestBudget, setIngestBudget] = useState("");
  const [ingestDuration, setIngestDuration] = useState("");
  const [ingestDueDate, setIngestDueDate] = useState("2026-08-25");
  const [isIngesting, setIsIngesting] = useState(false);

  // Chat message history state (pre-populated with premium campus conversations)
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "Rahul Sharma (KLE Spoke)", message: "Phase 1 lab equipment setup completed! Ready for mentor review.", time: "18:30", campus: "KLE Spoke" },
    { id: 2, sender: "Sneha Joshi (COEP Spoke)", message: "Awesome Rahul! We just pushed our micro-controller architecture specs on board AK-21.", time: "18:32", campus: "COEP Spoke" },
    { id: 3, sender: "Nikhil Rane (MMCOEP Spoke)", message: "RIT Spoke guys, did you finalize the pest detection model training? Need the API key.", time: "18:35", campus: "MMCOEP Spoke" },
    { id: 4, sender: "Tejas Shinde (RIT Spoke)", message: "Yes Nikhil! Accuracy is at 94% on Jetson Nano. Testing in the lab now.", time: "18:38", campus: "RIT Spoke" }
  ]);
  const [newChatMessage, setNewChatMessage] = useState("");

  const handleSendChatMessage = () => {
    if (!newChatMessage.trim()) return;

    const myMsg = {
      id: Date.now(),
      sender: "You",
      message: newChatMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      campus: "Moderator Console"
    };

    setChatMessages(prev => [...prev, myMsg]);
    const typed = newChatMessage;
    setNewChatMessage("");

    // Simulate automated response from campus spoke students in 1.5s
    setTimeout(() => {
      let replyText = "Understood! Syncing that task on our board now.";
      let responder = "Tejas Shinde (RIT Spoke)";
      
      const lower = typed.toLowerCase();
      if (lower.includes("kle") || lower.includes("rahul")) {
        replyText = "Awesome! We just completed the procurement. Checking the dashboard now.";
        responder = "Rahul Sharma (KLE Spoke)";
      } else if (lower.includes("coep") || lower.includes("sneha")) {
        replyText = "Thanks for the heads up. We are pushing our VLSI controller files onto Jira Pro.";
        responder = "Sneha Joshi (COEP Spoke)";
      } else if (lower.includes("mmcoep") || lower.includes("nikhil")) {
        replyText = "Got it! Syncing our model results onto board AK-59.";
        responder = "Nikhil Rane (MMCOEP Spoke)";
      }

      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: responder,
        message: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        campus: responder.includes("KLE") ? "KLE Spoke" : responder.includes("COEP") ? "COEP Spoke" : responder.includes("MMCOEP") ? "MMCOEP Spoke" : "RIT Spoke"
      }]);
    }, 1500);
  };

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

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  // Role-Based Access Control Simulation Guard
  useEffect(() => {
    if (currentPersona === "executive") {
      setActiveWorkspace("hub");
      setActiveView("dashboard");
    } else if (currentPersona === "moderator") {
      setActiveWorkspace("moderator");
      setActiveView("dashboard");
    } else {
      setActiveWorkspace(currentPersona);
      setActiveView("dashboard");
    }
  }, [currentPersona]);


  // Core Data States
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [spokeMembers, setSpokeMembers] = useState([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterAssignee, setFilterAssignee] = useState("All");
  const [filterProject, setFilterProject] = useState("All");

  // Modal States & Premium Multi-tab details
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [modalTab, setModalTab] = useState("overview"); // "overview", "subtasks", "worklog", "links"
  const [submissions, setSubmissions] = useState([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [submitFileName, setSubmitFileName] = useState("");
  const [submitFileUrl, setSubmitFileUrl] = useState("");
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
    if (cleanEmail === "admin@apnileap.com" || cleanEmail === "executive@apnileap.com" || cleanEmail === "executive") {
      return "executive";
    }
    if (cleanEmail === "moderator@apnileap.com" || cleanEmail === "moderator" || cleanEmail.endsWith("@apnileap.com")) {
      return "moderator";
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
      const selectedPersona = signupCampus === "3" ? "spoke-kle" : signupCampus === "101" ? "spoke-coep" : signupCampus === "102" ? "spoke-mmcoep" : "spoke-rit";
      
      const campusPrefix = signupCampus === "3" ? "KLE" : signupCampus === "101" ? "COEP" : signupCampus === "102" ? "MMCOEP" : "RIT";
      const selectedRole = signupRole === "Faculty Mentor" ? `${campusPrefix} Spoke Coordinator` : "Student Developer";

      const response = await axios.post("http://localhost:5000/api/register", {
        email: signupEmail,
        password: signupPassword,
        displayName: signupName,
        role: selectedRole,
        persona: selectedPersona
      });

      const { user, token } = response.data;
      setIsAuthenticated(true);
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

      triggerToast(`Account created! Welcome to the platform, ${user.displayName}! 🎓`);
    } catch (err) {
      console.error("Signup Failure:", err);
      const errMsg = err.response?.data?.error || "Registration failure. Please check your backend connection.";
      setSignupError(errMsg);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleQuickConnect = async (email, name, boardId, persona) => {
    setLoginEmail(email);
    // Select the correct password for each demo account
    let password = "moderator123";
    if (email.includes("kle")) password = "kle123";
    else if (email.includes("coep") && !email.includes("mmcoep")) password = "coep123";
    else if (email.includes("mmcoep")) password = "mmcoep123";
    else if (email.includes("rit")) password = "rit123";

    setLoginPassword(password);
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        email: email,
        password: password
      });

      const { user, token } = response.data;
      setIsAuthenticated(true);
      setSessionUser(user);
      setCurrentPersona(user.persona);
      setActiveWorkspace(user.persona === "executive" ? "hub" : user.persona === "moderator" ? "moderator" : user.persona);

      localStorage.setItem("apnileap-auth", "true");
      localStorage.setItem("apnileap-user", JSON.stringify(user));
      localStorage.setItem("apnileap-persona", user.persona);
      if (token) {
        localStorage.setItem("apnileap-token", token);
      }

      triggerToast(`Quick Connected as ${user.displayName}! ⚡`);
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
    if (!ingestTitle.trim() || !ingestDescription.trim() || !ingestBudget.trim() || !ingestDuration.trim()) {
      triggerToast("Please fill in all the required project proposal fields.", "warning");
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
        proposedDueDate: ingestDueDate
      });

      if (response.data && response.data.success) {
        triggerToast(`🎉 Successfully ingested new proposal by ${ingestCompany}!`);
        setIsIngestOpen(false);
        // Reset form
        setIngestTitle("");
        setIngestDescription("");
        setIngestBudget("");
        setIngestDuration("");
        setIngestDueDate("2026-08-25");
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

  const fetchSpokeMembers = async (boardId) => {
    setIsMembersLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/spokes/${boardId}/members`);
      setSpokeMembers(res.data);
    } catch (err) {
      console.error("Failed to retrieve campus team members:", err);
    } finally {
      setIsMembersLoading(false);
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
        setConnectionStatus(currentBoardId === "3" ? "Connected to Jira Cloud" : `Connected to Spoke (${currentBoardId})`);
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

  // Fetch Aggregated Hub Metrics for ApniLeap
  const fetchHubMetrics = async (silent = false) => {
    if (!silent) setIsHubLoading(true);
    setHasError(false);
    try {
      const response = await axios.get("http://localhost:5000/hub/metrics");
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
    if (!silent) setIsModeratorLoading(true);
    setHasError(false);
    try {
      const response = await axios.get("http://localhost:5000/moderator/projects");
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
        triggerToast("🎉 Project accepted! Jira workspace successfully provisioned with 3 standard Phase tasks!");
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
      fetchModeratorProjects(true); // Fetch moderator projects silently to check for proposed B2B assignments
      fetchHubMetrics(true); // Fetch hub metrics silently to feed leaderboards!
    }
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
        fetchHubMetrics(true); // Poll hub metrics silently for leaderboards!
      }
    }, 60000); // 60s auto-polling

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

  // Handle Search and Filter logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
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
  }, [tasks, searchQuery, filterPriority, filterAssignee, filterProject]);

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
    if (isCentralAdmin) {
      triggerToast("Access Denied: Central Administrators have read-only progress tracking permission on spoke boards.", "error");
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
    if (!submitFileName.trim() || !submitFileUrl.trim()) {
      triggerToast("Please enter both the artifact file name and access link.", "warning");
      return;
    }

    try {
      new URL(submitFileUrl);
    } catch (_) {
      triggerToast("Please enter a valid absolute artifact access link (e.g., https://github.com/...)", "warning");
      return;
    }

    setIsSubmittingDeliverable(true);
    try {
      const res = await axios.post(`http://localhost:5000/tasks/${selectedTask.id}/submit`, {
        studentName: currentUser?.displayName || currentUser?.email || "Student Developer",
        fileName: submitFileName,
        fileUrl: submitFileUrl,
        comments: submitComments
      });

      if (res.data && res.data.success) {
        triggerToast("Deliverable artifact uploaded successfully!");
        setSubmitFileName("");
        setSubmitFileUrl("");
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

  if (!isAuthenticated) {
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
                background: theme === t.name ? "linear-gradient(135deg, var(--primary), var(--secondary))" : "transparent",
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
            background: theme === "dark" 
              ? "linear-gradient(135deg, #090d16 0%, #1e293b 100%)" 
              : "linear-gradient(135deg, #3b529a 0%, #6366f1 100%)",
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
            <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                background: "white",
                width: "60px",
                height: "60px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "950",
                color: "#3b529a",
                fontSize: "26px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 255, 255, 0.1)"
              }}>
                AL
              </div>
              <span style={{ fontSize: "32px", fontWeight: "950", letterSpacing: "-0.8px", color: "white" }}>
                ApniLeap <span style={{ opacity: 0.85, fontWeight: "400" }}>Hub</span>
              </span>
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
              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.15)", paddingTop: "20px", maxWidth: "420px" }}>
                <span style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "900",
                  color: "rgba(255, 255, 255, 0.7)",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  marginBottom: "12px"
                }}>
                  ⚡ Quick Demo Connect
                </span>
                
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px"
                }}>
                  <button
                    type="button"
                    onClick={() => handleQuickConnect("admin@apnileap.com", "Executive Admin", "hub", "executive")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.12)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "white",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "var(--transition-smooth)"
                    }}
                    title="Connect as Executive Administrator"
                  >
                    👑 Executive Admin
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickConnect("moderator@apnileap.com", "Central Moderator", "moderator", "moderator")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.12)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "white",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "var(--transition-smooth)"
                    }}
                    title="Connect as Central Moderator"
                  >
                    🛠️ Central Moderator
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickConnect("coordinator@kle.edu", "KLE Coordinator", "3", "spoke-kle")}
                    style={{
                      padding: "9px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "11.5px",
                      cursor: "pointer",
                      transition: "var(--transition-smooth)"
                    }}
                  >
                    🏢 KLE Spoke (Live)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickConnect("coordinator@coep.edu", "COEP Coordinator", "101", "spoke-coep")}
                    style={{
                      padding: "9px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "11.5px",
                      cursor: "pointer",
                      transition: "var(--transition-smooth)"
                    }}
                  >
                    🏢 COEP Spoke
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickConnect("coordinator@mmcoep.edu", "MMCOEP Coordinator", "102", "spoke-mmcoep")}
                    style={{
                      padding: "9px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "11.5px",
                      cursor: "pointer",
                      transition: "var(--transition-smooth)"
                    }}
                  >
                    🏢 MMCOEP Spoke
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickConnect("coordinator@rit.edu", "RIT Coordinator", "103", "spoke-rit")}
                    style={{
                      padding: "9px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "11.5px",
                      cursor: "pointer",
                      transition: "var(--transition-smooth)"
                    }}
                  >
                    🏢 RIT Spoke
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
            background: "var(--bg-card)",
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
                        ⚠️ {loginError}
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
                            ? "👑 Executive Administrator"
                            : recognizedPersona === "moderator"
                            ? "🛠️ Central Moderator"
                            : `🏢 ${recognizedPersona.replace("spoke-", "").toUpperCase()} Spoke Coordinator`}
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
                        background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: "800",
                        fontSize: "14.5px",
                        cursor: isLoggingIn ? "not-allowed" : "pointer",
                        boxShadow: "0 6px 15px rgba(59, 82, 154, 0.22)",
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
                          <span>🚀</span>
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
                        Register Student / Faculty 🎓
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
                        ⚠️ {signupError}
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
                          <option value="Student Developer">🎓 Student Developer</option>
                          <option value="Faculty Mentor">👨‍🏫 Faculty Mentor (Spoke Coordinator)</option>
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
                          <option value="3">🏢 KLE Spoke (Hub Campus)</option>
                          <option value="101">🏢 COEP Spoke</option>
                          <option value="102">🏢 MMCOEP Spoke</option>
                          <option value="103">🏢 RIT Spoke</option>
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
                        background: "linear-gradient(135deg, var(--secondary), #a855f7)",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: "800",
                        fontSize: "14.5px",
                        cursor: isRegistering ? "not-allowed" : "pointer",
                        boxShadow: "0 6px 15px rgba(99, 102, 241, 0.22)",
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
                          <span>Register {signupRole === "Faculty Mentor" ? "Faculty" : "Student"} Account</span>
                          <span>{signupRole === "Faculty Mentor" ? "👨‍🏫" : "🎓"}</span>
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
                        Sign In here 🚀
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
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              transition: "var(--transition-smooth)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <FaChevronRight size={16} /> : <FaChevronLeft size={16} />}
          </button>

          {/* Rail Utility Icons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" }}>
            {currentPersona === "executive" ? (
              <div
                onClick={() => {
                  setActiveWorkspace("hub");
                  triggerToast("Switched Workspace: Executive HUB Portal");
                }}
                style={{
                  color: "#ffffff",
                  opacity: activeWorkspace === "hub" ? 1 : 0.75,
                  cursor: "pointer",
                  padding: "10px",
                  borderRadius: "12px",
                  background: activeWorkspace === "hub" ? "rgba(255,255,255,0.15)" : "transparent",
                  transition: "var(--transition-smooth)"
                }}
                title="Executive Hub"
              >
                <FaHome size={20} />
              </div>
            ) : currentPersona === "moderator" ? (
              <>
                <div
                  onClick={() => {
                    setActiveWorkspace("moderator");
                    triggerToast("Switched Workspace: Moderator Portal");
                  }}
                  style={{
                    color: "#ffffff",
                    opacity: activeWorkspace === "moderator" ? 1 : 0.75,
                    cursor: "pointer",
                    padding: "10px",
                    borderRadius: "12px",
                    background: activeWorkspace === "moderator" ? "rgba(255,255,255,0.15)" : "transparent",
                    transition: "var(--transition-smooth)"
                  }}
                  title="Moderator Portal"
                >
                  <FaBook size={20} />
                </div>

                <div
                  onClick={() => {
                    setActiveWorkspace("meetings");
                    triggerToast("Switched Workspace: Meetings & Syncs");
                  }}
                  style={{
                    color: "#ffffff",
                    opacity: activeWorkspace === "meetings" ? 1 : 0.75,
                    cursor: "pointer",
                    padding: "10px",
                    borderRadius: "12px",
                    background: activeWorkspace === "meetings" ? "rgba(255,255,255,0.15)" : "transparent",
                    transition: "var(--transition-smooth)"
                  }}
                  title="Sync Schedule"
                >
                  <FaCalendarAlt size={20} />
                </div>
              </>
            ) : (
              <>
                <div
                  onClick={() => {
                    setActiveWorkspace(currentPersona);
                    setActiveView("dashboard");
                    triggerToast(`Switched Workspace: Spoke Dashboard`);
                  }}
                  style={{
                    color: "#ffffff",
                    opacity: (activeWorkspace === currentPersona && activeView === "dashboard") ? 1 : 0.75,
                    cursor: "pointer",
                    padding: "10px",
                    borderRadius: "12px",
                    background: (activeWorkspace === currentPersona && activeView === "dashboard") ? "rgba(255,255,255,0.15)" : "transparent",
                    transition: "var(--transition-smooth)"
                  }}
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
                  style={{
                    color: "#ffffff",
                    opacity: (activeWorkspace === currentPersona && activeView === "kanban") ? 1 : 0.75,
                    cursor: "pointer",
                    padding: "10px",
                    borderRadius: "12px",
                    background: (activeWorkspace === currentPersona && activeView === "kanban") ? "rgba(255,255,255,0.15)" : "transparent",
                    transition: "var(--transition-smooth)"
                  }}
                  title="Sprint Kanban Board"
                >
                  <FaTasks size={20} />
                </div>
              </>
            )}

            <div
              onClick={() => {
                setShowChatDrawer(true);
                triggerToast("Opening FIP Cohort Live Chat...");
              }}
              style={{
                color: "#ffffff",
                opacity: showChatDrawer ? 1 : 0.75,
                cursor: "pointer",
                padding: "10px",
                borderRadius: "12px",
                background: showChatDrawer ? "rgba(255,255,255,0.15)" : "transparent",
                transition: "var(--transition-smooth)"
              }}
              title="Cohort Forums Chat"
            >
              <FaComments size={20} />
            </div>

            <div
              onClick={() => {
                setShowCohortModal(true);
                triggerToast("Opening Academic Cohort Progress...");
              }}
              style={{
                color: "#ffffff",
                opacity: showCohortModal ? 1 : 0.75,
                cursor: "pointer",
                padding: "10px",
                borderRadius: "12px",
                background: showCohortModal ? "rgba(255,255,255,0.15)" : "transparent",
                transition: "var(--transition-smooth)"
              }}
              title="Academic Cohorts"
            >
              <FaGraduationCap size={20} />
            </div>

            <div
              onClick={() => {
                setShowSettingsModal(true);
                triggerToast("Opening System Settings...");
              }}
              style={{
                color: "#ffffff",
                opacity: showSettingsModal ? 1 : 0.75,
                cursor: "pointer",
                padding: "10px",
                borderRadius: "12px",
                background: showSettingsModal ? "rgba(255,255,255,0.15)" : "transparent",
                transition: "var(--transition-smooth)"
              }}
              title="System Settings"
            >
              <FaCog size={20} />
            </div>
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", paddingLeft: "12px" }}>
            <div style={{
              background: "rgba(255, 255, 255, 0.15)",
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "900",
              color: "white",
              fontSize: "16px"
            }}>
              ⬢
            </div>
            <span style={{ fontSize: "21px", fontWeight: "900", letterSpacing: "-0.5px", color: "#ffffff" }}>
              Smart
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, overflowY: "auto", paddingRight: "4px" }}>
            
            {/* Multi-Tenant Persona Access Controller (Admin Only) */}
            {sessionUser && sessionUser.role === "Central Moderator" && (
              <div style={{
                padding: "12px 14px",
                marginBottom: "16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                marginRight: "16px",
                marginTop: "4px"
              }}>
                <label style={{
                  display: "block",
                  fontSize: "9px",
                  fontWeight: "900",
                  color: "rgba(255, 255, 255, 0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  marginBottom: "8px"
                }}>
                  👤 Active Profile Role
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
                    background: "rgba(0, 0, 0, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#ffffff",
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
                  <option value="moderator" style={{ background: "#3b529a" }}>👑 Central Moderator (Full)</option>
                  <option value="spoke-kle" style={{ background: "#3b529a" }}>🏢 KLE Coordinator (Private)</option>
                  <option value="spoke-coep" style={{ background: "#3b529a" }}>🏢 COEP Coordinator (Private)</option>
                  <option value="spoke-mmcoep" style={{ background: "#3b529a" }}>🏢 MMCOEP Coordinator (Private)</option>
                  <option value="spoke-rit" style={{ background: "#3b529a" }}>🏢 RIT Coordinator (Private)</option>
                </select>
              </div>
            )}

            {/* Section 1: ACTIVE VIEW MODE (Hidden if viewing Hub or Moderator) */}
            {activeWorkspace !== "hub" && activeWorkspace !== "moderator" && activeWorkspace !== "meetings" && (
              <>
                <div style={{ fontSize: "9px", fontWeight: "850", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", letterSpacing: "1px", paddingLeft: "12px", marginTop: "8px", marginBottom: "4px" }}>
                  View Mode
                </div>
                <SidebarNavItem
                  active={activeView === "dashboard"}
                  icon={<FaChartPie size={16} />}
                  label="Analytics Dashboard"
                  collapsed={false}
                  onClick={() => setActiveView("dashboard")}
                />
                <SidebarNavItem
                  active={activeView === "kanban"}
                  icon={<FaTasks size={16} />}
                  label="Kanban Board"
                  collapsed={false}
                  onClick={() => setActiveView("kanban")}
                />
                <hr style={{ border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.1)", margin: "8px 16px 8px 0" }} />
              </>
            )}

            {/* Section 3: APNILEAP SUITE */}
            <div style={{ fontSize: "9px", fontWeight: "850", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", letterSpacing: "1px", paddingLeft: "12px", marginTop: "4px", marginBottom: "4px" }}>
              ApniLeap Portfolio
            </div>
            
            {currentPersona === "executive" && (
              <SidebarNavItem
                active={activeWorkspace === "hub"}
                icon={<span style={{ fontSize: "16px" }}>🌐</span>}
                label="Executive HUB"
                collapsed={false}
                onClick={() => setActiveWorkspace("hub")}
              />
            )}

            {currentPersona === "moderator" && (
              <>
                <SidebarNavItem
                  active={activeWorkspace === "moderator"}
                  icon={<FaBriefcase size={16} />}
                  label="Moderator Portal"
                  collapsed={false}
                  onClick={() => setActiveWorkspace("moderator")}
                />
                <SidebarNavItem
                  active={activeWorkspace === "meetings"}
                  icon={<span style={{ fontSize: "16px" }}>📅</span>}
                  label="Meetings & Syncs"
                  collapsed={false}
                  onClick={() => setActiveWorkspace("meetings")}
                />
              </>
            )}

            {/* Spoke Campuses list */}
            {(isCentralAdmin || currentPersona === "spoke-kle") && (
              <SidebarNavItem
                active={activeWorkspace === "spoke-kle"}
                icon={<span>🏢</span>}
                label="KLE Spoke (Live)"
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
                icon={<span>🏢</span>}
                label="COEP Spoke (Live)"
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
                icon={<span>🏢</span>}
                label="MMCOEP Spoke (Live)"
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
                icon={<span>🏢</span>}
                label="RIT Spoke (Live)"
                collapsed={false}
                onClick={() => {
                  setActiveWorkspace("spoke-rit");
                  setActiveView("dashboard");
                }}
              />
            )}
            
            <hr style={{ border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.1)", margin: "12px 16px 12px 0" }} />

            {/* Connection Status Indicator */}
            <div style={{ padding: "12px 14px", fontSize: "11px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", borderRadius: "16px", marginRight: "16px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: hasError ? "#ef4444" : "#10b981",
                  display: "inline-block"
                }} className={hasError ? "" : "pulse-glow"}></span>
                <span style={{ fontWeight: "700", color: "#ffffff" }}>{connectionStatus}</span>
              </div>
              <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "10px", lineHeight: "1.3" }}>
                {hasError 
                  ? "Jira API server offline. Check logs."
                  : "Live tracking active. Background auto-polling enabled."}
              </p>
            </div>
          </nav>

          {/* Sidebar Footer User Detail */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            marginRight: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
              <img
                src={currentUser?.avatarUrls?.["48x48"] || "https://i.pravatar.cc/100?img=64"}
                alt="Logged user profile"
                style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }}
              />
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span style={{ fontWeight: "600", fontSize: "13px", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {sessionUser?.displayName || currentUser?.displayName || "Jira Administrator"}
                </span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>
                  {sessionUser?.role || "Active Session"}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log Out"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
            >
              <FaTimes size={12} />
            </button>
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
                ? "ApniLeap Executive HUB Portfolio"
                : activeWorkspace === "moderator"
                ? "Moderator Project Assignment"
                : activeWorkspace === "meetings"
                ? "📅 FIP Sync Meetings & Collaboration"
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

            <div style={{ position: "relative", cursor: "pointer" }}>
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
            onIngestClick={() => setIsIngestOpen(true)}
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
                    <span style={{ fontSize: "28px" }}>🎉</span>
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
                        💰 <strong>Budget:</strong> {proj.budget}
                      </span>
                      <span style={{ fontSize: "12.5px", color: "var(--text-main)" }}>
                        ⏱️ <strong>Duration:</strong> {proj.duration}
                      </span>
                      <span style={{ fontSize: "12.5px", color: "var(--text-main)" }}>
                        📅 <strong>Proposed Deadline:</strong> <em>{proj.proposedDueDate}</em>
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
                      ❌ Decline Proposal
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
                      🚀 Accept Project & Provision Jira Board
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
                    <span style={{ fontSize: "24px" }}>📅</span>
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
                      ⚠️ OVERLAP CONFLICT
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
                    <span>⚠️</span>
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
                              ⏰ {meet.time}
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
                                ⚠️ Time Conflict
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
                          Join Meeting 🚀
                        </a>
                      </div>
                    );
                  })}
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
                  <DashboardCard
                    title="Agile Velocity"
                    value={metrics.done}
                    subtitle="Tasks marked Done in sprint"
                    themeColor="#a855f7"
                    glow={true}
                  />
                  <DashboardCard
                    title="On-Time Rate"
                    value={`${metrics.onTimeRate}%`}
                    subtitle="Completed on or before deadline"
                    themeColor="#f43f5e"
                    progress={metrics.onTimeRate}
                    glow={metrics.onTimeRate > 80}
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
                      <span style={{ fontSize: "20px" }}>💼</span>
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
                          daysText = `Only ${diffDays}d left! ⏰`;
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
                            borderRadius: "8px",
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
                                <CompanyLogo company={proj.company} size={42} />
                                <div>
                                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "var(--text-main)" }}>
                                    {proj.title}
                                  </h4>
                                  <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                                    {proj.description}
                                  </p>
                                  <div style={{ display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap", fontSize: "11.5px", color: "var(--text-dim)" }}>
                                    <span>Jira Epic: <strong style={{ color: "var(--text-main)", fontFamily: "var(--mono)" }}>{epicKey || "Epic Provisioned"}</strong></span>
                                    <span>💰 Budget: <strong style={{ color: "var(--text-main)" }}>{proj.budget}</strong></span>
                                    <span>📅 Ingested: <strong style={{ color: "var(--text-main)" }}>{proj.dateAdded}</strong></span>
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
                              borderRadius: "6px",
                              padding: "12px 16px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                                <span style={{ fontWeight: "750", color: "var(--text-muted)" }}>🏢 Project Milestone Completion</span>
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
                                            {isTDone ? "🟢" : "🔘"}
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
                                          <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>⏰ {tDue}</span>
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
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(17,24,39,0.2)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.04)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", margin: 0 }}>🏆 Spoke Leaderboard</h3>
                      <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: "750", background: "var(--primary-glow)", padding: "2px 8px", borderRadius: "20px" }}>Live Velocity</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1, paddingRight: "4px" }}>
                      {leaderboardData.map((spoke, idx) => {
                        const isCurrent = spoke.id === currentBoardId || (spoke.name && spoke.name.includes(SPOKES[currentBoardId]?.name));
                        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🏅";
                        const glowBorder = isCurrent ? "1px solid var(--primary)" : "1px solid var(--border-glass)";
                        const bgHighlight = isCurrent ? "var(--primary-glow)" : "rgba(255,255,255,0.01)";
                        const pct = spoke.total > 0 ? Math.round((spoke.done / spoke.total) * 100) : 0;
                        
                        return (
                          <div key={spoke.id || spoke.name} style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            padding: "10px 14px",
                            background: bgHighlight,
                            border: glowBorder,
                            borderRadius: "10px",
                            boxShadow: isCurrent ? "0 0 15px rgba(99, 102, 241, 0.15)" : "none",
                            transition: "var(--transition-smooth)"
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "16px" }}>{medal}</span>
                                <span style={{ fontSize: "13px", fontWeight: isCurrent ? "800" : "600", color: isCurrent ? "var(--primary)" : "var(--text-main)" }}>
                                  {spoke.name} {isCurrent && "⭐"}
                                </span>
                              </div>
                              <span style={{ fontSize: "12.5px", fontFamily: "var(--mono)", color: "var(--text-main)", fontWeight: "750" }}>
                                {spoke.done} / {spoke.total} Done ({pct}%)
                              </span>
                            </div>
                            <div style={{ height: "6px", background: "rgba(255,255,255,0.03)", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-glass)" }}>
                              <div style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: idx === 0 
                                  ? "linear-gradient(90deg, #fbbf24, #f59e0b)" 
                                  : (idx === 1 ? "linear-gradient(90deg, #9ca3af, #6b7280)" : "linear-gradient(90deg, var(--primary), var(--secondary))"),
                                borderRadius: "3px"
                              }}></div>
                            </div>
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
                  <option value="Task">📋 Task</option>
                  <option value="Story">📖 Story</option>
                  <option value="Bug">🐛 Bug</option>
                  <option value="Epic">👑 Epic</option>
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
                    {selectedTask.fields.issueType === "Epic" ? "👑 Epic" :
                     selectedTask.fields.issueType === "Bug" ? "🐛 Bug" :
                     selectedTask.fields.issueType === "Story" ? "📖 Story" : "📋 Task"}
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
                  {tabName === "overview" && "📋 General"}
                  {tabName === "subtasks" && (selectedTask.fields.issueType === "Epic" ? `👑 Epic Tasks (${currentTaskChildren.length})` : `☑️ Subtasks (${currentTaskChildren.length})`)}
                  {tabName === "worklog" && "⏱️ Worklogs"}
                  {tabName === "links" && "🏷️ Links & Tags"}
                  {tabName === "deliverables" && "📂 Deliverables"}
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
                        ⚠️ Blocker Flag Impediment
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {selectedTask.fields.flagged ? "🚨 Card flashing active on Kanban board." : "Flag issue as blocked by a dependency."}
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
                      {selectedTask.fields.flagged ? "🚨 Blocked" : "Flag Blocker"}
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
                      <label style={modalLabelStyle}>📅 Target Due Date</label>
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
                          background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                          boxShadow: "0 4px 15px rgba(251, 146, 60, 0.2)",
                          opacity: (selectedTask.fields.assignee && !isCentralAdmin) ? 1 : 0.5,
                          cursor: (selectedTask.fields.assignee && !isCentralAdmin) ? "pointer" : "not-allowed",
                          color: "#020609",
                          fontWeight: "700"
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
                    {selectedTask.fields.issueType === "Epic" ? "👑 Epic Child Tasks" : "☑️ Child Checklist Items"}
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
                        <option value="">👤 Assignee...</option>
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
                      ⏱️ Log Spent Hours
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
                              <span style={{ fontWeight: "700", color: "var(--primary)" }}>⏱️ {log.timeSpent} spent</span>
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
                      🏷️ Labels & Custom Tags
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
                      🔗 Issue Dependency Relations
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
                      ⚠️ Epic Alert: Deliverables must be submitted on sprint child tasks, not Epics.
                    </div>
                  ) : (
                    <>
                      {/* Submission Form */}
                      <div className="glass-panel" style={{ padding: "16px", background: "rgba(255,255,255,0.015)" }}>
                        <h3 style={{ fontSize: "13.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "12px", marginTop: 0 }}>
                          ➕ Submit Sprint Deliverable Artifact
                        </h3>
                        <form onSubmit={handleSubmitDeliverable} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div>
                              <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>ARTIFACT FILE NAME</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., VLSI_controller_layout.pdf"
                                value={submitFileName}
                                onChange={(e) => setSubmitFileName(e.target.value)}
                                style={{ padding: "8px 12px", fontSize: "12.5px" }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: "10px", fontWeight: "750", color: "var(--text-dim)", display: "block", marginBottom: "4px" }}>ACCESS LINK (GITHUB/CLOUD)</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., https://github.com/..."
                                value={submitFileUrl}
                                onChange={(e) => setSubmitFileUrl(e.target.value)}
                                style={{ padding: "8px 12px", fontSize: "12.5px" }}
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
                          📂 Submitted Artifacts History
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
                                      📄 {sub.fileName}
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
                                  <span style={{ fontSize: "10px", color: "var(--primary)", fontWeight: "600" }}>
                                    By: {sub.studentName}
                                  </span>
                                </div>
                                <a
                                  href={sub.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-secondary"
                                  style={{ padding: "6px 12px", textDecoration: "none", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                >
                                  🔗 Open Artifact
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
                  <span>🤝 Allocate Sponsor Project</span>
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
                  <option value="3">🏢 KLE Spoke (Live Jira - Key: AK)</option>
                  <option value="101">🏢 COEP Spoke (Live Jira - Key: AK)</option>
                  <option value="102">🏢 MMCOEP Spoke (Live Jira - Key: AK)</option>
                  <option value="103">🏢 RIT Spoke (Live Jira - Key: AK)</option>
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

              {/* Standard FIP Workstreams Preview */}
              <div className="glass-panel" style={{ padding: "16px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "10px" }}>
                <h4 style={{ fontSize: "11.5px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                  ⚙️ Standard Auto-Provisioned Workstreams
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
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
                  Automate Provisioning ➔
                </button>
              </div>
            </form>

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
              🛠️ Ingest New Corporate Proposal
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
                    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                    borderColor: "transparent",
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)"
                  }}
                  disabled={isIngesting}
                >
                  {isIngesting ? "Ingesting..." : "Confirm Ingest 🚀"}
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
              ⚙️ Platform System Settings
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
                    💡 Ethereal Test SMTP Gateway auto-provisions in sandbox mode when custom fields are empty.
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
                          triggerToast("🧹 Server cache successfully purged!");
                        }
                      } catch {
                        triggerToast("🧹 Cache cleared locally!");
                      }
                    }}
                    className="btn-primary"
                    style={{
                      background: "linear-gradient(135deg, #dc2626, #b91c1c)",
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

      {/* COHORT TEAM CHAT DRAWER */}
      {showChatDrawer && (
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "380px",
          height: "100vh",
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--border-glass)",
          boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          zIndex: 999,
          animation: "slideInLeft 0.3s ease"
        }}>
          {/* Drawer Header */}
          <div style={{
            padding: "24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: "800", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                💬 FIP Cohort Live Chat
              </h3>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Inter-campus student & mentor collaboration
              </span>
            </div>
            <button
              onClick={() => setShowChatDrawer(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                color: "var(--text-muted)",
                cursor: "pointer"
              }}
            >
              ×
            </button>
          </div>

          {/* Chat Messages List */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>
            {chatMessages.map(msg => {
              const isMe = msg.sender === "You";
              return (
                <div key={msg.id} style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start"
                }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-dim)", marginBottom: "4px" }}>
                    {msg.sender}
                  </span>
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: isMe ? "12px 12px 0 12px" : "12px 12px 12px 0",
                    background: isMe ? "linear-gradient(135deg, var(--primary), var(--secondary))" : "var(--bg-subtle)",
                    border: isMe ? "none" : "1px solid var(--border-subtle)",
                    color: isMe ? "#ffffff" : "var(--text-main)",
                    fontSize: "12.5px",
                    lineHeight: "1.4",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.01)"
                  }}>
                    {msg.message}
                  </div>
                  <span style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "4px" }}>
                    {msg.time}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chat Input Footer */}
          <div style={{
            padding: "20px 24px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            background: "var(--bg-subtle)"
          }}>
            <input
              type="text"
              className="form-input"
              value={newChatMessage}
              onChange={(e) => setNewChatMessage(e.target.value)}
              placeholder="Type your message..."
              style={{ flex: 1, padding: "8px 12px", fontSize: "12.5px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newChatMessage.trim()) {
                  handleSendChatMessage();
                }
              }}
            />
            <button
              onClick={handleSendChatMessage}
              className="btn-primary"
              style={{ padding: "8px 14px", fontSize: "12px", border: "none", cursor: "pointer", borderRadius: "6px" }}
            >
              Send
            </button>
          </div>
        </div>
      )}

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
              🎓 FIP Campus Cohort Academic Progress
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
                    <td style={{ padding: "12px 10px", fontWeight: "700", color: "var(--text-main)" }}>🏢 KLE Spoke (Hub)</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>35 Students</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>4 Mentors</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>2 Projects</td>
                    <td style={{ textAlign: "right", padding: "12px 10px", fontWeight: "700", color: "var(--status-done-text)" }}>66%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 10px", fontWeight: "700", color: "var(--text-main)" }}>🏢 COEP Spoke</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>24 Students</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>3 Mentors</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>2 Projects</td>
                    <td style={{ textAlign: "right", padding: "12px 10px", fontWeight: "700", color: "var(--status-progress-text)" }}>33%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 10px", fontWeight: "700", color: "var(--text-main)" }}>🏢 MMCOEP Spoke</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>18 Students</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>2 Mentors</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>1 Project</td>
                    <td style={{ textAlign: "right", padding: "12px 10px", fontWeight: "700", color: "var(--status-backlog-text)" }}>0%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 10px", fontWeight: "700", color: "var(--text-main)" }}>🏢 RIT Spoke</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>20 Students</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>3 Mentors</td>
                    <td style={{ textAlign: "center", padding: "12px 10px", color: "var(--text-muted)" }}>1 Project</td>
                    <td style={{ textAlign: "right", padding: "12px 10px", fontWeight: "700", color: "var(--status-backlog-text)" }}>16%</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginTop: "8px" }}>
                <h4 style={{ fontWeight: "700", fontSize: "13px", color: "var(--text-main)", marginBottom: "6px" }}>🏆 Top Performing Cohort</h4>
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
function SidebarNavItem({ active, icon, label, collapsed, onClick }) {
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
        background: active ? "var(--sidebar-active-bg)" : "transparent",
        color: active ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
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
              background: "linear-gradient(90deg, var(--primary), var(--secondary))",
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
          {title === "Backlog" ? "📥 " : title === "In Progress" ? "⚡ " : title === "Done" ? "✅ " : ""}
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
                  {task.fields.issueType === "Epic" ? "👑 Epic" :
                   task.fields.issueType === "Bug" ? "🐛 Bug" :
                   task.fields.issueType === "Story" ? "📖 Story" : "📋 Task"}
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
                  🚨 BLOCKED
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
              <span>📁</span>
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
                  ☑️ {task.fields.subtasks.filter(s => s.statusName === "Done").length}/{task.fields.subtasks.length}
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

function HubDashboardView({ metrics, loading, onRefresh, moderatorProjects, onIngestClick }) {
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
        <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", height: "360px", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "16px" }}>
            📊 College Spoke Progress
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
            <FaExclamationTriangle className="pulse-glow" style={{ borderRadius: "50%" }} />
            <span>⚠️ Critical Blockers & Escalations</span>
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
                <span>✨ No cross-college blockers active. Excellent execution!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 15 Standard Workstreams Progress Matrix */}
      <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
          👑 15 Standard Workstreams Matrix
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

      {/* 💼 Active Corporate Partnerships Tracker */}
      <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-glass)", paddingBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>💼</span>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "850", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
              Corporate Partnerships & Campus Deployments
            </h3>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={onIngestClick}
              className="btn-primary"
              style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", background: "linear-gradient(135deg, var(--primary), var(--secondary))", cursor: "pointer" }}
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
          {metrics.b2bProjects && metrics.b2bProjects.length > 0 ? (
            metrics.b2bProjects.map(proj => {
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
                                🏫 {alloc.assignedTo}
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
              <span>💼 No corporate projects active in the portfolio yet.</span>
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

// ==========================================
// B2B MODERATOR PORTAL COMPONENTS
// ==========================================

function ModeratorDashboardView({ projects, loading, onRefresh, onAssignClick, onIngestClick }) {
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
          <span>🛠️ Ingested proposals</span>
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
          <span>🚨 Deadlines & Alerts Console</span>
        </button>
      </div>

      {activeTab === "proposals" ? (
        /* Projects Intake Glass Board */
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-main)" }}>🛠️ Project Intake Board</h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px" }}>Review budget scope, and instantly automate provisioning to campus Jira spaces.</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={onIngestClick}
                className="btn-primary"
                style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", background: "linear-gradient(135deg, var(--primary), var(--secondary))", cursor: "pointer" }}
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
                            ? "🚨 Breached"
                            : proj.status === "Active"
                            ? "✅ Active"
                            : proj.status === "Proposed"
                            ? "⏳ Proposed"
                            : "⏳ Pending Review"}
                        </span>
                      </td>

                      {/* Action Column */}
                      <td style={{ padding: "16px", textAlign: "center" }}>
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
                              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)"
                            }}
                          >
                            Assign Project
                          </button>
                        )}
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
                  <span style={{ color: "#ef4444" }}>🚨</span>
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
                    <span>🖥️ AUDITOR CLI TERMINAL</span>
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
                                      🏫 {alloc.assignedTo}
                                    </div>

                                    {/* JIRA Epic Key */}
                                    <div style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: isProposed ? "var(--text-dim)" : "var(--primary)", fontWeight: "bold" }}>
                                      {alloc.assignedKey || "Awaiting Decision"}
                                    </div>

                                    {/* Target deadline */}
                                    <div style={{ fontSize: "11.5px", color: isBreached ? "#f87171" : "var(--text-muted)", fontWeight: "700" }}>
                                      ⏰ {alloc.proposedDueDate}
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
                                        {isBreached ? "🚨 BREACHED" : (isProposed ? "⏳ PROPOSED" : "⏳ ACTIVE")}
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
                                        Alert Spoke ✉️
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

// ==========================================
// COLLABORATIVE Sync Meetings PORTAL VIEW
// ==========================================

function MeetingsPortalView({ meetings, loading, onRefresh, spokes, triggerToast, moderatorProjects = [] }) {
  const getSpokeProjectStatus = (spokeName) => {
    const activeProjs = moderatorProjects.filter(p => p.assignedTo === spokeName && (p.status === "Active" || p.status.startsWith("Assigned") || p.status.includes("BREACHED")));
    const proposedProjs = moderatorProjects.filter(p => p.assignedTo === spokeName && p.status === "Proposed");
    
    if (activeProjs.length > 0) {
      return `🔥 Active: ${activeProjs.map(p => p.company).join(", ")}`;
    }
    if (proposedProjs.length > 0) {
      return `⏳ Proposed: ${proposedProjs.map(p => p.company).join(", ")}`;
    }
    return `💤 Awaiting Projects`;
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
      triggerToast(`⚠️ Schedule Conflict: There is already a sync scheduled for this campus today at ${newTime}!`, "warning");
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
                <span>📅 Interactive Scheduling Calendar</span>
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
                      ? "linear-gradient(135deg, var(--primary), var(--secondary))"
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
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>📅 Scheduled FIP Syncs</h3>
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
                        🏢 {spokeName}
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
                            ⚠️ Conflict
                          </span>
                        )}
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--primary)" }}>⏰ {meet.time}</div>
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
                        🎥 Join Sync Room (Jitsi Video)
                      </button>
                      <a
                        href={meet.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "11.5px", color: "var(--text-muted)", textDecoration: "none", fontWeight: "600" }}
                      >
                        🔗 Alternative Link
                      </a>
                    </div>
                    
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
                      {isReminderActive ? "Relaying alerts..." : "📢 Dispatch Prep Reminder"}
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
          ➕ Schedule FIP Campus Sync
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
                    🏢 {s.name} ({s.key}) — [{status}]
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
              background: "linear-gradient(135deg, var(--primary), var(--secondary))",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.2)",
              cursor: "pointer"
            }}
          >
            {isScheduling ? "Creating sync..." : "Schedule Sync Meeting 🚀"}
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
                🎥 ApniLeap Live Sync Room: {activeJitsiMeeting.title}
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
                🔲 Full Screen
              </button>
              <button
                type="button"
                onClick={() => setActiveJitsiMeeting(null)}
                className="btn-primary"
                style={{
                  padding: "8px 16px",
                  background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)"
                }}
              >
                ❌ Close Sync Room
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