const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { google } = require("googleapis");

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: 'https://qmmtawzjw7cs.kintone.com'
}));

// 🌐 Kintone config from env
const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN;
const KINTONE_APP_ID = process.env.KINTONE_APP_ID;
const API_TOKEN = process.env.KINTONE_API_TOKEN;

// 🧠 Google Sheets setup
const SHEET_ID = "1jUR--ev5AjX_4XzL4aB8HWoHUuFW_ychSuwnwPdd1pw";
const SHEET_NAME = "Sheet1";
const SERVICE_ACCOUNT_FILE = "regal-crowbar-382308-2fd4bee0684c.json"; // downloaded file

// 🔑 Google auth
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// 🧠 Webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    console.log("📥 Webhook received");

    const records = await fetchAllRecordsFromKintone();
    const rows = formatRecordsForSheets(records);
    await writeToSheet(rows);

    console.log(`✅ Synced ${records.length} records to Google Sheets`);
    res.send("ok");
  } catch (err) {
    console.error("❌ Error syncing:", err.message);
    res.status(500).send("error");
  }
});

// 🧠 Helper: Get all records from Kintone
async function fetchAllRecordsFromKintone() {
  let all = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await axios.get(`https://${KINTONE_DOMAIN}/k/v1/records.json`, {
      headers: { "X-Cybozu-API-Token": API_TOKEN },
      params: {
        app: KINTONE_APP_ID,
        query: `limit ${limit} offset ${offset}`
      }
    });

    all.push(...res.data.records);
    if (res.data.records.length < limit) break;
    offset += limit;
  }

  return all;
}

// 🔄 Convert Kintone records into sheet rows
function formatRecordsForSheets(records) {
  const rows = [
    ["Mã môn học", "Tên môn học", "Tín chỉ", "Học kỳ 1", "Học kỳ 2"]
  ];

  for (const rec of records) {
    const hk1 = (rec.available_hk1?.value || []).includes("Yes") ? "Yes" : "No";
    const hk2 = (rec.available_hk2?.value || []).includes("Yes") ? "Yes" : "No";

    rows.push([
      rec.code_subject?.value || "",
      rec.subject_name?.value || "",
      rec.credits?.value || "",
      hk1,
      hk2
    ]);
  }

  return rows;
}

// 📝 Write data to Google Sheets
async function writeToSheet(rows) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: "RAW",
    resource: {
      values: rows
    }
  });
}

// 🟢 Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
