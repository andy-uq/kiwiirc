<template functional>
    <div
        :class="[
            props.m().isRepeat()
                ? 'kiwi-messagelist-message--authorrepeat'
                : 'kiwi-messagelist-message--authorfirst',
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
        class="kiwi-messagelist-message kiwi-messagelist-message--modern"
        @click="props.ml.onMessageClick($event, props.message, true)"
        @dblclick="props.ml.onMessageDblClick($event, props.message)"
    >
        <div class="kiwi-messagelist-modern-left">
            <template v-if="props.m().displayAvatar(props.message)">
                <component
                    :is="injections.components.UserAvatar"
                    :data-nick="props.message.nick"
                    :user="props.message.user"
                    :network="props.m().getNetwork()"
                    :message="props.message"
                />
            </template>
        </div>
        <div class="kiwi-messagelist-modern-right">
            <div class="kiwi-messagelist-top">
                <a
                    v-if="props.message.nick"
                    :style="{ color: props.ml.userColour(props.message.user) }"
                    :class="[
                        'kiwi-messagelist-nick',
                        props.message.user && props.m().userMode(props.message.user)
                            ? `kiwi-messagelist-nick--mode-${props.m().userMode(props.message.user)}`
                            : '',
                    ]"
                    :data-nick="(props.message.nick).toLowerCase()"
                    @mouseover="props.ml.hover_nick = props.message.nick.toLowerCase();"
                    @mouseout="props.ml.hover_nick = '';"
                >
                    <span class="kiwi-messagelist-nick-prefix">{{
                        props.message.user
                            ? props.m().userModePrefix(props.message.user)
                            : ''
                    }}</span>{{ props.message.nick }}
                </a>
                <div
                    v-if="props.m().showRealName()"
                    class="kiwi-messagelist-realname"
                    @click="props.ml.openUserBox(props.message.nick)"
                    @mouseover="props.ml.hover_nick = props.message.nick.toLowerCase();"
                    @mouseout="props.ml.hover_nick = '';"
                >
                    {{ props.message.user.realname }}
                </div>
                <div
                    v-if="props.m().isMessage(props.message)
                        && props.ml.bufferSetting('show_timestamps')"
                    :title="props.ml.formatTimeFull(props.message.time)"
                    class="kiwi-messagelist-time"
                >
                    {{ props.ml.formatTime(props.message.time) }}
                </div>
            </div>
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
    </div>
</template>

<script>
'kiwi public';

// eslint-plugin-vue's max-len rule reads the entire file, including the CSS. so we can't use this
// here as some of the rules cannot be broken up any smaller
/* eslint-disable max-len */

import { urlRegex } from '@/helpers/TextFormatting';
import { REACTIONS } from '@/libs/ReactionMiddleware';
import MessageInfo from './MessageInfo';
import MessageReactions from './MessageReactions';
import AwayStatusIndicator from './AwayStatusIndicator';
import UserAvatar from './UserAvatar';
import MediaViewer from './MediaViewer';
import TwemojiImg from './TwemojiImg';

const methods = {
    props: {},
    showRealName() {
        let props = this.props;

        // Showing realname is not enabled
        if (!props.ml.buffer.setting('show_realnames')) {
            return false;
        }

        // Server does not support extended-join so realname would be inconsistent
        let client = props.ml.buffer.getNetwork().ircClient;
        if (!client.network.cap.isEnabled('extended-join')) {
            return false;
        }

        // We dont have a user or users realname
        if (!props.message.user || !props.message.user.realname) {
            return false;
        }

        // No point showing the realname if it's the same as the nick
        if (props.message.user.nick.toLowerCase() === props.message.user.realname.toLowerCase()) {
            return false;
        }

        // If the realname contains a URL it's most likely a clients website
        if (urlRegex.test(props.message.user.realname)) {
            return false;
        }

        return true;
    },
    getNetwork() {
        let props = this.props;
        return props.ml.buffer.getNetwork();
    },
    isRepeat() {
        let props = this.props;
        let ml = props.ml;
        let idx = props.idx;
        let message = props.message;
        let prevMessage = ml.filteredMessages[idx - 1];

        return !!prevMessage &&
            prevMessage.nick === message.nick &&
            message.time - prevMessage.time < 60000 &&
            prevMessage.type !== 'traffic' &&
            message.type !== 'traffic' &&
            message.type === prevMessage.type &&
            message.day_num === prevMessage.day_num;
    },
    isHoveringOverMessage(message) {
        let props = this.props;
        return message.nick && message.nick.toLowerCase() === props.ml.hover_nick.toLowerCase();
    },
    isMessage(message) {
        let types = ['privmsg', 'action', 'notice', 'message'];
        return types.indexOf(message.type) > -1;
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
    displayAvatar(message) {
        let props = this.props;
        // if there is no user attached hide the avatar
        if (!message.user && !props.ml.buffer.state.setting('avatars.show_without_user')) {
            return false;
        }

        // if its not a message hide the avatar
        if (!this.isMessage(message)) {
            return false;
        }

        // dont show avatars in server or special buffers
        if (props.ml.buffer.isServer() || props.ml.buffer.isSpecial()) {
            return false;
        }

        // dont show avatar if its a repeat of the same user
        if (this.isRepeat()) {
            return false;
        }

        return true;
    },
    userMode(user) {
        let props = this.props;
        return props.ml.buffer.userMode(user);
    },
    userModePrefix(user) {
        let props = this.props;
        return props.ml.buffer.userModePrefix(user);
    },
    isLastInCluster() {
        // Check if this is the last message in a cluster from the same author
        let props = this.props;
        let ml = props.ml;
        let idx = props.idx;
        let message = props.message;
        let nextMessage = ml.filteredMessages[idx + 1];

        // If no next message, this is the last message
        if (!nextMessage) {
            return true;
        }

        // If next message is from a different nick, this is the end of the cluster
        if (nextMessage.nick !== message.nick) {
            return true;
        }

        // If next message is more than 60 seconds later, consider it a new cluster
        if (nextMessage.time - message.time >= 60000) {
            return true;
        }

        // If message types differ (e.g., traffic vs privmsg), new cluster
        if (nextMessage.type !== message.type) {
            return true;
        }

        // If on different days, new cluster
        if (nextMessage.day_num !== message.day_num) {
            return true;
        }

        return false;
    },
    canReact(message) {
        let props = this.props;
        // Only allow reactions on regular messages (privmsg, action)
        let types = ['privmsg', 'action'];
        if (types.indexOf(message.type) === -1) {
            return false;
        }
        // Need a message ID to react to
        if (!message.id) {
            return false;
        }
        // Don't allow reacting to your own messages
        let ourNick = props.ml.buffer.getNetwork().nick;
        if (message.nick && message.nick.toLowerCase() === ourNick.toLowerCase()) {
            return false;
        }
        // Check if the server supports reactions
        let client = props.ml.buffer.getNetwork().ircClient;
        return client.network.cap.isEnabled('draft/react');
    },
    showReactionBar(message) {
        // Hide if user already reacted
        if (this.hasUserReacted(message)) {
            return false;
        }
        // Show reaction bar only on the last message of a cluster that can be reacted to
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

        // Don't allow if user already reacted
        if (message.getUserReaction(nick)) {
            return;
        }

        let ircClient = network.ircClient;
        let msgid = message.id;
        if (!msgid) {
            return;
        }

        // Send the reaction via IRC
        ircClient.reactions.send(props.ml.buffer.name, msgid, emoji);

        // Optimistic UI - add reaction locally immediately
        message.addReaction(emoji, nick, Date.now());
    },
};

export default {
    inject: {
        components: {
            default: {
                UserAvatar,
                MessageInfo,
                MessageReactions,
                AwayStatusIndicator,
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

.kiwi-messagelist-message--modern {
    border-left: 7px solid transparent;
    display: flex;
    margin: 0 0 0 20px;
    margin-left: 0;
    transition: border-colour 0.2s, background-color 0.2s;
}

.kiwi-messagelist-modern-left {
    user-select: none;
    position: relative;
    display: flex;
    width: 50px;
}

.kiwi-messagelist-awaystatus {
    width: 10px;
    top: 4px;
    right: 2px;
    height: 10px;
    position: absolute;
}

.kiwi-messagelist-message--modern .kiwi-avatar {
    height: 40px;
    width: 40px;
    cursor: pointer;
}

.kiwi-messagelist-message--modern.kiwi-messagelist-message--authorfirst {
    padding-top: 10px;
}

.kiwi-messagelist-message--modern.kiwi-messagelist-message--authorrepeat {
    border-top: none;
}

.kiwi-messagelist-message--modern.kiwi-messagelist-message--authorrepeat .kiwi-messagelist-modern-right {
    padding-top: 0;
}

.kiwi-messagelist-message--modern.kiwi-messagelist-message-topic {
    margin: 20px 20px 20px 20px;
    padding: 10px 20px;
    width: auto;
    box-sizing: border-box;
}

.kiwi-messagelist-message--modern.kiwi-messagelist-message-topic .kiwi-messagelist-modern-left {
    display: none;
}

.kiwi-messagelist-message--modern.kiwi-messagelist-message--authorrepeat .kiwi-avatar {
    display: none;
}

.kiwi-messagelist-message--modern.kiwi-messagelist-message--authorrepeat .kiwi-messagelist-top {
    display: none;
}

.kiwi-messagelist-message--modern .kiwi-messagelist-body {
    white-space: pre-wrap;
    word-wrap: break-word;
    display: block;
    margin-left: 0;
    margin-bottom: 10px;
}

.kiwi-messagelist-message--modern .kiwi-messagelist-body a {
    word-break: break-all;
}

.kiwi-messagelist-message--modern .kiwi-messagelist-modern-right {
    margin-left: 5px;
    padding-top: 0;
    width: 100%;
    overflow: hidden;
}

.kiwi-messagelist-message--modern .kiwi-messagelist-top > div {
    margin-right: 10px;
    padding: 0;
    display: inline-block;
}

.kiwi-messagelist-message--modern .kiwi-messagelist-realname {
    cursor: pointer;
}

.kiwi-messagelist-message--modern .kiwi-messagelist-time {
    font-size: 0.8em;
    font-weight: 400;
    opacity: 0.6;
}

.kiwi-messagelist-message--modern .kiwi-messagelist-nick {
    padding: 0;
    margin-right: 10px;
}

.kiwi-messagelist-message-traffic .kiwi-messagelist-body {
    margin-bottom: 0;
}

.kiwi-messagelist-message-traffic .kiwi-messagelist-modern-left,
.kiwi-messagelist-message-traffic .kiwi-messagelist-top {
    display: none;
}

.kiwi-messagelist-message--modern.kiwi-messagelist-message-traffic {
    margin-right: 0;
    padding-left: 60px;
}

.kiwi-messagelist-message-error {
    padding: 10px 0;
    font-weight: 600;
    line-height: normal;
}

.kiwi-messagelist-message-error .kiwi-messagelist-top {
    display: none;
}

.kiwi-messagelist-message-error .kiwi-messagelist-body {
    margin-bottom: 0;
}

@media screen and (max-width: 769px) {
    .kiwi-messagelist-message--modern .kiwi-messagelist-modern-left {
        width: 10px;
    }

    .kiwi-messagelist-message--modern.kiwi-messagelist-message-privmsg .kiwi-messagelist-modern-left,
    .kiwi-messagelist-message-notice .kiwi-messagelist-modern-left {
        display: none;
    }

    .kiwi-messagelist-message--modern .kiwi-messagelist-modern-right {
        margin-left: 0;
    }

    .kiwi-messagelist-message--modern {
        margin: 0;
    }

    .kiwi-messagelist-message-action .kiwi-messagelist-modern-left {
        display: none;
    }

    .kiwi-messagelist-message--modern .kiwi-avatar {
        display: none;
    }

    .kiwi-messagelist-message--modern.kiwi-messagelist-message-traffic {
        padding-left: 10px;
    }

    .kiwi-messagelist-message--modern.kiwi-messagelist-message-topic {
        margin: 0 15px 20px 15px;
    }
}

/* Reaction bar - shown at end of message cluster */
.kiwi-messagelist-message--modern .kiwi-messagelist-reactionbar {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    padding: 4px 0;
    margin-top: 4px;
}

.kiwi-messagelist-message--modern .kiwi-messagelist-reactionbar-emoji {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 6px;
    border-radius: 6px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.15s, background-color 0.15s, transform 0.1s;
}

.kiwi-messagelist-message--modern .kiwi-messagelist-reactionbar-emoji:hover:not(.kiwi-messagelist-reactionbar-emoji--disabled) {
    opacity: 1;
    background-color: rgba(128, 128, 128, 0.2);
    transform: scale(1.15);
}

.kiwi-messagelist-message--modern .kiwi-messagelist-reactionbar-emoji--selected {
    opacity: 1;
    background-color: rgba(66, 133, 244, 0.3);
}

.kiwi-messagelist-message--modern .kiwi-messagelist-reactionbar-emoji--disabled {
    cursor: not-allowed;
}

.kiwi-messagelist-message--modern .kiwi-messagelist-reactionbar-emoji--disabled:not(.kiwi-messagelist-reactionbar-emoji--selected) {
    filter: grayscale(0.8);
    opacity: 0.4;
}

.kiwi-messagelist-message--modern .kiwi-messagelist-reactionbar .kiwi-twemoji {
    height: 1.2em;
    width: 1.2em;
}

</style>
