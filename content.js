var playerNames = [['Name', 'Tournament', 'Entry', 'Sport', 'Entrants', 'Fill%',
'Start Time', 'Max Entries', 'Draft Size', 'Rounds', 'Rake', 'Close Time']];
var tourneyName = document.querySelector('.styles__draftPoolName__KoSYy').textContent.trim();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function findTournaments() {
    const tourneys = Array.from(document.querySelectorAll(".styles__completedDraftCell__PJ8NR"));
    return tourneys;
}

function findDivs() {
    const divs = Array.from(document.querySelectorAll(".styles__contentWrapper__OChjU"));
    return divs;
}

async function findPlayerList(tourney_info) {
    const playerList = document.querySelectorAll(".styles__playerName__uf8z0");

    if (playerList.length > 0) {
        playerList.forEach((player, index) => {
            const text = player.textContent.trim();
            var temp_list = [text];
            temp_list = temp_list.concat(tourney_info);
            playerNames.push(temp_list);
            console.log(`Player ${index + 1} Text:`, text);
        });
    } else {
        console.log("No div elements with the class 'styles__playerName__uf8z0' found.");
    }
}

function exportToCSV(filename, csvData) {
    const csvBlob = new Blob([csvData], { type: "text/csv" });
    const csvURL = URL.createObjectURL(csvBlob);

    const a = document.createElement("a");
    a.href = csvURL;
    a.download = filename;

    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(csvURL);
}

async function clickNextDiv(index, tourney_info) {
    const contentWrappers = findDivs();
    
    if (index < contentWrappers.length) {
        contentWrappers[index].click();
        console.log(`Clicked div ${index + 1}`);
        
        setTimeout(async () => {
            await findPlayerList(tourney_info);
            clickNextDiv(index + 1, tourney_info);
        }, 250); // Delay of 1 second (1000 milliseconds) between clicks
    } else {
        console.log("All divs clicked. Exporting player list to CSV.");
        console.log(tourneyName);
        exportToCSV(tourneyName, playerNames.join("\n"));
    }
}

async function getExposures() {
    const divs = findDivs();

    // Gather tournament information
    document.querySelector(".styles__infoIcon__i2XtS").click();
    await sleep(300);
    const tourney_info = [];

    var tourney_name = document.querySelector(".styles__title__ZrO6C").textContent.trim();
    tourney_info.push(tourney_name);

    var entry_value = document.querySelector(".styles__entryInfoValue__qx_JF").textContent.trim();
    tourney_info.push(entry_value);

    var raw_tourney_info = document.querySelectorAll(".styles__infoValue__F0R73");

    var sport = raw_tourney_info[0].textContent.trim();
    tourney_info.push(sport);
    var entrants = raw_tourney_info[1].textContent.trim().replace(',', '');
    tourney_info.push(entrants);
    var fill = raw_tourney_info[2].textContent.trim();
    tourney_info.push(fill);
    var slate = raw_tourney_info[3].textContent.trim();
    tourney_info.push(slate);
    var max_entries = raw_tourney_info[5].textContent.trim();
    tourney_info.push(max_entries);
    var draft_size = raw_tourney_info[6].textContent.trim();
    tourney_info.push(draft_size);
    var draft_rounds = raw_tourney_info[7].textContent.trim();
    tourney_info.push(draft_rounds);
    var rake = raw_tourney_info[8].textContent.trim();
    tourney_info.push(rake);
    var start_time = raw_tourney_info[9].textContent.trim();
    tourney_info.push(start_time);

    document.querySelector(".styles__closeButton__ZYuEF").click();
    await sleep(200);

    if (divs.length > 0) {
        const contentWrappers = Array.from(divs); 
        clickNextDiv(0, tourney_info);
    } else {
        console.log("No div elements with the class 'styles__contentWrapper__OChjU' found.");
    }
}

getExposures();
