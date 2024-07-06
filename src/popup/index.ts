import Browser from "webextension-polyfill";

const button = document.getElementById("signin");

async function main() {
    if (button) {
        const { token } = await Browser.storage.local.get("token");
        const { display_name } = await Browser.storage.local.get("display_name");
        const { profile_image_url } = await Browser.storage.local.get("profile_image_url");

        console.log(token, display_name, profile_image_url);
        if (token && display_name && profile_image_url) {
            document.body.classList.add("logged-in");
            button.style.display = "none";
            const profile = document.getElementById("profile");

            if (!profile) {
                return;
            }

            const img = document.createElement("img");
            img.src = profile_image_url + "";
            img.classList.add("profile-image");

            const name = document.createElement("span");
            name.textContent = display_name + "";
            name.classList.add("profile-name");

            profile.appendChild(img);
            profile.appendChild(name);
        }

        button.onclick = async () => {
            const redirectUrl = chrome.identity.getRedirectURL();
            console.log(redirectUrl);

            if (!redirectUrl) {
                return;
            }

            const responseUrl = await Browser.identity.launchWebAuthFlow(
                {
                    url: `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=tqj580q6bs92pt112t5v6tljgx0oyu&redirect_uri=${encodeURIComponent(
                        redirectUrl,
                    )}&scope=user:read:email`,
                    interactive: true,
                },
            );

            const code = new URL(responseUrl).searchParams.get("code");

            if (!code) {
                return;
            }

            const response = await fetch(
                // `https://api.canireact.com/auth/twitch/code/${code}`,
                `http://localhost:8787/auth/twitch/code/${code}`,
                {
                    method: "POST",
                }
            );

            if (response.status !== 200) {
                return;
            }

            const { token, display_name, profile_image_url } = await response.json();

            Browser.storage.local.set({
                token,
                display_name,
                profile_image_url,
            })
        };
    }
}

main();