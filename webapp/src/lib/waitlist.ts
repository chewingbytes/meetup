/**
 * Sends bulk or individual emails via the SMTP2GO HTTP API.
 * * @param {string[]} recipientEmails - Array of email addresses to send to.
 * @param {string} subject - The subject line of the email.
 * @param {string} htmlContent - The HTML body content of the email.
 * @returns {Promise<object>} The JSON response from SMTP2GO.
 */
async function sendBulkEmails(
  recipientEmails: any,
  subject: any,
  htmlContent: any,
) {
  const API_KEY = process.env.SMTP_API_KEY;
  const ENDPOINT = "https://api.smtp2go.com/v3/email/send";

  if (!API_KEY) {
    throw new Error(
      "SMTP2GO_API_KEY is not defined in the environment variables.",
    );
  }

  // Formatting payload according to SMTP2GO API specifications
  const payload = {
    api_key: API_KEY,
    to: recipientEmails,
    sender: "bryan@soonest.app",
    subject: subject,
    html_body: htmlContent,
  };

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.data.error) {
      throw new Error(
        `SMTP2GO Error: ${data.data.error || response.statusText}`,
      );
    }

    return data;
  } catch (error) {
    console.error("Failed to send emails via SMTP2GO:", error);
    throw error;
  }
}

const waitlistEmails = [
  "user1@example.com",
  "user2@gmail.com",
  "user3@hotmail.com",
];

const emailSubject = "You're off the waitlist! 🚀 Lock in your handle now";
const emailHtml = `
  <h1>Welcome to Soonest!</h1>
  <p>The web app is officially live for early access.</p>
  <p><a href="https://web.soonest.app">Click here to claim your Instagram handle before anyone else takes it.</a></p>
`;

// Usage example inside an async context
sendBulkEmails(waitlistEmails, emailSubject, emailHtml)
  .then((res) => console.log("All emails sent successfully:", res))
  .catch((err) => console.error("Email batch failed:", err));
