function makeSectionLink(sectionHeader) {
    const sectionLink = document.createElement("div");
    sectionLink.classList.add("sectionLink");
    sectionLink.title = "Copy a deep-link to this section to your clipboard.";
    sectionHeader.appendChild(sectionLink);

    sectionLink.addEventListener("click", e => {
        const anchor = sectionHeader.innerText.replace(/\s/g, "-").replace(/[^\w-]/g, "").toLowerCase();
        const href = window.location.origin + window.location.pathname + "#" + anchor;
        navigator.clipboard.writeText(href);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    for (const sectionHeader of document.querySelectorAll("article h2, article h3, article h4")) {
        makeSectionLink(sectionHeader);
    }
});
