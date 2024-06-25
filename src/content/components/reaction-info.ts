import { collapseState } from "..";
import { hasTimeElapsed, isSponsorBlockInstalled, log } from "../utils";
import { Guidelines } from "../utils/api";
import { getLanguageString } from "../utils/language";
import { createImageElement, createTextElement } from "../utils/render";
import browser from "webextension-polyfill";

let videoCountdownInterval: NodeJS.Timeout | null = null;
let streamCountdownInterval: NodeJS.Timeout | null = null;

export async function removeInfo(): Promise<void> {
    const reactionInfo = document.querySelector("#reaction-info");
    videoCountdownInterval && clearInterval(videoCountdownInterval);
    streamCountdownInterval && clearInterval(streamCountdownInterval);
    if (reactionInfo) {
        reactionInfo.remove();
    }
}

async function updateCountdown(element: HTMLElement, uploadedAt: string, hours: number, templateString: string, timeElapsedCallback?: () => void): Promise<void> {
    const uploadedTime = new Date(uploadedAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedHours = (currentTime - uploadedTime) / 1000 / 60 / 60;
    const remainingHours = hours - elapsedHours;

    if (remainingHours <= 0) {
        element.textContent = templateString.replace("%time", "00:00:00");
        timeElapsedCallback && timeElapsedCallback();
        return;
    }

    const hoursLeft = Math.floor(remainingHours);
    const minutesLeft = Math.floor((remainingHours - hoursLeft) * 60);
    const secondsLeft = Math.floor(((remainingHours - hoursLeft) * 60 - minutesLeft) * 60);

    const remaningTime = `${hoursLeft.toString().padStart(2, '0')}:${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
    element.textContent = templateString.replace("%time", remaningTime);
}

export async function addReactionInfo(bottomRow: HTMLElement, response: Guidelines): Promise<void> {
    const reactionInfo = document.createElement("div");
    const innerReactionInfo = document.createElement("div");
    const detailedInfo = document.createElement("div");
    const toggleButton = document.createElement("button");

    reactionInfo.id = "reaction-info";
    reactionInfo.className = "item style-scope ytd-watch-metadata rounded-large";
    innerReactionInfo.id = "reaction-info-inner";
    innerReactionInfo.className = "style-scope ytd-watch-metadata";

    toggleButton.id = "reaction-info-toggle";
    toggleButton.className = "style-scope ytd-watch-metadata";
    toggleButton.textContent = "-"; // Initially set to collapse

    detailedInfo.classList.add("reaction-info-detailed");

    let elements: HTMLElement[] = [];
    removeInfo();

    if (response.info_text) {
        reactionInfo.classList.add("gray");
        elements.push(createTextElement("p", "reaction-info-secondary", response.info_text));

        if (response.source) {
            if (response.source === "canireact") {
                const lightSrc = browser.runtime.getURL("images/canireact_source-light.svg");
                const darkSrc = browser.runtime.getURL("images/canireact_source.svg");

                elements.push(createImageElement(lightSrc, "Can I React?", "reaction-info-source light-version"));
                elements.push(createImageElement(darkSrc, "Can I React?", "reaction-info-source dark-version"));
            } else if (response.source === "streamfinity") {
                const lightSrc = browser.runtime.getURL("images/streamfinity_source-light.svg");
                const darkSrc = browser.runtime.getURL("images/streamfinity_source.svg");

                elements.push(createImageElement(lightSrc, "Streamfinity", "reaction-info-source light-version"));
                elements.push(createImageElement(darkSrc, "Streamfinity", "reaction-info-source dark-version"));
            }
        }
    } else {
        if (response.video) {
            if (response.rules?.video.video_reaction_allowed_after_hours && response.rules?.video.video_reactions_allowed === false) {
                // The key was temporarily named stream_reaction_allowed_after_hours and those responses may be cached, so we need to check for both
                const timeElapsed = hasTimeElapsed(response.video.uploaded_at, response.rules.video.video_reaction_allowed_after_hours);
                if (timeElapsed) response.rules.video.video_reactions_allowed = response.rules.video.stream_reactions_generally_allowed ?? response.rules.video.video_reactions_generally_allowed;
            }

            if (response.rules?.stream.stream_reaction_allowed_after_hours && response.rules?.stream.stream_reactions_allowed === false) {
                const timeElapsed = hasTimeElapsed(response.video.uploaded_at, response.rules.stream.stream_reaction_allowed_after_hours);
                if (timeElapsed) response.rules.stream.stream_reactions_allowed = response.rules.stream.stream_reactions_generally_allowed;
            }
        }

        // Simple info about the general rules
        if (response.rules?.stream.stream_reactions_allowed === true && response.rules?.video.video_reactions_allowed === true) {
            reactionInfo.classList.add("green");
            innerReactionInfo.appendChild(createTextElement("p", "reaction-info-major reaction-info-success", `✔ ${await getLanguageString("stream_video_reactions_allowed")}`));
        } else if (response.rules?.stream.stream_reactions_allowed === true) {
            reactionInfo.classList.add("orange");
            innerReactionInfo.appendChild(createTextElement("p", "reaction-info-major reaction-info-success", `✔ ${await getLanguageString("stream_reactions_allowed")}`));
        } else if (response.rules?.stream.stream_reactions_allowed === false) {
            reactionInfo.classList.add("red");
            innerReactionInfo.appendChild(createTextElement("p", "reaction-info-major reaction-info-error", `✘ ${await getLanguageString("stream_reactions_not_allowed")}`));
        }

        elements.push(createTextElement("p", "reaction-info-secondary font-bold", "Stream"));

        if (response.rules?.stream.custom_rules) {
            response.rules.stream.custom_rules.forEach((rule: string) => {
                elements.push(createTextElement("p", "reaction-info-secondary", rule));
            });
        }

        // Stream reactions allowed after hours
        if (response.rules?.stream.stream_reaction_allowed_after_hours && response.rules?.stream.stream_reactions_allowed === false) {
            const textWithHours = (await getLanguageString("stream_reactions_allowed_after_hours")).replace("%hours", response.rules.stream.stream_reaction_allowed_after_hours + "");
            const streamReactionCountdown = createTextElement("p", "reaction-info-secondary font-bold", textWithHours);
            elements.push(streamReactionCountdown);
            updateCountdown(streamReactionCountdown, response.video!.uploaded_at, response.rules.stream.stream_reaction_allowed_after_hours, textWithHours);
            streamCountdownInterval = setInterval(() => updateCountdown(streamReactionCountdown, response.video!.uploaded_at, response.rules!.stream.stream_reaction_allowed_after_hours!, textWithHours, () => {
                removeInfo();
                addReactionInfo(bottomRow, response);
            }), 1000);
        }

        if (response.rules?.stream.sponsor_skips_allowed === true) {
            elements.push(createTextElement("p", "reaction-info-secondary", `✔ ${await getLanguageString("sponsor_skips_allowed")}`));
        } else if (response.rules?.stream.sponsor_skips_allowed === false) {
            elements.push(createTextElement("p", "reaction-info-secondary", `✘ ${await getLanguageString("sponsor_skips_not_allowed")}`));
            if (isSponsorBlockInstalled()) {
                elements.push(createTextElement("p", "reaction-info-secondary font-bold", await getLanguageString("sponsor_block_installed")));
            }
        }

        if (response.rules?.stream.credit_stream_chat === true) {
            elements.push(createTextElement("p", "reaction-info-secondary", await getLanguageString("credit_stream_chat")));
        }

        elements.push(createTextElement("p", "reaction-info-secondary font-bold", "Video"));

        if (response.rules?.video.custom_rules) {
            response.rules.video.custom_rules.forEach((rule: string) => {
                elements.push(createTextElement("p", "reaction-info-secondary", rule));
            });
        }

        if (response.rules?.video.video_reaction_allowed_after_hours && response.rules.video.video_reactions_allowed === false) {
            const textWithHours = (await getLanguageString("video_reactions_allowed_after_hours")).replace("%hours", response.rules.video.video_reaction_allowed_after_hours + "");
            const videoReactionCountdown = createTextElement("p", "reaction-info-secondary font-bold", textWithHours);
            elements.push(videoReactionCountdown);
            updateCountdown(videoReactionCountdown, response.video!.uploaded_at, response.rules.video.video_reaction_allowed_after_hours, textWithHours);
            videoCountdownInterval = setInterval(() => updateCountdown(videoReactionCountdown, response.video!.uploaded_at, response.rules!.video.video_reaction_allowed_after_hours!, textWithHours, () => {
                removeInfo();
                addReactionInfo(bottomRow, response);
            }), 1000);
        }

        if (response.rules?.video.video_reactions_allowed === false && Number(response.rules?.video.video_reaction_allowed_after_hours) <= 0) {
            elements.push(createTextElement("p", "reaction-info-secondary", `✘ ${await getLanguageString("video_reactions_not_allowed")}`));
        }

        if (response.rules?.video.sponsor_cut_allowed === true) {
            elements.push(createTextElement("p", "reaction-info-secondary", `✔ ${await getLanguageString("sponsor_cut_allowed")}`));
        } else if (response.rules?.video.sponsor_cut_allowed === false) {
            elements.push(createTextElement("p", "reaction-info-secondary", `✘ ${await getLanguageString("sponsor_cut_not_allowed")}`));
        }

        if (response.rules?.video.credit_video_description) {
            elements.push(createTextElement("p", "reaction-info-secondary", await getLanguageString("credit_video_description")));
        }
        if (response.rules?.video.reaction_video_includes_title === true) {
            elements.push(createTextElement("p", "reaction-info-secondary", `${await getLanguageString("reaction_video_includes_title")}`));
        }

        if (response.rules?.video.monetization_allowed === true) {
            elements.push(createTextElement("p", "reaction-info-secondary", `✔ ${await getLanguageString("monetization_allowed")}`));
        } else if (response.rules?.video.monetization_allowed === false) {
            elements.push(createTextElement("p", "reaction-info-secondary", `✘ ${await getLanguageString("monetization_not_allowed")}`));
        }

        if (response.rules?.video.reaction_video_splittling_allowed === false) {
            elements.push(createTextElement("p", "reaction-info-secondary", `✘ ${await getLanguageString("reaction_video_splittling_not_allowed")}`));
        }

        // Disclaimer
        elements.push(createTextElement("p", "reaction-info-secondary gray mt-1", await getLanguageString("guideline_disclaimer")));

        if (response.source) {
            if (response.source === "canireact") {
                const lightSrc = browser.runtime.getURL("images/canireact_source-light.svg");
                const darkSrc = browser.runtime.getURL("images/canireact_source.svg");

                elements.push(createImageElement(lightSrc, "Can I React?", "reaction-info-source light-version"));
                elements.push(createImageElement(darkSrc, "Can I React?", "reaction-info-source dark-version"));
            } else if (response.source === "streamfinity") {
                const lightSrc = browser.runtime.getURL("images/streamfinity_source-light.svg");
                const darkSrc = browser.runtime.getURL("images/streamfinity_source.svg");

                elements.push(createImageElement(lightSrc, "Streamfinity", "reaction-info-source light-version"));
                elements.push(createImageElement(darkSrc, "Streamfinity", "reaction-info-source dark-version"));
            }
        }
    }

    elements.forEach(el => detailedInfo.appendChild(el));
    innerReactionInfo.appendChild(detailedInfo);
    reactionInfo.appendChild(toggleButton);
    reactionInfo.appendChild(innerReactionInfo);
    bottomRow.parentNode?.insertBefore(reactionInfo, bottomRow);

    if (!collapseState) {
        detailedInfo.style.display = "none";
        toggleButton.textContent = "+";
    }

    toggleButton.addEventListener("click", () => {
        browser.runtime.sendMessage({ message: "setCollapseState", data: detailedInfo.style.display === "none" });

        if (detailedInfo.style.display === "none") {
            detailedInfo.style.display = "block";
            toggleButton.textContent = "-";
        } else {
            detailedInfo.style.display = "none";
            toggleButton.textContent = "+";
        }
    });
}
