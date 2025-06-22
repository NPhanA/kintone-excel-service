const express = require("express");
const bodyParser = require("body-parser");
const ExcelJS = require("exceljs");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());

// ✅ Enable CORS for your Kintone domain
app.use(cors({
  origin: 'https://qmmtawzjw7cs.kintone.com'
}));

// ✅ Load config from environment variables
const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN;
const KINTONE_APP_ID = process.env.KINTONE_APP_ID;
const API_TOKEN = process.env.KINTONE_API_TOKEN;

const EXCEL_FILE = "output.xlsx";

// ✅ Webhook endpoint — generate Excel on Kintone update
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

// ✅ Download endpoint — user can fetch Excel
app.get("/download-excel", (req, res) => {
  const filePath = path.resolve(__dirname, EXCEL_FILE);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }
  res.download(filePath, EXCEL_FILE);
});

// ✅ Dynamic port for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// 🔄 Fetch all records from Kintone
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

// ✏️ Save to Excel
async function writeRecordsToExcel(records) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Subjects");

  // Header
  sheet.addRow(["Mã môn học", "Tên môn học", "Tín chỉ", "Học kỳ 1", "Học kỳ 2"]);

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
