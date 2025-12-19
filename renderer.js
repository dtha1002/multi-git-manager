document.addEventListener('DOMContentLoaded', () => {
  const pathInput = document.getElementById('path-input');
  const status = document.getElementById('status');

  // Browse
  document.getElementById('browse-btn').addEventListener('click', async () => {
    const path = await electronAPI.browsePath();
    if (path) pathInput.value = path;
  });

  // Scan Repos
  document.getElementById('scan-btn').addEventListener('click', async () => {
    const rootPath = pathInput.value.trim();
    if (!rootPath) {
      alert('Please enter or select a path!');
      return;
    }
    status.textContent = 'Scanning repositories...';
    status.style.color = 'orange';

    try {
      const repos = await electronAPI.scanRepos(rootPath);
      const tbody = document.querySelector('#repo-table tbody');
      tbody.innerHTML = '';

      repos.forEach(repo => {
        const tr = document.createElement('tr');
        const folderName = repo.path.split(/[\\/]/).pop();

        tr.innerHTML = `
          <td style="text-align:center"><input type="checkbox" class="select-check"></td>
          <td data-path="${repo.path}">
            <strong>${folderName}</strong><br>
            <small style="color:gray">${repo.path}</small>
          </td>
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
      status.textContent = 'Error scanning repositories';
      status.style.color = 'red';
      alert('Error: ' + (err.message || err));
    }
  });

  document.getElementById('run-btn').addEventListener('click', async () => {
    const rows = document.querySelectorAll('#repo-table tbody tr');
    const selected = [];

    for (const row of rows) {
      if (row.querySelector('.select-check').checked) {
        const pathCell = row.querySelector('td[data-path]');
        if (!pathCell) continue;
        const path = pathCell.dataset.path;
        const target = row.querySelector('.target-branch').value;
        const doCheckout = row.querySelector('.op-checkout').checked;
        const doPull = row.querySelector('.op-pull').checked;
        selected.push({ path, target, doCheckout, doPull, row });
      }
    }

    if (selected.length === 0) {
      alert('Please select at least one repository!');
      return;
    }

    // Animated loading dots
    let dotCount = 0;
    status.textContent = 'Running operations';
    status.style.color = 'orange';

    const dotInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      status.textContent = 'Running operations' + '.'.repeat(dotCount);
    }, 400);

    let results = [];

    for (const item of selected) {
      const folderName = item.path.split(/[\\/]/).pop();

      try {
        if (item.doCheckout) {
          const res = await electronAPI.checkoutBranch(item.path, item.target);
          if (res.success) {
            results.push(`- [OK] ${folderName}: Checkout --> ${item.target}`);
            try {
              const newCurrent = await electronAPI.refreshCurrentBranch(item.path);
              item.row.cells[2].textContent = newCurrent;
            } catch (e) {
              item.row.cells[2].textContent = '(error)';
            }

            if (item.doPull) {
              const pullRes = await electronAPI.pullRepo(item.path);
              results.push(pullRes.success ? `   --> Pull OK` : `   --> Pull FAILED`);
              if (pullRes.success) {
                try {
                  const updated = await electronAPI.refreshCurrentBranch(item.path);
                  item.row.cells[2].textContent = updated;
                } catch (e) {
                  item.row.cells[2].textContent = '(error)';
                }
              }
            }
          } else {
            results.push(`- [NG] ${folderName}: Checkout FAILED`);
          }
        } else if (item.doPull) {
          const pullRes = await electronAPI.pullRepo(item.path);
          results.push(pullRes.success ? `[OK] ${folderName}: Pull OK` : `[NG] ${folderName}: Pull FAILED`);
        }
      } catch (err) {
        results.push(`[NG] ${folderName}: Error - ${err.message || err}`);
      }
    }

    clearInterval(dotInterval);
    status.textContent = 'Completed! Current branches have been updated.';
    status.style.color = 'green';

    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.left = '0';
    popup.style.width = '100%';
    popup.style.height = '100%';
    popup.style.backgroundColor = 'rgba(0,0,0,0.6)';
    popup.style.display = 'flex';
    popup.style.alignItems = 'center';
    popup.style.justifyContent = 'center';
    popup.style.zIndex = '9999';

    const popupContent = document.createElement('div');
    popupContent.style.backgroundColor = 'white';
    popupContent.style.padding = '25px 35px';
    popupContent.style.borderRadius = '12px';
    popupContent.style.maxWidth = '700px';
    popupContent.style.maxHeight = '80vh';
    popupContent.style.overflowY = 'auto';
    popupContent.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    popupContent.style.fontFamily = '"Segoe UI Emoji", "Segoe UI", Arial, sans-serif';
    popupContent.style.fontSize = '16px';
    popupContent.style.lineHeight = '1.6';
    popupContent.style.color = '#1d2021';

    const title = document.createElement('h3');
    title.textContent = 'Operation Results';
    title.style.margin = '0 0 15px 0';
    title.style.color = '#333';

    const resultText = document.createElement('div');
    resultText.innerHTML = results.length > 0 
      ? results.map(line => `<div>${line}</div>`).join('')
      : '<div>All operations completed successfully!</div>';

    resultText.style.whiteSpace = 'pre-wrap';
    resultText.style.margin = '15px 0';
    resultText.style.fontSize = '16px';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.padding = '10px 25px';
    closeBtn.style.backgroundColor = '#4CAF50';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '6px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '16px';
    closeBtn.style.marginTop = '15px';
    closeBtn.onclick = () => document.body.removeChild(popup);

    popupContent.appendChild(title);
    popupContent.appendChild(resultText);
    popupContent.appendChild(closeBtn);
    popup.appendChild(popupContent);
    document.body.appendChild(popup);

    popup.focus();
    popup.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeBtn.click();
    });
  });
});