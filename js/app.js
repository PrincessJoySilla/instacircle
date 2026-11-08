console.log("InstaCircle is ready!");

// ==========================================
// 1. GET HTML ELEMENTS
// ==========================================

const followersFile = document.getElementById("followersFile");
const followingFile = document.getElementById("followingFile");

const analyzeButton = document.getElementById("analyzeButton");
const clearButton = document.getElementById("clearButton");

const followersCount = document.getElementById("followersCount");
const followingCount = document.getElementById("followingCount");
const notFollowingBackCount = document.getElementById("notFollowingBackCount");
const mutualCount = document.getElementById("mutualCount");

const notFollowingBackList = document.getElementById("notFollowingBackList");
const mutualList = document.getElementById("mutualList");

const notFollowingBackEmpty = document.getElementById("notFollowingBackEmpty");
const mutualEmpty = document.getElementById("mutualEmpty");

const searchNotFollowingBack = document.getElementById("searchNotFollowingBack");
const searchMutuals = document.getElementById("searchMutuals");

const exportNotFollowingBack = document.getElementById("exportNotFollowingBack");
const exportMutuals = document.getElementById("exportMutuals");

const statusMessage = document.getElementById("statusMessage");


// ==========================================
// 2. NAVBAR: SMOOTH SCROLL + ACTIVE SECTION
// ==========================================

const navLinks = document.querySelectorAll(".nav-link");

const navigationSections = [
    document.getElementById("dashboard"),
    document.getElementById("upload"),
    document.getElementById("results"),
    document.getElementById("guide")
];

function setActiveNav(targetId) {

    navLinks.forEach(link => {

        const isActive = link.getAttribute("href") === `#${targetId}`;

        link.classList.toggle("active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "location");
        } else {
            link.removeAttribute("aria-current");
        }

    });

}

navLinks.forEach(link => {

    link.addEventListener("click", function (event) {

        event.preventDefault();

        const targetId = this.getAttribute("href").substring(1);
        const targetSection = document.getElementById(targetId);

        if (!targetSection) return;

        setActiveNav(targetId);

        history.replaceState(null, "", `#${targetId}`);

        const header = document.querySelector(".header");
        const headerHeight = header.offsetHeight;

        const targetPosition =
            targetSection.getBoundingClientRect().top +
            window.scrollY -
            headerHeight -
            16;

        window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: "smooth"
        });

    });

});

function updateActiveSection() {

    const header = document.querySelector(".header");
    const activationPoint = header.offsetHeight + 40;

    let currentSection = "dashboard";

    navigationSections.forEach(section => {

        if (!section) return;

        if (section.getBoundingClientRect().top <= activationPoint) {
            currentSection = section.id;
        }

    });

    setActiveNav(currentSection);

}

window.addEventListener("scroll", updateActiveSection, {
    passive: true
});

window.addEventListener("resize", updateActiveSection);

if (window.location.hash) {

    const initialId = window.location.hash.substring(1);

    if (navigationSections.some(section => section && section.id === initialId)) {
        setActiveNav(initialId);
    }

} else {

    setActiveNav("dashboard");

}

// ==========================================
// 3. STORE RESULTS
// ==========================================

let followers = [];
let following = [];
let notFollowingBack = [];
let mutuals = [];

let analysisComplete = false;


// ==========================================
// 4. REMOVE DUPLICATES
// ==========================================

function uniqueUsernames(usernames) {

    const seen = new Set();

    return usernames.filter(username => {

        const normalized = username.trim().toLowerCase();

        if (!normalized || seen.has(normalized)) {
            return false;
        }

        seen.add(normalized);

        return true;

    });

}


// ==========================================
// 5. EXTRACT USERNAMES FROM INSTAGRAM JSON
// ==========================================

function extractUsernames(data, type) {

    let accounts = [];

    if (type === "followers") {

        accounts = Array.isArray(data) ? data : [];

    } else if (type === "following") {

        accounts = Array.isArray(data.relationships_following)
            ? data.relationships_following
            : [];

    }

    const usernames = accounts.flatMap(account => {

        const entries = account.string_list_data || [];

        const values = entries
            .map(entry => entry.value)
            .filter(Boolean);

        if (values.length > 0) {
            return values;
        }

        if (type === "following" && account.title) {
            return [account.title];
        }

        return [];

    });

    return usernames;

}


// ==========================================
// 6. READ JSON FILE
// ==========================================

async function readJsonFile(file) {

    const content = await file.text();

    return JSON.parse(content);

}


// ==========================================
// 7. DISPLAY USERNAMES
// ==========================================

function displayUsernames(
    usernames,
    listElement,
    emptyElement,
    searchValue = ""
) {

    listElement.innerHTML = "";

    const filteredUsernames = usernames.filter(username =>
        username.toLowerCase().includes(searchValue.toLowerCase().trim())
    );

    if (filteredUsernames.length === 0) {

        emptyElement.textContent = searchValue.trim()
            ? "No usernames match your search."
            : "No accounts found.";

        emptyElement.style.display = "block";

        return;

    }

    emptyElement.style.display = "none";

    filteredUsernames.forEach(username => {

        const li = document.createElement("li");

        li.textContent = username;

        listElement.appendChild(li);

    });

}


// ==========================================
// 8. UPDATE BOTH RESULTS LISTS
// ==========================================

function renderResults() {

    displayUsernames(
        notFollowingBack,
        notFollowingBackList,
        notFollowingBackEmpty,
        searchNotFollowingBack.value
    );

    displayUsernames(
        mutuals,
        mutualList,
        mutualEmpty,
        searchMutuals.value
    );

}


// ==========================================
// 9. ANALYZE INSTAGRAM DATA
// ==========================================

analyzeButton.addEventListener("click", async function () {

    const followerFiles = Array.from(followersFile.files);
    const followingFiles = Array.from(followingFile.files);

    if (followerFiles.length === 0 || followingFiles.length === 0) {

        alert("Please upload both Followers and Following JSON files.");

        statusMessage.textContent = "Both files are required.";

        return;

    }

    analyzeButton.disabled = true;
    analyzeButton.textContent = "Analyzing...";

    try {

        statusMessage.textContent = "Reading your Instagram files...";

        let allFollowers = [];

        for (const file of followerFiles) {

            const data = await readJsonFile(file);

            allFollowers.push(
                ...extractUsernames(data, "followers")
            );

        }

        let allFollowing = [];

        for (const file of followingFiles) {

            const data = await readJsonFile(file);

            allFollowing.push(
                ...extractUsernames(data, "following")
            );

        }

        followers = uniqueUsernames(allFollowers);
        following = uniqueUsernames(allFollowing);

        const followerSet = new Set(
            followers.map(username => username.toLowerCase())
        );

        notFollowingBack = following.filter(username =>
            !followerSet.has(username.toLowerCase())
        );

        mutuals = following.filter(username =>
            followerSet.has(username.toLowerCase())
        );

        followersCount.textContent = followers.length;
        followingCount.textContent = following.length;
        notFollowingBackCount.textContent = notFollowingBack.length;
        mutualCount.textContent = mutuals.length;

        searchNotFollowingBack.value = "";
        searchMutuals.value = "";

        renderResults();

        analysisComplete = true;

            statusMessage.innerHTML = `
                <p>Analysis complete! Your Instagram results are ready.</p>
                <p class="note">
                    Note: Your Following and Mutuals counts may differ from your current Instagram dashboard because some accounts in your downloaded data may be unavailable, deleted, or deactivated.
                </p>
            `;

    } catch (error) {

        console.error("Analysis error:", error);

        statusMessage.textContent =
            "Something went wrong. Check your JSON files and try again.";

        alert(
            "Unable to read your files. Make sure you selected the correct Instagram JSON exports."
        );

    } finally {

        analyzeButton.disabled = false;
        analyzeButton.textContent = "Analyze My Circle";

    }

});


// ==========================================
// 10. SEARCH NOT FOLLOWING BACK
// ==========================================

searchNotFollowingBack.addEventListener("input", function () {

    renderResults();

});


// ==========================================
// 11. SEARCH MUTUALS
// ==========================================

searchMutuals.addEventListener("input", function () {

    renderResults();

});


// ==========================================
// 12. EXPORT RESULTS TO CSV
// ==========================================

function exportCSV(usernames, filename) {

    if (!analysisComplete) {

        alert("Please analyze your Instagram data first.");

        return;

    }

    if (usernames.length === 0) {

        alert("There are no usernames to export.");

        return;

    }

    const csvRows = [
        ["Username"],
        ...usernames.map(username => [username])
    ];

    const csvContent = csvRows
        .map(row =>
            row.map(value =>
                `"${String(value).replace(/"/g, '""')}"`
            ).join(",")
        )
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

}

// ==========================================
// 13. EXPORT NOT FOLLOWING BACK
// ==========================================

exportNotFollowingBack.addEventListener("click", function () {

    exportCSV(
        notFollowingBack,
        "instacircle-not-following-back.csv"
    );

});


// ==========================================
// 14. EXPORT MUTUALS
// ==========================================

exportMutuals.addEventListener("click", function () {

    exportCSV(
        mutuals,
        "instacircle-mutual-followers.csv"
    );

});


// ==========================================
// 15. CLEAR RESULTS
// ==========================================

clearButton.addEventListener("click", function () {

    followers = [];
    following = [];
    notFollowingBack = [];
    mutuals = [];

    analysisComplete = false;

    followersFile.value = "";
    followingFile.value = "";

    searchNotFollowingBack.value = "";
    searchMutuals.value = "";

    followersCount.textContent = "0";
    followingCount.textContent = "0";
    notFollowingBackCount.textContent = "0";
    mutualCount.textContent = "0";

    notFollowingBackList.innerHTML = "";
    mutualList.innerHTML = "";

    notFollowingBackEmpty.textContent =
        "No results yet. Upload your files and analyze first.";

    mutualEmpty.textContent =
        "No results yet. Upload your files and analyze first.";

    notFollowingBackEmpty.style.display = "block";
    mutualEmpty.style.display = "block";

    statusMessage.textContent =
        "Results cleared. Upload new files to start again.";

});

console.log("InstaCircle JavaScript loaded successfully!");
