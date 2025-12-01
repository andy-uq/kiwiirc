<template>
    <div class="kiwi-serverview">
        <div class="kiwi-serverview-inner">
            <tabbed-view ref="tabs" :key="network.id" @changed="tabChanged">
                <tabbed-tab :header="$t('messages')" :focus="hasMessages" name="messages">
                    <message-list :buffer="serverBuffer" />
                </tabbed-tab>
                <tabbed-tab
                    v-if="!restrictedServer"
                    :header="$t('settings')"
                    :focus="!hasMessages"
                    name="settings"
                >
                    <network-settings :network="network" />
                </tabbed-tab>
                <tabbed-tab
                    v-if="networkConnected"
                    :header="$t('channels')"
                    name="channels"
                >
                    <channel-list :network="network" />
                </tabbed-tab>
                <tabbed-tab
                    v-for="item in pluginUiElements"
                    :key="item.id"
                    :header="item.title()"
                    :name="item.tabName"
                >
                    <component
                        :is="item.component"
                        v-bind="item.props"
                        :network="network"
                    />
                </tabbed-tab>
            </tabbed-view>
        </div>
    </div>
</template>

<script>
'kiwi public';

import GlobalApi from '@/libs/GlobalApi';
import MessageList from './MessageList';
import NetworkSettings from './NetworkSettings';
import ChannelList from './ChannelList';

export default {
    components: {
        MessageList,
        NetworkSettings,
        ChannelList,
    },
    props: ['network'],
    data() {
        return {
            pluginUiElements: GlobalApi.singleton().serverViewPlugins,
        };
    },
    computed: {
        hasMessages() {
            return this.network.serverBuffer().getMessages().length > 0;
        },
        serverBuffer() {
            return this.network.serverBuffer();
        },
        restrictedServer() {
            return this.$state.setting('restricted');
        },
        networkConnected() {
            return this.network.state === 'connected';
        },
    },
    watch: {
        networkConnected() {
            this.$nextTick(() => {
                // Vue won't update the tabs being displayed here so we to
                // manually update a property to force a re-render of the tabs
                this.$refs.tabs.a++;
            });
        },
    },
    created() {
        this.listen(this.$state, 'server.tab.show', (tabName) => {
            this.showTab(tabName);
        });
    },
    mounted() {
        this.serverBuffer.active_tab = (this.hasMessages) ? 'messages' : 'settings';
    },
    methods: {
        showTab(tabName) {
            this.$refs.tabs.setActiveByName(tabName);
        },
        tabChanged(tabName) {
            const isMessages = (tabName === 'messages');
            this.serverBuffer.active_tab = tabName;
            this.serverBuffer.isVisible = isMessages;
            this.serverBuffer.show_input = isMessages;
        },
    },
};
</script>

<style>

.kiwi-serverview {
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
}

.kiwi-serverview .kiwi-messagelist {
    padding-top: 0;
    height: 100%;
    margin: 0;
    font-family: Consolas, monaco, monospace;
    font-size: 13px;
}

.kiwi-serverview-inner {
    /* Mobile safari can't work out the height for scrolling to work without this wrapper element */
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}

.kiwi-serverview-alerts {
    margin-bottom: 1em;
}

/* Server buffer message styling */
.kiwi-serverview .kiwi-messagelist-message--text {
    padding: 2px 10px;
    line-height: 1.4em;
}

/* Always show timestamps in server view, inline format
   Use high specificity to override the default absolute positioning */
.kiwi-serverview .kiwi-messagelist .kiwi-messagelist-message--text .kiwi-messagelist-time {
    display: inline;
    position: static;
    padding: 0;
    margin-right: 0;
    opacity: 0.7;
    background: transparent;
    border-radius: 0;
}

/* Override the hover behavior for timestamps in server view */
.kiwi-serverview .kiwi-messagelist .kiwi-messagelist-message--text:hover .kiwi-messagelist-time {
    display: inline;
    position: static;
    background: transparent;
}

/* Format: [timestamp] */
.kiwi-serverview .kiwi-messagelist-message--text .kiwi-messagelist-time::before {
    content: '[';
}

.kiwi-serverview .kiwi-messagelist-message--text .kiwi-messagelist-time::after {
    content: '] ';
}

.kiwi-serverview .kiwi-messagelist-message--text .kiwi-messagelist-nick {
    margin-right: 0;
}

/* Multi-line message alignment using hanging indent */
.kiwi-serverview .kiwi-messagelist-message--text > div:first-child {
    display: block;
    padding-left: 12em;
    text-indent: -12em;
}

/* Body stays inline but wraps properly with the indent */
.kiwi-serverview .kiwi-messagelist-body {
    display: inline;
    margin-bottom: 0;
    text-indent: 0;
}

/* Tighter spacing for server messages */
.kiwi-serverview .kiwi-messagelist-item:last-of-type {
    margin-bottom: 0;
}

/* MOTD styling - keep it consistent with the rest */
.kiwi-serverview .kiwi-messagelist-message-motd {
    font-family: inherit;
}

/* Hide reaction bar in server view - not applicable for server messages */
.kiwi-serverview .kiwi-messagelist .kiwi-messagelist-message--text .kiwi-messagelist-reactionbar {
    display: none;
}

</style>
