function showChangeSettingsPopup() {
    document.getElementById("changeSettings").showModal();
}

function saveSettings() {
    // grab the input value
    const apiKey = document.getElementById("apikey").value.trim();

    if (!apiKey) {
        alert("Please enter an API key!");
        return;
    }

    // store it in localStorage
    localStorage.setItem("ytApiKey", apiKey);

    // close the dialog
    const dialog = document.getElementById("changeSettings");
    dialog.close();

    // optional: give the user a little feedback
    alert("API key saved!");
}

function search() {
    const input = document.getElementById("inputbox").value.trim();
    if (!input) return;

    // 1. API key already handled separately, skip here

    // 2. Check if input is a YouTube video URL
    let videoId = null;

    // full URL
    try {
        const url = new URL(input);
        if (url.hostname.includes("youtube.com") && url.searchParams.get("v")) {
            videoId = url.searchParams.get("v");
        } else if (url.hostname.includes("youtu.be")) {
            videoId = url.pathname.slice(1); // remove leading /
        }
    } catch(e) {
        // not a URL, maybe it's just a raw video ID
        if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
            videoId = input;
        }
    }

    if (videoId) {
        // Redirect to watch.html with video ID
        window.location.href = `watch.html?v=${videoId}`;
    } else {
        // Treat as a search query
        window.location.href = `search.html?search=${encodeURIComponent(input)}`;
    }
}

function loadSettings() {
    const storedKey = localStorage.getItem("ytApiKey");
    if (storedKey) {
        document.getElementById("apikey").value = storedKey;
    }
}

const CACHE_KEY = "ytHomeFeed";
const CACHE_TIME_KEY = "ytHomeFeedTime";
const CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes

async function getHomeFeed() {
    const now = Date.now();
    const lastFetchTime = localStorage.getItem(CACHE_TIME_KEY);
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached && lastFetchTime && (now - parseInt(lastFetchTime)) < CACHE_LIFETIME) {
        console.log("Using cached feed");
        return JSON.parse(cached);
    }

    // Otherwise fetch fresh data
    const apiKey = localStorage.getItem("ytApiKey");
    if (!apiKey) {
        alert("No API key saved!");
        return null;
    }

    // Example: get most popular videos (Home-like feed)
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=50&key=${apiKey}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("API request failed");
        const data = await res.json();

        // cache the results
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());

        console.log("Fetched fresh feed");
        return data;
    } catch (err) {
        console.error("Error fetching feed:", err);
        return null;
    }
}


function createVideoElement(videoId, videoName, thumbnailUrl) {
    // wrapper div
    const wrapper = document.createElement("div");
    wrapper.style.display = "inline-block";
    wrapper.style.margin = "8px";
    wrapper.style.textAlign = "center";
    wrapper.style.verticalAlign = "top";

    // clickable thumbnail
    const a = document.createElement("a");
    a.href = `watch.html?v=${videoId}`;
    a.title = videoName;

    const img = document.createElement("img");
    img.src = thumbnailUrl;
    img.alt = videoName;
    img.style.borderRadius = "8px";
    img.style.cursor = "pointer";
    img.style.maxWidth = "200px";

    a.appendChild(img);

    // title text
    const text = document.createElement("div");
    text.innerText = videoName;
    text.style.marginTop = "4px";
    text.style.color = "white";
    text.style.fontSize = "14px";
    text.style.maxWidth = "200px";
    text.style.overflow = "hidden";
    text.style.textOverflow = "ellipsis";
    text.style.whiteSpace = "nowrap";

    wrapper.appendChild(a);
    wrapper.appendChild(text);

    return wrapper;
}

async function loadHomePage() {
    const container = document.getElementById("homeFeed");
    container.innerHTML = "";

    const data = await getHomeFeed();
    if (!data || !data.items) {
        container.innerHTML = "<p>Could not load feed :(</p>";
        return;
    }

    data.items.forEach(video => {
        const vidId = video.id.videoId || video.id;
        const thumbUrl = video.snippet?.thumbnails?.medium?.url || "";
        const title = video.snippet?.title || "Untitled";

        const videoElem = createVideoElement(vidId, title, thumbUrl);
        container.appendChild(videoElem);
    });
}

function refreshHomeFeed() {
    // force ignore cache
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
    return getHomeFeed();
}

loadSettings();
loadHomePage();