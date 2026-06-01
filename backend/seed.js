const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with central users and B2B projects...');

  // 1. Seed Central Admin User
  const adminEmail = 'admin@apnileap.com';
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { status: 'APPROVED' },
    create: {
      email: adminEmail,
      password: adminPassword,
      name: 'Central Admin',
      role: 'MODERATOR',
      status: 'APPROVED'
    },
  });
  console.log(`✅ Admin user created/verified: ${admin.email}`);

  // 1.5 Seed Campuses
  const campuses = [
    { id: '3', name: 'KLE Spoke' },
    { id: '101', name: 'COEP Spoke' },
    { id: '102', name: 'MMCOEP Spoke' },
    { id: '103', name: 'RIT Spoke' }
  ];

  for (const campus of campuses) {
    await prisma.campus.upsert({
      where: { id: campus.id },
      update: {},
      create: { id: campus.id, name: campus.name }
    });
  }
  console.log('✅ Campuses created');

  // 2. Seed Campus Coordinator Users (for easy testing)
  const coordinators = [
    { email: 'sponsor@nvidia.com', name: 'NVIDIA Sponsor', role: 'SPONSOR', campusId: null },
    { email: 'kle@apnileap.com', name: 'KLE Coordinator', role: 'COORDINATOR', campusId: '3' },
    { email: 'coep@apnileap.com', name: 'COEP Coordinator', role: 'COORDINATOR', campusId: '101' },
    { email: 'mmcoep@apnileap.com', name: 'MMCOEP Coordinator', role: 'COORDINATOR', campusId: '102' },
    { email: 'rit@apnileap.com', name: 'RIT Coordinator', role: 'COORDINATOR', campusId: '103' },
  ];

  for (const coord of coordinators) {
    const pwd = await bcrypt.hash('spoke123', 10);
    await prisma.user.upsert({
      where: { email: coord.email },
      update: { role: coord.role, status: 'APPROVED' },
      create: {
        email: coord.email,
        password: pwd,
        name: coord.name,
        role: coord.role,
        campusId: coord.campusId,
        status: 'APPROVED'
      }
    });
    console.log(`✅ Coordinator created/verified: ${coord.email}`);
  }

  // 2.5 Seed Faculty Mentors
  const mentors = [
    { email: 'anitasharma@kle.in', name: 'Dr. Anita Sharma', role: 'MENTOR', campusId: '3' },
    { email: 'rajivgupta@kle.in', name: 'Prof. Rajiv Gupta', role: 'MENTOR', campusId: '3' },
    { email: 'vikramrao@kle.in', name: 'Dr. Vikram Rao', role: 'MENTOR', campusId: '3' },
    { email: 'meenadeshmukh@coep.in', name: 'Dr. Meena Deshmukh', role: 'MENTOR', campusId: '101' },
    { email: 'sanjaypatil@coep.in', name: 'Prof. Sanjay Patil', role: 'MENTOR', campusId: '101' },
    { email: 'snehabhosale@coep.in', name: 'Prof. Sneha Bhosale', role: 'MENTOR', campusId: '101' },
    { email: 'kavitajoshi@mmcoep.in', name: 'Dr. Kavita Joshi', role: 'MENTOR', campusId: '102' },
    { email: 'amitkulkarni@mmcoep.in', name: 'Prof. Amit Kulkarni', role: 'MENTOR', campusId: '102' },
    { email: 'rohitpawar@mmcoep.in', name: 'Dr. Rohit Pawar', role: 'MENTOR', campusId: '102' },
    { email: 'sureshdesai@rit.in', name: 'Dr. Suresh Desai', role: 'MENTOR', campusId: '103' },
    { email: 'nehasingh@rit.in', name: 'Prof. Neha Singh', role: 'MENTOR', campusId: '103' },
    { email: 'poojajadhav@rit.in', name: 'Prof. Pooja Jadhav', role: 'MENTOR', campusId: '103' },
  ];

  for (const mentor of mentors) {
    const pwd = await bcrypt.hash('faculty123', 10);
    await prisma.user.upsert({
      where: { email: mentor.email },
      update: { status: 'APPROVED' },
      create: {
        email: mentor.email,
        password: pwd,
        name: mentor.name,
        role: mentor.role,
        campusId: mentor.campusId,
        status: 'APPROVED'
      }
    });
    console.log(`✅ Faculty Mentor created/verified: ${mentor.email}`);
  }

  // 2.7 Seed Students
  const students = [
    { email: 'rahulsharma@kle.edu', name: 'Rahul Sharma', role: 'STUDENT', campusId: '3' },
    { email: 'priyapatel@kle.edu', name: 'Priya Patel', role: 'STUDENT', campusId: '3' },
    { email: 'snehajoshi@coep.edu', name: 'Sneha Joshi', role: 'STUDENT', campusId: '101' },
    { email: 'amitwaghmare@coep.edu', name: 'Amit Waghmare', role: 'STUDENT', campusId: '101' },
    { email: 'nikhilrane@mmcoep.edu', name: 'Nikhil Rane', role: 'STUDENT', campusId: '102' },
    { email: 'sayalideshmukh@mmcoep.edu', name: 'Sayali Deshmukh', role: 'STUDENT', campusId: '102' },
    { email: 'tejasshinde@rit.edu', name: 'Tejas Shinde', role: 'STUDENT', campusId: '103' },
    { email: 'pritipatil@rit.edu', name: 'Priti Patil', role: 'STUDENT', campusId: '103' },
  ];

  for (const student of students) {
    const pwd = await bcrypt.hash('student123', 10);
    await prisma.user.upsert({
      where: { email: student.email },
      update: { status: 'APPROVED' },
      create: {
        email: student.email,
        password: pwd,
        name: student.name,
        role: student.role,
        campusId: student.campusId,
        status: 'APPROVED'
      }
    });
    console.log(`✅ Student created/verified: ${student.email}`);
  }

  // 3. Seed B2B Company Projects
  const projects = [
    {
      company: 'NVIDIA',
      logoUrl: 'https://logo.clearbit.com/nvidia.com?size=80',
      title: 'Autonomous Drone Navigation with Jetson Orin',
      description: 'Develop a real-time obstacle avoidance and path-planning system for delivery drones using NVIDIA Jetson Orin Nano and depth cameras.',
      budget: '$30,000',
      duration: '6 Months',
      status: 'Proposed',
      dateAdded: '2026-05-18',
      initialWorkstream: 'Phase 1: Setup Jetson Orin Nano environment and calibrate depth cameras'
    },
    {
      company: 'NVIDIA',
      logoUrl: 'https://logo.clearbit.com/nvidia.com?size=80',
      title: 'Real-Time Sign Language Translator',
      description: 'Build a GPU-accelerated computer vision pipeline that translates Indian Sign Language gestures into text and speech in real time using deep learning.',
      budget: '$18,000',
      duration: '5 Months',
      status: 'Proposed',
      dateAdded: '2026-05-20',
      initialWorkstream: 'Phase 1: Configure PyTorch on TensorRT and collect ISL gesture baseline dataset'
    },
    {
      company: 'NVIDIA',
      logoUrl: 'https://logo.clearbit.com/nvidia.com?size=80',
      title: 'AI-Powered Traffic Flow Optimization',
      description: 'Create an intelligent traffic signal control system using edge AI inference on NVIDIA hardware to reduce congestion and emergency vehicle wait times.',
      budget: '$35,000',
      duration: '7 Months',
      status: 'Proposed',
      dateAdded: '2026-05-22',
      initialWorkstream: 'Phase 1: Deploy YOLOv8 on Jetson edge devices and capture raw traffic feeds'
    },
    {
      company: 'NVIDIA',
      logoUrl: 'https://logo.clearbit.com/nvidia.com?size=80',
      title: 'Edge AI Smart Agriculture System',
      description: 'Build an AI-based system using Jetson Nano for precision agriculture monitoring, soil health inspection, and pest detection on crops.',
      budget: '$25,000',
      duration: '6 Months',
      status: 'Proposed',
      dateAdded: '2026-05-24',
      initialWorkstream: 'Phase 1: Setup Jetson Nano node in test greenhouse and test moisture sensors'
    },
    {
      company: 'NVIDIA',
      logoUrl: 'https://logo.clearbit.com/nvidia.com?size=80',
      title: 'Isaac Automated Industrial Defect Inspector',
      description: 'Design a high-precision computer vision model deployed on Jetson Orin to automatically inspect PCBs and identify manufacturing anomalies in real time.',
      budget: '$42,000',
      duration: '8 Months',
      status: 'Proposed',
      dateAdded: '2026-05-26',
      initialWorkstream: 'Phase 1: Set up Isaac Sim workspace and import PCB CAD designs'
    }
  ];

  for (const proj of projects) {
    const existing = await prisma.project.findFirst({
      where: { 
        company: proj.company,
        title: proj.title 
      }
    });
    
    if (!existing) {
      await prisma.project.create({ data: proj });
      console.log(`✅ Created project: [${proj.company}] ${proj.title}`);
    } else {
      console.log(`⚠️ Project already exists: [${proj.company}] ${proj.title}`);
    }
  }

  console.log('✅ Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
