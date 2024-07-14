console.log("Scripting for Chrome Extension");

document.querySelector(".btn").addEventListener("click", ()=>{
    window.location.href = "http://127.0.0.1:3000/SilverTouch/login.html";
})

function runScraper(){
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "back-end/scraper.js";
    document.getElementsByTagName("head")[0].appendChild(script);
    return false;
}


//Scripting for input box
function onGetEmailsClick(event) {
    event.preventDefault(); // Prevent the default form submission behavior
    console.log("Get Emails button was clicked!");
    let webSourceName = "";
    webSourceName = document.getElementById("nameInput").value;
    console.log("Web Source Name stored in variable, its value=", webSourceName);
    //Write code for running the scraper.js
    runScraper();
}

// Add event listener to the submit button
const getEmailsButton = document.getElementById("execute_btn");
getEmailsButton.addEventListener("click", onGetEmailsClick);




/*
//Write code for running the executable file of .js format
var oShell = new ActiveXObject("Shell.Application");
var commandtoRun = "C:\\Windows\\notepad.exe";      //Path of .exe
oShell.ShellExecute(commandtoRun,"","","open","1");
*/