const express = require("express");
const bodyParser = require("body-parser");
const ExcelJS = require("exceljs");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const cors = require('cors');

app.use(cors({
  origin: 'https://qmmtawzjw7cs.kintone.com' // ← your Kintone subdomain
}));
// 🛠️ CONFIG — change these to match your Kintone setup
const KINTONE_DOMAIN = "qmmtawzjw7cs.kintone.com";      // e.g., abc.kintone.com
const KINTONE_APP_ID = 37;                           // e.g., 7
const API_TOKEN = "vC4BLUe96CmRQ2kN8LUK6KcZs7iUWIIyJ89cEpBs";           // App-level token with view permissions
const EXCEL_FILE = "output.xlsx";

app.post("/webhook", async (req, res) => {
  try {
    console.log("📥 Webhook received");

    const records = await fetchAllRecordsFromKintone();
    await writeRecordsToExcel(records);

    console.log(`✅ Synced ${records.length} records to ${EXCEL_FILE}`);
    res.send("ok");
  } catch (err) {
    console.error("❌ Error syncing:", err.message);
    res.status(500).send("error");
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});

// 🔄 Fetch all records using Kintone REST API
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

// ✏️ Write all records to Excel file
async function writeRecordsToExcel(records) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Subjects");

  // Header row
  sheet.addRow(["Mã môn học", "Tên môn học", "Tín chỉ", "Học kỳ 1", "Học kỳ 2"]);


  // Data rows
  for (const rec of records) {
const hk1Checked = (rec.available_hk1?.value || []).includes("Yes") ? "Yes" : "No";
const hk2Checked = (rec.available_hk2?.value || []).includes("Yes") ? "Yes" : "No";
    sheet.addRow([
      rec.code_subject?.value || "",
      rec.subject_name?.value || "",
      rec.credits?.value || "",
      hk1Checked,
      hk2Checked
    ]);
  }

  await workbook.xlsx.writeFile(EXCEL_FILE);
}
