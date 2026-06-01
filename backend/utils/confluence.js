const axios = require('axios');

const SPACE_ID = "262148";

/**
 * Creates a new Confluence Page for an accepted project
 * @param {string} projectTitle - Title of the project
 * @param {string} epicKey - The Jira Epic Key
 * @param {string} company - Company Sponsor
 * @param {string} spokeName - The Spoke University name
 */
async function createProjectWorkspace(projectTitle, epicKey, company, spokeName) {
  const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
  
  const pageTitle = `[${epicKey}] ${projectTitle} (${spokeName})`;
  
  const bodyData = {
    spaceId: SPACE_ID,
    status: "current",
    title: pageTitle,
    body: {
      representation: "storage",
      value: `
        <h1>${projectTitle}</h1>
        <p><strong>Sponsor:</strong> ${company}</p>
        <p><strong>Spoke:</strong> ${spokeName}</p>
        <p><strong>Jira Epic:</strong> <a href="${process.env.JIRA_DOMAIN}/browse/${epicKey}">${epicKey}</a></p>
        <hr/>
        <h2>Project Requirements</h2>
        <p>Please refer to the Jira Epic for detailed tasks and deadlines.</p>
        <h2>Student Deliverables</h2>
        <p><em>All documents uploaded by students in ApniLeap will automatically appear here as attachments!</em></p>
      `
    }
  };

  try {
    const response = await axios.post(
      `${process.env.JIRA_DOMAIN}/wiki/api/v2/pages`,
      bodyData,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Confluence Workspace Created: ${pageTitle}`);
    return {
      success: true,
      pageId: response.data.id,
      url: `${process.env.JIRA_DOMAIN}/wiki${response.data._links.webui}`
    };
  } catch (error) {
    console.error("❌ Failed to create Confluence workspace:", error.response ? error.response.data : error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createProjectWorkspace
};
