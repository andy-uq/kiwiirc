<template>
    <div
        :class="[is_usermenu_open ? 'kiwi-statebrowser-usermenu--open' : '']"
        class="kiwi-statebrowser-usermenu"
    >
        <div
            :class="[isConnected
                ? 'kiwi-statebrowser-usermenu-avatar--connected'
                : 'kiwi-statebrowser-usermenu-avatar--disconnected',
            ]"
            class="kiwi-statebrowser-usermenu-avatar"
            @click="is_usermenu_open = !is_usermenu_open"
        >
            <img
                :src="networkAvatarUrl"
                :alt="networkName"
                class="kiwi-statebrowser-network-avatar-img"
            >
        </div>
        <div v-if="is_usermenu_open" class="kiwi-statebrowser-usermenu-body">
            <p> {{ $t('state_remembered') }} </p>
            <a class="u-link" @click="clickForget">{{ $t('state_forget') }}</a>
            <div class="kiwi-statebrowser-usermenu-close" @click="is_usermenu_open = false">
                <i class="fa fa-times" aria-hidden="true" />
            </div>
        </div>
        <div v-else class="kiwi-statebrowser-usermenu-network">
            {{ networkName }}
        </div>
    </div>
</template>
<script>

'kiwi public';

import * as TextFormatting from '@/helpers/TextFormatting';

export default {
    components: {
    },
    props: ['network'],
    data() {
        return {
            is_usermenu_open: false,
        };
    },
    computed: {
        networkName() {
            let name = TextFormatting.t('no_network');
            if (this.network) {
                name = this.network.name;
            }
            return name;
        },
        networkAvatarUrl() {
            if (this.network && this.network.name) {
                // Convert network name to lowercase, replace spaces with underscores
                const safeName = this.network.name.toLowerCase().replace(/\s+/g, '_');
                return `static/avatars/${safeName}_lg.png`;
            }
            // Fallback to a default image
            return 'static/avatars/default_lg.png';
        },
        isConnected() {
            return this.network && this.network.state === 'connected';
        },
    },
    methods: {
        clickForget() {
            let msg = 'This will delete all stored networks and start fresh. Are you sure?';
            /* eslint-disable no-restricted-globals, no-alert */
            let confirmed = confirm(msg);
            if (!confirmed) {
                return;
            }

            this.$state.persistence.forgetState();
            window.location.reload();
        },
    },
};

</script>

<style>

.kiwi-statebrowser-usermenu {
    width: 100%;
    padding-bottom: 0;
    padding-top: 34px;
}

.kiwi-statebrowser-usermenu-network {
    padding: 0 0 10px 0;
    cursor: default;
}

.kiwi-statebrowser-usermenu-close {
    position: absolute;
    top: 0;
    right: 0;
    width: 32px;
    line-height: 32px;
    text-align: center;
    cursor: pointer;
    font-weight: 800;
    font-size: 20px;
    opacity: 0.8;
    border-bottom-left-radius: 14px;
    transition: background 0.2s, opacity 0.2s;
}

.kiwi-statebrowser-usermenu-avatar {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 0 auto 10px auto;
    transition: background 0.2s;
}

.kiwi-statebrowser-network-avatar-img {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    object-fit: cover;
    transition: filter 0.3s, opacity 0.3s;
}

/* Dimming for disconnected state */
.kiwi-statebrowser-usermenu-avatar--disconnected .kiwi-statebrowser-network-avatar-img {
    filter: grayscale(1) brightness(0.7);
    opacity: 0.5;
}

.kiwi-statebrowser-usermenu-body {
    width: 100%;
    box-sizing: border-box;
    padding: 0 10px;
    font-size: 0.8em;
    margin-bottom: 10px;
}

.kiwi-statebrowser-usermenu-body p {
    margin-bottom: 0;
}

@media screen and (max-width: 769px) {
    .kiwi-statebrowser-usermenu-close {
        display: none;
    }
}
</style>
