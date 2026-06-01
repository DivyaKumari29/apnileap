require('dotenv').config();
const axios = require('axios');

async function getConfluenceSpaces() {
  const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
  try {
    const response = await axios.get(`${process.env.JIRA_DOMAIN}/wiki/api/v2/spaces`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    console.log("Spaces Found:", JSON.stringify(response.data.results, null, 2));
    
    if (response.data.results.length > 0) {
      console.log("\n✅ SUCCESS: Found your Confluence Space ID!");
      console.log(`Space Name: ${response.data.results[0].name}`);
      console.log(`Space ID: ${response.data.results[0].id}`);
      console.log("\We will use this Space ID to auto-generate project workspaces.");
    } else {
      console.log("\n❌ No spaces found. You might need to log into Confluence and create a default Space first.");
    }
  } catch (error) {
    console.error("Error fetching spaces:", error.response ? error.response.data : error.message);
  }
}

getConfluenceSpaces();
