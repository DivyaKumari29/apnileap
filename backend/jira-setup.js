const axios = require('axios');
require('dotenv').config();

const JIRA_DOMAIN = process.env.JIRA_DOMAIN;
const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
const headers = {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

const spokes = [
  { id: "3", key: "kle-spoke", name: "KLE Spoke" },
  { id: "101", key: "coep-spoke", name: "COEP Spoke" },
  { id: "102", key: "mmcoep-spoke", name: "MMCOEP Spoke" },
  { id: "103", key: "rit-spoke", name: "RIT Spoke" }
];

async function setup() {
  try {
    const results = {};
    for (const spoke of spokes) {
      console.log(`Setting up ${spoke.name}...`);
      
      // 1. Create Filter
      const filterRes = await axios.post(`${JIRA_DOMAIN}/rest/api/3/filter`, {
        name: `Filter for ${spoke.name} PNLP`,
        description: `Auto-generated filter for ${spoke.name}`,
        jql: `project = PNLP AND labels = ${spoke.key} ORDER BY Rank ASC`
      }, { headers });
      const filterId = filterRes.data.id;
      console.log(`Created filter ID: ${filterId}`);

      // 2. Create Board
      const boardRes = await axios.post(`${JIRA_DOMAIN}/rest/agile/1.0/board`, {
        name: `${spoke.name} Board`,
        type: "scrum",
        filterId: parseInt(filterId)
      }, { headers });
      const boardId = boardRes.data.id;
      console.log(`Created board ID: ${boardId}`);
      
      results[spoke.id] = boardId;
    }
    
    console.log("ALL_BOARDS_CREATED");
    console.log(JSON.stringify(results));
  } catch (err) {
    console.error("Error setting up Jira:", err.response ? err.response.data : err.message);
  }
}

setup();
