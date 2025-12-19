document.addEventListener('DOMContentLoaded', () => {
  const pathInput = document.getElementById('path-input');
  const status = document.getElementById('status');

  document.getElementById('browse-btn').addEventListener('click', async () => {
    const path = await electronAPI.browsePath();
    if (path) pathInput.value = path;
  });

  document.getElementById('scan-btn').addEventListener('click', async () => {
    const rootPath = pathInput.value.trim();
    if (!rootPath) {
      alert('Please enter or select a path!');
      return;
    }
    status.textContent = 'Scanning...';
    status.style.color = 'orange';
    try {
      const repos = await electronAPI.scanRepos(rootPath);
      const tbody = document.querySelector('#repo-table tbody');
      tbody.innerHTML = '';
      repos.forEach(repo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="text-align:center"><input type="checkbox" class="select-check"></td>
          <td><strong>${repo.path.split(/[\\/]/).pop()}</strong><br><small style="color:gray">${repo.path.split(rootPath, "")}</small></td>
          <td style="text-align:center">${repo.current || 'detached'}</td>
          <td>
            <select class="target-branch">
              ${repo.branches.map(b => `<option value="${b}" ${b === repo.current ? 'selected' : ''}>${b}</option>`).join('')}
            </select>
          </td>
          <td style="text-align:center">
            <label><input type="checkbox" class="op-checkout" checked> Checkout</label><br>
            <label><input type="checkbox" class="op-pull"> Pull after</label>
          </td>
        `;
        tbody.appendChild(tr);
      });
      status.textContent = `Found ${repos.length} Git repositories`;
        status.style.color = 'green';
    } catch (err) {
      status.textContent = 'Error scanning repos';
      alert('Lỗi: ' + (err.message || err));
    }
  });

  document.getElementById('run-btn').addEventListener('click', async () => {
    const rows = document.querySelectorAll('#repo-table tbody tr');
    const selected = [];
    for (const row of rows) {
      if (row.querySelector('.select-check').checked) {
        const path = row.cells[1].textContent.trim();
        const target = row.querySelector('.target-branch').value;
        const doCheckout = row.querySelector('.op-checkout').checked;
        const doPull = row.querySelector('.op-pull').checked;
        selected.push({ path, target, doCheckout, doPull });
      }
    }
    if (selected.length === 0) {
      alert('Please select at least one repo!');
      return;
    }

    status.textContent = 'Processing...';
    let results = [];
    for (const item of selected) {
      const folderName = item.path.split(/[\\/]/).pop();
      if (item.doCheckout) {
        const res = await electronAPI.checkoutBranch(item.path, item.target);
        if (res.success) {
          results.push(`✅ ${folderName}: Checkout → ${item.target}`);
          if (item.doPull) {
            const pullRes = await electronAPI.pullRepo(item.path);
            results.push(pullRes.success ? `   └─ Pull OK` : `   └─ Pull FAILED`);
          }
        } else {
          results.push(`❌ ${folderName}: Checkout FAILED`);
        }
      } else if (item.doPull) {
        const pullRes = await electronAPI.pullRepo(item.path);
        results.push(pullRes.success ? `✅ ${folderName}: Pull OK` : `❌ ${folderName}: Pull FAILED`);
      }
    }
    alert(results.join('\n') || 'Completed!');
    status.textContent = 'Completed! Scan again to refresh.';
  });
});