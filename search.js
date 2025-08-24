// helper to read GET parameters
function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
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

async function searchVideos(query) {
    const container = document.getElementById("homeFeed");
    container.innerHTML = "<p>Loading...</p>";

    const apiKey = localStorage.getItem("ytApiKey");
    if (!apiKey) {
        container.innerHTML = "<p>No API key saved!</p>";
        return;
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=50&q=${encodeURIComponent(query)}&key=${apiKey}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();

        container.innerHTML = ""; // clear loading message

        if (!data.items || data.items.length === 0) {
            container.innerHTML = "<p>No results found.</p>";
            return;
        }

        data.items.forEach(video => {
            const vidId = video.id.videoId;
            const thumbUrl = video.snippet?.thumbnails?.medium?.url || "";
            const title = video.snippet?.title || "Untitled";

            const videoElem = createVideoElement(vidId, title, thumbUrl);
            container.appendChild(videoElem);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error fetching search results.</p>";
    }
}

function goback() {
    window.location.href = "index.html";
}

// trigger search on page load if ?search= parameter exists
const initialQuery = getQueryParam("search");
if (initialQuery) {
    document.getElementById("inputbox").value = initialQuery;
    searchVideos(initialQuery);
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