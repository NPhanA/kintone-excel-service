(function () {
  'use strict';

  const FIELD_CODES = {
    code: 'code_subject',
    name: 'subject_name',
    hk1: 'available_hk1',
    hk2: 'available_hk2'
  };

  const appId = kintone.app.getId();

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderTable, 300);
  });

  let allRecords = [];
  let currentPage = 1;
  const PAGE_SIZE = 20;

  async function renderTable() {
    const container = document.getElementById('subject-table');
    const button = document.getElementById('save-updates-btn');

    if (!container || !button) {
      console.error('Missing HTML elements.');
      return;
    }

    injectStyle();

    // Wrap table and button in a flex container
    let wrapper = document.getElementById('admin-table-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'admin-table-wrapper';
      wrapper.className = 'admin-table-container';
      container.parentNode.insertBefore(wrapper, container);
      wrapper.appendChild(button);
      wrapper.appendChild(container);
    } else {
      if (!wrapper.contains(button)) wrapper.insertBefore(button, wrapper.firstChild);
      if (!wrapper.contains(container)) wrapper.appendChild(container);
    }

    allRecords = await fetchRecords();
    currentPage = 1;
    renderPagedTable();

    button.onclick = async () => {
      const updates = allRecords.map(rec => ({
        id: rec.$id.value,
        record: {
          [FIELD_CODES.hk1]: { value: rec[FIELD_CODES.hk1]?.value || [] },
          [FIELD_CODES.hk2]: { value: rec[FIELD_CODES.hk2]?.value || [] }
        }
      }));

      await bulkUpdate(updates);
await fetch("https://fbb6-2402-800-61cf-dda7-1d54-47a0-b91c-8593.ngrok-free.app/webhook", {
  method: "POST"
});
      alert('✅ Updates saved!');
      location.reload();
    };
  }

  function renderPagedTable() {
    const container = document.getElementById('subject-table');
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;
    const pageRecords = allRecords.slice(startIdx, endIdx);
    container.innerHTML = generateTableHTML(pageRecords) + generatePaginationHTML();
    attachPaginationEvents();
    attachSelectAllEvents();
    attachCheckboxEvents();
  }

  function generatePaginationHTML() {
    const totalPages = Math.ceil(allRecords.length / PAGE_SIZE);
    if (totalPages <= 1) return '';
    let html = '<div class="pagination-bar">';
    html += `<button class="page-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>&laquo;</button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn${i === currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="page-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>&raquo;</button>`;
    html += '</div>';
    return html;
  }

  function attachPaginationEvents() {
    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.onclick = function () {
        const totalPages = Math.ceil(allRecords.length / PAGE_SIZE);
        if (btn.dataset.page === 'prev' && currentPage > 1) {
          currentPage--;
        } else if (btn.dataset.page === 'next' && currentPage < totalPages) {
          currentPage++;
        } else if (!isNaN(Number(btn.dataset.page))) {
          currentPage = Number(btn.dataset.page);
        }
        renderPagedTable();
      };
    });
  }

function attachSelectAllEvents() {
  document.querySelectorAll('.toggle-all-btn').forEach(btn => {
    btn.onclick = function (e) {
      e.preventDefault();
      const semester = btn.dataset.semester;
      const checkboxes = Array.from(document.querySelectorAll(`.chk-${semester}`));
      const allChecked = checkboxes.every(chk => chk.checked);
      const newState = !allChecked;

      checkboxes.forEach(chk => {
        chk.checked = newState;
        const row = chk.closest('tr');
        const id = row.dataset.recordId;
        const rec = allRecords.find(r => r.$id.value === id);
        if (rec) {
          rec[FIELD_CODES[semester]].value = newState ? ['Yes'] : [];
        }
      });

      // Update button label
      btn.textContent = newState ? 'Bỏ chọn' : 'Chọn tất';
      btn.dataset.state = newState ? 'deselect' : 'select';
    };

    // Initial label
    const semester = btn.dataset.semester;
    const checkboxes = Array.from(document.querySelectorAll(`.chk-${semester}`));
    const allChecked = checkboxes.length > 0 && checkboxes.every(chk => chk.checked);
    btn.textContent = allChecked ? 'Bỏ chọn' : 'Chọn tất';
    btn.dataset.state = allChecked ? 'deselect' : 'select';
  });
}


  function attachCheckboxEvents() {
    document.querySelectorAll('tr[data-record-id]').forEach(row => {
      const id = row.dataset.recordId;
      const hk1Chk = row.querySelector('.chk-hk1');
      const hk2Chk = row.querySelector('.chk-hk2');
      if (hk1Chk) {
        hk1Chk.onchange = function () {
          const rec = allRecords.find(r => r.$id.value === id);
          if (rec) rec[FIELD_CODES.hk1].value = hk1Chk.checked ? ['Yes'] : [];
        };
      }
      if (hk2Chk) {
        hk2Chk.onchange = function () {
          const rec = allRecords.find(r => r.$id.value === id);
          if (rec) rec[FIELD_CODES.hk2].value = hk2Chk.checked ? ['Yes'] : [];
        };
      }
    });
  }

  async function fetchRecords() {
    const all = [];
    let offset = 0;
    const limit = 500;

    while (true) {
      const res = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
        app: appId,
        query: `limit ${limit} offset ${offset}`
      });
      all.push(...res.records);
      if (res.records.length < limit) break;
      offset += limit;
    }

    return all;
  }

  async function bulkUpdate(updates) {
    for (let i = 0; i < updates.length; i += 100) {
      const chunk = updates.slice(i, i + 100);
      await kintone.api(kintone.api.url('/k/v1/records', true), 'PUT', {
        app: appId,
        records: chunk
      });
    }
  }

  function injectStyle() {
    const style = document.createElement('style');
    style.textContent = `
      .admin-table-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 24px;
        background: #f6faff;
        border-radius: 10px;
        padding: 18px 0 30px 0;
      }
      table.admin-table {
        min-width: 480px;
        max-width: 700px;
        width: auto;
        border-collapse: collapse;
        margin: 0 auto 18px auto;
        box-shadow: 0 2px 12px rgba(0,123,255,0.10);
        background: #fff;
        border-radius: 8px;
        overflow: hidden;
      }
      table.admin-table th, table.admin-table td {
        border: 1px solid #b3d7ff;
        padding: 18px 18px;
        text-align: center;
        vertical-align: middle;
      }
      table.admin-table th {
        background: #e3f0ff;
        color: #0056b3;
        font-weight: 700;
        font-size: 18px;
        border-bottom: 2px solid #007bff;
        height: 60px;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }
      table.admin-table td {
        font-size: 15px;
        background: #fafdff;
        color: #003366;
      }
      table.admin-table tr:nth-child(even) td {
        background: #f0f7ff;
      }
      .header-flex {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 16px;
        justify-content: center;
        white-space: nowrap;
      }
      .header-title {
        font-size: 18px;
        font-weight: 700;
        color: #0056b3;
        margin-bottom: 0;
        line-height: 1.2;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }
      .toggle-all-btn {
        min-width: 120px !important;
        font-size: 16px !important;
        padding: 10px 0 !important;
        background: #fff;
        color: #007bff;
        border: 2px solid #007bff;
        border-radius: 6px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(0,123,255,0.07);
        transition: background 0.2s, color 0.2s, border 0.2s;
      }
      .toggle-all-btn:hover {
        background: #007bff;
        color: #fff;
        border: 2px solid #0056b3;
      }
      #save-updates-btn {
        align-self: flex-start;
        margin-bottom: 10px;
        margin-top: 0;
        padding: 8px 22px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 15px;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0,123,255,0.13);
        transition: background 0.2s;
      }
      #save-updates-btn:hover {
        background: #0056b3;
      }
      input[type="checkbox"].chk-hk1,
      input[type="checkbox"].chk-hk2 {
        accent-color: #007bff;
        width: 18px;
        height: 18px;
      }
      .pagination-bar {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 18px 0 0 0;
        gap: 4px;
      }
      .page-btn {
        background: #e3f0ff;
        color: #007bff;
        border: 1px solid #b3d7ff;
        border-radius: 4px;
        padding: 4px 12px;
        margin: 0 2px;
        font-size: 15px;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
      }
      .page-btn.active,
      .page-btn:hover:not(:disabled) {
        background: #007bff;
        color: #fff;
      }
      .page-btn:disabled {
        background: #fafdff;
        color: #b3d7ff;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  function generateTableHTML(records) {
    let html = `<table class="admin-table">
      <thead>
        <tr>
          <th>Mã môn học</th>
          <th>Tên môn học</th>
          <th style="position:relative;">
            <span class="header-flex">
              <span class="header-title">Học Kỳ I</span>
              <button class="toggle-all-btn" data-semester="hk1" data-state="select" title="Select/Deselect all Học Kỳ I">Chọn tất</button>
            </span>
          </th>
          <th style="position:relative;">
            <span class="header-flex">
              <span class="header-title">Học Kỳ II</span>
              <button class="toggle-all-btn" data-semester="hk2" data-state="select" title="Select/Deselect all Học Kỳ II">Chọn tất</button>
            </span>
          </th>
        </tr>
      </thead><tbody>`;

    records.forEach(rec => {
      html += `
        <tr data-record-id="${rec.$id.value}">
          <td>${rec[FIELD_CODES.code]?.value || ''}</td>
          <td>${rec[FIELD_CODES.name]?.value || ''}</td>
          <td><input type="checkbox" class="chk-hk1" ${rec[FIELD_CODES.hk1]?.value.includes('Yes') ? 'checked' : ''}></td>
          <td><input type="checkbox" class="chk-hk2" ${rec[FIELD_CODES.hk2]?.value.includes('Yes') ? 'checked' : ''}></td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    return html;
  }

})();
