const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

// Force Google DNS to bypass local router DNS issues with MongoDB Atlas SRV querySrv
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const CorporateProject = require("./models/CorporateProject");
const MockTask = require("./models/MockTask");
const Meeting = require("./models/Meeting");
const Submission = require("./models/Submission");
const Team = require("./models/Team");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Secure JWT verification middleware to restrict API write endpoints
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Access Denied: Secure JWT authorization token required." });
  }

  jwt.verify(token, process.env.JWT_SECRET || "apnileap_secret_session_token_key_123!", (err, user) => {
    if (err) {
      console.warn("[AUTH FAILURE] Invalid or expired JWT token received.");
      return res.status(403).json({ error: "Access Denied: Invalid or expired session token." });
    }
    req.user = user;
    next();
  });
}

const auth = Buffer.from(
  `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
).toString("base64");

// Simple In-Memory Cache Store for JIRA API calls to prevent timeouts and speed up loads
const apiCache = {
  myself: null,
  myselfTime: 0,
  members: {}, // boardId -> { data, time }
  tasks: {},   // boardId -> { data, time }
  hubMetrics: null,
  hubMetricsTime: 0,
  moderatorProjects: null,
  moderatorProjectsTime: 0
};

// Expiration times (in milliseconds) - optimized to cache for longer since mutations actively invalidate
const CACHE_EXPIRY = {
  myself: 60 * 60 * 1000,       // 1 hour
  members: 15 * 60 * 1000,      // 15 minutes
  tasks: 10 * 60 * 1000,        // 10 minutes
  hubMetrics: 10 * 60 * 1000,   // 10 minutes
  moderatorProjects: 10 * 60 * 1000 // 10 minutes
};

// High-performance Offline Circuit Breaker state variables
let isJiraOffline = false;
let lastOfflineCheck = 0;

// Helper to determine if we should contact Jira or bypass to mock data immediately
function shouldCheckJira() {
  if (!isJiraOffline) return true;
  // If offline, retry contacting live JIRA only after 2 minutes
  if (Date.now() - lastOfflineCheck > 2 * 60 * 1000) {
    console.log("🔄 [RETRY ONLINE] Retrying live JIRA connectivity...");
    isJiraOffline = false;
    return true;
  }
  return false;
}

// Helper to handle and cache live JIRA network connectivity failures
function handleJiraNetworkError(err) {
  const code = err.code || (err.response && err.response.code) || "";
  const isTerminal = code === 'ENOTFOUND' || code === 'ECONNREFUSED' || code === 'EHOSTUNREACH' || code === 'ETIMEDOUT' || err.message.includes('timeout') || err.message.includes('ENOTFOUND');
  if (isTerminal) {
    if (!isJiraOffline) {
      console.warn("⚠️ [OFFLINE DETECTED] JIRA is unreachable. Activating circuit breaker (bypassing live fetches to prevent timeouts).");
    }
    isJiraOffline = true;
    lastOfflineCheck = Date.now();
  }
}

// Function to invalidate relevant caches when tasks/allocations change
function invalidateCache(boardId = null) {
  console.log(`[CACHE] Invalidating cache. Target Board ID: ${boardId || 'ALL'}`);
  if (boardId) {
    let resolvedBoardId = boardId;
    if (boardId === 75 || boardId === "75") resolvedBoardId = "3";
    else if (boardId === 76 || boardId === "76") resolvedBoardId = "101";
    else if (boardId === 77 || boardId === "77") resolvedBoardId = "102";
    else if (boardId === 78 || boardId === "78") resolvedBoardId = "103";

    delete apiCache.tasks[resolvedBoardId];
    delete apiCache.members[resolvedBoardId];
  } else {
    apiCache.tasks = {};
    apiCache.members = {};
  }
  apiCache.hubMetrics = null;
  apiCache.hubMetricsTime = 0;
  apiCache.moderatorProjects = null;
  apiCache.moderatorProjectsTime = 0;
}

// ApniLeap Hub & Spoke Configurations
const SPOKES = {
  "3": { name: "KLE Spoke", key: "AK", live: true, boardId: 75 },
  "101": { name: "COEP Spoke", key: "AK", live: true, boardId: 76 },
  "102": { name: "MMCOEP Spoke", key: "AK", live: true, boardId: 77 },
  "103": { name: "RIT Spoke", key: "AK", live: true, boardId: 78 },
};

const LIVE_BOARD_IDS = Object.values(SPOKES).filter(s => s.live).map(s => s.boardId);

const CAMPUS_LABELS = {
  "3": "kle-spoke",
  "101": "coep-spoke",
  "102": "mmcoep-spoke",
  "103": "rit-spoke"
};

let mockTasksStore = {
  "3": [],
  "101": [],
  "102": [],
  "103": []
};

const CAMPUS_TEAM_MEMBERS = {
  "3": [ // KLE Spoke
    { accountId: "mock-kle-1", displayName: "Rahul Sharma (Student Developer)", emailAddress: "rahul@kle.edu", email: "rahul@kle.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=12" } },
    { accountId: "mock-kle-2", displayName: "Priya Patel (Student Developer)", emailAddress: "priya@kle.edu", email: "priya@kle.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=47" } },
    { accountId: "mock-kle-3", displayName: "Prof. Deshpande (Faculty Mentor)", emailAddress: "mentor@kle.edu", email: "mentor@kle.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=63" } }
  ],
  "101": [ // COEP Spoke
    { accountId: "mock-coep-1", displayName: "Sneha Joshi (Student Developer)", emailAddress: "sneha@coep.edu", email: "sneha@coep.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=35" } },
    { accountId: "mock-coep-2", displayName: "Amit Waghmare (Student Developer)", emailAddress: "amit@coep.edu", email: "amit@coep.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=11" } }
  ],
  "102": [ // MMCOEP Spoke
    { accountId: "mock-mmcoep-1", displayName: "Nikhil Rane (Student Developer)", emailAddress: "nikhil@mmcoep.edu", email: "nikhil@mmcoep.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=33" } },
    { accountId: "mock-mmcoep-2", displayName: "Sayali Deshmukh (Student Developer)", emailAddress: "sayali@mmcoep.edu", email: "sayali@mmcoep.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=49" } }
  ],
  "103": [ // RIT Spoke
    { accountId: "mock-rit-1", displayName: "Tejas Shinde (Student Developer)", emailAddress: "tejas@rit.edu", email: "tejas@rit.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=15" } },
    { accountId: "mock-rit-2", displayName: "Priti Patil (Student Developer)", emailAddress: "priti@rit.edu", email: "priti@rit.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=45" } }
  ]
};

let jiraSimulatedAssigneeStore = {};

const STUDENT_DEVELOPERS = [
  { accountId: "mock-kle-student", displayName: "KLE Student Developer", emailAddress: "student@kle.edu", email: "student@kle.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=12" } },
  { accountId: "mock-coep-student", displayName: "COEP Student Developer", emailAddress: "student@coep.edu", email: "student@coep.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=35" } },
  { accountId: "mock-rit-student", displayName: "RIT Student Developer", emailAddress: "student@rit.edu", email: "student@rit.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=15" } }
];

const MOCK_ASSIGNEES = [
  { accountId: "mock-1", displayName: "Manasa Vasare (Coordinator)", emailAddress: "coordinator@kle.edu", email: "coordinator@kle.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=32" } },
  ...STUDENT_DEVELOPERS,
  ...CAMPUS_TEAM_MEMBERS["3"],
  ...CAMPUS_TEAM_MEMBERS["101"],
  ...CAMPUS_TEAM_MEMBERS["102"],
  ...CAMPUS_TEAM_MEMBERS["103"],
];

function initMockData() {
  console.log("Pre-populating mock tasks for accepted multi-college B2B projects...");
  
  const b2bPreloads = [
    {
      boardId: "103", // RIT Spoke
      epicKey: "PNLP-3",
      company: "NVIDIA",
      title: "Real-Time Sign Language Translator",
      description: "Develop a deep learning-based translator running on NVIDIA Jetson to convert sign language gestures to text/speech in real-time.",
      proposedDueDate: "2026-02-25",
      taskStatuses: ["Backlog"] // 0 done, 1 backlog = 0% progress! (Urgent deadline breach demo)
    },
    {
      boardId: "3", // KLE
      epicKey: "AK-12",
      company: "NVIDIA",
      title: "Edge AI Smart Agriculture System",
      description: "Build an AI-based system using Jetson Nano for precision agriculture monitoring, soil health inspection, and pest detection on crops.",
      proposedDueDate: "2026-08-25",
      taskStatuses: ["Done", "In Progress", "Backlog"] // 1 done, 1 in progress, 1 backlog = 33% progress!
    },
    {
      boardId: "101", // COEP
      epicKey: "AK-15",
      company: "NVIDIA",
      title: "Edge AI Smart Agriculture System",
      description: "Build an AI-based system using Jetson Nano for precision agriculture monitoring, soil health inspection, and pest detection on crops.",
      proposedDueDate: "2026-09-10",
      taskStatuses: ["Done", "Done", "Backlog"] // 2 done, 0 in progress, 1 backlog = 67% progress!
    },
    {
      boardId: "101", // COEP
      epicKey: "AK-21",
      company: "Intel",
      title: "Automotive VLSI Controller Chip",
      description: "Design and verify a micro-controller unit (MCU) for dashboard telemetry and advanced sensor fusion in electric vehicles.",
      proposedDueDate: "2026-10-15",
      taskStatuses: ["Backlog", "Backlog", "Backlog"] // 0% progress!
    },
    {
      boardId: "3", // KLE
      epicKey: "AK-22",
      company: "Intel",
      title: "Automotive VLSI Controller Chip",
      description: "Design and verify a micro-controller unit (MCU) for dashboard telemetry and advanced sensor fusion in electric vehicles.",
      proposedDueDate: "2026-09-05",
      taskStatuses: ["Done", "Done", "Done"] // 100% progress!
    }
  ];

  // Student Quick Login mappings to assign mock tasks and make dashboard fully functional
  const studentUserMap = {
    "3": { accountId: "mock-kle-student", displayName: "KLE Student Developer", emailAddress: "student@kle.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=12" } },
    "101": { accountId: "mock-coep-student", displayName: "COEP Student Developer", emailAddress: "student@coep.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=35" } },
    "103": { accountId: "mock-rit-student", displayName: "RIT Student Developer", emailAddress: "student@rit.edu", avatarUrls: { "48x48": "https://i.pravatar.cc/150?img=15" } }
  };

  b2bPreloads.forEach(preload => {
    const spoke = SPOKES[preload.boardId];
    if (!spoke) return;

    if (!mockTasksStore[preload.boardId]) {
      mockTasksStore[preload.boardId] = [];
    }

    const spokeTasks = mockTasksStore[preload.boardId];
    
    // Create Epic
    const epicSummary = `[${preload.company}] ${preload.title}`;
    const descriptionText = `${preload.description}\n\nSponsor: ${preload.company}`;
    
    const newEpic = {
      id: `mock-${preload.boardId}-epic-preload-${preload.epicKey}`,
      key: preload.epicKey,
      fields: {
        summary: epicSummary,
        description: descriptionText,
        status: { name: preload.taskStatuses.every(s => s === "Done") ? "Done" : "In Progress" },
        priority: { name: "High" },
        issuetype: { name: "Epic" },
        created: new Date().toISOString(),
        dueDate: preload.proposedDueDate,
        flagged: false,
        timetracking: null,
        subtasks: [],
        labels: ["B2B-Sponsor", CAMPUS_LABELS[preload.boardId] || "kle-spoke"],
        parent: null
      }
    };
    spokeTasks.push(newEpic);

    // Create 3 child tasks
    const standardTasks = [
      `Phase 1: Lab Infrastructure Setup & Hardware Procurement`,
      `Phase 2: Faculty Upskilling & Student Cohort Selection`,
      `Phase 3: Development, Industry Mentorship & Evaluation`
    ];

    const finalDue = new Date(preload.proposedDueDate);
    const start = new Date("2026-05-27");
    const diffMs = finalDue.getTime() - start.getTime();
    const t1DueDate = new Date(start.getTime() + Math.round(diffMs * 0.3)).toISOString().split("T")[0];
    const t2DueDate = new Date(start.getTime() + Math.round(diffMs * 0.6)).toISOString().split("T")[0];
    const t3DueDate = finalDue.toISOString().split("T")[0];
    const taskDueDates = [t1DueDate, t2DueDate, t3DueDate];

    standardTasks.forEach((taskSummary, idx) => {
      const childKey = `${preload.epicKey}-${idx + 1}`;
      const statusVal = preload.taskStatuses[idx] || "Backlog";
      
      // Determine assignee dynamically (Phase 1 is assigned to our logged in student developer account)
      let taskAssignee = null;
      if (idx === 0) {
        taskAssignee = studentUserMap[preload.boardId] || null;
      } else {
        const team = CAMPUS_TEAM_MEMBERS[preload.boardId] || [];
        const memberIdx = (idx - 1) % team.length;
        const member = team[memberIdx];
        if (member) {
          taskAssignee = {
            accountId: member.accountId,
            displayName: member.displayName,
            avatarUrls: member.avatarUrls,
            emailAddress: member.emailAddress || member.email || ""
          };
        }
      }

      const newChild = {
        id: `mock-${preload.boardId}-child-preload-${childKey}`,
        key: childKey,
        fields: {
          summary: taskSummary,
          description: `Automated child task created under Epic ${preload.epicKey} representing company project assigned to ${spoke.name}.`,
          status: { name: statusVal },
          priority: { name: "Medium" },
          issuetype: { name: "Task" },
          assignee: taskAssignee,
          reporter: MOCK_ASSIGNEES[0],
          created: new Date().toISOString(),
          dueDate: taskDueDates[idx],
          flagged: false,
          timetracking: { timeSpentSeconds: statusVal === "Done" ? 36000 : 0, originalEstimateSeconds: 36000, remainingEstimateSeconds: statusVal === "Done" ? 0 : 36000 },
          subtasks: [],
          labels: ["B2B-Task", CAMPUS_LABELS[preload.boardId] || "kle-spoke"],
          parent: {
            id: newEpic.id,
            key: preload.epicKey,
            summary: epicSummary,
            issueType: "Epic"
          }
        }
      };
      newChild.fields.status.name = statusVal; // Explicit assignment
      spokeTasks.push(newChild);
    });
  });

  console.log("Mock B2B Epic and task hierarchies successfully pre-populated!");
}

initMockData();

app.get("/spokes", (req, res) => {
  res.json(Object.values(SPOKES));
});

// GET /spokes/:boardId/members - Combined Live JIRA + Persistent MongoDB + Simulated Spoke Members
app.get("/spokes/:boardId/members", async (req, res) => {
  const { boardId } = req.params;
  const now = Date.now();
  
  if (apiCache.members[boardId] && (now - apiCache.members[boardId].time < CACHE_EXPIRY.members)) {
    return res.json(apiCache.members[boardId].data);
  }

  // Stale-While-Revalidate: serve stale if offline/circuit-breaker active
  if (apiCache.members[boardId] && !shouldCheckJira()) {
    return res.json(apiCache.members[boardId].data);
  }

  let members = [];

  // 1. Fetch live JIRA assignable users (only if JIRA is online)
  if (shouldCheckJira()) {
    try {
      const response = await axios.get(
        `${process.env.JIRA_DOMAIN}/rest/api/2/user/assignable/search?project=AK`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          },
          timeout: 10000
        }
      );
      members = response.data.map(u => ({
        accountId: u.accountId,
        displayName: u.displayName,
        emailAddress: u.emailAddress || "",
        avatarUrl: u.avatarUrls?.["48x48"] || "https://i.pravatar.cc/150"
      }));
    } catch (err) {
      console.warn("Failed to retrieve live assignable JIRA users:", err.message);
      handleJiraNetworkError(err);
    }
  }

  // 2. Load campus-specific persistent MongoDB users
  let dbMembers = [];
  try {
    const personaMap = {
      "3": "spoke-kle",
      "101": "spoke-coep",
      "102": "spoke-mmcoep",
      "103": "spoke-rit"
    };
    const targetPersona = personaMap[boardId] || "spoke-kle";
    const dbUsers = await User.find({ persona: targetPersona });
    dbMembers = dbUsers.map(u => ({
      accountId: u._id.toString(),
      displayName: `${u.displayName} (${u.role})`,
      emailAddress: u.email,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=6366f1&color=fff`,
      isPersistent: true
    }));
  } catch (err) {
    console.error("Failed to load persistent users from MongoDB:", err.message);
  }

  // 3. Load campus-specific simulated members
  const simulated = CAMPUS_TEAM_MEMBERS[boardId] || [];
  const normalizedSimulated = simulated.map(u => ({
    accountId: u.accountId,
    displayName: u.displayName,
    emailAddress: u.emailAddress || u.email || "",
    avatarUrl: u.avatarUrls?.["48x48"] || "https://i.pravatar.cc/150",
    isSimulated: true
  }));

  // 4. Combine and deduplicate members by email to prevent duplicate listings
  const result = [];
  const seenEmails = new Set();
  
  const allMembers = [...members, ...dbMembers, ...normalizedSimulated];
  for (const m of allMembers) {
    const email = (m.emailAddress || "").toLowerCase().trim();
    if (email && seenEmails.has(email)) {
      continue;
    }
    if (email) {
      seenEmails.add(email);
    }
    result.push(m);
  }

  apiCache.members[boardId] = {
    data: result,
    time: now
  };

  res.json(result);
});

app.get("/tasks", async (req, res) => {
  const boardId = req.query.boardId || "3";
  const spoke = SPOKES[boardId];
  const now = Date.now();

  if (spoke && spoke.live && shouldCheckJira()) {
    if (apiCache.tasks[boardId] && (now - apiCache.tasks[boardId].time < CACHE_EXPIRY.tasks)) {
      return res.json(apiCache.tasks[boardId].data);
    }

    try {
      const response = await axios.get(
        `${process.env.JIRA_DOMAIN}/rest/agile/1.0/board/${spoke.boardId}/issue`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          },
          timeout: 10000
        }
      );

      let issues = response.data.issues || [];

      // Auto-Labeling Isolation for newly provisioned Agile boards
      if (LIVE_BOARD_IDS.includes(spoke.boardId)) {
        issues = issues.filter(issue => {
          const labels = issue.fields?.labels || [];
          if (boardId === "3") {
            // KLE Spoke: Show issues labeled "kle-spoke" OR issues that don't have other campus labels (preserving historic untagged)
            return labels.includes("kle-spoke") || (!labels.includes("rit-spoke") && !labels.includes("coep-spoke") && !labels.includes("mmcoep-spoke"));
          } else if (boardId === "101") {
            // COEP Spoke: Show ONLY issues labeled "coep-spoke"
            return labels.includes("coep-spoke");
          } else if (boardId === "102") {
            // MMCOEP Spoke: Show ONLY issues labeled "mmcoep-spoke"
            return labels.includes("mmcoep-spoke");
          } else if (boardId === "103") {
            // RIT Spoke: Show ONLY issues labeled "rit-spoke"
            return labels.includes("rit-spoke");
          }
          return true;
        });
      }

      // Overlay simulated assignees from store if present
      issues = issues.map(issue => {
        const simulatedAssignee = jiraSimulatedAssigneeStore[issue.key];
        if (simulatedAssignee) {
          return {
            ...issue,
            fields: {
              ...issue.fields,
              assignee: {
                accountId: simulatedAssignee.accountId,
                displayName: simulatedAssignee.displayName,
                avatarUrls: { "48x48": simulatedAssignee.avatarUrl },
                emailAddress: simulatedAssignee.emailAddress || ""
              }
            }
          };
        }
        return issue;
      });

      apiCache.tasks[boardId] = {
        data: issues,
        time: now
      };

      res.json(issues);
    } catch (error) {
      console.error(`Jira Fetch Error for board ${spoke.boardId} (${spoke.name}):`, error.response?.data || error.message);
      handleJiraNetworkError(error);
      
      // Fallback to cached tasks if available
      if (apiCache.tasks[boardId]) {
        console.warn(`Returning cached tasks for board ${boardId} due to Jira fetch error.`);
        return res.json(apiCache.tasks[boardId].data);
      }
      
      res.status(500).json({ error: "Failed to fetch Jira tasks", details: error.response?.data || error.message });
    }
  } else {
    // Return persistent mock data from MongoDB Atlas
    try {
      const dbTasks = await MockTask.find({ boardId });
      const mappedTasks = dbTasks.map(t => ({
        id: t.id,
        key: t.key,
        fields: t.fields
      }));
      res.json(mappedTasks);
    } catch (err) {
      console.error("Failed to load mock tasks from MongoDB:", err.message);
      res.json(mockTasksStore[boardId] || []);
    }
  }
});

// Get currently authenticated Jira user profile details
app.get("/myself", async (req, res) => {
  const now = Date.now();
  if (apiCache.myself && (now - apiCache.myselfTime < CACHE_EXPIRY.myself)) {
    return res.json(apiCache.myself);
  }

  if (apiCache.myself && !shouldCheckJira()) {
    return res.json(apiCache.myself);
  }

  if (!shouldCheckJira()) {
    const mockProfile = {
      accountId: "admin-mock-id",
      displayName: "Demo Admin (Offline Mode)",
      emailAddress: process.env.JIRA_EMAIL || "admin@apnileap.com",
      avatarUrls: {
        "48x48": "https://i.pravatar.cc/150?img=68"
      },
      active: true,
      timeZone: "Asia/Kolkata"
    };
    return res.json(mockProfile);
  }

  try {
    const response = await axios.get(
      `${process.env.JIRA_DOMAIN}/rest/api/2/myself`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
        timeout: 10000
      }
    );
    apiCache.myself = response.data;
    apiCache.myselfTime = now;
    return res.json(response.data);
  } catch (error) {
    console.warn("Jira Myself Fetch Error, falling back to cached or mock profile:", error.message);
    handleJiraNetworkError(error);
    if (apiCache.myself) {
      return res.json(apiCache.myself);
    }
    // Return a mock fallback profile to avoid breaking login
    const mockProfile = {
      accountId: "admin-mock-id",
      displayName: "Demo Admin (Offline Mode)",
      emailAddress: process.env.JIRA_EMAIL || "admin@apnileap.com",
      avatarUrls: {
        "48x48": "https://i.pravatar.cc/150?img=68"
      },
      active: true,
      timeZone: "Asia/Kolkata"
    };
    return res.json(mockProfile);
  }
});

// Create new issue in Jira project dynamically resolved from active board issues
app.post("/tasks", authenticateToken, async (req, res) => {
  const { summary, description, statusName, priorityName, assigneeId, reporterId, dueDate, issueTypeName, boardId, parentId, parentKey, parentSummary } = req.body;
  const targetBoardId = boardId || "3";
  const spoke = SPOKES[targetBoardId];

  // Resolve assignee and reporter details (handles simulated and persistent MongoDB users)
  let assignedUserObj = null;
  if (assigneeId) {
    assignedUserObj = MOCK_ASSIGNEES.find(a => a.accountId === assigneeId);
    if (!assignedUserObj && /^[0-9a-fA-F]{24}$/.test(assigneeId)) {
      try {
        const dbUser = await User.findById(assigneeId);
        if (dbUser) {
          assignedUserObj = {
            accountId: assigneeId,
            displayName: `${dbUser.displayName} (${dbUser.role})`,
            avatarUrls: { "48x48": `https://ui-avatars.com/api/?name=${encodeURIComponent(dbUser.displayName)}&background=6366f1&color=fff` },
            emailAddress: dbUser.email
          };
        }
      } catch (err) {
        console.error("Failed to resolve persistent user for assignment:", err.message);
      }
    }
    // Check if assignee is a custom Spoke Team persistently registered
    if (!assignedUserObj && /^[0-9a-fA-F]{24}$/.test(assigneeId)) {
      try {
        const teamObj = await Team.findById(assigneeId);
        if (teamObj) {
          assignedUserObj = {
            accountId: assigneeId,
            displayName: `👥 [TEAM] ${teamObj.name}`,
            avatarUrls: { "48x48": `https://ui-avatars.com/api/?name=${encodeURIComponent(teamObj.name)}&background=3b82f6&color=fff&rounded=true` },
            emailAddress: `team-${assigneeId}@apnileap.com`,
            isTeam: true
          };
        }
      } catch (err) {
        console.error("Failed to resolve custom team for assignment:", err.message);
      }
    }
    if (!assignedUserObj) {
      assignedUserObj = {
        accountId: assigneeId,
        displayName: "Team Member",
        avatarUrls: { "48x48": "https://i.pravatar.cc/150" }
      };
    }
  }

  let reporterUserObj = null;
  if (reporterId) {
    reporterUserObj = MOCK_ASSIGNEES.find(a => a.accountId === reporterId);
    if (!reporterUserObj && /^[0-9a-fA-F]{24}$/.test(reporterId)) {
      try {
        const dbUser = await User.findById(reporterId);
        if (dbUser) {
          reporterUserObj = {
            accountId: reporterId,
            displayName: `${dbUser.displayName} (${dbUser.role})`,
            avatarUrls: { "48x48": `https://ui-avatars.com/api/?name=${encodeURIComponent(dbUser.displayName)}&background=6366f1&color=fff` },
            emailAddress: dbUser.email
          };
        }
      } catch (err) {
        console.error("Failed to resolve persistent user for reporter:", err.message);
      }
    }
    if (!reporterUserObj) {
      reporterUserObj = {
        accountId: reporterId,
        displayName: "Reporter",
        avatarUrls: { "48x48": "https://i.pravatar.cc/150" }
      };
    }
  }

  if ((spoke && !spoke.live) || !shouldCheckJira()) {
    try {
      const dbTaskCount = await MockTask.countDocuments({ boardId: targetBoardId });
      const prefix = spoke.key;
      const newIndex = dbTaskCount + 1;
      const newKey = `${prefix}-${newIndex}`;
      const newId = `${targetBoardId}-task-${newIndex}`;

      const newIssue = {
        id: newId,
        key: newKey,
        fields: {
          summary,
          description: description || "",
          status: { name: statusName || "Backlog" },
          priority: { name: priorityName || "Medium" },
          issuetype: { name: issueTypeName || "Task" },
          assignee: assignedUserObj,
          reporter: reporterUserObj,
          created: new Date().toISOString(),
          duedate: dueDate || null,
          customfield_10021: null,
          subtasks: [],
          issuelinks: [],
          labels: parentId ? ["B2B-Task", CAMPUS_LABELS[targetBoardId] || "kle-spoke"] : [],
          parent: parentId ? {
            id: parentId,
            key: parentKey,
            summary: parentSummary,
            issueType: "Epic"
          } : null
        }
      };

      const newDbTask = new MockTask({
        id: newId,
        key: newKey,
        boardId: targetBoardId,
        fields: newIssue.fields
      });
      await newDbTask.save();

      // Maintain in-memory store for sync compatibility
      const issues = mockTasksStore[targetBoardId] || [];
      issues.push(newIssue);
      mockTasksStore[targetBoardId] = issues;

      invalidateCache(targetBoardId);
      return res.json({ success: true, key: newKey, id: newId });
    } catch (err) {
      console.error("Mock Create Issue Error:", err);
      return res.status(500).json({ error: "Failed to create mock task" });
    }
  }

  // Live Jira API path
  try {
    // 1. Fetch active issues to extract project key automatically
    const boardIssuesRes = await axios.get(
      `${process.env.JIRA_DOMAIN}/rest/agile/1.0/board/${spoke.boardId}/issue`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      }
    );
    const issues = boardIssuesRes.data.issues;
    if (!issues || issues.length === 0) {
      return res.status(400).json({ error: "Cannot determine project key because active board issues list is empty." });
    }
    const projectKey = issues[0].fields.project.key;

    // 2. Construct the issue fields payload
    const fields = {
      project: { key: projectKey },
      summary: summary,
      issuetype: { name: issueTypeName || "Task" },
      labels: LIVE_BOARD_IDS.includes(spoke.boardId) ? [CAMPUS_LABELS[targetBoardId] || "kle-spoke"] : ["manual"]
    };

    if (description !== undefined) fields.description = description;
    if (dueDate) fields.duedate = dueDate;
    if (priorityName) fields.priority = { name: priorityName };
    
    if (assigneeId) {
      if (assigneeId.startsWith("mock-") || /^[0-9a-fA-F]{24}$/.test(assigneeId)) {
        fields.assignee = null;
      } else {
        fields.assignee = { accountId: assigneeId };
      }
    }


    // 3. Post to Jira Create Issue endpoint
    const createRes = await axios.post(
      `${process.env.JIRA_DOMAIN}/rest/api/2/issue`,
      { fields },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    );

    const newIssueKey = createRes.data.key;
    const newIssueId = createRes.data.id;

    // Overlay mock or persistent assignee in store post-creation
    if (assigneeId && (assigneeId.startsWith("mock-") || /^[0-9a-fA-F]{24}$/.test(assigneeId))) {
      if (assignedUserObj) {
        jiraSimulatedAssigneeStore[newIssueKey] = {
          accountId: assignedUserObj.accountId,
          displayName: assignedUserObj.displayName,
          avatarUrl: assignedUserObj.avatarUrls?.["48x48"] || "https://i.pravatar.cc/150",
          emailAddress: assignedUserObj.emailAddress
        };
      }
    }

    // 4. Transition the issue if it is created in a column other than Backlog
    if (statusName && statusName !== "Backlog") {
      try {
        const transitionsRes = await axios.get(
          `${process.env.JIRA_DOMAIN}/rest/api/3/issue/${newIssueKey}/transitions`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              Accept: "application/json",
            }
          }
        );
        const transitions = transitionsRes.data.transitions;
        const transition = transitions.find(t => 
          t.name.toLowerCase() === statusName.toLowerCase() ||
          t.to.name.toLowerCase() === statusName.toLowerCase()
        );
        if (transition) {
          await axios.post(
            `${process.env.JIRA_DOMAIN}/rest/api/3/issue/${newIssueKey}/transitions`,
            { transition: { id: transition.id } },
            {
              headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
                "Content-Type": "application/json"
              }
            }
          );
        }
      } catch (transitionErr) {
        console.error("Transition error during creation:", transitionErr.message);
      }
    }

    // 5. Check if the board has an active sprint, and if so, associate the new issue to it immediately
    try {
      const sprintsRes = await axios.get(
        `${process.env.JIRA_DOMAIN}/rest/agile/1.0/board/${spoke.boardId}/sprint?state=active`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          }
        }
      );
      const activeSprints = sprintsRes.data.values;
      if (activeSprints && activeSprints.length > 0) {
        const activeSprintId = activeSprints[0].id;
        await axios.post(
          `${process.env.JIRA_DOMAIN}/rest/agile/1.0/sprint/${activeSprintId}/issue`,
          { issues: [newIssueKey] },
          {
            headers: {
              Authorization: `Basic ${auth}`,
              Accept: "application/json",
              "Content-Type": "application/json"
            }
          }
        );
        console.log(`Associated new issue ${newIssueKey} to active sprint ID ${activeSprintId}`);
      }
    } catch (sprintErr) {
      console.warn("Sprint association warning:", sprintErr.response?.data || sprintErr.message);
    }

    invalidateCache(targetBoardId);
    res.json({ success: true, key: newIssueKey, id: newIssueId });
  } catch (error) {
    console.error("Create Issue Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create issue in Jira", details: error.response?.data || error.message });
  }
});

// Update fields of an issue in Jira
app.put("/tasks/:key", authenticateToken, async (req, res) => {
  const { key } = req.params;
  const { summary, description, dueDate, assignee, reporter, priority } = req.body;

  const projectKey = key.split("-")[0];
  const spoke = Object.values(SPOKES).find(s => s.key === projectKey);

  if (!spoke) {
    return res.status(400).json({ error: "Invalid task key context. Spoke project not found." });
  }

  // Resolve assignee and reporter details (handles simulated and persistent MongoDB users)
  let assignedUserObj = null;
  if (assignee !== undefined && assignee !== null) {
    assignedUserObj = MOCK_ASSIGNEES.find(a => a.accountId === assignee);
    if (!assignedUserObj && /^[0-9a-fA-F]{24}$/.test(assignee)) {
      try {
        const dbUser = await User.findById(assignee);
        if (dbUser) {
          assignedUserObj = {
            accountId: assignee,
            displayName: `${dbUser.displayName} (${dbUser.role})`,
            avatarUrls: { "48x48": `https://ui-avatars.com/api/?name=${encodeURIComponent(dbUser.displayName)}&background=6366f1&color=fff` },
            emailAddress: dbUser.email
          };
        }
      } catch (err) {
        console.error("Failed to resolve persistent user for update assignment:", err.message);
      }
    }
    if (!assignedUserObj) {
      assignedUserObj = {
        accountId: assignee,
        displayName: "Team Member",
        avatarUrls: { "48x48": "https://i.pravatar.cc/150" }
      };
    }
  }

  let reporterUserObj = null;
  if (reporter !== undefined && reporter !== null) {
    reporterUserObj = MOCK_ASSIGNEES.find(a => a.accountId === reporter);
    if (!reporterUserObj && /^[0-9a-fA-F]{24}$/.test(reporter)) {
      try {
        const dbUser = await User.findById(reporter);
        if (dbUser) {
          reporterUserObj = {
            accountId: reporter,
            displayName: `${dbUser.displayName} (${dbUser.role})`,
            avatarUrls: { "48x48": `https://ui-avatars.com/api/?name=${encodeURIComponent(dbUser.displayName)}&background=6366f1&color=fff` },
            emailAddress: dbUser.email
          };
        }
      } catch (err) {
        console.error("Failed to resolve persistent user for update reporter:", err.message);
      }
    }
    if (!reporterUserObj) {
      reporterUserObj = {
        accountId: reporter,
        displayName: "Reporter",
        avatarUrls: { "48x48": "https://i.pravatar.cc/150" }
      };
    }
  }

  if (!spoke.live || !shouldCheckJira()) {
    try {
      let dbTask = await MockTask.findOne({ key });
      if (!dbTask) {
        const newIndex = key.split("-")[1] || Date.now();
        const newId = `${spoke.boardId}-task-${newIndex}`;
        dbTask = new MockTask({
          id: newId,
          key: key,
          boardId: spoke.boardId || "3",
          fields: {
            summary: summary || "Sprint Task",
            description: description || "",
            status: { name: "Backlog" },
            priority: { name: priority || "Medium" },
            issuetype: { name: "Task" },
            assignee: assignee ? assignedUserObj : null,
            reporter: reporter ? reporterUserObj : null,
            created: new Date().toISOString(),
            duedate: dueDate === "" ? null : dueDate,
            subtasks: [],
            issuelinks: [],
            labels: []
          }
        });
      } else {
        if (summary !== undefined) dbTask.fields.summary = summary;
        if (description !== undefined) dbTask.fields.description = description;
        if (dueDate !== undefined) dbTask.fields.duedate = dueDate === "" ? null : dueDate;
        if (priority !== undefined) dbTask.fields.priority = { name: priority };
        if (assignee !== undefined) dbTask.fields.assignee = assignee ? assignedUserObj : null;
        if (reporter !== undefined) dbTask.fields.reporter = reporter ? reporterUserObj : null;
      }

      dbTask.markModified("fields");
      await dbTask.save();

      // Maintain in-memory sync state
      if (!mockTasksStore[spoke.boardId]) {
        mockTasksStore[spoke.boardId] = [];
      }
      const issues = mockTasksStore[spoke.boardId];
      let task = issues.find(t => t.key === key);
      if (task) {
        if (summary !== undefined) task.fields.summary = summary;
        if (description !== undefined) task.fields.description = description;
        if (dueDate !== undefined) task.fields.duedate = dueDate === "" ? null : dueDate;
        if (priority !== undefined) task.fields.priority = { name: priority };
        if (assignee !== undefined) task.fields.assignee = assignee ? assignedUserObj : null;
        if (reporter !== undefined) task.fields.reporter = reporter ? reporterUserObj : null;
      } else {
        issues.push({
          id: dbTask.id,
          key: dbTask.key,
          fields: dbTask.fields
        });
      }

      invalidateCache(spoke.boardId);
      return res.json({ success: true, message: `Updated mock issue ${key} successfully` });
    } catch (err) {
      console.error("Failed to update MockTask in MongoDB:", err.message);
      return res.status(500).json({ error: "Failed to update mock task" });
    }
  }

  const fields = {};
  if (summary !== undefined) fields.summary = summary;
  if (description !== undefined) fields.description = description;
  if (dueDate !== undefined) fields.duedate = dueDate === "" ? null : dueDate;
  if (priority !== undefined) fields.priority = priority ? { name: priority } : null;
  
  if (assignee !== undefined) {
    if (assignee && (assignee.startsWith("mock-") || /^[0-9a-fA-F]{24}$/.test(assignee))) {
      if (assignedUserObj) {
        jiraSimulatedAssigneeStore[key] = {
          accountId: assignedUserObj.accountId,
          displayName: assignedUserObj.displayName,
          avatarUrl: assignedUserObj.avatarUrls?.["48x48"] || "https://i.pravatar.cc/150",
          emailAddress: assignedUserObj.emailAddress
        };
      }
      fields.assignee = null; // Bypass live JIRA mapping validation
    } else {
      delete jiraSimulatedAssigneeStore[key];
      fields.assignee = assignee ? { accountId: assignee } : null;
    }
  }


  try {
    await axios.put(
      `${process.env.JIRA_DOMAIN}/rest/api/2/issue/${key}`,
      { fields },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    );
    invalidateCache(spoke ? spoke.boardId : null);
    res.json({ success: true, message: `Updated issue ${key} successfully` });
  } catch (error) {
    console.error("Update Issue Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to update issue in Jira", details: error.response?.data || error.message });
  }
});

// Transition an issue status in Jira
app.post("/tasks/:key/transition", async (req, res) => {
  const { key } = req.params;
  const { statusName } = req.body;

  const projectKey = key.split("-")[0];
  const spoke = Object.values(SPOKES).find(s => s.key === projectKey);

  if (!spoke) {
    return res.status(400).json({ error: "Invalid task key context. Spoke project not found." });
  }

  if (!spoke.live || !shouldCheckJira()) {
    try {
      let dbTask = await MockTask.findOne({ key });
      if (!dbTask) {
        const newIndex = key.split("-")[1] || Date.now();
        const newId = `${spoke.boardId}-task-${newIndex}`;
        dbTask = new MockTask({
          id: newId,
          key: key,
          boardId: spoke.boardId || "3",
          fields: {
            summary: "Sprint Task",
            description: "",
            status: { name: statusName },
            priority: { name: "Medium" },
            issuetype: { name: "Task" },
            assignee: null,
            reporter: null,
            created: new Date().toISOString(),
            duedate: null,
            subtasks: [],
            issuelinks: [],
            labels: []
          }
        });
      } else {
        dbTask.fields.status.name = statusName;
      }

      dbTask.markModified("fields");
      await dbTask.save();

      // Maintain in-memory sync state
      if (!mockTasksStore[spoke.boardId]) {
        mockTasksStore[spoke.boardId] = [];
      }
      const issues = mockTasksStore[spoke.boardId];
      let task = issues.find(t => t.key === key);
      if (task) {
        task.fields.status.name = statusName;
      } else {
        issues.push({
          id: dbTask.id,
          key: dbTask.key,
          fields: dbTask.fields
        });
      }

      invalidateCache(spoke.boardId);
      return res.json({ success: true, message: `Transitioned mock issue ${key} to ${statusName} successfully.` });
    } catch (err) {
      console.error("Failed to transition MockTask in MongoDB:", err.message);
      return res.status(500).json({ error: "Failed to transition mock task" });
    }
  }

  try {
    // 1. Retrieve the list of available transitions for the issue
    const transitionsRes = await axios.get(
      `${process.env.JIRA_DOMAIN}/rest/api/3/issue/${key}/transitions`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        }
      }
    );
    const transitions = transitionsRes.data.transitions;

    // 2. Match the transition destination status name
    const transition = transitions.find(t => 
      t.name.toLowerCase() === statusName.toLowerCase() ||
      t.to.name.toLowerCase() === statusName.toLowerCase()
    );

    if (!transition) {
      return res.status(400).json({ error: `No active transition workflow path found to status: ${statusName}` });
    }

    // 3. Post transition execution
    await axios.post(
      `${process.env.JIRA_DOMAIN}/rest/api/3/issue/${key}/transitions`,
      { transition: { id: transition.id } },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    );

    invalidateCache(spoke ? spoke.boardId : null);
    res.json({ success: true, message: `Transitioned issue ${key} to ${statusName} successfully.` });
  } catch (error) {
    console.error("Transition Issue Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to transition issue status in Jira", details: error.response?.data || error.message });
  }
});

// Delete an issue from Jira
app.delete("/tasks/:key", authenticateToken, async (req, res) => {
  const { key } = req.params;

  const projectKey = key.split("-")[0];
  const spoke = Object.values(SPOKES).find(s => s.key === projectKey);

  if (!spoke) {
    return res.status(400).json({ error: "Invalid task key context. Spoke project not found." });
  }

  if (!spoke.live || !shouldCheckJira()) {
    const issues = mockTasksStore[spoke.boardId] || [];
    const index = issues.findIndex(t => t.key === key);
    if (index !== -1) {
      issues.splice(index, 1);
      mockTasksStore[spoke.boardId] = issues;
      invalidateCache(spoke.boardId);
      return res.json({ success: true, message: `Deleted mock issue ${key} successfully.` });
    } else {
      return res.status(404).json({ error: `Mock issue ${key} not found` });
    }
  }

  try {
    await axios.delete(
      `${process.env.JIRA_DOMAIN}/rest/api/2/issue/${key}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        }
      }
    );
    invalidateCache(spoke ? spoke.boardId : null);
    res.json({ success: true, message: `Deleted issue ${key} from Jira successfully.` });
  } catch (error) {
    console.error("Delete Issue Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to delete issue in Jira", details: error.response?.data || error.message });
  }
});

const nodemailer = require("nodemailer");

// SMTP Email Gateway for Task Reminders (Real & Simulated Fallback)
app.post("/tasks/send-reminder", async (req, res) => {
  const { recipient, subject, taskKey, taskSummary, dueDate, message } = req.body;

  if (!recipient || !subject || !message) {
    return res.status(400).json({ success: false, error: "Missing required email headers or body." });
  }

  // Check if real SMTP config exists in the backend .env
  const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  try {
    let transporter;
    let info;
    let isTestAccount = false;

    if (hasSmtpConfig) {
      // Use real user-configured SMTP
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Create a temporary Ethereal test account on the fly
      isTestAccount = true;
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const redirectEmail = process.env.SMTP_REDIRECT_TO || null;
    const finalTo = redirectEmail ? redirectEmail : recipient;

    const redirectBannerHtml = redirectEmail ? `
      <div style="background: rgba(251, 146, 60, 0.08); border: 1px dashed rgba(251, 146, 60, 0.25); border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #fb923c; text-align: center; line-height: 1.5;">
        ⚙️ <strong>[Demo Rerouting Mode Active]</strong><br/>
        This email was originally addressed to: <span style="font-family: monospace; font-weight: 750; color: #f97316;">${recipient}</span>.<br/>
        It has been rerouted to your administrator address (<strong style="color: white;">${redirectEmail}</strong>) for live verification.
      </div>
    ` : "";

    // Build premium styled HTML notification email template
    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #07090e; padding: 40px; color: #f3f4f6; min-height: 100%;">
        <div style="max-width: 600px; margin: 0 auto; background: rgba(17, 24, 39, 0.9); border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <!-- Logo Header -->
          <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -1px; color: white;">ApniLeap JiraPro</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #e0e7ff;">⚠️ Urgent Sprint Deadline Alert</p>
          </div>
          <!-- Body Panel -->
          <div style="padding: 40px 30px; line-height: 1.6;">
            ${redirectBannerHtml}
            <h2 style="margin-top: 0; color: white; font-size: 18px; font-weight: 700;">Attention Team Member,</h2>
            <p style="font-size: 15px; color: #9ca3af; margin-bottom: 24px;">An active task assigned to you has an approaching target deadline or has fallen overdue. Please review the details below:</p>
            
            <!-- Details Card -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; width: 120px; letter-spacing: 0.5px;">Task Key:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #6366f1; font-family: monospace; font-size: 16px;">${taskKey || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Summary:</td>
                  <td style="padding: 6px 0; color: #f3f4f6; font-size: 14px; font-weight: 600;">${taskSummary || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Due Date:</td>
                  <td style="padding: 6px 0; color: #ef4444; font-size: 14px; font-weight: 700;">⏰ ${dueDate || "N/A"}</td>
                </tr>
              </table>
            </div>

            <!-- Message Block -->
            <div style="border-left: 3px solid #6366f1; padding-left: 16px; margin: 24px 0; font-style: italic; color: #d1d5db; white-space: pre-line;">${message}</div>
          </div>
          <!-- Action Link -->
          <div style="text-align: center; padding: 0 30px 40px 30px;">
            <a href="${process.env.JIRA_DOMAIN}" target="_blank" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);">
              View Issue in Jira Cloud
            </a>
          </div>
          <!-- Footer Panel -->
          <div style="background-color: rgba(255, 255, 255, 0.01); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #6b7280;">
            This alert was triggered from your ApniLeap JiraPro Dashboard Gateway.<br/>
            To use custom domains, configure SMTP environment variables inside the backend .env file.
          </div>
        </div>
      </div>
    `;

    // Send transaction
    info = await transporter.sendMail({
      from: hasSmtpConfig 
        ? `"${process.env.SMTP_FROM_NAME || 'JiraPro Platform'}" <${process.env.SMTP_USER}>` 
        : '"JiraPro Alert Gateway" <no-reply@apnileap.com>',
      to: finalTo,
      subject: subject,
      text: message, // Plain text fallback
      html: htmlTemplate // Premium HTML template layout
    });

    console.log("\n");
    console.log("┌────────────────────────────────────────────────────────┐");
    console.log("│ 📧   APNILEAP JIRAPRO OUTGOING EMAIL GATEWAY (SMTP)     │");
    console.log("├────────────────────────────────────────────────────────┤");
    console.log(`│ TO:         \x1b[36m${recipient}\x1b[0m`);
    if (redirectEmail) {
      console.log(`│ REROUTED TO:\x1b[33m ${redirectEmail} (Demo Rerouting Mode)\x1b[0m`);
    }
    console.log(`│ FROM:       \x1b[32m${hasSmtpConfig ? process.env.SMTP_USER : "no-reply@apnileap.com"}\x1b[0m`);
    console.log(`│ SUBJECT:    \x1b[35m${subject}\x1b[0m`);
    console.log("├────────────────────────────────────────────────────────┤");
    
    let previewUrl = "";
    if (isTestAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`│ PREVIEW:    \x1b[33m${previewUrl}\x1b[0m`);
    } else {
      console.log(`│ DISPATCH:\x1b[32m Real SMTP Relay Gateway (${process.env.SMTP_HOST})\x1b[0m`);
    }
    console.log("└────────────────────────────────────────────────────────┘");
    console.log("\n");

    res.json({
      success: true,
      message: isTestAccount 
        ? `Deadline alert reminder simulated! Preview at: ${previewUrl}`
        : `Deadline alert reminder successfully dispatched to ${recipient}!`,
      previewUrl: previewUrl || null,
      dispatchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("SMTP Gateway Error:", error);
    res.status(500).json({
      success: false,
      error: "Relay Gateway Error",
      message: error.message
    });
  }
});

// Toggle standard Jira issue impediment flag
app.put("/tasks/:key/flag", async (req, res) => {
  const { key } = req.params;
  const { flagged } = req.body;

  const projectKey = key.split("-")[0];
  const spoke = Object.values(SPOKES).find(s => s.key === projectKey);

  if (!spoke) {
    return res.status(400).json({ error: "Invalid task key context. Spoke project not found." });
  }

  if (!spoke.live || !shouldCheckJira()) {
    const issues = mockTasksStore[spoke.boardId] || [];
    const task = issues.find(t => t.key === key);
    if (task) {
      task.fields.customfield_10021 = flagged ? [{ value: "Impediment" }] : null;
      return res.json({ success: true, message: `Successfully updated flag for mock issue ${key}` });
    } else {
      return res.status(404).json({ error: `Mock issue ${key} not found` });
    }
  }

  const fields = {
    // Standard impediment custom field in Jira Cloud
    customfield_10021: flagged ? [{ value: "Impediment" }] : null
  };

  try {
    await axios.put(
      `${process.env.JIRA_DOMAIN}/rest/api/2/issue/${key}`,
      { fields },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    );
    res.json({ success: true, message: `Successfully updated flag for issue ${key}` });
  } catch (error) {
    console.error("Flag Issue Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to toggle blocker flag in Jira", details: error.response?.data || error.message });
  }
});

// Post a new worklog spent time entry to Jira
app.post("/tasks/:key/worklog", async (req, res) => {
  const { key } = req.params;
  const { timeSpent, comment } = req.body;

  const projectKey = key.split("-")[0];
  const spoke = Object.values(SPOKES).find(s => s.key === projectKey);

  if (!spoke) {
    return res.status(400).json({ error: "Invalid task key context. Spoke project not found." });
  }

  if (!spoke.live || !shouldCheckJira()) {
    const issues = mockTasksStore[spoke.boardId] || [];
    const task = issues.find(t => t.key === key);
    if (task) {
      if (!task.fields.worklogs) task.fields.worklogs = [];
      task.fields.worklogs.push({
        id: `mock-wl-${Date.now()}`,
        timeSpent,
        comment: comment || "Logged spent hours via ApniLeap Agile Dashboard",
        created: new Date().toISOString(),
        author: MOCK_ASSIGNEES[0]
      });

      if (!task.fields.timetracking) {
        task.fields.timetracking = { timeSpentSeconds: 0 };
      }
      task.fields.timetracking.timeSpent = timeSpent;
      task.fields.timetracking.timeSpentSeconds = (task.fields.timetracking.timeSpentSeconds || 0) + 7200;
      return res.json({ success: true, message: `Successfully logged ${timeSpent} to mock issue ${key}` });
    } else {
      return res.status(404).json({ error: `Mock issue ${key} not found` });
    }
  }

  try {
    await axios.post(
      `${process.env.JIRA_DOMAIN}/rest/api/2/issue/${key}/worklog`,
      {
        timeSpent,
        comment: comment || "Logged spent hours via ApniLeap Agile Dashboard"
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    );
    res.json({ success: true, message: `Successfully logged ${timeSpent} to issue ${key}` });
  } catch (error) {
    console.error("Post Worklog Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to post worklog in Jira", details: error.response?.data || error.message });
  }
});

// Get all worklog entries of an issue from Jira
app.get("/tasks/:key/worklog", async (req, res) => {
  const { key } = req.params;

  const projectKey = key.split("-")[0];
  const spoke = Object.values(SPOKES).find(s => s.key === projectKey);

  if (!spoke) {
    return res.status(400).json({ error: "Invalid task key context. Spoke project not found." });
  }

  if (!spoke.live || !shouldCheckJira()) {
    const issues = mockTasksStore[spoke.boardId] || [];
    const task = issues.find(t => t.key === key);
    return res.json(task ? (task.fields.worklogs || []) : []);
  }

  try {
    const response = await axios.get(
      `${process.env.JIRA_DOMAIN}/rest/api/2/issue/${key}/worklog`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json"
        }
      }
    );
    res.json(response.data.worklogs || []);
  } catch (error) {
    console.error("Get Worklog Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch worklogs from Jira", details: error.response?.data || error.message });
  }
});

// Create a new child subtask under a parent issue inside Jira
app.post("/tasks/:key/subtask", authenticateToken, async (req, res) => {
  const { key } = req.params;
  const { summary, assigneeId, parentIssueType } = req.body;

  const projectKey = key.split("-")[0];
  const spoke = Object.values(SPOKES).find(s => s.key === projectKey);

  if (!spoke) {
    return res.status(400).json({ error: "Invalid task key context. Spoke project not found." });
  }

  if (!spoke.live || !shouldCheckJira()) {
    const issues = mockTasksStore[spoke.boardId] || [];
    const parentTask = issues.find(t => t.key === key);
    if (parentTask) {
      const isEpic = parentIssueType && parentIssueType.toLowerCase() === "epic";
      const issueTypeName = isEpic ? "Task" : "Sub-task";
      
      const newIndex = issues.length + 1;
      const newKey = `${projectKey}-${newIndex}`;
      const newId = `${spoke.boardId}-task-${newIndex}`;

      const newChild = {
        id: newId,
        key: newKey,
        fields: {
          summary,
          status: { name: "Backlog" },
          priority: { name: "Medium" },
          issuetype: { name: issueTypeName },
          assignee: assigneeId ? MOCK_ASSIGNEES.find(a => a.accountId === assigneeId) || null : null,
          reporter: MOCK_ASSIGNEES[0],
          created: new Date().toISOString(),
          parent: {
            id: parentTask.id,
            key: parentTask.key,
            fields: {
              summary: parentTask.fields.summary,
              issuetype: { name: parentTask.fields.issuetype.name }
            }
          },
          subtasks: [],
          issuelinks: []
        }
      };

      issues.push(newChild);
      mockTasksStore[spoke.boardId] = issues;

      if (!isEpic) {
        if (!parentTask.fields.subtasks) parentTask.fields.subtasks = [];
        parentTask.fields.subtasks.push({
          id: newId,
          key: newKey,
          summary: summary,
          statusName: "Backlog"
        });
      }

      return res.json({ success: true, key: newKey, id: newId });
    } else {
      return res.status(404).json({ error: `Mock parent task ${key} not found` });
    }
  }

  try {
    const isEpic = parentIssueType && parentIssueType.toLowerCase() === "epic";
    const issueTypeName = isEpic ? "Task" : "Sub-task";

    const fields = {
      project: { key: projectKey },
      parent: { key },
      summary,
      issuetype: { name: issueTypeName }
    };

    if (assigneeId) {
      if (assigneeId.startsWith("mock-") || /^[0-9a-fA-F]{24}$/.test(assigneeId)) {
        // Bypass live JIRA mapping validation
      } else {
        fields.assignee = { accountId: assigneeId };
      }
    }

    const response = await axios.post(
      `${process.env.JIRA_DOMAIN}/rest/api/2/issue`,
      { fields },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    );
    res.json({ success: true, key: response.data.key, id: response.data.id });
  } catch (error) {
    console.error("Create Subtask Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create subtask in Jira", details: error.response?.data || error.message });
  }
});

// Create a link relationship between two board issues in Jira
app.post("/tasks/links", async (req, res) => {
  const { linkType, sourceKey, targetKey } = req.body;

  const projectKey = sourceKey.split("-")[0];
  const spoke = Object.values(SPOKES).find(s => s.key === projectKey);

  if (!spoke) {
    return res.status(400).json({ error: "Invalid task key context. Spoke project not found." });
  }

  if (!spoke.live || !shouldCheckJira()) {
    return res.json({ success: true, message: `Successfully linked board issues in mock workspace` });
  }

  let inwardKey, outwardKey;
  if (linkType === "blocks") {
    inwardKey = targetKey;
    outwardKey = sourceKey;
  } else {
    inwardKey = sourceKey;
    outwardKey = targetKey;
  }

  try {
    await axios.post(
      `${process.env.JIRA_DOMAIN}/rest/api/2/issueLink`,
      {
        type: { name: "Blocks" },
        inwardIssue: { key: inwardKey },
        outwardIssue: { key: outwardKey }
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    );
    res.json({ success: true, message: `Successfully linked board issues` });
  } catch (error) {
    console.error("Link Issues Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to link issues in Jira", details: error.response?.data || error.message });
  }
});

// Update custom labels list for a Jira ticket
app.put("/tasks/:key/labels", async (req, res) => {
  const { key } = req.params;
  const { labels } = req.body;

  const projectKey = key.split("-")[0];
  const spoke = Object.values(SPOKES).find(s => s.key === projectKey);

  if (!spoke) {
    return res.status(400).json({ error: "Invalid task key context. Spoke project not found." });
  }

  if (!spoke.live || !shouldCheckJira()) {
    const issues = mockTasksStore[spoke.boardId] || [];
    const task = issues.find(t => t.key === key);
    if (task) {
      task.fields.labels = labels;
      invalidateCache(spoke.boardId);
      return res.json({ success: true, message: `Successfully updated labels for mock issue ${key}` });
    } else {
      return res.status(404).json({ error: `Mock issue ${key} not found` });
    }
  }

  try {
    await axios.put(
      `${process.env.JIRA_DOMAIN}/rest/api/2/issue/${key}`,
      { fields: { labels } },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    );
    invalidateCache(spoke ? spoke.boardId : null);
    res.json({ success: true, message: `Successfully updated labels for issue ${key}` });
  } catch (error) {
    console.error("Update Labels Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to update labels in Jira", details: error.response?.data || error.message });
  }
});

// GET /hub/metrics - Dynamic Portfolio Aggregator Endpoint
// GET /hub/metrics - Dynamic Portfolio Aggregator Endpoint
app.get("/hub/metrics", async (req, res) => {
  const now = Date.now();
  if (apiCache.hubMetrics && (now - apiCache.hubMetricsTime < CACHE_EXPIRY.hubMetrics)) {
    return res.json(apiCache.hubMetrics);
  }

  try {
    const hubData = {
      spokes: [],
      workstreams: [],
      blockers: []
    };

    // 1. Fetch live issues for each respective Spoke dynamically in parallel
    const spokesList = ["3", "101", "102", "103"];
    const allCampusIssues = {};

    await Promise.all(
      spokesList.map(async (boardId) => {
        const spoke = SPOKES[boardId];
        if (spoke.live && shouldCheckJira()) {
          // Reuse campus task cache if fresh!
          if (apiCache.tasks[boardId] && (now - apiCache.tasks[boardId].time < CACHE_EXPIRY.tasks)) {
            allCampusIssues[boardId] = apiCache.tasks[boardId].data;
            return;
          }

          try {
            const response = await axios.get(
              `${process.env.JIRA_DOMAIN}/rest/agile/1.0/board/${spoke.boardId}/issue`,
              {
                headers: {
                  Authorization: `Basic ${auth}`,
                  Accept: "application/json",
                },
                timeout: 10000
              }
            );
            let issues = response.data.issues || [];
            if (LIVE_BOARD_IDS.includes(spoke.boardId)) {
              issues = issues.filter(issue => {
                const labels = issue.fields?.labels || [];
                if (boardId === "3") {
                  // KLE Spoke: Show issues labeled "kle-spoke" OR issues that don't have other campus labels (preserving historic untagged)
                  return labels.includes("kle-spoke") || (!labels.includes("rit-spoke") && !labels.includes("coep-spoke") && !labels.includes("mmcoep-spoke"));
                } else if (boardId === "101") {
                  // COEP Spoke: Show ONLY issues labeled "coep-spoke"
                  return labels.includes("coep-spoke");
                } else if (boardId === "102") {
                  // MMCOEP Spoke: Show ONLY issues labeled "mmcoep-spoke"
                  return labels.includes("mmcoep-spoke");
                } else if (boardId === "103") {
                  // RIT Spoke: Show ONLY issues labeled "rit-spoke"
                  return labels.includes("rit-spoke");
                }
                return true;
              });
            }
            // Seed the tasks cache as well to save future requests
            apiCache.tasks[boardId] = {
              data: issues,
              time: now
            };
            allCampusIssues[boardId] = issues;
          } catch (err) {
            console.warn(`Failed to fetch live board ${spoke.boardId} for spoke ${spoke.name} during Hub metrics aggregation:`, err.message);
            handleJiraNetworkError(err);
            if (apiCache.tasks[boardId]) {
              allCampusIssues[boardId] = apiCache.tasks[boardId].data;
            } else {
              allCampusIssues[boardId] = mockTasksStore[boardId] || [];
            }
          }
        } else {
          // Check if cached tasks exist even if offline, otherwise fall back to mock data
          if (apiCache.tasks[boardId]) {
            allCampusIssues[boardId] = apiCache.tasks[boardId].data;
          } else {
            allCampusIssues[boardId] = mockTasksStore[boardId] || [];
          }
        }
      })
    );

    // 2. Identify all unique Epics in the entire active FIP ecosystem
    const epicMetadata = {};
    
    spokesList.forEach(boardId => {
      const issues = allCampusIssues[boardId];
      issues.forEach(issue => {
        const issueType = issue.fields?.issuetype?.name || issue.fields?.issueType || "Task";
        if (issueType === "Epic") {
          const summary = issue.fields?.summary || issue.summary || "Unnamed Epic";
          if (!epicMetadata[summary]) {
            epicMetadata[summary] = {
              name: summary,
              keysMap: {}
            };
          }
          epicMetadata[summary].keysMap[boardId] = issue.key;
        }
      });
    });

    // Check child tasks parent summaries to align missing Epic objects
    spokesList.forEach(boardId => {
      const issues = allCampusIssues[boardId];
      issues.forEach(issue => {
        const parent = issue.fields?.parent || issue.parent;
        if (parent && (parent.issueType === "Epic" || parent.fields?.issuetype?.name === "Epic")) {
          const parentSummary = parent.fields?.summary || parent.summary;
          if (parentSummary && !epicMetadata[parentSummary]) {
            epicMetadata[parentSummary] = {
              name: parentSummary,
              keysMap: {}
            };
          }
          if (parentSummary && parent.key) {
            epicMetadata[parentSummary].keysMap[boardId] = parent.key;
          }
        }
      });
    });

    const epicKeys = Object.keys(epicMetadata);

    // 3. For each Spoke, compute metrics and dynamic Epic progress rates
    spokesList.forEach(boardId => {
      const spoke = SPOKES[boardId];
      const issues = allCampusIssues[boardId];

      let total = 0;
      let done = 0;
      let progress = 0;
      let backlog = 0;
      let blockersCount = 0;

      const epicTaskTotals = {};
      const epicTaskDones = {};

      epicKeys.forEach(summary => {
        epicTaskTotals[summary] = 0;
        epicTaskDones[summary] = 0;
      });

      issues.forEach(issue => {
        const issueType = issue.fields?.issuetype?.name || issue.fields?.issueType || "Task";
        if (issueType === "Epic") return;

        const status = issue.fields?.status?.name || issue.fields?.status || "Backlog";
        total++;
        if (status === "Done") done++;
        else if (status === "In Progress" || status === "To Do") progress++;
        else backlog++;

        const simulatedAssignee = jiraSimulatedAssigneeStore[issue.key];
        const activeAssignee = simulatedAssignee 
          ? {
              displayName: simulatedAssignee.displayName,
              avatarUrl: simulatedAssignee.avatarUrl
            }
          : issue.fields?.assignee ? {
              displayName: issue.fields.assignee.displayName,
              avatarUrl: issue.fields.assignee.avatarUrls?.["48x48"] || issue.fields.assignee.avatarUrl || "https://i.pravatar.cc/150"
            } : null;

        const isFlagged = (issue.fields?.customfield_10021 && issue.fields.customfield_10021.length > 0) || 
                          (issue.fields?.Flagged && issue.fields.Flagged.length > 0) ||
                          issue.fields?.flagged === true;
        if (isFlagged) {
          blockersCount++;
          hubData.blockers.push({
            id: issue.id,
            key: issue.key,
            summary: issue.fields?.summary || issue.summary || "No Summary",
            statusName: status,
            priority: issue.fields?.priority?.name || "Medium",
            spokeName: spoke.name,
            assignee: activeAssignee
          });
        }

        let parentSummary = null;
        if (issue.fields?.parent) {
          parentSummary = issue.fields.parent.fields?.summary || issue.fields.parent.summary;
        } else if (issue.parent) {
          parentSummary = issue.parent.fields?.summary || issue.parent.summary;
        }

        if (parentSummary && epicMetadata[parentSummary]) {
          epicTaskTotals[parentSummary]++;
          if (status === "Done") {
            epicTaskDones[parentSummary]++;
          }
        }
      });

      hubData.spokes.push({
        id: boardId,
        name: spoke.name,
        key: spoke.key,
        total,
        done,
        progress,
        backlog,
        blockersCount,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0
      });

      epicKeys.forEach(summary => {
        const tCount = epicTaskTotals[summary];
        const dCount = epicTaskDones[summary];
        if (tCount > 0) {
          epicMetadata[summary][spoke.name] = Math.round((dCount / tCount) * 100);
        } else {
          epicMetadata[summary][spoke.name] = null;
        }
      });
    });

    epicKeys.forEach(summary => {
      hubData.workstreams.push({
        name: summary,
        KLE: epicMetadata[summary]["KLE Spoke"],
        COEP: epicMetadata[summary]["COEP Spoke"],
        MMCOEP: epicMetadata[summary]["MMCOEP Spoke"],
        RIT: epicMetadata[summary]["RIT Spoke"]
      });
    });

    // 4. Calculate milestone progress for B2B Corporate Projects across all spokes (fetched from MongoDB)
    const companyProjects = await CorporateProject.find().lean();
    hubData.b2bProjects = companyProjects.map(proj => {
      const enrichedAllocations = (proj.allocations || []).map(alloc => {
        const boardId = alloc.targetCampusId;
        const issues = allCampusIssues[boardId] || [];
        const epicKey = alloc.assignedKey;

        let totalTasks = 0;
        let doneTasks = 0;

        issues.forEach(issue => {
          const issueType = issue.fields?.issuetype?.name || issue.fields?.issueType || "Task";
          if (issueType === "Epic") return;

          const parentKey = issue.fields?.parent?.key || issue.parent?.key;
          const parentSummary = issue.fields?.parent?.fields?.summary || issue.fields?.parent?.summary || issue.parent?.fields?.summary || issue.parent?.summary;
          const expectedSummary = `[${proj.company}] ${proj.title}`;

          const isChild = (epicKey && parentKey === epicKey) || (parentSummary && parentSummary === expectedSummary);
          if (isChild) {
            totalTasks++;
            const status = issue.fields?.status?.name || issue.fields?.status || "Backlog";
            if (status === "Done") doneTasks++;
          }
        });

        return {
          ...alloc,
          totalTasks,
          doneTasks,
          progressPercent: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
        };
      });

      // Map Mongo _id to id for client compatibility
      return {
        ...proj,
        id: proj._id.toString(),
        allocations: enrichedAllocations
      };
    });

    apiCache.hubMetrics = hubData;
    apiCache.hubMetricsTime = now;
    res.json(hubData);
  } catch (error) {
    console.error("Hub Metrics Aggregation Error:", error.message);
    
    // Return cached data on complete failure if available
    if (apiCache.hubMetrics) {
      console.warn("Returning cached hub metrics due to aggregation error.");
      return res.json(apiCache.hubMetrics);
    }
    
    res.status(500).json({ error: "Failed to aggregate Hub metrics" });
  }
});

// ==========================================
// B2B MODERATOR PORTAL DATABASE & ENDPOINTS
// ==========================================

// In-memory Database for B2B Company Projects Intake
let companyProjectsIntake = [
  {
    id: "proj-overdue-sign-lang",
    company: "NVIDIA",
    logoUrl: "https://logo.clearbit.com/nvidia.com?size=80",
    title: "Real-Time Sign Language Translator",
    description: "Develop a deep learning-based translator running on NVIDIA Jetson to convert sign language gestures to text/speech in real-time.",
    budget: "$30,000",
    duration: "6 Months",
    status: "Active",
    assignedTo: "RIT Spoke",
    targetCampusId: "103",
    proposedDueDate: "2026-02-25",
    assignedKey: "PNLP-3",
    dateAdded: "2025-08-25",
    allocations: [
      {
        targetCampusId: "103",
        assignedTo: "RIT Spoke",
        status: "Active",
        proposedDueDate: "2026-02-25",
        assignedKey: "PNLP-3"
      }
    ]
  },
  {
    id: "proj-1",
    company: "NVIDIA",
    logoUrl: "https://logo.clearbit.com/nvidia.com?size=80",
    title: "Edge AI Smart Agriculture System",
    description: "Build an AI-based system using Jetson Nano for precision agriculture monitoring, soil health inspection, and pest detection on crops.",
    budget: "$25,000",
    duration: "6 Months",
    status: "Active",
    assignedTo: "KLE Spoke",
    targetCampusId: "3",
    proposedDueDate: "2026-08-25",
    assignedKey: "AK-12",
    dateAdded: "2026-05-20",
    allocations: [
      {
        targetCampusId: "3",
        assignedTo: "KLE Spoke",
        status: "Active",
        proposedDueDate: "2026-08-25",
        assignedKey: "AK-12"
      },
      {
        targetCampusId: "101",
        assignedTo: "COEP Spoke",
        status: "Active",
        proposedDueDate: "2026-09-10",
        assignedKey: "AK-15"
      },
      {
        targetCampusId: "103",
        assignedTo: "RIT Spoke",
        status: "Proposed",
        proposedDueDate: "2026-07-30",
        assignedKey: null
      }
    ]
  },
  {
    id: "proj-2",
    company: "Intel",
    logoUrl: "https://logo.clearbit.com/intel.com?size=80",
    title: "Automotive VLSI Controller Chip",
    description: "Design and verify a micro-controller unit (MCU) for dashboard telemetry and advanced sensor fusion in electric vehicles.",
    budget: "$40,000",
    duration: "9 Months",
    status: "Active",
    assignedTo: "COEP Spoke",
    targetCampusId: "101",
    proposedDueDate: "2026-10-15",
    assignedKey: "AK-21",
    dateAdded: "2026-05-24",
    allocations: [
      {
        targetCampusId: "101",
        assignedTo: "COEP Spoke",
        status: "Active",
        proposedDueDate: "2026-10-15",
        assignedKey: "AK-21"
      },
      {
        targetCampusId: "3",
        assignedTo: "KLE Spoke",
        status: "Active",
        proposedDueDate: "2026-09-05",
        assignedKey: "AK-22"
      }
    ]
  },
  {
    id: "proj-3",
    company: "Google",
    logoUrl: "https://logo.clearbit.com/google.com?size=80",
    title: "Cloud-Native Health Tracking API",
    description: "Develop a secure, high-throughput FHIR-compliant API for sharing electronic medical records seamlessly between clinics and hospitals.",
    budget: "$15,000",
    duration: "4 Months",
    status: "Proposed",
    assignedTo: "MMCOEP Spoke",
    targetCampusId: "102",
    proposedDueDate: "2026-07-20",
    assignedKey: null,
    dateAdded: "2026-05-26",
    allocations: [
      {
        targetCampusId: "102",
        assignedTo: "MMCOEP Spoke",
        status: "Proposed",
        proposedDueDate: "2026-07-20",
        assignedKey: null
      }
    ]
  }
];

// GET: Load incoming company projects with live milestone progress calculated for each allocation
app.get("/moderator/projects", async (req, res) => {
  const now = Date.now();
  if (apiCache.moderatorProjects && (now - apiCache.moderatorProjectsTime < CACHE_EXPIRY.moderatorProjects)) {
    return res.json(apiCache.moderatorProjects);
  }

  try {
    const spokesList = ["3", "101", "102", "103"];
    const allCampusIssues = {};

    // Fetch tasks for each spoke (mock or live) in parallel
    await Promise.all(
      spokesList.map(async (boardId) => {
        const spoke = SPOKES[boardId];
        if (spoke.live && shouldCheckJira()) {
          if (apiCache.tasks[boardId] && (now - apiCache.tasks[boardId].time < CACHE_EXPIRY.tasks)) {
            allCampusIssues[boardId] = apiCache.tasks[boardId].data;
            return;
          }

          try {
            const response = await axios.get(
              `${process.env.JIRA_DOMAIN}/rest/agile/1.0/board/${spoke.boardId}/issue`,
              {
                headers: {
                  Authorization: `Basic ${auth}`,
                  Accept: "application/json",
                },
                timeout: 10000 // Quick timeout to prevent blocking
              }
            );
            let issues = response.data.issues || [];
            if (LIVE_BOARD_IDS.includes(spoke.boardId)) {
              issues = issues.filter(issue => {
                const labels = issue.fields?.labels || [];
                if (boardId === "3") return labels.includes("kle-spoke") || (!labels.includes("rit-spoke") && !labels.includes("coep-spoke") && !labels.includes("mmcoep-spoke"));
                if (boardId === "101") return labels.includes("coep-spoke");
                if (boardId === "102") return labels.includes("mmcoep-spoke");
                if (boardId === "103") return labels.includes("rit-spoke");
                return true;
              });
            }
            // Seed individual task cache
            apiCache.tasks[boardId] = {
              data: issues,
              time: now
            };
            allCampusIssues[boardId] = issues;
          } catch (err) {
            console.warn(`Failed to fetch live board ${spoke.boardId} for spoke ${spoke.name} during Moderator Projects aggregation:`, err.message);
            handleJiraNetworkError(err);
            if (apiCache.tasks[boardId]) {
              allCampusIssues[boardId] = apiCache.tasks[boardId].data;
            } else {
              allCampusIssues[boardId] = mockTasksStore[boardId] || [];
            }
          }
        } else {
          // Check if cached tasks exist even if offline, otherwise fall back to mock data
          if (apiCache.tasks[boardId]) {
            allCampusIssues[boardId] = apiCache.tasks[boardId].data;
          } else {
            allCampusIssues[boardId] = mockTasksStore[boardId] || [];
          }
        }
      })
    );

    const companyProjects = await CorporateProject.find().lean();
    const projectsWithProgress = companyProjects.map(proj => {
      // Map Mongo _id to id for client compatibility
      const normalizedProj = {
        ...proj,
        id: proj._id.toString()
      };

      if (normalizedProj.allocations && normalizedProj.allocations.length > 0) {
        const enrichedAllocations = normalizedProj.allocations.map(alloc => {
          const boardId = alloc.targetCampusId;
          const issues = allCampusIssues[boardId] || [];
          const epicKey = alloc.assignedKey;

          let totalTasks = 0;
          let doneTasks = 0;

          issues.forEach(issue => {
            const issueType = issue.fields?.issuetype?.name || issue.fields?.issueType || "Task";
            if (issueType === "Epic") return;

            const parentKey = issue.fields?.parent?.key || issue.parent?.key;
            const parentSummary = issue.fields?.parent?.fields?.summary || issue.fields?.parent?.summary || issue.parent?.fields?.summary || issue.parent?.summary;
            const expectedSummary = `[${normalizedProj.company}] ${normalizedProj.title}`;

            const isChild = (epicKey && parentKey === epicKey) || (parentSummary && parentSummary === expectedSummary);
            if (isChild) {
              totalTasks++;
              const status = issue.fields?.status?.name || issue.fields?.status || "Backlog";
              if (status === "Done") doneTasks++;
            }
          });

          return {
            ...alloc,
            totalTasks,
            doneTasks,
            progressPercent: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
          };
        });

        return {
          ...normalizedProj,
          allocations: enrichedAllocations
        };
      }
      return normalizedProj;
    });

    apiCache.moderatorProjects = projectsWithProgress;
    apiCache.moderatorProjectsTime = now;
    res.json(projectsWithProgress);
  } catch (error) {
    console.error("Moderator Projects Load Error:", error);
    
    // Return cached projects on failure if available
    if (apiCache.moderatorProjects) {
      console.warn("Returning cached moderator projects on error.");
      return res.json(apiCache.moderatorProjects);
    }
    
    const companyProjects = await CorporateProject.find().lean();
    const normalizedProjects = companyProjects.map(p => ({ ...p, id: p._id.toString() }));
    res.json(normalizedProjects);
  }
});

// POST: Ingest a new corporate B2B project proposal (Moderator Intake Portal)
app.post("/moderator/projects", authenticateToken, async (req, res) => {
  try {
    const { company, title, description, budget, duration, proposedDueDate, problemStatementUrl } = req.body;
    
    if (!company || !title || !description || !budget || !duration || !proposedDueDate) {
      return res.status(400).json({ error: "All project proposal fields are required." });
    }

    const newProject = new CorporateProject({
      company,
      title,
      description,
      budget,
      duration,
      status: "Pending Assignment",
      assignedTo: null,
      targetCampusId: null,
      proposedDueDate,
      assignedKey: null,
      problemStatementUrl: problemStatementUrl || "",
      allocations: []
    });

    await newProject.save();
    invalidateCache(); // Purge cache so new proposal loads immediately
    
    // Map _id to id for compatibility
    const safeProject = {
      ...newProject.toObject(),
      id: newProject._id.toString()
    };
    
    res.json({ success: true, project: safeProject });
  } catch (error) {
    console.error("Failed to ingest project proposal:", error);
    res.status(500).json({ error: "Failed to ingest corporate project proposal" });
  }
});

// PUT: Update corporate project proposal persistently
app.put("/moderator/projects/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { company, title, description, budget, duration, proposedDueDate, status } = req.body;
    const project = await CorporateProject.findById(id);
    if (!project) {
      return res.status(404).json({ error: "Corporate project not found." });
    }

    if (company) project.company = company;
    if (title) project.title = title;
    if (description) project.description = description;
    if (budget) project.budget = budget;
    if (duration) project.duration = duration;
    if (proposedDueDate) project.proposedDueDate = proposedDueDate;
    if (status) project.status = status;

    await project.save();
    invalidateCache(); // Purge cache so updates load immediately

    console.log(`[PROJECT UPDATED] Persistently updated B2B project: ${project.title}`);
    res.json({ success: true, project });
  } catch (error) {
    console.error("Failed to update project proposal:", error);
    res.status(500).json({ error: "Failed to update corporate project proposal." });
  }
});

// DELETE: Delete corporate project persistently
app.delete("/moderator/projects/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await CorporateProject.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Corporate project not found." });
    }
    invalidateCache(); // Purge cache so deletion loads immediately
    console.log(`[PROJECT DELETED] Persistently deleted corporate project ID: ${id}`);
    res.json({ success: true, message: "Corporate project successfully deleted." });
  } catch (error) {
    console.error("Failed to delete corporate project:", error);
    res.status(500).json({ error: "Failed to delete corporate project." });
  }
});


// POST: Propose a company project to a campus spoke (Awaiting acceptance)
app.post("/moderator/assign", authenticateToken, async (req, res) => {
  try {
    const { projectId, targetBoardId, dueDate } = req.body;
    const project = await CorporateProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Company project not found" });
    }
    const spoke = SPOKES[targetBoardId];
    if (!spoke) {
      return res.status(400).json({ error: "Invalid target campus spoke selected" });
    }

    if (!project.allocations) {
      project.allocations = [];
    }

    // Check if already assigned to this campus
    let allocation = project.allocations.find(a => a.targetCampusId === targetBoardId);
    if (allocation) {
      return res.status(400).json({ error: "This project has already been allocated or proposed to this campus spoke." });
    }

    const proposedDueDate = dueDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    project.allocations.push({
      targetCampusId: targetBoardId,
      assignedTo: spoke.name,
      status: "Proposed",
      proposedDueDate: proposedDueDate,
      assignedKey: null
    });

    // Sync to root fields for backwards compatibility
    project.status = "Proposed";
    project.assignedTo = spoke.name;
    project.targetCampusId = targetBoardId;
    project.proposedDueDate = proposedDueDate;
    project.assignedKey = null;

    await project.save();
    console.log(`Project ${project.title} successfully proposed to ${spoke.name}. Awaiting coordinator response.`);

    invalidateCache(targetBoardId);
    res.json({
      success: true,
      message: `Successfully proposed project to ${spoke.name}! Awaiting coordinator acceptance.`,
      assignedTo: spoke.name,
      status: project.status
    });
  } catch (error) {
    console.error("Failed to propose project to campus spoke:", error);
    res.status(500).json({ error: "Failed to propose project to campus spoke" });
  }
});

// POST: Spoke coordinator accepts proposed project (Triggers JIRA Provisioning)
app.post("/spoke/project/:projectId/accept", async (req, res) => {
  const { projectId } = req.params;
  const { targetBoardId } = req.body;
  
  try {
    const project = await CorporateProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Proposed project not found" });
    }

    const boardId = targetBoardId || project.targetCampusId;
    const spoke = SPOKES[boardId];
    if (!spoke) {
      return res.status(400).json({ error: "Invalid target campus spoke resolved" });
    }

    if (!project.allocations) project.allocations = [];
    let allocation = project.allocations.find(a => a.targetCampusId === boardId);
    if (!allocation) {
      allocation = {
        targetCampusId: boardId,
        assignedTo: spoke.name,
        status: "Proposed",
        proposedDueDate: project.proposedDueDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        assignedKey: null
      };
      project.allocations.push(allocation);
    }

    const dueDate = allocation.proposedDueDate;
    let createdEpicKey = "";
    const summary = `[${project.company}] ${project.title}`;
    const descriptionText = `${project.description}\n\nSponsor: ${project.company}\nBudget: ${project.budget}\nDuration: ${project.duration}`;

    // Auto-calculate deadlines for 3 standard tasks based on the project final dueDate
    const finalDateStr = dueDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const finalDue = new Date(finalDateStr);
    const start = new Date("2026-05-27");
    const diffMs = finalDue.getTime() - start.getTime();

    const t1Ms = start.getTime() + Math.round(diffMs * 0.3);
    const t2Ms = start.getTime() + Math.round(diffMs * 0.6);
    const t3Ms = finalDue.getTime();

    const t1DueDate = new Date(t1Ms).toISOString().split("T")[0];
    const t2DueDate = new Date(t2Ms).toISOString().split("T")[0];
    const t3DueDate = new Date(t3Ms).toISOString().split("T")[0];

    const standardTasks = [
      `Phase 1: Lab Infrastructure Setup & Hardware Procurement`,
      `Phase 2: Faculty Upskilling & Student Cohort Selection`,
      `Phase 3: Development, Industry Mentorship & Evaluation`
    ];
    const taskDueDates = [t1DueDate, t2DueDate, t3DueDate];

    if (spoke.live && shouldCheckJira()) {
      console.log(`Live Provisioning Project to ${spoke.name} on acceptance...`);
      
      const epicBody = {
        fields: {
          project: { key: spoke.key },
          summary: summary,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: descriptionText }]
              }
            ]
          },
          duedate: finalDateStr,
          issuetype: { name: "Epic" },
          labels: LIVE_BOARD_IDS.includes(spoke.boardId) ? [CAMPUS_LABELS[targetBoardId] || "kle-spoke"] : ["epic"]
        }
      };

      const epicRes = await axios.post(
        `${process.env.JIRA_DOMAIN}/rest/api/3/issue`,
        epicBody,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (epicRes.data && epicRes.data.key) {
        createdEpicKey = epicRes.data.key;
        console.log(`Epic Created successfully: ${createdEpicKey}`);

        for (let idx = 0; idx < standardTasks.length; idx++) {
          const taskSummary = standardTasks[idx];
          const taskBody = {
            fields: {
              project: { key: spoke.key },
              summary: taskSummary,
              description: {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: `Automated child task created under Epic ${createdEpicKey}.` }]
                  }
                ]
              },
              duedate: taskDueDates[idx],
              issuetype: { name: "Task" },
              parent: { key: createdEpicKey },
              labels: LIVE_BOARD_IDS.includes(spoke.boardId) ? [CAMPUS_LABELS[targetBoardId] || "kle-spoke"] : ["task"]
            }
          };

          await axios.post(
            `${process.env.JIRA_DOMAIN}/rest/api/3/issue`,
            taskBody,
            {
              headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json"
              }
            }
          );
        }
      } else {
        throw new Error("Failed to retrieve created Epic key from Jira response");
      }
    } else {
      console.log(`Mock Provisioning Project to simulated spoke ${spoke.name} on acceptance...`);
      
      if (!mockTasksStore[targetBoardId]) {
        mockTasksStore[targetBoardId] = [];
      }

      const spokeTasks = mockTasksStore[targetBoardId];
      const epicIndex = spokeTasks.filter(t => t.fields?.issuetype?.name === "Epic").length + 1;
      createdEpicKey = `${spoke.key}-${epicIndex}`;
      
      const newEpic = {
        id: `mock-${targetBoardId}-epic-${Date.now()}`,
        key: createdEpicKey,
        fields: {
          summary: summary,
          description: descriptionText,
          status: { name: "Backlog" },
          priority: { name: "High" },
          issuetype: { name: "Epic" },
          created: new Date().toISOString(),
          dueDate: finalDateStr,
          flagged: false,
          timetracking: null,
          subtasks: [],
          labels: ["B2B-Sponsor"],
          parent: null
        }
      };

      spokeTasks.push(newEpic);

      standardTasks.forEach((taskSummary, idx) => {
        const childKey = `${spoke.key}-${epicIndex}-${idx + 1}`;
        const newChild = {
          id: `mock-${targetBoardId}-child-${Date.now()}-${idx}`,
          key: childKey,
          fields: {
            summary: taskSummary,
            description: `Automated child task created under Epic ${createdEpicKey} representing company project assigned to ${spoke.name}.`,
            status: { name: "Backlog" },
            priority: { name: "Medium" },
            issuetype: { name: "Task" },
            created: new Date().toISOString(),
            dueDate: taskDueDates[idx],
            flagged: false,
            timetracking: { timeSpentSeconds: 0, originalEstimateSeconds: 36000, remainingEstimateSeconds: 36000 },
            subtasks: [],
            labels: ["B2B-Task"],
            parent: {
              id: newEpic.id,
              key: createdEpicKey,
              summary: summary,
              issueType: "Epic"
            }
          }
        };
        spokeTasks.push(newChild);
      });
    }

    // Update specific allocation status to Active
    if (allocation) {
      allocation.status = "Active";
      allocation.assignedKey = createdEpicKey;
    }

    // Update root fields for fallback compatibility
    project.status = "Active";
    project.assignedTo = spoke.name;
    project.targetCampusId = boardId;
    project.assignedKey = createdEpicKey;

    await project.save();

    invalidateCache(boardId);
    res.json({
      success: true,
      message: `Successfully accepted and provisioned project to ${spoke.name}!`,
      assignedKey: createdEpicKey,
      assignedTo: spoke.name
    });
  } catch (error) {
    console.error("Assignment Acceptance Error:", error.message);
    res.status(500).json({ error: `Acceptance failed: ${error.response?.data?.errorMessages?.join(", ") || error.message}` });
  }
});

app.post("/spoke/project/:projectId/decline", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { targetBoardId } = req.body;
    const project = await CorporateProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Proposed project not found" });
    }

    const boardId = targetBoardId || project.targetCampusId;
    const spokeName = SPOKES[boardId]?.name || "Campus";

    // Remove this specific spoke allocation
    if (project.allocations) {
      project.allocations = project.allocations.filter(a => a.targetCampusId !== boardId);
    }

    // Update root fields for backwards compatibility
    if (!project.allocations || project.allocations.length === 0) {
      project.status = "Pending Assignment";
      project.assignedTo = null;
      project.targetCampusId = null;
      project.proposedDueDate = null;
      project.assignedKey = null;
    } else {
      const first = project.allocations[0];
      project.status = first.status;
      project.assignedTo = first.assignedTo;
      project.targetCampusId = first.targetCampusId;
      project.proposedDueDate = first.proposedDueDate;
      project.assignedKey = first.assignedKey;
    }

    await project.save();
    console.log(`Project proposal ${project.title} declined by ${spokeName}.`);

    invalidateCache(boardId);
    res.json({
      success: true,
      message: `Project proposal successfully declined by ${spokeName}.`,
      status: project.status
    });
  } catch (error) {
    console.error("Assignment Decline Error:", error.message);
    res.status(500).json({ error: `Decline failed: ${error.message}` });
  }
});

// ==========================================
// COLLABORATIVE MEETING PORTAL DATA & ROUTES
// ==========================================

// GET: Fetch upcoming scheduled meetings
app.get("/meetings", async (req, res) => {
  try {
    const meetings = await Meeting.find().lean();
    res.json(meetings);
  } catch (error) {
    console.error("Failed to fetch meetings:", error);
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
});

// POST: Schedule a new meeting
app.post("/meetings", async (req, res) => {
  const { title, campusId, date, time, link, agenda } = req.body;
  if (!title || !campusId || !date || !time) {
    return res.status(400).json({ error: "Missing required meeting fields (title, campusId, date, time)" });
  }
  
  try {
    const newMeeting = new Meeting({
      id: `meet-${Date.now()}`,
      title,
      campusId,
      date,
      time,
      link: link || "https://teams.microsoft.com/",
      agenda: agenda || "General campus sync."
    });
    
    await newMeeting.save();
    res.json({ success: true, meeting: newMeeting });
  } catch (error) {
    console.error("Failed to schedule meeting:", error);
    res.status(500).json({ error: "Failed to schedule meeting" });
  }
});

// POST: Gathers active overdue/blocked tasks and dispatches beautiful HTML email warning alerts via Nodemailer
app.post("/meetings/:id/remind", async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = await Meeting.findOne({ id }).lean();
    if (!meeting) {
      return res.status(404).json({ error: "Sync meeting not found" });
    }

    const spoke = SPOKES[meeting.campusId];
    if (!spoke) {
      return res.status(400).json({ error: "Invalid campus spoke associated with meeting" });
    }

    let tasks = [];
    if (spoke.live && shouldCheckJira()) {
      try {
        const response = await axios.get(
          `${process.env.JIRA_DOMAIN}/rest/agile/1.0/board/${spoke.boardId}/issue`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              Accept: "application/json",
            },
            timeout: 10000
          }
        );
        let issues = response.data.issues || [];
        if (LIVE_BOARD_IDS.includes(spoke.boardId)) {
          issues = issues.filter(issue => {
            const labels = issue.fields?.labels || [];
            if (meeting.campusId === "3") {
              // KLE Spoke: Show issues labeled "kle-spoke" OR issues that don't have other campus labels (preserving historic untagged)
              return labels.includes("kle-spoke") || (!labels.includes("rit-spoke") && !labels.includes("coep-spoke") && !labels.includes("mmcoep-spoke"));
            } else if (meeting.campusId === "101") {
              // COEP Spoke: Show ONLY issues labeled "coep-spoke"
              return labels.includes("coep-spoke");
            } else if (meeting.campusId === "102") {
              // MMCOEP Spoke: Show ONLY issues labeled "mmcoep-spoke"
              return labels.includes("mmcoep-spoke");
            } else if (meeting.campusId === "103") {
              // RIT Spoke: Show ONLY issues labeled "rit-spoke"
              return labels.includes("rit-spoke");
            }
            return true;
          });
        }
        tasks = issues;
      } catch (err) {
        console.warn(`Failed to fetch live board ${spoke.boardId} during remind aggregation, falling back to cached or mock tasks.`);
        handleJiraNetworkError(err);
        tasks = apiCache.tasks[meeting.campusId]?.data || mockTasksStore[meeting.campusId] || [];
      }
    } else {
      tasks = apiCache.tasks[meeting.campusId]?.data || mockTasksStore[meeting.campusId] || [];
    }

    // Merge local mock tasks for robust hybrid demo testing!
    const localMocks = mockTasksStore[meeting.campusId] || [];
    localMocks.forEach(mockTask => {
      if (!tasks.some(t => t.key === mockTask.key)) {
        tasks.push(mockTask);
      }
    });

    const overdueTasks = [];
    const blockedTasks = [];
    const notifyCoordinators = new Set(["manasa@apnileap.com", "coordinator@" + spoke.key.toLowerCase() + ".edu"]);

    // Dynamically resolve and add all whitelisted Spoke team members (Mentors, Student Developers, and Coordinators) to recipient list
    try {
      const boardId = meeting.campusId;
      
      // 1. Query live JIRA assignable users (if JIRA is online)
      if (spoke.live && shouldCheckJira()) {
        try {
          const jiraRes = await axios.get(
            `${process.env.JIRA_DOMAIN}/rest/api/2/user/assignable/search?project=AK`,
            {
              headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
              },
              timeout: 10000
            }
          );
          if (Array.isArray(jiraRes.data)) {
            jiraRes.data.forEach(u => {
              if (u.emailAddress) {
                notifyCoordinators.add(u.emailAddress.toLowerCase().trim());
              }
            });
          }
        } catch (err) {
          console.warn("Failed live JIRA members query in remind endpoint:", err.message);
        }
      }

      // 2. Query persistent MongoDB database users matching this spoke
      const personaMap = {
        "3": "spoke-kle",
        "101": "spoke-coep",
        "102": "spoke-mmcoep",
        "103": "spoke-rit"
      };
      const targetPersona = personaMap[boardId];
      if (targetPersona) {
        const dbUsers = await User.find({ persona: targetPersona });
        dbUsers.forEach(u => {
          if (u.email) {
            notifyCoordinators.add(u.email.toLowerCase().trim());
          }
        });
      }

      // 3. Query simulated campus spoke members
      const simulated = CAMPUS_TEAM_MEMBERS[boardId] || [];
      simulated.forEach(u => {
        const email = u.emailAddress || u.email;
        if (email) {
          notifyCoordinators.add(email.toLowerCase().trim());
        }
      });
      
    } catch (memberErr) {
      console.error("Failed to dynamically gather Spoke members in remind endpoint:", memberErr.message);
    }

    tasks.forEach(t => {
      const issueType = t.fields?.issuetype?.name || t.fields?.issueType || "Task";
      if (issueType === "Epic") return;

      const summary = t.fields?.summary || "Sprint task";
      const status = t.fields?.status?.name || t.fields?.status || "Backlog";
      const simulatedAssignee = jiraSimulatedAssigneeStore[t.key];
      const assigneeName = simulatedAssignee 
        ? simulatedAssignee.displayName 
        : t.fields?.assignee?.displayName || "Unassigned";
      const assigneeEmail = simulatedAssignee
        ? simulatedAssignee.emailAddress
        : t.fields?.assignee?.emailAddress || t.fields?.assignee?.email || null;

      if (assigneeEmail) {
        notifyCoordinators.add(assigneeEmail);
      }

      const isFlagged = (t.fields?.customfield_10021 && t.fields.customfield_10021.length > 0) || 
                        (t.fields?.Flagged && t.fields.Flagged.length > 0) ||
                        t.fields?.flagged === true;
      
      if (isFlagged) {
        blockedTasks.push({ key: t.key, summary, status, assignee: assigneeName });
      }

      const dueDateStr = t.fields?.duedate || t.fields?.dueDate || null;
      if (status !== "Done" && dueDateStr) {
        const today = new Date("2026-05-27");
        const due = new Date(dueDateStr);
        const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        if (dDue.getTime() < dToday.getTime()) {
          overdueTasks.push({ key: t.key, summary, dueDate: dueDateStr, assignee: assigneeName });
        }
      }
    });

    // Check if real SMTP config exists in backend
    const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    let transporter;
    let info;
    let isTestAccount = false;

    if (hasSmtpConfig) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      isTestAccount = true;
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const recipientList = Array.from(notifyCoordinators);
    const redirectEmail = process.env.SMTP_REDIRECT_TO || null;
    const finalTo = redirectEmail ? redirectEmail : recipientList.join(", ");

    const redirectBannerHtml = redirectEmail ? `
      <div style="background: rgba(251, 146, 60, 0.08); border: 1px dashed rgba(251, 146, 60, 0.25); border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #fb923c; text-align: center; line-height: 1.5;">
        ⚙️ <strong>[Demo Rerouting Mode Active]</strong><br/>
        This email was originally addressed to: <span style="font-family: monospace; font-weight: 750; color: #f97316;">${recipientList.join(", ")}</span>.<br/>
        It has been rerouted to your administrator address (<strong style="color: white;">${redirectEmail}</strong>) for live verification.
      </div>
    ` : "";

    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #07090e; padding: 40px; color: #f3f4f6; min-height: 100%;">
        <div style="max-width: 650px; margin: 0 auto; background: rgba(17, 24, 39, 0.9); border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: white;">ApniLeap Hub</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #e0e7ff;">🏫 Campus Sync Invitation & Warning Digest</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px; line-height: 1.6;">
            ${redirectBannerHtml}
            <h2 style="margin-top: 0; color: white; font-size: 18px; font-weight: 700;">Campus Sync & Deliverables Warning</h2>
            <p style="font-size: 14px; color: #9ca3af; margin-bottom: 24px;">
              A campus sync meeting is scheduled for <strong style="color: #6366f1;">${spoke.name}</strong>. Please review the agenda and the current active sprint blockers/overdue items compiled for your spoke.
            </p>

            <!-- Sync Card -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: white;">📅 Meeting Details</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
                <tr>
                  <td style="padding: 4px 0; color: #6b7280; font-weight: 600; width: 100px;">Title:</td>
                  <td style="padding: 4px 0; color: #f3f4f6; font-weight: 700;">${meeting.title}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6b7280; font-weight: 600;">Time:</td>
                  <td style="padding: 4px 0; color: #6366f1; font-weight: 700;">${meeting.date} at ${meeting.time}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6b7280; font-weight: 600;">Agenda:</td>
                  <td style="padding: 4px 0; color: #9ca3af;">${meeting.agenda}</td>
                </tr>
              </table>
            </div>

            <!-- Blockers Section -->
            <div style="margin-bottom: 24px;">
              <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #f43f5e;">
                🚨 Active Campus Blockers (${blockedTasks.length})
              </h3>
              ${blockedTasks.length === 0 ? `
                <div style="background: rgba(16, 185, 129, 0.05); border: 1px dashed rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 12px; text-align: center; color: #10b981; font-size: 13px;">
                  None! Excellent team progression.
                </div>
              ` : `
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255,255,255,0.06);">
                      <th style="padding: 10px; color: #9ca3af;">Key</th>
                      <th style="padding: 10px; color: #9ca3af;">Summary</th>
                      <th style="padding: 10px; color: #9ca3af;">Status</th>
                      <th style="padding: 10px; color: #9ca3af;">Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${blockedTasks.map(t => `
                      <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                        <td style="padding: 10px; font-family: monospace; color: #6366f1; font-weight: 700;">${t.key}</td>
                        <td style="padding: 10px; color: #f3f4f6; font-weight: 600;">${t.summary}</td>
                        <td style="padding: 10px;"><span style="background: rgba(244, 63, 94, 0.15); color: #f43f5e; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700;">${t.status}</span></td>
                        <td style="padding: 10px; color: #9ca3af;">${t.assignee}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              `}
            </div>

            <!-- Overdue Section -->
            <div style="margin-bottom: 30px;">
              <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #fb923c;">
                ⏰ Overdue Deadlines (${overdueTasks.length})
              </h3>
              ${overdueTasks.length === 0 ? `
                <div style="background: rgba(16, 185, 129, 0.05); border: 1px dashed rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 12px; text-align: center; color: #10b981; font-size: 13px;">
                  None! All sprint tasks are currently on track.
                </div>
              ` : `
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255,255,255,0.06);">
                      <th style="padding: 10px; color: #9ca3af;">Key</th>
                      <th style="padding: 10px; color: #9ca3af;">Summary</th>
                      <th style="padding: 10px; color: #9ca3af;">Due Date</th>
                      <th style="padding: 10px; color: #9ca3af;">Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${overdueTasks.map(t => `
                      <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                        <td style="padding: 10px; font-family: monospace; color: #6366f1; font-weight: 700;">${t.key}</td>
                        <td style="padding: 10px; color: #f3f4f6; font-weight: 600;">${t.summary}</td>
                        <td style="padding: 10px; color: #fb923c; font-weight: 700;">⏰ ${t.dueDate}</td>
                        <td style="padding: 10px; color: #9ca3af;">${t.assignee}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              `}
            </div>

            <!-- Action Button -->
            <div style="text-align: center;">
              <a href="${meeting.link}" target="_blank" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);">
                Join Live Sync Room
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: rgba(255, 255, 255, 0.01); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #6b7280;">
            This pre-meeting compilation alert was dispatched automatically by ApniLeap Hub.<br/>
            To update SMTP credentials, configure environmental variables inside the backend .env file.
          </div>
        </div>
      </div>
    `;

    info = await transporter.sendMail({
      from: hasSmtpConfig
        ? `"${process.env.SMTP_FROM_NAME || 'ApniLeap Hub'}" <${process.env.SMTP_USER}>`
        : '"ApniLeap Hub Alert Gateway" <no-reply@apnileap.com>',
      to: finalTo,
      subject: `🚨 [Warning Digest] Campus Sync Prep: ${meeting.title} (${spoke.name})`,
      text: `Meeting: ${meeting.title}\nCampus: ${spoke.name}\nTime: ${meeting.date} at ${meeting.time}\n\nOverdue Tasks: ${overdueTasks.length}\nBlocked Tasks: ${blockedTasks.length}\n\n(Demo Mode - Originally addressed to: ${recipientList.join(", ")})`,
      html: htmlTemplate
    });

    console.log("\n");
    console.log("┌────────────────────────────────────────────────────────┐");
    console.log("│ 📧   APNILEAP HUB SYNC ALERT EMAIL GATEWAY (SMTP)       │");
    console.log("├────────────────────────────────────────────────────────┤");
    console.log(`│ SPOKE:      \x1b[36m${spoke.name}\x1b[0m`);
    console.log(`│ RECIPIENTS: \x1b[36m${recipientList.join(", ")}\x1b[0m`);
    if (redirectEmail) {
      console.log(`│ REROUTED TO:\x1b[33m ${redirectEmail} (Demo Rerouting Mode)\x1b[0m`);
    }
    console.log(`│ SUBJECT:    \x1b[35m[Warning Digest] Campus Sync Prep: ${meeting.title}\x1b[0m`);
    console.log("├────────────────────────────────────────────────────────┤");

    let previewUrl = "";
    if (isTestAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`│ PREVIEW:    \x1b[33m${previewUrl}\x1b[0m`);
    } else {
      console.log(`│ DISPATCH:   \x1b[32m Real SMTP Relay Gateway (${process.env.SMTP_HOST || "Twilio SendGrid"})\x1b[0m`);
    }
    console.log("└────────────────────────────────────────────────────────┘");
    console.log("\n");

    res.json({
      success: true,
      message: `Pre-meeting alerts successfully dispatched to ${recipientList.length} campus coordinators!`,
      notifiedEmails: recipientList,
      overdueCount: overdueTasks.length,
      blockerCount: blockedTasks.length,
      previewUrl: isTestAccount ? previewUrl : undefined
    });
  } catch (error) {
    console.error("Prep Reminder Dispatch Error:", error.message);
    res.status(500).json({ error: `Reminder failed: ${error.message}` });
  }
});

// DELETE: Cancel/Delete a sync meeting persistently from MongoDB
app.delete("/meetings/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Meeting.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ error: "Sync meeting not found." });
    }
    res.json({ success: true, message: "Sync meeting cancelled and deleted successfully.", deleted });
  } catch (error) {
    console.error("Failed to delete meeting:", error);
    res.status(500).json({ error: "Failed to delete meeting." });
  }
});

// ==========================================
// AUTOMATED OVERDUE PROJECTS SCAANER
// ==========================================

// POST: Run real-time audit scan of B2B projects and trigger warnings if incomplete/overdue
app.post("/moderator/alerts/check", async (req, res) => {
  const triggeredAlerts = [];

  try {
    const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    let transporter;
    let isTestAccount = false;

    if (hasSmtpConfig) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      isTestAccount = true;
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const companyProjects = await CorporateProject.find();
    for (const project of companyProjects) {
      if (!project.assignedTo || !project.assignedKey) continue;
      
      const boardId = Object.keys(SPOKES).find(k => SPOKES[k].name === project.assignedTo);
      if (!boardId) continue;
      const spoke = SPOKES[boardId];

      let tasks = [];
      if (spoke.live && shouldCheckJira()) {
        try {
          const response = await axios.get(
            `${process.env.JIRA_DOMAIN}/rest/agile/1.0/board/${spoke.boardId}/issue`,
            {
              headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
              },
              timeout: 10000
            }
          );
          tasks = response.data.issues || [];
        } catch (err) {
          console.warn(`Failed to fetch live tasks for spoke ${spoke.name} during alerts check.`);
          handleJiraNetworkError(err);
          tasks = apiCache.tasks[boardId]?.data || mockTasksStore[boardId] || [];
        }
      } else {
        tasks = apiCache.tasks[boardId]?.data || mockTasksStore[boardId] || [];
      }

      // Merge local mock tasks for robust hybrid demo testing!
      const localMocks = mockTasksStore[boardId] || [];
      localMocks.forEach(mockTask => {
        if (!tasks.some(t => t.key === mockTask.key)) {
          tasks.push(mockTask);
        }
      });

      const projectEpic = tasks.find(t => t.key === project.assignedKey && (t.fields?.issuetype?.name === "Epic" || t.fields?.issueType === "Epic"));
      if (!projectEpic) continue;

      const childTasks = tasks.filter(t => {
        const parentKey = t.fields?.parent?.key || t.parent?.key;
        return parentKey === project.assignedKey;
      });

      const totalChildren = childTasks.length;
      const completedChildren = childTasks.filter(t => {
        const status = t.fields?.status?.name || t.fields?.status || "Backlog";
        return status === "Done";
      }).length;

      const completionRate = totalChildren > 0 ? Math.round((completedChildren / totalChildren) * 100) : 0;
      const isCompleted = totalChildren > 0 && completedChildren === totalChildren;

      const epicDueDate = projectEpic.fields?.duedate || projectEpic.fields?.dueDate || projectEpic.dueDate || null;
      let isBreached = false;
      let daysOverdue = 0;

      if (!isCompleted && epicDueDate) {
        const today = new Date("2026-05-27");
        const due = new Date(epicDueDate);
        const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        
        if (dDue.getTime() < dToday.getTime()) {
          isBreached = true;
          daysOverdue = Math.ceil((dToday.getTime() - dDue.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      if (isBreached) {
        project.status = `Assigned (BREACHED - Incomplete)`;
        await project.save();
        
        const notifyCoordinators = new Set(["manasa@apnileap.com", "coordinator@" + spoke.key.toLowerCase() + ".edu"]);

        // Gather all stakeholders for this Spoke to notify
        try {
          const personaMap = {
            "3": "spoke-kle",
            "101": "spoke-coep",
            "102": "spoke-mmcoep",
            "103": "spoke-rit"
          };
          const targetPersona = personaMap[boardId];
          if (targetPersona) {
            const dbUsers = await User.find({ persona: targetPersona });
            dbUsers.forEach(u => {
              if (u.email) {
                notifyCoordinators.add(u.email.toLowerCase().trim());
              }
            });
          }

          const simulated = CAMPUS_TEAM_MEMBERS[boardId] || [];
          simulated.forEach(u => {
            const email = u.emailAddress || u.email;
            if (email) {
              notifyCoordinators.add(email.toLowerCase().trim());
            }
          });
        } catch (memberErr) {
          console.error("Failed to dynamically gather Spoke members in alerts check:", memberErr.message);
        }

        const recipientList = Array.from(notifyCoordinators);
        const redirectEmail = process.env.SMTP_REDIRECT_TO || null;
        const finalTo = redirectEmail ? redirectEmail : recipientList.join(", ");

        const redirectBannerHtml = redirectEmail ? `
          <div style="background: rgba(251, 146, 60, 0.08); border: 1px dashed rgba(251, 146, 60, 0.25); border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #fb923c; text-align: center; line-height: 1.5;">
            ⚙️ <strong>[Demo Rerouting Mode Active]</strong><br/>
            This email was originally addressed to: <span style="font-family: monospace; font-weight: 750; color: #f97316;">${recipientList.join(", ")}</span>.<br/>
            It has been rerouted to your administrator address (<strong style="color: white;">${redirectEmail}</strong>) for live verification.
          </div>
        ` : "";

        const htmlTemplate = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #07090e; padding: 40px; color: #f3f4f6; min-height: 100%;">
            <div style="max-width: 650px; margin: 0 auto; background: rgba(17, 24, 39, 0.9); border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: white;">ApniLeap Hub</h1>
                <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #fee2e2;">⚠️ URGENT DEADLINE BREACH WARNING</p>
              </div>
              
              <!-- Body -->
              <div style="padding: 40px 30px; line-height: 1.6;">
                ${redirectBannerHtml}
                
                <div style="border-left: 4px solid #ef4444; padding-left: 16px; margin-bottom: 24px;">
                  <h2 style="margin: 0; color: white; font-size: 18px; font-weight: 700;">Deadline Breached - Incomplete Project</h2>
                  <p style="margin: 4px 0 0 0; font-size: 14px; color: #fca5a5;">Your campus has breached the target deadline for this industry-sponsored FIP.</p>
                </div>

                <!-- Project Details Card -->
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: white;">📋 Project Information</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
                    <tr>
                      <td style="padding: 6px 0; color: #9ca3af; font-weight: 600; width: 140px;">Company Project:</td>
                      <td style="padding: 6px 0; color: #f3f4f6; font-weight: 700;">${project.title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #9ca3af; font-weight: 600;">Sponsoring Partner:</td>
                      <td style="padding: 6px 0; color: #ef4444; font-weight: 700;">${project.company}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #9ca3af; font-weight: 600;">Assigned Space:</td>
                      <td style="padding: 6px 0; color: #f3f4f6;">${project.assignedTo} (<span style="font-family: monospace; color: #fca5a5;">${project.assignedKey}</span>)</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #9ca3af; font-weight: 600;">Target Deadline:</td>
                      <td style="padding: 6px 0; color: #f3f4f6; font-weight: 700;">${epicDueDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #9ca3af; font-weight: 600;">Breach Duration:</td>
                      <td style="padding: 6px 0; color: #ef4444; font-weight: 700;">Overdue by ${daysOverdue} days!</td>
                    </tr>
                  </table>
                </div>

                <!-- Metrics Section -->
                <div style="background: rgba(239, 68, 68, 0.03); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #ef4444;">📊 Current Progress Metrics</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
                    <tr>
                      <td style="padding: 4px 0; color: #9ca3af;">Overall Completion Rate:</td>
                      <td style="padding: 4px 0; color: #ef4444; font-weight: 700; text-align: right;">${completionRate}%</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #9ca3af;">Total Scope:</td>
                      <td style="padding: 4px 0; color: #f3f4f6; font-weight: 600; text-align: right;">${totalChildren} Phase Deliverables</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #9ca3af;">Deliverables Completed:</td>
                      <td style="padding: 4px 0; color: #10b981; font-weight: 600; text-align: right;">${completedChildren} of ${totalChildren}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #9ca3af;">Deliverables Remaining:</td>
                      <td style="padding: 4px 0; color: #ef4444; font-weight: 700; text-align: right;">${totalChildren - completedChildren} INCOMPLETE</td>
                    </tr>
                  </table>
                </div>

                <!-- Action notice -->
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #9ca3af; text-align: center;">
                  🚨 <strong>URGENT ACTION REQUIRED:</strong><br/>
                  Please contact the ApniLeap Moderator immediately or update your sprint task assignments in the Hub.
                </div>

              </div>

              <!-- Footer -->
              <div style="background-color: rgba(255, 255, 255, 0.01); padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #6b7280;">
                This deadline breach alert was dispatched automatically by the ApniLeap automated deadline auditor.<br/>
                Configure environmental variables inside the backend .env file to manage SMTP settings.
              </div>
            </div>
          </div>
        `;

        const warningBody = `
          ⚠️ URGENT DEADLINE BREACH WARNING - INCOMPLETE PROJECT
          ---------------------------------------------------------
          Company Project: ${project.title}
          Sponsoring Partner: ${project.company}
          Assigned Space: ${project.assignedTo} (Jira Key: ${project.assignedKey})
          
          Project Target Deadline was: ${epicDueDate}
          Breach Duration: Overdue by ${daysOverdue} days!
          
          Current Progress Metrics:
          - Overall Completion Rate: ${completionRate}%
          - Total Scope: ${totalChildren} Phase Deliverables
          - Deliverables Completed: ${completedChildren} of ${totalChildren}
          - Deliverables Remaining: ${totalChildren - completedChildren} INCOMPLETE
          
          🚨 URGENT ACTION REQUIRED:
          Your campus has breached the target deadline for this industry-sponsored FIP. Please contact the ApniLeap Moderator immediately or update your sprint task assignments.
          
          -- Dispatched by ApniLeap automated deadline auditor.
        `;

        const mailInfo = await transporter.sendMail({
          from: hasSmtpConfig
            ? `"${process.env.SMTP_FROM_NAME || 'ApniLeap Hub'}" <${process.env.SMTP_USER}>`
            : '"ApniLeap Deadline Auditor" <no-reply@apnileap.com>',
          to: finalTo,
          subject: `⚠️ [URGENT BREACH WARNING] Target Deadline Overdue: ${project.title} (${project.assignedTo})`,
          text: warningBody,
          html: htmlTemplate
        });

        let previewUrl = "";
        if (isTestAccount) {
          previewUrl = nodemailer.getTestMessageUrl(mailInfo);
        }

        console.log("\n");
        console.log("┌────────────────────────────────────────────────────────┐");
        console.log("│ 🚨   APNILEAP AUTOMATED DEADLINE AUDITOR WARNING       │");
        console.log("├────────────────────────────────────────────────────────┤");
        console.log(`│ PROJECT:    \x1b[31m${project.title}\x1b[0m`);
        console.log(`│ PARTNER:    \x1b[33m${project.company}\x1b[0m`);
        console.log(`│ SPACE:      \x1b[36m${project.assignedTo} (${project.assignedKey})\x1b[0m`);
        console.log(`│ RECIPIENTS: \x1b[36m${recipientList.join(", ")}\x1b[0m`);
        if (redirectEmail) {
          console.log(`│ REROUTED TO:\x1b[33m ${redirectEmail} (Demo Rerouting Mode)\x1b[0m`);
        }
        console.log(`│ SUBJECT:    \x1b[31m⚠️ [URGENT BREACH WARNING] Target Deadline Overdue\x1b[0m`);
        console.log("├────────────────────────────────────────────────────────┤");
        if (isTestAccount) {
          console.log(`│ PREVIEW:    \x1b[33m${previewUrl}\x1b[0m`);
        } else {
          console.log(`│ DISPATCH:   \x1b[32m Real SMTP Relay Gateway (${process.env.SMTP_HOST})\x1b[0m`);
        }
        console.log("└────────────────────────────────────────────────────────┘");
        console.log("\n");

        triggeredAlerts.push({
          projectId: project._id.toString(),
          title: project.title,
          company: project.company,
          assignedTo: project.assignedTo,
          epicKey: project.assignedKey,
          dueDate: epicDueDate,
          completionRate,
          daysOverdue,
          emailAlertBody: warningBody,
          previewUrl: isTestAccount ? previewUrl : undefined
        });
      }
    }

    res.json({
      success: true,
      message: `Audit scan completed! Triggered ${triggeredAlerts.length} overdue campus alerts.`,
      alerts: triggeredAlerts
    });
  } catch (error) {
    console.error("Alerts Scanner Error:", error.message);
    res.status(500).json({ error: `Alerts scan failed: ${error.message}` });
  }
});

async function syncAcceptedProjectsWithJira() {
  console.log("Synchronizing proposed/accepted project states with live Jira...");
  if (!shouldCheckJira()) {
    console.log("⚠️ [OFFLINE BYPASS] Skipping startup Jira sync due to active offline circuit breaker.");
    return;
  }
  const spokesList = ["3", "101", "102", "103"];
  await Promise.all(
    spokesList.map(async (boardId) => {
      const spoke = SPOKES[boardId];
      if (!spoke.live) return;
      try {
        const response = await axios.get(
          `${process.env.JIRA_DOMAIN}/rest/agile/1.0/board/${spoke.boardId}/issue`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              Accept: "application/json",
            },
            timeout: 10000
          }
        );
        const issues = response.data.issues || [];
        const epics = issues.filter(t => t.fields?.issuetype?.name === "Epic");
        
        for (const epic of epics) {
          const labels = epic.fields?.labels || [];
          const hasKle = labels.includes("kle-spoke");
          const hasCoep = labels.includes("coep-spoke");
          const hasMmcoep = labels.includes("mmcoep-spoke");
          const hasRit = labels.includes("rit-spoke");
          
          // Match the epic to the correct campus spoke board loop iteration
          if (boardId === "3" && (hasRit || hasCoep || hasMmcoep)) continue;
          if (boardId === "101" && !hasCoep) continue;
          if (boardId === "102" && !hasMmcoep) continue;
          if (boardId === "103" && !hasRit) continue;

          const summary = epic.fields.summary || "";
          const match = summary.match(/^\[(.*?)\]\s*(.*)$/);
          if (match) {
            const company = match[1].trim();
            const title = match[2].trim();
            
            const project = await CorporateProject.findOne({
              company: { $regex: new RegExp("^" + company + "$", "i") },
              title: { $regex: new RegExp("^" + title + "$", "i") }
            });
            
            if (project) {
              project.status = "Active";
              project.assignedTo = spoke.name;
              project.targetCampusId = boardId;
              project.assignedKey = epic.key;
              project.proposedDueDate = epic.fields.duedate || project.proposedDueDate;
              await project.save();
              console.log(`Synced accepted project: ${project.title} is Active at ${spoke.name} (Key: ${epic.key})`);
            }
          }
        }
      } catch (err) {
        console.warn(`Failed to sync spoke ${spoke.name} with Jira on startup:`, err.message);
        handleJiraNetworkError(err);
      }
    })
  );
}

// Registered secure user credentials store (Kept for seeding parity and local fallbacks)
const CREDENTIALS_STORE = {
  "moderator@apnileap.com": {
    password: "moderator123",
    displayName: "Central Moderator",
    role: "Central Moderator",
    persona: "moderator"
  },
  "admin@apnileap.com": {
    password: "moderator123",
    displayName: "Executive Admin",
    role: "Executive Administrator",
    persona: "executive"
  },
  "executive@apnileap.com": {
    password: "executive123",
    displayName: "Executive Admin",
    role: "Executive Administrator",
    persona: "executive"
  },
  "coordinator@kle.edu": {
    password: "kle123",
    displayName: "KLE Coordinator",
    role: "KLE Spoke Coordinator",
    persona: "spoke-kle"
  },
  "coordinator@coep.edu": {
    password: "coep123",
    displayName: "COEP Coordinator",
    role: "COEP Spoke Coordinator",
    persona: "spoke-coep"
  },
  "coordinator@mmcoep.edu": {
    password: "mmcoep123",
    displayName: "MMCOEP Coordinator",
    role: "MMCOEP Spoke Coordinator",
    persona: "spoke-mmcoep"
  },
  "coordinator@rit.edu": {
    password: "rit123",
    displayName: "RIT Coordinator",
    role: "RIT Spoke Coordinator",
    persona: "spoke-rit"
  },
  "student@kle.edu": {
    password: "student123",
    displayName: "KLE Student Developer",
    role: "Student Developer",
    persona: "spoke-kle"
  },
  "student@coep.edu": {
    password: "student123",
    displayName: "COEP Student Developer",
    role: "Student Developer",
    persona: "spoke-coep"
  },
  "student@rit.edu": {
    password: "student123",
    displayName: "RIT Student Developer",
    role: "Student Developer",
    persona: "spoke-rit"
  },
  "sponsor@nvidia.com": {
    password: "nvidia123",
    displayName: "NVIDIA Sponsor",
    role: "Corporate Partner",
    persona: "sponsor-nvidia"
  }
};

// Seeding function to initialize the default users in MongoDB Atlas
async function seedDefaultUsers() {
  try {
    await User.deleteMany({});
    console.log("🌱 [SEEDING] MongoDB User collection dropped and re-seeding default credentials...");
    const usersToSeed = Object.keys(CREDENTIALS_STORE).map(email => ({
      email: email.toLowerCase().trim(),
      password: CREDENTIALS_STORE[email].password,
      displayName: CREDENTIALS_STORE[email].displayName,
      role: CREDENTIALS_STORE[email].role,
      persona: CREDENTIALS_STORE[email].persona
    }));
    await User.insertMany(usersToSeed, { ordered: false });
    console.log(`🌱 [SEEDING SUCCESS] Seeded ${usersToSeed.length} default users into MongoDB Atlas!`);
  } catch (err) {
    if (err.code === 11000) {
      console.log("🌱 [SEEDING] Duplicate keys skipped gracefully during user seeding.");
    } else {
      console.error("❌ [SEEDING ERROR] Failed to seed default users:", err.message);
    }
  }
}

// Seeding function to initialize B2B Corporate Projects in MongoDB Atlas
async function seedDefaultProjects() {
  try {
    await CorporateProject.deleteMany({});
    console.log("🌱 [SEEDING] CorporateProject collection dropped and re-seeding default B2B projects...");
    await CorporateProject.insertMany(companyProjectsIntake);
    console.log(`🌱 [SEEDING SUCCESS] Seeded ${companyProjectsIntake.length} default projects into MongoDB Atlas!`);
  } catch (err) {
    console.error("❌ [SEEDING ERROR] Failed to seed default projects:", err.message);
  }
}

// Seeding function to initialize mock tasks persistently in MongoDB Atlas
async function seedDefaultTasks() {
  try {
    await MockTask.deleteMany({});
    console.log("🌱 [SEEDING] MockTask collection dropped and re-seeding mock tasks...");
    const tasksToInsert = [];
    const seenIds = new Set();
    
    Object.keys(mockTasksStore).forEach(boardId => {
      mockTasksStore[boardId].forEach(task => {
        if (task && task.id && !seenIds.has(task.id)) {
          seenIds.add(task.id);
          tasksToInsert.push({
            id: task.id,
            key: task.key,
            boardId: boardId,
            fields: task.fields
          });
        }
      });
    });
    
    if (tasksToInsert.length > 0) {
      await MockTask.insertMany(tasksToInsert, { ordered: false });
    }
    console.log(`🌱 [SEEDING SUCCESS] Seeded ${tasksToInsert.length} mock tasks into MongoDB Atlas!`);
  } catch (err) {
    if (err.code === 11000) {
      console.log("🌱 [SEEDING] Duplicate keys skipped gracefully during mock tasks seeding.");
    } else {
      console.error("❌ [SEEDING ERROR] Failed to seed default mock tasks:", err.message);
    }
  }
}

// Seeding function to initialize mock meetings persistently in MongoDB Atlas
async function seedDefaultMeetings() {
  try {
    const meetingCount = await Meeting.countDocuments();
    if (meetingCount === 0) {
      console.log("🌱 [SEEDING] Meeting collection is empty. Seeding 2 default meetings...");
      const defaultMeetings = [
        {
          id: "meet-1",
          title: "KLE FIP Campus Sprint Sync",
          campusId: "3",
          date: "2026-05-27",
          time: "14:30",
          link: "https://teams.microsoft.com/l/meetup-join/demo-kle-sync",
          agenda: "Sprint blocker escalation, VLSI laboratory setup progression, and Phase 1 milestone evaluation."
        },
        {
          id: "meet-2",
          title: "Sponsor Executive Review (Intel)",
          campusId: "101",
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          time: "11:00",
          link: "https://zoom.us/j/demo-sponsor-intel",
          agenda: "Ingested Automotive MCU architecture review, budget allocation check, and student delegation status."
        }
      ];
      await Meeting.insertMany(defaultMeetings);
      console.log(`🌱 [SEEDING SUCCESS] Seeded ${defaultMeetings.length} default meetings into MongoDB Atlas!`);
    } else {
      console.log(`ℹ️ [DATABASE] Meeting collection already populated with ${meetingCount} records. Seeding bypassed.`);
    }
  } catch (err) {
    console.error("❌ [SEEDING ERROR] Failed to seed default meetings:", err.message);
  }
}

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("🌱 Connected to MongoDB Atlas successfully!");
    await seedDefaultUsers();
    await seedDefaultProjects();
    await seedDefaultTasks();
    await seedDefaultMeetings();
    
    // Start listening on port 5000 only after database connection is fully established and seeded!
    app.listen(5000, () => {
      console.log("Server running on port 5000");
      syncAcceptedProjectsWithJira().then(() => {
        // Proactively warm up local caches in the background to make subsequent dashboard loads instant
        setTimeout(async () => {
          console.log("[CACHE] Warming up local endpoint caches...");
          try {
            await Promise.all([
              axios.get("http://localhost:5000/tasks?boardId=3"),
              axios.get("http://localhost:5000/tasks?boardId=101"),
              axios.get("http://localhost:5000/tasks?boardId=102"),
              axios.get("http://localhost:5000/tasks?boardId=103")
            ]);
            await Promise.all([
              axios.get("http://localhost:5000/hub/metrics"),
              axios.get("http://localhost:5000/moderator/projects")
            ]);
            console.log("[CACHE] Warm-up successful! Caches are fully populated.");
          } catch (err) {
            console.warn("[CACHE] Warm-up failed:", err.message);
          }
        }, 1000);
      });
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// POST /api/login - Validate credentials against persistent MongoDB records and return user details with a secure JWT token
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[LOGIN ATTEMPT] Received email: "${email}", password: "${password}"`);
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    
    if (!user) {
      console.warn(`[LOGIN FAILED] User not found in MongoDB Atlas for email: "${cleanEmail}"`);
      return res.status(401).json({ error: "Invalid email address or incorrect password." });
    }

    if (user.password !== password) {
      console.warn(`[LOGIN FAILED] Password mismatch for user: "${cleanEmail}". expected matching DB, Got: "${password}"`);
      return res.status(401).json({ error: "Invalid email address or incorrect password." });
    }

    console.log(`[LOGIN SUCCESS] Successfully authenticated user: "${cleanEmail}" (${user.role})`);
    
    // Generate secure JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        persona: user.persona
      },
      process.env.JWT_SECRET || "apnileap_secret_session_token_key_123!",
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      user: {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        persona: user.persona
      }
    });
  } catch (error) {
    console.error("Login route error:", error);
    res.status(500).json({ error: "An internal server error occurred during login." });
  }
});

// POST /api/register - Register a new Student or Coordinator persistently in MongoDB Atlas
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, displayName, role, persona } = req.body;
    console.log(`[REGISTER ATTEMPT] Received email: "${email}", name: "${displayName}", role: "${role}"`);
    if (!email || !password || !displayName || !role || !persona) {
      return res.status(400).json({ error: "All registration fields are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }

    const newUser = new User({
      email: cleanEmail,
      password,
      displayName,
      role,
      persona
    });

    await newUser.save();
    console.log(`[REGISTER SUCCESS] Persistently created user in MongoDB Atlas: "${cleanEmail}" (${role})`);
    
    // Invalidate caches (specifically members) so the new member is instantly assignable in details modals
    invalidateCache();

    // Generate secure JWT token
    const token = jwt.sign(
      {
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
        persona: newUser.persona
      },
      process.env.JWT_SECRET || "apnileap_secret_session_token_key_123!",
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      user: {
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        persona: newUser.persona
      }
    });
  } catch (error) {
    console.error("Registration route error:", error);
    res.status(500).json({ error: "An internal server error occurred during registration." });
  }
});

// GET /api/teams - Get all Spoke custom Sprints Teams
app.get("/api/teams", async (req, res) => {
  try {
    const { boardId } = req.query;
    if (!boardId) {
      return res.status(400).json({ error: "boardId query parameter is required." });
    }
    const teams = await Team.find({ boardId });
    res.json(teams);
  } catch (error) {
    console.error("Fetch teams error:", error);
    res.status(500).json({ error: "Failed to fetch Spoke teams." });
  }
});

// POST /api/teams - Create a new Spoke Sprints Team persistently in MongoDB Atlas
app.post("/api/teams", authenticateToken, async (req, res) => {
  try {
    const { name, boardId, members, mentor, teamLeader } = req.body;
    if (!name || !boardId || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "Team name, boardId, and a non-empty members array are required." });
    }

    const newTeam = new Team({
      name,
      boardId,
      members,
      mentor: mentor || null,
      teamLeader: teamLeader || null
    });

    await newTeam.save();
    console.log(`[TEAM SUCCESS] Persistently created team "${name}" in MongoDB Atlas with ${members.length} members and mentor.`);
    res.json({ success: true, team: newTeam });
  } catch (error) {
    console.error("Create team error:", error);
    res.status(500).json({ error: "Failed to create Spoke team." });
  }
});

// DELETE /api/teams/:id - Disband and delete a Spoke Team persistently
app.delete("/api/teams/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await Team.findByIdAndDelete(id);
    console.log(`[TEAM DELETED] Disbanded team with ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete team error:", error);
    res.status(500).json({ error: "Failed to disband Spoke team." });
  }
});

// POST /tasks/:taskId/submit - Create a new student deliverable submission in MongoDB
app.post("/tasks/:taskId/submit", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { studentName, fileName, fileUrl, comments } = req.body;
    if (!studentName || !fileName || !fileUrl) {
      return res.status(400).json({ error: "Missing required fields (studentName, fileName, fileUrl)" });
    }
    const newSubmission = new Submission({
      taskId,
      studentName,
      fileName,
      fileUrl,
      comments: comments || ""
    });
    await newSubmission.save();
    res.json({ success: true, submission: newSubmission });
  } catch (error) {
    console.error("Failed to submit deliverable:", error);
    res.status(500).json({ error: "Failed to submit deliverable" });
  }
});

// GET /tasks/:taskId/submissions - Fetch all student submissions for a specific task
app.get("/tasks/:taskId/submissions", async (req, res) => {
  try {
    const { taskId } = req.params;
    const submissions = await Submission.find({ taskId }).sort({ submittedAt: -1 }).lean();
    res.json(submissions);
  } catch (error) {
    console.error("Failed to get submissions:", error);
    res.status(500).json({ error: "Failed to get submissions" });
  }
});

// GET /submissions - Fetch all student submissions in the system
app.get("/submissions", async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ submittedAt: -1 }).lean();
    res.json(submissions);
  } catch (error) {
    console.error("Failed to get all submissions:", error);
    res.status(500).json({ error: "Failed to get submissions" });
  }
});

// PUT /submissions/:id/status - Update a student submission's approval status and feedback
app.put("/submissions/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    
    if (!status || !["Approved", "Re-work Requested"].includes(status)) {
      return res.status(400).json({ error: "Valid status ('Approved' or 'Re-work Requested') is required." });
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found." });
    }

    submission.status = status;
    submission.feedback = feedback || "";
    await submission.save();

    console.log(`[SUBMISSION AUDIT] Updated submission ${id} for task ${submission.taskId} to status: ${status}`);

    // High-Value Reactive Integration: Automate Agile task state transitions based on Coordinator review!
    try {
      const taskId = submission.taskId;
      const mockTask = await MockTask.findOne({ id: taskId });
      
      if (mockTask) {
        // 1. Handle simulated/mock MongoDB tasks
        if (status === "Approved") {
          mockTask.fields.status.name = "Done";
          mockTask.fields.flagged = false;
          await mockTask.save();
          console.log(`[REACTIVE AGENT] Automatically transitioned Mock Task ${taskId} to 'Done' on submission approval!`);
        } else if (status === "Re-work Requested") {
          mockTask.fields.status.name = "In Progress"; // Send back to active development
          mockTask.fields.flagged = true; // Flag as blocked
          mockTask.fields.description = `${mockTask.fields.description || ""}\n\n⚠️ [MENTOR FEEDBACK]: ${feedback}`;
          await mockTask.save();
          console.log(`[REACTIVE AGENT] Automatically flagged Mock Task ${taskId} as blocked due to re-work request.`);
        }
      } else if (shouldCheckJira()) {
        // 2. Handle live JIRA tasks dynamically (board-independent transition logic)
        console.log(`[REACTIVE AGENT] Resolving live JIRA task ${taskId} for automated status transition...`);
        const targetStatusName = status === "Approved" ? "Done" : "In Progress";
        
        // Query available transitions for this issue in Jira
        const transitionsRes = await axios.get(
          `${process.env.JIRA_DOMAIN}/rest/api/3/issue/${taskId}/transitions`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              Accept: "application/json",
            },
            timeout: 10000
          }
        );
        const transitions = transitionsRes.data.transitions || [];
        
        // Match transition path for target status name
        const transition = transitions.find(t => 
          t.name.toLowerCase() === targetStatusName.toLowerCase() ||
          t.to.name.toLowerCase() === targetStatusName.toLowerCase()
        );
        
        if (transition) {
          // Post the transition to JIRA REST API
          await axios.post(
            `${process.env.JIRA_DOMAIN}/rest/api/3/issue/${taskId}/transitions`,
            { transition: { id: transition.id } },
            {
              headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
                "Content-Type": "application/json"
              },
              timeout: 10000
            }
          );
          console.log(`[REACTIVE AGENT] Successfully transitioned live JIRA issue ${taskId} to '${targetStatusName}'!`);
          
          // If re-work requested, add a native comment in JIRA with mentor feedback
          if (status === "Re-work Requested") {
            try {
              await axios.post(
                `${process.env.JIRA_DOMAIN}/rest/api/2/issue/${taskId}/comment`,
                { body: `⚠️ [RE-WORK REQUESTED BY COORDINATOR]:\n${feedback}` },
                {
                  headers: {
                    Authorization: `Basic ${auth}`,
                    Accept: "application/json",
                    "Content-Type": "application/json"
                  },
                  timeout: 10000
                }
              );
              console.log(`[REACTIVE AGENT] Successfully appended re-work feedback comment to JIRA task ${taskId}.`);
            } catch (commentErr) {
              console.warn("Failed to add comment to JIRA:", commentErr.response?.data || commentErr.message);
            }
          }
        } else {
          console.warn(`[REACTIVE AGENT] No transition workflow path found to '${targetStatusName}' for live issue ${taskId}.`);
        }
      }
    } catch (taskErr) {
      console.warn("[REACTIVE AGENT] Failed to run automated task transitions on submission update:", taskErr.message);
    }

    // Invalidate caches globally so fresh JIRA status loads instantly on dashboard reload
    invalidateCache();
    res.json({ success: true, submission });
  } catch (error) {
    console.error("Failed to update submission status:", error);
    res.status(500).json({ error: "Failed to update submission status" });
  }
});

// DELETE /submissions/:id - Delete a student submission persistently
app.delete("/submissions/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findByIdAndDelete(id);
    if (!submission) {
      return res.status(404).json({ error: "Submission not found." });
    }
    console.log(`[SUBMISSION AUDIT] Deleted submission ${id} for task ${submission.taskId}`);
    invalidateCache();
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete student submission:", error);
    res.status(500).json({ error: "Failed to delete student submission" });
  }
});

// POST /cache/clear - Clear in-memory server cache
app.post("/cache/clear", (req, res) => {
  invalidateCache();
  res.json({ success: true, message: "Cache successfully purged!" });
});

// Server startup listening has been moved inside the mongoose.connect().then() block above to guarantee correct database connection sync.
// trigger nodemon reload for gmail config