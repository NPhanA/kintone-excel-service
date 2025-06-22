const { google } = require("googleapis");
const fs = require("fs");

// Load credentials
const auth = new google.auth.GoogleAuth({
  keyFile: "regal-crowbar-382308-2fd4bee0684c.json", // Replace with your JSON filename
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function writeToSheet(data) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: authClient });

  const spreadsheetId = "1jUR--ev5AjX_4XzL4aB8HWoHUuFW_ychSuwnwPdd1pw"; // From the URL of your Sheet
  const range = "Sheet1!A1"; // Starting cell

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: data, // 2D array: [ [col1, col2], [row2col1, row2col2] ]
    },
  });

  console.log("✅ Data written to Google Sheet");
}

module.exports = writeToSheet;
