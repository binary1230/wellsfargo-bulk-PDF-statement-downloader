// from github user @benedictchen
// to use this, easier to paste from the README at https://github.com/binary1230/wellsfargo-bulk-PDF-statement-downloader

javascript:(function(){(function() {

if (window.location.hostname.toLowerCase().indexOf('wellsfargo') === -1) {
  // If not wells fargo, exit.
  console.warn('Site is not wells fargo. Exiting...');
  return;
}
console.log('Wells fargo detected.');

const DOWNLOAD_DELAY_MS = 1000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Exposed for debugging from the DevTools console, e.g. `wfDownloader.failures`.
window.wfDownloader = {
    rawResponses: [],
    failures: [],
};

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
        const statement = statements[i];
        console.log('[WF downloader] Downloading ' + (i + 1) + ' of ' + statements.length + ': ' + statement.fileName);
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
    }
    console.log('[WF downloader] Done. ' + (statements.length - failures.length) + ' downloaded, ' + failures.length + ' failed.');
}

window.oldXHROpen = window.XMLHttpRequest.prototype.open;

let interceptor = function (method, url, async) {
    console.log('Intercepted request: ', {url});
	if (url.indexOf('/edocs/documents/statement/list') !== -1) {
		console.log('Listing page request found...');
		this.addEventListener('load', function () {
            let str = this.responseText;
            str = str.substr(24);
            str = str.substr(0, str.length - 24);
            str = str.replace(/\\"/g, '"');
            let parsed = JSON.parse(str);
            const info = parsed.statementsDisclosuresInfo;
            window.wfDownloader.rawResponses.push(parsed);
            // Statement names repeat across accounts, so file names include the account.
            const selectedAccount = (info.accountList || []).find((account) => account.selected);
            const accountLabel = selectedAccount ? selectedAccount.accountDisplayName : '';
            let statements = info.statements.map((statement) => ({
                url: "https://connect.secure.wellsfargo.com" + statement.url,
                fileName: toFileName(accountLabel, statement.documentDisplayName),
            }));
			const button = document.createElement('button');
            button.textContent = "Download Statements";
            button.style = "position:absolute; right: 30px; bottom: 30px; font-size:50px; background-color:green; color: white; border-radius: 5px; padding: 30px;"
            document.body.appendChild(button);
			const cancelButton = document.createElement('button');
            cancelButton.textContent = "Cancel";
            cancelButton.style = "position:absolute; left: 30px; bottom: 30px; font-size:50px; background-color:red; color: white; border-radius: 5px; padding: 30px;"
			cancelButton.onclick = () => {
				document.body.removeChild(cancelButton);
				document.body.removeChild(button);
			};
            document.body.appendChild(cancelButton);
            button.onclick = () => {
				document.body.removeChild(button);
				document.body.removeChild(cancelButton);
				downloadStatements(statements);
            };
        });

	}
    return oldXHROpen.apply(this, arguments);
}
if (window.XMLHttpRequest.prototype.open !== interceptor) {
	window.XMLHttpRequest.prototype.open = interceptor;
} else {
	console.warn('Already have interceptor');
}
})();})();
