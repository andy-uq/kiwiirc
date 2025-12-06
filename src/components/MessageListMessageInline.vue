<template functional>
    <div
        :class="[
            `kiwi-messagelist-message-${props.message.type}`,
            props.message.type_extra
                ? `kiwi-messagelist-message-${props.message.type}-${props.message.type_extra}`
                : '',
            props.ml.isMessageHighlight(props.message)
                ? 'kiwi-messagelist-message--highlight'
                : '',
            props.ml.isHoveringOverMessage(props.message)
                ? 'kiwi-messagelist-message--hover'
                : '',
            props.ml.buffer.last_read && props.message.time > props.ml.buffer.last_read
                ? 'kiwi-messagelist-message--unread'
                : '',
            props.message.nick.toLowerCase() === props.ml.ourNick.toLowerCase()
                ? 'kiwi-messagelist-message--own'
                : '',
            props.ml.message_info_open === props.message
                ? 'kiwi-messagelist-message--info-open'
                : '',
            props.ml.message_info_open && props.ml.message_info_open !== props.message
                ? 'kiwi-messagelist-message--blur'
                : '',
            (props.message.user && props.m().userMode(props.message.user))
                ? `kiwi-messagelist-message--user-mode-${props.m().userMode(props.message.user)}`
                : '',
            data.staticClass,
        ]"
        :data-message-id="props.message.id"
        :data-nick="(props.message.nick || '').toLowerCase()"
        class="kiwi-messagelist-message kiwi-messagelist-message--text"
        @click="props.ml.onMessageClick($event, props.message, true)"
        @dblclick="props.ml.onMessageDblClick($event, props.message)"
    >
        <div>
            <span
                v-if="props.ml.bufferSetting('show_timestamps')"
                class="kiwi-messagelist-time"
            >
                {{ props.ml.formatTime(props.message.time) }}
            </span>
            <span
                :style="{ color: props.ml.userColour(props.message.user) }"
                :class="[
                    'kiwi-messagelist-nick',
                    (props.message.user && props.m().userMode(props.message.user))
                        ? `kiwi-messagelist-nick--mode-${props.m().userMode(props.message.user)}`
                        : '',
                ]"
                :data-nick="(props.message.nick || '').toLowerCase()"
                @mouseover="props.ml.hover_nick = props.message.nick.toLowerCase();"
                @mouseout="props.ml.hover_nick = '';"
            >
                <span class="kiwi-messagelist-nick--prefix">
                    {{ props.message.user ? props.m().userModePrefix(props.message.user) : '' }}
                </span>
                <a :data-nick="(props.message.nick || '').toLowerCase()">
                    {{ props.m().displayNick() }}
                </a>
            </span>
            <div
                v-if="props.message.bodyTemplate
                    && props.message.bodyTemplate.$el
                    && props.ml.isTemplateVue(props.message.bodyTemplate)"
                v-rawElement="props.message.bodyTemplate.$el"
                class="kiwi-messagelist-body"
            />
            <component
                :is="props.message.bodyTemplate"
                v-else-if="props.message.bodyTemplate"
                v-bind="props.message.bodyTemplateProps"
                :buffer="props.ml.buffer"
                :message="props.message"
                :idx="props.idx"
                :ml="props.ml"
                class="kiwi-messagelist-body"
            />
            <div
                v-else
                class="kiwi-messagelist-body"
            >
                <i
                    v-if="props.m().getMessageIcon(props.message)"
                    :class="props.m().getMessageIcon(props.message)"
                    class="fa kiwi-messagelist-message-icon"
                    aria-hidden="true"
                />
                <span v-html="props.ml.formatMessage(props.message)" />
            </div>
        </div>

        <component
            :is="injections.components.MessageInfo"
            v-if="props.ml.message_info_open === props.message"
            :message="props.message"
            :buffer="props.ml.buffer"
            @close="props.ml.toggleMessageInfo()"
        />

        <component
            :is="injections.components.MessageReactions"
            v-if="props.message.hasReactions()"
            :message="props.message"
            :buffer="props.ml.buffer"
        />

        <div v-if="props.m().showReactionBar(props.message)" class="kiwi-messagelist-reactionbar">
            <span
                v-for="reaction in props.m().getReactions()"
                :key="reaction.name"
                :title="reaction.name"
                :class="[
                    'kiwi-messagelist-reactionbar-emoji',
                    props.m().hasUserReacted(props.message) ? 'kiwi-messagelist-reactionbar-emoji--disabled' : '',
                    props.m().isUserReaction(props.message, reaction.emoji) ? 'kiwi-messagelist-reactionbar-emoji--selected' : '',
                ]"
                @click.stop="props.m().sendReaction(props.message, reaction.emoji)"
            >
                <component
                    :is="injections.components.TwemojiImg"
                    :twemoji="reaction.twemoji"
                    :emoji="reaction.emoji"
                    :title="reaction.name"
                />
            </span>
        </div>

        <div v-if="props.message.embed.payload && props.ml.shouldAutoEmbed">
            <component
                :is="injections.components.MediaViewer"
                :url="props.message.embed.payload"
                :show-pin="true"
                @close="props.message.embed.payload = ''"
                @pin="props.ml.openEmbedInPreview(props.message)"
            />
        </div>
    </div>
</template>

<script>

import { REACTIONS } from '@/libs/ReactionMiddleware';
import MediaViewer from './MediaViewer';
import MessageInfo from './MessageInfo';
import MessageReactions from './MessageReactions';
import TwemojiImg from './TwemojiImg';

const methods = {
    props: {},
    displayNick() {
        let props = this.props;
        let nick = props.message.nick;

        // For server buffers with no nick, show the server name
        if (!nick && props.ml.buffer.isServer()) {
            let network = props.ml.buffer.getNetwork();
            nick = (network.ircClient && network.ircClient.network.name)
                || network.name
                || 'server';
        }

        let suffix = nick ? ':' : '';
        return nick + suffix;
    },
    userMode(user) {
        let props = this.props;
        return props.ml.buffer.userMode(user);
    },
    userModePrefix(user) {
        let props = this.props;
        return props.ml.buffer.userModePrefix(user);
    },
    getMessageIcon(message) {
        // Returns Font Awesome icon classes based on message type
        let type = message.type;
        let typeExtra = message.type_extra || '';

        if (type === 'traffic') {
            if (typeExtra.startsWith('join')) {
                return 'fa-sign-in kiwi-messagelist-message-icon--join';
            }
            if (typeExtra.startsWith('part') || typeExtra.startsWith('quit')) {
                return 'fa-sign-out kiwi-messagelist-message-icon--part';
            }
            if (typeExtra.startsWith('kick')) {
                return 'fa-ban kiwi-messagelist-message-icon--kick';
            }
        }

        if (type === 'mode') {
            return 'fa-info-circle kiwi-messagelist-message-icon--mode';
        }

        if (type === 'nick') {
            return 'fa-info-circle kiwi-messagelist-message-icon--nick';
        }

        if (type === 'topic') {
            return 'fa-info-circle kiwi-messagelist-message-icon--topic';
        }

        if (type === 'error') {
            return 'fa-exclamation-triangle kiwi-messagelist-message-icon--error';
        }

        return null;
    },
    isLastInCluster() {
        let props = this.props;
        let ml = props.ml;
        let idx = props.idx;
        let message = props.message;
        let nextMessage = ml.filteredMessages[idx + 1];

        if (!nextMessage) {
            return true;
        }
        if (nextMessage.nick !== message.nick) {
            return true;
        }
        if (nextMessage.time - message.time >= 60000) {
            return true;
        }
        if (nextMessage.type !== message.type) {
            return true;
        }
        return false;
    },
    canReact(message) {
        let props = this.props;
        let types = ['privmsg', 'action'];
        if (types.indexOf(message.type) === -1) {
            return false;
        }
        if (!message.id) {
            return false;
        }
        let ourNick = props.ml.buffer.getNetwork().nick;
        if (message.nick && message.nick.toLowerCase() === ourNick.toLowerCase()) {
            return false;
        }
        let client = props.ml.buffer.getNetwork().ircClient;
        return client.network.cap.isEnabled('draft/react');
    },
    showReactionBar(message) {
        // Hide if user already reacted
        if (this.hasUserReacted(message)) {
            return false;
        }
        return this.isLastInCluster() && this.canReact(message);
    },
    getReactions() {
        return REACTIONS;
    },
    hasUserReacted(message) {
        let props = this.props;
        let nick = props.ml.buffer.getNetwork().nick;
        return !!message.getUserReaction(nick);
    },
    isUserReaction(message, emoji) {
        let props = this.props;
        let nick = props.ml.buffer.getNetwork().nick;
        return message.getUserReaction(nick) === emoji;
    },
    sendReaction(message, emoji) {
        let props = this.props;
        let network = props.ml.buffer.getNetwork();
        let nick = network.nick;
        if (message.getUserReaction(nick)) {
            return;
        }
        let ircClient = network.ircClient;
        let msgid = message.id;
        if (!msgid) {
            return;
        }
        ircClient.reactions.send(props.ml.buffer.name, msgid, emoji);
        message.addReaction(emoji, nick, Date.now());
    },
};

export default {
    inject: {
        components: {
            default: {
                MessageInfo,
                MessageReactions,
                MediaViewer,
                TwemojiImg,
            },
        },
    },
    props: {
        ml: Object,
        message: Object,
        idx: Number,
        m: {
            default: function m() {
                // vue uses this function to generate the prop. `this`==null Return our own function
                return function n() {
                    // Give our methods some props context before its function is called.
                    // This is only safe because the function on the methods object is called on
                    // the same js tick
                    methods.props = this;
                    return methods;
                };
            },
        },
    },
};
</script>

<style lang="less" scoped>

.kiwi-messagelist-message--text {
    position: relative;
    padding: 4px 10px;
    margin: 0;
    text-align: left;
}

//Hide the timestamp unless the user hovers over the message in question
.kiwi-messagelist-message--text .kiwi-messagelist-time {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0 10px;
    display: none;
    opacity: 0.8;
}

//display timestamp when hovering over the message
.kiwi-messagelist-message--text:hover .kiwi-messagelist-time {
    display: block;
    border-radius: 5px 0 0 5px;
}

// Hide the unread message seperator
.kiwi-messagelist-message--text .kiwi-messagelist-seperator {
    display: none;
}

.kiwi-messagelist-message--text .kiwi-messagelist-nick {
    display: inline;
    text-align: left;
    margin-right: 2px;
    padding: 0;
}

.kiwi-messagelist-message--text .kiwi-messagelist-nick:hover {
    max-width: none;
    width: auto;
}

.kiwi-messagelist-message--text .kiwi-messagelist-body {
    display: inline;
    padding: 0;
    white-space: pre-wrap;
}

.kiwi-messagelist-message--text .kiwi-messagelist-body a {
    word-break: break-all;
}

.kiwi-messagelist-message--text .kiwi-messagelist-message-privmsg:hover,
.kiwi-messagelist-message--text .kiwi-messagelist-message-action:hover,
.kiwi-messagelist-message--text .kiwi-messagelist-message-notice:hover {
    cursor: pointer;
}

//Channel topic
.kiwi-messagelist-message--text.kiwi-messagelist-message-topic {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    margin: 10px 0;
}

.kiwi-messagelist-message--text.kiwi-messagelist-message-topic .kiwi-messagelist-body {
    padding-right: 0;
    max-width: 95%;
    margin-left: 20px;
}

.kiwi-messagelist-message--text.kiwi-messagelist-message--unread {
    opacity: 1;
}

.kiwi-messagelist-message--text .kiwi-messagelist-message-traffic .kiwi-messagelist-nick {
    display: none;
}

.kiwi-messagelist-item:last-of-type {
    margin-bottom: 5px;
}

.kiwi-messagelist-message--text.kiwi-messagelist-message-nick .kiwi-messagelist-nick {
    display: none;
}

@media screen and (max-width: 700px) {
    .kiwi-messagelist-message--text.kiwi-messagelist-message-traffic,
    .kiwi-messagelist-message--text.kiwi-messagelist-message-nick .kiwi-messagelist-body,
    .kiwi-messagelist-message--text .kiwi-messagelist-body {
        padding-right: 0;
    }
}

/* Reaction bar - shown at end of message cluster */
.kiwi-messagelist-message--text .kiwi-messagelist-reactionbar {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    padding: 4px 0;
}

.kiwi-messagelist-message--text .kiwi-messagelist-reactionbar-emoji {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 6px;
    border-radius: 6px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.15s, background-color 0.15s, transform 0.1s;
}

.kiwi-messagelist-message--text .kiwi-messagelist-reactionbar-emoji:hover:not(.kiwi-messagelist-reactionbar-emoji--disabled) {
    opacity: 1;
    background-color: rgba(128, 128, 128, 0.2);
    transform: scale(1.15);
}

.kiwi-messagelist-message--text .kiwi-messagelist-reactionbar-emoji--selected {
    opacity: 1;
    background-color: rgba(66, 133, 244, 0.3);
}

.kiwi-messagelist-message--text .kiwi-messagelist-reactionbar-emoji--disabled {
    cursor: not-allowed;
}

.kiwi-messagelist-message--text .kiwi-messagelist-reactionbar-emoji--disabled:not(.kiwi-messagelist-reactionbar-emoji--selected) {
    filter: grayscale(0.8);
    opacity: 0.4;
}

.kiwi-messagelist-message--text .kiwi-messagelist-reactionbar .kiwi-twemoji {
    height: 1.2em;
    width: 1.2em;
}

</style>
