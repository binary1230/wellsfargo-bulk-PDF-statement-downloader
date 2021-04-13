// from github user @benedictchen
// to use this, easier to paste from the README at https://github.com/binary1230/wellsfargo-bulk-PDF-statement-downloader

javascript:(function(){(function() {

if (window.location.hostname.toLowerCase().indexOf('wellsfargo') === -1) {
  // If not wells fargo, exit.
  console.warn('Site is not wells fargo. Exiting...');
  return;
}
console.log('Wells fargo detected.');


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
            let statements = parsed.statementsDisclosuresInfo.statements;
			let waitTime = 0;
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
				delete button;
				delete statements;
				delete waitTime;
			};
            document.body.appendChild(cancelButton);
            button.onclick = () => { 
				statements.forEach((statement) => {
                    console.log(statement);
                    let dataUrl = "https://connect.secure.wellsfargo.com" + statement.url;
                    let el1 = document.createElement('a');
                    el1.setAttribute('href', dataUrl);
                    el1.setAttribute('download', statement.documentDisplayName);
                    el1.setAttribute('target', '_blank');
                    document.body.appendChild(el1);
                    setTimeout(() => {
                        el1.click();
                        el1.parentNode.removeChild(el1);
                    }, waitTime);
                    waitTime += 700;
                });
				document.body.removeChild(button);
				document.body.removeChild(cancelButton);
				delete button;
				delete cancelButton;
				delete statements;
				delete waitTime;
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
