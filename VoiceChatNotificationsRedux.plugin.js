//META{"name":"VoiceChatNotificationsRedux"}*//

class VoiceChatNotificationsRedux {

    constructor() {

        this.defaultSettings = {
            logConnections: true,
            logMutes: true,
            logDeafens: true,
            logMoves: true,
            logServerMuteDeaf: true,
            displayWhileFocused: true,
            displayUpdateNotes: true,
            suppressInDnd: true,
            targetClass: "scroller-2FKFPG"
        };

    }

    getName() { return "VoiceChatNotificationsRedux"; }
    getDescription() { return "Displays notifications when users connect/disconnect, mute/unmute, and deafen/undeafen in the voice channel you're in. Press Alt + V to toggle the voice log. Based on VoiceChatNotifications by Metalloriff."; }
    getVersion() { return "1.0.0"; }
    getAuthor() { return "Grufkork/Metalloriff"; }
    getChanges() {
        return {
            "1.0.0":
                `
                Cut some bits and fixed som bugs in Metalloriff's VoiceChatNoticitaions. The updating part won't work, but it otherwise seems to have full functionality.
            `
        };
    }

    load() { }

    start() {

        let libLoadedEvent = () => {
            try { this.onLibLoaded(); }
            catch (err) { console.error(this.getName(), "fatal error, plugin could not be started!", err); }
        };

        let lib = document.getElementById("NeatoBurritoLibrary");
        if (lib == undefined) {
            lib = document.createElement("script");
            lib.setAttribute("id", "NeatoBurritoLibrary");
            lib.setAttribute("type", "text/javascript");
            lib.setAttribute("src", "https://rawgit.com/Metalloriff/BetterDiscordPlugins/master/Lib/NeatoBurritoLibrary.js");
            document.head.appendChild(lib);
        }
        if (typeof window.Metalloriff !== "undefined") libLoadedEvent();
        else lib.addEventListener("load", libLoadedEvent);

    }

    getSettingsPanel() {

        setTimeout(() => {

            NeatoLib.Settings.pushElement(NeatoLib.Settings.Elements.createToggleGroup("vcn-toggles", "Settings", [
                { title: "Display notifications on user connect/disconnect", value: "logConnections", setValue: this.settings.logConnections },
                { title: "Display notificaitons on user mute/unmute", value: "logMutes", setValue: this.settings.logMutes },
                { title: "Display notifications on user deafen/undeafen", value: "logDeafens", setValue: this.settings.logDeafens },
                { title: "Display notifications on user move", value: "logMoves", setValue: this.settings.logMoves },
                { title: "Display notifications on user server mute/deafen", value: "logServerMuteDeaf", setValue: this.settings.logServerMuteDeaf },
                { title: "Display notifications while Discord is focused", value: "displayWhileFocused", setValue: this.settings.displayWhileFocused },
                { title: "Suppress notifications while in do not disturb", value: "suppressInDnd", setValue: this.settings.suppressInDnd }
            ], choice => {
                this.settings[choice.value] = !this.settings[choice.value];
                this.saveSettings();
            }), this.getName());

            NeatoLib.Settings.pushElement(NeatoLib.Settings.Elements.createNewTextField("Class of target node to cover", "scroller-2FKFPG", (e)=>{
                this.settings[targetClass] = e.value;
                this.saveSettings();
            }), this.getName());

            NeatoLib.Settings.pushChangelogElements(this);

        }, 0);

        return `${NeatoLib.Settings.Elements.pluginNameLabel(this.getName())}`;

    }

    saveSettings() { NeatoLib.Settings.save(this); }

    onLibLoaded() {

        this.settings = NeatoLib.Settings.load(this, this.defaultSettings);

        //NeatoLib.Updates.check(this);

        //if(this.settings.displayUpdateNotes) NeatoLib.Changelog.compareVersions(this.getName(), this.getChanges());

        this.log = [];

        let getVoiceStates = NeatoLib.Modules.get(["getVoiceState"]).getVoiceStates,
            getUser = NeatoLib.Modules.get(["getUser"]).getUser,
            getChannel = NeatoLib.Modules.get(["getChannel"]).getChannel;

        let lastStates = {};

        let localUser = NeatoLib.getLocalUser();

        this.update = setInterval(() => {

            if (!this.settings.displayWhileFocused && this.focused) return;

            let currentCall = NeatoLib.getSelectedVoiceChannel();

            if (currentCall == undefined) {
                lastStates = {};
                return;
            }

            let newStates = getVoiceStates(currentCall.guild_id);

            if (Object.keys(lastStates).length == 0) {
                lastStates = newStates;
            }

            for (let id in newStates) {

                if (localUser.id == id) continue;

                if (lastStates[id] == undefined) {
                    if (!this.settings.logConnections) continue;
                    let user = getUser(id), channel = getChannel(newStates[id].channelId);
                    if (user && channel) {
                        if (!this.settings.suppressInDnd || NeatoLib.getLocalStatus() != "dnd") new Notification(`${user.username} joined ${channel.name}`, { silent: true, icon: user.getAvatarURL() });
                        this.log.push({ avatar: user.getAvatarURL(), username: user.username, timestamp: new Date().toLocaleTimeString(), text: `Joined ${channel.name}` });
                    }
                } else {

                    if (this.settings.logMoves && lastStates[id].channelId != newStates[id].channelId) {

                        let user = getUser(id), channel = getChannel(newStates[id].channelId);

                        if (user && channel) {
                            if (!this.settings.suppressInDnd || NeatoLib.getLocalStatus() != "dnd") new Notification(`${user.username} moved to ${channel.name}`, { silent: true, icon: user.getAvatarURL() });
                            this.log.push({ avatar: user.getAvatarURL(), username: user.username, timestamp: new Date().toLocaleTimeString(), text: `Moved to ${channel.name}` });
                        }

                        continue;

                    }

                    if (this.settings.logServerMuteDeaf && lastStates[id].deaf != newStates[id].deaf) {

                        let user = getUser(id);

                        if (user) {
                            if (!this.settings.suppressInDnd || NeatoLib.getLocalStatus() != "dnd") new Notification(`${user.username} ${newStates[id].deaf ? "server deafened" : "server undeafened"}`, { silent: true, icon: user.getAvatarURL() });
                            this.log.push({ avatar: user.getAvatarURL(), username: user.username, timestamp: new Date().toLocaleTimeString(), text: newStates[id].deaf ? "Server deafened" : "Server undeafened" });
                        }

                        continue;

                    }

                    if (this.settings.logServerMuteDeaf && lastStates[id].mute != newStates[id].mute) {

                        let user = getUser(id);

                        if (user) {
                            if (!this.settings.suppressInDnd || NeatoLib.getLocalStatus() != "dnd") new Notification(`${user.username} ${newStates[id].mute ? "server muted" : "server unmuted"}`, { silent: true, icon: user.getAvatarURL() });
                            this.log.push({ avatar: user.getAvatarURL(), username: user.username, timestamp: new Date().toLocaleTimeString(), text: newStates[id].mute ? "Server muted" : "Server unmuted" });
                        }

                        continue;

                    }

                    if (this.settings.logDeafens && lastStates[id].selfDeaf != newStates[id].selfDeaf) {

                        let user = getUser(id);

                        if (user) {
                            if (!this.settings.suppressInDnd || NeatoLib.getLocalStatus() != "dnd") new Notification(`${user.username} ${newStates[id].selfDeaf ? "deafened" : "undeafened"}`, { silent: true, icon: user.getAvatarURL() });
                            this.log.push({ avatar: user.getAvatarURL(), username: user.username, timestamp: new Date().toLocaleTimeString(), text: newStates[id].selfDeaf ? "Deafened" : "Undeafened" });
                        }

                        continue;

                    }

                    if (this.settings.logMutes && lastStates[id].selfMute != newStates[id].selfMute) {

                        let user = getUser(id);

                        if (user) {
                            if (!this.settings.suppressInDnd || NeatoLib.getLocalStatus() != "dnd") new Notification(`${user.username} ${newStates[id].selfMute ? "muted" : "unmuted"}`, { silent: true, icon: user.getAvatarURL() });
                            this.log.push({ avatar: user.getAvatarURL(), username: user.username, timestamp: new Date().toLocaleTimeString(), text: newStates[id].selfMute ? "Muted" : "Unmuted" });
                        }

                    }

                }

            }
            for (let id in lastStates) {

                if (localUser.id == id || !this.settings.logConnections) continue;

                if (newStates[id] == undefined && id != localUser.id) {
                    let user = getUser(id), channel = getChannel(lastStates[id].channelId);
                    if (user && channel) {
                        if (!this.settings.suppressInDnd || NeatoLib.getLocalStatus() != "dnd") new Notification(`${user.username} left ${channel.name}`, { silent: true, icon: user.getAvatarURL() });
                        this.log.push({ avatar: user.getAvatarURL(), username: user.username, timestamp: new Date().toLocaleTimeString(), text: `Left ${channel.name}` });
                    }
                }

            }

            lastStates = newStates;

        }, 500);

        this.focused = true;

        this.focus = () => this.focused = true;
        this.unfocus = () => this.focused = false;

        window.addEventListener("focus", this.focus);
        window.addEventListener("blur", this.unfocus);

        this.removeVoiceChatLog = () => {
            if (document.getElementById("voiceChatLogContainer") != null) document.getElementById("voiceChatLogContainer").remove();
        };

        this.onKeyDown = e => {

            if (e.altKey) {
                if (e.key == "c") {
                    if (document.getElementById("voiceChatLogContainer") == null) {
                        if (this.log.length > 50) this.log.splice(50, this.log.length);

                        let rect = document.getElementsByClassName(this.settings.targetClass)[0].getBoundingClientRect(); // Change target window to replace here!
                        let logDiv = document.createElement("div");

                        logDiv.id = "voiceChatLogContainer";

                        logDiv.style.position = "absolute";
                        logDiv.style.zIndex = "9999";
                        logDiv.style.top = rect.top + "px";
                        logDiv.style.left = rect.left + "px";
                        logDiv.style.width = (rect.right - rect.left) - 20 + "px";//"40em";
                        logDiv.style.height = (rect.bottom - rect.top) - 20 + "px";

                        logDiv.style.backgroundColor = "var(--background-primary)";
                        logDiv.style.padding = "10px";
                        logDiv.style.color = "var(--text-normal)";
                        logDiv.style.overflow = "auto";

                        let header = document.createElement("p");
                        header.class = "voiceChatLogHeader";
                        header.style.textAlign = "center";
                        header.style.fontSize = "2em";
                        header.appendChild(document.createTextNode("Voice Chat Log"));
                        logDiv.appendChild(header);

                        for (let i = 0; i < this.log.length; i++) {
                            while (this.log[i].timestamp.length < 12) {
                                this.log[i].timestamp += " ";
                            }
                            logDiv.innerHTML += `<br>
                        <span class="voiceChatLogRow">
                            <span style="font-family:consolas" class="voiceChatLogTimestamp">${this.log[i].timestamp}</span>&nbsp;
                            <b class="voiceChatLogUsername">${this.log[i].username}</b> 
                            ${this.log[i].text}
                        </span>`;
                        }
                        document.getElementById("app-mount").appendChild(logDiv);

                    } else {
                        this.removeVoiceChatLog();
                    }
                }
            }

        };

        document.addEventListener("keydown", this.onKeyDown);

        //NeatoLib.Events.onPluginLoaded(this);

    }

    stop() {

        clearInterval(this.update);

        if (this.focus && this.unfocus) {
            window.removeEventListener("focus", this.focus);
            window.removeEventListener("blur", this.unfocus);
        }

        if (this.onKeyDown) document.removeEventListener("keydown", this.onKeyDown);

        this.ready = false;

    }

}