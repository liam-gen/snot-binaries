const { remote, ipcRenderer } = require("electron");

const fs = require("fs")

const minimizeButton = document.getElementById("minimize-btn");
const maxUnmaxButton = document.getElementById("max-unmax-btn");
const closeButton = document.getElementById("close-btn");
const settingsBtn = document.getElementById("settings-btn");

settingsBtn.addEventListener("click", e => {
    let set = window.open('pages/settings.html', '_blank', 'nodeIntegration=yes,top=10,frame=no,width=500,contextIsolation=no');
})
let close = false;

maxUnmaxButton.addEventListener("click", e => {
    ipcRenderer.send("update-size")
});

minimizeButton.addEventListener("click", e => {
    ipcRenderer.send("minimize")
});

closeButton.addEventListener("click", e => {
    close = true
    ipcRenderer.send("close-window")
});

var webview = document.getElementById('wv1');

ipcRenderer.on("back", () => {
    webview.goBack();
})

ipcRenderer.on("forward", () => {
    webview.goForward();
})


webview.addEventListener('dom-ready', function () {

    injectCSSFromSrc("https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css")
    injectJSFromSrc("https://cdn.jsdelivr.net/npm/sweetalert2@11")

    fs.readdir(__dirname + "/css", (err, files) => {
        files.forEach(file => {
            let data = fs.readFileSync(__dirname + "/css/"+file, "utf8");
            webview.insertCSS(data)
        });
    })

    fs.readdir(__dirname + "/js", (err, files) => {
        files.forEach(file => {
            let data = fs.readFileSync(__dirname + "/js/"+file, "utf8");
            webview.executeJavaScript(data)
        });
    })

    let settings = JSON.parse(fs.readFileSync(__dirname + "/cache/settings.json", "utf8"));
    if(settings["background"]){
        webview.executeJavaScript(`
            var r = document.querySelector(':root');
            r.style.setProperty('--background-url', 'url("${settings["background"]}")');
        `)
    }

    if(settings["font"] && settings["font"] != "false"){
        webview.executeJavaScript(`
            var xyz = document.createElement('style');
            xyz.innerHTML = '*{font-family: "${settings["font"]}"}'
            document.head.appendChild(xyz)
        `)
    }

    webview.addEventListener('console-message', (e) => {
        if(e.message.startsWith("snot-require-url: ")){
            injectJSFromSrc(e.message.replace("snot-require-url: ", ""))
        }
      });
});

document.addEventListener("keypress", function onEvent(event) {
    if (event.key === "r" && event.ctrlKey) {
        console.log("BG CTRLR")
    }
});
window.onbeforeunload = function(e) {
    
    if(!close){
        e.preventDefault();
        console.log(e)
        console.log("Starting webview reloading...");
        webview.reload()
        ipcRenderer.send("store-cookies")
        return false;
    }
}

function injectCSSFromSrc(src){
    let inject = `
        var link = document.createElement('link')
        link.rel = 'stylesheet'
        link.src = "${src}"

        document.head.appendChild(link)
    `

    webview.executeJavaScript(inject)
}

function injectJSFromSrc(src){
    let inject = `
    var script = document.createElement('script')
        script.src = "${src}"

        document.head.appendChild(script)
    `

    webview.executeJavaScript(inject)
}