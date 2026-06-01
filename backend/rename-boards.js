const axios = require('axios');
require('dotenv').config();

const JIRA_DOMAIN = process.env.JIRA_DOMAIN;
const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
const headers = {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

const boardsToRename = [
  { id: 152, name: "KLE Spoke Board" },
  { id: 153, name: "COEP Spoke Board" },
  { id: 154, name: "MMCOEP Spoke Board" },
  { id: 155, name: "RIT Spoke Board" }
];

async function rename() {
  for (const board of boardsToRename) {
    try {
      console.log(`Renaming board ${board.id} to ${board.name}...`);
      
      // First fetch the board to get the filterId
      const getRes = await axios.get(`${JIRA_DOMAIN}/rest/agile/1.0/board/${board.id}`, { headers });
      const filterId = getRes.data.filterId;
      
      // Update the board
      await axios.put(`${JIRA_DOMAIN}/rest/agile/1.0/board/${board.id}`, {
        name: board.name,
        filterId: filterId
      }, { headers });
      
      console.log(`Successfully renamed ${board.id}`);
    } catch (err) {
      console.error(`Failed to rename ${board.id}:`, err.response ? err.response.data : err.message);
    }
  }
}

rename();
