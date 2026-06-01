require('dotenv').config();
const axios = require('axios');

const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

async function test() {
  try {
    const res = await axios.post(
      `${process.env.JIRA_DOMAIN}/rest/agile/1.0/sprint`,
      {
        name: "Test Sprint API",
        originBoardId: 152,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      }
    );
    console.log("Success:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("Jira Error:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.log("Network Error:", err.message);
    }
  }
}

test();
