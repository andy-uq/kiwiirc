<template>
    <div class="kiwi-reactionpicker">
        <div
            v-for="reaction in reactions"
            :key="reaction.name"
            :title="reaction.name"
            :class="[
                'kiwi-reactionpicker-emoji',
                isSelected(reaction.emoji) ? 'kiwi-reactionpicker-emoji--selected' : '',
                hasReacted ? 'kiwi-reactionpicker-emoji--disabled' : '',
            ]"
            @click="onSelect(reaction.emoji)"
        >
            {{ reaction.emoji }}
        </div>
    </div>
</template>

<script>
'kiwi public';

import { REACTIONS } from '@/libs/ReactionMiddleware';

export default {
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
    data() {
        return {
            reactions: REACTIONS,
        };
    },
    computed: {
        ourNick() {
            return this.buffer.getNetwork().nick;
        },
        hasReacted() {
            return !!this.message.getUserReaction(this.ourNick);
        },
        userReaction() {
            return this.message.getUserReaction(this.ourNick);
        },
    },
    methods: {
        isSelected(emoji) {
            return this.userReaction === emoji;
        },
        onSelect(emoji) {
            // Don't allow reaction if user already reacted (no take-backs)
            if (this.hasReacted) {
                return;
            }

            let network = this.buffer.getNetwork();
            let ircClient = network.ircClient;

            // Check if reactions are supported
            if (!ircClient.reactions.isSupported()) {
                // Still allow optimistic UI even if server doesn't advertise support
                // The server might still accept it
            }

            // Get the message ID
            let msgid = this.message.id;
            if (!msgid) {
                return;
            }

            // Send the reaction via IRC
            ircClient.reactions.send(this.buffer.name, msgid, emoji);

            // Optimistic UI - add reaction locally immediately
            this.message.addReaction(emoji, this.ourNick, Date.now());

            // Emit event to close the picker
            this.$emit('reacted', emoji);
        },
    },
};
</script>

<style lang="less">
.kiwi-reactionpicker {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px;
    background-color: var(--kiwi-reactionpicker-bg, #fff);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.kiwi-reactionpicker-emoji {
    font-size: 1.5em;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.15s, transform 0.1s;
    user-select: none;
}

.kiwi-reactionpicker-emoji:hover:not(.kiwi-reactionpicker-emoji--disabled) {
    background-color: rgba(0, 0, 0, 0.1);
    transform: scale(1.1);
}

.kiwi-reactionpicker-emoji--selected {
    background-color: rgba(66, 133, 244, 0.2);
}

.kiwi-reactionpicker-emoji--disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.kiwi-reactionpicker-emoji--disabled:not(.kiwi-reactionpicker-emoji--selected) {
    filter: grayscale(1);
}
</style>
