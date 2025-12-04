<template>
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="kiwi-avatar">
        <g
            v-bind="awayStatus.vbind"
            clip-path="url(#kiwi-avatar-clip)"
        >
            <rect
                v-if="avatar.showBackground"
                width="100"
                height="100"
                class="kiwi-avatar-background"
                :style="avatar.backgroundStyle"
            />
            <image
                v-if="avatar.hasImage"
                v-bind="{ ...avatar[avatar.sizeKey[size]].vbind }"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMid slice"
                loading="lazy"
                class="kiwi-avatar-image"
                @error="avatar[avatar.sizeKey[size]].setFailed()"
            />
            <text
                v-else
                :font-size="avatar.initials.length === 1 ? '64px' : '44px'"
                x="50"
                y="50"
                dy="0.36em"
                text-anchor="middle"
                class="kiwi-avatar-initials"
            >{{ avatar.initials }}</text>
        </g>
        <!-- Away status: clock icon -->
        <g
            v-if="awayStatus.show && user.isAway() && !user.isOffline()"
            :transform="awayStatus.transform"
            class="kiwi-avatar-status kiwi-avatar-status--away"
            @click.stop="toggleAway"
        >
            <circle r="14" cx="50" cy="0" class="kiwi-avatar-status-bg" />
            <g transform="translate(41, -9) scale(0.75)">
                <!-- Clock icon -->
                <circle cx="12" cy="12" r="10" fill="none" stroke="white" stroke-width="2" />
                <path d="M12 6v6l4 2" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" />
            </g>
            <title v-if="allowToggle">{{ $t('toggle_away') }}</title>
        </g>
        <!-- Offline status: broken plug/disconnect icon -->
        <g
            v-if="awayStatus.show && user.isOffline()"
            :transform="awayStatus.transform"
            class="kiwi-avatar-status kiwi-avatar-status--offline"
        >
            <circle r="14" cx="50" cy="0" class="kiwi-avatar-status-bg" />
            <g transform="translate(41, -9) scale(0.75)">
                <!-- Broken connection / disconnect icon -->
                <path
                    d="M18.36 5.64l-1.41 1.41 2.12 2.12-2.83 2.83-2.12-2.12-1.41 1.41 2.12 2.12-1.41 1.41-2.12-2.12-2.83 2.83 2.12 2.12-1.41 1.41"
                    fill="none"
                    stroke="white"
                    stroke-width="2"
                    stroke-linecap="round"
                />
                <path
                    d="M5.64 18.36l1.41-1.41"
                    fill="none"
                    stroke="white"
                    stroke-width="2"
                    stroke-linecap="round"
                />
            </g>
        </g>
    </svg>
</template>

<script>
'kiwi public';

import { computed } from 'vue';

import getState from '@/libs/state';
import { getAvatarTransform } from './UserAvatarCommon';

</script>

<script setup>
const state = getState();
const props = defineProps({
    user: {
        type: Object,
        default: null,
    },
    message: {
        type: Object,
        default: null,
    },
    network: {
        type: Object,
        default: null,
    },
    size: {
        type: String,
        default: 'small',
    },
    forceShowStatus: {
        type: Boolean,
        default: false,
    },
    allowToggle: {
        type: Boolean,
        default: false,
    },
});

const getSizeObj = (size) => ({
    url: props.user.avatar[size],
    vbind: {
        'href': props.user.avatar[size],
        'xlink:href': props.user.avatar[size],
    },
    setFailed: () => {
        const avatar = props.user.avatar;
        const failedAvatar = avatar[size];
        avatar[size] = '';
        if (!avatar.small && !avatar.large) {
            state.$emit('user.avatar.failed', {
                user: props.user,
                network: props.network,
                failed: failedAvatar,
            });
        }
    },
});

const shouldShowStatus = () => {
    if (!props.network || !props.user) {
        return false;
    }

    if (props.forceShowStatus) {
        return true;
    }

    if (props.network.state !== 'connected' || !state.setting('showAwayStatusIndicators')) {
        return false;
    }

    const awayNotifyEnabled = props.network.ircClient.network.cap.isEnabled('away-notify');
    return state.setting('buffers.who_loop') || awayNotifyEnabled;
};

const awayStatus = computed(() => {
    const show = shouldShowStatus();
    const isAwayOrOffline = props.user && (props.user.isAway() || props.user.isOffline());

    const vbind = {};
    // Only apply mask when showing away/offline indicator (not for online users)
    if (show && isAwayOrOffline) {
        vbind.mask = 'url(#kiwi-avatar-mask)';
    }

    const transform = getAvatarTransform();

    return {
        show,
        vbind,
        transform,
    };
});

const avatar = computed(() => {
    let initialsLength = state.setting('avatars.initials_length');
    if (!initialsLength || initialsLength < 1) {
        initialsLength = 1;
    }
    if (initialsLength > 2) {
        initialsLength = 2;
    }

    const nick = props.message?.nick || props.user?.nick || 'User';
    const initials = nick.substring(0, initialsLength).toUpperCase();
    const hasImage = !!(props.user && (props.user.avatar.small || props.user.avatar.large));

    const showBackground = !hasImage || state.setting('avatars.show_image_background');
    const backgroundStyle = {};

    const avatars = {
        hasImage,
        initials,
        showBackground,
        backgroundStyle,
        sizeKey: {},
    };

    if (props.user) {
        backgroundStyle.fill = props.user.getColour();
    } else {
        return avatars;
    }

    if (props.user.avatar.small) {
        avatars.small = getSizeObj('small');
        avatars.sizeKey.small = 'small';
        if (!props.user.avatar.large) {
            avatars.sizeKey.large = 'small';
        }
    }

    if (props.user.avatar.large) {
        avatars.large = getSizeObj('large');
        avatars.sizeKey.large = 'large';
        if (!props.user.avatar.small) {
            avatars.sizeKey.small = 'large';
        }
    }

    return avatars;
});

const toggleAway = () => {
    if (!props.allowToggle || props.user.away === 'offline') {
        return;
    }
    const isAway = props.user.isAway();
    props.network.ircClient.raw('AWAY', isAway ? '' : 'Currently away');
};
</script>

<style lang="less">
@font-face {
    font-family: Roboto;
    font-style: normal;
    font-weight: 900;
    src: url('../res/fonts/Roboto-Black.woff2') format('woff2'),
         url('../res/fonts/Roboto-Black.woff') format('woff')
         url('../res/fonts/Roboto-Black.ttf') format('truetype');
    font-display: auto;
}

.kiwi-avatar {
    font-size: 0;
    line-height: 0;
    user-select: none;
}

.kiwi-avatar-status {
    transition: opacity 0.3s ease;
}

.kiwi-avatar-status-bg {
    transition: fill 0.5s ease;
}

.kiwi-avatar-status--away {
    cursor: pointer;

    .kiwi-avatar-status-bg {
        fill: var(--brand-warning, #f0ad4e);
    }
}

.kiwi-avatar-status--offline .kiwi-avatar-status-bg {
    fill: var(--brand-error, #d9534f);
}

.kiwi-avatar-initials {
    font-family: Roboto, Arial, sans-serif;
    font-weight: 900;
}
</style>
