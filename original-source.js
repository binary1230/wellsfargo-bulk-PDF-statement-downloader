// from github user @benedictchen
// to use this, easier to paste from the README at https://github.com/binary1230/wellsfargo-bulk-PDF-statement-downloader

javascript:(function(){(function() {

if (window.location.hostname.toLowerCase().indexOf('wellsfargo') === -1) {
  // If not wells fargo, exit.
  console.warn('Site is not wells fargo. Exiting...');
  return;
}
console.log('Wells fargo detected.');

if (window.wfDownloader) {
    console.warn('Already have interceptor');
    return;
}

const ACCOUNT_DROPDOWN_ID = 'dropdown-select.account.text';
const DOWNLOAD_DELAY_MS = 1000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Statements from the most recent listing response (the account and period on screen).
let latest = [];
let responseCount = 0;
let cancelled = false;

// Exposed for debugging from the DevTools console, e.g. `wfDownloader.latest`.
window.wfDownloader = {
    get latest() { return latest; },
    rawResponses: [],
    failures: [],
};

function currentAccountLabel() {
    const combobox = document.getElementById(ACCOUNT_DROPDOWN_ID);
    return combobox ? combobox.innerText.replace(/^Select account\s*/, '').trim() : '';
}

// "Unit 2 ...9932" + "Statement 08/31/26" -> "Unit 2 9932 - 2026-08-31.pdf"
function toFileName(accountLabel, displayName) {
    const account = accountLabel.replace(/\.{3}/g, ' ').replace(/\s+/g, ' ').trim();
    let rest = displayName.replace(/\(.*?\)/g, '').replace(/\.pdf$/i, '').trim();
    const date = rest.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
    if (date) {
        const year = date[3].length === 2 ? '20' + date[3] : date[3];
        rest = rest.replace(date[0], '').trim();
        // Plain statements are just "account - date"; keep the name of anything else.
        rest = year + '-' + date[1] + '-' + date[2] + (rest && rest !== 'Statement' ? ' - ' + rest : '');
    }
    const name = account ? account + ' - ' + rest : rest;
    return name.replace(/[\/\\:*?"<>|]/g, '-') + '.pdf';
}

// ---- UI ----

const panel = document.createElement('div');
panel.style = "position:fixed; right:30px; bottom:30px; z-index:99999; display:flex; flex-direction:column; align-items:flex-end; gap:10px; font-family:sans-serif;";
const statusLine = document.createElement('div');
statusLine.style = "background-color:white; color:black; border:1px solid #ccc; border-radius:5px; padding:8px 12px; font-size:16px; max-width:500px;";
statusLine.textContent = 'Ready. Expand "Statements and Disclosures", then choose an option.';
panel.appendChild(statusLine);

function makeButton(text, color) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style = "font-size:22px; background-color:" + color + "; color:white; border:none; border-radius:5px; padding:12px 22px; cursor:pointer;";
    panel.appendChild(button);
    return button;
}

const periodButton = makeButton('Download selected period', 'green');
const cancelButton = makeButton('Cancel', 'red');
const actionButtons = [periodButton];

// Show the panel straight away, rather than waiting for the next statement
// list to load, so clicking the bookmark after the page has loaded still works.
document.body.appendChild(panel);

function setStatus(text) {
    console.log('[WF downloader] ' + text);
    statusLine.textContent = text;
}

function setBusy(busy) {
    actionButtons.forEach((button) => {
        button.disabled = busy;
        button.style.opacity = busy ? 0.5 : 1;
    });
}

cancelButton.onclick = () => {
    cancelled = true;
    setBusy(false);
    panel.remove();
};

periodButton.onclick = () => {
    if (!responseCount) {
        // The statements already on screen loaded before the script was running.
        setStatus('Change the account or time period first, so the script can see the statement list.');
        return;
    }
    run(() => downloadStatements(latest));
};

async function run(task) {
    cancelled = false;
    setBusy(true);
    try {
        await task();
    } catch (e) {
        console.error(e);
        setStatus('Error: ' + e.message);
        alert('Wells Fargo Downloader error: ' + e.message);
    }
    setBusy(false);
}

// ---- Downloading ----

// Fetching the PDF ourselves and saving it from a blob url is what lets us choose
// the file name; a plain link would get Wells Fargo's name from the server.
async function downloadOne(statement) {
    const response = await fetch(statement.url, { credentials: 'include' });
    if (!response.ok) {
        throw new Error('HTTP ' + response.status);
    }
    const blob = await response.blob();
    if (!/pdf/i.test(blob.type)) {
        // Usually an HTML error or sign-in page, e.g. when the session has timed out.
        throw new Error('Expected a PDF but got "' + blob.type + '"');
    }
    const blobUrl = URL.createObjectURL(blob);
    const el1 = document.createElement('a');
    el1.setAttribute('href', blobUrl);
    el1.setAttribute('download', statement.fileName);
    document.body.appendChild(el1);
    el1.click();
    el1.parentNode.removeChild(el1);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}

async function downloadStatements(statements) {
    const failures = [];
    for (let i = 0; i < statements.length; i++) {
        if (cancelled) {
            return;
        }
        const statement = statements[i];
        setStatus('Downloading ' + (i + 1) + ' of ' + statements.length + ': ' + statement.fileName);
        try {
            await downloadOne(statement);
        } catch (e) {
            console.error('[WF downloader] Failed to download ' + statement.fileName, statement.url, e);
            failures.push({ fileName: statement.fileName, url: statement.url, error: e.message });
        }
        await sleep(DOWNLOAD_DELAY_MS);
    }
    window.wfDownloader.failures = failures;
    if (failures.length) {
        console.table(failures);
        setStatus('Done. ' + (statements.length - failures.length) + ' downloaded, ' + failures.length + ' failed (see console / wfDownloader.failures).');
    } else {
        setStatus('Done. Downloaded ' + statements.length + ' statements.');
    }
}

// ---- Intercepting the statement listing ----

function onStatementList(responseText) {
    let str = responseText;
    str = str.substr(24);
    str = str.substr(0, str.length - 24);
    str = str.replace(/\\"/g, '"');
    const parsed = JSON.parse(str);
    const info = parsed.statementsDisclosuresInfo;
    const statements = info.statements;
    window.wfDownloader.rawResponses.push(parsed);
    // The account dropdown's text still shows the previous account while this
    // response is being handled, so prefer the account the response marks selected.
    const selectedAccount = (info.accountList || []).find((account) => account.selected);
    const accountLabel = selectedAccount ? selectedAccount.accountDisplayName : currentAccountLabel();
    latest = statements.map((statement) => ({
        url: "https://connect.secure.wellsfargo.com" + statement.url,
        fileName: toFileName(accountLabel, statement.documentDisplayName),
    }));
    responseCount++;
    console.log('[WF downloader] Listing for ' + accountLabel + ': ' + latest.length + ' statements', latest);
    periodButton.textContent = 'Download selected period (' + latest.length + ')';
    if (!panel.isConnected) {
        document.body.appendChild(panel);
    }
}

window.oldXHROpen = window.XMLHttpRequest.prototype.open;

window.XMLHttpRequest.prototype.open = function (method, url, async) {
    if (url.indexOf('/edocs/documents/statement/list') !== -1) {
        console.log('Listing page request found...');
        this.addEventListener('load', function () {
            try {
                onStatementList(this.responseText);
            } catch (e) {
                console.error('[WF downloader] Could not parse statement list', e, this.responseText);
            }
        });
    }
    return window.oldXHROpen.apply(this, arguments);
};
})();})();
