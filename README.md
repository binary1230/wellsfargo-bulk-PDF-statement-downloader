# wellsfargo-bulk-PDF-statement-downloader
Need to download lots of PDFs from Wells Fargo's online banking website? Right now, it's a huge pain. This script simplifies bulk downloading of statements.

If you need PDF statements, or you need to download more than 18 months of transaction history, this script is for you.


# Google Chrome

Make the bookmarks bar show up if not visible already:
- `View` > `Always Show Bookmarks Bar` (or press Shift + Command + B on a Mac)

- Right click on Bookmarks Bar, click "`Add Page`"
- For URL, paste the following code: 

```
javascript:(function()%7B(function()%20%7B%0A%0Aif%20(window.location.hostname.toLowerCase().indexOf('wellsfargo')%20%3D%3D%3D%20-1)%20%7B%0A%20%20%2F%2F%20If%20not%20wells%20fargo%2C%20exit.%0A%20%20console.warn('Site%20is%20not%20wells%20fargo.%20Exiting...')%3B%0A%20%20return%3B%0A%7D%0Aconsole.log('Wells%20fargo%20detected.')%3B%0A%0A%0Awindow.oldXHROpen%20%3D%20window.XMLHttpRequest.prototype.open%3B%0A%0Alet%20interceptor%20%3D%20function%20(method%2C%20url%2C%20async)%20%7B%0A%20%20%20%20console.log('Intercepted%20request%3A%20'%2C%20%7Burl%7D)%3B%0A%09if%20(url.indexOf('%2Fedocs%2Fdocuments%2Fstatement%2Flist%2Faccount%2F')%20!%3D%3D%20-1)%20%7B%0A%09%09console.log('Listing%20page%20request%20found...')%3B%0A%09%09this.addEventListener('load'%2C%20function%20()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20let%20str%20%3D%20this.responseText%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20str%20%3D%20str.substr(24)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20str%20%3D%20str.substr(0%2C%20str.length%20-%2024)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20str%20%3D%20str.replace(%2F%5C%5C%22%2Fg%2C%20'%22')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20let%20parsed%20%3D%20JSON.parse(str)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20let%20statements%20%3D%20parsed.statementsDisclosuresInfo.statements%3B%0A%09%09%09let%20waitTime%20%3D%200%3B%0A%09%09%09const%20button%20%3D%20document.createElement('button')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20button.textContent%20%3D%20%22Download%20Statements%22%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20button.style%20%3D%20%22position%3Aabsolute%3B%20right%3A%2030px%3B%20bottom%3A%2030px%3B%20font-size%3A50px%3B%20background-color%3Agreen%3B%20color%3A%20white%3B%20border-radius%3A%205px%3B%20padding%3A%2030px%3B%22%0A%20%20%20%20%20%20%20%20%20%20%20%20document.body.appendChild(button)%3B%0A%09%09%09const%20cancelButton%20%3D%20document.createElement('button')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20cancelButton.textContent%20%3D%20%22Cancel%22%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20cancelButton.style%20%3D%20%22position%3Aabsolute%3B%20left%3A%2030px%3B%20bottom%3A%2030px%3B%20font-size%3A50px%3B%20background-color%3Ared%3B%20color%3A%20white%3B%20border-radius%3A%205px%3B%20padding%3A%2030px%3B%22%0A%09%09%09cancelButton.onclick%20%3D%20()%20%3D%3E%20%7B%0A%09%09%09%09document.body.removeChild(cancelButton)%3B%0A%09%09%09%09document.body.removeChild(button)%3B%0A%09%09%09%09delete%20button%3B%0A%09%09%09%09delete%20statements%3B%0A%09%09%09%09delete%20waitTime%3B%0A%09%09%09%7D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20document.body.appendChild(cancelButton)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20button.onclick%20%3D%20()%20%3D%3E%20%7B%20%0A%09%09%09%09statements.forEach((statement)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20console.log(statement)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20dataUrl%20%3D%20%22https%3A%2F%2Fconnect.secure.wellsfargo.com%22%20%2B%20statement.url%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20let%20el1%20%3D%20document.createElement('a')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20el1.setAttribute('href'%2C%20dataUrl)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20el1.setAttribute('download'%2C%20statement.documentDisplayName)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20el1.setAttribute('target'%2C%20'_blank')%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20document.body.appendChild(el1)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20setTimeout(()%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20el1.click()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20el1.parentNode.removeChild(el1)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%2C%20waitTime)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20waitTime%20%2B%3D%20700%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D)%3B%0A%09%09%09%09document.body.removeChild(button)%3B%0A%09%09%09%09document.body.removeChild(cancelButton)%3B%0A%09%09%09%09delete%20button%3B%0A%09%09%09%09delete%20cancelButton%3B%0A%09%09%09%09delete%20statements%3B%0A%09%09%09%09delete%20waitTime%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%3B%0A%20%20%20%20%20%20%20%20%7D)%3B%0A%0A%09%7D%0A%20%20%20%20return%20oldXHROpen.apply(this%2C%20arguments)%3B%0A%7D%0Aif%20(window.XMLHttpRequest.prototype.open%20!%3D%3D%20interceptor)%20%7B%0A%09window.XMLHttpRequest.prototype.open%20%3D%20interceptor%3B%0A%7D%20else%20%7B%0A%09console.warn('Already%20have%20interceptor')%3B%0A%7D%0A%7D)()%3B%7D)()%3B
```
---------

If this was helpful to you, please buy me (@benedictchen) a beer on PayPal: **[Click Here](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=WXQKYYKPHWXHS)**

---------



# Credits

- Original code: @binay1230
- Current/better code: @benedictchen
- Thanks also to: @trevorfox, @figadore, @burlesona

# More

This repository began life in 2017 as a github gist, and you can see a lot of the original discussion (and some alternative implementation ideas) over there: https://gist.github.com/binary1230/7cfa0524d0fae7c320e3b15fc1f4f64c

@kupietools also has a nice solution for using Tabula to extract all of the combined data into a spreadsheet.

(Wells Fargo: Please fix your website so people don't need to do this. Steal our code, please.)
