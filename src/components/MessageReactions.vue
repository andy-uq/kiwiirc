<template>
    <div v-if="hasReactions" class="kiwi-message-reactions">
        <div
            v-for="(users, emoji) in message.reactions"
            :key="emoji"
            :title="getReactionTooltip(emoji, users)"
            :class="[
                'kiwi-message-reactions-badge',
                hasUserReacted(emoji) ? 'kiwi-message-reactions-badge--own' : '',
            ]"
        >
            <TwemojiImg
                v-if="getTwemojiCode(emoji)"
                :twemoji="getTwemojiCode(emoji)"
                :emoji="emoji"
                class="kiwi-message-reactions-emoji"
            />
            <span v-else class="kiwi-message-reactions-emoji">{{ emoji }}</span>
            <span class="kiwi-message-reactions-count">{{ users.length }}</span>
        </div>
    </div>
</template>

<script>
'kiwi public';

import { getReactionTwemoji } from '@/libs/ReactionMiddleware';
import TwemojiImg from './TwemojiImg';

export default {
    components: {
        TwemojiImg,
    },
    props: {
        message: {
            type: Object,
            required: true,
        },
        buffer: {
            type: Object,
            required: true,
        },
    },
    computed: {
        hasReactions() {
            return this.message.hasReactions();
        },
        ourNick() {
            return this.buffer.getNetwork().nick;
        },
    },
    methods: {
        hasUserReacted(emoji) {
            let userReaction = this.message.getUserReaction(this.ourNick);
            return userReaction === emoji;
        },
        getReactionTooltip(emoji, users) {
            let nicks = users.map((u) => u.nick).join(', ');
            return nicks;
        },
        getTwemojiCode(emoji) {
            return getReactionTwemoji(emoji);
        },
    },
};
</script>

<style lang="less">
.kiwi-message-reactions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
    margin-bottom: 4px;
}

.kiwi-message-reactions-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.1);
    font-size: 0.85em;
    cursor: default;
    user-select: none;
}

.kiwi-message-reactions-badge--own {
    background-color: rgba(66, 133, 244, 0.2);
    border: 1px solid rgba(66, 133, 244, 0.4);
}

.kiwi-message-reactions-emoji {
    margin-right: 3px;
}

.kiwi-message-reactions-count {
    font-size: 0.9em;
    opacity: 0.8;
}
</style>
